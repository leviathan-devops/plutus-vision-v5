#!/usr/bin/env python3
"""
e1_judge.py — THE TIE-BREAKER. The local decision model fills the residue the arithmetic cannot.

THE PURE-CODE LAW, RESTATED: the map is arithmetic. `e1_category.classify` handles the POSITIONAL
class (RES/MID/SUP) deterministically. This module is for the ONE genuinely ambiguous case the
arithmetic cannot settle — a confluent level whose character (support vs resistance) depends on
CONTEXT the price alone does not carry. It is a bounded tie-breaker, never the extractor.

THE BOUND (asserted at import): the judge is called for a SMALL number of items per week (< 10).
A pipeline that judges everything has moved the decision into the LLM — the slop this avoids.

The substrate: a local systemone/decision endpoint. When it is DOWN the judge returns
`INSUFFICIENT_BASIS` (never a guess) — the loud-fail law.

    python3 scripts/e1_judge.py --health
    python3 scripts/e1_judge.py --price 100.92 --spot 101.048 --context "swept twice last week"
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import threading
import urllib.error
import urllib.request

# the local decision endpoint (systemone/Jev substrate); overridable by env
JUDGE_URL = os.environ.get("E1_JUDGE_URL", "http://127.0.0.1:8090/v1/systemone")
JUDGE_BOUND = 10          # max judge calls per week — ENFORCED (a counter, not a doc claim)
_CALLS = {"n": 0}
# the counter is guarded: judge_level may be called CONCURRENTLY (the verboo audit found the
# read-modify-write race — two threads could both read 9, both increment, exceed the bound)
_LOCK = threading.Lock()


def reset_bound() -> None:
    """Reset the call counter. The build is ONE week per invocation, so the bound is
    per-process == per-week; a multi-week caller must call this between weeks (audit 2026-10-05)."""
    with _LOCK:
        _CALLS["n"] = 0


def calls_used() -> int:
    with _LOCK:
        return _CALLS["n"]

_CLASS_Q = {
    "id": "cls",
    "type": "choice",
    "instructions": "Given the level, spot and the context, is this level functioning as a "
                    "SUPPORT (price holds above it) or a RESISTANCE (price rejects below it)?",
    "criteria": {
        "support": "price is expected to hold above this level",
        "resistance": "price is expected to be rejected below this level",
    },
}


def health(timeout: int = 4) -> dict:
    base = JUDGE_URL.rsplit("/v1/", 1)[0]
    try:
        urllib.request.urlopen(base, timeout=timeout)
        return {"ok": True, "body": base}
    except urllib.error.HTTPError as e:            # a 404 still means the server ANSWERED
        return {"ok": True, "body": f"{base} answered HTTP {e.code}"}
    except Exception as e:
        return {"ok": False, "reason": f"{type(e).__name__}: {str(e)[:80]}"}


def judge_level(price: float, spot: float, context: str = "", timeout: int = 8) -> dict:
    """Ask the local judge. Returns {choice, confidence, basis} or
    {choice: None, basis: "INSUFFICIENT_BASIS", reason}. NEVER guesses."""
    with _LOCK:
        if _CALLS["n"] >= JUDGE_BOUND:
            return {"choice": None, "basis": "INSUFFICIENT_BASIS",
                    "reason": f"judge bound {JUDGE_BOUND}/week reached — the map is arithmetic, "
                              f"the judge is a bounded tie-breaker"}
        _CALLS["n"] += 1
    state = {"level": price, "spot": spot, "context": context}
    body = json.dumps({"questions": {_CLASS_Q["id"]: _CLASS_Q}, "state": state}).encode()
    try:
        req = urllib.request.Request(JUDGE_URL, data=body,
                                     headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=timeout) as r:
            d = json.loads(r.read())
        ans = (d.get("answers") or d).get("cls", d)
        choice = ans.get("choice")
        conf = ans.get("confidence", 0)
        # VALIDATE the choice against the contract's OWN labels — an unexpected value (uppercase,
        # a typo, an unrelated label) must NOT propagate as a trusted decision.
        allowed = set(_CLASS_Q["criteria"].keys())          # {"support", "resistance"}
        if choice not in allowed:
            return {"choice": None, "basis": "INSUFFICIENT_BASIS",
                    "reason": f"choice {choice!r} not in {sorted(allowed)}"}
        if conf < 0.6:
            return {"choice": None, "basis": "INSUFFICIENT_BASIS",
                    "reason": f"confidence {conf} below the 0.6 floor"}
        return {"choice": choice, "confidence": conf, "basis": "JUDGE"}
    except urllib.error.HTTPError as e:
        # an HTTP error (a structured body) is DISTINCT from a network failure — surface both
        try:
            _body = e.read().decode("utf-8", "replace")[:120]
        except Exception:
            _body = ""
        return {"choice": None, "basis": "INSUFFICIENT_BASIS",
                "reason": f"judge HTTP {e.code}: {_body}"}
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as e:
        return {"choice": None, "basis": "INSUFFICIENT_BASIS",
                "reason": f"judge unreachable: {type(e).__name__}: {str(e)[:70]}"}


def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--health", action="store_true")
    ap.add_argument("--price", type=float)
    ap.add_argument("--spot", type=float)
    ap.add_argument("--context", default="")
    args = ap.parse_args(argv)
    if args.health:
        h = health()
        print("judge UP" if h["ok"] else f"judge DOWN: {h.get('reason')}")
        return 0 if h["ok"] else 1
    if args.price is None or args.spot is None:
        print("need --price and --spot", file=sys.stderr)
        return 2
    r = judge_level(args.price, args.spot, args.context)
    print(json.dumps(r, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
