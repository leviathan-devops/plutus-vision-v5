#!/usr/bin/env python3
"""
ST-18 — THE WEEK ANCHOR acceptance suite (W1's gate).

    python3 scripts/e1_st_18.py                 # every case
    python3 scripts/e1_st_18.py test_week_resolve   # the same suite by name

EVERY CASE CARRIES ITS OWN PREMISE CHECK (the input's weekday is asserted before the
resolve is trusted) and an ADVERSARIAL case that goes RED if the E1WeekInvalid guard is
removed. A test never seen red proves nothing.

THE CONTRACT UNDER TEST (plutus-vision-e1-automatic_DPL1_SPEC.md §5 item 1, blueprint §4.2):
  Mon..Fri  mon = the bar's own Monday
  Sunday    mon = the FOLLOWING Monday (the FX week opens Sunday evening)
  tsL = mon - 14d · tsR = fri + 21d · tsMid = (tsL + tsR)//2   — exact, in ms
  a missing / non-positive / implausible bar_time -> E1WeekInvalid (the loud fail)
"""

from __future__ import annotations

import datetime as dt
import sys

sys.path.insert(0, __import__("os").path.dirname(__import__("os").path.abspath(__file__)))

import e1_week as W  # noqa: E402

RESULTS: list[tuple[str, bool, str]] = []
DAY = W.DAY_MS


def record(name: str, ok: bool, detail: str = "") -> None:
    RESULTS.append((name, ok, detail))
    print(f"  {'PASS' if ok else 'FAIL'}  {name}" + (f"  — {detail}" if detail else ""))


def _ms(d: dt.datetime) -> int:
    return int(d.timestamp() * 1000)


def test_week_resolve() -> None:
    # ── the premises (derived, then asserted, so the test cannot lie about the weekday) ──
    base = dt.datetime(2026, 10, 6, 13, 30, tzinfo=dt.timezone.utc)   # a mid-week moment
    mon = base - dt.timedelta(days=base.weekday())
    mon = mon.replace(hour=0, minute=0, second=0, microsecond=0)
    assert mon.weekday() == 0, "premise: computed mon is a Monday"
    wed = mon + dt.timedelta(days=2)
    sun = mon + dt.timedelta(days=6)
    assert wed.weekday() == 2 and sun.weekday() == 6, "premise: wed/sun weekdays"

    # ── C1 · a Monday resolves to ITS OWN Monday ──────────────────────────────────────
    r = W.resolve(_ms(mon + dt.timedelta(hours=9)))    # a Monday 09:00 bar
    record("ST-18a  Monday -> its own Monday",
           r["mon"] == _ms(mon),
           f"mon={dt.datetime.fromtimestamp(r['mon']/1000, dt.timezone.utc).date()}")

    # ── C2 · a Wednesday resolves to the SAME Monday ──────────────────────────────────
    r = W.resolve(_ms(wed + dt.timedelta(hours=14)))   # a Wednesday 14:00 bar
    record("ST-18b  Wednesday -> the SAME Monday",
           r["mon"] == _ms(mon),
           f"mon={dt.datetime.fromtimestamp(r['mon']/1000, dt.timezone.utc).date()}")

    # ── C3 · a Sunday resolves to the FOLLOWING Monday (the FX week opens) ─────────────
    nxt = mon + dt.timedelta(days=7)
    r = W.resolve(_ms(sun + dt.timedelta(hours=22)))   # a Sunday 22:00 bar
    record("ST-18c  Sunday -> the FOLLOWING Monday",
           r["mon"] == _ms(nxt),
           f"mon={dt.datetime.fromtimestamp(r['mon']/1000, dt.timezone.utc).date()}")

    # ── C4 · the exact window arithmetic (ms, byte-exact) ──────────────────────────────
    r = W.resolve(_ms(wed))
    ok = (r["tsL"] == r["mon"] - 14 * DAY
          and r["fri"] == r["mon"] + 4 * DAY
          and r["tsR"] == r["fri"] + 21 * DAY
          and r["tsMid"] == (r["tsL"] + r["tsR"]) // 2)
    record("ST-18d  tsL=mon-14d · fri=mon+4d · tsR=fri+21d · tsMid=mid (exact ms)", ok,
           f"span={(r['tsR']-r['tsL'])//DAY}d")

    # ── C5 · ADVERSARIAL: a missing bar_time raises (the loud fail) ────────────────────
    # NEGATIVE CONTROL: if the E1WeekInvalid guard is deleted, this goes RED.
    def _raises_week_invalid(*args) -> bool:
        try:
            W.resolve(*args)
        except W.E1WeekInvalid:
            return True          # the SPECIFIC guard fired
        except Exception:
            return False         # the WRONG exception type -> the contract failed
        return False             # no exception at all -> the guard is absent

    record("ST-18e  a None bar_time RAISES E1WeekInvalid", _raises_week_invalid(None),
           "negative control: the guard is load-bearing")

    # ── C6 · ADVERSARIAL: a zero / negative bar_time raises ────────────────────────────
    record("ST-18f  a 0 / negative bar_time RAISES",
           _raises_week_invalid(0) and _raises_week_invalid(-1000), "")

    # ── C7 · ADVERSARIAL: an implausible year raises ───────────────────────────────────
    record("ST-18g  a year-1990 bar RAISES (implausible)",
           _raises_week_invalid(_ms(dt.datetime(1990, 1, 1, tzinfo=dt.timezone.utc))), "")

    # ── C8 · ADVERSARIAL: a bool bar_time raises (isinstance(True,int) is True) ─────────
    # the verboo audit found this: `True` passed the int guard -> a bogus 1970 timestamp.
    record("ST-18h  a bool bar_time RAISES (isinstance(True,int) is True)",
           _raises_week_invalid(True) and _raises_week_invalid(False), "the bool guard is load-bearing")


# the alias the pin's WAVES line names (bun-style selector parity)
def check_e1_week_anchor() -> None:
    test_week_resolve()


def main(argv: list[str]) -> int:
    want = argv[0] if argv else None
    if want and want not in ("test_week_resolve", "test_e1_week_anchor", "ST-18"):
        print(f"  no such test: {want}", file=sys.stderr)
        return 2
    test_week_resolve()
    fails = [n for n, ok, _ in RESULTS if not ok]
    print(f"\nRESULT pass={len(RESULTS)-len(fails)} fail={len(fails)}")
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
