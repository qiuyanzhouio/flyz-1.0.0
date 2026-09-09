"""操作日志路由(基于 BaseCRUDRouter,只读模式)。

基类提供: GET /{id} 详情
本模块注册: GET / 分页列表(返回精简字段 LogResponse)
"""
from fastapi import Depends
from sqlalchemy import and_, or_

from application.core.base.router import BaseCRUDRouter
from application.core.base.schemas import PageParams, PagedResponse
from application.core.base.service import BaseService
from application.modules.log.models import OperationLog
from application.modules.log.schemas import LogDetail, LogQuery, LogResponse
from application.modules.log.service import LogService


class LogCRUDRouter(BaseCRUDRouter[None, None, LogDetail, LogQuery]):
    """日志路由基类:详情返回完整字段 LogDetail。"""

    def _build_filters(self, params: LogQuery) -> list:
        filters: list = []
        if params.user_id is not None:
            filters.append(OperationLog.user_id == params.user_id)
        if params.module:
            filters.append(OperationLog.module == params.module)
        if params.status is not None:
            filters.append(OperationLog.status == params.status)
        if params.keyword:
            like = f"%{params.keyword}%"
            filters.append(
                or_(
                    OperationLog.username.like(like),
                    OperationLog.module.like(like),
                    OperationLog.path.like(like),
                )
            )
        time_range = []
        if params.start_time is not None:
            time_range.append(OperationLog.created_at >= params.start_time)
        if params.end_time is not None:
            time_range.append(OperationLog.created_at <= params.end_time)
        if time_range:
            filters.append(and_(*time_range))
        return filters

    def _default_order(self, service: BaseService) -> any:
        return OperationLog.created_at.desc()


base = LogCRUDRouter(
    prefix="/logs",
    tags=["操作日志"],
    service_class=LogService,
    response_schema=LogDetail,
    query_schema=LogQuery,
    entity_name="日志",
    enable_list=False,  # 列表接口自己注册(返回精简字段 LogResponse)
)

router = base.router


@router.get(
    "",
    response_model=PagedResponse[LogResponse],
    summary="操作日志列表(分页)",
)
def list_logs(
    page: PageParams = Depends(),
    params: LogQuery = Depends(),
    service: LogService = Depends(base._get_service),
):
    filters = base._build_filters(params)
    items, total = service.list_page(
        page=page.page,
        page_size=page.page_size,
        filters=filters,
        order_by=OperationLog.created_at.desc(),
    )
    return {
        "data": {
            "items": items,
            "total": total,
            "page": page.page,
            "page_size": page.page_size,
        }
    }
