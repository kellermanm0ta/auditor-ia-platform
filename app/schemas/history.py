from datetime import datetime

from pydantic import BaseModel
from pydantic.alias_generators import to_camel


class HistoryBase(BaseModel):
    model_config = {"alias_generator": to_camel, "populate_by_name": True}

    repo: str
    date: datetime
    issues: int = 0
    severity: str
    agents: int = 0
    time: str


class HistoryCreate(HistoryBase):
    pass


class HistoryUpdate(BaseModel):
    model_config = {"alias_generator": to_camel, "populate_by_name": True}

    repo: str | None = None
    date: datetime | None = None
    issues: int | None = None
    severity: str | None = None
    agents: int | None = None
    time: str | None = None


class HistoryResponse(HistoryBase):
    id: str
    created_at: datetime

    model_config = {"alias_generator": to_camel, "populate_by_name": True, "from_attributes": True}
