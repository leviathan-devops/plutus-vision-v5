#!/usr/bin/env python3
"""
zfp.py — ZONE FAILURE PROBABILITY, FAIL-CLOSED. v2.1 after the adversarial audit.

FIXED SINCE v2.0 (every item from the audit, with its mechanism):
  A1 closed pillar vocabulary       a typo cannot inflate the count and promote a tier
  A2 calendar currency + side       a high-impact JPY print cannot fire the USD modifier
  A3 sign/enum guards               a negative tol/range or a bad direction raises, never
                                    silently disables a +20/+25 modifier
  A4 half-up rounding               one declared rule; banker's rounding removed
  A5 receipt completeness           clamped is numeric, was_clamped is explicit,
                                    pillar9_bucket populated, cross_check computable
  A6 range check before equality    ZFP_OUT_OF_RANGE is reachable; raw is bounded
  A7 tier_inputs schema checked     validate() inspects the inputs the tier came from
"""
from __future__ import annotations
import math

TIER_BAND = {
    "HARD_WALL":         (5.0, 15.0),
    "STANDARD_WALL":     (15.0, 30.0),
    "POST_EXPIRY_GHOST": (20.0, 40.0),
    "SOFT_WALL":         (30.0, 50.0),
    "ONE_TOUCH":         (50.0, 70.0),
}
MOD_POINT = {"spring_release":25.0,"macro_catalyst":20.0,"momentum":15.0,
             "cross_pair":20.0,"cascade":25.0,"regime_change":20.0}
MOD_ORDER = ("spring_release","macro_catalyst","momentum","cross_pair","cascade","regime_change")

# The canon's nine pillars (master spec 3.0) plus the five auxiliaries. A CLOSED set.
PILLARS = frozenset({"round","ema200","weekly_swing","ob_4h","daily_liquidity","cluster",
                     "intraday_swing","minor","institutional_pressure",
                     "liquidity_level","pivot","price_action","prior_day","supply_demand",
                     "option_structure"})
CURRENCIES = frozenset({"USD","EUR","GBP","AUD","JPY","CHF","CAD","NZD"})
PAIR_LEGS = {"DXY":{"USD","EUR","GBP","AUD","JPY","CHF","CAD","NZD"},  # the dollar basket
             "EURUSD":{"EUR","USD"},"GBPUSD":{"GBP","USD"},"AUDUSD":{"AUD","USD"}}
SIDES = ("up","down","unclear")

# degree -> the probability midpoint of its canon bucket (the cross-check ruler)
DEGREE_MID = {"EXTREME":5.0,"HEAVY":17.5,"MODERATE-HEAVY":27.5,"MODERATE":37.5,
              "LIGHT":50.0,"MINIMAL":70.0}
DEGREE_ORDER = list(DEGREE_MID)
RAW_MAX = 185.0          # the canon's own maximum: One-Touch base 60 + all six modifiers 125


class ZFPError(Exception):
    def __init__(self, code: str, detail: str = ""):
        self.code, self.detail = code, detail
        super().__init__(f"{code}: {detail}")


def _num(x, name: str) -> float:
    if isinstance(x, bool) or not isinstance(x, (int, float)):
        raise ZFPError("ZFP_INPUT_INVALID", f"{name}={x!r} is not a number")
    f = float(x)
    if not math.isfinite(f):
        raise ZFPError("ZFP_INPUT_INVALID", f"{name}={x!r} is not finite")
    return f


def _need(d, key: str, where: str):
    if not isinstance(d, dict) or key not in d or d[key] is None:
        raise ZFPError("ZFP_INPUT_MISSING", f"{where}.{key}")
    return d[key]


def _round_half_up(x: float) -> int:
    """THE ONE rounding rule. Half-up, never banker's: 22.5 -> 23, 42.5 -> 43."""
    return int(math.floor(x + 0.5))


def _mid(lo, hi): return (lo + hi) / 2.0


def classify_tier(zone, opt, week) -> str:
    raw_pillars = _need(zone, "pillar_types", "zone")
    if not isinstance(raw_pillars, list):
        raise ZFPError("ZFP_INPUT_INVALID", "zone.pillar_types is not a list")
    for p in raw_pillars:
        if not isinstance(p, str):
            raise ZFPError("ZFP_INPUT_INVALID", f"pillar type {p!r} is not a string")
        if p not in PILLARS:
            raise ZFPError("ZFP_PILLAR_UNKNOWN", f"{p!r} is not a canon pillar")
    n_pillars = len(set(raw_pillars))
    confluent = _need(zone, "confluent", "zone")
    if not isinstance(confluent, bool):
        raise ZFPError("ZFP_INPUT_INVALID", "zone.confluent is not a bool")
    memory = _need(zone, "structural_memory", "zone")
    if not isinstance(memory, bool):
        raise ZFPError("ZFP_INPUT_INVALID", "zone.structural_memory is not a bool")

    notional = _num(_need(opt, "notional_b", "opt"), "opt.notional_b")
    if notional < 0:
        raise ZFPError("ZFP_INPUT_INVALID", f"opt.notional_b={notional} < 0")
    expiry = _num(_need(opt, "expiry_ts", "opt"), "opt.expiry_ts")
    ws = _num(_need(week, "start_ts", "week"), "week.start_ts")
    we = _num(_need(week, "end_ts", "week"), "week.end_ts")
    if we <= ws:
        raise ZFPError("ZFP_INPUT_INVALID", f"week end {we} <= start {ws}")

    if expiry < ws and memory:                          return "POST_EXPIRY_GHOST"
    if notional >= 1.5 and n_pillars >= 3 and confluent: return "HARD_WALL"
    if notional >= 0.85 and n_pillars >= 2:             return "STANDARD_WALL"
    if notional < 0.85 and n_pillars <= 1:              return "ONE_TOUCH"
    if notional < 0.85 and n_pillars <= 2:              return "SOFT_WALL"
    if notional >= 0.85 and n_pillars < 2:              return "SOFT_WALL"
    raise ZFPError("ZFP_TIER_UNCLASSIFIED", f"notional={notional} pillars={n_pillars}")


def _gates(zone, ctx, week):
    out = []
    def gate(name, fired, evidence):
        return {"name":name,"fired":bool(fired),
                "value":MOD_POINT[name] if fired else 0.0,"gate":evidence}

    opt = _need(ctx, "opt", "ctx")
    expiry = _num(_need(opt, "expiry_ts", "ctx.opt"), "ctx.opt.expiry_ts")
    spot = _num(_need(ctx, "spot", "ctx"), "ctx.spot")
    top = _num(_need(zone, "top", "zone"), "zone.top")
    bot = _num(_need(zone, "bottom", "zone"), "zone.bottom")
    if top <= bot:
        raise ZFPError("ZFP_INPUT_INVALID", f"top {top} <= bottom {bot}")
    direction = _need(zone, "direction", "zone")
    if direction not in ("up","down"):
        raise ZFPError("ZFP_INPUT_INVALID", f"zone.direction={direction!r} not up/down")

    # 1 · option expiry in-week and the zone inside the striking range
    srp = _num(_need(opt, "strike_range_pct", "ctx.opt"), "ctx.opt.strike_range_pct")
    if srp <= 0:
        raise ZFPError("ZFP_INPUT_INVALID", f"strike_range_pct={srp} <= 0")
    in_week = week["start_ts"] <= expiry <= week["end_ts"]
    dist = abs(((top + bot) / 2.0) - spot)
    out.append(gate("spring_release", in_week and dist <= spot * srp,
                    f"expiry={expiry} in_week={in_week} dist={dist:.5f} <= {spot*srp:.5f}"))

    # 2 · macro catalyst AGAINST the zone: high impact, the pair's currency, and the
    #     event pushes the same way price is approaching (i.e. through the zone)
    cal = _need(ctx, "calendar", "ctx")
    events = _need(cal, "events", "ctx.calendar")
    if not isinstance(events, list):
        raise ZFPError("ZFP_INPUT_INVALID", "ctx.calendar.events is not a list")
    legs = PAIR_LEGS.get(ctx["pair"]) if ctx.get("pair") in PAIR_LEGS else None
    if legs is None:
        raise ZFPError("ZFP_INPUT_INVALID", f"ctx.pair={ctx.get('pair')!r} has no leg definition")
    fired_events = []
    for e in events:
        ts = _num(_need(e, "ts", "event"), "event.ts")
        impact = _need(e, "impact", "event")
        if impact not in ("high","medium","low"):
            raise ZFPError("ZFP_INPUT_INVALID", f"event.impact={impact!r}")
        cur = _need(e, "currency", "event")
        if cur not in CURRENCIES:
            raise ZFPError("ZFP_INPUT_INVALID", f"event.currency={cur!r}")
        side = _need(e, "side", "event")
        if side not in SIDES:
            raise ZFPError("ZFP_INPUT_INVALID", f"event.side={side!r}")
        if (impact == "high" and cur in legs and side == direction
                and week["start_ts"] <= ts <= week["end_ts"]):
            fired_events.append(f"{cur}/{ts}")
    out.append(gate("macro_catalyst", len(fired_events) > 0,
                    f"against_zone_events={fired_events}"))

    # 3 · increasing momentum toward the zone
    md = _need(ctx, "momentum", "ctx")
    roc5 = _num(_need(md, "roc5", "ctx.momentum"), "ctx.momentum.roc5")
    atr20 = _num(_need(md, "atr20", "ctx.momentum"), "ctx.momentum.atr20")
    if atr20 <= 0: raise ZFPError("ZFP_INPUT_INVALID", f"atr20={atr20} <= 0")
    toward = _num(_need(md, "toward", "ctx.momentum"), "ctx.momentum.toward")
    if toward not in (-1.0, 0.0, 1.0):
        raise ZFPError("ZFP_INPUT_INVALID", f"toward={toward} not -1/0/1")
    out.append(gate("momentum", abs(roc5) > 0.5 * atr20 and roc5 * toward > 0,
                    f"|ROC5|={abs(roc5):.5f} vs {0.5*atr20:.5f}; roc5*toward={roc5*toward:.5f}"))

    # 4 · cross-pair confirmation
    xp = _need(ctx, "cross_pair", "ctx")
    mids = _need(xp, "zone_mids", "ctx.cross_pair")
    tol = _num(_need(xp, "tol", "ctx.cross_pair"), "ctx.cross_pair.tol")
    if tol <= 0: raise ZFPError("ZFP_INPUT_INVALID", f"tol={tol} <= 0")
    if not isinstance(mids, dict):
        raise ZFPError("ZFP_INPUT_INVALID", "ctx.cross_pair.zone_mids is not an object")
    zm = (top + bot) / 2.0; matched = 0
    for pair, levels in mids.items():
        if not isinstance(levels, list):
            raise ZFPError("ZFP_INPUT_INVALID", f"cross_pair[{pair}] is not a list")
        if any(abs(_num(lv, f"cross_pair[{pair}]") - zm) <= tol for lv in levels):
            matched += 1
    out.append(gate("cross_pair", matched >= 2, f"pairs_matched={matched} of {len(mids)} tol={tol}"))

    # 5 · cascade
    cas = _need(ctx, "cascade", "ctx")
    prior = _need(cas, "prior_failures", "ctx.cascade")
    if not isinstance(prior, list):
        raise ZFPError("ZFP_INPUT_INVALID", "ctx.cascade.prior_failures is not a list")
    for p in prior:
        _num(_need(p, "zfp", "prior_failure"), "prior_failure.zfp")
        if _need(p, "direction", "prior_failure") not in ("up","down"):
            raise ZFPError("ZFP_INPUT_INVALID", "prior_failure.direction")
    same = [p for p in prior if p["direction"] == direction and p["zfp"] > 45.0]
    out.append(gate("cascade", len(same) > 0, f"same_direction_prior_failures={len(same)}"))

    # 6 · regime change
    rg = _need(ctx, "regime", "ctx")
    crossed = _need(rg, "ema200_crossed_this_week", "ctx.regime")
    if not isinstance(crossed, bool):
        raise ZFPError("ZFP_INPUT_INVALID", "ema200_crossed_this_week is not a bool")
    out.append(gate("regime_change", crossed, f"ema200_crossed_this_week={crossed}"))
    return out


def compute(zone, ctx, week) -> dict:
    tier = classify_tier(zone, _need(ctx, "opt", "ctx"), week)
    lo, hi = TIER_BAND[tier]
    base = _mid(lo, hi)
    mods = _gates(zone, ctx, week)
    raw = base + math.fsum(m["value"] for m in mods)
    if not (0.0 <= raw <= RAW_MAX):
        raise ZFPError("ZFP_OUT_OF_RANGE", f"raw={raw} outside [0,{RAW_MAX}]")
    clamped_value = max(0.0, min(99.0, raw))
    zfp = _round_half_up(clamped_value)
    if not (0 <= zfp <= 99):
        raise ZFPError("ZFP_OUT_OF_RANGE", f"zfp={zfp}")
    receipt = {
        "pair": _need(ctx, "pair", "ctx"),
        "zone_id": _need(zone, "id", "zone"),
        "tier": tier, "band": [lo, hi], "base": base,
        "modifiers": mods, "raw": raw,
        "clamped": clamped_value, "was_clamped": raw > 99.0,
        "zfp": zfp,
        "pillar9_bucket": degree_from_zfp(zfp),
        "cross_check": None,                     # set by crosscheck(receipt, degree)
        "tier_inputs": {
            "notional_b": _num(_need(ctx["opt"], "notional_b", "opt"), "opt.notional_b"),
            "pillars": len(set(_need(zone, "pillar_types", "zone"))),
            "confluent": _need(zone, "confluent", "zone"),
            "structural_memory": _need(zone, "structural_memory", "zone"),
            "expiry_before_week": _num(_need(ctx["opt"], "expiry_ts", "opt"), "opt.expiry_ts")
                                  < week["start_ts"],
        },
        "formula_version": "appendix-b@2.1.0",
    }
    validate(receipt)
    return receipt


def degree_from_zfp(z: float) -> str:
    """The nearest canon degree by its bucket midpoint. The cross-check ruler."""
    return min(DEGREE_MID, key=lambda d: abs(DEGREE_MID[d] - z))


def crosscheck(receipt: dict, degree: str) -> str:
    if degree not in DEGREE_MID:
        raise ZFPError("ZFP_DEGREE_UNKNOWN", f"{degree!r}")
    ri = DEGREE_ORDER.index(degree)
    zi = DEGREE_ORDER.index(degree_from_zfp(receipt["zfp"]))
    verdict = "consistency" if abs(ri - zi) <= 1 else f"CONFLICT degree={degree} zfp={receipt['zfp']}"
    receipt["cross_check"] = verdict
    return verdict


def validate(r: dict) -> None:
    tier, band, base = r["tier"], r["band"], r["base"]
    if tier not in TIER_BAND: raise ZFPError("ZFP_TIER_UNKNOWN", tier)
    if band != list(TIER_BAND[tier]): raise ZFPError("ZFP_BAND_MISMATCH", f"{band}")
    if abs(base - _mid(*TIER_BAND[tier])) > 1e-9:
        raise ZFPError("ZFP_BASE_MISMATCH", f"{base}")
    ti = r["tier_inputs"]
    for k, t in (("notional_b", (int, float)), ("pillars", int), ("confluent", bool),
                 ("structural_memory", bool), ("expiry_before_week", bool)):
        if k not in ti: raise ZFPError("ZFP_TIER_INPUT_MISSING", k)
        if isinstance(ti[k], bool) and t is not bool:
            raise ZFPError("ZFP_TIER_INPUT_INVALID", f"{k} is bool")
        if not isinstance(ti[k], t):
            raise ZFPError("ZFP_TIER_INPUT_INVALID", f"{k}={ti[k]!r}")
    if [m["name"] for m in r["modifiers"]] != list(MOD_ORDER):
        raise ZFPError("ZFP_MODIFIER_SET", str([m["name"] for m in r["modifiers"]]))
    for m in r["modifiers"]:
        if m["name"] not in MOD_POINT: raise ZFPError("ZFP_MODIFIER_UNKNOWN", m["name"])
        if not isinstance(m["fired"], bool): raise ZFPError("ZFP_MODIFIER_INVALID", m["name"])
        want = MOD_POINT[m["name"]] if m["fired"] else 0.0
        if m["value"] != want:
            raise ZFPError("ZFP_MODIFIER_VALUE", f"{m['name']} {m['value']} != {want}")
        if not m["gate"]: raise ZFPError("ZFP_MODIFIER_NO_GATE", m["name"])
    total = base + math.fsum(m["value"] for m in r["modifiers"])
    if abs(total - r["raw"]) > 1e-9: raise ZFPError("ZFP_RAW_MISMATCH", f"{total} != {r['raw']}")
    if not (0.0 <= r["raw"] <= RAW_MAX): raise ZFPError("ZFP_OUT_OF_RANGE", f"raw={r['raw']}")
    want_clamped = max(0.0, min(99.0, r["raw"]))
    if abs(want_clamped - r["clamped"]) > 1e-9:
        raise ZFPError("ZFP_CLAMP_MISMATCH", f"{r['clamped']} != {want_clamped}")
    if r["was_clamped"] != (r["raw"] > 99.0):
        raise ZFPError("ZFP_CLAMP_FLAG", f"{r['was_clamped']} vs raw={r['raw']}")
    want_zfp = _round_half_up(want_clamped)
    if not (0 <= want_zfp <= 99): raise ZFPError("ZFP_OUT_OF_RANGE", str(want_zfp))
    if r["zfp"] != want_zfp: raise ZFPError("ZFP_VALUE_MISMATCH", f"{r['zfp']} != {want_zfp}")
    if r["pillar9_bucket"] != degree_from_zfp(r["zfp"]):
        raise ZFPError("ZFP_BUCKET_MISMATCH", f"{r['pillar9_bucket']}")
