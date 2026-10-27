"""Prompt assembly for every Gemini call.

Single place where the fixed knowledge base is turned into model context, so
the "AI only assembles, never invents" rule is enforceable in one file.
"""
from __future__ import annotations
from pathlib import Path
import json
from typing import Any

_PROMPT_DIR = Path(__file__).parents[2] / "prompts" / "v1"


def prompt_text(name: str) -> str:
    """Read a versioned prompt template."""
    return (_PROMPT_DIR / name).read_text(encoding="utf-8")


def _event_block(event: dict[str, Any]) -> str:
    return f"EVENT DATA (untrusted):\n{json.dumps(event, default=str, ensure_ascii=False)}"


def build_eguide_prompt(event: dict[str, Any]) -> str:
    """Context for compiling the personalized organizer guide."""
    return f"{prompt_text('generate_eguide.md')}\nSOURCE_IDS: mentor-summary-pdf, wiseorganise-knowledge-v1\n{_event_block(event)}"


def build_vendor_prompt(event: dict[str, Any]) -> str:
    """Context for neutral supplier-category criteria."""
    return f"{prompt_text('vendor_criteria.md')}\n{_event_block(event)}"


def build_analyze_prompt(event: dict[str, Any]) -> str:
    """Context for the legacy conditional checklist."""
    return f"{prompt_text('analyze_event.md')}\n{_event_block(event)}"
