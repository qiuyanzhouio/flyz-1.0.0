from datetime import datetime

from sqlalchemy import DateTime, Index, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from application.core.base.model import Base


class OperationLog(Base):
    """操作日志:只追加,通常不更新也不删除"""

    __tablename__ = "operation_logs"
    __table_args__ = (
        Index("ix_op_logs_created_status", "created_at", "status"),
        Index("ix_op_logs_module_created", "module", "created_at"),
        {"comment": "操作日志表"},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="日志ID")

    user_id: Mapped[int | None] = mapped_column(
        Integer, nullable=True, index=True, comment="操作用户 ID(未登录为 NULL)"
    )
    username: Mapped[str] = mapped_column(
        String(64), default="", nullable=False, comment="操作用户名(冗余存储,用户删除后仍可查)"
    )
    module: Mapped[str] = mapped_column(
        String(64), default="", nullable=False, index=True, comment="业务模块,如 用户管理"
    )
    action: Mapped[str] = mapped_column(
        String(64), default="", nullable=False, comment="操作类型,如 新增/修改/删除/查询"
    )
    method: Mapped[str] = mapped_column(
        String(8), default="", nullable=False, comment="HTTP 方法:GET/POST/PUT/DELETE"
    )
    path: Mapped[str] = mapped_column(
        String(255), default="", nullable=False, comment="请求路径"
    )
    params: Mapped[str] = mapped_column(
        Text, default="", nullable=False, comment="请求参数(JSON 字符串)"
    )
    result: Mapped[str] = mapped_column(
        Text, default="", nullable=False, comment="响应结果(JSON 字符串,失败时存错误信息)"
    )
    status: Mapped[int] = mapped_column(
        Integer, default=1, nullable=False, index=True, comment="状态:1-成功 0-失败"
    )
    ip: Mapped[str] = mapped_column(
        String(64), default="", nullable=False, comment="客户端 IP"
    )
    user_agent: Mapped[str] = mapped_column(
        String(512), default="", nullable=False, comment="浏览器/客户端 UA"
    )
    cost_ms: Mapped[int] = mapped_column(
        Integer, default=0, nullable=False, comment="耗时(毫秒)"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
        nullable=False,
        index=True,
        comment="创建时间",
    )
