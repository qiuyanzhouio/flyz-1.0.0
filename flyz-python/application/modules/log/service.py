from sqlalchemy import and_, or_

from application.core.base.service import BaseService
from application.modules.log.models import OperationLog
from application.modules.log.schemas import LogQuery


class LogService(BaseService[OperationLog]):
    """操作日志业务层(只读,不暴露 create/update/delete)"""

    model = OperationLog

    def query_logs(
        self,
        page: int,
        page_size: int,
        params: LogQuery,
    ) -> tuple[list[OperationLog], int]:
        """日志条件查询 + 分页(按 created_at 倒序)。"""
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

        return self.list_page(
            page=page,
            page_size=page_size,
            filters=filters,
            order_by=OperationLog.created_at.desc(),
        )
