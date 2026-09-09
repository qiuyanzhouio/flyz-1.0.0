from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class RoleCreate(BaseModel):
    """创建角色请求体"""

    name: str = Field(..., max_length=64, description="角色名称", examples=["管理员"])
    code: str = Field(
        ...,
        max_length=64,
        pattern=r"^[a-z][a-z0-9_]*$",
        description="角色编码,小写字母/数字/下划线",
        examples=["admin"],
    )
    description: Optional[str] = Field(
        default=None,
        max_length=255,
        description="角色描述",
        examples=["系统超级管理员"],
    )
    sort_order: Optional[int] = Field(default=0, ge=0, description="排序值", examples=[0])
    status: Optional[int] = Field(default=1, ge=0, le=1, description="状态:1-启用 0-禁用")


class RoleUpdate(BaseModel):
    """更新角色请求体:全部字段可选"""

    name: Optional[str] = Field(default=None, max_length=64, description="角色名称")
    description: Optional[str] = Field(default=None, max_length=255, description="角色描述")
    sort_order: Optional[int] = Field(default=None, ge=0, description="排序值")
    status: Optional[int] = Field(default=None, ge=0, le=1, description="状态")


class RoleQuery(BaseModel):
    """角色列表筛选条件"""

    model_config = {"title": "角色列表查询参数"}

    keyword: Optional[str] = Field(
        default=None,
        max_length=64,
        description="搜索关键词(名称/编码模糊匹配)",
    )
    status: Optional[int] = Field(default=None, ge=0, le=1, description="状态过滤")


class RoleResponse(BaseModel):
    """角色信息出参"""

    id: int = Field(description="角色ID")
    name: str = Field(description="角色名称")
    code: str = Field(description="角色编码")
    description: str = Field(description="角色描述")
    sort_order: int = Field(description="排序值")
    status: int = Field(description="状态:1-启用 0-禁用")
    created_at: datetime = Field(description="创建时间")
    updated_at: datetime = Field(description="更新时间")
