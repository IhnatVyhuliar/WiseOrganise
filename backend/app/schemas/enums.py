"""Enumerations shared by the sustainable event planning API."""

from enum import Enum



class EventStatus(str, Enum):

    DRAFT = "draft"

    CHECKLIST_PENDING = "checklist_pending"

    OPTIONS_PENDING = "options_pending"

    GUIDE_READY = "guide_ready"

    RECOMMENDED = "recommended"



class LifecycleStage(str, Enum):

    BEFORE = "Przed"

    DURING = "W trakcie"

    AFTER = "Po"



class AreaId(str, Enum):

    TRANSPORT = "dojazd"

    ACCOMMODATION = "zakwaterowanie"

    CATERING = "catering"

    MATERIALS = "materialy"

    SWAG = "gadzety"

    STAFF = "ludzie"

    AFTER_EVENT = "po-wydarzeniu"



class SixR(str, Enum):

    THINK = "Przemyśl"

    REFUSE = "Rezygnuj"

    REDUCE = "Ograniczaj"

    REUSE = "Używaj ponownie"

    REPAIR = "Naprawiaj"

    RECYCLE = "Recykling"



class CostEffect(str, Enum):

    SAVES = "Obniża koszt"

    NO_EXTRA_COST = "Bez dodatkowych kosztów"

    BUDGET_REQUIRED = "Wymaga budżetu"

    DEPENDS_ON_OFFER = "Zależy od oferty"

    TEAM_TIME = "Wymaga czasu zespołu"



class Category(str, Enum):

    VENUE = "Miejsce"

    CATERING = "Catering"

    TRANSPORT = "Transport"

    MATERIALS = "Materiały"

    SWAG = "Gadżety"

    STAFF = "Ludzie"

    ACCOMMODATION = "Zakwaterowanie"

    AFTER_EVENT = "Po wydarzeniu"

    PROMOTION = "Materiały promocyjne"

    WASTE = "Odpady"

    ACCESSIBILITY = 'Dostępność'



ChecklistCategory = Category



class AnswerType(str, Enum):

    BOOLEAN = "boolean"

    SELECT = "select"

    NUMBER = "number"

    PRIORITY_SLIDER = "priority_slider"



class VerificationStatus(str, Enum):

    CERTIFIED = "certified"

    PROTOCOL = "protocol"

    UNVERIFIED = "unverified"



class FlagColor(str, Enum):

    GREEN = "green"

    YELLOW = "yellow"

    RED = "red"



class Milestone(str, Enum):

    T_MINUS_60 = "T-60"

    T_MINUS_30 = "T-30"

    T_MINUS_7 = "T-7"

    T_ZERO = "T-0"

    T_PLUS_7 = "T+7"

