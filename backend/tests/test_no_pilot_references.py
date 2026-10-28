"""Sweep: no backend file may name the pilot university or its city."""
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[1]

# Literal terms; each is also checked in its \uXXXX-escaped spelling.
_LITERAL = ("UŁ", "Uniwersytet", "Łód", "Łod", "Lodz", "uczeln")


def _escaped(term: str) -> str:
    return "".join(f"\\u{ord(c):04x}" if ord(c) > 127 else c for c in term)


FORBIDDEN = tuple(_LITERAL) + tuple(_escaped(t) for t in _LITERAL if _escaped(t) != t)


def _files():
    yield from BACKEND.glob("app/**/*.py")
    yield from BACKEND.glob("prompts/**/*.md")
    yield from BACKEND.glob("*.md")


def test_no_backend_file_mentions_the_pilot_university():
    hits = []
    for path in _files():
        text = path.read_text(encoding="utf-8-sig")
        for term in FORBIDDEN:
            if term in text:
                hits.append((str(path.relative_to(BACKEND)), term))
    assert hits == []
