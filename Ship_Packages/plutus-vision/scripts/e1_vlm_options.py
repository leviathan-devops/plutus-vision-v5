#!/usr/bin/env python3
"""
e1_vlm_options.py — THE ONE MODEL CALL. The CME option-chain image -> structured strikes.

THE PURE-CODE LAW: this is the ONLY place in the whole pipeline a model is called. Everything
else is arithmetic. The model reads ONE thing — the option-chain image — and the rest of the map
is computed, not inferred by an LLM.

THE ANTI-FABRICATION GUARD (the operator's worst failure — a fabricated level on a chart):
`parse_strikes` returns [] on ANY unparseable output; the caller records `[NO DATA]`. A malformed
model answer NEVER becomes a fabricated strike.

THE AUTH PROBE: before any call, ping :4171/health. A silent-auth green is the #1 false-green —
a dead arm must read DEAD, never empty-but-OK.

    python3 scripts/e1_vlm_options.py --health        # the auth probe (exit 0 if the arm answers)
    python3 scripts/e1_vlm_options.py --week 2026-07-06
"""

from __future__ import annotations

import argparse
import json
import math
import re
import sys
import urllib.request

ARM = "http://127.0.0.1:4171"

STRIKE_EXTRACT_PROMPT = (
    "Extract the option strike table from this image as JSON. "
    'Return ONLY a JSON array of objects {"price": <float>, "vol": <float>}. '
    "If the image contains no strike table, return []."
)


class ArmDead(Exception):
    """The arm did not answer the health/auth probe. A DEAD arm is DEAD — not empty, not OK."""


def health(timeout: int = 5) -> dict:
    """The auth probe — the arm must ANSWER with a model list on GET /v1/models (the local
    llama-server's endpoint; NOT /health), not merely have a port open. `urlopen` raises
    HTTPError on any non-2xx, so a 401/403/500 never reaches the body read."""
    try:
        req = urllib.request.Request(ARM + "/v1/models")
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return {"ok": True, "body": r.read().decode("utf-8", "replace")}   # full body (not 400B)
    except Exception as e:
        raise ArmDead(f"VLM_ARM_DEAD: {type(e).__name__}: {str(e)[:80]}") from e


def parse_strikes(resp: dict) -> list:
    """Extract the strike array from a chat-completion response. ANY failure -> [].
    A malformed answer is NOT a fabricated strike."""
    try:
        if not resp.get("choices"):              # an empty choices list is a malformed answer -> []
            return []
        txt = resp["choices"][0]["message"]["content"]
        m = re.search(r"\[.*\]", txt, re.S)
        if not m:
            return []
        rows = json.loads(m.group(0))
        out = []
        for row in rows:
            p, v = row.get("price"), row.get("vol")
            # reject bool (isinstance(True,int) is True) and non-finite (NaN/Inf parse) — EITHER
            # would become a FABRICATED strike, the operator's worst failure.
            if (isinstance(p, (int, float)) and not isinstance(p, bool) and math.isfinite(p)
                    and isinstance(v, (int, float)) and not isinstance(v, bool) and math.isfinite(v)):
                out.append({"price": float(p), "vol": float(v), "label": "VLM"})
        return out
    except Exception:
        return []


def harvest(week: str, timeout: int = 30) -> list:
    """Fetch the chain image and ask the arm. Raises ArmDead when the arm is down; returns []
    when the arm answered but the image had no table (the caller reads [] as [NO DATA])."""
    health()                                     # the auth probe FIRST
    img = _fetch_chain_image(week)
    if not img:
        return []
    payload = {
        "model": "trident-v1-vision",
        "messages": [{"role": "user", "content": [
            {"type": "text", "text": STRIKE_EXTRACT_PROMPT},
            {"type": "image_url", "image_url": {"url": img}},
        ]}],
    }
    req = urllib.request.Request(ARM + "/v1/chat/completions",
                                 data=json.dumps(payload).encode(),
                                 headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return parse_strikes(json.loads(r.read()))
    except Exception as e:
        raise ArmDead(f"VLM_ARM_DEAD: {type(e).__name__}: {str(e)[:80]}") from e


def _fetch_chain_image(week: str) -> str:
    """The chain image source (S3's fetch). NOT YET WIRED -> '' , which harvest() reads as
    'arm answered, no table to read' -> [] -> [NO DATA]. Honest until the source exists."""
    return ""


def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--health", action="store_true")
    ap.add_argument("--week", default="2026-07-06")
    args = ap.parse_args(argv)
    if args.health:
        try:
            h = health()
            print("VLM arm UP:", h["body"][:120])
            return 0
        except ArmDead as e:
            print(str(e), file=sys.stderr)
            return 1
    try:
        strikes = harvest(args.week)
        print(json.dumps(strikes, indent=2) if strikes else "[NO DATA] — the arm answered, no table")
        return 0
    except ArmDead as e:
        # a dead arm is [NO DATA] for the PIPELINE (e1_sources catches it), but the standalone
        # CLI must be LOUD — exit 2 so a caller can tell a dead arm from a successful-but-empty run.
        print(f"[NO DATA] {e}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
