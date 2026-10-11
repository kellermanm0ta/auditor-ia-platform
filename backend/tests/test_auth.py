import pytest
from httpx import ASGITransport, AsyncClient

from app.core.security import get_current_user
from app.main import app


@pytest.mark.asyncio
async def test_health_is_public():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/health")
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_integrations_requires_token():
    app.dependency_overrides.pop(get_current_user, None)
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/integrations")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_integrations_rejects_invalid_token():
    app.dependency_overrides.pop(get_current_user, None)
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get(
            "/api/integrations",
            headers={"Authorization": "Bearer not-a-real-token"},
        )
    assert response.status_code == 401
