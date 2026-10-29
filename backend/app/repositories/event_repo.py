"""PostgreSQL repository: one ``events`` row per event, the record kept as JSONB."""

from __future__ import annotations

import json
import secrets
import string
from contextlib import contextmanager
from copy import deepcopy
from datetime import date, datetime, timezone
from enum import Enum
from typing import Any, Iterator
from uuid import uuid4

from psycopg import Connection
from psycopg_pool import ConnectionPool

from ..core.config import settings


_SCHEMA = """
CREATE TABLE IF NOT EXISTS events (
    id         TEXT PRIMARY KEY,
    slug       TEXT UNIQUE,
    payload    JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS events_slug_idx ON events (slug);
"""

# Payload fields stored as ISO strings and revived to objects on read, so callers
# keep seeing the dict shape the in-memory repository used to hand out.
_DATETIME_FIELDS = ("created_at", "updated_at", "start_at", "end_at")
_DATE_FIELDS = ("event_date",)

_pool = ConnectionPool(settings.database_url, min_size=1, max_size=10, open=False)


def _json_default(value: Any) -> Any:
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, Enum):
        return value.value
    raise TypeError(f"Object of type {type(value).__name__} is not JSON serializable")


def _dump(event: dict[str, Any]) -> str:
    return json.dumps(event, default=_json_default, ensure_ascii=False)


def _revive(payload: dict[str, Any]) -> dict[str, Any]:
    """Turn the stored ISO strings back into datetime/date objects."""

    for key in _DATETIME_FIELDS:
        if isinstance(payload.get(key), str):
            payload[key] = datetime.fromisoformat(payload[key])
    for key in _DATE_FIELDS:
        if isinstance(payload.get(key), str):
            payload[key] = date.fromisoformat(payload[key])
    return payload


def utc_now() -> datetime:
    """Return a timezone-aware UTC timestamp."""

    return datetime.now(timezone.utc)


@contextmanager
def connection() -> Iterator[Connection]:
    """Yield a pooled connection that commits on success (test and maintenance support)."""

    with _pool.connection() as conn:
        yield conn


def init_schema() -> None:
    """Open the pool and create the schema idempotently."""

    try:
        _pool.open(wait=True, timeout=settings.db_connect_delay_seconds * 5)
        with _pool.connection() as conn:
            conn.execute(_SCHEMA)
    except Exception:
        # A pool that timed out while opening is closed for good; rebuild it so
        # the caller can retry with a fresh one.
        reset_pool()
        raise


def reset_pool() -> None:
    """Close the pool and build a fresh one (simulates a process restart in tests)."""

    global _pool
    _pool.close()
    _pool = ConnectionPool(settings.database_url, min_size=1, max_size=10, open=False)


def close_pool() -> None:
    """Dispose the pool on application shutdown."""

    _pool.close()


def _upsert(event: dict[str, Any]) -> None:
    with _pool.connection() as conn:
        conn.execute(
            """
            INSERT INTO events (id, slug, payload, created_at, updated_at)
            VALUES (%s, %s, %s::jsonb, %s, %s)
            ON CONFLICT (id) DO UPDATE
               SET slug = EXCLUDED.slug,
                   payload = EXCLUDED.payload,
                   updated_at = EXCLUDED.updated_at
            """,
            (
                event["id"],
                event.get("slug"),
                _dump(event),
                event.get("created_at") or utc_now(),
                event.get("updated_at") or utc_now(),
            ),
        )


def merge_event_fields(event_id: str, fields: dict[str, Any], *, expect_run_id: str | None = None) -> bool:
    """Merge a few top-level payload fields in one statement; return whether a row changed.

    ``save_event`` writes back the whole snapshot its caller read, so a slow
    writer (the background AI pass, the suggestion cache) would revert every
    concurrent edit made in the meantime. This merge touches only the keys it
    is given. With ``expect_run_id`` the write also lands only while the stored
    generation nonce still matches, so a superseded job writes nothing at all.
    """

    now = utc_now()
    payload = {**fields, "updated_at": now}
    clause = " AND payload->>'eguide_run_id' = %s" if expect_run_id is not None else ""
    params: list[Any] = [_dump(payload), now, event_id]
    if expect_run_id is not None:
        params.append(expect_run_id)
    with _pool.connection() as conn:
        return (
            conn.execute(
                "UPDATE events SET payload = payload || %s::jsonb, updated_at = %s "
                f"WHERE id = %s{clause}",
                tuple(params),
            ).rowcount
            > 0
        )


_SLUG_ALPHABET = string.ascii_lowercase + string.digits
_SLUG_LENGTH = 8
_SLUG_ATTEMPTS = 5


def _new_slug() -> str:
    """Return an unused short slug, retrying a few times on collision."""

    for _ in range(_SLUG_ATTEMPTS):
        candidate = "".join(secrets.choice(_SLUG_ALPHABET) for _ in range(_SLUG_LENGTH))
        if not slug_exists(candidate):
            return candidate
    raise RuntimeError("Could not allocate a unique event slug")


def create_event_record(data: dict[str, Any]) -> dict[str, Any]:
    """Create and persist a new draft event."""

    event_id = str(uuid4())
    now = utc_now()
    event = deepcopy(data)
    event.update(
        {
            "id": event_id,
            "slug": _new_slug(),
            "status": "draft",
            "created_at": now,
            "updated_at": now,
            "checklist": None,
            "weights": {"w_eco": 0.4, "w_trust": 0.35, "w_cost": 0.25},
            "recommendations": {},
            "eguide": None,
            "selected_options": {},
            "options": None,
        }
    )
    _upsert(event)
    return event


def ensure_slug(event: dict[str, Any]) -> dict[str, Any]:
    """Give a record stored before slugs existed a slug, and persist it."""

    if not event.get("slug"):
        event["slug"] = _new_slug()
        save_event(event)
    return event


def _fetch_one(where: str, param: str) -> dict[str, Any] | None:
    with _pool.connection() as conn:
        row = conn.execute(f"SELECT payload FROM events WHERE {where} = %s", (param,)).fetchone()
    return _revive(row[0]) if row else None


def get_event(event_id: str) -> dict[str, Any] | None:
    """Return a fresh copy of the event record when its identifier exists."""

    return _fetch_one("id", event_id)


def get_event_by_slug(slug: str) -> dict[str, Any] | None:
    """Return the event with this slug, if any."""

    return _fetch_one("slug", slug)


def slug_exists(slug: str) -> bool:
    """Report whether a slug is already taken."""

    with _pool.connection() as conn:
        return conn.execute("SELECT 1 FROM events WHERE slug = %s", (slug,)).fetchone() is not None


def list_events() -> list[dict[str, Any]]:
    """Return all stored event records in creation order."""

    with _pool.connection() as conn:
        rows = conn.execute("SELECT payload FROM events ORDER BY created_at, id").fetchall()
    return [_revive(row[0]) for row in rows]


def save_event(event: dict[str, Any]) -> dict[str, Any]:
    """Persist an existing event and refresh its timestamp."""

    event["updated_at"] = utc_now()
    _upsert(event)
    return event


def delete_event(event_id: str) -> bool:
    """Delete an event and report whether it existed."""

    with _pool.connection() as conn:
        return conn.execute("DELETE FROM events WHERE id = %s", (event_id,)).rowcount > 0
