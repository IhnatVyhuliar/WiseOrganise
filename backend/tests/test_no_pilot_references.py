"""Sweep: no backend file may name the pilot university or its city."""
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[1]

# Literal terms; each is also checked in its \uXXXX-escaped spelling.
_LITERAL = ("UŁ", "Uniwersytet", "Łód", "Łod", "Lodz", "uczeln")


def _spellings(term: str) -> set[str]:
    """Every literal/escaped permutation of the non-ASCII letters of a term.

    Source files here mix both styles inside one string (an escaped capital
    letter followed by a literal accented one), so all combinations count.
    """
    positions = [i for i, c in enumerate(term) if ord(c) > 127]
    out = set()
    for mask in range(1 << len(positions)):
        chars = list(term)
        for bit, i in enumerate(positions):
            if mask >> bit & 1:
                chars[i] = f"\\u{ord(term[i]):04x}"
        out.add("".join(chars))
    return out


FORBIDDEN = tuple(sorted({s for t in _LITERAL for s in _spellings(t)}))


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
