"""JWT 令牌工具测试。"""
from datetime import timedelta

from application.core.security import create_access_token, decode_token


def test_create_and_decode_token():
    token = create_access_token(subject=42)
    assert isinstance(token, str)
    assert len(token) > 0

    payload = decode_token(token)
    assert payload["sub"] == "42"
    assert "exp" in payload
    assert payload["type"] == "access"


def test_decode_invalid_token_raises():
    from jose import JWTError

    try:
        decode_token("not-a-valid-token")
        assert False, "应该抛出 JWTError"
    except JWTError:
        pass


def test_token_with_custom_expires_delta():
    token = create_access_token(subject=1, expires_delta=timedelta(minutes=60))
    payload = decode_token(token)
    assert payload["sub"] == "1"


def test_token_with_extra_claims():
    token = create_access_token(subject=1, extra={"role": "admin"})
    payload = decode_token(token)
    assert payload["role"] == "admin"
