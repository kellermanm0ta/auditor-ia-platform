import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app

SAMPLE = {
    "name": "AWS CloudWatch",
    "icon": "aws",
    "desc": "Monitor de logs da AWS",
    "status": "disconnected",
    "statusLabel": "Desconectado",
    "docUrl": "https://docs.aws.amazon.com/cloudwatch",
    "steps": ["Criar IAM Role", "Configurar endpoint", "Testar conexão"],
    "yaml": "aws:\n  region: us-east-1\n  log_group: /aws/lambda/*",
}


@pytest.mark.asyncio
async def test_create_integration():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post("/api/integrations", json=SAMPLE)
        integration_id = response.json().get("id")
        try:
            assert response.status_code == 201
            data = response.json()
            assert data["name"] == SAMPLE["name"]
            assert data["steps"] == SAMPLE["steps"]
            assert data["id"] is not None
            assert data["statusLabel"] == SAMPLE["statusLabel"]
        finally:
            if integration_id:
                await client.delete(f"/api/integrations/{integration_id}")


@pytest.mark.asyncio
async def test_list_integrations():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/integrations")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


@pytest.mark.asyncio
async def test_get_integration_not_found():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/integrations/nao-existe")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_update_integration():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        created = await client.post("/api/integrations", json=SAMPLE)
        integration_id = created.json()["id"]
        try:
            response = await client.put(
                f"/api/integrations/{integration_id}",
                json={
                    "name": "Azure Monitor",
                    "status": "connected",
                },
            )
            assert response.status_code == 200
            data = response.json()
            assert data["name"] == "Azure Monitor"
        finally:
            await client.delete(f"/api/integrations/{integration_id}")


@pytest.mark.asyncio
async def test_delete_integration():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        created = await client.post("/api/integrations", json=SAMPLE)
        integration_id = created.json()["id"]
        try:
            response = await client.delete(f"/api/integrations/{integration_id}")
            assert response.status_code == 204

            get_response = await client.get(f"/api/integrations/{integration_id}")
            assert get_response.status_code == 404
        finally:
            await client.delete(f"/api/integrations/{integration_id}")
