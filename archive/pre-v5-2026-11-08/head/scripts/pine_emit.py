#!/usr/bin/env python3
"""pine_emit.py — THE COMPUTED PINE PAYLOAD (W5).

THE DEFECT THIS KILLS (FAILURE_LOG F-56): the indicator's `e1_injected_*` arrays were HAND-WRITTEN
LITERALS (`e1_injected_zfp.push(27)` ×5 at `bar_index == 0`). A "render" from them could only ever
show the one week somebody typed in — every week rendered the same five numbers. The operator's
litmus test ("the render matches the v8 across five weeks") was structurally impossible.

THE FIX: this emitter reads the engine's computed payload (`data/e1/DXY-<week>.json`) and writes
the Pine block from it. Two different weeks MUST produce different blocks (test_payload_computed
asserts it by sha256).

USAGE:
  python3 scripts/pine_emit.py --pine <path.pine> --data data/e1/DXY-2026-07-13.json [--out <path>]
  python3 scripts/pine_emit.py --pine <path.pine> --print   # emit the block to stdout only
"""
from __future__ import annotations
import argparse
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent

# The E1 payload block's boundaries in the Pine file.
START_RX = re.compile(r"^e1_injected_anchor_ms\s*=", re.M)
# the block ends where E2's own array declarations begin (e2_injected_* are declared above, so the
# first `if bar_index == 0` line marks the shared init block; we end the E1 portion at the first
# `e2_injected_` push inside it).
END_RX = re.compile(r"^\s*e2_injected_x\.push\(", re.M)


def _f(v):
    """A guarded float for the emitted literals."""
    try:
        return round(float(v), 5)
    except (TypeError, ValueError):
        return 0.0


def _fmt(z: dict) -> str:
    """One table row: '99.23-99.16 Heavy 4%ZFP T1' — the v8's own table cell shape."""
    return (f'{_f(z.get("top"))}-{_f(z.get("bottom"))} '
            f'{z.get("degree_v8") or z.get("pressure_degree") or "MODERATE"} '
            f'{int(z.get("zfp") or 0)}%ZFP {z.get("zTir", "T2")}')


def _pine_str(v) -> str:
    """Escape a value for a double-quoted Pine string literal. A quote, backslash, newline, or
    carriage-return in engine data would otherwise break the emitted source (the code-audit's high
    finding)."""
    return str(v).replace("\\", "\\\\").replace('"', '\\"').replace("\n", " ").replace("\r", " ")


def iso_week_tag(week: str) -> str:
    import datetime
    d = datetime.date.fromisoformat(week)
    y, w, _ = d.isocalendar()
    return f"{y}-W{w:02d}"


def anchor_ms(week: str) -> int:
    """The chart anchor: the MONDAY 00:00 UTC of the week, in ms. Floored to the week's Monday so
    a non-Monday payload date cannot silently mis-anchor (the audit's finding)."""
    import datetime
    d = datetime.date.fromisoformat(week)
    d = d - datetime.timedelta(days=d.weekday())        # floor to Monday
    dt = datetime.datetime(d.year, d.month, d.day, tzinfo=datetime.timezone.utc)
    return int(dt.timestamp() * 1000)


class PineEmitNoWeek(Exception):
    """A named refusal — the payload carries no usable week (the audit's medium finding)."""


def emit_block(payload: dict) -> str:
    """The Pine E1 payload block, from the COMPUTED zones. Order TOP->DOWN (the prompt's sort)."""
    if not payload.get("zones"):
        raise PineEmitNoWeek("PINE_EMIT_NO_ZONES: the payload has no zones — refusing to wipe the "
                             "existing block (the audit's high: an empty emit is destructive)")
    try:
        zs = sorted(payload.get("zones", []), key=lambda z: -float(z["top"]))
        import math as _m
        for z in zs:                       # validate EVERY field the push loops read
            for _k in ("zCat", "name", "degree_v8"):
                if z.get(_k) is not None and not isinstance(z.get(_k), str):
                    raise ValueError(f"zone field {_k} is not a string: {z.get(_k)!r}")
            _tp, _bt = float(z["top"]), float(z["bottom"])
            if not (_m.isfinite(_tp) and _m.isfinite(_bt)):
                raise ValueError(f"non-finite zone geometry top={_tp} bottom={_bt}")
            int(z["confluence"]); int(z["zfp"])
    except (KeyError, TypeError, ValueError, AttributeError) as e:
        raise PineEmitNoWeek(f"PINE_EMIT_BAD_ZONES: a zone field is missing/non-numeric ({e})")
    wk = str(payload.get("week") or payload.get("chart_week") or payload.get("target_week") or "")[:10]
    try:
        import datetime as _dt
        _dt.date.fromisoformat(str(wk)[:10])
    except (ValueError, TypeError):
        raise PineEmitNoWeek(f"PINE_EMIT_NO_WEEK: payload week {wk!r} is not an ISO date")
    L = []
    L.append(f"e1_injected_anchor_ms = {anchor_ms(wk)}")
    L.append(f'e1_injected_week_tag = "{_pine_str(iso_week_tag(wk))}"')
    L.append('e2_injected_refusal = ""')
    L.append("")
    L.append("if bar_index == 0")
    for z in zs:
        L.append(f"    e1_injected_top.push({float(z['top'])})")
    for z in zs:
        L.append(f"    e1_injected_bottom.push({float(z['bottom'])})")
    for z in zs:
        L.append(f"    e1_injected_confluence.push({int(z['confluence'])})")
    for z in zs:
        L.append(f"    e1_injected_zfp.push({int(z['zfp'])})")
    for z in zs:
        L.append(f'    e1_injected_cat.push("{_pine_str(z.get("zCat", "MID"))}")')
    for z in zs:
        L.append(f'    e1_injected_id.push("{_pine_str(z.get("name", "Zone"))}")')
    for z in zs:
        L.append(f'    e1_injected_degree.push("{_pine_str(z.get("degree_v8", z.get("pressure_degree", "MODERATE")))}")')
    # ── THE LSZ — the Liquidity Sweep Zones (v8: dxy_xTp/xBt/xPri, 6 per pair) ───────────
    lsz = payload.get("lsz") or []
    spot = _f(payload.get("spot"))
    lsz = sorted(lsz, key=lambda x: abs((sum(x["range"]) / 2.0) - (spot or 0)))[:6]
    for x in lsz:
        L.append(f'    e1_injected_lsz_bottom.push({_f(x["range"][0])})')
    for x in lsz:
        L.append(f'    e1_injected_lsz_top.push({_f(x["range"][1])})')
    for x in lsz:
        L.append(f'    e1_injected_lsz_pri.push("{_pine_str(x.get("type", "STANDARD").upper()[:6].replace("-SIDE",""))}")')
    # ── THE TABLE — the header + the zone rows + the E2 chain ──────────────────────────
    L.append(f'    e1_injected_tbl_pair.push("{_pine_str(payload.get("pair", "DXY"))}")')
    L.append(f'    e1_injected_tbl_week.push("{_pine_str(payload.get("target_week") or payload.get("chart_week") or "")}")')
    for z in zs:
        L.append(f'    e1_injected_tbl_row.push("{_pine_str(_fmt(z))}")')
    return "\n".join(L)


def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser(description="emit the computed E1 Pine payload (W5)")
    ap.add_argument("--pine", default=str(ROOT / "pine-ide" / "ide" / "renderer" / "plutus-vision-v2.pine"))
    ap.add_argument("--data", default="")
    ap.add_argument("--out", default="", help="write the whole pine here (default: in place)")
    ap.add_argument("--print", action="store_true", help="emit the block to stdout only")
    a = ap.parse_args(argv)

    if not a.data:
        # default: the current chart week's payload
        cands = sorted((ROOT / "data" / "e1").glob("DXY-*.json"))
        if not cands:
            print("PINE_EMIT_NO_DATA: no data/e1/DXY-*.json — run e1_extract.py first", file=sys.stderr)
            return 2
        a.data = str(cands[-1])
    try:
        payload = json.loads(pathlib.Path(a.data).read_text())
    except (FileNotFoundError, OSError, UnicodeDecodeError) as e:
        print(f"PINE_EMIT_NO_DATA: cannot read {a.data}: {e}", file=sys.stderr); return 2
    except json.JSONDecodeError as e:
        print(f"PINE_EMIT_BAD_JSON: {a.data}: {e}", file=sys.stderr); return 2
    if not isinstance(payload, dict):
        print(f"PINE_EMIT_BAD_SHAPE: {a.data} is not a JSON object", file=sys.stderr); return 2
    try:
        block = emit_block(payload)
    except PineEmitNoWeek as e:
        print(str(e), file=sys.stderr)
        return 2
    except (KeyError, TypeError, ValueError) as e:
        print(f"PINE_EMIT_BAD_ZONES: {e}", file=sys.stderr); return 2

    if a.print:
        print(block)
        return 0

    try:
        src = pathlib.Path(a.pine).read_text()
    except (FileNotFoundError, OSError, UnicodeDecodeError, ValueError) as e:
        print(f"PINE_EMIT_NO_PINE: cannot read {a.pine}: {e}", file=sys.stderr); return 2
    m1 = START_RX.search(src)
    m2 = END_RX.search(src, m1.end()) if m1 else None      # scope END to AFTER START (the audit's high)
    if not m1 or not m2:
        print("PINE_EMIT_NO_BLOCK: could not locate the E1 payload block "
              "(e1_injected_anchor_ms .. the first e2_injected_x.push)", file=sys.stderr)
        return 3
    # m2.start() sits at the leading whitespace of the first e2 push — do NOT add an indent,
    # or the `if bar_index == 0` block's first E2 line gets doubled and Pine (whitespace-
    # sensitive) reads it as a nested block. (Caught by the W5 emit: line 1322 had 8 spaces.)
    new = src[:m1.start()] + block + "\n" + src[m2.start():]
    dest = pathlib.Path(a.out) if a.out else pathlib.Path(a.pine)
    # ATOMIC: write a sibling temp then os.replace (the audit's high: an in-place write that
    # crashes mid-way corrupts the ONLY pine copy).
    import os as _os
    tmp = dest.with_suffix(dest.suffix + ".tmp")
    try:
        tmp.write_text(new)
        _os.replace(tmp, dest)
    except OSError as e:
        tmp.unlink(missing_ok=True)
        print(f"PINE_EMIT_WRITE_FAILED: {dest}: {e}", file=sys.stderr)
        return 2
    nz = len(payload.get("zones", []))
    print(f"emitted {nz} zones into {dest} (week {payload.get('week') or payload.get('chart_week')})")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
