from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

from application.config import get_settings
from application.db import Base
# 导入所有模型模块,确保它们注册到 Base.metadata
from application.modules.user.models import User  # noqa: F401
from application.modules.role.models import Role  # noqa: F401
from application.modules.dept.models import Dept  # noqa: F401
from application.modules.permission.models import Permission  # noqa: F401
from application.modules.log.models import OperationLog  # noqa: F401

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

settings = get_settings()
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """
    离线模式执行迁移。

    不建立真实数据库连接，只根据 metadata 生成 SQL 语句（需要 --sql 参数）。
    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """
    在线模式执行迁移（默认模式）。

    建立真实数据库连接，自动对比 metadata 和现库差异，直接执行 DDL。
    """
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
