"""Event initialization schemas aligned with the UŁ pilot and frontend creator."""

from __future__ import annotations

from datetime import date, datetime

from pydantic import AliasChoices, Field, model_validator

from . import APIModel

from .enums import EventStatus



class PilotContext(APIModel):

    """Location-sensitive transport context for the pilot scenario."""

    city: str = "Uniwersytet \u0141ódzki, \u0141ód\u017a"

    radius_km: float = Field(default=20, gt=0, le=100)

    rail_connections: list[str] = Field(default_factory=lambda: ["Po\u0142\u0105czenia kolejowe do \u0141odzi Fabrycznej", "Godzina startu dopasowana do przyjazdu poci\u0105g\u00f3w"])

    electric_bus_connections: list[str] = Field(default_factory=lambda: ["Autobus elektryczny z dworca", "Przystanki przy miejscu wydarzenia"])

    suggested_start_time: str = Field(default="09:30", validation_alias=AliasChoices("suggested_start_time", "suggestedStartTime", "eventStart"), serialization_alias="eventStart")
    prioritize_rail: bool = True
    prioritize_electric_buses: bool = True

    incentives: list[str] = Field(default_factory=lambda: ["Zni\u017cka za dojazd transportem zbiorowym", "Wsp\u00f3lne przejazdy", "Gra dla uczestnik\u00f3w"])



class EventCreate(APIModel):

    """Payload used to initialize an event planning workspace."""

    title: str = Field(default="Wydarzenie na UŁ", min_length=1, max_length=200, validation_alias=AliasChoices("title", "name"))

    event_type: str = Field(default="Konferencja", min_length=1, max_length=100)

    raw_description: str = Field(default="Zr\u00f3wnowa\u017cone wydarzenie w pilota\u017cu U\u0141.", max_length=5000, validation_alias=AliasChoices("raw_description", "rawDescription", "description"))

    needs_venue_help: bool = False

    attendees: int = Field(default=120, gt=0, le=1_000_000)

    budget: float = Field(default=0, ge=0)

    location: str = Field(default="Uniwersytet \u0141ódzki, \u0141ód\u017a", max_length=300)

    address: str | None = Field(default=None, max_length=500)

    space_type: str | None = Field(default=None, max_length=100)

    event_date: date = Field(default_factory=lambda: date.today())

    start_at: datetime | None = None

    end_at: datetime | None = None

    participant_origins: str = "\u0141\u00f3d\u017a i okolice"

    transit_profile: list[str] = Field(default_factory=lambda: ["kolej", "autobusy elektryczne"])

    pilot: PilotContext = Field(default_factory=PilotContext)

    starting_mode: str = Field(default="needs_venue_help", validation_alias=AliasChoices("starting_mode", "startingMode", "mode"))



    @model_validator(mode="after")

    def validate_dates(self) -> "EventCreate":

        if self.start_at and self.end_at and self.end_at <= self.start_at:

            raise ValueError("end_at must be later than start_at")

        return self



class EventUpdate(APIModel):

    """Editable event setup and pilot fields."""

    title: str | None = Field(default=None, min_length=1, max_length=200)

    event_type: str | None = Field(default=None, min_length=1, max_length=100)

    raw_description: str | None = Field(default=None, max_length=5000)

    needs_venue_help: bool | None = None

    attendees: int | None = Field(default=None, gt=0, le=1_000_000)

    budget: float | None = Field(default=None, ge=0)

    location: str | None = Field(default=None, max_length=300)

    address: str | None = Field(default=None, max_length=500)

    space_type: str | None = Field(default=None, max_length=100)

    event_date: date | None = None

    start_at: datetime | None = None

    end_at: datetime | None = None

    participant_origins: str | None = None

    transit_profile: list[str] | None = None

    pilot: PilotContext | None = None

    starting_mode: str | None = None



class EventResponse(EventCreate):

    """Event representation returned by the API."""

    id: str

    status: EventStatus

    created_at: datetime

    updated_at: datetime

    selected_options: dict[str, int] = Field(default_factory=dict)



EventPatch = EventUpdate

