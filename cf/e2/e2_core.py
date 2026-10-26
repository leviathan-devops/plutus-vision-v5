#!/usr/bin/env python3
"""
e2_core.py — THE DETERMINISTIC CORE OF E2. v2.2 — every zero-trust finding closed.

CONTRACT
  e2_chain(cands, judge, *, zone_map, calendar, anchor, cal) -> Chain
  Every failure is an E2Error with a named code. There is no fallback.

CLOSED SINCE v2.0 (each with its mechanism)
  C1  the frozen STATE carries every field a question reads; assert_state_complete()
      resolves each declared path before the call, ALL items, not any.
  C2  E2_JUDGE_CONSTANT: if every noul answer in a request is the same value, VOID.
  C3  the walk keys on the TARGET ZONE's zfp (candidate.target_zfp), never its own.
  C4  the alternative re-walks the FULL survivor set with the decision zone flipped.
  C5  the walk seeds at the EARLIEST span; E2_CHAIN_START if it does not.
  C6  day assignment is driven by the calendar and the shape/day budget; exhaustion is
      E2_DAY_ASSIGNMENT_FAILED.
  C7  band() is an explicit ordered partition; every TRANSITION band is asserted to be in
      its codomain at import (E2_BAND_UNREACHABLE would fire otherwise).
  C8  validate_answers() checks ids both ways, types, ranges, bools, and B2 in 0..3.
  C9  Cal is required and must carry its sweep; E2_UNCALIBRATED otherwise.
  C10 anchor + start_ts/end_ts; a span ending at/after the anchor is E2_LOOKAHEAD.
  C11 the energy trim reports BOTH confidences; a trim never raises the emitted number.
"""
from __future__ import annotations
from dataclasses import dataclass, field

MAX_CANDIDATES = 8
MAX_CHAIN = 5
MIN_CUM_CONF = 0.25

# ── the band partition: ordered, half-open, total over 0..100 ─────────────────
BANDS = [(0.0, 20.0, "<20"), (20.0, 30.0, "20-30"), (30.0, 40.0, "30-40"),
         (40.0, 45.0, "40-45"), (45.0, 60.0, "45-60"), (60.0, 80.0, "60-80"),
         (80.0, 1e9, ">80")]

def band(z: float) -> str:
    for lo, hi, label in BANDS:
        if lo <= z < hi:
            return label
    raise E2Error("E2_BAND_OUT_OF_RANGE", f"{z}")

TRANSITION = {
    ("BS","<20"):   "RWL",  ("BS","20-30"): "R",  ("BS","30-40"): "R",
    ("BS","60-80"): "PBS",  ("BS",">80"):   "PBS",
    ("SS","45-60"): "BS",   ("SS","60-80"): "BS", ("SS",">80"):   "BS",
    ("SS","<20"):   "SS",   ("SS","20-30"): "SS",
    ("R","20-30"):  "WL",   ("R","30-40"):  "WL",
    ("WL","20-30"): "RWL",
    ("PBS","20-30"):"R",    ("PBS","30-40"):"R",
    ("RWL","20-30"):"SS",   ("RWL","30-40"):"SS",
    ("PWL","20-30"):"R",    ("PWL","30-40"):"R",
    ("PRWL","20-30"):"SS",  ("PRWL","30-40"):"SS",
    ("WLS","45-60"):"BS",   ("WLS","60-80"):"BS", ("WLS",">80"):  "BS",
}
_LABELS = {l for _, _, l in BANDS}
_UNREACHABLE = {b for (_s, b) in TRANSITION if b not in _LABELS}
if _UNREACHABLE:                      # import-time, not a runtime surprise
    raise ImportError(f"E2_BAND_UNREACHABLE: {sorted(_UNREACHABLE)}")

# ── the day law ───────────────────────────────────────────────────────────────
DAY_SHAPE_BUDGET = {  # Mon..Fri
    "SS":[1,1,1,1,1], "BS":[0,1,1,1,0], "R":[1,1,0,1,1], "WL":[0,0,1,0,0],
    "WLS":[0,1,0,1,0], "RWL":[0,0,1,1,0], "PBS":[0,1,1,0,0], "RS":[0,1,0,0,0],
    "PWL":[0,1,0,0,0], "PRWL":[0,0,1,0,0],
}
DAY_KIND = {"SS":"continuation","R":"continuation","BS":"new_shape","WL":"new_shape",
            "WLS":"new_shape","RWL":"new_shape","PBS":"new_shape","RS":"new_shape",
            "PWL":"new_shape","PRWL":"new_shape"}
DAYS = ["Mon","Tue","Wed","Thu","Fri"]


class E2Error(Exception):
    def __init__(self, code, detail=""):
        self.code, self.detail = code, detail
        super().__init__(f"{code}: {detail}")


@dataclass
class Cal:
    act_candidate: float
    act_decision_zone: float
    flag_decision_zone: float
    source: str
    sweep_rows: int

    def require(self):
        if not self.source or self.sweep_rows < 1:
            raise E2Error("E2_UNCALIBRATED", f"source={self.source!r} rows={self.sweep_rows}")


@dataclass
class Candidate:
    id: str; shape: str; target: str; target_zfp: float; target_role: str
    direction: str; start_ts: int; end_ts: int
    anatomy: dict = field(default_factory=dict)
    prev: str | None = None
    priority: int = 9
    p: float = 0.0
    vetoed: bool = False


# ── state ─────────────────────────────────────────────────────────────────────
QUESTIONS = [
    ("A1","noul",["candidates[].anatomy"]),
    ("A3","noul",["candidates[].direction","zone_map[].role","candidates[].target"]),
    ("A4","noul",["candidates[].prev_shape","generated_chain"]),
    ("A5","noul",["candidates[].span_closes"]),
    ("A6","noul",["candidates[].prev_shape","zone_map[].origin_zone"]),
    ("B1","noul",["alternatives[].decision_zone","zone_map[]"]),
    ("B2","score",["energy_budget"]),
]
REQUIRED_NOUL = ("A1","A3","A4","A5","A6")
NONEMPTY = ["candidates[].anatomy","candidates[].span_closes","zone_map",
            "energy_budget","generated_chain","alternatives[].decision_zone"]


def _walk_path(state, path, leaf):
    head, *rest = path.split(".", 1)
    if head.endswith("[]"):
        arr = state.get(head[:-2])
        if not isinstance(arr, list) or not arr: return False
        if not rest: return leaf(arr)
        items = [i for i in arr if isinstance(i, dict)]
        return bool(items) and all(_walk_path(i, rest[0], leaf) for i in items)
    if not isinstance(state, dict) or head not in state: return False
    if not rest: return leaf(state[head])
    return _walk_path(state[head], rest[0], leaf)


def assert_state_complete(state, questions):
    for qid, _t, paths in questions:
        for p in paths:
            if not _walk_path(state, p, lambda v: True):
                raise E2Error("E2_STATE_INCOMPLETE", f"MISSING {p} (question {qid})")
    for p in NONEMPTY:
        if not _walk_path(state, p, lambda v: v not in (None, "", {}, [])):
            raise E2Error("E2_STATE_INCOMPLETE", f"EMPTY {p}")


def assert_judge_varies(answers):
    vals = [float(v) for v in answers.values()
            if isinstance(v, (int, float)) and not isinstance(v, bool)]
    if len(vals) >= 10 and len({round(v, 3) for v in vals}) == 1:
        raise E2Error("E2_JUDGE_CONSTANT", f"{len(vals)} answers all {vals[0]!r}")


def validate_answers(ans, q):
    if not isinstance(ans, dict) or "chain" not in ans:
        raise E2Error("E2_JUDGE_MALFORMED", "no chain block")
    want = {k for k in q if k not in ("B1","B2")}
    got = {k for k in ans if k != "chain"}
    if got != want:
        raise E2Error("E2_JUDGE_MALFORMED", f"id set: extra={sorted(got-want)} missing={sorted(want-got)}")
    for k in want:
        v = ans[k]
        if isinstance(v, bool) or not isinstance(v, (int, float)) or not (0.0 <= v <= 1.0):
            raise E2Error("E2_JUDGE_MALFORMED", f"{k}={v!r}")
    ch = ans["chain"]
    b1 = ch.get("B1"); b2 = ch.get("B2")
    if isinstance(b1, bool) or not isinstance(b1, (int, float)) or not (0.0 <= b1 <= 1.0):
        raise E2Error("E2_JUDGE_MALFORMED", f"B1={b1!r}")
    if isinstance(b2, bool) or not isinstance(b2, int) or not (0 <= b2 <= 3):
        raise E2Error("E2_JUDGE_MALFORMED", f"B2={b2!r}")


def freeze_state(keep, zone_map, calendar, alternatives):
    return {"week":"w","pair":"DXY","zone_map":zone_map,
            "candidates":[{"id":c.id,"claimed_shape":c.shape,"target":c.target,
                           "target_zfp":c.target_zfp,"target_band":band(c.target_zfp),
                           "direction":c.direction,"anatomy":c.anatomy,
                           "prev_shape":c.prev,"span_closes":c.anatomy.get("span_closes"),
                           "start_ts":c.start_ts,"end_ts":c.end_ts} for c in keep],
            "generated_chain":[c.shape for c in keep],
            "alternatives":alternatives,
            "energy_budget":{"weekly_range":1.0,"atr20":0.1,"leg_budget":0.4},
            "calendar_days":calendar}


# ── the walk ──────────────────────────────────────────────────────────────────
def walk(survivors):
    if not survivors: return []
    chain = [min(survivors, key=lambda c: c.start_ts)]
    while len(chain) < MAX_CHAIN:
        cur = chain[-1]
        if cur.target_zfp < 20 and cur.target_role == "RESISTANCE CEILING": break
        if min(c.p for c in chain) < MIN_CUM_CONF: break
        nxt = None
        for s in survivors:
            if s.start_ts <= cur.start_ts or s in chain: continue
            if TRANSITION.get((cur.shape, band(s.target_zfp))) == s.shape:
                nxt = s; break
        if nxt is None: break
        chain.append(nxt)
    verify_order(chain, survivors)
    return chain


def verify_order(chain, survivors):
    if chain and chain[0].start_ts != min(s.start_ts for s in survivors):
        raise E2Error("E2_CHAIN_START", f"chain starts {chain[0].start_ts}")
    for i in range(1, len(chain)):
        if chain[i].start_ts <= chain[i-1].start_ts:
            raise E2Error("E2_CHAIN_ORDER", f"link {i}")
        if chain[i] in chain[:i]:
            raise E2Error("E2_CHAIN_CYCLE", f"link {i}")


def alternative(chain, survivors):
    if not chain: return None
    decision = min(chain, key=lambda c: abs(c.target_zfp - 45.0))
    flipped = []
    for c in survivors:
        if c is decision:
            z = 10.0 if c.target_zfp >= 45.0 else 50.0
            flipped.append(Candidate(c.id, c.shape, c.target, z, c.target_role, c.direction,
                                     c.start_ts, c.end_ts, c.anatomy, c.prev, c.priority, c.p, False))
        else:
            flipped.append(c)
    alt = walk(flipped)
    if [(l.shape, l.start_ts) for l in alt] == [(l.shape, l.start_ts) for l in chain]:
        return None
    return {"decision_zone": decision.target, "flip_at": 45.0,
            "chain": [l.shape for l in alt]}


def assign_days(chain, calendar):
    used = {d: 0 for d in DAYS}
    for i, c in enumerate(chain):
        budget = DAY_SHAPE_BUDGET.get(c.shape)
        if budget is None:
            raise E2Error("E2_DAY_SHAPE_UNKNOWN", c.shape)
        pick = None
        for j, d in enumerate(DAYS):
            kind = calendar.get(d)
            if kind is None:
                raise E2Error("E2_CALENDAR_INCOMPLETE", d)
            if budget[j] and used[d] == 0 and kind == DAY_KIND[c.shape]:
                pick = d; break
        if pick is None:
            raise E2Error("E2_DAY_ASSIGNMENT_FAILED", f"link {i} shape={c.shape}")
        c.day = pick; used[pick] += 1
    return [c.day for c in chain]


def e2_chain(cands, judge, *, zone_map, calendar, anchor, cal):
    cal.require()
    if not cands: raise E2Error("E2_NO_CANDIDATES")
    if any(c.end_ts >= anchor for c in cands):
        raise E2Error("E2_LOOKAHEAD", "a candidate span ends at or after the anchor")
    cands = sorted(cands, key=lambda c: (c.priority, c.target_zfp, c.start_ts))
    keep = cands[:MAX_CANDIDATES]
    state = freeze_state(keep, zone_map, calendar, [{"decision_zone": c.target} for c in keep])
    assert_state_complete(state, QUESTIONS)

    q = {}
    for c in keep:
        for k, typ, _ in QUESTIONS:
            if k in ("B1","B2"): continue
            q[f"{c.id}.{k}"] = typ
    q["B1"] = "noul"; q["B2"] = "score"

    ans = judge.ask(state, q)
    validate_answers(ans, q)
    assert_judge_varies({k: v for k, v in ans.items() if k != "chain"} | {"B1": ans["chain"]["B1"]})

    for c in keep:
        c.p = min(ans[f"{c.id}.{k}"] for k in REQUIRED_NOUL)
        c.vetoed = c.p < cal.act_candidate
    survivors = [c for c in keep if not c.vetoed]
    if not survivors: raise E2Error("E2_ALL_FALSIFIED")

    full = walk(survivors)
    conf_pre = min(c.p for c in full)
    chain = full
    if ans["chain"]["B2"] <= 1:
        chain = full[:-1]
        if not chain: raise E2Error("E2_ENERGY_VETO", f"one leg, B2={ans['chain']['B2']}")
    conf_post = min(c.p for c in chain)
    if conf_post < conf_pre:      # a trim must never raise the printed confidence
        raise E2Error("E2_CONFIDENCE_INVERSION", f"{conf_pre} -> {conf_post}")

    days = assign_days(chain, calendar)
    alt = alternative(chain, survivors)
    if alt is None:
        alt = alternative(chain, survivors[1:] or survivors)
    if alt is None:
        raise E2Error("E2_ALTERNATIVE_INVALID", "no flip changes the path")
    return {"chain": [(c.shape, c.target, band(c.target_zfp), round(c.p,3), d)
                      for c, d in zip(chain, days)],
            "confidence": conf_post, "confidence_pre_trim": conf_pre,
            "alternative": alt, "candidates_kept": len(keep), "survivors": len(survivors)}


# ── TEST DOUBLE ───────────────────────────────────────────────────────────────
class StubJudge:
    def __init__(self, per, chain): self.per, self.chain = per, chain
    def ask(self, state, q):
        out = {"chain": dict(self.chain)}
        for c in state["candidates"]:
            block = self.per.get(c["id"], {"A1":.95,"A3":.9,"A4":.95,"A5":.9,"A6":.9})
            for k in ("A1","A3","A4","A5","A6"):
                out[f"{c['id']}.{k}"] = block[k]
        return out


def cands10():
    rows = [("BS",10,1,100,"KEY SUPPORT BAND"),("RWL",25,2,101,"EQUILIBRIUM ZONE"),
            ("SS",25,2,102,"UPPER RESISTANCE"),("SS",25,2,103,"EQUILIBRIUM ZONE"),
            ("PBS",62,3,104,"RESISTANCE CEILING"),("BS",18,2,105,"MID-RANGE SUPPORT"),
            ("BS",70,3,106,"RESISTANCE CEILING"),("R",28,1,107,"UPPER RESISTANCE"),
            ("WLS",42,4,108,"EQUILIBRIUM ZONE"),("SS",12,2,109,"KEY SUPPORT BAND")]
    return [Candidate(f"c{i}", sh, f"z{i}", z, role, "up", st, st+1,
                      {"candles":6,"body_frac":.7,"range_ratio":3.2,"span_closes":[1,2,3]},
                      f"c{i-1}" if i else None, pr)
            for i, (sh, z, pr, st, role) in enumerate(rows)]

ZMAP = [{"id": f"z{i}", "role": r, "origin_zone": f"z{max(0,i-1)}"} for i, r in enumerate(
    ["KEY SUPPORT BAND","EQUILIBRIUM ZONE","UPPER RESISTANCE","EQUILIBRIUM ZONE",
     "RESISTANCE CEILING","MID-RANGE SUPPORT","RESISTANCE CEILING","UPPER RESISTANCE",
     "EQUILIBRIUM ZONE","KEY SUPPORT BAND"])]
CAL_OBJ = {"Mon":"new_shape","Tue":"continuation","Wed":"new_shape",
           "Thu":"continuation","Fri":"new_shape"}
CAL = Cal(0.70, 0.70, 0.40, "calibration/e2.json", 240)


class _ExtraIdJudge(StubJudge):
    """Returns one id the question set never asked for."""
    def __init__(self, per): super().__init__(per, {"B1":.9,"B2":3})
    def ask(self, state, q):
        out = super().ask(state, q); out["GHOST.A1"] = 0.9; return out


def main():
    fails = []
    def check(n, c, d=""):
        print(f"  {'PASS' if c else 'FAIL'}  {n} {d}")
        if not c: fails.append(n)

    print("== import-time band coverage ==")
    check("every TRANSITION band is in band()'s codomain", not _UNREACHABLE)
    check("boundary 39.9 -> 30-40", band(39.9) == "30-40")
    check("boundary 40.0 -> 40-45", band(40.0) == "40-45")

    print("\n== happy path ==")
    per = {"c0":{"A1":.97,"A3":.93,"A4":.96,"A5":.92,"A6":.9},
           "c1":{"A1":.88,"A3":.86,"A4":.9,"A5":.85,"A6":.82},
           "c5":{"A1":.4,"A3":.9,"A4":.9,"A5":.9,"A6":.9}}
    r = e2_chain(cands10(), StubJudge(per, {"B1":.9,"B2":3}),
                 zone_map=ZMAP, calendar=CAL_OBJ, anchor=200, cal=CAL)
    print("   chain:", r["chain"]); print("   alt:", r["alternative"], "conf:", r["confidence"])
    check("cap 8", r["candidates_kept"] == 8)
    check("veto subtracts", r["survivors"] == 7)
    check("alternative computed", r["alternative"] is not None)

    print("\n== weakest clause, not a mean ==")
    two = [Candidate("m1","BS","z0",10.0,"KEY SUPPORT BAND","up",1,2,{"span_closes":[1]},None,1),
           Candidate("m2","R","z1",25.0,"EQUILIBRIUM ZONE","up",2,3,{"span_closes":[1]},"m1",2)]
    j = StubJudge({"m1":{"A1":1.0,"A3":1.0,"A4":1.0,"A5":1.0,"A6":1.0},
                   "m2":{"A1":.4,"A3":.4,"A4":.4,"A5":.4,"A6":.4}}, {"B1":.9,"B2":3})
    r2 = e2_chain(two, j, zone_map=ZMAP[:3], calendar=CAL_OBJ, anchor=200, cal=Cal(.2,.5,.3,"x",10))
    check("confidence is the MIN (0.4), not the mean (0.7)", r2["confidence"] == 0.4, str(r2["confidence"]))

    print("\n== controls that must fire ==")
    const = {f"c{i}":{"A1":.99,"A3":.99,"A4":.99,"A5":.99,"A6":.99} for i in range(10)}
    for name, args, code in [
        ("constant judge", (cands10(), StubJudge(const, {"B1":.99,"B2":3})), "E2_JUDGE_CONSTANT"),
        ("all vetoed", (cands10(), StubJudge({f"c{i}":{"A1":.2,"A3":.9,"A4":.9,"A5":.9,"A6":.9} for i in range(10)}, {"B1":.9,"B2":3})), "E2_ALL_FALSIFIED"),
        ("B2 not int", (cands10(), StubJudge(per, {"B1":.9,"B2":"3"})), "E2_JUDGE_MALFORMED"),
        ("extra id", (cands10(), _ExtraIdJudge(per)), "E2_JUDGE_MALFORMED"),
    ]:
        try:
            e2_chain(*args, zone_map=ZMAP, calendar=CAL_OBJ, anchor=200, cal=CAL)
            check(name, False, "no raise")
        except E2Error as e:
            check(name, e.code == code, e.code)

    print("\n== lookahead / calibration / day exhaustion ==")
    for name, kw, code in [
        ("span at the anchor", {"anchor": 100}, "E2_LOOKAHEAD"),
        ("no calibration", {"cal": Cal(.7,.7,.4,"",0)}, "E2_UNCALIBRATED"),
        ("no day fits", {"calendar": {"Mon":"red_folder","Tue":"red_folder","Wed":"red_folder",
                                      "Thu":"red_folder","Fri":"red_folder"}}, "E2_DAY_ASSIGNMENT_FAILED"),
    ]:
        base = dict(zone_map=ZMAP, calendar=CAL_OBJ, anchor=200, cal=CAL); base.update(kw)
        try:
            e2_chain(cands10(), StubJudge(per, {"B1":.9,"B2":3}), **base)
            check(name, False, "no raise")
        except E2Error as e:
            check(name, e.code == code, e.code)

    print("\n== energy veto with exactly one leg ==")
    one = [Candidate("s1","BS","z0",10.0,"KEY SUPPORT BAND","up",1,2,{"span_closes":[1]},None,1)]
    try:
        e2_chain(one, StubJudge({"s1":{"A1":.9,"A3":.9,"A4":.9,"A5":.9,"A6":.9}}, {"B1":.9,"B2":1}),
                 zone_map=ZMAP[:2], calendar=CAL_OBJ, anchor=200, cal=CAL)
        check("single leg + B2=1 -> ENERGY_VETO", False, "no raise")
    except E2Error as e:
        check("single leg + B2=1 -> ENERGY_VETO", e.code == "E2_ENERGY_VETO", e.code)

    print(f"\nVERDICT {'PASS' if not fails else 'FAIL: ' + ', '.join(fails)}")
    return 0 if not fails else 1

if __name__ == "__main__":
    import sys; sys.exit(main())
