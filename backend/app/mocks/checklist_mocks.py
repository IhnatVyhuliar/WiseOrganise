"""Polish static fixtures used by the API services."""

from copy import deepcopy
from typing import Any

from ..schemas.enums import ChecklistCategory

CHECKLIST_BASE: list[dict[str, Any]] = [
    {
        "id": "miejsce_01",
        "category": ChecklistCategory.VENUE,
        "question": "Czy miejsce jest dostępne pieszo lub rowerem dla uczestników?",
        "answer_type": "boolean",
        "options": [],
        "why_it_matters": "Dojazd bez samochodu ogranicza emisje związane z wydarzeniem.",
        "suggested_response": True,
        "priority": 4,
    },
    {
        "id": "catering_01",
        "category": ChecklistCategory.CATERING,
        "question": "Czy catering oferuje menu roślinne i sezonowe?",
        "answer_type": "boolean",
        "options": [],
        "why_it_matters": "Menu roślinne i sezonowe zwykle ma niższy ślad środowiskowy.",
        "suggested_response": True,
        "priority": 5,
    },
    {
        "id": "catering_02",
        "category": ChecklistCategory.CATERING,
        "question": "Jaki odsetek dań będzie roślinny?",
        "answer_type": "select",
        "options": ["0%", "25%", "50%", "75%", "100%"],
        "why_it_matters": "Większy udział dań roślinnych pomaga zmniejszyć emisje cateringu.",
        "suggested_response": "50%",
        "priority": 4,
    },
    {
        "id": "transport_01",
        "category": ChecklistCategory.TRANSPORT,
        "question": "Czy uczestnicy otrzymają informacje o transporcie publicznym?",
        "answer_type": "boolean",
        "options": [],
        "why_it_matters": "Dobra informacja ułatwia wybór transportu o mniejszej emisji.",
        "suggested_response": True,
        "priority": 4,
    },
    {
        "id": "transport_02",
        "category": ChecklistCategory.TRANSPORT,
        "question": "Jaka jest średnia odległość dojazdu uczestnika w kilometrach?",
        "answer_type": "number",
        "options": [],
        "why_it_matters": "Odległość pozwala oszacować emisje dojazdu i zaplanować wspólne przejazdy.",
        "suggested_response": 12,
        "priority": 3,
    },
    {
        "id": "promocja_01",
        "category": ChecklistCategory.PROMOTION,
        "question": "Czy materiały promocyjne będą przede wszystkim cyfrowe?",
        "answer_type": "boolean",
        "options": [],
        "why_it_matters": "Ograniczenie druku zmniejsza zużycie papieru i odpadów.",
        "suggested_response": True,
        "priority": 3,
    },
    {
        "id": "odpady_01",
        "category": ChecklistCategory.WASTE,
        "question": "Czy na miejscu będą wielorazowe naczynia i stacje do napełniania wody?",
        "answer_type": "boolean",
        "options": [],
        "why_it_matters": "Wielorazowe rozwiązania ograniczają odpady jednorazowe.",
        "suggested_response": True,
        "priority": 5,
    },
    {
        "id": "odpady_02",
        "category": ChecklistCategory.WASTE,
        "question": "Jaką wagę ma ograniczenie odpadów w Twoich priorytetach?",
        "answer_type": "priority_slider",
        "options": [],
        "why_it_matters": "Waga pomaga dopasować ranking ofert do celów wydarzenia.",
        "suggested_response": 4,
        "priority": 4,
    },
    {
        "id": "dostepnosc_01",
        "category": ChecklistCategory.ACCESSIBILITY,
        "question": "Czy miejsce i program są dostępne dla osób z różnymi potrzebami?",
        "answer_type": "boolean",
        "options": [],
        "why_it_matters": "Dostępność zapewnia równe uczestnictwo i komfort gości.",
        "suggested_response": True,
        "priority": 5,
    },
    {
        "id": "dostepnosc_02",
        "category": ChecklistCategory.ACCESSIBILITY,
        "question": "Jaki poziom wsparcia języka migowego lub napisów planujesz?",
        "answer_type": "select",
        "options": ["brak", "napisy", "tłumaczenie PJM", "napisy i PJM"],
        "why_it_matters": "Alternatywne formy komunikacji zwiększają dostępność wydarzenia.",
        "suggested_response": "napisy",
        "priority": 3,
    },
]

VENUE_HELP_QUESTIONS: list[dict[str, Any]] = [
    {
        "id": "miejsce_help_01",
        "category": ChecklistCategory.VENUE,
        "question": "Czy do miejsca można łatwo dotrzeć transportem publicznym?",
        "answer_type": "boolean",
        "options": [],
        "why_it_matters": "Bliskość przystanków pomaga ograniczyć podróże samochodem.",
        "suggested_response": True,
        "priority": 5,
    },
    {
        "id": "miejsce_help_02",
        "category": ChecklistCategory.VENUE,
        "question": "Czy przestrzeń ma dostęp do światła dziennego?",
        "answer_type": "boolean",
        "options": [],
        "why_it_matters": "Światło dzienne może ograniczyć zużycie energii podczas wydarzenia.",
        "suggested_response": True,
        "priority": 3,
    },
    {
        "id": "miejsce_help_03",
        "category": ChecklistCategory.VENUE,
        "question": "Czy miejsce ma własne wyposażenie AV na miejscu?",
        "answer_type": "boolean",
        "options": [],
        "why_it_matters": "Wyposażenie na miejscu ogranicza dodatkowy transport sprzętu.",
        "suggested_response": True,
        "priority": 3,
    },
    {
        "id": "miejsce_help_04",
        "category": ChecklistCategory.VENUE,
        "question": "Czy obiekt korzysta z energii odnawialnej lub ma jej potwierdzenie?",
        "answer_type": "select",
        "options": ["tak, potwierdzone", "częściowo", "nie wiem", "nie"],
        "why_it_matters": "Źródło energii wpływa na ślad węglowy zużycia prądu.",
        "suggested_response": "nie wiem",
        "priority": 4,
    },
]


def checklist_fixtures(needs_venue_help: bool) -> list[dict[str, Any]]:
    """Return a fresh checklist fixture for one event."""

    questions = deepcopy(CHECKLIST_BASE)
    if needs_venue_help:
        questions[0:0] = deepcopy(VENUE_HELP_QUESTIONS)
    return questions
