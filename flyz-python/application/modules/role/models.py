from sqlalchemy import Column, ForeignKey, Index, Integer, String, Table
from sqlalchemy.orm import Mapped, mapped_column, relationship

from application.db import Base
from application.core.base.model import BaseModel, SoftDeleteMixin, TimestampMixin


# ============================================================
# 关联表
# ============================================================

user_roles = Table(
    "user_roles",
    Base.metadata,
    Column(
        "user_id",
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
        comment="用户 ID",
    ),
    Column(
        "role_id",
        Integer,
        ForeignKey("roles.id", ondelete="CASCADE"),
        primary_key=True,
        comment="角色 ID",
    ),
    comment="用户-角色关联表",
)

role_permissions = Table(
    "role_permissions",
    Base.metadata,
    Column(
        "role_id",
        Integer,
        ForeignKey("roles.id", ondelete="CASCADE"),
        primary_key=True,
        comment="角色 ID",
    ),
    Column(
        "permission_id",
        Integer,
        ForeignKey("permissions.id", ondelete="CASCADE"),
        primary_key=True,
        comment="权限 ID",
    ),
    comment="角色-权限关联表",
)


class Role(BaseModel, TimestampMixin, SoftDeleteMixin):
    """角色模型:对应 roles 表"""

    __tablename__ = "roles"
    __table_args__ = (
        Index("ix_roles_status_deleted", "status", "is_deleted"),
        {"comment": "角色表"},
    )

    name: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        comment="角色名称",
    )
    code: Mapped[str] = mapped_column(
        String(64),
        unique=True,
        nullable=False,
        index=True,
        comment="角色编码(唯一,如 admin/user)",
    )
    description: Mapped[str] = mapped_column(
        String(255),
        default="",
        nullable=False,
        comment="角色描述",
    )
    sort_order: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
        comment="排序值,越小越靠前",
    )
    status: Mapped[int] = mapped_column(
        Integer,
        default=1,
        nullable=False,
        comment="状态:1-启用 0-禁用",
    )

    # 关联:角色下的用户(多对多)
    users = relationship(
        "User",
        secondary="user_roles",
        back_populates="roles",
        lazy="selectin",
    )

    # 关联:角色拥有的权限(多对多)
    permissions = relationship(
        "Permission",
        secondary="role_permissions",
        back_populates="roles",
        lazy="selectin",
    )
