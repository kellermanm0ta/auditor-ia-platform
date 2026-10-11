import json
from typing import Literal

from pydantic import BaseModel, field_validator
from pydantic.alias_generators import to_camel

ExecutionMode = Literal["PARALELO", "SERIE"]


class ConfigBase(BaseModel):
    model_config = {"alias_generator": to_camel, "populate_by_name": True}

    execution_mode: ExecutionMode = "PARALELO"
    output_format_id: str
    skill_ids: list[str]


class ConfigUpdate(BaseModel):
    model_config = {"alias_generator": to_camel, "populate_by_name": True}

    execution_mode: ExecutionMode | None = None
    output_format_id: str | None = None
    skill_ids: list[str] | None = None


class ConfigResponse(ConfigBase):
    id: str

    model_config = {"alias_generator": to_camel, "populate_by_name": True, "from_attributes": True}

    @field_validator("skill_ids", mode="before")
    @classmethod
    def parse_skill_ids(cls, v):
        if isinstance(v, str):
            return json.loads(v)
        return v
