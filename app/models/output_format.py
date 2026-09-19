from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, hash_id


class OutputFormat(Base):
    __tablename__ = "output_formats"

    id: Mapped[str] = hash_id("output_formats_id_seq")
    value: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    label: Mapped[str] = mapped_column(String(100), nullable=False)
