#!/usr/bin/env python3
"""
wire_e2.py — run the E2 engine over an E1 zone map and emit the Pine payload.

THE PATH THE PIN REQUIRES:
    data/e1/<pair>-<week>.json   (zones, from the fetch layer)
        -> scripts/e2_engine.py  (classify -> chain -> day decomposition)
        -> the build injects day x/y/shape/conf + the alternative ghost

Every value here is COMPUTED by the engine, never invented here. If the engine refuses
— no zones, all-MINIMAL, no signature matched — this script writes an EMPTY payload and
the refusal string, and the render states it on the chart. That is the anti-theatre
contract: a chain with no anchoring zone is never drawn.

    python3 scripts/wire_e2.py [--data DIR] [--week YYYY-MM-DD] [--dry-run]
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import pathlib
import sys

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent
sys.path.insert(0, str(HERE))

from e2_engine import (  # noqa: E402
    Zone, forward_map, FabricationRefused)


def compute_momentum(monday: dt.date, pair: str = "DXY") -> float:
    """THE BARS' OWN MOMENTUM — the price action INTO the anchor week.

    DEFECT FOUND 2026-10-06: `forward_map(zones, 1.0, monday)` passed a HARDCODED 1.0, so
    the engine's direction never came from the market. The operator's method — "play the
    price action forward and map the chain back" — exposed it: the engine predicted a flat
    oscillation while the actual week rallied to the resistance. The momentum is now the
    normalised recent slope of the CHART's own bars (the same fixture pv-server serves, the
    SAME-BARS law): the net move of the last N bars divided by the mean true range, clamped.
    A missing/insufficient series returns 0.0 (a neutral, never an invented trend).

    AUDIT 2026-10-06 (ocr): (1) the caller now passes the E1 file's OWN pair — the DXY
    default silently anchored a non-DXY week to the wrong market; (2) `mon_ms` is
    timezone-AWARE UTC, because a naive `timestamp()` reads midnight as LOCAL time and
    shifts the window cutoff by the host's UTC offset (the bars are UTC millis)."""
    cands = [ROOT / "fixtures" / "bars" / f"{monday.isoformat()}.json",
             ROOT / "fixtures" / "bars" / "dxy-full-to-jul21.json",
             ROOT / "fixtures" / "bars" / "2026-07-06.json"]
    mon_ms = int(dt.datetime(monday.year, monday.month, monday.day,
                             tzinfo=dt.timezone.utc).timestamp() * 1000)
    for c in cands:
        if not c.exists():
            continue
        try:
            doc = json.loads(c.read_text())
        except Exception as exc:
            print(f"  [momentum] skipped {c.name}: {type(exc).__name__}: {str(exc)[:60]}")
            continue
        cell = next((x for x in (doc.get("cells") or []) if str(x.get("pair")).upper() == pair.upper()
                     and str(x.get("timeframe")) == "1H"), None)
        if not cell:
            continue
        bars = [b for b in (cell.get("bars") or []) if int(b.get("timestamp", 0)) < mon_ms]
        if len(bars) < 20:
            continue
        recent = bars[-20:]
        net = float(recent[-1]["close"]) - float(recent[0]["open"])
        tr = [(float(b["high"]) - float(b["low"])) for b in recent]
        atr = sum(tr) / len(tr) if tr else 0.0
        if atr <= 0:
            continue
        m = net / (atr * 2.0)          # a 2-ATR move over the window = +-1.0
        return max(-1.0, min(1.0, m))
    return 0.0

def load_zones(data_dir: pathlib.Path) -> tuple[list[Zone], str]:
    """Read the E1 zone map. Returns (zones, refusal)."""
    files = sorted(data_dir.glob("*.json"))
    if not files:
        return [], "E2_NO_DATA: no E1 data file — run scripts/e1_fetch.py first"
    doc = json.loads(files[0].read_text())
    raw = doc.get("zones", [])
    if not raw:
        return [], ("E2_NO_ZONES: the E1 data file carries no zone array — the fetch layer "
                    "recorded every source as [NO DATA] for this week")
    zones = []
    for z in raw:
        conf = int(z.get("confluence", 0))
        if conf < 4:                      # MINIMAL — the canon discards a score of 0-3
            continue
        zones.append(Zone(
            id=z.get("name", "Z"),
            top=float(z.get("top", 0)),
            bottom=float(z.get("bottom", 0)),
            confluence=conf,
            zfp=int(z.get("zfp", 0)),
            timeframe=z.get("timeframe", "1H"),
            bom=z.get("bom", ""),
            reactions=int(z.get("reactions", 0)),
        ))
    if not zones:
        return [], ("E2_ALL_MINIMAL: every zone scored below 4; the canon discards a "
                    "confluence of 0-3, so there is nothing to anchor a shape to")
    return zones, ""


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", default=str(ROOT / "data" / "e1"))
    ap.add_argument("--week", default="", help="the target Monday, ISO (default: from the filename)")
    ap.add_argument("--out", default=str(ROOT / "data" / "e2"))
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    data_dir = pathlib.Path(args.data)
    files = sorted(data_dir.glob("*.json"))
    week = args.week
    if not week and files:
        for part in files[0].stem.split("-"):
            if len(part) == 4 and part.isdigit():
                week = "-".join(files[0].stem.split("-")[-3:])
                break
    if not week:
        print("  no target week resolved; pass --week YYYY-MM-DD")
        return 2
    try:
        monday = dt.date.fromisoformat(week)
    except ValueError:
        # AUDIT 2026-10-06: a malformed --week raised a traceback and wrote NO payload. The
        # refusal contract requires a NAMED refusal payload, not a crash.
        bad = {"week": week, "monday": None, "pair": "DXY", "zones_in": 0,
               "refusal": f"E2_BAD_WEEK: {week!r} is not YYYY-MM-DD", "days": [], "ghost": []}
        (pathlib.Path(args.out)).mkdir(parents=True, exist_ok=True)
        (pathlib.Path(args.out) / "BAD_WEEK-e2.json").write_text(json.dumps(bad, indent=1))
        print(f"  E2_BAD_WEEK: {week!r}")
        return 1
    # AUDIT 2026-10-06: only files[0] was ever used (the first SORTED entry). Select the
    # file whose name carries the resolved week so a directory with several weeks does not
    # silently anchor to the wrong one.
    matched = [f for f in files if week in f.stem] if files else []
    if matched:
        files = matched

    try:
        zones, refusal = load_zones(data_dir)
    except Exception as exc:
        # AUDIT 2026-10-06: a corrupt/mistyped E1 file raised out of the FabricationRefused
        # handler and wrote NO payload. The contract is a NAMED refusal, never a crash.
        bad = {"week": week, "monday": monday.isoformat(), "pair": "DXY", "zones_in": 0,
               "refusal": f"E2_BAD_DATA: {type(exc).__name__}: {str(exc)[:80]}",
               "days": [], "ghost": []}
        pathlib.Path(args.out).mkdir(parents=True, exist_ok=True)
        (pathlib.Path(args.out) / "BAD_DATA-e2.json").write_text(json.dumps(bad, indent=1))
        print(f"  E2_BAD_DATA: {str(exc)[:70]}")
        return 1
    # THE PAIR (audit 2026-10-06): the momentum must read the SAME market as the zones.
    # The DXY default silently anchored a non-DXY week to the wrong market's bars.
    PAIR = "DXY"
    if files:
        try:
            PAIR = str(json.loads(files[0].read_text()).get("pair") or "DXY").upper()
        except Exception:
            pass
    out = {"week": week, "monday": monday.isoformat(), "pair": PAIR, "zones_in": len(zones),
           "refusal": refusal, "days": [], "ghost": []}

    if not refusal:
        try:
            mom = compute_momentum(monday, pair=PAIR)
            chain = forward_map(zones, mom, monday)
            out["momentum"] = round(mom, 4)
            if chain.refusal:
                out["refusal"] = chain.refusal
            else:
                # The x of each day: the Monday plus the session offset. The +1 day is the
                # canon's §6.10 Trading Speed Rule, already applied by the engine.
                for i, d in enumerate(chain.days):
                    dx = dt.date.fromisoformat(d["date"])
                    out["days"].append({
                        "x": int(dt.datetime(dx.year, dx.month, dx.day,
                                            tzinfo=dt.timezone.utc).timestamp() * 1000),
                        "shape": d["shape"],
                        "conf": d["confidence"],
                        "zone": d["key_zone"],
                        "day": d["day"],
                    })
                for l in chain.alternative:
                    out["ghost"].append({"zone": l.trigger_zone_id, "to": l.to_shape,
                                         "zfp": l.trigger_zone_zfp, "conf": l.confidence})
                out["chain"] = [f"{l.from_shape}->{l.to_shape}@{l.trigger_zone_id}"
                                for l in chain.chain]
                out["phase"] = chain.consolidation_phase
        except FabricationRefused as e:
            out["refusal"] = str(e)

    if args.dry_run:
        print(json.dumps(out, indent=1))
        return 0

    outdir = pathlib.Path(args.out)
    outdir.mkdir(parents=True, exist_ok=True)
    p = outdir / f"{files[0].stem if files else 'EURUSD'}-e2.json"
    p.write_text(json.dumps(out, indent=1))
    try:
        shown = p.relative_to(ROOT)
    except ValueError:
        shown = p
    print(f"  wrote {shown}")
    print(f"  zones_in={out['zones_in']}  days={len(out['days'])}  "
          f"ghost={len(out['ghost'])}  refusal={out['refusal'] or 'none'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())