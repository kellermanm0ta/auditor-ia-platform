from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI

from app.api.routes import router
from app.core.security import get_current_user
from app.db.session import engine
from app.models.base import Base


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="AuditorIA API", version="0.1.0", lifespan=lifespan)

app.include_router(router, prefix="/api", dependencies=[Depends(get_current_user)])


@app.get("/health")
async def health_check():
    return {"status": "ok"}
