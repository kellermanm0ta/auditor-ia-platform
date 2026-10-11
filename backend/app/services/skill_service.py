from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.skill import Skill
from app.schemas.skill import SkillCreate, SkillUpdate


class SkillService:
    def __init__(self, db: Session):
        self.db = db

    def create(self, data: SkillCreate) -> Skill:
        obj = Skill(**data.model_dump(by_alias=False))
        self.db.add(obj)
        self.db.commit()
        self.db.refresh(obj)
        return obj

    def list_all(self) -> list[Skill]:
        return list(self.db.scalars(select(Skill).order_by(Skill.id)).all())

    def get(self, skill_id: str) -> Skill | None:
        return self.db.get(Skill, skill_id)

    def update(self, skill_id: str, data: SkillUpdate) -> Skill | None:
        obj = self.db.get(Skill, skill_id)
        if not obj:
            return None
        vals = data.model_dump(exclude_unset=True, by_alias=False)
        for field, value in vals.items():
            setattr(obj, field, value)
        self.db.commit()
        self.db.refresh(obj)
        return obj

    def delete(self, skill_id: str) -> bool:
        obj = self.db.get(Skill, skill_id)
        if not obj:
            return False
        self.db.delete(obj)
        self.db.commit()
        return True
