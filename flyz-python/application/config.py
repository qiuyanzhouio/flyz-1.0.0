"""
应用配置,通过环境变量注入。

只负责配置读取,不包含数据库等基础设施。
"""
from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """应用配置,通过环境变量注入"""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    APP_NAME: str = Field(default="Python Base Framework")
    APP_ENV: str = Field(default="development")
    APP_DEBUG: bool = Field(default=True)

    HOST: str = Field(default="0.0.0.0")
    PORT: int = Field(default=8000)

    # 数据库
    DB_DRIVER: str = Field(default="mysql+pymysql")
    DB_HOST: str = Field(default="127.0.0.1")
    DB_PORT: int = Field(default=3306)
    DB_USER: str = Field(default="root")
    DB_PASSWORD: str = Field(default="")
    DB_DATABASE: str = Field(default="app_db")
    DB_CHARSET: str = Field(default="utf8mb4")

    # JWT
    JWT_SECRET_KEY: str = Field(
        default="change-me-in-production-please-use-a-strong-random-secret",
        description="JWT 签名密钥,生产环境务必修改",
    )
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(
        default=120,
        description="访问令牌过期时间(分钟)",
    )

    # Redis(权限缓存等)
    REDIS_URL: str = Field(
        default="redis://127.0.0.1:6379/0",
        description="Redis 连接 URL,为空则不使用 Redis",
    )

    # 超级管理员
    SUPER_ADMIN_ROLE_CODE: str = Field(
        default="admin",
        description="超级管理员角色编码,拥有该角色的用户可查看所有菜单、绕过权限校验",
    )

    # 日志
    LOG_OPERATION_ENABLED: bool = Field(
        default=True,
        description="是否启用操作日志自动记录",
    )
    LOG_LEVEL: str = Field(
        default="INFO",
        description="日志级别: DEBUG/INFO/WARNING/ERROR",
    )

    @property
    def DATABASE_URL(self) -> str:
        return (
            f"{self.DB_DRIVER}://{self.DB_USER}:{self.DB_PASSWORD}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_DATABASE}"
            f"?charset={self.DB_CHARSET}"
        )


@lru_cache
def get_settings() -> Settings:
    """获取全局唯一的配置对象(单例)"""
    return Settings()
