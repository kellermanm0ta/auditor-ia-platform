from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.output_format import OutputFormatCreate, OutputFormatResponse, OutputFormatUpdate
from app.services.output_format_service import OutputFormatService

router = APIRouter(prefix="/output-formats", tags=["output-formats"])


@router.get("", response_model=list[OutputFormatResponse])
async def list_output_formats(db: Session = Depends(get_db)):
    service = OutputFormatService(db)
    return service.list_all()


@router.get("/{format_id}", response_model=OutputFormatResponse)
async def get_output_format(format_id: str, db: Session = Depends(get_db)):
    service = OutputFormatService(db)
    fmt = service.get(format_id)
    if not fmt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Output format not found")
    return fmt


@router.post("", response_model=OutputFormatResponse, status_code=status.HTTP_201_CREATED)
async def create_output_format(data: OutputFormatCreate, db: Session = Depends(get_db)):
    service = OutputFormatService(db)
    return service.create(data)


@router.put("/{format_id}", response_model=OutputFormatResponse)
async def update_output_format(
    format_id: str, data: OutputFormatUpdate, db: Session = Depends(get_db)
):
    service = OutputFormatService(db)
    fmt = service.update(format_id, data)
    if not fmt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Output format not found")
    return fmt


@router.delete("/{format_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_output_format(format_id: str, db: Session = Depends(get_db)):
    service = OutputFormatService(db)
    deleted = service.delete(format_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Output format not found")
