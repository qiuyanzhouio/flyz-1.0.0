"""
统一日志配置。

- 日志格式含 request_id(从 contextvar 读取)
- 支持按环境设置日志级别
- 控制台输出 + 可选文件输出
"""
import logging
import sys
from contextvars import ContextVar
from typing import Optional

# 全局 request_id 上下文变量,中间件会设置,日志格式化时读取
request_id_var: ContextVar[Optional[str]] = ContextVar("request_id", default=None)


class RequestIdFilter(logging.Filter):
    """向日志记录注入 request_id。"""

    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = request_id_var.get() or "-"
        return True


def setup_logging(level: str = "INFO") -> None:
    """
    初始化全局日志配置。

    Args:
        level: 日志级别, DEBUG/INFO/WARNING/ERROR
    """
    log_format = (
        "%(asctime)s | %(levelname)-7s | %(request_id)s | "
        "%(name)s:%(lineno)d | %(message)s"
    )
    formatter = logging.Formatter(log_format, datefmt="%Y-%m-%d %H:%M:%S")

    # 根 logger
    root = logging.getLogger()
    root.setLevel(level)

    # 清除已有 handler(避免重复)
    root.handlers.clear()

    # 控制台输出
    console = logging.StreamHandler(sys.stdout)
    console.setFormatter(formatter)
    console.addFilter(RequestIdFilter())
    root.addHandler(console)

    # 降低第三方库的日志噪音
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.error").setLevel(logging.INFO)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
