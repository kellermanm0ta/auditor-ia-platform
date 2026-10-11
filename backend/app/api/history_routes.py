from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.history import HistoryCreate, HistoryResponse, HistoryUpdate
from app.services.history_service import HistoryService

router = APIRouter(prefix="/history", tags=["history"])


@router.get("", response_model=list[HistoryResponse])
async def list_history(db: Session = Depends(get_db)):
    service = HistoryService(db)
    return service.list_all()


@router.get("/{history_id}", response_model=HistoryResponse)
async def get_history(history_id: str, db: Session = Depends(get_db)):
    service = HistoryService(db)
    entry = service.get(history_id)
    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="History entry not found")
    return entry


@router.post("", response_model=HistoryResponse, status_code=status.HTTP_201_CREATED)
async def create_history(data: HistoryCreate, db: Session = Depends(get_db)):
    service = HistoryService(db)
    return service.create(data)


@router.put("/{history_id}", response_model=HistoryResponse)
async def update_history(history_id: str, data: HistoryUpdate, db: Session = Depends(get_db)):
    service = HistoryService(db)
    entry = service.update(history_id, data)
    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="History entry not found")
    return entry


@router.delete("/{history_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_history(history_id: str, db: Session = Depends(get_db)):
    service = HistoryService(db)
    deleted = service.delete(history_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="History entry not found")
