"""FastAPI application initialization and router registration."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.v1.router import router as api_v1_router
from .core.config import settings
from .repositories.memory_repo import EVENTS_DB


app = FastAPI(
    title=settings.app_name,
    description="Static, strictly typed API skeleton for sustainable event planning.",
    version="1.0.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(api_v1_router)

__all__ = ["app", "EVENTS_DB"]
