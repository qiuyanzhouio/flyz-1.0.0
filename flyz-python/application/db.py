"""
数据库基础设施:ORM 基类、引擎、会话工厂、依赖注入。
"""
from collections.abc import Iterator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from application.config import get_settings


class Base(DeclarativeBase):
    """所有 ORM 模型的基类"""


_settings = get_settings()

engine = create_engine(
    _settings.DATABASE_URL,
    echo=_settings.APP_DEBUG,
    pool_pre_ping=True,
    pool_recycle=3600,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Iterator[Session]:
    """数据库会话依赖注入(配合 FastAPI Depends)。请求结束自动关闭。"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
