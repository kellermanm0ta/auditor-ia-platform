from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.history import History
from app.schemas.history import HistoryCreate, HistoryUpdate


class HistoryService:
    def __init__(self, db: Session):
        self.db = db

    def create(self, data: HistoryCreate) -> History:
        obj = History(**data.model_dump(by_alias=False))
        self.db.add(obj)
        self.db.commit()
        self.db.refresh(obj)
        return obj

    def list_all(self) -> list[History]:
        return list(self.db.scalars(select(History).order_by(History.id)).all())

    def get(self, history_id: str) -> History | None:
        return self.db.get(History, history_id)

    def update(self, history_id: str, data: HistoryUpdate) -> History | None:
        obj = self.db.get(History, history_id)
        if not obj:
            return None
        vals = data.model_dump(exclude_unset=True, by_alias=False)
        for field, value in vals.items():
            setattr(obj, field, value)
        self.db.commit()
        self.db.refresh(obj)
        return obj

    def delete(self, history_id: str) -> bool:
        obj = self.db.get(History, history_id)
        if not obj:
            return False
        self.db.delete(obj)
        self.db.commit()
        return True
