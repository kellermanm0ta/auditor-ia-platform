from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.workflow_agent import (
    WorkflowAgentCreate,
    WorkflowAgentResponse,
    WorkflowAgentUpdate,
)
from app.services.workflow_agent_service import WorkflowAgentService

router = APIRouter(prefix="/workflow-agents", tags=["workflow-agents"])


@router.get("", response_model=list[WorkflowAgentResponse])
async def list_workflow_agents(db: Session = Depends(get_db)):
    service = WorkflowAgentService(db)
    return service.list_all()


@router.get("/{workflow_agent_id}", response_model=WorkflowAgentResponse)
async def get_workflow_agent(workflow_agent_id: str, db: Session = Depends(get_db)):
    service = WorkflowAgentService(db)
    agent = service.get(workflow_agent_id)
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Workflow agent not found"
        )
    return agent


@router.post("", response_model=WorkflowAgentResponse, status_code=status.HTTP_201_CREATED)
async def create_workflow_agent(data: WorkflowAgentCreate, db: Session = Depends(get_db)):
    service = WorkflowAgentService(db)
    return service.create(data)


@router.put("/{workflow_agent_id}", response_model=WorkflowAgentResponse)
async def update_workflow_agent(
    workflow_agent_id: str,
    data: WorkflowAgentUpdate,
    db: Session = Depends(get_db),
):
    service = WorkflowAgentService(db)
    agent = service.update(workflow_agent_id, data)
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Workflow agent not found"
        )
    return agent


@router.delete("/{workflow_agent_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_workflow_agent(workflow_agent_id: str, db: Session = Depends(get_db)):
    service = WorkflowAgentService(db)
    deleted = service.delete(workflow_agent_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Workflow agent not found"
        )
