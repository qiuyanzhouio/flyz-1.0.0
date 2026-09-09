from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class DeptCreate(BaseModel):
    """创建部门请求体"""

    name: str = Field(..., max_length=64, description="部门名称", examples=["技术部"])
    code: str = Field(
        ...,
        max_length=64,
        description="部门编码(唯一)",
        examples=["tech"],
    )
    parent_id: Optional[int] = Field(
        default=None,
        ge=1,
        description="父部门 ID,根节点不填",
    )
    sort_order: Optional[int] = Field(default=0, ge=0, description="排序值")
    status: Optional[int] = Field(default=1, ge=0, le=1, description="状态:1-启用 0-禁用")


class DeptUpdate(BaseModel):
    """更新部门请求体"""

    name: Optional[str] = Field(default=None, max_length=64, description="部门名称")
    parent_id: Optional[int] = Field(default=None, ge=1, description="父部门 ID")
    sort_order: Optional[int] = Field(default=None, ge=0, description="排序值")
    status: Optional[int] = Field(default=None, ge=0, le=1, description="状态")


class DeptQuery(BaseModel):
    """部门列表筛选条件"""

    model_config = {"title": "部门列表查询参数"}

    keyword: Optional[str] = Field(
        default=None,
        max_length=64,
        description="搜索关键词(名称/编码模糊匹配)",
    )
    status: Optional[int] = Field(default=None, ge=0, le=1, description="状态过滤")
    parent_id: Optional[int] = Field(default=None, ge=1, description="按父部门过滤")


class DeptResponse(BaseModel):
    """部门信息出参"""

    id: int = Field(description="部门ID")
    name: str = Field(description="部门名称")
    code: str = Field(description="部门编码")
    parent_id: Optional[int] = Field(description="父部门ID")
    sort_order: int = Field(description="排序值")
    status: int = Field(description="状态:1-启用 0-禁用")
    created_at: datetime = Field(description="创建时间")
    updated_at: datetime = Field(description="更新时间")
