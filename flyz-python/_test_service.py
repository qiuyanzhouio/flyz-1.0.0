"""直接测试 MenuService.list_page，定位 500 根因。"""
from application.db import SessionLocal
from application.modules.menu.service import MenuService
from application.modules.permission.models import Permission

db = SessionLocal()
try:
    svc = MenuService(db)

    # 测试1: 不传 order_by
    print("=== Test 1: order_by=None ===")
    items, total = svc.list_page(page=1, page_size=10, filters=[], order_by=None)
    print(f"OK: {len(items)} items, total={total}")

    # 测试2: 传入 sort_order.asc()
    print("\n=== Test 2: order_by=Permission.sort_order.asc() ===")
    order = Permission.sort_order.asc()
    print(f"order type: {type(order)}")
    print(f"order is None: {order is None}")
    items, total = svc.list_page(page=1, page_size=10, filters=[], order_by=order)
    print(f"OK: {len(items)} items, total={total}")

    # 测试3: 模拟 router 中的调用
    print("\n=== Test 3: _default_order ===")
    order2 = Permission.sort_order.asc()
    print(f"order2 repr: {repr(order2)}")
    result = order2 if order2 is not None else Permission.id.desc()
    print(f"result type: {type(result)}")
    items, total = svc.list_page(page=1, page_size=10, filters=[], order_by=result)
    print(f"OK: {len(items)} items, total={total}")

except Exception as e:
    import traceback
    traceback.print_exc()
finally:
    db.close()
