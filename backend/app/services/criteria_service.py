"""Neutral supplier criteria service."""
from ..mocks.knowledge_mocks import AREA_QUESTIONS, VENDOR_CRITERIA
from ..schemas import AreaVerification, CriteriaResponse, VendorCriterion

def get_criteria() -> CriteriaResponse:
    return CriteriaResponse(criteria=[VendorCriterion.model_validate(c) for c in VENDOR_CRITERIA], area_questions=[AreaVerification.model_validate(q) for q in AREA_QUESTIONS])
