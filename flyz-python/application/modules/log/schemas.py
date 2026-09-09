from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class LogQuery(BaseModel):
    """操作日志筛选条件"""

    model_config = {"title": "操作日志查询参数"}

    keyword: Optional[str] = Field(default=None, max_length=64, description="用户名/模块模糊匹配")
    user_id: Optional[int] = Field(default=None, ge=1, description="按用户ID过滤")
    module: Optional[str] = Field(default=None, max_length=64, description="按模块过滤")
    status: Optional[int] = Field(default=None, ge=0, le=1, description="状态过滤:1-成功 0-失败")
    start_time: Optional[datetime] = Field(default=None, description="起始时间(包含)")
    end_time: Optional[datetime] = Field(default=None, description="截止时间(包含)")


class LogResponse(BaseModel):
    """操作日志出参"""

    id: int = Field(description="日志ID")
    user_id: Optional[int] = Field(description="操作用户ID")
    username: str = Field(description="操作用户名")
    module: str = Field(description="业务模块")
    action: str = Field(description="操作类型")
    method: str = Field(description="HTTP 方法")
    path: str = Field(description="请求路径")
    status: int = Field(description="状态:1-成功 0-失败")
    ip: str = Field(description="客户端 IP")
    cost_ms: int = Field(description="耗时(毫秒)")
    created_at: datetime = Field(description="创建时间")


class LogDetail(LogResponse):
    """操作日志详情(出参):在基础字段上额外暴露 params/result/user_agent"""

    params: str = Field(description="请求参数")
    result: str = Field(description="响应结果")
    user_agent: str = Field(description="浏览器 UA")
