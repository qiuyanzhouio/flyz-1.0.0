from datetime import datetime
from typing import Generic, Optional, TypeVar

from pydantic import BaseModel, Field, model_validator

T = TypeVar("T")


class ApiResponse(BaseModel, Generic[T]):
    """统一 API 响应包装:code/message/data/timestamp/tip"""

    code: int = Field(default=200, description="业务状态码,200 表示成功")
    message: str = Field(default="success", description="响应信息")
    data: Optional[T] = Field(default=None, description="响应数据")
    timestamp: datetime = Field(
        default_factory=datetime.now,
        description="响应时间戳",
    )
    tip: Optional[bool] = Field(default=True, description="提示")


class PageParams(BaseModel):
    """分页查询入参:第 page 页,每页 page_size 条"""

    page: int = Field(default=1, ge=1, description="当前页码,从 1 开始")
    page_size: int = Field(
        default=10,
        ge=1,
        le=100,
        description="每页条数,1-100",
    )

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.page_size

    @property
    def limit(self) -> int:
        return self.page_size


class PageResult(BaseModel, Generic[T]):
    """分页查询结果:数据列表 + 分页信息"""

    items: list[T] = Field(description="数据列表")
    total: int = Field(description="总条数")
    page: int = Field(description="当前页码")
    page_size: int = Field(description="每页条数")
    total_pages: Optional[int] = Field(default=None, description="总页数")

    @model_validator(mode="after")
    def calc_total_pages(self) -> "PageResult":
        """未显式传 total_pages 时,根据 total/page_size 自动计算。"""
        if self.total_pages is None or self.total_pages <= 0:
            if self.page_size > 0:
                self.total_pages = (self.total + self.page_size - 1) // self.page_size
            else:
                self.total_pages = 0
        return self


class PagedResponse(ApiResponse[PageResult[T]], Generic[T]):
    """统一分页响应:等价于 ApiResponse[data=PageResult[T]]"""
    pass


class ErrorResponse(BaseModel, Generic[T]):
    """统一错误响应:等价于 ApiResponse[data=None]"""

    message: str = Field(description="响应消息")
    tip: Optional[bool] = Field(default=False, description="错误提示")


class HealthData(BaseModel):
    """健康检查响应数据。"""

    status: str = Field(description="服务状态,ok 表示正常")
    env: str = Field(description="运行环境")
