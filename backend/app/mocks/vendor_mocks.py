"""Compatibility fixture exposing neutral supplier categories only."""
from copy import deepcopy
from ..mocks.knowledge_mocks import EVENT_AREAS

def vendor_fixtures() -> dict[str, list[dict]]:
    return {area["name"]: [{"vendor_id": f"neutral-category-{area['id']}", "name": f"Neutralna kategoria dostawcy: {area['name']}"}] for area in deepcopy(EVENT_AREAS)}
