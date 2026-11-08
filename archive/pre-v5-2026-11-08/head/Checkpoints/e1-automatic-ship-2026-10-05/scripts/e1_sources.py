#!/usr/bin/env python3
"""
e1_sources.py — THE AUTOMATIC HARVEST (the reconciled view).

THE CANONICAL FETCHER IS `e1_fetch.py` — the NINE sources (S1 investinglive options → S9
forex.com research), with the canon's temporal boundary, the notional assertion, and the ONE
bounded model call. THIS module does NOT reinvent them; it RECONCILES the canonical web harvest
with the LOCAL pillars the render needs (the OHLC the engine scores on, and the weekly open
derived from it).

THE HONESTY LAW: a source that is DOWN yields `[NO DATA]` + a reason, and the harvest still
succeeds. A fabricated level on a chart is the worst failure. The nine web sources require
NETWORK ACCESS; when it is unreachable they record `[NO DATA]` with the network reason.

THE CONCURRENCY SHAPE: independent pillars run in parallel with per-pillar capture (allSettled
semantics — one dead source never kills the harvest).

    python3 scripts/e1_sources.py                    # the reconciled pillar table
    python3 scripts/e1_sources.py --json             # the raw pillar map
    python3 scripts/e1_sources.py --live             # include the 9 web sources (network)
"""

from __future__ import annotations

import argparse
import concurrent.futures as cf
import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
FIXTURES = ROOT / "fixtures" / "bars"
sys.path.insert(0, str(ROOT / "scripts"))


class SourceDown(Exception):
    """A source failed. Caught per-pillar; recorded as [NO DATA] + the reason. NEVER fatal."""


# ── S1/S2 — THE OHLC BARS (local: the fixture the engine scores on) ────────────────
def harvest_bars(week: str = "", symbol: str = "DXY", timeframe: str = "1H") -> dict:
    files = sorted(FIXTURES.glob("*.json"))
    if week:                                   # the WEEK selector (audit 2026-10-05: it was ignored)
        hit = [f for f in files if week in f.stem]
        if not hit:
            raise SourceDown(f"NO_FIXTURE: no fixture for week {week}")
        files = hit
    if not files:
        raise SourceDown("NO_FIXTURE: fixtures/bars is empty")
    d = json.loads(files[-1].read_text())
    for cell in d.get("cells", []):
        if cell.get("pair") == symbol and cell.get("timeframe") == timeframe:
            bars = cell.get("bars", [])
            if not bars:
                raise SourceDown(f"NO_BARS: the {symbol} {timeframe} cell is empty")
            return {"data": bars, "label": f"fixture:{files[-1].stem} {symbol} {timeframe}",
                    "count": len(bars)}
    raise SourceDown(f"NO_CELL: the fixture has no {symbol} {timeframe} cell")


# ── S6 — THE WEEKLY OPEN (derived from the bars) ───────────────────────────────────
def harvest_weekly_open(week: str, symbol: str = "DXY") -> dict:
    bars = harvest_bars(week, symbol)["data"]
    if not bars:
        raise SourceDown("WEEK_OPEN_UNAVAILABLE: no bars to derive the open from")
    first = bars[0]
    op = first.get("open") if isinstance(first, dict) else None
    if op is None:
        raise SourceDown("WEEK_OPEN_UNAVAILABLE: the first bar carries no open")
    t = first.get("timestamp") if isinstance(first, dict) else None
    try:                                          # a non-numeric open ("N/A") must not crash
        opf = float(op)
    except (TypeError, ValueError) as e:
        raise SourceDown(f"WEEK_OPEN_UNAVAILABLE: non-numeric open ({e})") from e
    return {"data": [{"price": opf, "t": t, "label": "weekly_open"}],
            "label": f"weekly_open {opf:.4f}"}


# ── S1..S9 — THE CANONICAL WEB HARVEST, DELEGATED to e1_fetch.py ────────────────────
def harvest_web(week: str, live: bool = False) -> dict:
    """Run the CANONICAL nine sources (e1_fetch.SOURCES). Each source that raises -> [NO DATA].
    Requiring network; a dry run (live=False) records the sources as [NO DATA: dry]."""
    try:
        import e1_fetch as F
    except ImportError as e:      # ONLY a missing module is FETCH_MODULE_MISSING (audit 2026-10-05);
        raise SourceDown(f"FETCH_MODULE_MISSING: {str(e)[:200]}") from e  # a syntax error MUST surface
    if not live:
        raise SourceDown("WEB_DRY: pass --live to hit the network (the nine web sources)")
    cutoff = F.boundary_for(week)
    out: dict = {}
    for name, fn in F.SOURCES:
        try:
            levels = fn(cutoff)
            out[name] = {"status": "OK", "count": len(levels)}
        except Exception as e:                              # any source failure is [NO DATA]
            out[name] = {"status": "DOWN", "reason": f"{type(e).__name__}: {str(e)[:200]}"}
    up = sum(1 for v in out.values() if v["status"] == "OK")
    return {"data": out, "label": f"web {up}/{len(out)} sources"}


# the local pillars (always available); the web harvest is a separate, network-gated call
SOURCE_PILLARS = {
    "ohlc":        ("S1/S2 local", harvest_bars),
    "weekly_open": ("S6 derived",  harvest_weekly_open),
}


def harvest_all(week: str, workers: int = 8, live: bool = False) -> dict:
    """Local pillars in parallel (per-pillar capture), then the web harvest. NEVER raises."""
    out: dict[str, dict] = {}
    with cf.ThreadPoolExecutor(max_workers=workers) as ex:
        futs = {ex.submit(fn, week): name for name, (_s, fn) in SOURCE_PILLARS.items()}
        for fut in cf.as_completed(futs):
            name = futs[fut]
            try:
                out[name] = {**fut.result(), "status": "OK"}
            except SourceDown as e:
                out[name] = {"data": [], "label": "[NO DATA]", "reason": str(e), "status": "DOWN"}
            except Exception as e:
                out[name] = {"data": [], "label": "[NO DATA]",
                             "reason": f"UNEXPECTED: {str(e)[:200]}", "status": "DOWN"}
    # the web harvest (the canonical nine) — one pillar group, network-gated
    try:
        out["web"] = {**harvest_web(week, live), "status": "OK"}
    except SourceDown as e:
        out["web"] = {"data": {}, "label": "[NO DATA]", "reason": str(e), "status": "DOWN"}
    return out


def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--week", default="2026-07-06")
    ap.add_argument("--live", action="store_true", help="hit the network for the nine web sources")
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args(argv)

    pillars = harvest_all(args.week, live=args.live)
    if args.json:
        print(json.dumps(pillars, indent=2, default=str))
        return 0
    ok = sum(1 for p in pillars.values() if p["status"] == "OK")
    print(f"harvest week={args.week}  {ok}/{len(pillars)} local pillars up  (live={args.live})")
    for name in SOURCE_PILLARS:
        p = pillars.get(name, {})
        print(f"  {'OK ' if p.get('status')=='OK' else 'DOWN'} {name:12s} {p.get('label','?')}"
              f"{('  <- ' + p.get('reason','')) if p.get('reason') else ''}")
    web = pillars.get("web", {})
    if web.get("status") == "OK":
        for s, v in (web.get("data") or {}).items():
            print(f"  {'OK ' if v.get('status')=='OK' else 'DOWN'} {s:20s} "
                  f"{v.get('count','') if v.get('status')=='OK' else '- ' + str(v.get('reason',''))}")
    else:
        print(f"  DOWN web          {web.get('reason','')}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
