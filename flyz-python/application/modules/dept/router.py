"""部门路由(基于 BaseCRUDRouter)。

业务逻辑在 DeptService.create/update/delete 中覆盖实现。
"""
from sqlalchemy import or_

from application.core.base.router import BaseCRUDRouter
from application.core.base.service import BaseService
from application.modules.dept.models import Dept
from application.modules.dept.schemas import DeptCreate, DeptQuery, DeptResponse, DeptUpdate
from application.modules.dept.service import DeptService


class DeptCRUDRouter(BaseCRUDRouter[DeptCreate, DeptUpdate, DeptResponse, DeptQuery]):
    """部门路由。"""

    def _build_filters(self, params: DeptQuery) -> list:
        filters = []
        if params.status is not None:
            filters.append(Dept.status == params.status)
        if params.parent_id is not None:
            filters.append(Dept.parent_id == params.parent_id)
        if params.keyword:
            like = f"%{params.keyword}%"
            filters.append(or_(Dept.name.like(like), Dept.code.like(like)))
        return filters

    def _default_order(self, service: BaseService) -> any:
        return Dept.sort_order.asc()


base = DeptCRUDRouter(
    prefix="/depts",
    tags=["部门管理"],
    service_class=DeptService,
    create_schema=DeptCreate,
    update_schema=DeptUpdate,
    response_schema=DeptResponse,
    query_schema=DeptQuery,
    entity_name="部门",
    enable_create=True,
    enable_update=True,
    enable_delete=True,
)

router = base.router
