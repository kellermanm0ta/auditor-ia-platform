import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app

SAMPLE = {
    "nome": "orquestrador",
    "dependeDe": None,
}

SAMPLE_CHILD = {
    "nome": "Analise de Seguranca",
    "dependeDe": None,
}


@pytest.mark.asyncio
async def test_create_workflow_agent():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post("/api/workflow-agents", json=SAMPLE)
    assert response.status_code == 201
    data = response.json()
    assert data["nome"] == SAMPLE["nome"]
    assert data["dependeDe"] is None
    assert data["id"] is not None


@pytest.mark.asyncio
async def test_list_workflow_agents():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/workflow-agents")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


@pytest.mark.asyncio
async def test_get_workflow_agent_not_found():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/workflow-agents/9999")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_update_workflow_agent():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        created = await client.post("/api/workflow-agents", json=SAMPLE)
        agent_id = created.json()["id"]

        response = await client.put(
            f"/api/workflow-agents/{agent_id}",
            json={"nome": "orquestrador v2"},
        )
    assert response.status_code == 200
    data = response.json()
    assert data["nome"] == "orquestrador v2"


@pytest.mark.asyncio
async def test_delete_workflow_agent():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        created = await client.post("/api/workflow-agents", json=SAMPLE)
        agent_id = created.json()["id"]

        response = await client.delete(f"/api/workflow-agents/{agent_id}")
        assert response.status_code == 204

        get_response = await client.get(f"/api/workflow-agents/{agent_id}")
        assert get_response.status_code == 404


@pytest.mark.asyncio
async def test_create_with_parent():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        parent = await client.post("/api/workflow-agents", json=SAMPLE)
        parent_id = parent.json()["id"]

        child_data = SAMPLE_CHILD.copy()
        child_data["dependeDe"] = parent_id
        response = await client.post("/api/workflow-agents", json=child_data)
    assert response.status_code == 201
    data = response.json()
    assert data["dependeDe"] == parent_id
