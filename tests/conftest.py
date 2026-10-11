import pytest

from app.core.security import get_current_user
from app.main import app


@pytest.fixture(autouse=True)
def bypass_auth():
    """Bypass JWT validation for tests that don't exercise auth itself.

    ``tests/test_auth.py`` removes this override to assert unauthenticated
    requests are rejected; the fixture restores the previous state afterwards.
    """

    async def _fake_current_user() -> dict:
        return {"sub": "test-user", "aud": "auditoria-backend"}

    previous = app.dependency_overrides.get(get_current_user)
    app.dependency_overrides[get_current_user] = _fake_current_user
    try:
        yield
    finally:
        if previous is None:
            app.dependency_overrides.pop(get_current_user, None)
        else:
            app.dependency_overrides[get_current_user] = previous
