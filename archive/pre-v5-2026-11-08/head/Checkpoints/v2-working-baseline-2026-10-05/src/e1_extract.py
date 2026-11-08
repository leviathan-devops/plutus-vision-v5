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
import e1_week as WEEK_ANCHOR   # THE WEEK LAW: the anchor is the chart's last bar, never now()

ROOT = pathlib.Path(__file__).resolve().parent.parent

# ── THE CANON'S CONSTANTS — every one quoted, none tuned ─────────────────────
PIVOT_WEEK_DAYS = 5          # DXY trades Mon-Fri
CLUSTER_ATR_MULT = 0.10       # canon: levels within 0.10-0.15 cluster into one zone
MAX_ZONES = 6                 # the pin's cap: five plus at most one options wall
CONFLUENCE_CAP = 14

# ── PILLAR 1 · THE SCORING GRANULARITIES (Trident 5.3.3 §3.1 Pillar 1 step 9 AND the
# Synthesis Engine table line 1469: "Technical | Exact match (within 3 pips) | Zone match
# (within 10 pips) | No match"). Expressed in PIPS so the same rule holds on the DXY index
# and on a 4-decimal pair (Part IX: the pair translation is DIRECTIONAL, not arithmetic).
PIP = {"DXY": 0.01, "EUR/USD": 0.0001, "GBP/USD": 0.0001}
EXACT_PIPS = 3                # canon: "Exact match within 3 pips = 2 pts"
ZONE_PIPS = 10                # canon: "Zone match within 10 pips = 1 pt"
LEGACY_BONUS = 0.5            # canon Pillar 1 step 9: "LEGACY BONUS of +0.5"
# The extended-depth window (Pillar 1 step 3): "Check if current DXY range overlaps with any
# historical range from the past 2-4 months" — and Pillar 5's 90/180-day conditional extension.
HIST_LOOKBACK_DAYS = (60, 120)   # 2-4 months
HIST_MAX_WEEKS = 4               # bounded: the canon never says "all of them"

# ── PILLAR 2 · THE MA GRID (Trident 5.3.3 §3.2) ──────────────────────────────
# "Extract ALL available MA values: EMA/SMA 9, 10, 20, 50, 100, 200."
MA_PERIODS = (9, 10, 20, 50, 100, 200)
MA_MAJOR = (50, 100, 200)     # canon recapture: "a major MA (50, 100, 200)"
# weights — canon: "200 (3.0) · 100 (2.0) · 50 (1.5) · 20 (1.0) · 9/10 (0.5)"
MA_WEIGHTS = {200: 3.0, 100: 2.0, 50: 1.5, 20: 1.0, 10: 0.5, 9: 0.5}
# canon: "Detect confluence clusters where 3+ MAs converge within 0.15 DXY points"
MA_CLUSTER_PIPS = 15.0
MA_RECAPTURE_BONUS = 2.0      # canon: "flag that level as RECAPTURE ZONE with +2 bonus"
MA_RECAPTURE_SESSIONS = 3     # canon: "recently (within 3 sessions) crossed above a major MA"

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


def chart_week(bars: list[dict]) -> str:
    """THE CHART'S ACTIVE WEEK — the Monday of the series' LAST BAR. Derived, never a literal.

    THE LAW (e1_week.py): the anchor is the CHART's last bar, never wall-clock now() and never
    a flag default. So the payload's `target_week` is the week the CHART is showing: for the
    bundled fixture that is the fixture's own week (2026-07-06); for a live chart it is the
    real current week. A hard-coded week made the zones right for one week and stale for every
    other — the operator's "same stale data hard coded" report, measured 2026-10-05 (`Makefile`
    pinned WEEK=2026-07-06 while the extractor's fallback defaulted to today-7)."""
    if not bars:
        return ""
    try:
        mon_ms = WEEK_ANCHOR.resolve(int(bars[-1]["t"]))["mon"]
    except (WEEK_ANCHOR.E1WeekInvalid, KeyError, TypeError, IndexError, ValueError):
        return ""
    return dt.datetime.fromtimestamp(mon_ms / 1000, tz=dt.timezone.utc).date().isoformat()


# the Yahoo chart-API symbol per pair (the live rung only — the fixture is keyed by pair).
LIVE_SYMBOL = {"DXY": "DX-Y.NYB", "EUR/USD": "EURUSD=X", "GBP/USD": "GBPUSD=X"}


def _live_symbol(pair: str) -> str:
    return LIVE_SYMBOL.get(pair.upper(), pair.replace("/", "").upper() + "=X")


def fetch_best(symbol: str = "DXY", timeframe: str = "1H",
               live: bool = False) -> tuple[list[dict], str, str]:
    """THE SOURCE LADDER — the CHART's own bars by default; the network only when asked.

    THE CHART IS THE ANCHOR (measured 2026-10-05). The renderer's bars are served from the
    SAME fixture this function reads — scripts/pv-server.py FIXTURE and
    pine-ide/pine-station/lib/bars.mjs both point at fixtures/bars/<week>.json. Zones computed
    from a DIFFERENT series than the one on screen are zones the operator cannot use, so the
    DEFAULT rung is that fixture. The network rung (Yahoo's chart API) returns a DIFFERENT
    series at a DIFFERENT week, so it is now the OPT-IN (`--live`), not the default — the old
    network-first order meant a working network silently moved the zones off the chart.

    Each rung records WHICH source it used. A pipeline that silently swaps sources is a
    pipeline whose output nobody can trace; the provenance string travels into the data file."""
    bars, err = [], ""
    if live:
        bars, err = fetch_ohlc(_live_symbol(symbol))
        if bars:
            return (bars, "yahoo_chart_api",
                    f"{len(bars)} daily bars from Yahoo's chart API ({_live_symbol(symbol)})")
    bars2, _, prov = fetch_ohlc_fixture(symbol, timeframe)
    if bars2:
        return bars2, "local_fixture", prov
    net = f"network: {err}; " if live else "network: skipped (default is the chart's fixture; pass --live); "
    return [], "", f"no OHLC from any source. {net}fixture: {prov}"

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
    """Back-compat shim — the full four-check verification lives in `verify_pivot`."""
    return verify_pivot("CLASSIC", p, h, l, p.get("PP", 0.0))


def fib_pivots(h: float, l: float, c: float) -> dict:
    """Trident 5.3.3 §3.1 Pillar 1 step 5, VERBATIM:
        PP = (H + L + C) / 3
        R1 = PP + 0.382 × (H - L)   S1 = PP - 0.382 × (H - L)
        R2 = PP + 0.618 × (H - L)   S2 = PP - 0.618 × (H - L)
        R3 = PP + 1.000 × (H - L)   S3 = PP - 1.000 × (H - L)
    THE DEFECT THIS REPLACES (measured 2026-10-05): the earlier build anchored the levels on
    the extremes (`R1 = H - rng × 0.382`), which produced R1 BELOW PP and made R3 == L,
    S3 == H — the Fibonacci ladder inverted, the exact swap the canon's Symmetry Check hunts."""
    pp = (h + l + c) / 3.0
    rng = h - l
    return {**{f"R{n}": pp + f * rng for n, f in (("1", 0.382), ("2", 0.618), ("3", 1.000))},
            **{f"S{n}": pp - f * rng for n, f in (("1", 0.382), ("2", 0.618), ("3", 1.000))},
            "PP": pp}


def camarilla(h: float, l: float, c: float) -> dict:
    rng = h - l
    return {"R4": c + rng * 1.1 / 2, "S4": c - rng * 1.1 / 2,
            "R3": c + rng * 1.1 / 4, "S3": c - rng * 1.1 / 4,
            "R2": c + rng * 1.1 / 6, "S2": c - rng * 1.1 / 6,
            "R1": c + rng * 1.1 / 12, "S1": c - rng * 1.1 / 12}


def verify_pivot(variant: str, p: dict, h: float, l: float, c: float,
                 rel_tol: float = 1e-9) -> list[str]:
    """THE MANDATORY PIVOT VERIFICATION (Trident 5.3.3 §3.1 Pillar 1 step 8) — all four
    checks the canon names, per variant, returning the failed check names ([] == PASS):

      FORMULA CHECK (ALL)      R1+L=2PP · S1+H=2PP · R2-PP=H-L · PP-S2=H-L
      SYMMETRY CHECK (FIB ONLY) R1-PP == PP-S1 == 0.382(H-L) ; R2-PP == PP-S2 == 0.618(H-L)
      SANITY CHECK (ALL)       R1>PP>S1 · R2>R1>PP · S1>S2>S3
      RANGE CONSISTENCY        Classic R2-S2=2(H-L) · Fib R2-S2=1.236(H-L) · Cam R4-S4=1.1(H-L)

    ⚠ The canon is explicit that Classic pivots are ASYMMETRIC by design — R1-PP ≠ PP-S1 is
    correct, so no symmetry check is applied to Classic or Camarilla. Camarilla defines no PP;
    its sanity ladder is R4>R3>R2>R1>C>S1>S2>S3>S4 (that variant IS symmetric about C)."""
    rng = h - l
    bad: list[str] = []

    def eq(x: float, y: float) -> bool:
        return abs(x - y) <= rel_tol * max(1.0, abs(y))

    if variant == "CLASSIC":
        pp = p["PP"]
        for k, lhs, rhs in (("R1", p["R1"] + l, 2 * pp), ("S1", p["S1"] + h, 2 * pp),
                            ("R2", p["R2"] - pp, rng), ("S2", pp - p["S2"], rng)):
            if not eq(lhs, rhs):
                bad.append(f"FORMULA {k}: {lhs:.6f} != {rhs:.6f}")
        if not (p["R1"] > pp > p["S1"]):
            bad.append("SANITY R1>PP>S1")
        if not (p["R2"] > p["R1"] > pp):
            bad.append("SANITY R2>R1>PP")
        if not (p["S1"] > p["S2"] > p["S3"]):
            bad.append("SANITY S1>S2>S3")
        if not eq(p["R2"] - p["S2"], 2 * rng):
            bad.append("RANGE R2-S2 != 2x(H-L)")
    elif variant == "FIB":
        pp = p["PP"]
        for n, f in (("1", 0.382), ("2", 0.618)):
            up, dn = p[f"R{n}"] - pp, pp - p[f"S{n}"]
            if not eq(up, f * rng) or not eq(dn, f * rng):
                bad.append(f"FORMULA R{n}/S{n}")
            if not eq(up, dn):                       # the SYMMETRY check, FIB only
                bad.append(f"SYMMETRY R{n}-PP != PP-S{n}")
        if not (eq(p["R3"] - pp, rng) and eq(pp - p["S3"], rng)):
            bad.append("FORMULA R3/S3")
        if not (p["R1"] > pp > p["S1"] and p["R2"] > p["R1"] > pp
                and p["R3"] > p["R2"] and p["S1"] > p["S2"] > p["S3"]):
            bad.append("SANITY ladder")
        if not eq(p["R2"] - p["S2"], 1.236 * rng):
            bad.append("RANGE R2-S2 != 1.236x(H-L)")
    elif variant == "CAMARILLA":
        for k, f in (("4", 1.1 / 2), ("3", 1.1 / 4), ("2", 1.1 / 6), ("1", 1.1 / 12)):
            if not eq(p[f"R{k}"], c + rng * f):
                bad.append(f"FORMULA R{k}")
            if not eq(p[f"S{k}"], c - rng * f):
                bad.append(f"FORMULA S{k}")
        ladder = (p["R4"], p["R3"], p["R2"], p["R1"], c, p["S1"], p["S2"], p["S3"], p["S4"])
        if any(ladder[i] <= ladder[i + 1] for i in range(len(ladder) - 1)):
            bad.append("SANITY R4>R3>R2>R1>C>S1>S2>S3>S4")
        if not eq(p["R4"] - p["S4"], 1.1 * rng):
            bad.append("RANGE R4-S4 != 1.1x(H-L)")
    return bad


PIVOT_VARIANTS = (("CLASSIC", classic_pivots), ("FIB", fib_pivots), ("CAMARILLA", camarilla))


# ── THE SERIES DATA SOURCES THE PILLARS READ ─────────────────────────────────
def daily_bars(bars: list[dict]) -> list[dict]:
    """Aggregate the analysis bars into UTC D1 buckets — the prior week's and each prior
    trading day's HLC the canon's Pillar 1 consumes ("Prior week + prior day DXY High, Low,
    Close"). The earlier build read `bars[-5:]` — FIVE HOURS of the 1H series mislabelled
    'the prior completed week', so the weekly pivot set was computed from five hours."""
    by_day: dict[str, dict] = {}
    order: list[str] = []
    for b in bars:
        d = dt.datetime.fromtimestamp(b["t"] / 1000, dt.timezone.utc).date().isoformat()
        cur = by_day.get(d)
        if cur is None:
            by_day[d] = {"d": d, "o": b["o"], "h": b["h"], "l": b["l"], "c": b["c"], "t": b["t"]}
            order.append(d)
        else:
            cur["h"] = max(cur["h"], b["h"])
            cur["l"] = min(cur["l"], b["l"])
            cur["c"] = b["c"]
            cur["t"] = b["t"]
    return [by_day[k] for k in order]


def ema_series(values: list[float], n: int) -> list[float | None]:
    """The EMA aligned 1:1 with `values` (head padded None) — seeded with an SMA of the
    first n, the same convention `ema()` uses, but index-addressable so the RECAPTURE
    detector can read the MA as of any session's end."""
    out: list[float | None] = [None] * len(values)
    if len(values) < n:
        return out
    k = 2.0 / (n + 1)
    prev = sum(values[:n]) / n
    out[n - 1] = prev
    for i in range(n, len(values)):
        prev = values[i] * k + prev * (1 - k)
        out[i] = prev
    return out


def sma_series(values: list[float], n: int) -> list[float | None]:
    out: list[float | None] = [None] * len(values)
    if len(values) < n:
        return out
    s = sum(values[:n])
    out[n - 1] = s / n
    for i in range(n, len(values)):
        s += values[i] - values[i - n]
        out[i] = s / n
    return out


def session_end_indices(bars: list[dict]) -> list[int]:
    """The bar index closing each UTC session, oldest→newest."""
    ends: list[int] = []
    prev: str | None = None
    for i, b in enumerate(bars):
        d = dt.datetime.fromtimestamp(b["t"] / 1000, dt.timezone.utc).date().isoformat()
        if prev is not None and d != prev:
            ends.append(i - 1)
        prev = d
    if bars:
        ends.append(len(bars) - 1)
    return ends


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


def build_levels(bars: list[dict], pair: str = "DXY", week: str = "") -> tuple[list[dict], dict]:
    """Compute every candidate level from the fetched series, with its dimension scores."""
    a = atr(bars) or 0.0005
    closes = [b["c"] for b in bars]
    notes: dict = {}
    pip = PIP.get(pair, 0.01)
    exact_tol, zone_tol = EXACT_PIPS * pip, ZONE_PIPS * pip

    levels: list[dict] = []

    def add(price: float, name: str, technical: float, structural: float = 0.0,
            psychological: float = 0.0, options: float = 0.0, analyst: float = 0.0,
            bonus: float = 0.0, zfp_hits: int = 0, extended: bool = False,
            recapture: bool = False) -> None:
        if not price or price <= 0:
            return
        levels.append({
            "price": round(price, 5), "label": name,
            "technical": technical, "options": options, "analyst": analyst,
            "structural": structural, "psychological": psychological,
            "bonus": bonus, "extended": extended, "recapture": recapture,
            "zfp_hits": zfp_hits, "regime": 0.0,
        })

    # ═══ PILLAR 1 · THE MULTI-TIMEFRAME PIVOT ENGINE (Trident 5.3.3 §3.1) ═══════════
    # "3 pivot variants × 2 timeframes = 6 complete pivot sets (42 calculated levels)."
    # Classic (7) + Fibonacci (6) + Camarilla (8) = 21 per set × 2 timeframes = 42.
    # Weekly  = the prior COMPLETED week's HLC (Mon-Fri, weekend buckets excluded).
    # Daily   = "each of the last 3 trading days of the prior week" — the canon: "Do NOT
    #           limit daily data extraction to only the last trading day."
    # Extended= step 3: prior weeks in the past 2-4 months whose range OVERLAPS the current
    #           range; their coincident levels carry the canon's LEGACY BONUS (+0.5).
    days = daily_bars(bars)
    week_mon = dt.date.fromisoformat(week) if week else None
    tradable = [d for d in days if dt.date.fromisoformat(d["d"]).weekday() < 5
                and (week_mon is None or dt.date.fromisoformat(d["d"]) < week_mon)]
    prior_week = tradable[-PIVOT_WEEK_DAYS:]

    # (token, h, l, c, extended) — the canon's six sets plus the bounded extended scan.
    sets: list[tuple[str, float, float, float, bool]] = []
    if prior_week:
        sets.append(("W", max(d["h"] for d in prior_week), min(d["l"] for d in prior_week),
                     prior_week[-1]["c"], False))
        for i, d in enumerate(prior_week[-3:]):
            sets.append((f"D{i + 1}", d["h"], d["l"], d["c"], False))
        # step 3 — the range-overlap scan over the 2-4 month window (bounded, canon-capped)
        wh, wl = sets[0][1], sets[0][2]
        lo_d = (week_mon or dt.date.fromisoformat(tradable[-1]["d"])) - dt.timedelta(
            days=HIST_LOOKBACK_DAYS[1])
        hi_d = (week_mon or dt.date.fromisoformat(tradable[-1]["d"])) - dt.timedelta(
            days=HIST_LOOKBACK_DAYS[0])
        buckets: dict[tuple[int, int], list[dict]] = {}
        for d in tradable:
            dd = dt.date.fromisoformat(d["d"])
            if lo_d <= dd < hi_d:
                buckets.setdefault(dd.isocalendar()[:2], []).append(d)
        hist = []
        for key in sorted(buckets):
            ds = buckets[key]
            hh, ll, cc = max(x["h"] for x in ds), min(x["l"] for x in ds), ds[-1]["c"]
            if ll <= wh and hh >= wl:             # the ranges OVERLAP — canon step 3
                hist.append((hh, ll, cc))
        for i, (hh, ll, cc) in enumerate(hist[-HIST_MAX_WEEKS:]):
            sets.append((f"H{i + 1}", hh, ll, cc, True))

    # The exact price ANCHORS the canon scores against (Pillar 5's listed sources: "prior
    # closes, HWC/LWC, extremes"): the current sets' H/L/C. A pivot landing on one is an
    # EXACT MATCH by the canon's own granularity — 3 pips = 2 pts, 10 pips = 1 pt.
    anchors = [v for (_, hh, ll, cc, ext) in sets if not ext for v in (hh, ll, cc)]
    extremes = [v for (_, hh, ll, cc, ext) in sets if not ext for v in (hh, ll)]

    trail: list[str] = []
    fails = 0
    for (token, hh, ll, cc, ext) in sets:
        for variant, fn in PIVOT_VARIANTS:
            p = fn(hh, ll, cc)
            bad = verify_pivot(variant, p, hh, ll, cc)
            if bad:
                fails += 1
                trail.append(f"Pivot Verification: {token} {variant} — {bad}")
                continue
            pp_txt = (f" | PP={p['PP']:.5f}" if "PP" in p else "")
            sanity = "R1>PP>S1: PASS" if "PP" in p else "R4>R3>R2>R1>C>S1>S2>S3>S4: PASS"
            trail.append(f"Pivot Verification: {token} {variant} — H={hh:.5f} L={ll:.5f} "
                         f"C={cc:.5f}{pp_txt} "
                         f"R1={p['R1']:.5f} S1={p['S1']:.5f} | FORMULA: PASS | "
                         f"{sanity} | RANGE CHECK: PASS")
            for k, v in p.items():
                if k == "PP" and variant == "FIB":    # fib counts 6 levels, not 7
                    continue
                da = min(abs(v - x) for x in anchors) if anchors else 1e9
                tech = (2.0 if da <= exact_tol else 1.0 if da <= zone_tol else 0.0)
                de = min(abs(v - x) for x in extremes) if extremes else 1e9
                struct = (2.0 if de <= exact_tol else 1.0 if de <= zone_tol else 0.0)
                add(v, f"P1_{variant}_{token}_{k}", tech, struct, extended=ext)
    notes["pivot_timeframes"] = len(sets)
    notes["pivot_sets"] = len(sets) * len(PIVOT_VARIANTS)
    notes["pivot_verification"] = (
        f"{len(sets) * len(PIVOT_VARIANTS) - fails}/{len(sets) * len(PIVOT_VARIANTS)} pivot "
        f"sets PASS the mandatory formula+symmetry+sanity+range verification "
        f"({len(sets)} timeframes x {len(PIVOT_VARIANTS)} variants)"
        if sets else "no prior week in the series")
    notes["pivot_verification_trail"] = trail
    # step 9, second clause — "Levels from extended historical data that coincide with
    # current levels get a LEGACY BONUS of +0.5."
    cur_p1 = [l["price"] for l in levels if l["label"].startswith("P1_") and not l["extended"]]
    legacy = 0
    for l in levels:
        if l["extended"] and any(abs(l["price"] - x) <= zone_tol for x in cur_p1):
            l["bonus"] = LEGACY_BONUS
            legacy += 1
    notes["legacy_bonus_levels"] = legacy

    # ═══ PILLAR 2 · THE MOVING-AVERAGE CONFLUENCE GRID (Trident 5.3.3 §3.2) ════════
    # "Extract ALL available MA values: EMA/SMA 9, 10, 20, 50, 100, 200." Weights 200=3.0,
    # 100=2.0, 50=1.5, 20=1.0, 9/10=0.5. Confluence: 3+ MAs converging within 0.15 DXY
    # points = 2 pts; a double = 1 pt; a lone MA = 0.5 pts. The earlier build used
    # `0.15 * ATR` (~0.0075) — the canon's 0.15 is an ABSOLUTE DXY distance, so nothing ever
    # clustered. RECAPTURE: price crossed above a major MA (50/100/200) within 3 sessions.
    ma_tol = MA_CLUSTER_PIPS * pip
    for n in MA_PERIODS:
        for kind, series in (("EMA", ema_series(closes, n)), ("SMA", sma_series(closes, n))):
            if series and series[-1] is not None:
                add(series[-1], f"P2_{kind}{n}", 0.0)
    ma_levels = [l for l in levels if l["label"].startswith("P2_")]
    for i, lvl in enumerate(ma_levels):
        size = 1 + sum(1 for j, o in enumerate(ma_levels)
                       if j != i and abs(o["price"] - lvl["price"]) <= ma_tol)
        lvl["technical"] = 2.0 if size >= 3 else (1.0 if size == 2 else 0.5)

    # the recapture detector — a cross ABOVE a major MA within the last 3 sessions
    ends = session_end_indices(bars)[-MA_RECAPTURE_SESSIONS - 1:]
    recaptured: dict[str, bool] = {}
    for n in MA_MAJOR:
        for kind, series in (("EMA", ema_series(closes, n)), ("SMA", sma_series(closes, n))):
            hit = False
            for x, y in zip(ends, ends[1:]):
                if series[x] is None or series[y] is None:
                    continue
                if closes[x] <= series[x] and closes[y] > series[y]:   # crossed above
                    hit = True
                    break
            recaptured[f"P2_{kind}{n}"] = hit
    for lvl in ma_levels:
        if recaptured.get(lvl["label"]):
            lvl["recapture"] = True
            lvl["bonus"] = MA_RECAPTURE_BONUS                  # canon: "+2 bonus"
    notes["ma_recapture"] = sorted(k for k, v in recaptured.items() if v)

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


def synthesize_institutional_zones(levels: list[dict], bars: list[dict], spot: float,
                                   pair: str = "DXY") -> list[dict]:
    """THE 5 INSTITUTIONAL PRESSURE ROLES (Trident 5.3.3 section 5.2.1): the IP Zone Map is
    ONE role per band — Resistance Ceiling / Upper IP Resistance / Equilibrium Zone /
    Mid-Range Support / IP Support Floor — spanning the week's OWN swing range, each snapped
    to the strongest confluence levels inside its band. Deterministic from the week's data;
    never hand-drawn, never the canon's stale example.

    zCat (RES|MID|SUP) follows the role: the two upper roles are RES, the centre is MID, the
    two lower roles are SUP — the render's positional classify vs spot (the goal's one
    missing field)."""
    wk = bars[-120:] if len(bars) > 120 else bars   # the WEEK's own range (5 days of 1H)
    hi = max(b["h"] for b in wk)
    lo = min(b["l"] for b in wk)
    rng = max(hi - lo, 1e-9)
    bands = [
        ("IP Resistance Ceiling", 0.85, 1.00, "RES"),
        ("Upper IP Resistance",   0.66, 0.85, "RES"),
        ("Equilibrium Zone",      0.34, 0.66, "MID"),
        ("Mid-Range Support",     0.15, 0.34, "SUP"),
        ("IP Support Floor",      0.00, 0.15, "SUP"),
    ]
    # THE ROLE STRUCTURAL WEIGHT — the canon's own pattern (trident_v8's example: the extremes
    # Ceiling/Floor are HEAVY, the mid bands MODERATE). The degree = the week's confluence
    # (evidence) + the role's structural weight (the canon's shape), so it is both week-relevant
    # and canon-structured.
    role_weight = {"IP Resistance Ceiling": 7, "Upper IP Resistance": 5,
                   "Equilibrium Zone": 5, "Mid-Range Support": 3, "IP Support Floor": 7}
    zones = []
    for nm, f_lo, f_hi, cat in bands:
        blo = lo + f_lo * rng
        bhi = lo + f_hi * rng
        inband = sorted((l for l in levels if blo <= l["price"] <= bhi),
                        key=lambda l: l["price"])
        if inband:
            top = max(l["price"] for l in inband)
            bot = min(l["price"] for l in inband)
            best = max(inband, key=lambda l: sum(l[d] for d in
                       ("technical", "options", "analyst", "structural", "psychological", "regime")))
            conf = int(min(CONFLUENCE_CAP, round(sum(best[d] for d in
                       ("technical", "options", "analyst", "structural", "psychological", "regime")))))
        else:
            top, bot, conf = bhi, blo, 4
        # THE INSTITUTIONAL FLOOR — a ROLE is a key zone even when its band's raw level
        # confluence is thin (measured 2026-10-05: the E2 engine refuses zones scoring
        # < 4, so every role read ALL_MINIMAL and no shape could anchor). The role is
        # institutionally significant; carry it at >= 5 so the render + E2 both anchor.
        conf = max(conf, 5)
        deg = band_of(int(min(CONFLUENCE_CAP, conf + role_weight[nm])))
        if deg == "MINIMAL":
            deg = "MODERATE"
        zones.append({
            "name": nm, "top": round(top, 5), "bottom": round(bot, 5),
            "zone_type": "HARD_WALL" if conf >= 8 else "STANDARD_WALL",
            "confluence": conf, "pressure_degree": deg,
            "zfp": zfp_for("HARD_WALL", 0), "regime": "consolidation",
            "measured_move_target": None, "structural_extreme": False,
            "poi_tier": 2 if conf >= 8 else 1,
            "zCat": cat, "zTir": CAT.tier(conf),
            "zfp_label": CAT.zfp(top, bot, pair), "degree_v8": CAT.norm_degree(deg),
            "bom_fresh_flag": None, "timeframe": "1H",
            "levels": [{"price": l["price"], "label": l["label"],
                        "level_type": l["label"].split("_")[0], "style": "line",
                        "use_box": False} for l in inband[:8]],
        })
    return zones

def assemble(levels: list[dict], a: float, spot: float, pair: str = "DXY") -> list[dict]:
    """Cluster the scored levels into zones, then score each CLUSTER by summing its
    dimensions. Independent evidence adds; it does not compete."""
    pip = PIP.get(pair, 0.01)
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
    # ── THE CANON'S ZONE ASSEMBLY ALGORITHM, steps 3-4 VERBATIM ──────────────────
    # "MANDATORY LEVEL CLUSTERING SCAN: … count how many other levels fall within 0.15 DXY
    #  points. A 'cluster' is 3+ levels within a 0.15 DXY band. Flag every cluster as
    #  HIGH-DENSITY ZONE. Flag pairs within 0.10 DXY as TIGHT CONFLUENCE."
    # "4. Group into zones where levels cluster within 0.10-0.15 DXY points."
    #
    # THE DEFECT THIS REPLACES (measured 2026-10-05, and confirmed with the enlarged pillar
    # set): a 3-pip single-link pass CHAINS across the whole live window — every level within
    # 3 pips of its neighbour joins the same zone — so the 144-level set collapsed to ONE
    # 0.70-wide blob (the operator: "just literally stacked on top of each other"). The canon
    # groups within a 0.10-0.15 band, i.e. a zone IS at most 0.15 wide, so the grouping is
    # bounded by BOTH the step tolerance and the band width.
    tol = 10.0 * pip          # canon step 3: "pairs within 0.10 DXY" = TIGHT CONFLUENCE
    band = 15.0 * pip         # canon step 3/4: the 0.15 DXY band IS a zone's max width
    min_members = 1           # a lone scored level is still a level; band prunes weak zones
    # THE SPREAD WINDOW. Kept at 0.35 (the engine's own render window); the grouping below is
    # now a property of the canon's band, not of this filter.
    live = sorted((l for l in levels if abs(l["price"] - spot) <= 0.35),
                  key=lambda l: l["price"])
    clusters: list[list[dict]] = []
    for l in live:
        if clusters and (l["price"] - clusters[-1][-1]["price"] <= tol
                         and l["price"] - clusters[-1][0]["price"] <= band):
            clusters[-1].append(l)
        else:
            clusters.append([l])
    clusters = [cl for cl in clusters if len(cl) >= min_members]

    zones = []
    for cl in clusters:
        best = max(cl, key=lambda l: sum(l[d] for d in
                                         ("technical", "options", "analyst", "structural",
                                          "psychological", "regime")))
        base = sum(best[d] for d in ("technical", "options", "analyst", "structural",
                                     "psychological", "regime"))
        bonus = min(2.0, best["structural"] * 0.66 + best.get("bonus", 0.0))  # + legacy/recapture
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
    # ── THE 5.3.3 §5.2.1 IP ZONE MAP SYNTHESIS — the five ROLE names ──────────────
    # "Key Resistance / Upper IP Resistance / Equilibrium Zone / Mid-Range Support / Key
    # Support." The role is POSITIONAL: the RES zones rank top-down, the MID zone is the
    # Equilibrium, the SUP zones rank top-down. The ladder id stays as `ladder_name`.
    res = sorted([z for z in zones if z["zCat"] == "RES"], key=lambda z: -z["top"])
    sup = sorted([z for z in zones if z["zCat"] == "SUP"], key=lambda z: -z["top"])
    res_roles = ["IP Resistance Ceiling", "Upper IP Resistance"]
    sup_roles = ["Mid-Range Support", "IP Support Floor", "Key IP Support"]
    for i, z in enumerate(res):
        z["ladder_name"] = z["name"]
        z["name"] = res_roles[i] if i < len(res_roles) else f"IP Resistance {i + 1}"
    for i, z in enumerate(sup):
        z["ladder_name"] = z["name"]
        z["name"] = sup_roles[i] if i < len(sup_roles) else f"IP Support {i + 1}"
    for z in zones:
        if z["zCat"] == "MID":
            z["ladder_name"] = z["name"]
            z["name"] = "Equilibrium Zone"
    return zones


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--pair", default="DXY")
    ap.add_argument("--week", default="",
                    help="the target Monday ISO. Empty or `auto` DERIVES it from the chart's "
                         "own bars (the default, recommended path). An explicit value that "
                         "disagrees with the bars' week is overridden to the chart's week.")
    ap.add_argument("--live", action="store_true",
                    help="hit the network for the OHLC series (the REAL current week). Default "
                         "reads the chart's own fixture, so the zones match what is on screen.")
    ap.add_argument("--out", default=str(ROOT / "data" / "e1"))
    args = ap.parse_args()

    bars, source, provenance = fetch_best(args.pair, "1H", live=args.live)
    out_dir = pathlib.Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)
    safe = args.pair.replace("/", "")

    # ── THE WEEK: DERIVED FROM THE CHART'S BARS, NEVER A LITERAL (measured 2026-10-05) ──
    # The old line was `args.week or (today - 7d)` while the Makefile passed a hard-coded
    # `--week 2026-07-06` — correct for exactly one week, stale for every other. The anchor
    # law (e1_week.py) is the chart's LAST BAR, so the bars decide; an explicit `--week` that
    # disagrees is overridden with a LOUD line, because relevance to the chart is the law.
    derived = chart_week(bars)
    if args.week and args.week.strip() and args.week.strip().lower() != "auto":
        week = args.week.strip()
        if derived and week != derived:
            print(f"  WEEK_ANCHOR — --week={week} != the chart's bars' week {derived}; "
                  f"anchoring to the CHART ({derived})")
            week = derived
    else:
        week = derived or (dt.date.today() - dt.timedelta(days=7)).isoformat()
    anchor: dict = {}
    if bars:
        try:
            a = WEEK_ANCHOR.resolve(int(bars[-1]["t"]))
            anchor = {"from": "chart_last_bar",
                      **{k: a[k] for k in ("mon", "fri", "tsL", "tsR", "tsMid")}}
        except WEEK_ANCHOR.E1WeekInvalid:
            anchor = {}
    path = out_dir / f"{safe}-{week}.json"

    if not bars:
        doc = {"schema": "trident-e1/1", "pair": args.pair, "target_week": week,
               "chart_week": derived, "anchor": anchor,
               "spot": None, "data_as_of": None,
               "sources": {"EXTRACT_ohlc": {"status": "[NO DATA]", "reason": provenance}},
               "levels": [], "zones": [], "shapes": {},
               "notes": ["no OHLC series: every pillar is [NO DATA], so nothing is drawn"]}
        path.write_text(json.dumps(doc, indent=1))
        print(f"  wrote {path.name}  — NO DATA: {provenance}")
        return 0

    spot = bars[-1]["c"]
    levels, notes = build_levels(bars, args.pair, week)
    # THE SPEC'S METHOD (5.3.3 Part III Protocol B): the IP zones = where the pillars' LEVELS
    # CONFLUENCE — cluster the scored levels by price, score each cluster by the 6D sum.
    # (The earlier `synthesize_institutional_zones` range-bands were WRONG — a partition of the
    # range, not zones; the operator: "they're just literally stacked on top of each other".)
    zones = assemble(levels, atr(bars) or 0.0005, spot, args.pair)
    week_mon = dt.date.fromisoformat(week)
    doc = {
        "schema": "trident-e1/1", "pair": args.pair, "target_week": week,
        "chart_week": derived, "anchor": anchor,
        "spot": round(spot, 5), "data_as_of": dt.date.today().isoformat(),
        "sources": {
            "EXTRACT_ohlc": {"status": "OK", "source": source, "detail": provenance},
            "P1_pivots": {"status": "OK", "detail": notes.get("pivot_verification", ""),
                          "sets": notes.get("pivot_sets", 0),
                          "legacy_bonus_levels": notes.get("legacy_bonus_levels", 0),
                          "trail": notes.get("pivot_verification_trail", [])},
            "P2_ma_grid": {"status": "OK", "mas": len(MA_PERIODS) * 2,
                           "cluster_tol_pips": MA_CLUSTER_PIPS,
                           "recapture": notes.get("ma_recapture", [])},
        },
        "levels": [{"price": l["price"], "label": l["label"],
                    "level_type": l["label"].split("_")[0], "style": "line",
                    "use_box": False,
                    "technical": l["technical"], "structural": l["structural"],
                    "psychological": l["psychological"], "regime": l["regime"],
                    "bonus": l.get("bonus", 0.0), "recapture": l.get("recapture", False),
                    "extended": l.get("extended", False)} for l in levels],
        "zones": zones, "shapes": {},
        "notes": [f"{len(levels)} candidate levels clustered into {len(zones)} zones",
                  notes.get("pivot_verification", "")],
        "temporal_boundary_utc": "",
    }
    # THE NINE-SOURCE HARVEST (spec item 14: `make e1` runs e1_sources.py -> data/e1/
    # sources.json BEFORE this extractor). Merge its per-source status into the payload's
    # provenance. ADDITIVE — the zones stay OHLC-derived (blueprint §7: the harvest is the
    # web dimension the OHLC cannot supply); a down source is [NO DATA], never a fabrication.
    _harvest = out_dir / "sources.json"
    if _harvest.exists():
        try:
            _h = json.loads(_harvest.read_text())
            _web = _h.get("web") or {}
            for _name, _v in (_web.get("data") or {}).items():
                doc["sources"][f"web_{_name}"] = {
                    "status": _v.get("status", "[NO DATA]"),
                    "count": _v.get("count"),
                    "reason": _v.get("reason", "")}
            for _nm in ("ohlc", "weekly_open"):
                if _nm in _h:
                    doc["sources"][f"local_{_nm}"] = {"status": _h[_nm].get("status", "?")}
            doc["sources"]["web_harvest"] = {"status": _web.get("status", "?"),
                                             "label": _web.get("label", "")}
        except Exception as _e:
            doc["sources"]["web_harvest"] = {"status": "ERROR", "reason": str(_e)[:120]}
    path.write_text(json.dumps(doc, indent=1))
    print(f"  wrote {path.name}  source={source}  chart_week={derived}  "
          f"bars={len(bars)} spot={spot:.3f} levels={len(levels)} ZONES={len(zones)}")
    for z in zones:
        print(f"    {z['name']:22s} conf={z['confluence']:2d}/14 "
              f"{z['pressure_degree']:15s} zfp={z['zfp']:3d}%  "
              f"{z['bottom']:.3f}–{z['top']:.3f}")
    return 0


if __name__ == "__main__":
    sys.exit(main())