from fastapi import APIRouter

from app.api.config_routes import router as config_router
from app.api.history_routes import router as history_router
from app.api.integration_routes import router as integration_router
from app.api.output_format_routes import router as output_format_router
from app.api.skill_routes import router as skill_router
from app.api.workflow_agent_routes import router as workflow_agent_router

router = APIRouter()
router.include_router(integration_router)
router.include_router(skill_router)
router.include_router(workflow_agent_router)
router.include_router(output_format_router)
router.include_router(history_router)
router.include_router(config_router)
