from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.config import ConfigResponse, ConfigUpdate
from app.services.config_service import ConfigService

router = APIRouter(prefix="/config", tags=["config"])


@router.get("", response_model=ConfigResponse)
async def get_config(db: Session = Depends(get_db)):
    service = ConfigService(db)
    config = service.get_or_create_default()
    return config


@router.put("", response_model=ConfigResponse)
async def update_config(data: ConfigUpdate, db: Session = Depends(get_db)):
    service = ConfigService(db)
    config = service.update(data)
    if not config:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Config not found")
    return config
