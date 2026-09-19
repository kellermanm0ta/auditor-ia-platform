from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.integration import IntegrationCreate, IntegrationResponse, IntegrationUpdate
from app.services.integration_service import IntegrationService

router = APIRouter(prefix="/integrations", tags=["integrations"])


@router.get("", response_model=list[IntegrationResponse])
async def list_integrations(db: Session = Depends(get_db)):
    service = IntegrationService(db)
    return service.list_all()


@router.get("/{integration_id}", response_model=IntegrationResponse)
async def get_integration(integration_id: str, db: Session = Depends(get_db)):
    service = IntegrationService(db)
    integration = service.get(integration_id)
    if not integration:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Integration not found")
    return integration


@router.post("", response_model=IntegrationResponse, status_code=status.HTTP_201_CREATED)
async def create_integration(data: IntegrationCreate, db: Session = Depends(get_db)):
    service = IntegrationService(db)
    return service.create(data)


@router.put("/{integration_id}", response_model=IntegrationResponse)
async def update_integration(
    integration_id: str, data: IntegrationUpdate, db: Session = Depends(get_db)
):
    service = IntegrationService(db)
    integration = service.update(integration_id, data)
    if not integration:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Integration not found")
    return integration


@router.delete("/{integration_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_integration(integration_id: str, db: Session = Depends(get_db)):
    service = IntegrationService(db)
    deleted = service.delete(integration_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Integration not found")
