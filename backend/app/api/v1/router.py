"""Version one router aggregation."""

from fastapi import APIRouter

from .endpoints.events import router as events_router
from ...mocks.knowledge_mocks import knowledge_base, ORGANIZER_CHECKLIST, TEAM_ROLES
from ...schemas import APIModel
from ...schemas.event import PilotContext


router = APIRouter(prefix="/api/v1")
router.include_router(events_router)


@router.get("/reference-data", tags=["reference"], response_model=dict)
def reference_data_endpoint() -> dict:
    """Return the complete team-maintained Polish knowledge base."""

    data = knowledge_base()
    data.update(
        {
            "organizer_checklist": ORGANIZER_CHECKLIST,
            "team_roles": TEAM_ROLES,
            "default_pilot": PilotContext().model_dump(by_alias=True),
            "source_ids": ["mentor-summary-pdf", "wiseorganise-knowledge-v1"],
        }
    )
    return data
