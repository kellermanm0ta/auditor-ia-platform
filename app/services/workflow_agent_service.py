from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.workflow_agent import WorkflowAgent
from app.schemas.workflow_agent import WorkflowAgentCreate, WorkflowAgentUpdate


class WorkflowAgentService:
    def __init__(self, db: Session):
        self.db = db

    def create(self, data: WorkflowAgentCreate) -> WorkflowAgent:
        vals = data.model_dump(by_alias=False)
        obj = WorkflowAgent(**vals)
        self.db.add(obj)
        self.db.commit()
        self.db.refresh(obj)
        return obj

    def list_all(self) -> list[WorkflowAgent]:
        return list(self.db.scalars(select(WorkflowAgent).order_by(WorkflowAgent.id)).all())

    def get(self, workflow_agent_id: int) -> WorkflowAgent | None:
        return self.db.get(WorkflowAgent, workflow_agent_id)

    def update(self, workflow_agent_id: int, data: WorkflowAgentUpdate) -> WorkflowAgent | None:
        obj = self.db.get(WorkflowAgent, workflow_agent_id)
        if not obj:
            return None
        vals = data.model_dump(exclude_unset=True, by_alias=False)
        for field, value in vals.items():
            setattr(obj, field, value)
        self.db.commit()
        self.db.refresh(obj)
        return obj

    def delete(self, workflow_agent_id: int) -> bool:
        obj = self.db.get(WorkflowAgent, workflow_agent_id)
        if not obj:
            return False
        self.db.delete(obj)
        self.db.commit()
        return True
