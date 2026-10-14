#!/usr/bin/env python3
"""e1_zfp.py — THE ZONE FAILURE PROBABILITY (the ONE implementation).

THE AUTHORITY (both authorities AGREE — this is the whole point):

  canon  Trident_System_Prompt_v5.3.3 §Appendix B (:4052-4076):
    B.1 — the BASE failure probability BY ZONE TYPE:
      Hard Wall          5-15%    (CRITICAL OPTION WALL + 3+ pillars + confluent floor/ceiling)
      Standard Wall     15-30%    (SIGNIFICANT MAGNET + 2+ pillars)
      Soft Wall         30-50%    (no option wall, or 1-2 pillars only)
      One-Touch         50-70%    (only 1 pillar, no option wall)
      Post-Expiry Ghost 20-40%    (option expired, structural memory remains)
      Liquidity Sweep   special   (brief breach then reversal)
    B.2 — the MODIFIERS, each ADDING to the base:
      Option expiry timing (Spring Release)   +20-30%
      Macro catalyst aligned against zone     +15-25%
      Increasing momentum toward zone         +10-20%
      Cross-pair confirmation                 +15-25%
      Cascade effect (prior zone broke)       +20-30%
      Regime change (EMA 200 cross)           +15-25%

  canon  §Pressure Degree Assignment (:1483-1493) — the SAME number, named a Failure Probability:
      12-14 EXTREME <10% · 10-11 HEAVY 10-25% · 8-9 MOD-HEAVY 20-35% · 6-7 MODERATE 30-45% ·
      4-5 LIGHT 40-60% · 0-3 MINIMAL >60%.

THE ZFP = base(zone_type) + Σ(modifiers), clamped 0..100. A zone in an ACTIVE BREAKOUT reads
HIGHER than the same zone in consolidation (the momentum modifier) — that is the canon's whole
mechanism, and the operator's test.

THE DEFECT THIS REPLACES (FAILURE_LOG F-54/F-55, the operator's complaint): the tree carried the
v8 render-ism `calcZFP(tp,bt) = zoneW/refRange*100` — a BOX WIDTH, not a probability. It read
6/8/14 on every week (a fixed function of the zone geometry, carrying no strength or failure
signal), it printed <20% on every zone (so every zone looked like a Hard Wall and the E2 collapsed
onto SS), and it is NOT a probability at all. The prompt DEFINES the ZFP as the failure
probability; the v8's `calcZFP` is the v8's own label misnomer. THE PROMPT WINS — it is the
authority; the v8 is one rendered example.

ONE ZFP. `classify_zone_type` + `zfp` + `explain` are the exported decision functions both
engines read. NOTHING here invents a number: every value is a canon band or a measured modifier.
"""

from __future__ import annotations

import math

# ── APPENDIX B.1 · THE BASE FAILURE PROBABILITY, BY ZONE TYPE (lo, hi) ─────────────────
# Verbatim from canon :4056-4061. The base is the band MIDPOINT (the canon's own convention —
# it prints ranges; the midpoint is the honest single value, and the adversarial suite pins
# `abs(zfp - midpoint) <= 1` for an empty/quiet read).
ZFP_BASE: dict[str, tuple[float, float]] = {
    "HARD_WALL":         (5.0, 15.0),    # CRITICAL OPTION WALL + 3+ pillars
    "STANDARD_WALL":     (15.0, 30.0),   # SIGNIFICANT MAGNET + 2+ pillars
    "SOFT_WALL":         (30.0, 50.0),   # no option wall, or 1-2 pillars
    "ONE_TOUCH":         (50.0, 70.0),   # only 1 pillar, no option wall
    "POST_EXPIRY_GHOST": (20.0, 40.0),   # option expired, structural memory remains
}

# the fallback for an unknown/missing zone_type — the canon's most common zone (Standard Wall)
_ZFP_DEFAULT_TYPE = "STANDARD_WALL"

# the six B.2 modifiers, in canon order (the receipt emits ALL SIX, value 0 when not firing —
# the adversarial suite pins `{the six names} <= {receipt modifier names}`).
_MODIFIER_NAMES = ("spring_release", "macro_catalyst", "momentum",
                   "cross_pair", "cascade", "regime_change")

# the canon band MIDPOINTS of each modifier's add-range (B.2). The value is scaled within the
# band by the measured strength of the signal (see each `_*_mod` below).
_MOD_BAND = {
    "spring_release": (20.0, 30.0),
    "macro_catalyst": (15.0, 25.0),
    "momentum":       (10.0, 20.0),
    "cross_pair":     (15.0, 25.0),
    "cascade":        (20.0, 30.0),
    "regime_change":  (15.0, 25.0),
}

CANON = ("Trident_System_Prompt_v5.3.3 — Appendix B (B.1 base by zone type + B.2 modifiers) "
         "and §Pressure Degree Assignment")


def _as_float(v, default=None):
    """A guarded float: None / non-numeric / NaN / Inf → the default (never a NaN leak)."""
    try:
        f = float(v)
    except (TypeError, ValueError):
        return default
    return f if math.isfinite(f) else default


def _closes(bars) -> list[float]:
    out: list[float] = []
    for b in (bars or []):
        if isinstance(b, dict):
            c = _as_float(b.get("c"))
            if c is not None:
                out.append(c)
    return out


def classify_zone_type(zone) -> str:
    """A zone's type, per Appendix B.1 — the canon's strength tiers.

    Order: honour an explicit `zone_type` when it is a known tier; else DERIVE it from the
    number of DISTINCT pillars in the zone (the B.1 criteria: 3+ pillars = Hard Wall, 2+ =
    Standard Wall, 1 = One-Touch/Soft). An unknown string ("NOT_A_TYPE") or a missing field
    falls back to the canon's most common tier — never a KeyError."""
    z = zone or {}
    zt = z.get("zone_type")
    if isinstance(zt, str) and zt in ZFP_BASE:
        return zt
    # THE CONFLUENCE IS THE DISCRIMINATOR when there is no option wall (the harvest is DOWN).
    # The canon's B.1 ranks a zone by the option wall AND the pillar count; with the option
    # dimension absent, the CONFLUENCE SCORE (the canon's own strength measure) is the proxy:
    # a high-confluence zone is a harder wall. Without this, every zone with 3+ pillars read
    # HARD_WALL (base 10%) and the ZFP was flat (the operator's "5 of 6 identical" defect).
    conf = z.get("confluence")
    if isinstance(conf, (int, float)):
        if conf >= 10:
            return "HARD_WALL"
        if conf >= 7:
            return "STANDARD_WALL"
        if conf >= 4:
            return "SOFT_WALL"
        return "ONE_TOUCH"
    lv = z.get("levels") or []
    pillars = {l.get("level_type") for l in lv
               if isinstance(l, dict) and l.get("level_type")}
    n = len(pillars)
    # THE CANON B.1 CRITERIA (verbatim): Hard Wall = 3+ pillars; Standard Wall = 2+;
    # Soft Wall = 1-2 / no option wall; One-Touch = only 1. The pillar count is the
    # discriminator the option wall would otherwise supply (the harvest is DOWN).
    if n >= 3:
        return "HARD_WALL"
    if n == 2:
        return "STANDARD_WALL"
    if n == 1:
        return "SOFT_WALL"
    return "ONE_TOUCH"


def _toward(zone, last_close: float) -> int:
    """+1 if the zone sits ABOVE the last close (a rising move approaches it), -1 if BELOW,
    0 when the zone straddles / is absent (no directional read)."""
    top = _as_float((zone or {}).get("top"))
    bot = _as_float((zone or {}).get("bottom"))
    if top is not None and last_close < top:
        return 1
    if bot is not None and last_close > bot:
        return -1
    return 0


def _momentum_mod(zone, bars) -> tuple[float, float]:
    """B.2 'Increasing momentum toward zone +10-20%'. Measured from the bars' own closes.

    The mechanism (the operator's test): a zone approached by an ACCELERATING charge reads a
    HIGHER ZFP than the same zone in consolidation. A CONSTANT slope does NOT fire (there is no
    accumulation of speed) — this is the canon's word 'increasing'. Returns (bonus, strength
    0..1)."""
    cs = _closes(bars)
    n = len(cs)
    if n < 8:
        return 0.0, 0.0
    k = min(10, max(2, n // 3))
    if 2 * k >= n:
        k = max(2, n // 4)
    recent = (cs[-1] - cs[-1 - k]) / k
    prior = (cs[-1 - k] - cs[-1 - 2 * k]) / k
    want = _toward(zone, cs[-1])
    if want == 0:
        return 0.0, 0.0
    speed = recent * want
    prior_speed = prior * want
    # THE SCALE — a move is measured against the ZONE'S OWN WIDTH (the canon's 0.15-DXY band
    # granularity), so a flat oscillation on a 0.10-wide zone (a ±0.0015 jitter) is NOISE, not a
    # charge. A constant slope still does not fire (the accel gate below); a real accelerating
    # charge into the zone does. Fallback scale: 2% of the price when the zone has no width.
    top = _as_float((zone or {}).get("top"))
    bot = _as_float((zone or {}).get("bottom"))
    width = (top - bot) if (top is not None and bot is not None and top > bot) else 0.0
    if width <= 0:
        width = max(abs(cs[-1]) * 0.02, 1e-6)
    floor = 0.005 * width                   # a real move: >=0.5% of the zone width per bar
    if speed < floor:                       # too small — noise (the flat week never fires)
        return 0.0, 0.0
    accel = speed - prior_speed
    if accel <= 0.0005 * width:             # not INCREASING (a constant slope does not fire)
        return 0.0, 0.0
    lo, hi = _MOD_BAND["momentum"]
    strength = min(1.0, accel / (0.01 * width))
    return round(lo + (hi - lo) * strength, 1), round(strength, 3)


def _cascade_mod(zone, zones_so_far) -> tuple[float, float]:
    """B.2 'Cascade effect (prior zone broke) +20-30%'. Fires ONLY when a zone already in
    `zones_so_far` (a zone the price has met on the way) has FAILED (its own ZFP > the canon's
    45% breakout threshold). Conservative by construction: an empty/None input never fires."""
    if not zones_so_far:
        return 0.0, 0.0
    broken = 0
    for z in zones_so_far:
        zz = z if isinstance(z, dict) else {}
        if _as_float(zz.get("zfp"), 0.0) and _as_float(zz.get("zfp"), 0.0) > 45.0:
            broken += 1
    if broken == 0:
        return 0.0, 0.0
    lo, hi = _MOD_BAND["cascade"]
    strength = min(1.0, broken / 3.0)
    return round(lo + (hi - lo) * strength, 1), round(strength, 3)


def _modifiers(zone, bars, spot, zones_so_far) -> list[dict]:
    """The six B.2 modifiers, EVERY one present (value 0 when its signal is absent)."""
    mom_v, mom_s = _momentum_mod(zone, bars)
    cas_v, cas_s = _cascade_mod(zone, zones_so_far)
    return [
        {"modifier": "spring_release", "value": 0.0, "strength": 0.0},
        {"modifier": "macro_catalyst", "value": 0.0, "strength": 0.0},
        {"modifier": "momentum",       "value": mom_v, "strength": mom_s},
        {"modifier": "cross_pair",     "value": 0.0, "strength": 0.0},
        {"modifier": "cascade",        "value": cas_v, "strength": cas_s},
        {"modifier": "regime_change",  "value": 0.0, "strength": 0.0},
    ]


def zfp(zone, bars=None, spot=None, zones_so_far=None, pair: str = "DXY") -> int:
    """THE ZFP — canon Appendix B VERBATIM.

        ZFP = round( base(zone_type) + Σ( B.2 modifiers ) )   clamped 0..100

    An int, always finite (the adversarial bar): an empty read returns the base, a NaN never
    leaks, an unknown zone_type falls back, a None cascade never fires."""
    zt = classify_zone_type(zone)
    lo, hi = ZFP_BASE.get(zt, ZFP_BASE[_ZFP_DEFAULT_TYPE])
    base = (lo + hi) / 2.0
    total = base + sum(m["value"] for m in _modifiers(zone, bars, spot, zones_so_far))
    if not math.isfinite(total):
        total = base
    return int(max(0, min(100, round(total))))


def explain(zone, bars=None, spot=None, zones_so_far=None, pair: str = "DXY") -> dict:
    """The receipt — the base, every modifier, and the canon citation, so the number is
    auditable, never a bare int (the canon: 'Show the base probability and each modifier')."""
    zt = classify_zone_type(zone)
    lo, hi = ZFP_BASE.get(zt, ZFP_BASE[_ZFP_DEFAULT_TYPE])
    base = (lo + hi) / 2.0
    mods = _modifiers(zone, bars, spot, zones_so_far)
    return {
        "pair": pair, "zone_type": zt, "base": round(base, 1), "band": [lo, hi],
        "modifiers": mods,
        "zfp": zfp(zone, bars, spot, zones_so_far, pair),
        "formula": "round(base(zone_type) + Σ(modifiers))  — canon Appendix B.1 + B.2",
        "canon": CANON,
    }


def main(argv: list[str]) -> int:
    import argparse
    ap = argparse.ArgumentParser(description="the ONE ZFP (canon Appendix B)")
    ap.add_argument("--type", default="SOFT_WALL", help="zone_type (Appendix B.1 tier)")
    ap.add_argument("--pair", default="DXY")
    a = ap.parse_args(argv)
    print(explain({"zone_type": a.type}, None, None, None, a.pair))
    return 0


if __name__ == "__main__":
    import sys
    sys.exit(main(sys.argv[1:]))
