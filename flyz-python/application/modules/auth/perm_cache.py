"""
用户权限缓存(Redis)。

缓存用户的权限编码集合,避免每次请求都遍历 roles+permissions。

缓存键: perm:user:{user_id}
缓存值: 权限编码集合(用 Redis Set 存储)
过期时间: 30 分钟

如果 Redis 不可用,自动降级为直接查数据库。
"""
import json
from typing import Optional

from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from application.config import get_settings
from application.modules.permission.models import Permission
from application.modules.user.models import User

try:
    import redis

    _REDIS_AVAILABLE = True
except ImportError:
    _REDIS_AVAILABLE = False


_CACHE_KEY_PREFIX = "perm:user:"
_CACHE_TTL_SECONDS = 1800  # 30 分钟

_redis_client: Optional["redis.Redis"] = None


def _get_redis() -> Optional["redis.Redis"]:
    """懒加载 Redis 客户端,失败返回 None(降级为直查 DB)。"""
    global _redis_client
    if not _REDIS_AVAILABLE:
        return None

    settings = get_settings()
    if not settings.REDIS_URL:
        return None

    if _redis_client is None:
        try:
            _redis_client = redis.Redis.from_url(
                settings.REDIS_URL,
                decode_responses=True,
                socket_connect_timeout=2,
                socket_timeout=2,
            )
            # 测试连接
            _redis_client.ping()
        except Exception:
            _redis_client = None

    return _redis_client


def _load_permissions_from_db(db: Session, user_id: int) -> set[str]:
    """从数据库加载用户的所有权限编码。"""
    user = db.execute(
        select(User).where(User.id == user_id)
    ).scalar_one_or_none()
    if user is None:
        return set()

    settings = get_settings()

    # 超级管理员:拥有全部启用状态的权限编码
    is_superadmin = any(
        role.code == settings.SUPER_ADMIN_ROLE_CODE and role.status == 1
        for role in user.roles
    )
    if is_superadmin:
        stmt = select(Permission.code).where(
            and_(
                Permission.status == 1,
                Permission.is_deleted.is_(False),
            )
        )
        return set(db.execute(stmt).scalars().all())

    perm_set: set[str] = set()
    for role in user.roles:
        if role.status != 1:
            continue
        for perm in role.permissions:
            if perm.status == 1:
                perm_set.add(perm.code)
    return perm_set


def get_user_permissions(db: Session, user_id: int) -> set[str]:
    """
    获取用户的权限编码集合。

    优先从 Redis 缓存读取,缓存未命中则查 DB 并回写缓存。
    Redis 不可用时直接查 DB。
    """
    r = _get_redis()
    cache_key = f"{_CACHE_KEY_PREFIX}{user_id}"

    if r is not None:
        try:
            cached = r.get(cache_key)
            if cached is not None:
                return set(json.loads(cached))
        except Exception:
            # Redis 异常,降级为直查
            pass

    # 查数据库
    perm_set = _load_permissions_from_db(db, user_id)

    # 回写缓存
    if r is not None:
        try:
            r.setex(cache_key, _CACHE_TTL_SECONDS, json.dumps(list(perm_set)))
        except Exception:
            pass

    return perm_set


def invalidate_user_permissions(user_id: int) -> None:
    """
    清除用户权限缓存(用户角色/权限变更时调用)。
    """
    r = _get_redis()
    if r is None:
        return
    try:
        r.delete(f"{_CACHE_KEY_PREFIX}{user_id}")
    except Exception:
        pass
