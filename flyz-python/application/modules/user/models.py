from sqlalchemy import Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from application.core.base.model import BaseModel, SoftDeleteMixin, TimestampMixin


class User(BaseModel, TimestampMixin, SoftDeleteMixin):
    """用户模型:对应 users 表"""

    __tablename__ = "users"
    __table_args__ = (
        Index("ix_users_status_deleted", "status", "is_deleted"),
        {"comment": "用户表"},
    )

    username: Mapped[str] = mapped_column(
        String(64),
        unique=True,
        nullable=False,
        index=True,
        comment="用户名",
    )
    email: Mapped[str] = mapped_column(
        String(128),
        unique=True,
        nullable=False,
        index=True,
        comment="邮箱",
    )
    password_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        comment="密码哈希",
    )
    nickname: Mapped[str] = mapped_column(
        String(64),
        default="",
        nullable=False,
        comment="昵称",
    )
    status: Mapped[int] = mapped_column(
        Integer,
        default=1,
        nullable=False,
        comment="状态:1-启用 0-禁用",
    )

    # 关联:用户拥有的角色(多对多)
    roles = relationship(
        "Role",
        secondary="user_roles",
        back_populates="users",
        lazy="selectin",
    )
