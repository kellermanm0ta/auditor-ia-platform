from pydantic import BaseModel
from pydantic.alias_generators import to_camel


class OutputFormatBase(BaseModel):
    model_config = {"alias_generator": to_camel, "populate_by_name": True}

    value: str
    label: str


class OutputFormatCreate(OutputFormatBase):
    pass


class OutputFormatUpdate(BaseModel):
    model_config = {"alias_generator": to_camel, "populate_by_name": True}

    value: str | None = None
    label: str | None = None


class OutputFormatResponse(OutputFormatBase):
    id: str

    model_config = {"alias_generator": to_camel, "populate_by_name": True, "from_attributes": True}
