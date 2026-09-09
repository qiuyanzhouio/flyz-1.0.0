from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse

from application.config import get_settings
from application.core.base.schemas import ApiResponse, ErrorResponse, HealthData
from application.core.base.service import ServiceException
from application.core.logging_config import setup_logging
from application.core.middleware import register_middlewares
from application.modules.auth.router import router as auth_router
from application.modules.dept.router import router as dept_router
from application.modules.log.router import router as log_router
from application.modules.menu.router import router as menu_router
from application.modules.permission.router import router as permission_router
from application.modules.role.router import router as role_router
from application.modules.user.router import router as user_router

settings = get_settings()

# 初始化日志(在应用启动前)
setup_logging(level=settings.LOG_LEVEL)

API_PREFIX = "/api/v1"

ROUTERS = [
    (auth_router, "认证"),
    (user_router, "用户管理"),
    (role_router, "角色管理"),
    (dept_router, "部门管理"),
    (permission_router, "权限管理"),
    (menu_router, "菜单管理"),
    (log_router, "操作日志"),
]


def _error_response(message: str, status_code: int) -> JSONResponse:
    """统一错误响应:ErrorResponse 序列化后用 JSONResponse 返回。"""
    body = ErrorResponse[None](tip=True, message=message).model_dump(mode="json")
    return JSONResponse(content=body, status_code=status_code)


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        debug=settings.APP_DEBUG,
        version="1.0.0",
    )

    # 注册中间件(请求 ID、操作日志等)
    register_middlewares(app)

    @app.exception_handler(HTTPException)
    async def _http_exception_handler(_request: Request, exc: HTTPException) -> JSONResponse:
        return _error_response(str(exc.detail) if exc.detail else "", exc.status_code)

    @app.exception_handler(ServiceException)
    async def _service_exception_handler(_request: Request, exc: ServiceException) -> JSONResponse:
        return _error_response(exc.message, exc.status_code)

    if settings.APP_DEBUG:
        # 注意:开发环境也建议走 Alembic 迁移,而非自动建表
        # 如需快速初始化,可手动执行: alembic upgrade head
        pass

    for router, _name in ROUTERS:
        app.include_router(router, prefix=API_PREFIX)

    @app.get("/health", tags=["系统"], summary="健康检查")
    def health_check() -> ApiResponse[HealthData]:
        """健康检查接口。"""
        return ApiResponse(data=HealthData(status="ok", env=settings.APP_ENV))

    return app


app = create_app()
