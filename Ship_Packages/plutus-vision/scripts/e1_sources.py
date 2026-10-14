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
import os
import pathlib
import sys
import time

ROOT = pathlib.Path(__file__).resolve().parent.parent
FIXTURES = ROOT / "fixtures" / "bars"
sys.path.insert(0, str(ROOT / "scripts"))


class SourceDown(Exception):
    """A source failed. Caught per-pillar; recorded as [NO DATA] + the reason. NEVER fatal."""


def fixture_week() -> str:
    """The week the CHART's fixture declares — read from the fixture's own `week` field.

    THE DEFECT THIS REPLACES (measured 2026-10-05): `--week` defaulted to the literal
    `2026-07-06`, so the harvest targeted one fixed week forever. The chart's bars come from
    this same fixture (scripts/pv-server.py FIXTURE + pine-ide/pine-station/lib/bars.mjs), so
    the fixture's own `week` is the honest default and it tracks a fixture swap for free."""
    for fx in sorted(FIXTURES.glob("*.json"), reverse=True):
        try:
            w = str(json.loads(fx.read_text()).get("week") or "")
        except Exception:
            continue
        if w:
            return w
    return ""


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
    # ── THE NINE SOURCES RUN CONCURRENTLY, EACH UNDER ITS OWN DEADLINE (2026-10-07) ──
    # They are INDEPENDENT network reads (four of them launch their own private headless
    # Chrome), so the serial loop paid the SUM of their latencies. MEASURED 2026-10-07:
    # S5_forexfactory / S7_yahoo_dxy / S8_tradingview / S9_forex_com each took ~42 s
    # (a `Page.loadEventFired` wait that a modern page never fires inside headless), so
    # `e1_sources.py --live` blew past the operator's 150 s ceiling and never returned.
    # The harvest is allSettled by contract: a hung source is now a NAMED `TIMEOUT`
    # pillar, never a hung run, and no source can spend more than its own deadline.
    timeout_s = float(os.environ.get("E1_WEB_SOURCE_TIMEOUT", "60"))
    budget_s = float(os.environ.get("E1_WEB_BUDGET", "100"))
    workers = int(os.environ.get("E1_WEB_WORKERS", "6"))
    names = [n for n, _ in F.SOURCES]
    out: dict = {}
    t0 = time.time()
    ex = cf.ThreadPoolExecutor(max_workers=max(1, min(workers, len(names))))
    try:
        futs = {ex.submit(fn, cutoff): name for name, fn in F.SOURCES}
        for fut, name in futs.items():
            left = max(0.5, min(timeout_s, budget_s - (time.time() - t0)))
            try:
                levels = fut.result(timeout=left)
                # CAPTURE THE LEVELS (fix 2026-10-07). The earlier form recorded ONLY the count,
                # so the harvested option-strike / analyst levels (the canon's S1/S9, the source of
                # the Options + Analyst score dimensions) were discarded the moment they arrived —
                # the two dimensions could never be wired. `levels` is the useful output.
                out[name] = {"status": "OK", "count": len(levels), "levels": levels}
            except cf.TimeoutError:
                out[name] = {"status": "DOWN", "count": 0, "levels": [],
                             "reason": f"TIMEOUT: no reply within {left:.0f}s"}
            except Exception as e:                        # any source failure is [NO DATA]
                out[name] = {"status": "DOWN", "count": 0, "levels": [],
                             "reason": f"{type(e).__name__}: {str(e)[:200]}"}
    finally:
        # NEVER join a straggler: e1_fetch.headless_fetch is itself deadline-bounded, so an
        # abandoned worker exits on its own and cannot hold this process open.
        ex.shutdown(wait=False, cancel_futures=True)
    out = {n: out.get(n, {"status": "DOWN", "count": 0, "levels": [], "reason": "NOT_RUN"}) for n in names}
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
    ap.add_argument("--week", default="",
                    help="the target week ISO; default = the CHART fixture's own `week` field")
    ap.add_argument("--live", action="store_true", help="hit the network for the nine web sources")
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args(argv)

    week = args.week or fixture_week()      # DERIVED from the chart's fixture, never a literal
    pillars = harvest_all(week, live=args.live)
    if args.json:
        print(json.dumps(pillars, indent=2, default=str))
        return 0
    ok = sum(1 for p in pillars.values() if p["status"] == "OK")
    print(f"harvest week={week}  {ok}/{len(pillars)} local pillars up  (live={args.live})")
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
