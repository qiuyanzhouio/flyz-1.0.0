"""用户路由(基于 BaseCRUDRouter)。

业务逻辑在 UserService.create/update/delete 中覆盖实现,
Router 层只负责参数接收和响应包装。
"""
from sqlalchemy import or_

from application.core.base.router import BaseCRUDRouter
from application.core.base.service import BaseService
from application.modules.user.models import User
from application.modules.user.schemas import UserCreate, UserQuery, UserResponse, UserUpdate
from application.modules.user.service import UserService


class UserCRUDRouter(BaseCRUDRouter[UserCreate, UserUpdate, UserResponse, UserQuery]):
    """用户路由。"""

    def _build_filters(self, params: UserQuery) -> list:
        filters = []
        if params.status is not None:
            filters.append(User.status == params.status)
        if params.keyword:
            like = f"%{params.keyword}%"
            filters.append(
                or_(
                    User.username.like(like),
                    User.email.like(like),
                    User.nickname.like(like),
                )
            )
        return filters

    def _default_order(self, service: BaseService) -> any:
        return User.id.desc()


base = UserCRUDRouter(
    prefix="/users",
    tags=["用户管理"],
    service_class=UserService,
    create_schema=UserCreate,
    update_schema=UserUpdate,
    response_schema=UserResponse,
    query_schema=UserQuery,
    entity_name="用户",
    enable_create=True,
    enable_update=True,
    enable_delete=True,
)

router = base.router
