from enum import Enum

from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, hash_id


class ExecutionMode(str, Enum):
    PARALELO = "PARALELO"
    SERIE = "SERIE"


class Config(Base):
    __tablename__ = "config"

    id: Mapped[str] = hash_id("config_id_seq")
    execution_mode: Mapped[str] = mapped_column(
        String(20), nullable=False, default=ExecutionMode.PARALELO.value
    )
    output_format_id: Mapped[str] = mapped_column(String(32), nullable=False)
    skill_ids: Mapped[str] = mapped_column(Text, nullable=False)
