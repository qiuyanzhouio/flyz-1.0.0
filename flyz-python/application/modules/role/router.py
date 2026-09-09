"""角色路由(基于 BaseCRUDRouter)。

业务逻辑在 RoleService.create/update/delete 中覆盖实现。
"""
from sqlalchemy import or_

from application.core.base.router import BaseCRUDRouter
from application.core.base.service import BaseService
from application.modules.role.models import Role
from application.modules.role.schemas import RoleCreate, RoleQuery, RoleResponse, RoleUpdate
from application.modules.role.service import RoleService


class RoleCRUDRouter(BaseCRUDRouter[RoleCreate, RoleUpdate, RoleResponse, RoleQuery]):
    """角色路由。"""

    def _build_filters(self, params: RoleQuery) -> list:
        filters = []
        if params.status is not None:
            filters.append(Role.status == params.status)
        if params.keyword:
            like = f"%{params.keyword}%"
            filters.append(or_(Role.name.like(like), Role.code.like(like)))
        return filters

    def _default_order(self, service: BaseService) -> any:
        return Role.sort_order.asc()


base = RoleCRUDRouter(
    prefix="/roles",
    tags=["角色管理"],
    service_class=RoleService,
    create_schema=RoleCreate,
    update_schema=RoleUpdate,
    response_schema=RoleResponse,
    query_schema=RoleQuery,
    entity_name="角色",
    enable_create=True,
    enable_update=True,
    enable_delete=True,
)

router = base.router
