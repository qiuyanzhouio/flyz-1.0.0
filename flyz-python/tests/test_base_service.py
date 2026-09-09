"""BaseService CRUD 基础测试。

注意:测试模型类名不以 Test 开头,避免 pytest 误识别为测试类。
"""
import pytest
from sqlalchemy import Boolean, String, select
from sqlalchemy.orm import Mapped, mapped_column

from application.core.base.model import BaseModel, SoftDeleteMixin, TimestampMixin
from application.core.base.service import (
    BaseService,
    ConflictException,
    ServiceException,
)


# 测试用模型(类名不以 Test 开头,避免 pytest 误收集)
class SampleModel(BaseModel, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "sample_items"

    name: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)
    value: Mapped[str] = mapped_column(String(128), nullable=False, default="")
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)


class SampleService(BaseService[SampleModel]):
    model = SampleModel


@pytest.fixture(autouse=True)
def _setup_table(db):
    """每个测试前创建测试表,测试后删除。"""
    SampleModel.__table__.create(bind=db.bind, checkfirst=True)
    yield
    SampleModel.__table__.drop(bind=db.bind, checkfirst=True)


def test_create(db):
    svc = SampleService(db)
    item = svc.create(name="hello", value="world")
    assert item.id is not None
    assert item.name == "hello"
    assert item.value == "world"
    assert item.is_deleted is False
    assert item.created_at is not None


def test_get_by_id(db):
    svc = SampleService(db)
    item = svc.create(name="a", value="1")
    fetched = svc.get_by_id(item.id)
    assert fetched is not None
    assert fetched.name == "a"


def test_get_by_id_not_found(db):
    svc = SampleService(db)
    assert svc.get_by_id(999) is None


def test_get_by_id_or_404(db):
    svc = SampleService(db)
    with pytest.raises(ServiceException) as exc_info:
        svc.get_by_id(999, or_404=True, message="不存在")
    assert exc_info.value.status_code == 404
    assert "不存在" in exc_info.value.message


def test_update(db):
    svc = SampleService(db)
    item = svc.create(name="a", value="1")
    updated = svc.update(item, value="2")
    assert updated.value == "2"
    fetched = svc.get_by_id(item.id)
    assert fetched.value == "2"


def test_update_ignores_none(db):
    svc = SampleService(db)
    item = svc.create(name="a", value="1")
    updated = svc.update(item, value=None)
    assert updated.value == "1"  # None 不更新


def test_soft_delete(db):
    svc = SampleService(db)
    item = svc.create(name="a", value="1")
    svc.delete(item, soft=True)
    # 软删除后默认查询不到(走 _where 过滤)
    fetched = svc.get_by_id(item.id)
    assert fetched is None
    # 直接查数据库确认 is_deleted=True
    raw = db.execute(select(SampleModel).where(SampleModel.id == item.id)).scalar_one()
    assert raw.is_deleted is True


def test_physical_delete(db):
    svc = SampleService(db)
    item = svc.create(name="a", value="1")
    svc.delete(item, soft=False)
    # 物理删除,直接查也没有
    raw = db.execute(select(SampleModel).where(SampleModel.id == item.id)).scalar_one_or_none()
    assert raw is None


def test_exists(db):
    svc = SampleService(db)
    svc.create(name="unique", value="v")
    assert svc.exists(field_values={SampleModel.name: "unique"}) is True
    assert svc.exists(field_values={SampleModel.name: "other"}) is False


def test_get_all(db):
    svc = SampleService(db)
    for i in range(5):
        svc.create(name=f"item_{i}", value=f"val_{i}")
    items = svc.get_all()
    assert len(items) == 5


def test_get_all_with_filters(db):
    svc = SampleService(db)
    svc.create(name="a", value="1")
    svc.create(name="b", value="2")
    items = svc.get_all(filters=[SampleModel.value == "1"])
    assert len(items) == 1
    assert items[0].name == "a"


def test_list_page(db):
    svc = SampleService(db)
    for i in range(15):
        svc.create(name=f"item_{i}", value=f"val_{i}")

    items, total = svc.list_page(page=1, page_size=10)
    assert total == 15
    assert len(items) == 10

    items2, _ = svc.list_page(page=2, page_size=10)
    assert len(items2) == 5


def test_list_page_no_count(db):
    svc = SampleService(db)
    for i in range(5):
        svc.create(name=f"item_{i}", value=f"val_{i}")

    items, total = svc.list_page(page=1, page_size=10, count=False)
    assert total == -1
    assert len(items) == 5


def test_create_with_unique_conflict(db):
    svc = SampleService(db)
    svc.create_with_unique(
        data={"name": "only", "value": "v1"},
        unique_fields={SampleModel.name: "名称已存在"},
    )
    with pytest.raises(ConflictException, match="名称已存在"):
        svc.create_with_unique(
            data={"name": "only", "value": "v2"},
            unique_fields={SampleModel.name: "名称已存在"},
        )


def test_create_with_unique_before_hook(db):
    svc = SampleService(db)

    def _before(data):
        data["value"] = "hooked"
        return data

    item = svc.create_with_unique(
        data={"name": "test", "value": "original"},
        before_create=_before,
    )
    assert item.value == "hooked"


def test_update_by_id_with_unique(db):
    svc = SampleService(db)
    item = svc.create(name="a", value="1")
    svc.create(name="b", value="2")

    # 更新为已存在的 name 应该报错
    with pytest.raises(ConflictException):
        svc.update_by_id_with_unique(
            item.id,
            data={"name": "b"},
            unique_fields={SampleModel.name: "名称已存在"},
        )

    # 更新自身 name 不变应该通过
    updated = svc.update_by_id_with_unique(
        item.id,
        data={"name": "a", "value": "new"},
        unique_fields={SampleModel.name: "名称已存在"},
    )
    assert updated.value == "new"


def test_delete_by_id(db):
    svc = SampleService(db)
    item = svc.create(name="a", value="1")
    svc.delete_by_id(item.id)
    assert svc.get_by_id(item.id) is None  # 软删除,默认查不到


def test_delete_by_id_not_found(db):
    svc = SampleService(db)
    with pytest.raises(ServiceException) as exc_info:
        svc.delete_by_id(999, not_found_msg="不存在")
    assert exc_info.value.status_code == 404


def test_delete_by_id_before_hook(db):
    svc = SampleService(db)
    item = svc.create(name="a", value="1")

    deleted_items = []

    def _before(instance):
        deleted_items.append(instance.name)

    svc.delete_by_id(item.id, before_delete=_before)
    assert deleted_items == ["a"]


def test_bulk_create(db):
    svc = SampleService(db)
    svc.bulk_create([
        {"name": "a", "value": "1"},
        {"name": "b", "value": "2"},
        {"name": "c", "value": "3"},
    ])
    items = svc.get_all()
    assert len(items) == 3


def test_bulk_update(db):
    svc = SampleService(db)
    a = svc.create(name="a", value="1")
    b = svc.create(name="b", value="2")

    svc.bulk_update([
        {"id": a.id, "value": "10"},
        {"id": b.id, "value": "20"},
    ])

    assert svc.get_by_id(a.id).value == "10"
    assert svc.get_by_id(b.id).value == "20"


def test_bulk_delete_soft(db):
    svc = SampleService(db)
    a = svc.create(name="a", value="1")
    b = svc.create(name="b", value="2")
    c = svc.create(name="c", value="3")

    svc.bulk_delete([a.id, b.id], soft=True)

    # a 和 b 软删除查不到,c 还在
    assert svc.get_by_id(a.id) is None
    assert svc.get_by_id(b.id) is None
    assert svc.get_by_id(c.id) is not None
