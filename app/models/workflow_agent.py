from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, hash_id


class WorkflowAgent(Base):
    __tablename__ = "workflow_agents"

    id: Mapped[str] = hash_id("workflow_agents_id_seq")
    nome: Mapped[str] = mapped_column(String(255), nullable=False)
    depende_de: Mapped[str | None] = mapped_column(
        String(32), ForeignKey("workflow_agents.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    dependents: Mapped[list["WorkflowAgent"]] = relationship(
        back_populates="parent", foreign_keys="WorkflowAgent.depende_de"
    )
    parent: Mapped["WorkflowAgent | None"] = relationship(
        back_populates="dependents", foreign_keys=[depende_de], remote_side="WorkflowAgent.id"
    )
