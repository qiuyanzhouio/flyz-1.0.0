from typing import Any, Generic, Optional, Type, TypeVar

from sqlalchemy import and_, func, select
from sqlalchemy.orm import Session

from application.core.base.model import BaseModel

ModelType = TypeVar("ModelType", bound=BaseModel)


class BaseRepository(Generic[ModelType]):
    """
    通用数据访问层(Repository)。

    只负责 SQL 层面的 CRUD,不含业务规则。
    子类用法:
        class UserRepository(BaseRepository[User]):
            model = User
    """

    model: Type[ModelType]

    def __init__(self, db: Session):
        self.db = db

    # ============================================================
    # 内部工具
    # ============================================================

    def _where(self, filters: Optional[list[Any]] = None) -> list:
        """拼 where 子句:用户条件 + 自动追加软删除过滤。"""
        where_clause = list(filters or [])
        if hasattr(self.model, "is_deleted"):
            where_clause.append(self.model.is_deleted.is_(False))
        return where_clause

    # ============================================================
    # 查询
    # ============================================================

    def get_by_id(self, record_id: int) -> Optional[ModelType]:
        """按主键查询,不存在返回 None。"""
        return self.db.execute(
            select(self.model).where(self.model.id == record_id)
        ).scalar_one_or_none()

    def get_all(
        self,
        *,
        filters: Optional[list[Any]] = None,
        order_by: Optional[Any] = None,
    ) -> list[ModelType]:
        """不分页查全部,默认按主键倒序。"""
        stmt = (
            select(self.model)
            .where(and_(*self._where(filters)))
            .order_by(order_by if order_by is not None else self.model.id.desc())
        )
        return list(self.db.execute(stmt).scalars().all())

    # ============================================================
    # 增删改
    # ============================================================

    def create(self, **kwargs: Any) -> ModelType:
        """新增一条记录,入库后刷新默认值。"""
        instance = self.model(**kwargs)
        self.db.add(instance)
        self.db.commit()
        self.db.refresh(instance)
        return instance

    def update(self, instance: ModelType, **kwargs: Any) -> ModelType:
        """更新记录(只改非 None 的字段)。"""
        for key, value in kwargs.items():
            if value is not None and hasattr(instance, key):
                setattr(instance, key, value)
        self.db.commit()
        self.db.refresh(instance)
        return instance

    def delete(self, instance: ModelType, soft: bool = True) -> None:
        """
        删除一条记录。

        Args:
            instance: ORM 实例(必须是查出来的,不能 new)
            soft: True=逻辑删除(需有 is_deleted);False=物理删除
        """
        if soft and hasattr(instance, "is_deleted"):
            instance.is_deleted = True
        else:
            self.db.delete(instance)
        self.db.commit()

    # ============================================================
    # 批量操作
    # ============================================================

    def bulk_create(self, records: list[dict]) -> None:
        """批量插入,例如 [{"name":"A"}, {"name":"B"}]。"""
        if not records:
            return
        self.db.add_all([self.model(**item) for item in records])
        self.db.commit()

    def bulk_update(self, records: list[dict]) -> None:
        """
        批量按主键更新(每个 dict 必须含 id)。

        一次 SELECT 查全部,内存 setattr,一次 commit,避免 N+1。
        """
        if not records:
            return
        ids = [item["id"] for item in records if item.get("id") is not None]
        if not ids:
            return
        instances = {
            inst.id: inst
            for inst in self.db.execute(
                select(self.model).where(self.model.id.in_(ids))
            ).scalars().all()
        }
        for item in records:
            instance = instances.get(item.get("id"))
            if instance is None:
                continue
            for key, value in item.items():
                if key != "id" and hasattr(instance, key):
                    setattr(instance, key, value)
        self.db.commit()

    def bulk_delete(self, record_ids: list[int], soft: bool = True) -> None:
        """按主键列表批量删除(soft=True 时仅标记 is_deleted)。"""
        if not record_ids:
            return
        instances = self.db.execute(
            select(self.model).where(self.model.id.in_(record_ids))
        ).scalars().all()
        for instance in instances:
            if soft and hasattr(instance, "is_deleted"):
                instance.is_deleted = True
            else:
                self.db.delete(instance)
        self.db.commit()

    # ============================================================
    # 分页查询
    # ============================================================

    def list_page(
        self,
        *,
        page: int = 1,
        page_size: int = 10,
        filters: Optional[list[Any]] = None,
        order_by: Optional[Any] = None,
        count: bool = True,
    ) -> tuple[list[ModelType], int]:
        """
        分页查询。

        Args:
            page: 页码,从 1 开始
            page_size: 每页条数
            filters: 过滤条件列表
            order_by: 排序表达式
            count: 是否查询总数。False 时跳过 COUNT,total 返回 -1,
                   适用于"加载更多"等不需要总数的场景,性能更好。

        Returns:
            (数据列表, 满足条件的总条数; count=False 时为 -1)
        """
        where_clause = self._where(filters)
        order = order_by if order_by is not None else self.model.id.desc()

        total = -1
        if count:
            count_stmt = select(func.count()).select_from(self.model).where(and_(*where_clause))
            total = int(self.db.execute(count_stmt).scalar() or 0)

        items_stmt = (
            select(self.model)
            .where(and_(*where_clause))
            .order_by(order)
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        items = list(self.db.execute(items_stmt).scalars().all())
        return items, total

    # ============================================================
    # 唯一性检查
    # ============================================================

    def exists(
        self,
        *,
        field_values: dict[Any, Any],
        exclude_id: Optional[int] = None,
    ) -> bool:
        """
        唯一性检查,单字段或多字段组合都通过 dict 传入。

        单字段: exists(field_values={User.username: "flyz"})
        多字段: exists(field_values={DeptEmp.dept_id: 101, DeptEmp.emp_no: "E001"})
        """
        stmt = select(self.model.id).where(
            and_(*[field == value for field, value in field_values.items()])
        )
        if exclude_id is not None:
            stmt = stmt.where(self.model.id != exclude_id)
        return self.db.execute(stmt).first() is not None
