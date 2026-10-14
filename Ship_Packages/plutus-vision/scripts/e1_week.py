#!/usr/bin/env python3
"""
e1_week.py — THE WEEK ANCHOR. Turns the chart's last bar into the trading week.

WHY THIS EXISTS. trident_v8.pine hardcodes its window (`timestamp(2026,4,6)` ..
`timestamp(2026,5,15)`) — correct for exactly one week, wrong for every other. The E1
automatic build replaces that with a week DERIVED FROM THE CHART, so the same expression is
correct live and under bar replay (in replay, the last bar IS the rewind point).

THE ONE LAW: `anchor = the chart's last bar`, NEVER wall-clock now(). One source, two modes,
no branch on the anchor itself.

    tsL   = mon - 14d   (2 weeks of hindsight — the prior sweeps the zones derive from)
    tsR   = fri + 21d   (3 weeks of foresight — the space to read the trade)
    tsMid = (tsL + tsR) // 2

THE WEEKDAY CONVENTION (the FX trading week).
  Mon..Fri  the bar's own week; mon = bar - weekday*day
  Saturday  post-close, still the just-finished week; mon = bar - 5 days
  Sunday    the just-finished week stands (Sydney opens the new week Sunday evening); mon = the FOLLOWING Monday

IMPLEMENTS THE BLUEPRINT: MASTER_BLUEPRINT.md §4.2 / §18.1.
SPEC: plutus-vision-e1-automatic_DPL1_SPEC.md §5 item 1 (the anchor).
GATE: scripts/e1_st_18.py (test_week_resolve) must print `RESULT pass=N fail=0`.

    python3 scripts/e1_week.py 2026-10-06              # a date -> the anchor JSON
    python3 scripts/e1_week.py --ms 1759708800000      # epoch ms -> the anchor JSON
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import numbers
import sys

DAY_MS = 86_400_000
HINDSIGHT_DAYS = 14  # 2 weeks — fixed window constant, never per-zone
FORESIGHT_DAYS = 21  # 3 weeks — fixed window constant, never per-zone


class E1WeekInvalid(Exception):
    """Loud, named refusal. A bad bar_time NEVER yields a guessed Monday."""


def _midnight_ms(ms: int) -> int:
    """Truncate an epoch-ms to the UTC midnight of its day (ms epochs are UTC-based,
    so the modulo is exact — no timezone arithmetic leaks in)."""
    return ms - (ms % DAY_MS)


def resolve(
    bar_time_ms: int | None,
    *,
    hindsight_days: int = HINDSIGHT_DAYS,
    foresight_days: int = FORESIGHT_DAYS,
) -> dict:
    """bar_time_ms = the chart's last bar (epoch ms). Returns the anchor, all epoch ms.

    Raises E1WeekInvalid on a missing / non-positive / implausible bar_time — the loud
    fail, so a chart with no valid bar can never render a fabricated week.
    """
    if not bar_time_ms or isinstance(bar_time_ms, bool) or not isinstance(bar_time_ms, numbers.Integral) \
            or bar_time_ms <= 0:
        raise E1WeekInvalid("E1_WEEK_INVALID — bar_time missing or non-positive")

    try:
        d = dt.datetime.fromtimestamp(bar_time_ms / 1000, tz=dt.timezone.utc)
    except (OverflowError, OSError, ValueError) as e:      # far-out-of-range ms
        raise E1WeekInvalid(f"E1_WEEK_INVALID — bar_time out of range: {type(e).__name__}") from e
    if d.year < 2000 or d.year > 2100:
        raise E1WeekInvalid(f"E1_WEEK_INVALID — implausible year {d.year}")

    wd = d.weekday()  # Mon=0 .. Sat=5, Sun=6
    days_back = wd if wd < 6 else -1  # Sunday -> the FOLLOWING Monday (+1 day)
    mon = _midnight_ms(bar_time_ms - days_back * DAY_MS)
    fri = mon + 4 * DAY_MS
    tsL = mon - hindsight_days * DAY_MS
    tsR = fri + foresight_days * DAY_MS
    return {"mon": mon, "fri": fri, "tsL": tsL, "tsR": tsR, "tsMid": (tsL + tsR) // 2}


def _ms_to_iso(ms: int) -> str:
    return dt.datetime.fromtimestamp(ms / 1000, tz=dt.timezone.utc).isoformat()


def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser(description="the E1 week anchor")
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("date", nargs="?", help="YYYY-MM-DD (the chart's last day)")
    g.add_argument("--ms", type=int, help="the chart's last bar, epoch ms")
    args = ap.parse_args(argv)

    if args.ms is not None:
        ms = args.ms
    else:
        try:
            d = dt.datetime.strptime(args.date, "%Y-%m-%d").replace(tzinfo=dt.timezone.utc)
        except (ValueError, TypeError) as e:
            print(f"E1_WEEK_INVALID — bad date {args.date!r} (want YYYY-MM-DD): {e}",
                  file=sys.stderr)
            return 1
        ms = int(d.timestamp() * 1000)

    try:
        a = resolve(ms)
    except E1WeekInvalid as e:
        print(str(e), file=sys.stderr)
        return 1

    out = {k: {"ms": v, "iso": _ms_to_iso(v)} for k, v in a.items()}
    out["input"] = {"ms": ms, "iso": _ms_to_iso(ms)}
    print(json.dumps(out, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
