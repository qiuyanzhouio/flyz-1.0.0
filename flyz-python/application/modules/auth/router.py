"""认证路由:登录、获取当前用户信息。"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from application.config import get_settings
from application.db import get_db
from application.core.base.schemas import ApiResponse
from application.modules.auth.deps import get_current_user
from application.modules.auth.schemas import LoginData, LoginRequest, UserInfoData
from application.modules.auth.service import AuthService
from application.modules.user.models import User

router = APIRouter(prefix="/auth", tags=["认证"])


def get_auth_service(db: Session = Depends(get_db)) -> AuthService:
    return AuthService(db)


@router.post("/login", response_model=ApiResponse[LoginData], summary="登录")
def login(
    data: LoginRequest,
    service: AuthService = Depends(get_auth_service),
) -> ApiResponse[LoginData]:
    """用户名密码登录,返回 access_token。"""
    _user, token = service.login(data.username, data.password)
    settings = get_settings()
    return ApiResponse(
        data=LoginData(
            access_token=token,
            expires_in=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )
    )


@router.get("/me", response_model=ApiResponse[UserInfoData], summary="获取当前用户信息")
def get_me(
    current_user: User = Depends(get_current_user),
    service: AuthService = Depends(get_auth_service),
) -> ApiResponse[UserInfoData]:
    """获取当前登录用户的信息(含角色和权限编码列表)。"""
    info = service.get_user_info(current_user)
    return ApiResponse(data=UserInfoData(**info))
