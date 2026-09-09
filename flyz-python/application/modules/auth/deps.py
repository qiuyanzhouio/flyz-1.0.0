"""
认证与授权依赖(业务层)。

提供:
- get_current_user: 从 JWT 解析当前用户(FastAPI Depends)
- get_current_user_optional: 可选登录
- require_roles: 角色校验依赖
- require_permissions: 权限编码校验依赖(带 Redis 缓存)
"""
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.orm import Session

from application.config import get_settings
from application.core.security import decode_token
from application.db import get_db
from application.modules.auth.perm_cache import get_user_permissions
from application.modules.user.models import User
from application.modules.user.service import UserService

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    从 Authorization: Bearer <token> 解析当前用户。

    未携带 token 或 token 无效/过期 → 401。
    用户被禁用或不存在 → 401。
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="无效的访问凭证",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception
    try:
        payload = decode_token(token)
        user_id: Optional[str] = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    service = UserService(db)
    user = service.get_by_id(int(user_id))
    if user is None:
        raise credentials_exception
    if user.status != 1:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="账号已被禁用",
        )
    return user


def get_current_user_optional(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """可选登录:有 token 就解析,没有就返回 None。"""
    if not token:
        return None
    try:
        return get_current_user(token=token, db=db)  # type: ignore[call-arg]
    except HTTPException:
        return None


def is_super_admin(user: User) -> bool:
    """判断用户是否拥有超级管理员角色(启用状态)。"""
    settings = get_settings()
    return any(
        role.code == settings.SUPER_ADMIN_ROLE_CODE and role.status == 1
        for role in user.roles
    )


def require_roles(*role_codes: str):
    """
    角色校验依赖工厂。

    用法:
        @router.get("/admin-only")
        def admin_only(_user: User = Depends(require_roles("admin"))):
            ...

    拥有列表中任意一个角色即通过。
    """

    def _checker(current_user: User = Depends(get_current_user)) -> User:
        user_role_codes = {role.code for role in current_user.roles if role.status == 1}
        if not user_role_codes & set(role_codes):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="权限不足:需要角色 " + ", ".join(role_codes),
            )
        return current_user

    return _checker


def require_permissions(*perm_codes: str):
    """
    权限编码校验依赖工厂(带 Redis 缓存)。

    用法:
        @router.get("/users")
        def list_users(_user: User = Depends(require_permissions("system:user:list"))):
            ...

    拥有列表中任意一个权限编码即通过(或的关系)。
    若需要"且"的关系,可叠加多个 Depends。
    """

    def _checker(
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db),
    ) -> User:
        # 超级管理员拥有全部权限,直接放行
        if is_super_admin(current_user):
            return current_user

        user_perms = get_user_permissions(db, current_user.id)
        if not user_perms & set(perm_codes):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="权限不足:需要权限 " + ", ".join(perm_codes),
            )
        return current_user

    return _checker
