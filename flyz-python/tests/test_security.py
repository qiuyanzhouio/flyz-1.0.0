"""密码哈希 + JWT 工具测试。"""
from application.core.security import hash_password, verify_password


def test_hash_password_returns_string():
    h = hash_password("test123")
    assert isinstance(h, str)
    assert len(h) > 0
    assert h.startswith("$2b$")


def test_verify_password_correct():
    h = hash_password("mysecret")
    assert verify_password("mysecret", h) is True


def test_verify_password_wrong():
    h = hash_password("mysecret")
    assert verify_password("wrongpass", h) is False


def test_hash_password_different_salts():
    h1 = hash_password("samepass")
    h2 = hash_password("samepass")
    assert h1 != h2
    assert verify_password("samepass", h1)
    assert verify_password("samepass", h2)


def test_verify_password_invalid_hash():
    """非法哈希字符串不应抛异常,返回 False 即可。"""
    assert verify_password("anything", "not-a-valid-hash") is False


def test_long_password_truncated():
    """超过 72 字节的密码会被截断,但仍能正常校验。"""
    long_pwd = "a" * 200
    h = hash_password(long_pwd)
    assert verify_password(long_pwd, h) is True
