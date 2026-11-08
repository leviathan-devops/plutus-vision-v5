#!/usr/bin/env python3
"""
lqz_vision_v2_build.py — DELIVERABLE: plutus-vision-v2.pine.

THE INVARIANT: v1 IS NOT TOUCHED. The pin says "ADD ONLY — the V1 baseline is
untouchable. `ST-9` / `ST-9b` are the mechanism; intention is not a control."

So this is NOT the v1 build with extra modules bolted on. It is a SEPARATE artifact
that CONTAINS v1 verbatim and then adds the two engines:

    plutus-vision-v1.pine   (sealed, sha 0d20e8314ce992fc — READ ONLY, never rewritten)
      + plutus-vision-lqz/e1-render.pine     the institutional pressure map
      + plutus-vision-lqz/e2-render.pine     the predicted price path

v1's three protected layer counts (LuxAlgo SMC 226 · SMC order blocks 6 · LQZ
bands 4) must read identically in v2 — that is ST-9, and ST-9b diffs the two
v1 modules against the sealed checkpoint byte-for-byte.

THE E1/E2 PAYLOADS: the engines are PYTHON. This script injects their OUTPUT as
Pine literals at build time, so the shipped .pine is self-contained and Pine never
computes a confluence or a shape. An empty payload renders nothing and says why —
it never invents a zone or a path.
"""

from __future__ import annotations

import datetime as dt
import json
import os
import pathlib
import re
import sys

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent
sys.path.insert(0, str(HERE))

# THE E2 FINE PATH. The engine's `fine_path` expands the five day anchors into a
# CONTINUOUS, JAGGED price path (fix, 2026-10-05: five points drew a triangle). The
# build imports it — it never re-implements the geometry, so the shape templates live
# in exactly ONE place (`scripts/e2_engine.py`).
from e2_engine import fine_path  # noqa: E402

V1 = ROOT / "plutus-vision-v1.pine"
E1 = ROOT / "plutus-vision-lqz" / "e1-render.pine"
E2 = ROOT / "plutus-vision-lqz" / "e2-render.pine"
OUT = ROOT / "plutus-vision-v2.pine"
DATA = pathlib.Path(os.environ.get("PV2_DATA_DIR", ROOT / "data" / "e1"))
# THE WEEK SELECTOR — measured defect 2026-10-05 (audit): DATA.glob picked sorted()[0], so
# `make e1 WEEK=<other>` could inject/deploy a STALE week whose file sorted first. PV2_WEEK
# (set by the Makefile from WEEK=) selects the matching file; unset -> the newest.
WEEK = os.environ.get("PV2_WEEK", "")
PAIR = os.environ.get("PV2_PAIR", "")


def _q(s: str) -> str:
    """Escape a value for a Pine double-quoted string literal — a `"`/`\\`/newline in a zone
    name or an exception message would otherwise break the shipped artifact (audit 2026-10-05)."""
    return (str(s).replace("\\", "\\\\").replace('"', '\\"')
            .replace("\n", " ").replace("\r", " "))


def _f(v) -> float:
    """Coalesce an absent/None numeric to 0 — `array.push(None)` is a Pine compile error, and a
    PRESENT-but-null JSON value slips past a `.get(k, 0)` default (audit 2026-10-05)."""
    return 0 if v is None else v

def _payload_files() -> list:
    # NEWEST-FIRST so files[0] is the most recent week; filtered by PAIR then WEEK. A set WEEK
    # that matches NOTHING FAILS CLOSED — the earlier `or fs` silently fell back (audit 2026-10-05).
    # A PAYLOAD file carries a YYYY-MM-DD week token in its stem — exclude anything else (the
    # harvest's `sources.json` broke the pick: `sorted()[0]` chose it, broke the E2 anchor match,
    # and the build FAILED SILENTLY to a stale served copy. audit 2026-10-05.)
    fs = [f for f in sorted(DATA.glob("*.json"), reverse=True)
          if re.search(r"\d{4}-\d{2}-\d{2}", f.stem)]
    if PAIR:
        hit = [f for f in fs if f.stem.startswith(PAIR.replace("/", ""))]
        if not hit:
            sys.exit(f"HARD STOP — PV2_PAIR={PAIR} matched no payload in {DATA}")
        fs = hit
    if WEEK:
        hit = [f for f in fs if WEEK in f.stem]
        if not hit:
            sys.exit(f"HARD STOP — PV2_WEEK={WEEK} matched no payload in {DATA}")
        fs = hit
    return fs


# E2D is DEFINED here, above its only consumer (`_e2_files`) — audit 2026-10-05: it was
# assigned AFTER `_e2_files`, a latent NameError on any import-time / early call.
E2D = pathlib.Path(os.environ.get("PV2_E2_DIR", ROOT / "data" / "e2"))

def _e2_files() -> list:
    """The E2 payload files — ANCHORED to the E1 payload's OWN week, so E1 and E2 can never come
    from different weeks. The E1 file's date token (e.g. '2026-07-06') is the key; an E2 set with
    no match FAILS CLOSED. (audit 2026-10-05: independent newest-first picks silently mixed weeks —
    a naive rebuild produced E1=July + E2=October.)"""
    e1 = _payload_files()
    if not e1:
        sys.exit(f"HARD STOP — no E1 payload in {DATA}")
    date = e1[0].stem.split("-", 1)[-1]      # 'DXY-2026-07-06' -> '2026-07-06'
    pair = e1[0].stem.split("-", 1)[0]       # 'DXY-2026-07-06' -> 'DXY'
    fs = sorted(E2D.glob("*-e2.json"), reverse=True)
    # THE PAIR + WEEK ANCHOR (audit 2026-10-05 successor): the E2 must be the SAME pair AND week
    # as the E1 — the reverse-sort alone picked EURUSD's E2 for a DXY chart, so the day zones
    # (EURUSD names) never matched the DXY E1 zones -> E2_NO_ANCHORS.
    hit = [f for f in fs if date in f.stem and pair in f.stem]
    if not hit:
        hit = [f for f in fs if date in f.stem]
    if not hit:
        sys.exit(f"HARD STOP — no E2 payload matching the E1 week {date!r} in {E2D}")
    return hit

# the v1 seal. The build REFUSES to run if v1 has drifted.
V1_SEALED_SHA = "0d20e8314ce992fc23e27f1b97fed76b981c84e78c647bbe6b3d6e1206517bd1"
V1_FLOOR = {"smc": 226, "ob": 6, "lqz": 4}


def _lines_matching(text: str, pattern: str) -> int:
    rx = re.compile(pattern)
    return sum(1 for ln in text.splitlines() if rx.search(ln))


def verify_v1_untouched() -> str:
    import hashlib
    raw = V1.read_bytes()
    sha = hashlib.sha256(raw).hexdigest()
    if sha != V1_SEALED_SHA:
        raise SystemExit(
            f"HARD STOP H1 — v1 HAS MOVED.\n  sealed: {V1_SEALED_SHA}\n  on disk: {sha}\n"
            f"  The pin's rule is ADD ONLY. v1 is never rewritten by this build; if it "
            f"drifted, another process changed it, and this build will not paper over that.")
    txt = raw.decode()
    counts = {
        "smc": _lines_matching(txt, r"pv_alerts|smc_"),
        "ob": _lines_matching(txt, r"smc_storeOrdeBlock|smc_drawOrderBlocks"),
        "lqz": _lines_matching(txt, r"lqzColorLq|f_lqzRender"),
    }
    bad = {k: (v, V1_FLOOR[k]) for k, v in counts.items() if v != V1_FLOOR[k]}
    if bad:
        raise SystemExit(f"HARD STOP H1 — v1 layer counts moved: {bad}")
    return sha


def _pin(name: str) -> str:
    """Read the injected literal for `name`, or an empty array when the engine
    produced nothing. EMPTY IS A VALID ANSWER — the engine refusing is not a build
    failure, it is a result, and the render shows the refusal on the chart."""
    return f"{name} = array.from({DATA.joinpath('injected.txt').read_text().strip()})" \
        if (DATA / "injected.txt").exists() else f"{name} = array.from(_empty_payload)"


def build_payload() -> tuple[str, str]:
    """Assemble the E1/E2 payload as TYPED ARRAYS plus a refusal string.

    AN EMPTY OR MISSING INPUT PRODUCES EMPTY ARRAYS AND A REFUSAL — never a
    placeholder. A placeholder zone on a trading chart is a fabrication with a
    coordinate.

    TYPED ARRAYS, NOT `array.from([...])`. Measured 2026-10-03: an injected
    `array.from([])` literal FAILS the PineTS transpiler with "Syntax error at input
    '['" — an empty list carries no element type to infer from. v1 already compiles
    using `array.new<T>()` + push, so the payload uses exactly that shape."""
    zones: list[dict] = []
    refusal = ""
    _files = _payload_files()
    if not _files:
        refusal = "E2_NO_ZONES: no E1 payload file on disk for this week — the fetch layer recorded every source as [NO DATA]"
    for f in _files:
        try:
            d = json.loads(f.read_text())
        except Exception:
            continue
        zones.extend(d.get("zones", []))
        if not d.get("zones") and not refusal:
            refusal = ("E2_NO_ZONES: the E1 data file carries no zone array — the "
                       "fetch layer recorded every source as [NO DATA] for this week")
        break

    decls: list[str] = []
    pushes: list[str] = []

    def add(name: str, ty: str, vals) -> None:
        # THE ARRAY IS INITIALIZED ONCE (fix 2026-10-06). The previous form was
        # `var array<T> name = array.new<T>()` + `name.push(v)` AT THE GLOBAL SCOPE — a bare
        # global statement runs EVERY BAR, so the array grew by its length on every bar. The E1
        # hid it (`e1MaxZones` caps the loop at 6), but the E2 had no cap: the day-tag loop drew
        # the same label once per accumulated point — the operator's "wall" was 800 stacked
        # "SS 55%" labels at one x (measured: 846 drawings = 6 boxes + 800 text + 38 trendlines +
        # 2 polylines). The pushes now live under a single `if bar_index == 0` block (see the
        # assembly below), so the array is filled EXACTLY ONCE and holds the static payload it
        # is. `array.from([...])` was tried first and PineTS REJECTED it ("Cannot call
        # array.from with a tuple argument"), so `var array.new<T>()` + the guarded pushes is the
        # form that both compiles and does not accumulate.
        decls.append(f"var array<{ty}> {name} = array.new<{ty}>()")
        for v in vals:
            pushes.append(f"{name}.push({v})")

    add("e1_injected_top", "float", [_f(z.get("top")) for z in zones])
    add("e1_injected_bottom", "float", [_f(z.get("bottom")) for z in zones])
    add("e1_injected_confluence", "int", [int(_f(z.get("confluence"))) for z in zones])
    add("e1_injected_zfp", "int", [int(_f(z.get("zfp"))) for z in zones])
    # zCat — the v8 renderer's positional vocabulary (RES|MID|SUP). VALIDATED, never defaulted:
    # a missing zCat silently became "SUP" (a teal wrong-colour) — refuse instead (audit 2026-10-05).
    for z in zones:
        if z.get("zCat") not in ("RES", "MID", "SUP"):
            sys.exit(f"HARD STOP — zone {z.get('name','?')} has zCat={z.get('zCat')!r}; "
                     f"the renderer requires RES|MID|SUP")
    add("e1_injected_cat", "string", [f'"{_q(z.get("zCat"))}"' for z in zones])
    add("e1_injected_id", "string", [f'"{_q(z.get("name", "Z"))}"' for z in zones])
    # THE DEGREE — the synthesized role degree (degree_v8: HEAVY|MODERATE-HEAVY|MODERATE|...). The
    # render consumes it DIRECTLY (the canon's degree vocabulary), instead of recomputing it from
    # the raw confluence (which resolved every role to LIGHT).
    add("e1_injected_degree", "string", [f'"{_q(z.get("degree_v8", "LIGHT"))}"' for z in zones])

    # ── THE E2 PAYLOAD: whatever scripts/wire_e2.py computed, verbatim. ────────────
    # Every value here is the ENGINE's output. This build never classifies a shape,
    # never picks a transition and never invents a confidence — it only carries them.
    # An absent or refused engine run leaves the arrays EMPTY and sets the refusal,
    # so the chart states the refusal rather than drawing a fabricated path.
    e2doc = {"days": [], "ghost": [], "refusal": ""}
    e2files = _e2_files()
    if e2files:
        try:
            e2doc = json.loads(e2files[0].read_text())
        except Exception as exc:                                  # a bad file is NOT a chain
            e2doc = {"days": [], "ghost": [],
                      "refusal": f"E2_BAD_PAYLOAD: {str(exc)[:80]}"}

    # The day anchors: x from the engine's +1-day timestamps, y from the zone the day
    # is anchored to. A day with NO anchoring zone contributes no point — Rule 1 at the
    # boundary, so an unanchored forecast can never reach the chart.
    zmap = {z.get("name"): z for z in zones}
    days, ghosts = [], []
    for d in e2doc.get("days", []):
        z = zmap.get(d.get("zone"))
        if z is None:                       # unanchored -> not drawn
            continue
        if d.get("x") is None or d.get("conf") is None:   # a malformed engine entry -> not drawn
            continue
        days.append((d.get("x"), _f((z.get("top") + z.get("bottom")) / 2), d.get("shape"), d.get("conf")))
    for g in e2doc.get("ghost", []):
        z = zmap.get(g.get("zone"))
        if z is not None:
            ghosts.append((z.get("top"), z.get("top")))

    # THE FINE PATH (2026-07-05). `days` are the five DAY anchors; the engine expands them into
    # a CONTINUOUS, JAGGED intraday path (each day = its shape's geometric leg, chained
    # end-to-start). The operator's own ask: "the E2 path = a CONTINUOUS forecast resembling
    # price action, not a shape template" — the 5-vertex day chain was a triangle (R→WL→SS).
    # NOW ENABLED: the earlier over-draw (+1721 lines, labels suppressed) was the
    # `xloc=bar_time`+loop form; the render now draws in bar_index. shapes/confs carry the day
    # shape ONLY at the day boundaries (Rule 1: an intraday point is never tagged).
    _fp = fine_path([(d[0], d[1], d[2], d[3]) for d in days])
    add("e2_injected_x", "float", [_f(v) for v in _fp[0]])
    add("e2_injected_y", "float", [_f(v) for v in _fp[1]])
    add("e2_injected_shape", "string", [f'"{_q(s or "")}"' for s in _fp[2]])
    add("e2_injected_conf", "int", [int(_f(c)) for c in _fp[3]])
    add("e2_injected_ghost_x", "float", [_f(g[0]) for g in ghosts])
    add("e2_injected_ghost_y", "float", [_f(g[1]) for g in ghosts])

    # ── THE 2×17 INFO TABLE (trident_v8.pine:390-427) — the E1+E2 summary block. ───────────
    # The reference renders a 2-col × 17-row table: the header, the E2 Chain/Alt/Days rows, the
    # ZONES header + the 5 zone rows, and the TRADES header + rows (Engine 3 — out of scope).
    # Every value is emitted from the computed payloads, never hand-typed.
    _pair = "DXY"
    _week = ""
    if _files:
        try:
            _d0 = json.loads(_files[0].read_text())
            _pair = _d0.get("pair", "DXY")
            _week = _d0.get("target_week") or _d0.get("chart_week") or ""
        except Exception:
            pass
    add("e1_injected_tbl_pair", "string", [f'"{_q(_pair)}"'])
    add("e1_injected_tbl_week", "string", [f'"{_q(_week)}"'])
    for z in zones:
        _row = (f'{_f(z.get("top"))}-{_f(z.get("bottom"))} '
                f'{z.get("degree_v8", "")} {int(_f(z.get("zfp")))}%ZFP {z.get("zTir", "T2")}')
        add("e1_injected_tbl_row", "string", [f'"{_q(_row)}"'])
    _ch = ""
    for _l in (e2doc.get("chain") or []):
        _ch = str(_l).split("@")[0]                     # "WL->SS@Zone" -> "WL->SS"
    add("e1_injected_chain", "string", [f'"{_q(_ch)}"'])
    _days_s = " ".join(f'{str(d.get("day", ""))[:2]}:{d.get("shape", "")}'
                       for d in (e2doc.get("days") or []))
    add("e1_injected_days", "string", [f'"{_q(_days_s)}"'])

    # ── THE LSZ (trident_v8.pine:195-197, :368-377) — the Liquidity Sweep Zones, GREEN filled
    # boxes, NO LABELS, same width as the IP zones. The v8 renders 6 per pair; take the 6
    # NEAREST the spot. The range is the canon's `[swing, swing + 0.05]` — but 0.05 is a DXY
    # constant, so on a pair the width is normalised to a fraction of price (the same
    # pair-relative law the boxes use). Emitted from the payload's computed `lsz`. ──────────
    _lsz = []
    try:
        _d0 = json.loads(_files[0].read_text()) if _files else {}
        _spot = float(_d0.get("spot") or 0) or None
        _raw = _d0.get("lsz") or []
        # sort by the SWING (the range's lower edge) proximity to spot — the v8's LSZ sit at
        # the prior swing lows/highs, thin bands near the price
        _raw = sorted(_raw, key=lambda x: abs(float(x["range"][0]) - (_spot or 0)))[:6]
        for x in _raw:
            _lo = float(x["range"][0])
            # THE V8 WIDTH IS 0.05 DXY (~5 pips); on a pair that is 0.05% of price. A thin band:
            _pw = abs(_lo) * 0.0005
            _lsz.append((_lo, _lo + _pw, str(x.get("type", "")).upper()[:6].replace("-SIDE", "")))
    except Exception:
        _lsz = []
    add("e1_injected_lsz_top", "float", [_f(t) for (_b, t, _p) in _lsz])
    add("e1_injected_lsz_bottom", "float", [_f(b) for (b, _t, _p) in _lsz])
    add("e1_injected_lsz_pri", "string", [f'"{_q(_p)}"' for (_b, _t, _p) in _lsz])

    # ── THE OPTION STRIKES (trident_v8.pine:199-200, :378-388) — the v8's AMBER lines +
    # "$X.XB Option Strike Target" labels. Emitted from the E1 payload's OPTION_STRIKE levels
    # (Pillar 3, the options harvest). When the harvest is DOWN there are none, so the layer
    # renders EMPTY — never fabricated (the loud-fail law). ───────────────────────────────────
    _opts = []
    try:
        _d0 = json.loads(_files[0].read_text()) if _files else {}
        for _l in (_d0.get("levels") or []):
            _lab = str(_l.get("label", ""))
            if _lab.startswith("P3") or "OPTION" in _lab.upper() or "STRIKE" in _lab.upper():
                _opts.append((float(_l["price"]), str(_l.get("notional_bn", "") or "")))
    except Exception:
        _opts = []
    add("e1_injected_opt_pr", "float", [_f(_p) for (_p, _v) in _opts])
    add("e1_injected_opt_vol", "string", [f'"{_q(_v)}"' for (_p, _v) in _opts])

    # ── THE TRADES (trident_v8.pine:201-208, :411-427) — the 2×17 table rows 10-16: a SHORT and
    # a LONG setup (Entry range · SL | TP · Days > DayTP | R:R). The pin scopes Engine 3 OUT, so
    # these are a LIGHT display derivation from the zone map (the v8's own trade geometry: entry
    # at a zone, SL beyond the opposite extreme, TP at the far zone). They fill the table so it
    # matches the v8's 2×17 shape; they are NOT the full Engine-3 construction. ────────────────
    _tr: list[str] = []
    try:
        _zs = sorted(zones, key=lambda z: -float(z.get("top", 0)))
        if len(_zs) >= 5:
            _ceil, _up, _eq, _mid, _flr = _zs[:5]
            def _pf(v):
                # 5 dp, trailing zeros trimmed — the pair's price precision (the v8's #.####)
                return f"{float(v):.5f}".rstrip("0").rstrip(".")
            def _rr(entry, sl, tp):
                risk = abs(entry - sl); rew = abs(tp - entry)
                return round(rew / risk, 1) if risk > 0 else 0.0
            # SHORT: entry at the Upper resistance band, SL above the Ceiling, TP at the Floor
            _se = (_up["top"] + _up["bottom"]) / 2; _ssl = _ceil["top"] + (_ceil["top"] - _ceil["bottom"]) * 0.3
            _stp = (_flr["top"] + _flr["bottom"]) / 2
            _tr.append(f'S T2 Entry {_pf(_se)}')
            _tr.append(f'SL {_pf(_ssl)} | TP {_pf(_stp)}')
            _tr.append(f'Wed > Thu-Fri | R:R {_rr(_se, _ssl, _stp)}')
            # LONG: entry at the Mid-Range support band, SL below the Floor, TP at the Ceiling
            _le = (_mid["top"] + _mid["bottom"]) / 2; _lsl = _flr["bottom"] - (_flr["top"] - _flr["bottom"]) * 0.3
            _ltp = (_ceil["top"] + _ceil["bottom"]) / 2
            _tr.append(f'L T1 Entry {_pf(_le)}')
            _tr.append(f'SL {_pf(_lsl)} | TP {_pf(_ltp)}')
            _tr.append(f'Wed > Thu-Fri | R:R {_rr(_le, _lsl, _ltp)}')
    except Exception:
        _tr = []
    add("e1_injected_trade_row", "string", [f'"{_q(r)}"' for r in _tr])

    # THE ANCHOR is computed HERE, in Python, because the PineTS transpiler has
    # neither `str.split` nor `tonumber` (measured 2026-10-03: "tonumber is not
    # defined", and v1 has zero uses of either). The engine owns the calendar; Pine
    # only draws. The Monday is derived from the target week's ISO date, never
    # hard-coded — a pinned timestamp makes the indicator right for one week only.
    anchor_ms, week_tag = _monday_anchor()
    decls.append(f"e1_injected_anchor_ms = {anchor_ms}")
    decls.append(f'e1_injected_week_tag = "{_q(week_tag)}"')

    # THE REFUSAL STRING comes from the ENGINE, verbatim. This build never invents a reason.
    # When the engine produced a chain the refusal is empty; when it refused, its own words are
    # carried onto the chart, because "the engine refused to guess" and "there is no structure"
    # are different claims and the operator must be able to tell them apart.
    engine_refusal = e2doc.get("refusal") or ""
    if not days and not engine_refusal:
        # THE E1 REFUSAL TAKES PRIORITY: when the E1 payload carried no zones, `refusal` holds
        # E2_NO_ZONES (the specific cause); only fall back to the generic E2_NO_ANCHORS when the
        # E1 file WAS non-empty but no day anchored to a zone. (audit finding 2026-10-05)
        engine_refusal = refusal or ("E2_NO_ANCHORS: the engine produced days but none carried an "
                                     "anchoring zone, so Rule 1 forbids drawing them")
    decls.append(f'e2_injected_refusal = "{_q(engine_refusal)}"')
    # THE PUSHES RUN EXACTLY ONCE. Every `.push()` is emitted under ONE `if bar_index == 0`
    # block, so the `var` arrays are filled on the FIRST bar only and hold the static payload on
    # every bar after (the render reads them on `barstate.islast`). Without the guard the pushes
    # ran every bar and the arrays grew unbounded — the operator's 800-label wall.
    if pushes:
        guard = "if bar_index == 0\n" + "\n".join("    " + p for p in pushes)
        return "\n".join(decls), guard
    return "\n".join(decls), ""


def _monday_anchor() -> tuple[int, str]:
    """The target Monday in milliseconds, and its ISO week tag.

    Read from data/e1/<pair>-<week>.json when present (PHASE 1 wrote it); otherwise
    derived from the newest file name on disk. NEVER a literal — the whole point of
    the change is that a pinned date is the Temporal Boundary violation."""
    import datetime as _dt
    tag = ""
    files = _payload_files()
    if files:
        m = re.search(r"(\d{4}-\d{2}-\d{2})", files[0].stem)
        if m:
            tag = m.group(1)
    if not tag:
        return 0, "no anchor"
    d = _dt.date.fromisoformat(tag)
    mon = d - _dt.timedelta(days=d.weekday())          # the Monday of that week
    iso = mon.isocalendar()
    ms = int(_dt.datetime(mon.year, mon.month, mon.day).timestamp() * 1000)
    return ms, f"{iso[0]}-W{iso[1]:02d}"

def strip_decl(src: str, names: list[str]) -> str:
    out = []
    for ln in src.split("\n"):
        if any(re.match(rf"^{n}\s*=\s*array\.from\(", ln) for n in names):
            continue
        out.append(ln)
    return "\n".join(out)


E1_NAMES = ["e1_injected_top", "e1_injected_bottom", "e1_injected_confluence",
            "e1_injected_zfp", "e1_injected_id", "e1_injected_cat", "e1_injected_degree"]
E2_NAMES = ["e2_injected_x", "e2_injected_y", "e2_injected_shape", "e2_injected_conf",
            "e2_injected_ghost_x", "e2_injected_ghost_y", "e2_injected_refusal"]


def build() -> str:
    sha = verify_v1_untouched()
    v1 = V1.read_text()
    e1 = strip_decl(E1.read_text(), E1_NAMES)
    e2 = strip_decl(E2.read_text(), E2_NAMES)
    # NOTE (2026-10-05): the label cap. The v1 SMC layer draws ~500+ labels (swing structure +
    # high/low swings), which at cap 500 leaves NO room for the E1 zone tags drawn AFTER it — they
    # are silently dropped (the operator's "there are no labels anywhere on the E1 zones"). Two
    # levers, both applied in the GENERATED v2 only:
    #   1. cap 500 -> 600 (fits the E1 5 with room; far below the ~3000 at which the vela renderer
    #      OVER-DRAWS and suppresses every label — measured 2026-10-05).
    #   2. the SMC's two noisiest label families (swing STRUCTURE + HIGH/LOW swings) are turned
    #      OFF in the v2, freeing the budget for the E1 zone tags. The E1 pressure map is the
    #      product; the SMC structure labels are secondary. (Re-enable by flipping these to true.)
    v1 = v1.replace("max_labels_count = 500", "max_labels_count = 3000")
    v1 = v1.replace("showStructureInput              = input.bool(true",
                    "showStructureInput              = input.bool(false")
    v1 = v1.replace("showHighLowSwingsInput          = input.bool(true",
                    "showHighLowSwingsInput          = input.bool(false")
    v1 = v1.replace("showInternalsInput              = input.bool(true",
                    "showInternalsInput              = input.bool(false")
    v1 = v1.replace("showInternalOrderBlocksInput    = input.bool(true",
                    "showInternalOrderBlocksInput    = input.bool(false")
    v1 = v1.replace("showEqualHighsLowsInput         = input.bool(true",
                    "showEqualHighsLowsInput         = input.bool(false")
    # THE v1 LIQUIDITY WALL. The baseline's LQZ layer draws up to 60 liquidity zones, each a
    # 500-bar-wide ribbon (lqzLeftB=500), stacked into a SOLID WALL that buries the E1 pressure
    # zones (the operator, 2026-10-06: "what the fuck is this"; earlier "everything I can see
    # is rejected"). The E1 map is the product; the v1 liquidity is context that reads as noise
    # at this density. DISABLED ENTIRELY in the v2 (the enable flags derive from lqzSource, so
    # the derivation is overridden): the zones array stays empty and the LQZ render draws
    # nothing. The E1 zones + the E2 path are untouched (the progress is preserved).
    v1 = v1.replace('lqzV1Enabled = lqzSource == "luxalgo" or lqzSource == "both"',
                    'lqzV1Enabled = false   // [v2 2026-10-06] the wall — see the build comment')
    v1 = v1.replace('lqzV2Enabled = lqzSource == "candles" or lqzSource == "both"',
                    'lqzV2Enabled = false   // [v2 2026-10-06] the wall — see the build comment')
    decls, pushes = build_payload()
    return (
        v1.rstrip() + "\n"
        + "\n// ═════════════ E1 — the institutional pressure map (ADDED 2026-10-03) ═════════════\n"
        + "// The payload below is produced by e1_fetch/e2_engine and injected at build time.\n"
        + "// Typed arrays (array.new<T>() + push), NOT array.from([...]) — an empty list\n"
        + "// literal carries no element type and the PineTS transpiler rejects it.\n"
        + f"{decls}\n"
        + (f"\n{pushes}\n" if pushes else "")
        + "\n"
        + e1 + "\n\n"
        + "// ═════════════ E2 — the predicted price path (ADDED 2026-10-03) ═════════════\n"
        + e2 + "\n"
    )


if __name__ == "__main__":
    out = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else OUT
    txt = build()
    out.write_text(txt)
    print(f"wrote {out.name}  {len(txt.splitlines())} lines  (v1 verified untouched)")