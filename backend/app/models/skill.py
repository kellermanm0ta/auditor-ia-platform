from sqlalchemy import Boolean, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, hash_id


class Skill(Base):
    __tablename__ = "skills"

    id: Mapped[str] = hash_id("skills_id_seq")
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    icon: Mapped[str] = mapped_column(String(50), nullable=False)
    desc: Mapped[str] = mapped_column(Text, nullable=False)
    enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    prompt: Mapped[str] = mapped_column(Text, nullable=False)
