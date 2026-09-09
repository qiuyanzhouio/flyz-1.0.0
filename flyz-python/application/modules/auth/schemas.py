"""认证相关请求/响应模型。"""
from typing import Optional

from pydantic import BaseModel, Field

from application.modules.menu.schemas import MenuItem


class LoginRequest(BaseModel):
    """登录请求体"""

    username: str = Field(..., description="用户名", examples=["admin"])
    password: str = Field(..., description="密码", examples=["123456"])


class LoginData(BaseModel):
    """登录成功返回数据"""

    access_token: str = Field(description="访问令牌")
    token_type: str = Field(default="bearer", description="令牌类型")
    expires_in: int = Field(description="过期时间(秒)")


class UserInfoData(BaseModel):
    """当前用户信息(含角色/权限编码列表)"""

    id: int
    username: str
    nickname: str
    email: str
    status: int
    roles: list[str] = Field(description="角色编码列表")
    permissions: list[str] = Field(description="权限编码列表")
    menus: list[MenuItem] = Field(default_factory=list, description="菜单树")
