from sqlalchemy import or_

from application.core.base.service import (
    BaseService,
    ConflictException,
    NotFoundException,
)
from application.core.security import hash_password
from application.modules.user.models import User
from application.modules.user.schemas import UserQuery


class UserService(BaseService[User]):
    """用户业务层"""

    model = User

    # ============================================================
    # 覆盖基类 CRUD(注入业务逻辑
    # ============================================================

    def create(self, **kwargs):
        """创建用户(用户名/邮箱唯一性校验 + 密码哈希 + 默认值。"""
        # 唯一性校验
        username = kwargs.get("username")
        email = kwargs.get("email")
        if username and self.exists(field_values={User.username: username}):
            raise ConflictException(f"用户名 {username} 已存在")
        if email and self.exists(field_values={User.email: email}):
            raise ConflictException(f"邮箱 {email} 已存在")

        # 密码哈希:password → password_hash
        password = kwargs.pop("password", None)
        if password:
            kwargs["password_hash"] = hash_password(password)

        # 默认值
        kwargs.setdefault("nickname", kwargs.get("username", ""))
        kwargs.setdefault("status", 1)

        return super().create(**kwargs)

    def update(self, instance, **kwargs):
        """更新用户(邮箱唯一性校验,排除自身)。"""
        email = kwargs.get("email")
        if email is not None and email != instance.email:
            if self.exists(field_values={User.email: email}, exclude_id=instance.id):
                raise ConflictException(f"邮箱 {email} 已被占用")
        return super().update(instance, **kwargs)

    def delete(self, instance, soft: bool = True):
        """删除用户(软删除)。"""
        return super().delete(instance, soft=soft)

    # ============================================================
    # 查询方法
    # ============================================================

    def query_users(
        self,
        page: int,
        page_size: int,
        params: UserQuery,
    ) -> tuple[list[User], int]:
        """用户条件查询 + 分页(关键词模糊搜索 + 状态过滤)。"""
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

        return self.list_page(
            page=page,
            page_size=page_size,
            filters=filters,
            order_by=User.id.desc(),
        )

    # ============================================================
    # 认证相关
    # ============================================================

    def get_by_username(self, username: str) -> User | None:
        """按用户名查询(用于登录)。"""
        from sqlalchemy import select

        stmt = select(User).where(
            User.username == username,
            *self._where(),
        )
        return self.db.execute(stmt).scalar_one_or_none()
