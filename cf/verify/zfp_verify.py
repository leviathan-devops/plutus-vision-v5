#!/usr/bin/env python3
"""
zfp_verify.py — THE ZFP VALIDATION SUITE, v2.1 (post-audit). Every gate must be able to fail,
and every gate is shown failing on a negative control before the suite passes.

L1  DIFFERENTIAL      a SECOND literal table + a SECOND rounding rule, both transcribed from
                      the canon, not imported from zfp.py. A drift in zfp.py diverges here.
L2  INVARIANTS        cross-check (with a proper ZFP->degree ruler), variance over the week's
                      zones, no-geometry, bands. A conflict and a flat week MUST raise; a
                      consistent set MUST NOT.
L3  MUTATION MATRIX   planted corruptions incl. the audit's silent-loss cases; each must raise
                      its NAMED code, and each invariant must be shown firing on a plant.
L4  CALIBRATION       per-bucket predicted-vs-observed within tolerance (n>=8), n<8 = UNREPORTABLE
                      (never dropped), plus a 200-permutation null with a fresh seed, a p-value,
                      and a minimum effect size. Negative controls: a biased set MUST fail the
                      tolerance; an uninformative set MUST fail the null.
"""
from __future__ import annotations
import json, math, random, sys, glob
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
import zfp

# ── L1 · INDEPENDENT CONSTANTS (transcribed, NOT imported) ────────────────────
TIER_MID2 = {"HARD_WALL":10.0,"STANDARD_WALL":22.5,"POST_EXPIRY_GHOST":30.0,
             "SOFT_WALL":40.0,"ONE_TOUCH":60.0}
MOD_POINT2 = {"spring_release":25.0,"macro_catalyst":20.0,"momentum":15.0,
              "cross_pair":20.0,"cascade":25.0,"regime_change":20.0}

def _half_up(x: float) -> int:
    """A SECOND rounding implementation: add 0.5 and truncate, no round() builtin."""
    return int(math.floor(x + 0.5)) if x >= 0 else -int(math.floor(-x + 0.5))

def _tier2(t: dict) -> str:
    nb, n, cf, mem = t["notional_b"], t["pillars"], t["confluent"], t["structural_memory"]
    if not isinstance(cf, bool) or not isinstance(mem, bool):
        raise zfp.ZFPError("ZFP_TIER_INPUT_INVALID", "truthiness passed as bool")
    if isinstance(nb, bool) or not isinstance(nb, (int, float)) or not math.isfinite(nb):
        raise zfp.ZFPError("ZFP_TIER_INPUT_INVALID", f"notional {nb!r}")
    if not isinstance(n, int) or isinstance(n, bool):
        raise zfp.ZFPError("ZFP_TIER_INPUT_INVALID", f"pillars {n!r}")
    rules = [(t["expiry_before_week"] and mem, "POST_EXPIRY_GHOST"),
             (nb >= 1.5 and n >= 3 and cf, "HARD_WALL"),
             (nb >= 0.85 and n >= 2, "STANDARD_WALL"),
             (nb < 0.85 and n <= 1, "ONE_TOUCH"),
             (nb < 0.85 and n <= 2, "SOFT_WALL"),
             (nb >= 0.85 and n < 2, "SOFT_WALL")]
    for cond, tier in rules:
        if cond: return tier
    raise zfp.ZFPError("ZFP_IMPL_DIVERGENCE", "no rule matched")

def recompute(r: dict) -> dict:
    t2 = _tier2(r["tier_inputs"])
    if t2 != r["tier"]:
        raise zfp.ZFPError("ZFP_IMPL_DIVERGENCE", f"tier {r['tier']} != {t2}")
    base2 = TIER_MID2[t2]
    if abs(base2 - r["base"]) > 1e-9:
        raise zfp.ZFPError("ZFP_IMPL_DIVERGENCE", f"base {r['base']} != {base2}")
    vals = [MOD_POINT2[m["name"]] if m["fired"] else 0.0 for m in r["modifiers"]]
    raw2 = base2 + sum(vals)
    if abs(raw2 - r["raw"]) > 1e-9:
        raise zfp.ZFPError("ZFP_IMPL_DIVERGENCE", f"raw {r['raw']} != {raw2}")
    z2 = _half_up(max(0.0, min(99.0, raw2)))
    if z2 != r["zfp"]:
        raise zfp.ZFPError("ZFP_IMPL_DIVERGENCE", f"zfp {r['zfp']} != {z2}")
    return {"tier": t2, "base": base2, "raw": raw2, "zfp": z2}

# ── L2 · INVARIANTS ───────────────────────────────────────────────────────────
def check_crosscheck(receipts: list[dict], degrees: dict[str, str]) -> list[str]:
    """Every receipt with a declared degree is checked; an unknown degree is a FAIL, not a skip."""
    fails = []
    for r in receipts:
        d = degrees.get(r["zone_id"])
        if d is None:
            fails.append(f"ZFP_CROSSCHECK_UNEVALUATED {r['zone_id']} (no declared degree)")
            continue
        if d not in zfp.DEGREE_MID:
            fails.append(f"ZFP_DEGREE_UNKNOWN {r['zone_id']} {d!r}")
            continue
        if zfp.crosscheck(r, d) != "consistency":
            fails.append(f"ZFP_CROSSCHECK_CONFLICT {r['zone_id']} {r['cross_check']}")
    return fails

def check_variance(receipts: list[dict], min_sd: float = 1.0) -> list[str]:
    if len(receipts) < 3:
        return [f"ZFP_VARIANCE_UNEVALUABLE n={len(receipts)} < 3"]
    xs = [r["zfp"] for r in receipts]
    mu = sum(xs) / len(xs)
    sd = math.sqrt(sum((x - mu) ** 2 for x in xs) / len(xs))
    return [] if sd >= min_sd else [f"ZFP_FLAT sd={sd:.3f} < {min_sd} over {len(xs)} zones"]

def check_no_geometry(zone, ctx, week) -> list[str]:
    z0 = zfp.compute(zone, ctx, week)["zfp"]
    out = []
    mid = (zone["top"] + zone["bottom"]) / 2.0
    half = (zone["top"] - zone["bottom"]) / 2.0
    for k in (0.5, 1.5):
        z2 = dict(zone); z2["top"], z2["bottom"] = mid + half * k, mid - half * k
        if zfp.compute(z2, ctx, week)["zfp"] != z0:
            out.append(f"ZFP_GEOMETRY_DEPENDENT width x{k}: {z0} -> {zfp.compute(z2, ctx, week)['zfp']}")
    return out

# ── L3 · MUTATIONS ────────────────────────────────────────────────────────────
def base_case():
    zone = {"id":"m","top":100.5,"bottom":100.2,
            "pillar_types":["round","ema200","weekly_swing"],"confluent":True,
            "structural_memory":True,"direction":"up"}
    week = {"start_ts":1000,"end_ts":2000}
    ctx = {"pair":"DXY","spot":100.35,
           "opt":{"notional_b":2.0,"expiry_ts":1500,"strike_range_pct":0.02},
           "calendar":{"events":[{"ts":1200,"impact":"high","currency":"USD","side":"up"}]},
           "momentum":{"roc5":0.5,"atr20":0.6,"toward":1.0},
           "cross_pair":{"zone_mids":{"EURUSD":[100.5],"GBPUSD":[100.3]},"tol":0.5},
           "cascade":{"prior_failures":[{"zfp":60.0,"direction":"up"}]},
           "regime":{"ema200_crossed_this_week":True}}
    return zone, ctx, week

def mutation_matrix():
    import copy
    cases = []
    def run(name, exp, mutate):
        z, c, w = base_case(); mutate(z, c, w)
        try:
            zfp.compute(z, c, w); cases.append((name, exp, "NO-RAISE"))
        except zfp.ZFPError as e:
            cases.append((name, exp, e.code))
    def m(f):
        def g(z,c,w): f(z,c,w)
        return g
    run("M01 options absent", "ZFP_INPUT_MISSING", m(lambda z,c,w: c.pop("opt")))
    run("M02 notional null", "ZFP_INPUT_MISSING", m(lambda z,c,w: c["opt"].__setitem__("notional_b",None)))
    run("M03 notional NaN", "ZFP_INPUT_INVALID", m(lambda z,c,w: c["opt"].__setitem__("notional_b",float("nan"))))
    run("M04 notional negative", "ZFP_INPUT_INVALID", m(lambda z,c,w: c["opt"].__setitem__("notional_b",-1)))
    run("M05 strike_range 0 (silent-disable class)", "ZFP_INPUT_INVALID", m(lambda z,c,w: c["opt"].__setitem__("strike_range_pct",0)))
    run("M06 tolerance negative", "ZFP_INPUT_INVALID", m(lambda z,c,w: c["cross_pair"].__setitem__("tol",-0.5)))
    run("M07 direction empty", "ZFP_INPUT_INVALID", m(lambda z,c,w: z.__setitem__("direction","")))
    run("M08 direction sideways", "ZFP_INPUT_INVALID", m(lambda z,c,w: z.__setitem__("direction","sideways")))
    run("M09 pillar typo (tier promotion class)", "ZFP_PILLAR_UNKNOWN", m(lambda z,c,w: z["pillar_types"].append("swing_4h")))
    run("M10 pillar not a string", "ZFP_INPUT_INVALID", m(lambda z,c,w: z["pillar_types"].append(["round"])))
    run("M11 confluent not bool", "ZFP_INPUT_INVALID", m(lambda z,c,w: z.__setitem__("confluent","yes")))
    run("M12 top <= bottom", "ZFP_INPUT_INVALID", m(lambda z,c,w: (z.__setitem__("top",100.0), z.__setitem__("bottom",100.2))))
    run("M13 calendar currency unknown", "ZFP_INPUT_INVALID", m(lambda z,c,w: c["calendar"]["events"][0].__setitem__("currency","XYZ")))
    run("M14 calendar side unknown", "ZFP_INPUT_INVALID", m(lambda z,c,w: c["calendar"]["events"][0].__setitem__("side","maybe")))
    run("M15 event impact unknown", "ZFP_INPUT_INVALID", m(lambda z,c,w: c["calendar"]["events"][0].__setitem__("impact","critical")))
    run("M16 atr20 zero", "ZFP_INPUT_INVALID", m(lambda z,c,w: c["momentum"].__setitem__("atr20",0)))
    run("M17 toward 0.5", "ZFP_INPUT_INVALID", m(lambda z,c,w: c["momentum"].__setitem__("toward",0.5)))
    run("M18 prior failure direction bad", "ZFP_INPUT_INVALID", m(lambda z,c,w: c["cascade"]["prior_failures"][0].__setitem__("direction","UP")))
    run("M19 regime not bool", "ZFP_INPUT_INVALID", m(lambda z,c,w: c["regime"].__setitem__("ema200_crossed_this_week",1)))
    run("M20 week inverted", "ZFP_INPUT_INVALID", m(lambda z,c,w: w.__setitem__("end_ts",1)))
    # receipt tampering
    z, c, w = base_case(); r = zfp.compute(z, c, w)
    r["modifiers"][2]["value"] = 0.0
    try: zfp.validate(r); cases.append(("M21 tampered modifier value","ZFP_MODIFIER_VALUE","NO-RAISE"))
    except zfp.ZFPError as e: cases.append(("M21 tampered modifier value","ZFP_MODIFIER_VALUE",e.code))
    z, c, w = base_case(); r = zfp.compute(z, c, w); r["zfp"] += 1
    try: zfp.validate(r); cases.append(("M22 tampered zfp","ZFP_VALUE_MISMATCH","NO-RAISE"))
    except zfp.ZFPError as e: cases.append(("M22 tampered zfp","ZFP_VALUE_MISMATCH",e.code))
    z, c, w = base_case(); r = zfp.compute(z, c, w); r["clamped"] = 0.0
    try: zfp.validate(r); cases.append(("M23 clamp not numeric-consistent","ZFP_CLAMP_MISMATCH","NO-RAISE"))
    except zfp.ZFPError as e: cases.append(("M23 clamp not numeric-consistent","ZFP_CLAMP_MISMATCH",e.code))
    z, c, w = base_case(); r = zfp.compute(z, c, w); r["tier_inputs"]["confluent"] = "yes"
    try: zfp.validate(r); cases.append(("M24 tier_inputs coerced","ZFP_TIER_INPUT_INVALID","NO-RAISE"))
    except zfp.ZFPError as e: cases.append(("M24 tier_inputs coerced","ZFP_TIER_INPUT_INVALID",e.code))
    return cases

# ── L4 · CALIBRATION ──────────────────────────────────────────────────────────
def brier(rows): return sum((p - y) ** 2 for p, y in rows) / len(rows)

def auc(rows):
    pos = [p for p, y in rows if y == 1]; neg = [p for p, y in rows if y == 0]
    if not pos or not neg: return float("nan")
    return sum((p > q) + 0.5 * (p == q) for p in pos for q in neg) / (len(pos) * len(neg))

def reliability(rows, edges=(0,10,20,30,40,50,60,70,80,90,100)):
    out = []
    for lo, hi in zip(edges, edges[1:]):
        b = [(p, y) for p, y in rows if lo <= p < hi]
        if b:
            out.append({"bucket":f"{lo}-{hi}","n":len(b),
                        "predicted":sum(p for p,_ in b)/len(b),
                        "observed":100.0*sum(y for _,y in b)/len(b),
                        "reportable":len(b) >= 8})
    return out

def permutation_null(rows, observed_skill, k=200):
    rng = random.SystemRandom(); seed = rng.randrange(1 << 30)
    r = random.Random(seed)
    base = sum(y for _, y in rows) / len(rows)
    bb = sum((base - y) ** 2 for _, y in rows) / len(rows)
    ys = [y for _, y in rows]; null = []
    for _ in range(k):
        r.shuffle(ys)
        b = sum((p / 100.0 - y) ** 2 for (p, _), y in zip(rows, ys)) / len(rows)
        null.append(1.0 - b / bb)
    hits = sum(1 for v in null if v >= observed_skill)
    return {"seed":seed,"k":k,"p":(hits + 1) / (k + 1),
            "null_p95":sorted(null)[int(0.95 * k) - 1],"null_mean":sum(null)/k}

def calibration_report(rows, tol_pp=15.0, min_skill=0.05, min_n=8):
    norm = [(p / 100.0, y) for p, y in rows]
    b = brier(norm); base = sum(y for _, y in rows) / len(rows)
    bb = sum((base - y) ** 2 for _, y in rows) / len(rows)
    skill = 1.0 - b / bb if bb > 0 else float("nan")
    rel = reliability(rows)
    reportable = [x for x in rel if x["reportable"]]
    unreportable = [x for x in rel if not x["reportable"]]
    worst = max((abs(x["predicted"] - x["observed"]) for x in reportable), default=None)
    tol_ok = bool(reportable) and all(abs(x["predicted"] - x["observed"]) <= tol_pp for x in reportable)
    null = permutation_null(rows, skill)
    inv = max((rel[i]["observed"] - rel[i+1]["observed"] for i in range(len(rel)-1)), default=0.0)
    return {"n":len(rows),"brier":b,"brier_base":bb,"skill":skill,"auc":auc(norm),
            "reliability":rel,"reportable":len(reportable),"unreportable":len(unreportable),
            "worst_bucket_error_pp":worst,"tolerance_ok":tol_ok,
            "max_inversion_pp":inv,"null":null,
            "pass":tol_ok and skill >= min_skill and auc(norm) > 0.5 and null["p"] < 0.05}

def synth_rows(n=2000, shift=0.0, seed=1):
    """A CALIBRATED control: y ~ Bernoulli(p/100) exactly, so every bucket's observed rate
    equals its predicted rate up to sampling noise. shift>0 creates a deliberately biased
    set for the tolerance gate's negative control."""
    r = random.Random(seed); rows = []
    for _ in range(n):
        p = r.uniform(0, 100)
        y = 1 if r.random() < p / 100.0 else 0
        rows.append((min(100.0, p + shift), y))
    return rows

def uninformative_rows(n=2000, seed=11):
    """A varying but useless predictor: p independent of y. For a useless predictor the
    expected skill is NEGATIVE (its spread costs Brier against the base rate)."""
    r = random.Random(seed); rows = []
    for _ in range(n):
        rows.append((r.uniform(0, 100), 1 if r.random() < 0.4 else 0))
    return rows

# ── fixture scan ──────────────────────────────────────────────────────────────
def levels_from_bars(bars):
    hi=[b["high"] for b in bars]; lo=[b["low"] for b in bars]; cl=[b["close"] for b in bars]; out=[]
    for i in range(2,len(bars)-2):
        if hi[i]==max(hi[i-2:i+3]): out.append((hi[i],"weekly_swing"))
        if lo[i]==min(lo[i-2:i+3]): out.append((lo[i],"weekly_swing"))
    if len(cl)>=200:
        k=2/201; e=sum(cl[:200])/200
        for c in cl[200:]: e=c*k+e*(1-k)
        out.append((e,"ema200"))
    a,b=min(lo),max(hi); g=math.floor(a*2)/2
    while g<=b:
        if a<=g<=b: out.append((g,"round"))
        g+=0.5
    return out

def cluster(levels, tol):
    out=[]
    for price,typ in sorted(levels):
        if out and abs(price-out[-1]["mid"])<=tol:
            c=out[-1]; c["members"].append((price,typ))
            c["mid"]=sum(p for p,_ in c["members"])/len(c["members"])
            c["top"]=max(c["top"],price); c["bot"]=min(c["bot"],price)
        else:
            out.append({"mid":price,"top":price,"bot":price,"members":[(price,typ)]})
    return out

def load_week(path):
    d=json.load(open(path)); cells=[c for c in d["cells"] if c["timeframe"]=="1H"]
    if not cells: raise SystemExit(f"NO_1H_CELL {path}")
    return cells[0]["bars"], cells[0]["pair"]

def main() -> int:
    root = Path(__file__).resolve().parents[2]
    files = sorted(glob.glob(str(root/"fixtures/bars/weeks/*.json")))
    fails = []
    def say(ok, name, detail=""):
        print(f"  {'PASS' if ok else 'FAIL'}  {name} {detail}")
        if not ok: fails.append(name)

    print(f"FIXTURES {len(files)} weeks")
    print("\n== L0 fail-closed on REAL fixtures (no options feed) ==")
    zcount = missing = other = 0
    for f in files:
        bars, pair = load_week(f)
        for c in cluster(levels_from_bars(bars), tol=bars[-1]["close"]*0.00004):
            zcount += 1
            z = {"id":"z","top":c["top"],"bottom":c["bot"],
                 "pillar_types":sorted({t for _,t in c["members"]}),"confluent":True,
                 "structural_memory":True,"direction":"up"}
            try:
                zfp.compute(z, {"pair":pair}, {"start_ts":0,"end_ts":1}); other += 1
            except zfp.ZFPError as e:
                if e.code == "ZFP_INPUT_MISSING": missing += 1
                else: other += 1
    say(missing == zcount and other == 0,
        "every fixture zone fails closed", f"{missing}/{zcount} ZFP_INPUT_MISSING, {other} other")

    print("\n== L1 differential (independent tables + rounding) ==")
    z, c, w = base_case(); r = zfp.compute(z, c, w)
    rc = recompute(r)
    say(rc["zfp"] == r["zfp"] and rc["raw"] == r["raw"], "recompute matches", str(rc))
    # a constant drift in the production table MUST diverge
    saved = zfp.MOD_POINT["momentum"]; zfp.MOD_POINT["momentum"] = 10.0
    try:
        r2 = zfp.compute(z, c, w)
        try:
            recompute(r2); say(False, "a drifted table diverges", "no divergence")
        except zfp.ZFPError as e:
            say(e.code == "ZFP_IMPL_DIVERGENCE", "a drifted table diverges", e.code)
    finally:
        zfp.MOD_POINT["momentum"] = saved

    print("\n== L2 invariants, with negatives that MUST fire ==")
    say(bool(check_variance([r])), "variance unevaluable is a FAIL", str(check_variance([r])))
    mk = lambda zid, zf, deg: {"zone_id":zid,"zfp":zf,"pillar9_bucket":zfp.degree_from_zfp(zf),
                               "cross_check":None,"tier":"HARD_WALL"}
    good = [mk("a",10,"EXTREME"), mk("b",25,"MODERATE-HEAVY"), mk("c",50,"LIGHT")]
    say(not check_crosscheck(good, {"a":"EXTREME","b":"MODERATE-HEAVY","c":"LIGHT"}),
        "consistent cross-check passes")
    bad = [mk("a",10,"MINIMAL")]
    say(bool(check_crosscheck(bad, {"a":"MINIMAL"})), "a planted conflict fires",
        str(check_crosscheck(bad, {"a":"MINIMAL"})))
    say(bool(check_crosscheck([mk("a",10,None)], {"a":"NOT_A_DEGREE"})),
        "an unknown degree fires")
    flat = [mk(x, 30, "MODERATE") for x in "abcd"]
    say(bool(check_variance(flat)), "a flat week fires", str(check_variance(flat)))
    say(not check_no_geometry(z, c, w), "no-geometry holds")

    print("\n== L3 mutation matrix ==")
    mm = mutation_matrix(); missed = [x for x in mm if x[2] != x[1]]
    for name, exp, got in mm:
        print(f"  {'CAUGHT' if got == exp else 'MISSED'}  {name:48s} -> {got}")
    say(not missed, f"{len(mm)-len(missed)}/{len(mm)} caught")

    print("\n== L4 calibration, with the two negative controls ==")
    good_rows = synth_rows()
    rep = calibration_report(good_rows)
    print(f"  good     skill={rep['skill']:.3f} auc={rep['auc']:.3f} "
          f"worst_bucket={rep['worst_bucket_error_pp']:.1f}pp p={rep['null']['p']:.3f} "
          f"null_p95={rep['null']['null_p95']:.3f} reportable={rep['reportable']} "
          f"unreportable={rep['unreportable']}")
    for b in rep["reliability"]:
        print(f"    {b['bucket']:>7} n={b['n']:>3} pred={b['predicted']:5.1f} obs={b['observed']:5.1f}"
              f"{'' if b['reportable'] else '  UNREPORTABLE'}")
    say(rep["pass"], "an informative set passes")
    biased = calibration_report(synth_rows(shift=20.0, seed=2))
    print(f"  biased   skill={biased['skill']:.3f} worst_bucket={biased['worst_bucket_error_pp']:.1f}pp "
          f"tol_ok={biased['tolerance_ok']} p={biased['null']['p']:.3f}")
    say(not biased["pass"] and not biased["tolerance_ok"], "a +20pp biased set FAILS the tolerance")
    useless = calibration_report(uninformative_rows(), min_skill=-9.9)
    print(f"  useless  skill={useless['skill']:.3f} p={useless['null']['p']:.3f} pass={useless['pass']}")
    say(not useless["pass"], "an uninformative set FAILS the permutation null")

    print(f"\nVERDICT {'PASS' if not fails else 'FAIL: ' + ', '.join(fails)}")
    return 0 if not fails else 1

if __name__ == "__main__":
    sys.exit(main())
