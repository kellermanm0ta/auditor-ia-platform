from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.skill import SkillCreate, SkillResponse, SkillUpdate
from app.services.skill_service import SkillService

router = APIRouter(prefix="/skills", tags=["skills"])


@router.get("", response_model=list[SkillResponse])
async def list_skills(db: Session = Depends(get_db)):
    service = SkillService(db)
    return service.list_all()


@router.get("/{skill_id}", response_model=SkillResponse)
async def get_skill(skill_id: str, db: Session = Depends(get_db)):
    service = SkillService(db)
    skill = service.get(skill_id)
    if not skill:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skill not found")
    return skill


@router.post("", response_model=SkillResponse, status_code=status.HTTP_201_CREATED)
async def create_skill(data: SkillCreate, db: Session = Depends(get_db)):
    service = SkillService(db)
    return service.create(data)


@router.put("/{skill_id}", response_model=SkillResponse)
async def update_skill(skill_id: str, data: SkillUpdate, db: Session = Depends(get_db)):
    service = SkillService(db)
    skill = service.update(skill_id, data)
    if not skill:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skill not found")
    return skill


@router.delete("/{skill_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_skill(skill_id: str, db: Session = Depends(get_db)):
    service = SkillService(db)
    deleted = service.delete(skill_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skill not found")
