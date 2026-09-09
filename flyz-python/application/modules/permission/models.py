from sqlalchemy import ForeignKey, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from application.core.base.model import BaseModel, SoftDeleteMixin, TimestampMixin


class Permission(BaseModel, TimestampMixin, SoftDeleteMixin):
    """权限/菜单模型:树形结构,type 区分 menu/button/api"""

    __tablename__ = "permissions"
    __table_args__ = (
        Index("ix_permissions_status_deleted", "status", "is_deleted"),
        Index("ix_permissions_parent_type", "parent_id", "type"),
        {"comment": "权限表"},
    )

    TYPE_MENU = "menu"
    TYPE_BUTTON = "button"
    TYPE_API = "api"

    name: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        comment="权限名称",
    )
    code: Mapped[str] = mapped_column(
        String(128),
        unique=True,
        nullable=False,
        index=True,
        comment="权限编码(唯一,如 system:user:list)",
    )
    type: Mapped[str] = mapped_column(
        String(16),
        default=TYPE_MENU,
        nullable=False,
        index=True,
        comment="类型:menu/button/api",
    )
    parent_id: Mapped[int | None] = mapped_column(
        ForeignKey("permissions.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
        comment="父权限 ID,根节点为 NULL",
    )
    path: Mapped[str] = mapped_column(
        String(255),
        default="",
        nullable=False,
        comment="前端路由路径或后端 API 路径",
    )
    icon: Mapped[str] = mapped_column(
        String(64),
        default="",
        nullable=False,
        comment="菜单图标(menu 类型时使用)",
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

    # 关联:拥有该权限的角色(多对多)
    roles = relationship(
        "Role",
        secondary="role_permissions",
        back_populates="permissions",
        lazy="selectin",
    )
