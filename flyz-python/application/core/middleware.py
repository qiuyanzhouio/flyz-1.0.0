"""
中间件集合。

- RequestIdMiddleware: 生成/透传请求 ID,注入响应头
- OperationLogMiddleware: 自动记录操作日志(耗时、IP、用户、结果等)
"""
import time
import uuid
from typing import Optional

from fastapi import FastAPI, Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import Message

from application.config import get_settings
from application.core.logging_config import request_id_var
from application.db import SessionLocal
from application.modules.log.models import OperationLog

# 不记录日志的路径前缀
_SKIP_PATH_PREFIXES = ("/health", "/docs", "/openapi.json", "/redoc", "/favicon.ico")

# 不记录请求体的方法
_SKIP_BODY_METHODS = ("GET", "HEAD", "OPTIONS")

# 请求体最大记录长度
_MAX_BODY_LOG_LEN = 2000


class RequestIdMiddleware(BaseHTTPMiddleware):
    """
    请求 ID 中间件。

    - 从请求头 X-Request-ID 读取(透传上游)
    - 没有则生成一个 UUID
    - 响应头返回 X-Request-ID
    - 存入 request.state.request_id 供业务代码使用
    """

    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        request.state.request_id = request_id
        # 设置到 contextvar,供日志等使用
        token = request_id_var.set(request_id)
        try:
            response = await call_next(request)
            response.headers["X-Request-ID"] = request_id
            return response
        finally:
            request_id_var.reset(token)


class OperationLogMiddleware(BaseHTTPMiddleware):
    """
    操作日志中间件。

    自动记录每个请求的:
    - 模块/操作(从 route tags/summary 推断)
    - 请求方法、路径、参数
    - 响应状态
    - 客户端 IP、UA
    - 耗时

    注意:
    - 请求体读取后会重新包装 receive 流,不影响后续路由层读取
    - 日志写入在响应返回后同步执行,失败不影响业务
    - 生产环境建议改为队列异步写入
    """

    async def dispatch(self, request: Request, call_next):
        settings = get_settings()
        if not settings.LOG_OPERATION_ENABLED:
            return await call_next(request)

        path = request.url.path
        if any(path.startswith(p) for p in _SKIP_PATH_PREFIXES):
            return await call_next(request)

        start_time = time.time()
        request_id = getattr(request.state, "request_id", "")

        # 读取并缓存请求体,然后重新包装 receive 流供下游使用
        request_body = ""
        if request.method not in _SKIP_BODY_METHODS:
            try:
                raw = await request.body()
                if raw:
                    text = raw.decode("utf-8", errors="replace")
                    if len(text) > _MAX_BODY_LOG_LEN:
                        request_body = text[:_MAX_BODY_LOG_LEN] + "...(truncated)"
                    else:
                        request_body = text
                # 关键:重新包装 receive,让路由层能正常读取 body
                request = _clone_request_with_body(request, raw)
            except Exception:
                request_body = "(read failed)"

        response = await call_next(request)
        cost_ms = int((time.time() - start_time) * 1000)

        # 从 route 提取模块名和操作名
        module, action = self._extract_route_info(request)

        # 写日志(同步,失败不影响主流程)
        self._write_log(
            request=request,
            response=response,
            request_id=request_id,
            module=module,
            action=action,
            params=request_body or str(request.query_params),
            cost_ms=cost_ms,
        )

        return response

    @staticmethod
    def _extract_route_info(request: Request) -> tuple[str, str]:
        """从路由信息推断模块和操作名。"""
        route = request.scope.get("route")
        if route is None:
            return "未知", request.method

        tags = getattr(route, "tags", []) or []
        summary = getattr(route, "summary", "") or request.method
        module = tags[0] if tags else "其他"
        return module, summary

    @staticmethod
    def _write_log(
        *,
        request: Request,
        response: Response,
        request_id: str,
        module: str,
        action: str,
        params: str,
        cost_ms: int,
    ) -> None:
        """同步写操作日志(独立 session,失败不影响主流程)。"""
        try:
            db = SessionLocal()
            try:
                # 用户信息在中间件层拿不到(依赖注入在路由层执行),留空
                # 如需记录用户,可在路由层通过 request.state.current_user 设置
                user_id: Optional[int] = None
                username = ""

                status = 1 if response.status_code < 400 else 0

                log = OperationLog(
                    user_id=user_id,
                    username=username,
                    module=module,
                    action=action,
                    method=request.method,
                    path=request.url.path,
                    params=params,
                    result=str(response.status_code),
                    status=status,
                    ip=request.client.host if request.client else "",
                    user_agent=request.headers.get("user-agent", ""),
                    cost_ms=cost_ms,
                )
                db.add(log)
                db.commit()
            finally:
                db.close()
        except Exception:
            # 日志写入失败不影响业务
            pass


def _clone_request_with_body(request: Request, body: bytes) -> Request:
    """
    用缓存的 body 重新构造 Request,使下游可以再次读取。

    原理:替换 request.scope 中的 receive 为一个立即返回 body 的函数。
    """
    received = False

    async def receive() -> Message:
        nonlocal received
        if received:
            return {"type": "http.disconnect"}
        received = True
        return {
            "type": "http.request",
            "body": body,
            "more_body": False,
        }

    return Request(request.scope, receive=receive)


def register_middlewares(app: FastAPI) -> None:
    """注册所有中间件(注意顺序:先注册的在外层)。"""
    app.add_middleware(RequestIdMiddleware)
    app.add_middleware(OperationLogMiddleware)
