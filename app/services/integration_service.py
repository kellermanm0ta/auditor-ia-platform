import json

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.integration import Integration
from app.schemas.integration import IntegrationCreate, IntegrationUpdate


class IntegrationService:
    def __init__(self, db: Session):
        self.db = db

    def create(self, data: IntegrationCreate) -> Integration:
        vals = data.model_dump(by_alias=False)
        vals["steps"] = json.dumps(vals["steps"])
        obj = Integration(**vals)
        self.db.add(obj)
        self.db.commit()
        self.db.refresh(obj)
        return obj

    def list_all(self) -> list[Integration]:
        return list(self.db.scalars(select(Integration).order_by(Integration.id)).all())

    def get(self, integration_id: str) -> Integration | None:
        return self.db.get(Integration, integration_id)

    def update(self, integration_id: str, data: IntegrationUpdate) -> Integration | None:
        obj = self.db.get(Integration, integration_id)
        if not obj:
            return None
        vals = data.model_dump(exclude_unset=True, by_alias=False)
        if "steps" in vals:
            vals["steps"] = json.dumps(vals["steps"])
        for field, value in vals.items():
            setattr(obj, field, value)
        self.db.commit()
        self.db.refresh(obj)
        return obj

    def delete(self, integration_id: str) -> bool:
        obj = self.db.get(Integration, integration_id)
        if not obj:
            return False
        self.db.delete(obj)
        self.db.commit()
        return True
