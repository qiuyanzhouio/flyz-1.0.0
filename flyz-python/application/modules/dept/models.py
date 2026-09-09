from sqlalchemy import ForeignKey, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from application.core.base.model import BaseModel, SoftDeleteMixin, TimestampMixin


class Dept(BaseModel, TimestampMixin, SoftDeleteMixin):
    """部门模型:树形结构,通过 parent_id 自引用"""

    __tablename__ = "depts"
    __table_args__ = (
        Index("ix_depts_status_deleted", "status", "is_deleted"),
        {"comment": "部门表"},
    )

    name: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        comment="部门名称",
    )
    code: Mapped[str] = mapped_column(
        String(64),
        unique=True,
        nullable=False,
        index=True,
        comment="部门编码(唯一)",
    )
    parent_id: Mapped[int | None] = mapped_column(
        ForeignKey("depts.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
        comment="父部门 ID,根节点为 NULL",
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
