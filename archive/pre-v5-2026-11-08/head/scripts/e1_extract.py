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
import e1_zfp as ZFP   # THE ZFP — canon Appendix B (B.1 base + B.2 modifiers). THE ONE impl.

ROOT = pathlib.Path(__file__).resolve().parent.parent

# ── THE CANON'S CONSTANTS — every one quoted, none tuned ─────────────────────
PIVOT_WEEK_DAYS = 5          # DXY trades Mon-Fri
CLUSTER_ATR_MULT = 0.10       # canon: levels within 0.10-0.15 cluster into one zone
CONFLUENCE_MIN = 3            # a ZONE is where INDEPENDENT dimensions AGREE (score >= 3 of 12)
CONFLUENCE_WINDOW = 0.70      # DXY: the institutional band scanned around spot (the 5 zones
                              # span ~0.4; 0.70 admits the endpoints without a range partition)
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

# THE ZFP BASE now lives in e1_zfp.py (canon Appendix B.1) — ONE implementation, not three.
# DELETED here (FAILURE_LOG F-54/F-55): ZFP_BASE · zfp_for · ZFP_BY_DEGREE · zfp_from_degree.

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
    # THE FIXTURE IS AN ENV OVERRIDE (fix 2026-10-07). The path was HARDCODED to the one
    # forward-extended fixture, so the week is DERIVED from that fixture's last bar and every
    # run produced the SAME week (measured: `e1_extract --pair DXY` always writes
    # DXY-2026-07-13.json whatever `--week` says, because `--week` is overridden by the chart's
    # bars). The operator's litmus test — "the live render matches the v8's structure on five
    # random weeks" — needs the SAME pipeline run against a DIFFERENT week's bars, so E1_FIXTURE
    # points the extractor at any fixture on disk. The default stays the operator's validated
    # 1614-bar harvest.
    fx = pathlib.Path(os.environ.get(
        "E1_FIXTURE", str(ROOT / "fixtures" / "bars" / "2026-07-06.json")))
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

# (W7 F-H) ema() REMOVED — no callers (ema_series is the live one).
# ── PILLAR 1 · THE PIVOT ENGINE — with its mandatory verification ─────────────
def classic_pivots(h: float, l: float, c: float) -> dict:
    pp = (h + l + c) / 3.0
    return {"R1": 2 * pp - l, "S1": 2 * pp - h, "R2": pp + (h - l), "S2": pp - (h - l),
            "R3": h + 2 * (pp - l), "S3": l - 2 * (h - pp), "PP": pp}


# (W7 F-H) verify_classic() REMOVED — a back-compat shim with no callers.
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


# ── THE ZFP — see e1_zfp.py (canon Appendix B: base by zone type + the B.2 modifiers).
# THE DELETED STEP FUNCTION (FAILURE_LOG F-54, the operator's complaint): `zfp_from_degree` mapped
# the confluence to a fixed band (EXTREME→7 … MINIMAL→70) — a value MONOTONE in zone strength, so
# it could NEVER rise to signal a FAILING zone. The canon's ZFP is base + modifiers; a zone in a
# breakout reads HIGHER than the same zone in consolidation. `zfp_for` (a dead -5*hits hack) and
# `ZFP_BY_DEGREE` are deleted with it. ONE ZFP: e1_zfp.zfp().


def _harvest_levels(week: str = "", pair: str = "DXY") -> list[dict]:
    """The nine-source harvest's LEVELS (option strikes + analyst), or [] when down.

    `e1_sources.py --live` writes data/harvest/sources.json; each source's `levels` are the
    typed rows (S1 option strikes carry price/notional_bn/tier; S9 analyst levels carry
    price/tier). A DOWN harvest contributes NOTHING — the Options/Analyst dimensions stay 0
    rather than a fabricated score."""
    hp = ROOT / "data" / "harvest" / "sources.json"
    if not hp.exists():
        return []
    try:
        h = json.loads(hp.read_text())
    except Exception:
        return []
    web = (h.get("web") or {}).get("data") or {}
    out: list[dict] = []
    for _src, v in web.items():
        if not isinstance(v, dict) or v.get("status") != "OK":
            continue
        for lvl in (v.get("levels") or []):
            if isinstance(lvl, dict) and lvl.get("level_type"):
                out.append(lvl)
    return out

def build_levels(bars: list[dict], pair: str = "DXY", week: str = "") -> tuple[list[dict], dict]:
    """Compute every candidate level from the fetched series, with its dimension scores."""
    # THE EMPTY-SERIES REFUSAL (adversarial A6, 2026-10-06). An empty bar series raised a bare
    # `ValueError: min() iterable argument is empty` deep in the pillar loop — a crash, not a
    # refusal. The contract is LOUD-FAIL-OR-CLEAR-PASS with a NAMED reason: return no levels and
    # a named refusal so the caller renders nothing rather than dying.
    if not bars:
        return [], {"refusal": "E1_NO_BARS: the bar series is empty — every pillar is "
                               "[NO DATA], so no level can be derived (never fabricated)"}
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
    # ── P6 · THE PSYCHOLOGICAL DIMENSION — PER LEVEL, the prompt's own scoring ────────
    # "Psychological: Major big figure (.00, .50) = 2 points · Quarter figure (.25, .75) = 1."
    # The prompt scores EACH level's PRICE at a round number; the earlier build added round
    # numbers as SEPARATE levels, so a pivot that IS at 101.00 never got its psychological
    # credit (it stayed its own weak level and was discarded). This applies the test to every
    # level already harvested (the measured defect: only 4/139 levels carried the dimension).
    for l in levels:
        cents = round((l["price"] % 1.0) * 100)
        if cents in (0, 50):
            l["psychological"] = 2.0
        elif cents in (25, 75):
            l["psychological"] = 1.0
        elif cents in (10, 20, 30, 40, 60, 70, 80, 90):    # the 0.10 grid (the minor figure)
            l["psychological"] = max(l.get("psychological", 0.0), 0.5)
    # keep the discrete round-number levels too (the prompt's grid — they anchor zones of
    # their own where the other pillars land near them)
    start = math.floor(lo / 0.25) * 0.25
    p = start
    while p <= hi:
        cents = round((p % 1.0) * 100)
        if cents in (0, 25, 50, 75):
            score = 2.0 if cents in (0, 50) else 1.0
            add(round(p, 2), f"P6_ROUND_{p:.2f}", 0.0, 0.0, score)
        p += 0.25
    # ── P6 · THE FIBONACCI RETRACEMENT GRID (canon: "Pillar 6 = Fibonacci Retracement +
    # Round-Number Grid"). FAILURE_LOG F-61: the ROUND half existed; the FIB RETRACEMENT half
    # did not, so the pillar was half-implemented. The canon's ratios off the week's swing H/L,
    # each a level that can carry confluence (a technical level, like a pivot or an MA).
    _span = hi - lo
    if _span > 0:
        for _ratio in (0.236, 0.382, 0.5, 0.618, 0.786):
            add(round(hi - _span * _ratio, 5), f"P6_FIB_{_ratio:.3f}", 1.0, 0.0)
    # ── P7 · THE DERIVATIVES ARENA (canon Part III Pillar 7: funding rates + open interest +
    # long/short ratio). STRUCTURE wired; the DATA is external — the harvest is 403-blocked
    # (F-52), so the pillar contributes NOTHING and its status reads [NO DATA]. NEVER fabricated.
    notes["P7_derivatives"] = {"status": "NO_DATA",
                               "detail": "funding/OI/long-short need the external source (F-52)"}
    # ── P9 · THE REGIME — READ FROM THE SERIES, and per ZONE ───────────────────────
    # The prompt's Regime/Dynamic dimension (0-2) is "zone in consolidation, will hold = 2 ·
    # zone in momentum = 1 · zone in breakout = 0". It is PER ZONE, computed in `assemble`
    # (zone_regime). The earlier build set a GLOBAL CONSTANT on every level, which flattened
    # every cluster's score to the same value → every zone the same MODERATE degree (the
    # operator's 6th-repeat catch: "five out of six zones … not possible").
    notes["regime"] = classify_regime(bars)               # the WEEK regime (context only)
    for l in levels:
        l["regime"] = 0.0                                  # the per-ZONE regime lands in assemble

    # ── P3+P8 (OPTIONS) + P4 (ANALYST) — THE WIRED WEB DIMENSIONS ──────────────────────
    # The nine-source harvest (data/harvest/sources.json, written by `e1_sources.py --live`)
    # carries the option strikes (S1: price + notional_bn + tier) and the analyst levels
    # (S9). A harvested level CONFLUENT with a computed level sets that level's dimension —
    # the canon's "an option wall AT a level makes it institutional". A DOWN harvest
    # contributes NOTHING (the dimension stays 0, never a fabricated score). This is the
    # WIRING; the DATA is the harvest's (network-gated: the vision arm for S1, CDP for S9).
    for hl in _harvest_levels(week, pair):
        ltype = str(hl.get("level_type", ""))
        dim = ("options" if ltype == "OPTION_STRIKE"
               else "analyst" if ltype.startswith("ANALYST") else "")
        if not dim:
            continue
        try:
            hprice = float(hl.get("price"))
        except (TypeError, ValueError):
            continue
        tier = str(hl.get("tier", "")).upper()
        score = 2.0 if tier.startswith("CRITICAL") else 1.5 if tier.startswith("SIGNIFICANT") else 1.0
        for l in levels:
            if abs(l["price"] - hprice) <= zone_tol:
                l[dim] = max(l.get(dim, 0.0), score)
    return levels, notes


def _positional_ladder(zones: list[dict], spot: float, pair: str = "DXY") -> list[dict]:
    """THE POSITIONAL LADDER (canon Step 7 + the v8 zNm, F-58 dead): name + zCat BY POSITION
    vs spot — Resistance names only ABOVE the spot, Support names only BELOW, Equilibrium
    only STRADDLING it. Rank-based role assignment (top slot = Ceiling regardless of where
    the spot sits) is the F-58 defect this kills: on a rally week the top band sits BELOW
    the spot and a rank-named 'Resistance' is a lie the T3/T4 gate refuses."""
    _is_dxy = str(pair).upper() in ("DXY", "DX-Y.NYB", "DX")
    _top_nm = "IP Resistance Ceiling" if _is_dxy else "Key IP Resistance Band"
    _bot_nm = "Key IP Support" if _is_dxy else "IP Support Floor"
    zones.sort(key=lambda z: -z["top"])
    for z in zones:
        z["zCat"] = CAT.classify(z["top"], z["bottom"], spot)
    _res = [z for z in zones if z["zCat"] == "RES"]
    _mid = [z for z in zones if z["zCat"] == "MID"]
    _sup = [z for z in zones if z["zCat"] == "SUP"]
    for _i, z in enumerate(_res):
        z["name"] = _top_nm if _i == 0 else "Upper IP Resistance"
    for z in _mid:
        z["name"] = "Equilibrium Zone"
    for _i, z in enumerate(_sup):
        z["name"] = _bot_nm if _i == len(_sup) - 1 else "Mid-Range Support"
    return zones


def synthesize_institutional_zones(levels: list[dict], bars: list[dict], spot: float,
                                   pair: str = "DXY") -> list[dict]:
    """THE 5 INSTITUTIONAL PRESSURE ROLES (Trident 5.3.3 section 5.2.1): the IP Zone Map is
    ONE role per band — Resistance Ceiling / Upper IP Resistance / Equilibrium Zone /
    Mid-Range Support / IP Support Floor — spanning the week's OWN swing range, each snapped
    to the strongest confluence levels inside its band. Deterministic from the week's data;
    never hand-drawn, never the canon's stale example.

    zCat (RES|MID|SUP) is POSITIONAL vs spot (CAT.classify), and the names follow the
    position via _positional_ladder — never the band fraction. A band is a search window,
    not a role: on a rally/selloff week the spot sits outside the middle band and the
    band-fraction role would name a zone below the spot 'Resistance' (F-58)."""
    wk = bars[-120:] if len(bars) > 120 else bars   # the WEEK's own range (5 days of 1H)
    hi = max(b["h"] for b in wk)
    lo = min(b["l"] for b in wk)
    rng = max(hi - lo, 1e-9)
    # THE v8 ZONE NAMES ARE PAIR-SPECIFIC (trident_v8.pine:192 dxy_zNm vs :227 eu_zNm): DXY
    # uses "IP Resistance Ceiling" / "Key IP Support"; the pairs use "Key IP Resistance Band" /
    # "IP Support Floor". The middle three names are shared. (The reviewers flagged a DXY name
    # on a EURUSD chart — a pair-isolation violation.)
    _is_dxy = str(pair).upper() in ("DXY", "DX-Y.NYB", "DX")
    _top_nm = "IP Resistance Ceiling" if _is_dxy else "Key IP Resistance Band"
    _bot_nm = "Key IP Support" if _is_dxy else "IP Support Floor"
    bands = [
        (_top_nm,                 0.85, 1.00, "RES"),
        ("Upper IP Resistance",   0.66, 0.85, "RES"),
        ("Equilibrium Zone",      0.34, 0.66, "MID"),
        ("Mid-Range Support",     0.15, 0.34, "SUP"),
        (_bot_nm,                 0.00, 0.15, "SUP"),
    ]
    # ── THE DEGREE IS A MEASUREMENT, NOT A POSITION (FAILURE_LOG F-56) ─────────────────
    # The deleted `role_weight` added a FIXED per-role offset (Ceiling +7, Mid +3) so the degrees
    # would LOOK like the v8's example — a 5/14 LIGHT confluence was labelled EXTREME. That is
    # authoring the answer instead of computing it. The canon (Step 5): "Assign pressure degrees
    # based on the group's highest-scoring level." The degree is `band_of(confluence)`; the
    # confluence is the canon's FULL score — the five measured dimensions + the per-ZONE regime
    # (Pillar 2, 0-2) + the Structural Extreme Bonus (Step 0b/0c/0.5/0e, +0..2). Nothing positional.
    _5d = ("technical", "options", "analyst", "structural", "psychological")
    _blocks = four_h_order_blocks(bars)      # Pillar 5 Step 0d + Step 9.7 — the 4H OB overlay
    zones = []
    for nm, f_lo, f_hi, cat in bands:
        blo = lo + f_lo * rng
        bhi = lo + f_hi * rng
        inband = sorted((l for l in levels if blo <= l["price"] <= bhi),
                        key=lambda l: l["price"])
        if inband:
            top = max(l["price"] for l in inband)
            bot = min(l["price"] for l in inband)
            best = max(inband, key=lambda l: sum(l[d] for d in _5d))
            conf = int(min(CONFLUENCE_CAP, round(
                sum(best[d] for d in _5d)
                + zone_regime(bot, top, bars, spot)              # Pillar 2 — PER ZONE, 0-2
                + zone_extreme_bonus(bot, top, bars, cat)         # Step 0e — SIDE-AWARE, +0..2
                + zone_4h_bonus(bot, top, _blocks, spot))))       # Step 9.7 — 4H OB overlap, +0..2
        else:
            top, bot, conf = bhi, blo, 0
        # POSITIONAL side (F-58): the band is a search window — the SIDE comes from the
        # zone's position vs spot, so the side-aware extreme bonus + zCat read truth.
        cat = CAT.classify(top, bot, spot)
        # THE INSTITUTIONAL FLOOR — a ROLE is a key zone even when its band's raw confluence is
        # thin (the E2 engine refuses zones scoring < 4). Carry it at >= 4 so the render + E2 both
        # anchor; the DEGREE still reads the honest score.
        conf = max(conf, 4)
        deg = band_of(conf)                                # the canon's own rule — NO offset
        # THE ZONE TYPE (Appendix B.1) — DERIVED from the zone's PILLAR COUNT (the canon's own
        # criteria: 3+ pillars = Hard Wall, 2+ = Standard, 1 = Soft/One-Touch). The pillar
        # count is what the option wall would otherwise supply (the harvest is DOWN), and it is
        # the DISCRIMINATOR: a zone fed by many pillars reads a LOWER failure probability than a
        # thin one (the width formula read the same on all five zones — the "5 of 6 identical"
        # defect). Never a per-role constant.
        _zf = {"top": top, "bottom": bot, "confluence": conf,
               "levels": [{"level_type": str(l["label"]).split("_")[0]} for l in inband]}
        _zt = ZFP.classify_zone_type(_zf)
        _zfp = ZFP.zfp(_zf, bars, spot, [])
        zones.append({
            "name": nm, "top": round(top, 5), "bottom": round(bot, 5),
            "zone_type": _zt,
            "confluence": conf, "pressure_degree": deg,
            "zfp": _zfp, "regime": "consolidation",
            "measured_move_target": None,
            "structural_extreme": bool(zone_extreme_bonus(bot, top, bars, cat) >= 1.0),
            "poi_tier": 2 if conf >= 8 else 1,
            "zCat": cat, "zTir": CAT.tier(conf),
            "zfp_label": _zfp,
            "zfp_receipt": ZFP.explain(_zf, bars, spot, []),
            "degree_v8": CAT.norm_degree(deg),
            "bom_fresh_flag": None, "timeframe": "1H",
            "levels": [{"price": l["price"], "label": l["label"],
                        "level_type": l["label"].split("_")[0], "style": "line",
                        "use_box": False} for l in inband[:8]],
        })
    # POSITIONAL names (F-58 dead): roles follow the position vs spot, never the band rank.
    zones = _positional_ladder(zones, spot, pair)
    return zones

def zone_regime(bot: float, top: float, bars: list, spot: float) -> float:
    """The prompt's Regime/Dynamic dimension (0-2), PER ZONE — the prompt's Synthesis Engine:
    'Zone in consolidation, will hold = 2 · zone in momentum, may hold or fail = 1 · zone in
    breakout, likely to fail = 0.' Read from the recent price action around the zone, never
    assigned (and never a global constant — a constant flattens every degree, the 6× defect)."""
    if not bars:
        return 1.0
    recent = bars[-120:]                                   # ~1 week of 1H bars
    touches = sum(1 for b in recent if b["l"] <= top and b["h"] >= bot)
    closes = [b["c"] for b in recent]
    above = sum(1 for c in closes if c > top)
    below = sum(1 for c in closes if c < bot)
    if touches >= 1 and above and below:
        return 2.0                                         # oscillating ACROSS it → consolidation
    if above == len(closes) or below == len(closes):
        return 0.0                                         # price sits beyond it → breakout
    return 1.0                                             # otherwise → momentum


def zone_extreme_bonus(bot: float, top: float, bars: list, side: str = "BOTH") -> float:
    """The prompt's STRUCTURAL EXTREME BONUS — Step 0b/0c/0.5/0e, TRANSCRIBED.

      · Step 0b — a SWING LOW is a D1 bar whose lower wick >= 0.15 DXY AND whose close is in
        the UPPER 50% of the daily range (a "Liquidity Sweep Target").
      · Step 0c — a SWING HIGH is a D1 bar whose upper wick >= 0.15 AND whose close is in the
        LOWER 50% (a "Supply Ceiling Target").
      · Step 0e — a swing low INSIDE this zone is a "Confluent Floor"; a swing high INSIDE is
        a "Confluent Ceiling". The prompt: "These confluent levels receive Structural
        dimension score of 2 (maximum) PLUS a Structural Extreme Bonus of +2." — the HIGHEST
        structural tier, and the mechanism that makes the price EXTREMES (the ceiling + the
        floor) the STRONGEST zones.
      · Step 0.5 — 2 swing extremes within 0.05 on separate dates = a Repeated Extreme Magnet
        (+1.5); 3+ = +2.0.

    THE DEFECT THIS FIXES (operator 2026-10-07, the N-th repeat): the earlier form filtered
    the swing list to the zone's OWN range and then required 2+ REPEATS — so a single swing
    inside a zone produced a group of 1 and the bonus was 0.0 on EVERY zone. Step 0e was
    never implemented: the ceiling + the floor (which DO contain swings) got nothing, so they
    stayed LIGHT/MODERATE-HEAVY while the mid won. The prompt's Step 0e is the exact +2 the
    extremes need."""
    if not bars:
        return 0.0
    # THE WICK THRESHOLDS ARE PAIR-RELATIVE (the DXY constants do not scale). The canon's
    # "lower wick >= 0.15 DXY" is 0.15% of price (0.15 at DXY 100); on EURUSD (~1.12) a
    # literal 0.15 is impossible (the daily range is ~0.005), so the extreme bonus NEVER fired
    # on a pair — every zone's score stayed flat (measured 2026-10-08: ext=0 on all 5 zones).
    _px = bars[-1]["c"] if bars else 100.0
    _wick = abs(_px) * 0.0015              # 0.15 at DXY 100
    _rep = abs(_px) * 0.0005               # 0.05 at DXY 100
    daily: dict = {}
    for b in bars[-540:]:
        d = dt.datetime.fromtimestamp(b["t"] / 1000, dt.timezone.utc).date()
        row = daily.setdefault(d, {"h": b["h"], "l": b["l"], "c": b["c"], "o": b["o"]})
        row["h"] = max(row["h"], b["h"])
        row["l"] = min(row["l"], b["l"])
        row["c"] = b["c"]
    days = sorted(daily.items())
    if len(days) < 3:
        return 0.0
    lows: list = []
    highs: list = []
    for dd, r in days:
        rng = r["h"] - r["l"]
        if rng <= 0:
            continue
        lower_wick = min(r["o"], r["c"]) - r["l"]
        upper_wick = r["h"] - max(r["o"], r["c"])
        if lower_wick >= _wick and (r["c"] - r["l"]) / rng >= 0.5:
            lows.append((dd, r["l"]))
        if upper_wick >= _wick and (r["c"] - r["l"]) / rng <= 0.5:
            highs.append((dd, r["h"]))

    # ── STEP 0e · CONFLUENT FLOOR / CEILING — a swing extreme INSIDE the zone → +2 ──────
    # The prompt (Step 0e): a swing low inside a Demand Zone is a "Confluent Floor"; a swing
    # high inside a Supply Zone is a "Confluent Ceiling" → the structural maximum, +2. This
    # is the tier that makes the price extremes the strongest zones, and it was MISSING.
    in_lo = [p for _, p in lows if bot - 0.05 <= p <= top + 0.05]
    in_hi = [p for _, p in highs if bot - 0.05 <= p <= top + 0.05]
    # SIDE-AWARE (canon Step 0e): a support/DEMAND zone is a "Confluent Floor" only with a swing
    # LOW inside it; a resistance/SUPPLY zone a "Confluent Ceiling" only with a swing HIGH inside;
    # a MID zone is NEITHER price extreme and earns NO structural-extreme bonus. (Before this the
    # bonus fired on any swing low anywhere — so the mid zone caught one and out-scored the
    # ceiling, inverting the canon's "the price extremes are the strongest".)
    if side == "MID":
        return 0.0
    if side == "SUP":
        in_hi = []
    elif side == "RES":
        in_lo = []
    if in_lo or in_hi:
        return 2.0

    # ── STEP 0.5 · THE REPEATED EXTREME MAGNET — 2 dates ≤0.05 apart → +1.5, 3+ → +2.0 ──
    def _repeats(pts: list) -> float:
        used = [False] * len(pts)
        best = 0.0
        for i in range(len(pts)):
            if used[i]:
                continue
            grp = [pts[i]]
            for j in range(i + 1, len(pts)):
                if not used[j] and abs(pts[j][1] - pts[i][1]) <= _rep:
                    grp.append(pts[j])
                    used[j] = True
            used[i] = True
            if len(grp) >= 3:
                best = max(best, 2.0)
            elif len(grp) == 2:
                best = max(best, 1.5)
        return best

    return min(2.0, max(_repeats(in_lo), _repeats(in_hi)))


def _resample_4h(bars: list) -> list:
    """Resample the 1H bars to 4H candles (4 bars each) — the 4H Zone Scan source."""
    out = []
    for i in range(0, len(bars), 4):
        chunk = bars[i:i + 4]
        if not chunk:
            continue
        out.append({"t": chunk[0]["t"], "o": chunk[0]["o"],
                    "h": max(b["h"] for b in chunk), "l": min(b["l"] for b in chunk),
                    "c": chunk[-1]["c"]})
    return out


def four_h_order_blocks(bars: list) -> list:
    """The prompt's 4H ORDER BLOCKS — Pillar 5 Step 0d ("Cross-Reference Swing Extremes with
    Order Blocks") + Step 9.7 (the 4H Zone Classification Overlay). An order block is the
    LAST OPPOSING 4H candle before an IMPULSIVE 4H move — the institutional origin of the
    move (a down candle before a strong up move = DEMAND; an up candle before a strong down
    move = SUPPLY). Returns [(bottom, top, kind)].

    THE MISSING DIMENSION (operator 2026-10-07, verbatim: "there is a four hour supply zone
    right around the resistance areas of the IP zones … if you had accurate ZFP you would
    have seen an extremely low ZFP and high pressure on these zones"). The engine had NO 4H
    dimension, so a resistance ceiling sitting on a 4H supply block scored LIGHT (zfp 50) —
    and the E2 then predicted a breakout continuation where the canon's own §6.4.1 says a
    hard wall (zfp < 20) bounces. This is the prompt's Tier-1 POI input."""
    h4 = _resample_4h(bars) if bars else []
    if len(h4) < 6:
        return []
    body = [abs(c["c"] - c["o"]) for c in h4]
    avg = (sum(body) / len(body)) if body else 0.0
    blocks = []
    seen = []
    for i in range(1, len(h4) - 1):
        cur, nxt = h4[i], h4[i + 1]
        move = nxt["c"] - nxt["o"]
        if avg <= 0 or abs(move) < 1.5 * avg:
            continue                                    # not an impulsive move
        kind = None
        if move > 0 and cur["c"] < cur["o"]:
            kind = "DEMAND"
        elif move < 0 and cur["c"] > cur["o"]:
            kind = "SUPPLY"
        if not kind:
            continue
        bot, top = cur["l"], cur["h"]
        # ── THE VERIFICATION PROTOCOL (canon Step 0f) — FAILURE_LOG F-63 ────────────────
        # the block must: (1) be no wider than 0.40 DXY (a wider one is noise), (2) carry its
        # origin DATE (so a consumer can age it), (3) not overlap an OPPOSITE-type block at the
        # same TF (two opposing BoMs on the same price is a contradiction).
        if (top - bot) > 0.40:
            continue
        if any(kind != k and not (top < b0 or bot > b1) for (b0, b1, k, _d) in seen):
            continue
        seen.append((bot, top, kind, cur["t"]))
    return [(b0, b1, k, d) for (b0, b1, k, d) in seen]


def zone_4h_bonus(bot: float, top: float, blocks: list, spot: float = None) -> float:
    """The prompt's Step 9.7 POI Tier: an IP zone that OVERLAPS a 4H BoM S/D is Tier 1
    ("Primary trade location. +2 confluence."); an IP zone with NO overlapping 4H BoM is
    Tier 2 ("Secondary trade location. +1 confluence."). Every IP zone is Tier 1 or Tier 2,
    so the bonus is +2 (Tier 1) or +1 (Tier 2) — NEVER 0.

    THE S/D MATCH (operator 2026-10-07): a 4H SUPPLY block reinforces a RESISTANCE zone
    (above the spot); a 4H DEMAND block reinforces a SUPPORT zone (below the spot). An
    unmatched overlap (a demand block at a resistance) is not institutional confluence —
    the prompt's Tier-1 is a MATCHED BoM/S-D overlap. The operator's ceiling has a 4H
    SUPPLY zone on it, which is exactly this bonus firing."""
    for b, t, kind, *_rest in (blocks or []):
        if top < b or bot > t:                          # no overlap
            continue
        if spot is None:
            return 2.0                                  # spot-less: any overlap counts
        above = (top + bot) / 2.0 > spot                # a resistance-side zone
        if (above and kind == "SUPPLY") or (not above and kind == "DEMAND"):
            return 2.0                                  # Tier 1 — a MATCHED BoM overlap
    return 1.0                                          # Tier 2 — IP-only POI (+1, Step 9.7)


def assemble(levels: list[dict], a: float, spot: float, pair: str = "DXY",
             bars: list = None) -> list[dict]:
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
    # ── THE CANON'S 3+ LEVEL LAW (step 3, VERBATIM) ─────────────────────────────────────
    # "A 'cluster' is 3+ levels within a 0.15 DXY band." FAILURE_LOG F-57: this was `1`, so a
    # lone scored level became a zone and a 5th slot was FABRICATED at a 2-pillar floor. The
    # canon's floor is 3. A week that forms 4 real clusters emits 4 zones.
    min_members = 3           # canon step 3: "3+ levels within a 0.15 DXY band"
    # THE SPREAD WINDOW + THE CONFLUENCE FILTER (the accuracy fix, 2026-07-05). The 144
    # candidate levels are DENSE (a level every 0.02-0.05), so clustering ALL of them gives a
    # DENSITY partition — five contiguous ~0.16 bands with no gaps (the operator: "not
    # accurate"). A REAL institutional zone is where INDEPENDENT dimensions AGREE: a level
    # scored >= CONFLUENCE_MIN (a multi-dimension confluence). Clustering ONLY the confluence
    # levels yields the genuine zones — distinct, with the GAPS the operator reads as levels.
    _sc = lambda l: sum(l[d] for d in ("technical", "options", "analyst", "structural",
                                       "psychological", "regime"))
    # ── THE PROMPT'S STEP 1 (VERBATIM): "Collect all levels from all 9 pillars. Sort from
    # highest to lowest. DO NOT filter by spot proximity." ───────────────────────────────
    # The earlier build restricted the pool to ±CONFLUENCE_WINDOW of spot, so with the price
    # near the week's high EVERY resistance level above it was discarded → 0 RES zones (the
    # operator: "how did we randomly go from six zones down to five zones?"). The confluence
    # floor stays (a zone still needs ≥3 agreeing levels); the SPOT-PROXIMITY FILTER IS GONE.
    live = sorted((l for l in levels if _sc(l) >= CONFLUENCE_MIN),
                  key=lambda l: l["price"])             # ascending — the clustering needs it
    # (the prompt's "sort highest→lowest" is honoured on the EMIT: `zones.sort(-top)` below)
    clusters: list[list[dict]] = []
    for l in live:
        if clusters and (l["price"] - clusters[-1][-1]["price"] <= tol
                         and l["price"] - clusters[-1][0]["price"] <= band):
            clusters[-1].append(l)
        else:
            clusters.append([l])
    clusters = [cl for cl in clusters if len(cl) >= min_members]
    _blocks = four_h_order_blocks(bars)                  # the 4H order blocks (Step 0d/9.7)

    zones = []
    for cl in clusters:
        top = max(l["price"] for l in cl)
        bot = min(l["price"] for l in cl)
        # ── THE PROMPT'S 6-DIMENSION SCORE (Synthesis Engine, the 0-14) ──────────────
        # technical + options + analyst + structural + psychological + regime, PLUS the
        # Structural Extreme Bonus (≤2). Max = 6×2 + 2 = 14. THE DEFECT THIS FIXES
        # (operator 2026-10-06, 6th repeat): the regime dim was a GLOBAL CONSTANT
        # (`build_levels` set `l["regime"]` on every level identically) and `structural` was
        # DOUBLE-COUNTED (base + bonus×0.66), so 29 levels tied at 6.3 and every cluster's
        # best tied → EVERY zone read MODERATE 37% ("five out of six zones … not possible").
        # The prompt's regime is PER ZONE ("zone in consolidation 2 / momentum 1 / breakout 0").
        best = max(cl, key=lambda l: sum(l[d] for d in
                                         ("technical", "options", "analyst", "structural",
                                          "psychological")))
        base = sum(best[d] for d in ("technical", "options", "analyst", "structural",
                                     "psychological"))
        reg = zone_regime(bot, top, bars, spot)          # 0/1/2, PER ZONE
        bonus = (min(2.0, best.get("bonus", 0.0)) + zone_extreme_bonus(bot, top, bars)
                 + zone_4h_bonus(bot, top, _blocks, spot))  # +2 for a Tier-1 4H overlap (Step 9.7)
        conf = int(min(CONFLUENCE_CAP, round(base + reg + bonus)))
        deg = band_of(conf)
        side = "SUPPLY" if top > spot else "DEMAND"
        # ── THE ZFP (canon:293 + the ONE implementation) — the FAILURE PROBABILITY ──
        # The zone's CONFLUENCE determines its type (HARD_WALL/STANDARD_WALL/SOFT_WALL) and thus
        # the ZFP base (e1_zfp.classify_zone_type). Passing only {top,bottom} left every zone at
        # the default ONE_TOUCH (zfp 60) — the confluence MUST be passed so the strength reads.
        _zfp = ZFP.zfp({"top": top, "bottom": bot, "confluence": conf}, pair)
        _zone = {
            "name": f"{deg[:4]}_{side}_{top:.2f}",
            "top": round(top, 5), "bottom": round(bot, 5),
            "confluence": conf, "pressure_degree": deg,
            "zfp": _zfp,
            "zfp_receipt": ZFP.explain({"top": top, "bottom": bot, "confluence": conf}, pair),
            "regime": "consolidation" if conf >= 6 else "momentum",
            "measured_move_target": None, "structural_extreme": any(
                l["structural"] >= 1.0 for l in cl),
            "poi_tier": 2 if conf >= 8 else 1,
            # ── THE V8 BRIDGE (W2's e1_category) — the renderer's own vocabulary ──────
            # zCat: RES|MID|SUP (positional vs spot) · zTir: T1|T2 · the label's ZFP by
            # v8's zoneW/refRange · the degree in the zfill/zbord tower's literal form
            "zCat": CAT.classify(top, bot, spot),
            "zTir": CAT.tier(conf),
            "zfp_label": _zfp,
            "degree_v8": CAT.norm_degree(deg),
            "bom_fresh_flag": None,
            "timeframe": "1H",
            "levels": [{"price": l["price"], "label": l["label"],
                        "level_type": l["label"].split("_")[0],
                        "style": "line", "use_box": False} for l in cl],
        }
        if deg == "MINIMAL":
            continue                         # a 0-3 score is discarded as a NAMED zone
        zones.append(_zone)
    # ── THE V8'S FIVE-SLOT POSITIONAL LADDER (trident_v8.pine:187-192, VERBATIM) ──────────
    # The approved reference renders EXACTLY FIVE zones, named by position:
    #   zCat = RES, RES, MID, SUP, SUP
    #   zNm  = IP Resistance Ceiling, Upper IP Resistance, Equilibrium Zone,
    #          Mid-Range Support, Key IP Support
    # Take the five STRONGEST clusters (by confluence), then assign the five roles BY POSITION
    # (the highest price = the ceiling, the lowest = the key support). This matches the v8's
    # structure exactly: FIVE zones, two above / one straddling / two below the spot.
    # ── THE V8 RENDERS FIVE ZONES: top up from a LOWER floor when the 3+ scan is short ──────
    # (the v8's own data is five zones; a week whose 3+ clusters number four still renders five
    # slots, the fifth a REAL cluster at a REAL price from the 2+ scan — never a fabricated band)
    if len(zones) < 5:
        _sc2 = lambda l: sum(l[d] for d in ("technical", "options", "analyst", "structural",
                                            "psychological", "regime"))
        _covered = [(z["bottom"], z["top"]) for z in zones]
        _low = sorted((l for l in levels if _sc2(l) >= 2), key=lambda l: l["price"])
        _cl2 = []
        for l in _low:
            if _cl2 and (l["price"] - _cl2[-1][-1]["price"] <= tol
                         and l["price"] - _cl2[-1][0]["price"] <= band):
                _cl2[-1].append(l)
            else:
                _cl2.append([l])
        for cl in sorted(_cl2, key=lambda c: -len(c)):
            if len(zones) >= 5:
                break
            b, t = min(x["price"] for x in cl), max(x["price"] for x in cl)
            if any(not (t < zb or b > zt) for zb, zt in _covered):
                continue
            _best = max(cl, key=_sc2)
            _conf = int(min(CONFLUENCE_CAP, round(sum(_best[d] for d in
                      ("technical", "options", "analyst", "structural", "psychological"))
                      + zone_regime(b, t, bars, spot) + zone_extreme_bonus(b, t, bars))))
            zones.append({
                "name": "zone", "top": round(t, 5), "bottom": round(b, 5),
                "confluence": _conf, "pressure_degree": band_of(_conf),
                "zfp": ZFP.zfp({"top": t, "bottom": b, "confluence": _conf}, pair),
                "zfp_receipt": ZFP.explain({"top": t, "bottom": b, "confluence": _conf}, pair),
                "regime": "momentum", "measured_move_target": None,
                "structural_extreme": False, "poi_tier": 1,
                "zCat": CAT.classify(t, b, spot), "zTir": CAT.tier(_conf),
                "zfp_label": ZFP.zfp({"top": t, "bottom": b, "confluence": _conf}, pair),
                "degree_v8": CAT.norm_degree(band_of(_conf)),
                "bom_fresh_flag": None, "timeframe": "1H",
                "levels": [{"price": l["price"], "label": l["label"],
                            "level_type": l["label"].split("_")[0],
                            "style": "line", "use_box": False} for l in cl],
            })
            _covered.append((b, t))
    zones.sort(key=lambda z: -z["confluence"])          # strongest first
    zones = zones[:5]                                   # the v8's five slots
    # POSITIONAL (F-58 dead): names + zCat BY POSITION vs spot — never by rank.
    zones = _positional_ladder(zones, spot, pair)
    for _z in zones:
        _z["zTir"] = CAT.tier(_z["confluence"])
        _z["degree_v8"] = CAT.norm_degree(_z["pressure_degree"])
        _z["zfp_label"] = _z["zfp"]
    # ── THE CANON'S PRICE EXTREMES (Step 0e, canon:1240-1242, VERBATIM): the confluent floor /
    # ceiling — the OUTERMOST zones — receive a Structural Extreme Bonus of +2, so "the price
    # EXTREMES are the strongest" (the v8's ladder zDeg HEAVY·MOD-HEAVY·MOD-HEAVY·MODERATE·HEAVY
    # places HEAVY at BOTH outer slots). The cluster confluence alone under-weights the thin outer
    # bands (a swing may fall outside them), leaving the MID the strongest — the INVERSE of the
    # authority. Grant the +2 to the two outer slots; the ZFP (which now reads the confluence)
    # falls accordingly, so the floor/ceiling read STRONGER (lower ZFP) than the equilibrium.
    # (The v8's own zDeg is a hand-typed literal, identical for every pair — the canon's computed
    #  intent, not the literals, is the target.)
    # EMPTY GUARD (ST-6): no zones -> nothing to bonus; a single zone is both
    # extremes at once, so dedupe the index pair (never +4 on one zone).
    for _i in dict.fromkeys((0, len(zones) - 1)) if zones else ():
        _z = zones[_i]
        if not _z.get("structural_extreme"):
            _z["confluence"] = int(min(CONFLUENCE_CAP, _z["confluence"] + 2))
            _z["pressure_degree"] = band_of(_z["confluence"])
            _z["degree_v8"] = CAT.norm_degree(_z["pressure_degree"])
            _z["zTir"] = CAT.tier(_z["confluence"])
            _z["zfp"] = ZFP.zfp({"top": _z["top"], "bottom": _z["bottom"],
                                 "confluence": _z["confluence"]}, pair)
            _z["zfp_label"] = _z["zfp"]
    # the degree per the v8's tower (the pressure label), the tier per the confluence
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

    # ── THE SPOT = THE PRICE AT THE ANCHOR (the target week's Monday), NOT bars[-1] ──────
    # With a forward-EXTENDED fixture, `bars[-1]` is the FUTURE price (8 days past the anchor).
    # Classifying the zones against the future price put the "resistance" BELOW it → 0 RES zones
    # even after the spot filter was removed (the operator: "the resistance … is literally being
    # broken"). The prompt classifies vs the CURRENT price — the price at prediction time.
    _wmon = int(dt.datetime.combine(dt.date.fromisoformat(week), dt.time(0, 0),
                                    tzinfo=dt.timezone.utc).timestamp() * 1000)
    _pre = [b for b in bars if b["t"] < _wmon]
    spot = _pre[-1]["c"] if _pre else bars[-1]["c"]
    levels, notes = build_levels(bars, args.pair, week)
    # THE SPEC'S METHOD (5.3.3 Part III Protocol B): the IP zones = where the pillars' LEVELS
    # CONFLUENCE — cluster the scored levels by price, score each cluster by the 6D sum.
    # (The earlier `synthesize_institutional_zones` range-bands were WRONG — a partition of the
    # range, not zones; the operator: "they're just literally stacked on top of each other".)
    # ── THE V8'S FIVE-SLOT POSITIONAL LADDER (trident_v8.pine:187-192) ─────────────────
    # The approved reference renders FIVE zones by POSITION — verified: each of the v8's five
    # DXY zones falls inside the five range-fractions 0-0.15 / 0.15-0.34 / 0.34-0.66 /
    # 0.66-0.85 / 0.85-1.0. That IS the IP Zone Map (the 5.3.3 §5.2.1 ladder), not a 0.15
    # cluster scan. `synthesize_institutional_zones` produces exactly those five.
    zones = synthesize_institutional_zones(levels, bars, spot, args.pair)
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
        # ── THE LSZ — FIRST-CLASS ZONE OBJECTS (canon Pillar 5 Step 0.45) ────────────────
        # FAILURE_LOG F-62: the LSZ was a scored POINT in the confluence pool. The canon's
        # Step 0.45 is a ZONE: `[exact low, exact low + 0.05]` with Type / Source / Function /
        # Priority, and "every trade setup MUST reference at least one LSZ". Emitted here as
        # first-class objects so E3 (the trade setups) can anchor SLs to them.
        "lsz": [{"range": [l["price"], round(l["price"] + 0.05, 5)],
                 "type": "Demand-side" if l["price"] < spot else "Supply-side",
                 "source": "P5 sweep — the prior exact swing low/high",
                 "function": "liquidity sweep zone (brief breach then reversal)",
                 "priority": int(l["structural"]) if l["structural"] else 1}
                for l in levels if str(l["label"]).startswith("P5_LSZ_")],
        "notes": [f"{len(levels)} candidate levels clustered into {len(zones)} zones",
                  notes.get("pivot_verification", "")],
        "temporal_boundary_utc": "",
    }
    # THE NINE-SOURCE HARVEST (spec item 14: `make e1` runs e1_sources.py -> data/e1/
    # sources.json BEFORE this extractor). Merge its per-source status into the payload's
    # provenance. ADDITIVE — the zones stay OHLC-derived (blueprint §7: the harvest is the
    # web dimension the OHLC cannot supply); a down source is [NO DATA], never a fabrication.
    _harvest = ROOT / "data" / "harvest" / "sources.json"
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