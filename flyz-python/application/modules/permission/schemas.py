from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field

PermissionType = Literal["menu", "button", "api"]


class PermissionCreate(BaseModel):
    """创建权限请求体"""

    name: str = Field(..., max_length=64, description="权限名称", examples=["用户管理"])
    code: str = Field(
        ...,
        max_length=128,
        description="权限编码(唯一)",
        examples=["system:user:list"],
    )
    type: PermissionType = Field(default="menu", description="类型:menu/button/api")
    parent_id: Optional[int] = Field(default=None, ge=1, description="父权限 ID")
    path: Optional[str] = Field(default=None, max_length=255, description="路由/API 路径")
    icon: Optional[str] = Field(default=None, max_length=64, description="菜单图标")
    sort_order: Optional[int] = Field(default=0, ge=0, description="排序值")
    status: Optional[int] = Field(default=1, ge=0, le=1, description="状态:1-启用 0-禁用")


class PermissionUpdate(BaseModel):
    """更新权限请求体"""

    name: Optional[str] = Field(default=None, max_length=64, description="权限名称")
    type: Optional[PermissionType] = Field(default=None, description="类型")
    parent_id: Optional[int] = Field(default=None, ge=1, description="父权限 ID")
    path: Optional[str] = Field(default=None, max_length=255, description="路径")
    icon: Optional[str] = Field(default=None, max_length=64, description="图标")
    sort_order: Optional[int] = Field(default=None, ge=0, description="排序值")
    status: Optional[int] = Field(default=None, ge=0, le=1, description="状态")


class PermissionQuery(BaseModel):
    """权限列表筛选条件"""

    model_config = {"title": "权限列表查询参数"}

    keyword: Optional[str] = Field(default=None, max_length=64, description="名称/编码模糊匹配")
    type: Optional[PermissionType] = Field(default=None, description="按类型过滤")
    status: Optional[int] = Field(default=None, ge=0, le=1, description="状态过滤")
    parent_id: Optional[int] = Field(default=None, ge=1, description="按父权限过滤")


class PermissionResponse(BaseModel):
    """权限信息出参"""

    id: int = Field(description="权限ID")
    name: str = Field(description="权限名称")
    code: str = Field(description="权限编码")
    type: str = Field(description="类型:menu/button/api")
    parent_id: Optional[int] = Field(description="父权限ID")
    path: str = Field(description="路径")
    icon: str = Field(description="菜单图标")
    sort_order: int = Field(description="排序值")
    status: int = Field(description="状态:1-启用 0-禁用")
    created_at: datetime = Field(description="创建时间")
    updated_at: datetime = Field(description="更新时间")
