from pydantic import BaseModel
from pydantic.alias_generators import to_camel


class SkillBase(BaseModel):
    model_config = {"alias_generator": to_camel, "populate_by_name": True}

    name: str
    icon: str
    desc: str
    enabled: bool = False
    prompt: str


class SkillCreate(SkillBase):
    pass


class SkillUpdate(BaseModel):
    model_config = {"alias_generator": to_camel, "populate_by_name": True}

    name: str | None = None
    icon: str | None = None
    desc: str | None = None
    enabled: bool | None = None
    prompt: str | None = None


class SkillResponse(SkillBase):
    id: str

    model_config = {"alias_generator": to_camel, "populate_by_name": True, "from_attributes": True}
