"""
测试配置与共享 fixtures。

使用 SQLite 内存数据库进行测试,不依赖真实 MySQL。
"""
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from application.db import Base

# SQLite 内存数据库
TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session")
def test_engine():
    """会话级别的测试数据库引擎,所有表创建一次。"""
    # 导入所有模型以注册到 metadata
    from application.modules.user.models import User  # noqa: F401
    from application.modules.role.models import Role  # noqa: F401
    from application.modules.dept.models import Dept  # noqa: F401
    from application.modules.permission.models import Permission  # noqa: F401
    from application.modules.log.models import OperationLog  # noqa: F401

    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db(test_engine) -> Session:
    """每个测试用例独立的数据库会话,测试后回滚。"""
    connection = test_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()
