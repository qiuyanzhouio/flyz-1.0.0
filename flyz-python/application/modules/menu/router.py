"""菜单路由。"""
from fastapi import Depends
from sqlalchemy import or_
from sqlalchemy.orm import Session

from application.core.base.router import BaseCRUDRouter
from application.core.base.schemas import ApiResponse
from application.core.base.service import BaseService
from application.db import get_db
from application.modules.auth.deps import get_current_user
from application.modules.menu.schemas import (
    MenuCreate,
    MenuItem,
    MenuQuery,
    MenuResponse,
    MenuUpdate,
)
from application.modules.menu.service import MenuService
from application.modules.permission.models import Permission
from application.modules.user.models import User


class MenuCRUDRouter(
    BaseCRUDRouter[MenuCreate, MenuUpdate, MenuResponse, MenuQuery]
):
    """菜单 CRUD 路由。"""

    def _register_routes(self) -> None:
        # 先注册自定义路由 /tree,避免被 /{item_id} 抢先匹配
        self._register_tree()
        super()._register_routes()

    def _register_tree(self) -> None:
        @self.router.get(
            "/tree",
            response_model=ApiResponse[list[MenuItem]],
            summary="获取当前用户菜单树",
        )
        def get_my_menu_tree(
            current_user: User = Depends(get_current_user),
            service: MenuService = Depends(self._get_service),
        ) -> ApiResponse[list[MenuItem]]:
            """获取当前登录用户的菜单树(基于角色权限)。"""
            tree = service.get_user_menu_tree(current_user)
            return ApiResponse(data=tree)

    def _build_filters(self, params: MenuQuery) -> list:
        filters = []
        if params.status is not None:
            filters.append(Permission.status == params.status)
        if params.parent_id is not None:
            filters.append(Permission.parent_id == params.parent_id)
        if params.keyword:
            like = f"%{params.keyword}%"
            filters.append(or_(Permission.name.like(like), Permission.code.like(like)))
        return filters

    def _default_order(self, service: BaseService) -> any:
        return Permission.sort_order.asc()


base = MenuCRUDRouter(
    prefix="/menus",
    tags=["菜单管理"],
    service_class=MenuService,
    create_schema=MenuCreate,
    update_schema=MenuUpdate,
    response_schema=MenuResponse,
    query_schema=MenuQuery,
    entity_name="菜单",
    enable_create=True,
    enable_update=True,
    enable_delete=True,
)

router = base.router
