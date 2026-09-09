"""权限路由(基于 BaseCRUDRouter)。

业务逻辑在 PermissionService.create/update/delete 中覆盖实现。
"""
from sqlalchemy import or_

from application.core.base.router import BaseCRUDRouter
from application.core.base.service import BaseService
from application.modules.permission.models import Permission
from application.modules.permission.schemas import (
    PermissionCreate,
    PermissionQuery,
    PermissionResponse,
    PermissionUpdate,
)
from application.modules.permission.service import PermissionService


class PermissionCRUDRouter(
    BaseCRUDRouter[PermissionCreate, PermissionUpdate, PermissionResponse, PermissionQuery]
):
    """权限路由。"""

    def _build_filters(self, params: PermissionQuery) -> list:
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
        return filters

    def _default_order(self, service: BaseService) -> any:
        return Permission.sort_order.asc()


base = PermissionCRUDRouter(
    prefix="/permissions",
    tags=["权限管理"],
    service_class=PermissionService,
    create_schema=PermissionCreate,
    update_schema=PermissionUpdate,
    response_schema=PermissionResponse,
    query_schema=PermissionQuery,
    entity_name="权限",
    enable_create=True,
    enable_update=True,
    enable_delete=True,
)

router = base.router
