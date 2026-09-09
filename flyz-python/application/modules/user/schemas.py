from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator


class UserCreate(BaseModel):
    """创建用户请求体"""

    username: str = Field(
        ...,
        min_length=3,
        max_length=64,
        pattern=r"^[a-zA-Z0-9_]+$",
        description="用户名,仅允许字母/数字/下划线",
        examples=["zhangsan_2024"],
    )
    email: EmailStr = Field(
        ...,
        description="邮箱地址",
        examples=["zhangsan@example.com"],
    )
    password: str = Field(
        ...,
        min_length=6,
        max_length=64,
        description="明文密码,长度 6-64",
        examples=["Aa123456"],
    )
    nickname: Optional[str] = Field(
        default=None,
        max_length=64,
        description="昵称,可选。不填时默认与用户名相同",
        examples=["张三"],
    )

    @field_validator("nickname", mode="before")
    @classmethod
    def default_nickname(cls, v: Optional[str]) -> str:
        """未传或传空串时统一转成空字符串入库。"""
        return v or ""


class UserUpdate(BaseModel):
    """更新用户请求体:全部字段可选,只更新传入字段"""

    nickname: Optional[str] = Field(
        default=None,
        max_length=64,
        description="昵称",
        examples=["新昵称"],
    )
    email: Optional[EmailStr] = Field(
        default=None,
        description="邮箱地址",
        examples=["new_mail@example.com"],
    )
    status: Optional[int] = Field(
        default=None,
        ge=0,
        le=1,
        description="状态:1-启用 0-禁用",
        examples=[1],
    )


class UserQuery(BaseModel):
    """用户列表筛选条件"""

    model_config = {"title": "用户列表查询参数"}

    keyword: Optional[str] = Field(
        default=None,
        max_length=64,
        description="搜索关键词(用户名/邮箱/昵称模糊匹配)",
        examples=["zhang"],
    )
    status: Optional[int] = Field(
        default=None,
        ge=0,
        le=1,
        description="状态过滤:1-启用 0-禁用",
        examples=[1],
    )


class UserResponse(BaseModel):
    """用户信息出参(敏感字段如密码哈希已排除)"""

    id: int = Field(description="用户ID", examples=[1])
    username: str = Field(description="用户名", examples=["zhangsan_2024"])
    email: str = Field(description="邮箱", examples=["zhangsan@example.com"])
    nickname: str = Field(description="昵称", examples=["张三"])
    status: int = Field(description="状态:1-启用 0-禁用", examples=[1])
    created_at: datetime = Field(
        description="创建时间",
        examples=[datetime(2026, 8, 12, 10, 0, 0)],
    )
    updated_at: datetime = Field(
        description="更新时间",
        examples=[datetime(2026, 8, 12, 10, 0, 0)],
    )
