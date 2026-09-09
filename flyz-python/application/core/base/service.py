from typing import Any, Callable, Generic, Optional, Type, TypeVar

from sqlalchemy import and_, func, select
from sqlalchemy.orm import Session

from application.core.base.model import BaseModel, SoftDeleteMixin

ModelType = TypeVar("ModelType", bound=BaseModel)


class ServiceException(Exception):
    """业务层统一异常基类,由全局异常处理器包装为统一响应。"""

    status_code: int = 400

    def __init__(self, message: str, status_code: int | None = None):
        super().__init__(message)
        self.message = message
        if status_code is not None:
            self.status_code = status_code


class NotFoundException(ServiceException):
    """资源不存在 (404)"""

    status_code = 404


class ValidationException(ServiceException):
    """参数校验失败 / 业务规则不满足 (400)"""

    status_code = 400


class UnauthorizedException(ServiceException):
    """未认证 / 登录失效 (401)"""

    status_code = 401


class ForbiddenException(ServiceException):
    """无权限 (403)"""

    status_code = 403


class ConflictException(ServiceException):
    """资源冲突,如唯一键重复 (409)"""

    status_code = 409


class BaseService(Generic[ModelType]):
    """
    通用业务服务基类。

    内部直接持有 db: Session,通用 CRUD 基于 self.model 直接实现;
    子类可在此基础上添加业务规则(唯一性校验、密码哈希等)。

    用法:
        class UserService(BaseService[User]):
            model = User

            def create_user(self, data: UserCreate) -> User:
                if self.exists(field_values={User.username: data.username}):
                    raise ServiceException("用户名已存在")
                return self.create(...)

    抛出业务异常:
        raise ServiceException("消息", status_code=404)
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
        if issubclass(self.model, SoftDeleteMixin):
            where_clause.append(self.model.is_deleted.is_(False))
        return where_clause

    # ============================================================
    # 通用 CRUD
    # ============================================================

    def get_by_id(
        self,
        record_id: int,
        *,
        or_404: bool = False,
        message: Optional[str] = None,
    ) -> Optional[ModelType]:
        """
        按主键查询。

        Args:
            record_id: 主键 ID
            or_404: True 时不存在则抛 404;False 时返回 None
            message: or_404=True 时的自定义错误消息
        """
        instance = self.db.execute(
            select(self.model).where(
                and_(self.model.id == record_id, *self._where())
            )
        ).scalar_one_or_none()
        if instance is None and or_404:
            raise ServiceException(
                message or f"{self.model.__name__} {record_id} 不存在",
                status_code=404,
            )
        return instance

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
        if soft and issubclass(self.model, SoftDeleteMixin):
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
            if soft and issubclass(self.model, SoftDeleteMixin):
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

    # ============================================================
    # 便捷方法(减少子类重复代码)
    # ============================================================

    def create_with_unique(
        self,
        *,
        data: dict[str, Any],
        unique_fields: Optional[dict[Any, str]] = None,
        before_create: Optional[Callable[[dict[str, Any]], dict[str, Any]]] = None,
    ) -> ModelType:
        """
        带唯一性校验的创建。

        Args:
            data: 创建数据字典
            unique_fields: 唯一性字段映射 {ORM列: 错误消息}
                例如 {User.username: "用户名已存在"}
            before_create: 创建前钩子,可修改 data 并返回

        Raises:
            ConflictException: 唯一性校验失败
        """
        # 唯一性校验
        if unique_fields:
            for field, msg in unique_fields.items():
                value = data.get(field.key if hasattr(field, "key") else field.name)
                if value is not None and self.exists(field_values={field: value}):
                    raise ConflictException(msg)

        # 创建前钩子
        if before_create is not None:
            data = before_create(data)

        return self.create(**data)

    def update_by_id_with_unique(
        self,
        record_id: int,
        *,
        data: dict[str, Any],
        unique_fields: Optional[dict[Any, str]] = None,
        before_update: Optional[Callable[[ModelType, dict[str, Any]], dict[str, Any]]] = None,
        not_found_msg: Optional[str] = None,
    ) -> ModelType:
        """
        按 ID 更新(带唯一性校验 + 存在性检查)。

        Args:
            record_id: 主键 ID
            data: 更新数据字典
            unique_fields: 唯一性字段映射 {ORM列: 错误消息}
            before_update: 更新前钩子,接收 (instance, data),返回修改后的 data
            not_found_msg: 记录不存在时的错误消息

        Raises:
            NotFoundException: 记录不存在
            ConflictException: 唯一性校验失败
        """
        instance = self.get_by_id(record_id, or_404=True, message=not_found_msg)
        assert instance is not None

        # 唯一性校验(排除自身)
        if unique_fields:
            for field, msg in unique_fields.items():
                field_name = field.key if hasattr(field, "key") else field.name
                value = data.get(field_name)
                if value is not None and self.exists(
                    field_values={field: value}, exclude_id=record_id
                ):
                    raise ConflictException(msg)

        # 更新前钩子
        if before_update is not None:
            data = before_update(instance, data)

        return self.update(instance, **data)

    def delete_by_id(
        self,
        record_id: int,
        *,
        soft: bool = True,
        before_delete: Optional[Callable[[ModelType], None]] = None,
        not_found_msg: Optional[str] = None,
    ) -> None:
        """
        按 ID 删除(带存在性检查 + 删除前钩子)。

        Args:
            record_id: 主键 ID
            soft: 是否软删除
            before_delete: 删除前钩子,可用于校验子节点等
            not_found_msg: 记录不存在时的错误消息

        Raises:
            NotFoundException: 记录不存在
            ValidationException: 删除前钩子抛出(如存在子节点)
        """
        instance = self.get_by_id(record_id, or_404=True, message=not_found_msg)
        assert instance is not None

        if before_delete is not None:
            before_delete(instance)

        self.delete(instance, soft=soft)
