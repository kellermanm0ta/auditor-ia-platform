from datetime import datetime

from pydantic import BaseModel
from pydantic.alias_generators import to_camel


class WorkflowAgentBase(BaseModel):
    model_config = {"alias_generator": to_camel, "populate_by_name": True}

    nome: str
    depende_de: str | None = None


class WorkflowAgentCreate(WorkflowAgentBase):
    pass


class WorkflowAgentUpdate(BaseModel):
    model_config = {"alias_generator": to_camel, "populate_by_name": True}

    nome: str | None = None
    depende_de: str | None = None


class WorkflowAgentResponse(WorkflowAgentBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = {"alias_generator": to_camel, "populate_by_name": True, "from_attributes": True}
