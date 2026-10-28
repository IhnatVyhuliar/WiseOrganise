"""FastAPI application initialization and router registration."""

import logging
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.v1.router import router as api_v1_router
from .core.config import settings
from .repositories.event_repo import close_pool, init_schema

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI):
    """Create the schema, retrying so a slow database delays startup instead of crash-looping."""

    for attempt in range(1, settings.db_connect_retries + 1):
        try:
            init_schema()
            break
        except Exception as exc:  # noqa: BLE001 - any connection failure is retried
            logger.warning("Database not ready (attempt %d/%d): %s", attempt, settings.db_connect_retries, exc)
            if attempt == settings.db_connect_retries:
                raise
            time.sleep(settings.db_connect_delay_seconds)
    yield
    close_pool()


app = FastAPI(
    title=settings.app_name,
    description="Static, strictly typed API skeleton for sustainable event planning.",
    version="1.0.0",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(api_v1_router)

__all__ = ["app"]
