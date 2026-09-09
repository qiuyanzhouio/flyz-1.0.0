"""菜单业务层。"""
from sqlalchemy import and_, or_, select
from sqlalchemy.orm import Session

from application.core.base.service import (
    BaseService,
    ConflictException,
    ValidationException,
)
from application.modules.auth.deps import is_super_admin
from application.modules.permission.models import Permission
from application.modules.role.models import Role
from application.modules.user.models import User


class MenuService(BaseService[Permission]):
    """菜单业务层。

    菜单复用 permissions 表(type=menu),CRUD 时自动过滤 type=menu。
    """

    model = Permission

    # ============================================================
    # 覆盖基类方法:自动追加 type=menu 过滤
    # ============================================================

    def _where(self, filters=None) -> list:
        where_clause = super()._where(filters)
        where_clause.append(Permission.type == Permission.TYPE_MENU)
        return where_clause

    # ============================================================
    # CRUD
    # ============================================================

    def create(self, **kwargs):
        """创建菜单(code 唯一 + 父菜单存在性校验)。"""
        code = kwargs.get("code")
        if code and self.exists(field_values={Permission.code: code}):
            raise ConflictException(f"菜单编码 {code} 已存在")

        parent_id = kwargs.get("parent_id")
        if parent_id is not None and self.get_by_id(parent_id) is None:
            raise ValidationException(f"父菜单 {parent_id} 不存在")

        kwargs["type"] = Permission.TYPE_MENU
        kwargs.setdefault("path", "")
        kwargs.setdefault("icon", "")
        kwargs.setdefault("sort_order", 0)
        kwargs.setdefault("status", 1)
        return super().create(**kwargs)

    def update(self, instance, **kwargs):
        """更新菜单(父菜单不能是自己 + 父菜单存在性校验)。"""
        parent_id = kwargs.get("parent_id")
        if parent_id is not None:
            if parent_id == instance.id:
                raise ValidationException("父菜单不能是自己")
            if self.get_by_id(parent_id) is None:
                raise ValidationException(f"父菜单 {parent_id} 不存在")
        return super().update(instance, **kwargs)

    def delete(self, instance, soft: bool = True):
        """删除菜单(软删除),有子菜单时禁止。"""
        has_children = self.exists(field_values={Permission.parent_id: instance.id})
        if has_children:
            raise ValidationException("存在子菜单,无法删除")
        return super().delete(instance, soft=soft)

    # ============================================================
    # 查询方法
    # ============================================================

    def query_menus(
        self,
        page: int,
        page_size: int,
        keyword: str | None = None,
        status: int | None = None,
        parent_id: int | None = None,
    ) -> tuple[list[Permission], int]:
        """菜单条件查询 + 分页。"""
        filters = []
        if status is not None:
            filters.append(Permission.status == status)
        if parent_id is not None:
            filters.append(Permission.parent_id == parent_id)
        if keyword:
            like = f"%{keyword}%"
            filters.append(or_(Permission.name.like(like), Permission.code.like(like)))
        return self.list_page(
            page=page,
            page_size=page_size,
            filters=filters,
            order_by=Permission.sort_order.asc(),
        )

    def get_user_menu_tree(self, user: User) -> list[dict]:
        """
        获取当前用户的菜单树(基于角色关联的 menu 类型权限)。

        超级管理员直接返回全部启用的菜单;
        其他用户只返回其角色关联的启用菜单,按 sort_order 排序,组装为树形结构。
        """
        # 超级管理员:拥有全部菜单
        if is_super_admin(user):
            return self.get_all_menu_tree()

        role_ids = [role.id for role in user.roles if role.status == 1]
        if not role_ids:
            return []

        stmt = (
            select(Permission)
            .join(Permission.roles)
            .where(
                and_(
                    Role.id.in_(role_ids),
                    Permission.type == Permission.TYPE_MENU,
                    Permission.status == 1,
                    Permission.is_deleted.is_(False),
                )
            )
            .order_by(Permission.sort_order.asc(), Permission.id.asc())
            .distinct()
        )
        menus = list(self.db.execute(stmt).scalars().all())
        return self._build_tree(menus)

    def get_all_menu_tree(self) -> list[dict]:
        """获取全部启用的菜单树(用于菜单管理)。"""
        stmt = (
            select(Permission)
            .where(
                and_(
                    Permission.type == Permission.TYPE_MENU,
                    Permission.status == 1,
                    Permission.is_deleted.is_(False),
                )
            )
            .order_by(Permission.sort_order.asc(), Permission.id.asc())
        )
        menus = list(self.db.execute(stmt).scalars().all())
        return self._build_tree(menus)

    # ============================================================
    # 内部工具
    # ============================================================

    def _build_tree(self, menus: list[Permission]) -> list[dict]:
        """将扁平菜单列表组装为树形结构。"""
        menu_map: dict[int, dict] = {}
        for m in menus:
            menu_map[m.id] = {
                "id": m.id,
                "name": m.name,
                "code": m.code,
                "path": m.path,
                "icon": m.icon,
                "sort_order": m.sort_order,
                "parent_id": m.parent_id,
                "children": [],
            }

        roots: list[dict] = []
        for item in menu_map.values():
            parent_id = item["parent_id"]
            if parent_id is None or parent_id not in menu_map:
                roots.append(item)
            else:
                menu_map[parent_id]["children"].append(item)

        return roots
