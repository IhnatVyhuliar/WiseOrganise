"""Compatibility entry point for ``uvicorn main:app``."""

from backend.app.main import EVENTS_DB, app

__all__ = ["app", "EVENTS_DB"]
