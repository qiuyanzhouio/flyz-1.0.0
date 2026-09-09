from sqlalchemy import or_

from application.core.base.service import (
    BaseService,
    ConflictException,
    ValidationException,
)
from application.modules.permission.models import Permission
from application.modules.permission.schemas import PermissionQuery


class PermissionService(BaseService[Permission]):
    """权限业务层"""

    model = Permission

    # ============================================================
    # 覆盖基类 CRUD(注入业务逻辑)
    # ============================================================

    def create(self, **kwargs):
        """创建权限(code 唯一 + 父权限存在性校验)。"""
        code = kwargs.get("code")
        if code and self.exists(field_values={Permission.code: code}):
            raise ConflictException(f"权限编码 {code} 已存在")

        parent_id = kwargs.get("parent_id")
        if parent_id is not None and self.get_by_id(parent_id) is None:
            raise ValidationException(f"父权限 {parent_id} 不存在")

        kwargs.setdefault("type", Permission.TYPE_MENU)
        kwargs.setdefault("path", "")
        kwargs.setdefault("icon", "")
        kwargs.setdefault("sort_order", 0)
        kwargs.setdefault("status", 1)
        return super().create(**kwargs)

    def update(self, instance, **kwargs):
        """更新权限(父权限不能是自己 + 父权限存在性校验)。"""
        parent_id = kwargs.get("parent_id")
        if parent_id is not None:
            if parent_id == instance.id:
                raise ValidationException("父权限不能是自己")
            if self.get_by_id(parent_id) is None:
                raise ValidationException(f"父权限 {parent_id} 不存在")
        return super().update(instance, **kwargs)

    def delete(self, instance, soft: bool = True):
        """删除权限(软删除),有子权限时禁止。"""
        has_children = self.exists(field_values={Permission.parent_id: instance.id})
        if has_children:
            raise ValidationException("存在子权限,无法删除")
        return super().delete(instance, soft=soft)

    # ============================================================
    # 查询方法
    # ============================================================

    def query_permissions(
        self,
        page: int,
        page_size: int,
        params: PermissionQuery,
    ) -> tuple[list[Permission], int]:
        """权限条件查询 + 分页。"""
        filters = []
        if params.status is not None:
            filters.append(Permission.status == params.status)
        if params.type is not None:
            filters.append(Permission.type == params.type)
        if params.parent_id is not None:
            filters.append(Permission.parent_id == params.parent_id)
        if params.keyword:
            like = f"%{params.keyword}%"
            filters.append(or_(Permission.name.like(like), Permission.code.like(like)))
        return self.list_page(
            page=page,
            page_size=page_size,
            filters=filters,
            order_by=Permission.sort_order.asc(),
        )
