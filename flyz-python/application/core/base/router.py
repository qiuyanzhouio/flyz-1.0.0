"""
通用 CRUD Router 基类。

为标准 CRUD 场景自动注册 5 个接口:
    POST   /          创建
    GET    /{item_id} 详情
    PUT    /{item_id} 更新
    DELETE /{item_id} 删除
    GET    /          分页列表

子类可覆盖任意方法以自定义业务逻辑。
"""
from typing import Any, Callable, Generic, Optional, Type, TypeVar

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from application.db import get_db
from application.core.base.schemas import (
    ApiResponse,
    PageParams,
    PageResult,
    PagedResponse,
)
from application.core.base.service import BaseService

CreateSchema = TypeVar("CreateSchema")
UpdateSchema = TypeVar("UpdateSchema")
ResponseSchema = TypeVar("ResponseSchema")
QuerySchema = TypeVar("QuerySchema")


class BaseCRUDRouter(Generic[CreateSchema, UpdateSchema, ResponseSchema, QuerySchema]):
    """
    通用 CRUD 路由基类。

    用法:
        base = BaseCRUDRouter(
            prefix="/users",
            tags=["用户管理"],
            service_class=UserService,
            create_schema=UserCreate,
            update_schema=UserUpdate,
            response_schema=UserResponse,
            query_schema=UserQuery,
            entity_name="用户",
        )
        router = base.router

    如需自定义某个接口,直接在 base.router 上重新注册即可(同名路径会覆盖)。
    """

    def __init__(
        self,
        *,
        prefix: str,
        tags: list[str],
        service_class: Type[BaseService],
        response_schema: Type[ResponseSchema],
        create_schema: Optional[Type[CreateSchema]] = None,
        update_schema: Optional[Type[UpdateSchema]] = None,
        query_schema: Optional[Type[QuerySchema]] = None,
        entity_name: str = "记录",
        # 各接口开关(默认只启用详情和列表,增删改因业务逻辑差异大,建议各模块自行注册)
        enable_create: bool = False,
        enable_get: bool = True,
        enable_update: bool = False,
        enable_delete: bool = False,
        enable_list: bool = True,
        # 认证控制
        require_auth: bool = False,       # 是否需要登录(全局开关,所有接口都需要登录)
        # 权限控制(传了自动隐含需要登录,优先级高于 require_auth)
        create_perm: Optional[str] = None,
        read_perm: Optional[str] = None,
        update_perm: Optional[str] = None,
        delete_perm: Optional[str] = None,
    ):
        # 启用的接口必须有对应的 schema
        if enable_create and create_schema is None:
            raise ValueError("enable_create=True 时必须传入 create_schema")
        if enable_update and update_schema is None:
            raise ValueError("enable_update=True 时必须传入 update_schema")

        self.router = APIRouter(prefix=prefix, tags=tags)
        self.service_class = service_class
        self.create_schema = create_schema
        self.update_schema = update_schema
        self.response_schema = response_schema
        self.query_schema = query_schema
        self.entity_name = entity_name

        self._enable_create = enable_create
        self._enable_get = enable_get
        self._enable_update = enable_update
        self._enable_delete = enable_delete
        self._enable_list = enable_list

        self._require_auth = require_auth
        self._create_perm = create_perm
        self._read_perm = read_perm
        self._update_perm = update_perm
        self._delete_perm = delete_perm

        self._register_routes()

    # ============================================================
    # 依赖构造
    # ============================================================

    def _get_service(self, db: Session = Depends(get_db)):
        return self.service_class(db)

    def _auth_dep(self) -> Optional[Callable]:
        """登录依赖(需要时才导入,避免循环引用)。"""
        if not self._require_auth:
            return None
        from application.modules.auth.deps import get_current_user
        return Depends(get_current_user)

    def _perm_dep(self, perm_code: Optional[str]) -> Optional[Callable]:
        """权限依赖(需要时才导入,避免循环引用)。传了权限自动隐含需要登录。"""
        if not perm_code:
            return None
        from application.modules.auth.deps import require_permissions
        return Depends(require_permissions(perm_code))

    def _merge_deps(self, perm_code: Optional[str]) -> list[Any]:
        """
        合并登录依赖 + 权限依赖。

        优先级: 权限依赖 > 全局 require_auth
        传了 perm_code 就用权限依赖(自带登录校验),否则看 require_auth。
        """
        deps: list[Any] = []
        perm_dep = self._perm_dep(perm_code)
        if perm_dep is not None:
            deps.append(perm_dep)
        else:
            auth_dep = self._auth_dep()
            if auth_dep is not None:
                deps.append(auth_dep)
        return deps

    # ============================================================
    # 路由注册
    # ============================================================

    def _register_routes(self) -> None:
        if self._enable_create:
            self._register_create()
        if self._enable_get:
            self._register_get()
        if self._enable_update:
            self._register_update()
        if self._enable_delete:
            self._register_delete()
        if self._enable_list:
            self._register_list()

    # ------------------------------------------------------------
    # 创建
    # ------------------------------------------------------------

    def _register_create(self) -> None:
        response_model = ApiResponse[self.response_schema]  # type: ignore[valid-type]

        deps = self._merge_deps(self._create_perm)

        @self.router.post("", response_model=response_model, summary=f"创建{self.entity_name}", dependencies=deps)
        def create(
            data: self.create_schema,  # type: ignore[valid-type]
            service = Depends(self._get_service),
        ):
            instance = service.create(**data.model_dump())
            return ApiResponse(data=instance)

    # ------------------------------------------------------------
    # 详情
    # ------------------------------------------------------------

    def _register_get(self) -> None:
        response_model = ApiResponse[self.response_schema]  # type: ignore[valid-type]

        deps = self._merge_deps(self._read_perm)

        @self.router.get(
            "/{item_id}",
            response_model=response_model,
            summary=f"获取{self.entity_name}详情",
            dependencies=deps,
        )
        def get(
            item_id: int,
            service = Depends(self._get_service),
        ):
            instance = service.get_by_id(
                item_id,
                or_404=True,
                message=f"{self.entity_name} {item_id} 不存在",
            )
            return ApiResponse(data=instance)

    # ------------------------------------------------------------
    # 更新
    # ------------------------------------------------------------

    def _register_update(self) -> None:
        response_model = ApiResponse[self.response_schema]  # type: ignore[valid-type]

        deps = self._merge_deps(self._update_perm)

        @self.router.put(
            "/{item_id}",
            response_model=response_model,
            summary=f"更新{self.entity_name}",
            dependencies=deps,
        )
        def update(
            item_id: int,
            data: self.update_schema,  # type: ignore[valid-type]
            service = Depends(self._get_service),
        ):
            instance = service.get_by_id(
                item_id,
                or_404=True,
                message=f"{self.entity_name} {item_id} 不存在",
            )
            update_data = data.model_dump(exclude_unset=True)
            service.update(instance, **update_data)
            return ApiResponse(data=instance)

    # ------------------------------------------------------------
    # 删除
    # ------------------------------------------------------------

    def _register_delete(self) -> None:
        deps = self._merge_deps(self._delete_perm)

        @self.router.delete(
            "/{item_id}",
            response_model=ApiResponse[bool],
            summary=f"删除{self.entity_name}",
            dependencies=deps,
        )
        def delete(
            item_id: int,
            service = Depends(self._get_service),
        ):
            instance = service.get_by_id(
                item_id,
                or_404=True,
                message=f"{self.entity_name} {item_id} 不存在",
            )
            service.delete(instance, soft=True)
            return ApiResponse(data=True)

    # ------------------------------------------------------------
    # 分页列表
    # ------------------------------------------------------------

    def _register_list(self) -> None:
        response_model = PagedResponse[self.response_schema]  # type: ignore[valid-type]

        deps = self._merge_deps(self._read_perm)

        @self.router.get(
            "",
            response_model=response_model,
            summary=f"{self.entity_name}列表(分页)",
            dependencies=deps,
        )
        def list_items(
            page: PageParams = Depends(),
            params = Depends(self.query_schema) if self.query_schema else None,  # type: ignore[arg-type]
            service = Depends(self._get_service),
        ):
            filters = self._build_filters(params) if params else []
            order_by = self._default_order(service)
            items, total = service.list_page(
                page=page.page,
                page_size=page.page_size,
                filters=filters,
                order_by=order_by,
            )
            # 不在这里显式构造 PageResult[response_schema],避免对 ORM 对象做严格校验;
            # 返回纯数据结构,交由 FastAPI 的 response_model 统一序列化。
            return {
                "data": {
                    "items": items,
                    "total": total,
                    "page": page.page,
                    "page_size": page.page_size,
                }
            }

    # ============================================================
    # 可覆盖的钩子方法
    # ============================================================

    def _build_filters(self, params: QuerySchema) -> list[Any]:
        """
        根据查询参数构造过滤条件列表。

        默认返回空列表,子类应覆盖此方法实现条件查询。
        """
        return []

    def _default_order(self, service: BaseService) -> Any:
        """默认排序,子类可覆盖。"""
        return service.model.id.desc()
