import json

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.config import Config, ExecutionMode
from app.models.output_format import OutputFormat
from app.models.skill import Skill
from app.schemas.config import ConfigUpdate


class ConfigService:
    def __init__(self, db: Session):
        self.db = db

    def get(self) -> Config | None:
        return self.db.scalars(select(Config)).first()

    def get_or_create_default(self) -> Config:
        config = self.get()
        if not config:
            output_format = self.db.scalars(select(OutputFormat)).first()
            skills = self.db.scalars(select(Skill)).all()
            config = Config(
                execution_mode=ExecutionMode.PARALELO.value,
                output_format_id=output_format.id if output_format else "",
                skill_ids=json.dumps([skill.id for skill in skills]),
            )
            self.db.add(config)
            self.db.commit()
            self.db.refresh(config)
        return config

    def update(self, data: ConfigUpdate) -> Config | None:
        config = self.get()
        if not config:
            return None
        vals = data.model_dump(exclude_unset=True, by_alias=False)
        if "skill_ids" in vals:
            vals["skill_ids"] = json.dumps(vals["skill_ids"])
        for field, value in vals.items():
            setattr(config, field, value)
        self.db.commit()
        self.db.refresh(config)
        return config
