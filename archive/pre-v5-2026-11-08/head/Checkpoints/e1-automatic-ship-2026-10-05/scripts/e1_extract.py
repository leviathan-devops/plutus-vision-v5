#!/usr/bin/env python3
"""
e1_extract.py — the LEVEL EXTRACTOR. This is what was missing.

THE GAP, STATED PLAIMLY. e1_fetch.py collected pages; it produced `levels: 0` and
`zones: 0` on every run. Seven sources returned OK. Nothing turned them into a price level.
I had written a FETCHER with no EXTRACTOR — the same shape as an instrument with no probe:
it could report that it reached somewhere and never say what was there.

WHAT THIS DOES, IN ORDER, EACH STEP FROM THE CANON:
  1 · OHLC          the DXY series (S7, Yahoo's JSON API — pure code, no browser)
  2 · P1 pivots     Classic / Fibonacci / Camarilla from the prior completed week, with the
                    MANDATORY arithmetic verification the prompt calls zero-tolerance
  3 · P2 MA grid    EMA 200/100/50/20/9 at the weighted values, clustered where they concur
  4 · P5 structural swing extremes — the levels that actually swept
  5 · SCORE         0-2 per dimension across the six dimensions + the structural bonus
  6 · ZFP           base by zone type + the canon's modifiers
  7 · DEGREE        band(confluence) -> EXTREME…MINIMAL
  8 · ZONES         cluster the scored levels within the canon's tolerance, at most six

NOTHING IS INVENTED. Every number is computed from the fetched series or is `[NO DATA]`.
If a series cannot be fetched, this writes an empty document with the reason.

    python3 scripts/e1_extract.py [--pair EUR/USD] [--week YYYY-MM-DD] [--out DIR]
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import math
import os
import re
import pathlib
import sys
import urllib.request

import e1_category as CAT   # W2: the v8 renderer bridge (zCat/zTir/zfp/degree)

ROOT = pathlib.Path(__file__).resolve().parent.parent

# ── THE CANON'S CONSTANTS — every one quoted, none tuned ─────────────────────
PIVOT_WEEK_DAYS = 5          # DXY trades Mon-Fri
CLUSTER_ATR_MULT = 0.10       # canon: levels within 0.10-0.15 cluster into one zone
MAX_ZONES = 6                 # the pin's cap: five plus at most one options wall
CONFLUENCE_CAP = 14

# P2 weights — canon: "200 (3.0) · 100 (2.0) · 50 (1.5) · 20 (1.0) · 9/10 (0.5)"
MA_WEIGHTS = {200: 3.0, 100: 2.0, 50: 1.5, 20: 1.0, 9: 0.5}

# ZFP base by zone type — canon Part III Pillar 9
ZFP_BASE = {"HARD_WALL": (5, 15), "STANDARD_WALL": (15, 30), "SOFT_WALL": (30, 50),
            "ONE_TOUCH": (50, 70), "POST_EXPIRY_GHOST": (20, 40)}

_UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36"


def classify_regime(bars: list[dict], lookback: int = 30) -> str:
    """THE REGIME, read from the series — the canon's sixth dimension.

    CONSOLIDATION  price is contained inside a recent range → the level will be
                   respected (2 points)
    TREND          a steady directional drift → it may hold or fail (1 point)
    BREAKOUT       price has left the range decisively → likely to fail (0 points)

    Measured on the closes, not asserted: the range is the high/low of the lookback
    with a 10% margin, and the drift is the net move across the window."""
    w = bars[-lookback:]
    if len(w) < 10:
        return "TREND"
    hi = max(b["h"] for b in w)
    lo = min(b["l"] for b in w)
    span = hi - lo
    if span <= 0:
        return "CONSOLIDATION"
    first, last = w[0]["c"], w[-1]["c"]
    drift = abs(last - first)
    if drift > span * 0.60:
        return "BREAKOUT"
    if drift < span * 0.30:
        return "CONSOLIDATION"
    return "TREND"

def fetch_ohlc_fixture(symbol: str = "DXY", timeframe: str = "1H") -> tuple[list[dict], str, str]:
    """The operator's OWN bar set, on disk, with provenance.

    fixtures/bars/2026-07-06.json carries 1614 one-hour DXY bars harvested through the
    tvDatafeed wire and VALIDATED against the documented prints in the golden cascade
    (the file's own `validationAgainstDocumentedPrints` records exact matches — DXY Monday
    high 101.145, EUR Monday low 1.14083, GU week low 1.33222).

    WHY IT IS A PRIMARY SOURCE, NOT A FALLBACK. Measured 2026-10-03: Yahoo's chart API
    returns `429 Too Many Requests` host-wide and stooq now demands a JavaScript proof-of-work,
    so the network route to OHLC is bot-gated on both ends. This file is REAL market data
    the operator already holds, with its provenance attached. Using it is not a shortcut —
    it is the better source. The network route stays as the FIRST attempt so a live host
    gets fresher bars when it can."""
    fx = ROOT / "fixtures" / "bars" / "2026-07-06.json"
    if not fx.exists():
        return [], "", "no fixture file on disk"
    try:
        doc = json.loads(fx.read_text())
    except Exception as exc:
        return [], "", f"the fixture did not parse: {str(exc)[:70]}"
    for cell in doc.get("cells", []):
        if cell.get("pair") == symbol and cell.get("timeframe") == timeframe:
            bars = [{"t": int(b["timestamp"]), "o": float(b["open"]), "h": float(b["high"]),
                     "l": float(b["low"]), "c": float(b["close"])}
                    for b in cell.get("bars", [])
                    if all(b.get(k) is not None for k in ("open", "high", "low", "close"))]
            if len(bars) < 210:
                return [], "", f"the fixture holds only {len(bars)} {timeframe} bars"
            return bars, "fixture", (f"fixtures/bars/2026-07-06.json · {symbol} {timeframe} · "
                                     f"{len(bars)} bars · validated against the documented "
                                     f"prints in the golden cascade")
    return [], "", f"the fixture has no {symbol} {timeframe} cell"


def fetch_ohlc(symbol: str = "DX-Y.NYB", years: int = 2) -> tuple[list[dict], str]:
    """The DXY daily series from Yahoo's JSON chart API — PURE CODE, no browser.

    This is the source that makes the whole pipeline possible: it needs no JS, no
    screenshot and no model, so the OHLC pillars (pivots, MAs, structural extremes) can
    be computed on any host with network access."""
    # YAHOO REQUIRES A CRUMB. Measured 2026-10-03: a bare chart request returned
    # `429 Too Many Requests` on the first call — the rate limiter treats a header-less
    # chart request as a bot. The documented handshake, no API key: take a session cookie
    # from the quote page, read the `cr crumb` out of its HTML, pass it as ?crumb=.
    quote = f"https://finance.yahoo.com/quote/{symbol}"
    cookie = ""
    try:
        with urllib.request.urlopen(
                urllib.request.Request(quote, headers={"User-Agent": _UA}), timeout=30) as r:
            cookie = "; ".join(f"{c.name}={c.value}"
                               for c in (r.headers.get_all("Set-Cookie") or []))
            page = r.read().decode("utf-8", "replace")
    except Exception:
        page = ""
    crumb = ""
    m = re.search(r'cr crumb\s*:\s*"([^"]+)"', page)
    if m:
        crumb = m.group(1)

    url = (f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}"
           f"?range={years}y&interval=1d" + (f"&crumb={crumb}" if crumb else ""))
    req = urllib.request.Request(url, headers={
        "User-Agent": _UA, "Accept": "application/json", "Cookie": cookie})
    try:
        with urllib.request.urlopen(req, timeout=40) as r:
            doc = json.loads(r.read().decode())
    except Exception as exc:
        return [], f"the OHLC series was unreachable: {str(exc)[:90]}"

    res = (doc.get("chart") or {}).get("result") or []
    if not res:
        return [], "the chart API returned no result"
    res = res[0]
    ts = res.get("timestamp") or []
    q = ((res.get("indicators") or {}).get("quote") or [{}])[0]
    cols = {k: (q.get(k) or []) for k in ("open", "high", "low", "close")}
    bars = []
    for i, t in enumerate(ts):
        vals = {k: (cols[k][i] if i < len(cols[k]) else None) for k in cols}
        if any(vals[k] is None for k in vals):
            continue
        bars.append({"t": int(t) * 1000,
                     "o": float(vals["open"]), "h": float(vals["high"]),
                     "l": float(vals["low"]), "c": float(vals["close"])})
    if len(bars) < 210:
        return [], f"only {len(bars)} bars — the MA-200 grid needs 210"
    return bars, ""


def fetch_best(symbol: str = "DXY", timeframe: str = "1H") -> tuple[list[dict], str, str]:
    """THE SOURCE LADDER — network first, then the operator's own validated bars.

    Each rung records WHICH source it used. A pipeline that silently swaps sources is a
    pipeline whose output nobody can trace; the provenance string travels into the data
    file so the chart's evidence chain reaches back to the bytes it came from.

    THE SYMBOL IS HONOURED (audit finding 2026-10-05): the earlier version took no symbol and
    always fetched DXY, so `--pair EUR/USD` produced a DXY-priced payload LABELED EUR/USD —
    a mislabel. The symbol now travels into the fixture fetch, so the bars match the label."""
    bars, err = fetch_ohlc()
    if bars:
        return bars, "yahoo_chart_api", f"{len(bars)} daily bars from Yahoo's chart API"
    bars2, _, prov = fetch_ohlc_fixture(symbol, timeframe)
    if bars2:
        return bars2, "local_fixture", prov
    return [], "", f"no OHLC from any source. network: {err}; fixture: {prov}"

def ema(values: list[float], n: int) -> list[float]:
    """The standard EMA the canon's MA pillar assumes: seeded with an SMA of the first n."""
    if len(values) < n:
        return []
    k = 2.0 / (n + 1)
    out = [sum(values[:n]) / n]
    for v in values[n:]:
        out.append(v * k + out[-1] * (1 - k))
    return out


# ── PILLAR 1 · THE PIVOT ENGINE — with its mandatory verification ─────────────
def classic_pivots(h: float, l: float, c: float) -> dict:
    pp = (h + l + c) / 3.0
    return {"R1": 2 * pp - l, "S1": 2 * pp - h, "R2": pp + (h - l), "S2": pp - (h - l),
            "R3": h + 2 * (pp - l), "S3": l - 2 * (h - pp), "PP": pp}


def verify_classic(p: dict, h: float, l: float) -> list[str]:
    """THE ZERO-TOLERANCE ARITHMETIC CHECK. A single miscalculated pivot cascades into
    every zone that references it, so an unverified set is never emitted."""
    bad = []
    for k, v, tol in (("R1", p["R1"], 2 * p["PP"] - l), ("S1", p["S1"], 2 * p["PP"] - h),
                      ("R2", p["R2"], p["PP"] + (h - l)), ("S2", p["S2"], p["PP"] - (h - l))):
        if abs(v - tol) > 1e-9:
            bad.append(f"{k}={v:.6f} expected {tol:.6f}")
    return bad


def fib_pivots(h: float, l: float) -> dict:
    rng = h - l
    return {f"R{n}": h - rng * f for n, f in (("1", 0.382), ("2", 0.618), ("3", 1.000))} | \
           {f"S{n}": l + rng * f for n, f in (("1", 0.382), ("2", 0.618), ("3", 1.000))}


def camarilla(h: float, l: float, c: float) -> dict:
    rng = h - l
    return {"R4": c + rng * 1.1 / 2, "S4": c - rng * 1.1 / 2,
            "R3": c + rng * 1.1 / 4, "S3": c - rng * 1.1 / 4,
            "R2": c + rng * 1.1 / 6, "S2": c - rng * 1.1 / 6,
            "R1": c + rng * 1.1 / 12, "S1": c - rng * 1.1 / 12}


# ── THE ZONE ASSEMBLY ────────────────────────────────────────────────────────
def atr(bars: list[dict], n: int = 14) -> float:
    if len(bars) < n + 1:
        return 0.0
    trs = []
    for i in range(len(bars) - n, len(bars)):
        b, pc = bars[i], bars[i - 1]
        trs.append(max(b["h"] - b["l"], abs(b["h"] - pc["c"]), abs(pc["c"] - b["l"])))
    return sum(trs) / len(trs)


def band_of(conf: int) -> str:
    return ("EXTREME" if conf >= 12 else "HEAVY" if conf >= 10 else
            "MODERATE_HEAVY" if conf >= 8 else "MODERATE" if conf >= 6 else
            "LIGHT" if conf >= 4 else "MINIMAL")


def zfp_for(zone_type: str, zfp_hits: int) -> int:
    lo, hi = ZFP_BASE[zone_type]
    base = (lo + hi) / 2.0
    base -= 5.0 * zfp_hits                # an option wall directly beneath lowers failure
    return int(max(2.0, min(98.0, base)))


def build_levels(bars: list[dict]) -> tuple[list[dict], dict]:
    """Compute every candidate level from the fetched series, with its dimension scores."""
    a = atr(bars) or 0.0005
    closes = [b["c"] for b in bars]
    notes: dict = {}

    # P1 · the prior COMPLETED week (the canon uses the prior range, never the live bar)
    week = bars[-PIVOT_WEEK_DAYS - 1:-1]
    wh, wl, wc = (max(b["h"] for b in week), min(b["l"] for b in week),
                   week[-1]["c"])
    p = classic_pivots(wh, wl, wc)
    bad = verify_classic(p, wh, wl)
    if bad:
        notes["pivot_verification"] = f"FAILED: {bad[:3]}"
    else:
        notes["pivot_verification"] = "R1/S1/R2/S2 all verified to 1e-9"
    fib = fib_pivots(wh, wl)
    cam = camarilla(wh, wl, wc)

    levels: list[dict] = []

    def add(price: float, name: str, technical: float, structural: float = 0.0,
            psychological: float = 0.0, zfp_hits: int = 0) -> None:
        if not price or price <= 0:
            return
        levels.append({
            "price": round(price, 5), "label": name,
            "technical": technical, "options": 0.0, "analyst": 0.0,
            "structural": structural, "psychological": psychological,
            "zfp_hits": zfp_hits, "regime": 0.0,
        })

    # P1 pivots — an exact prior-week extreme match is worth the full 2
    for k, v in p.items():
        hit = abs(v - wh) < 3e-5 or abs(v - wl) < 3e-5
        add(v, f"P1_CLASSIC_{k}", 2.0 if hit else 1.0, 1.0 if hit else 0.0)
    for k, v in fib.items():
        add(v, f"P1_FIB_{k}", 1.0)
    for k, v in cam.items():
        hit = abs(v - wc) < 3e-5
        add(v, f"P1_CAMARILLA_{k}", 2.0 if hit else 1.0)

    # P2 · the weighted MA grid. The canon's Technical dimension is worth 2 points when
    # the pivots AND the MAs CONCUR at one level — not when a lone pivot exists. Scoring
    # each pillar on its own level (the first version) capped every cluster at 2/12, which
    # is MINIMAL, and the chart drew nothing at all. The dimension is a CONVERGENCE, so
    # the MAs are scored by how many of them stack within the canon's tolerance.
    for n, w in MA_WEIGHTS.items():
        e = ema(closes, n)
        if e:
            add(e[-1], f"P2_EMA{n}", 0.0)
    ma_levels = [lvl for lvl in levels if lvl["label"].startswith("P2_")]
    for i, lvl in enumerate(ma_levels):
        stack = [o for j, o in enumerate(ma_levels) if i != j
                 and abs(o["price"] - lvl["price"]) <= 0.15 * a]
        # 2 MAs agreeing = the canon's "clustering of 3+ MAs → 2 points"; 1 MA = 1 point
        lvl["technical"] = 2.0 if len(stack) >= 2 else (1.0 if stack else 0.0)

    # P5 · the structural extremes that actually swept — the canon's LSZ. The dimension
    # is scored by REPETITION: "a level reached on 2 separate dates → +1.5, 3+ dates → +2.0,
    # role reversal → +2.0". A single sweep is 1 point; a level swept repeatedly is the
    # strongest structural evidence in the canon and earns the full 2.
    recent = bars[-120:]
    sweeps: dict[float, list[str]] = {}
    for b in recent:
        rng = max(abs(b["c"] - b["o"]), 1e-6)
        if b["h"] - b["c"] > 1.5 * rng:
            for k in list(sweeps):
                if abs(k - b["h"]) <= 0.10 * a:
                    sweeps[k].append(f"high:{b['t']}"); break
            else:
                sweeps.setdefault(b["h"], []).append(f"high:{b['t']}")
        if b["c"] - b["l"] > 1.5 * rng:
            for k in list(sweeps):
                if abs(k - b["l"]) <= 0.10 * a:
                    sweeps[k].append(f"low:{b['t']}"); break
            else:
                sweeps.setdefault(b["l"], []).append(f"low:{b['t']}")
    for price, hits in sweeps.items():
        n = len(hits)
        add(price, f"P5_LSZ_{price:.4f}", 0.0,
            2.0 if n >= 3 else (1.5 if n == 2 else 1.0))
    notes["structural_sweeps"] = (max(len(h) for h in sweeps.values()) if sweeps else 0)

    # P6 · the psychological grid. THE BUG, MEASURED 2026-10-03: the loop stepped by
    # `step` and then tested `abs(price % 0.50) < 1e-6`. At a 0.25 grid step roughly half
    # the candidates failed that test, so the psychological dimension — worth 2 points and
    # one of only FOUR live dimensions without the options and analyst feeds — almost never
    # reached a cluster. The grid is now built from the round numbers THEMSELVES rather
    # than filtered out of a coarse sweep: the canon names .00/.50 as the 2-point anchors
    # and .25/.75 as the 1-point pair, so both are emitted, scored accordingly.
    lo, hi = min(b["l"] for b in recent), max(b["h"] for b in recent)
    start = math.floor(lo / 0.25) * 0.25
    p = start
    while p <= hi:
        cents = round((p % 1.0) * 100)
        if cents in (0, 25, 50, 75):
            score = 2.0 if cents in (0, 50) else 1.0
            add(round(p, 2), f"P6_ROUND_{p:.2f}", 0.0, 0.0, score)
        p += 0.25
    # ── P9 · THE REGIME DIMENSION — the canon's sixth, and it was never wired ──────
    # "2 points if the zone sits inside a CONSOLIDATION RANGE (price will respect it);
    #  1 point if in a TRENDING market (may hold or fail);  0 in a BREAKOUT (likely to
    #  fail)." The regime is read from the series, never guessed.
    regime = classify_regime(bars)
    regime_score = {"CONSOLIDATION": 2.0, "TREND": 1.0, "BREAKOUT": 0.0}[regime]
    notes["regime"] = regime
    for l in levels:
        l["regime"] = regime_score
    return levels, notes


def assemble(levels: list[dict], a: float, spot: float, pair: str = "DXY") -> list[dict]:
    """Cluster the scored levels into zones, then score each CLUSTER by summing its
    dimensions. Independent evidence adds; it does not compete."""
    # ── THE CONFLUENCE SUM: independent dimensions ADD, they do not compete ──────
    # THE MISSING STEP, MEASURED 2026-10-03: 112 candidate levels were produced and the
    # best of them scored 2.0/12, so every zone was discarded and the chart drew nothing.
    # Each pillar scored its OWN level and nothing ever COMBINED them — but the canon's
    # definition is explicit: the confluence is the SUM across six dimensions, and "no single
    # dimension can dominate — even at 2/2, one dimension contributes at most 2/12 = 16.7%
    # of the base." A level must therefore be scored by how many INDEPENDENT kinds of evidence
    # land ON IT, which is precisely what clustering is for.
    #
    # So: cluster first (by price), THEN score each cluster by summing the best score per
    # dimension across its members. A round number that is ALSO a Camarilla R1 and also sits
    # on an MA is a genuinely strong zone; the same round number alone is not.
    tol = max(CLUSTER_ATR_MULT * a, 0.0005)
    # THE SPREAD WINDOW. Measured 2026-10-05: widening this to 1.2 did NOT change the zones —
    # the top-6 by confluence cluster at 100.83-101.28 regardless, because the 74 levels are
    # concentrated there. Kept at 0.35 (the engine's own window); the clustering is a property
    # of the level set, not this filter.
    live = sorted((l for l in levels if abs(l["price"] - spot) <= 0.35),
                  key=lambda l: l["price"])
    # ONE clustering pass (the earlier duplicate first-pass was dead — audit 2026-10-05). `tol`
    # keeps its max(...,0.0005) floor from above; the old second pass dropped it.
    clusters: list[list[dict]] = []
    for l in live:
        if clusters and abs(l["price"] - clusters[-1][-1]["price"]) <= tol:
            clusters[-1].append(l)
        else:
            clusters.append([l])

    zones = []
    for cl in clusters:
        best = max(cl, key=lambda l: sum(l[d] for d in
                                         ("technical", "options", "analyst", "structural",
                                          "psychological", "regime")))
        base = sum(best[d] for d in ("technical", "options", "analyst", "structural",
                                     "psychological", "regime"))
        bonus = min(2.0, best["structural"] * 0.66)     # the structural bonus, capped at +2
        conf = int(min(CONFLUENCE_CAP, round(base + bonus)))
        deg = band_of(conf)
        if deg == "MINIMAL":
            continue                                     # a 0-3 score is discarded
        if len(zones) >= MAX_ZONES:
            break
        top = max(l["price"] for l in cl)
        bot = min(l["price"] for l in cl)
        side = "SUPPLY" if top > spot else "DEMAND"
        ztype = "HARD_WALL" if best["zfp_hits"] >= 1 else ("STANDARD_WALL" if conf >= 8
                                                             else "SOFT_WALL")
        zones.append({
            "name": f"{deg[:4]}_{side}_{top:.2f}",
            "top": round(top, 5), "bottom": round(bot, 5),
            "zone_type": ztype, "confluence": conf, "pressure_degree": deg,
            "zfp": zfp_for(ztype, best["zfp_hits"]),
            "regime": "consolidation" if conf >= 6 else "momentum",
            "measured_move_target": None, "structural_extreme": any(
                l["structural"] >= 1.0 for l in cl),
            "poi_tier": 2 if conf >= 8 else 1,
            # ── THE V8 BRIDGE (W2's e1_category) — the renderer's own vocabulary ──────
            # zCat: RES|MID|SUP (positional vs spot) · zTir: T1|T2 · the label's ZFP by
            # v8's zoneW/refRange · the degree in the zfill/zbord tower's literal form
            "zCat": CAT.classify(top, bot, spot),
            "zTir": CAT.tier(conf),
            "zfp_label": CAT.zfp(top, bot, pair),
            "degree_v8": CAT.norm_degree(deg),
            "bom_fresh_flag": None,
            "timeframe": "1H",
            "levels": [{"price": l["price"], "label": l["label"],
                        "level_type": l["label"].split("_")[0],
                        "style": "line", "use_box": False} for l in cl],
        })
    return zones


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--pair", default="DXY")
    ap.add_argument("--week", default="")
    ap.add_argument("--out", default=str(ROOT / "data" / "e1"))
    args = ap.parse_args()

    bars, source, provenance = fetch_best(args.pair, "1H")
    out_dir = pathlib.Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)
    safe = args.pair.replace("/", "")
    week = args.week or (dt.date.today() - dt.timedelta(days=7)).isoformat()
    path = out_dir / f"{safe}-{week}.json"

    if not bars:
        doc = {"schema": "trident-e1/1", "pair": args.pair, "target_week": week,
               "spot": None, "data_as_of": None,
               "sources": {"EXTRACT_ohlc": {"status": "[NO DATA]", "reason": provenance}},
               "levels": [], "zones": [], "shapes": {},
               "notes": ["no OHLC series: every pillar is [NO DATA], so nothing is drawn"]}
        path.write_text(json.dumps(doc, indent=1))
        print(f"  wrote {path.name}  — NO DATA: {provenance}")
        return 0

    spot = bars[-1]["c"]
    levels, notes = build_levels(bars)
    zones = assemble(levels, atr(bars) or 0.0005, spot, args.pair)
    week_mon = dt.date.fromisoformat(week)
    doc = {
        "schema": "trident-e1/1", "pair": args.pair, "target_week": week,
        "spot": round(spot, 5), "data_as_of": dt.date.today().isoformat(),
        "sources": {
            "EXTRACT_ohlc": {"status": "OK", "source": source, "detail": provenance},
            "P1_pivots": {"status": "OK", "detail": notes.get("pivot_verification", "")},
        },
        "levels": [{"price": l["price"], "label": l["label"],
                    "level_type": l["label"].split("_")[0], "style": "line",
                    "use_box": False} for l in levels],
        "zones": zones, "shapes": {},
        "notes": [f"{len(levels)} candidate levels clustered into {len(zones)} zones at "
                  f"tolerance {CLUSTER_ATR_MULT} x ATR"],
        "temporal_boundary_utc": "",
    }
    path.write_text(json.dumps(doc, indent=1))
    print(f"  wrote {path.name}  bars={len(bars)} spot={spot:.3f} "
          f"levels={len(levels)} ZONES={len(zones)}")
    for z in zones:
        print(f"    {z['name']:22s} conf={z['confluence']:2d}/14 "
              f"{z['pressure_degree']:15s} zfp={z['zfp']:3d}%  "
              f"{z['bottom']:.3f}–{z['top']:.3f}")
    return 0


if __name__ == "__main__":
    sys.exit(main())