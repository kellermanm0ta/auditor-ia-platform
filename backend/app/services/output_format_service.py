from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.output_format import OutputFormat
from app.schemas.output_format import OutputFormatCreate, OutputFormatUpdate


class OutputFormatService:
    def __init__(self, db: Session):
        self.db = db

    def create(self, data: OutputFormatCreate) -> OutputFormat:
        obj = OutputFormat(**data.model_dump(by_alias=False))
        self.db.add(obj)
        self.db.commit()
        self.db.refresh(obj)
        return obj

    def list_all(self) -> list[OutputFormat]:
        return list(self.db.scalars(select(OutputFormat).order_by(OutputFormat.id)).all())

    def get(self, format_id: str) -> OutputFormat | None:
        return self.db.get(OutputFormat, format_id)

    def update(self, format_id: str, data: OutputFormatUpdate) -> OutputFormat | None:
        obj = self.db.get(OutputFormat, format_id)
        if not obj:
            return None
        vals = data.model_dump(exclude_unset=True, by_alias=False)
        for field, value in vals.items():
            setattr(obj, field, value)
        self.db.commit()
        self.db.refresh(obj)
        return obj

    def delete(self, format_id: str) -> bool:
        obj = self.db.get(OutputFormat, format_id)
        if not obj:
            return False
        self.db.delete(obj)
        self.db.commit()
        return True
