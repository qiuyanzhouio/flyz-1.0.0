"""统一响应 schema 测试。"""
import pytest
from pydantic import ValidationError

from application.core.base.schemas import (
    ApiResponse,
    ErrorResponse,
    PageParams,
    PageResult,
    PagedResponse,
)


def test_api_response_basic():
    resp = ApiResponse[int](data=42)
    assert resp.code == 0
    assert resp.message == "success"
    assert resp.data == 42
    assert resp.tip is True  # 默认 tip=True


def test_api_response_custom_message():
    resp = ApiResponse[str](message="自定义消息", data="ok")
    assert resp.message == "自定义消息"
    assert resp.data == "ok"


def test_error_response():
    err = ErrorResponse[None](message="出错了", tip=True)
    assert err.message == "出错了"
    assert err.tip is True


def test_error_response_default_tip():
    err = ErrorResponse[None](message="错误")
    assert err.tip is False  # ErrorResponse 默认 tip=False


def test_page_params_defaults():
    p = PageParams()
    assert p.page == 1
    assert p.page_size == 10


def test_page_params_offset_limit():
    p = PageParams(page=3, page_size=20)
    assert p.offset == 40
    assert p.limit == 20


def test_page_params_invalid_page():
    with pytest.raises(ValidationError):
        PageParams(page=0)


def test_page_params_invalid_page_size():
    with pytest.raises(ValidationError):
        PageParams(page_size=0)


def test_page_params_page_size_too_large():
    with pytest.raises(ValidationError):
        PageParams(page_size=200)


def test_page_result():
    items = [1, 2, 3]
    result = PageResult[int](items=items, total=100, page=2, page_size=10)
    assert result.items == items
    assert result.total == 100
    assert result.page == 2
    assert result.page_size == 10
    assert result.total_pages == 10  # 100/10 = 10


def test_page_result_total_pages_calc():
    result = PageResult[int](items=[1, 2], total=5, page=1, page_size=2)
    assert result.total_pages == 3  # ceil(5/2) = 3


def test_paged_response():
    result = PageResult[int](items=[1, 2], total=2, page=1, page_size=10)
    resp = PagedResponse[int](data=result)
    assert resp.code == 0
    assert resp.data.total == 2
    assert len(resp.data.items) == 2
