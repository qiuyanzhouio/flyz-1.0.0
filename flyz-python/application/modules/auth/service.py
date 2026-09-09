"""认证业务层。"""
from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from application.core.base.service import UnauthorizedException
from application.core.security import create_access_token, verify_password
from application.modules.auth.deps import is_super_admin
from application.modules.menu.service import MenuService
from application.modules.permission.models import Permission
from application.modules.user.models import User
from application.modules.user.service import UserService


class AuthService:
    def __init__(self, db: Session):
        self.db = db
        self.user_service = UserService(db)
        self.menu_service = MenuService(db)

    def login(self, username: str, password: str) -> tuple[User, str]:
        """
        用户名密码登录。

        Returns:
            (用户对象, access_token)
        """
        user = self.user_service.get_by_username(username)

        if user is None:
            raise UnauthorizedException("用户名或密码错误")

        if user.status != 1:
            raise UnauthorizedException("账号已被禁用")

        if not verify_password(password, user.password_hash):
            raise UnauthorizedException("用户名或密码错误")

        token = create_access_token(subject=user.id)
        return user, token

    def get_user_info(self, user: User) -> dict:
        """组装当前用户信息(角色编码 + 权限编码 + 菜单树)。"""
        role_codes: list[str] = []
        for role in user.roles:
            if role.status != 1:
                continue
            role_codes.append(role.code)

        # 超级管理员:拥有全部启用状态的权限编码
        if is_super_admin(user):
            stmt = select(Permission.code).where(
                and_(
                    Permission.status == 1,
                    Permission.is_deleted.is_(False),
                )
            )
            perm_codes = list(self.db.execute(stmt).scalars().all())
        else:
            perm_codes = []
            for role in user.roles:
                if role.status != 1:
                    continue
                for perm in role.permissions:
                    if perm.status == 1 and perm.code not in perm_codes:
                        perm_codes.append(perm.code)

        menus = self.menu_service.get_user_menu_tree(user)
        return {
            "id": user.id,
            "username": user.username,
            "nickname": user.nickname,
            "email": user.email,
            "status": user.status,
            "roles": role_codes,
            "permissions": perm_codes,
            "menus": menus,
        }
