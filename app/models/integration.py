from datetime import datetime

from sqlalchemy import DateTime, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, hash_id


class Integration(Base):
    __tablename__ = "integrations"

    id: Mapped[str] = hash_id("integrations_id_seq")
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    icon: Mapped[str] = mapped_column(String(50), nullable=False)
    desc: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="disconnected")
    status_label: Mapped[str] = mapped_column(String(100), nullable=False)
    doc_url: Mapped[str] = mapped_column(String(500), nullable=False)
    steps: Mapped[str] = mapped_column(Text, nullable=False)
    yaml: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
