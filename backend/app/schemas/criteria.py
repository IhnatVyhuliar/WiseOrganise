"""Neutral supplier criteria schemas; no brand promotion or ranking."""

from __future__ import annotations

from pydantic import AliasChoices, Field

from . import APIModel

from .enums import AreaId



class VendorCriterion(APIModel):

    name: str

    jak_sprawdzic: str = Field(validation_alias=AliasChoices("jak_sprawdzic", "jakSprawdzic", "howToVerify"), serialization_alias="howToVerify")

    sygnal_ostrzegawczy: str = Field(validation_alias=AliasChoices("sygnal_ostrzegawczy", "sygnalOstrzegawczy", "warning"), serialization_alias="warning")



class AreaCriterion(APIModel):

    """A supplier criterion written for one lifecycle area.

    Narrower than :class:`VendorCriterion`, which stays the universal list, and
    it names the evidence to ask for instead of only how to verify.
    """

    name: str

    jak_sprawdzic: str = Field(validation_alias=AliasChoices("jak_sprawdzic", "jakSprawdzic", "howToVerify"), serialization_alias="howToVerify")

    dowod: str = Field(validation_alias=AliasChoices("dowod", "evidence"), serialization_alias="evidence")

    sygnal_ostrzegawczy: str = Field(validation_alias=AliasChoices("sygnal_ostrzegawczy", "sygnalOstrzegawczy", "warning"), serialization_alias="warning")



class AreaCriteria(APIModel):

    """The criteria that apply to one lifecycle area."""

    area_id: AreaId

    area_name: str = Field(serialization_alias="areaName")

    criteria: list[AreaCriterion] = Field(default_factory=list)



class AreaVerification(APIModel):

    area_id: AreaId

    area_name: str = Field(serialization_alias="areaName")

    pytania_do_dostawcy: list[str] = Field(default_factory=list, serialization_alias="pytaniaDoDostawcy")



class CriteriaResponse(APIModel):

    criteria: list[VendorCriterion]

    area_questions: list[AreaVerification] = Field(serialization_alias="areaQuestions")

    no_vendor_promotion: bool = Field(default=True, serialization_alias="noVendorPromotion")



class ContractClause(APIModel):

    kind: str

    text: str

