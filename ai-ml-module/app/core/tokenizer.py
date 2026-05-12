"""Lightweight text tokenizer used by the placeholder classifier.

In production this is replaced by the HuggingFace AutoTokenizer for the
deployed multimodal model. The interface here matches the subset we use.
"""

from __future__ import annotations

import re
from collections.abc import Iterable

_WORD_RE = re.compile(r"[A-Za-z0-9']+")

# A tiny vocabulary of "manipulation markers" used purely for the demo
# heuristic. The real model learns these signals end-to-end.
_RED_FLAGS = frozenset(
    {
        "miracle",
        "guaranteed",
        "100%",
        "shocking",
        "exposed",
        "secret",
        "they",
        "won't",
        "tell",
        "you",
    }
)


class Tokenizer:
    def tokenize(self, text: str) -> list[str]:
        return [t.lower() for t in _WORD_RE.findall(text)]

    def count_red_flags(self, text: str) -> int:
        return sum(1 for t in self.tokenize(text) if t in _RED_FLAGS)

    def vocab_coverage(self, tokens: Iterable[str]) -> float:
        toks = list(tokens)
        if not toks:
            return 0.0
        known = sum(1 for t in toks if t in _RED_FLAGS or len(t) > 2)
        return known / len(toks)


tokenizer = Tokenizer()
