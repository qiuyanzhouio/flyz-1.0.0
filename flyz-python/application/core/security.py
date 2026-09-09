"""
安全相关工具:密码哈希、JWT 签发/校验等。
"""
from datetime import datetime, timedelta
from typing import Any, Optional

import bcrypt
from jose import JWTError, jwt

from application.config import get_settings

# ============================================================
# 密码哈希(直接用 bcrypt,绕过 passlib 版本兼容问题)
# ============================================================

# bcrypt 工作因子,值越大越慢越安全,默认 12
_BCRYPT_ROUNDS = 12


def hash_password(raw: str) -> str:
    """明文密码 → bcrypt 哈希字符串。"""
    # bcrypt 要求 bytes,且最大 72 字节,超出部分自动截断
    raw_bytes = raw.encode("utf-8")[:72]
    salt = bcrypt.gensalt(rounds=_BCRYPT_ROUNDS)
    hashed = bcrypt.hashpw(raw_bytes, salt)
    return hashed.decode("utf-8")


def verify_password(raw: str, hashed: str) -> bool:
    """校验明文密码与哈希是否匹配。"""
    try:
        raw_bytes = raw.encode("utf-8")[:72]
        hashed_bytes = hashed.encode("utf-8")
        return bcrypt.checkpw(raw_bytes, hashed_bytes)
    except (ValueError, TypeError):
        # 哈希格式错误等情况,直接返回 False
        return False


# ============================================================
# JWT
# ============================================================

ALGORITHM = "HS256"


def create_access_token(
    subject: str | int,
    *,
    expires_delta: Optional[timedelta] = None,
    extra: Optional[dict[str, Any]] = None,
) -> str:
    """
    签发访问令牌。

    Args:
        subject: 主体标识(通常是 user_id)
        expires_delta: 过期时长,默认取配置
        extra: 额外载荷字段
    """
    settings = get_settings()
    expire = datetime.utcnow() + (
        expires_delta or timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    payload: dict[str, Any] = {
        "sub": str(subject),
        "exp": expire,
        "type": "access",
    }
    if extra:
        payload.update(extra)
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict[str, Any]:
    """
    解析 JWT,失败抛 JWTError。

    Returns:
        解码后的 payload dict
    """
    settings = get_settings()
    return jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[ALGORITHM])
