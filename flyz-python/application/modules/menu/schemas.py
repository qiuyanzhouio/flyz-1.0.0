"""菜单相关请求/响应模型。"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class MenuItem(BaseModel):
    """菜单项(树形结构)。"""

    id: int = Field(description="菜单ID")
    name: str = Field(description="菜单名称")
    code: str = Field(description="菜单编码")
    path: str = Field(description="前端路由路径")
    icon: str = Field(description="菜单图标")
    sort_order: int = Field(description="排序值")
    parent_id: Optional[int] = Field(description="父菜单ID")
    children: list["MenuItem"] = Field(default_factory=list, description="子菜单列表")


MenuItem.model_rebuild()


class MenuCreate(BaseModel):
    """创建菜单请求体"""

    name: str = Field(..., max_length=64, description="菜单名称", examples=["用户管理"])
    code: str = Field(
        ...,
        max_length=128,
        description="菜单编码(唯一)",
        examples=["system:user"],
    )
    parent_id: Optional[int] = Field(default=None, ge=1, description="父菜单ID")
    path: Optional[str] = Field(default="", max_length=255, description="前端路由路径")
    icon: Optional[str] = Field(default="", max_length=64, description="菜单图标")
    sort_order: Optional[int] = Field(default=0, ge=0, description="排序值")
    status: Optional[int] = Field(default=1, ge=0, le=1, description="状态:1-启用 0-禁用")


class MenuUpdate(BaseModel):
    """更新菜单请求体"""

    name: Optional[str] = Field(default=None, max_length=64, description="菜单名称")
    parent_id: Optional[int] = Field(default=None, ge=1, description="父菜单ID")
    path: Optional[str] = Field(default=None, max_length=255, description="前端路由路径")
    icon: Optional[str] = Field(default=None, max_length=64, description="菜单图标")
    sort_order: Optional[int] = Field(default=None, ge=0, description="排序值")
    status: Optional[int] = Field(default=None, ge=0, le=1, description="状态:1-启用 0-禁用")


class MenuQuery(BaseModel):
    """菜单列表筛选条件"""

    model_config = {"title": "菜单列表查询参数"}

    keyword: Optional[str] = Field(default=None, max_length=64, description="名称/编码模糊匹配")
    status: Optional[int] = Field(default=None, ge=0, le=1, description="状态过滤")
    parent_id: Optional[int] = Field(default=None, ge=1, description="按父菜单过滤")


class MenuResponse(BaseModel):
    """菜单信息出参"""

    id: int = Field(description="菜单ID")
    name: str = Field(description="菜单名称")
    code: str = Field(description="菜单编码")
    parent_id: Optional[int] = Field(description="父菜单ID")
    path: str = Field(description="前端路由路径")
    icon: str = Field(description="菜单图标")
    sort_order: int = Field(description="排序值")
    status: int = Field(description="状态:1-启用 0-禁用")
    created_at: datetime = Field(description="创建时间")
    updated_at: datetime = Field(description="更新时间")
