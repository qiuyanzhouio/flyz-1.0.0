from sqlalchemy import or_

from application.core.base.service import BaseService, ConflictException
from application.modules.role.models import Role
from application.modules.role.schemas import RoleQuery


class RoleService(BaseService[Role]):
    """角色业务层"""

    model = Role

    # ============================================================
    # 覆盖基类 CRUD(注入业务逻辑)
    # ============================================================

    def create(self, **kwargs):
        """创建角色(code 唯一)。"""
        code = kwargs.get("code")
        if code and self.exists(field_values={Role.code: code}):
            raise ConflictException(f"角色编码 {code} 已存在")
        kwargs.setdefault("description", "")
        kwargs.setdefault("sort_order", 0)
        kwargs.setdefault("status", 1)
        return super().create(**kwargs)

    def update(self, instance, **kwargs):
        """更新角色(code 不可改,其他字段正常更新。"""
        # code 字段不允许通过 update 修改(保持和原 create_role 逻辑一致
        kwargs.pop("code", None)
        return super().update(instance, **kwargs)

    def delete(self, instance, soft: bool = True):
        """删除角色(软删除)。"""
        return super().delete(instance, soft=soft)

    # ============================================================
    # 查询方法
    # ============================================================

    def query_roles(
        self,
        page: int,
        page_size: int,
        params: RoleQuery,
    ) -> tuple[list[Role], int]:
        """角色条件查询 + 分页。"""
        filters = []
        if params.status is not None:
            filters.append(Role.status == params.status)
        if params.keyword:
            like = f"%{params.keyword}%"
            filters.append(or_(Role.name.like(like), Role.code.like(like)))
        return self.list_page(
            page=page,
            page_size=page_size,
            filters=filters,
            order_by=Role.sort_order.asc(),
        )
