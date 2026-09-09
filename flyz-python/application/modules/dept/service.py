from sqlalchemy import or_

from application.core.base.service import (
    BaseService,
    ConflictException,
    ValidationException,
)
from application.modules.dept.models import Dept
from application.modules.dept.schemas import DeptQuery


class DeptService(BaseService[Dept]):
    """部门业务层"""

    model = Dept

    # ============================================================
    # 覆盖基类 CRUD(注入业务逻辑)
    # ============================================================

    def create(self, **kwargs):
        """创建部门(code 唯一 + 父部门存在性校验)。"""
        code = kwargs.get("code")
        if code and self.exists(field_values={Dept.code: code}):
            raise ConflictException(f"部门编码 {code} 已存在")

        parent_id = kwargs.get("parent_id")
        if parent_id is not None and self.get_by_id(parent_id) is None:
            raise ValidationException(f"父部门 {parent_id} 不存在")

        kwargs.setdefault("sort_order", 0)
        kwargs.setdefault("status", 1)
        return super().create(**kwargs)

    def update(self, instance, **kwargs):
        """更新部门(父部门不能是自己 + 父部门存在性校验)。"""
        parent_id = kwargs.get("parent_id")
        if parent_id is not None:
            if parent_id == instance.id:
                raise ValidationException("父部门不能是自己")
            if self.get_by_id(parent_id) is None:
                raise ValidationException(f"父部门 {parent_id} 不存在")
        return super().update(instance, **kwargs)

    def delete(self, instance, soft: bool = True):
        """删除部门(软删除),有子部门时禁止。"""
        has_children = self.exists(field_values={Dept.parent_id: instance.id})
        if has_children:
            raise ValidationException("存在子部门,无法删除")
        return super().delete(instance, soft=soft)

    # ============================================================
    # 查询方法
    # ============================================================

    def query_depts(
        self,
        page: int,
        page_size: int,
        params: DeptQuery,
    ) -> tuple[list[Dept], int]:
        """部门条件查询 + 分页。"""
        filters = []
        if params.status is not None:
            filters.append(Dept.status == params.status)
        if params.parent_id is not None:
            filters.append(Dept.parent_id == params.parent_id)
        if params.keyword:
            like = f"%{params.keyword}%"
            filters.append(or_(Dept.name.like(like), Dept.code.like(like)))
        return self.list_page(
            page=page,
            page_size=page_size,
            filters=filters,
            order_by=Dept.sort_order.asc(),
        )
