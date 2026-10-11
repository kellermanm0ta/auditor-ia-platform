from datetime import datetime

from sqlalchemy import DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, hash_id


class History(Base):
    __tablename__ = "history"

    id: Mapped[str] = hash_id("history_id_seq")
    repo: Mapped[str] = mapped_column(String(500), nullable=False)
    date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    issues: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    severity: Mapped[str] = mapped_column(String(20), nullable=False)
    agents: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    time: Mapped[str] = mapped_column(String(20), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
