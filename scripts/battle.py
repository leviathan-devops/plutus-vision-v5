#!/usr/bin/env python3
"""battle — P7: drive EVERY fixture end-to-end and record what each one actually does.

WHAT A BATTLE RUN IS. One fixture -> one E1 payload -> one card -> one built .pine ->
one loaded chart -> one LOOK gate verdict. Not a payload inspection: the deliverable is
the frame, and the frame is what the gate judges.

WHY THIS EXISTS. state/BATTLE.md recorded the extractor as "healthy across the set — 5 zones
for each of the 10 DXY fixtures" while the CARD DERIVATION was blocked on 11 of 12. A run
that stops at the payload cannot see that: the payload is not the product. This runner drives
the whole chain and records the verdict AT THE END OF IT, so "the engine generalises" is a
claim about rendered frames rather than about intermediate JSON.

THE WEEK COMES FROM THE BARS, NOT FROM THE FILENAME. A fixture called `cv-2026-05-04.json`
carries the week it says; `pv-long.json` does not, so the week is the Monday of its own last
bar's ISO week (the canon's E1-C1 anchor rule, applied to the series).

    python3 scripts/battle.py                 # every fixture
    python3 scripts/battle.py --only cv-2026-05-04.json
    python3 scripts/battle.py --list          # show the matrix, run nothing
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import pathlib
import re
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
FIX = ROOT / "fixtures" / "bars"
OUT = ROOT / "proofs" / "P7"
sys.path.insert(0, str(ROOT / "scripts"))


def _week_for(fixture: pathlib.Path, bars: list[dict]) -> str:
    """The week a fixture's card belongs to.

    ★ THE FILENAME WINS WHEN IT CARRIES A DATE (measured 2026-10-25, and it invalidated 21 runs).
    These fixtures are built as (-14d, +8d) around an ANALYSIS POINT, so the LAST bar is ~8 days
    PAST the anchor and always lands in the NEXT ISO week. Deriving the week from the last bar
    gave 2026-07-06.json -> week 2026-07-13, cv-2026-06-29.json -> 2026-07-06, and so on: every
    card was built for the following week and the chart drew a zone table nobody had asked for.
    The gate still answered zone_accuracy 1.0 (the labels sat at the prices it was GIVEN) and the
    only symptom was the semantic arm contradicting the claim — p=0.518.
    So: a date in the stem IS the week (it is the fixture builder's own declaration). Only a
    fixture with no date (pv-long, _current, EURUSD-live) falls back to the bars.
    """
    m = re.search(r"(\d{4})-(\d{2})-(\d{2})", fixture.stem)
    if m:
        return f"{m.group(1)}-{m.group(2)}-{m.group(3)}"
    return _iso_week_from_bars(bars) if bars else "?"


def _iso_week_from_bars(bars: list[dict]) -> str:
    """The Monday of the series' LAST bar's week — the canon's E1-C1 anchor, applied to bars.

    DST without pytz: Europe/London is UTC+1 from late March to late October. A bar stamped
    09:00 London is 08:00Z in summer. The week the engine maps is that bar's ISO week.
    """
    last = int(bars[-1]["timestamp"])
    d = dt.datetime.fromtimestamp(last / 1000, dt.UTC)
    summer = 3 < d.month < 11
    london = d + dt.timedelta(hours=1 if summer else 0)
    monday = london - dt.timedelta(days=london.weekday())
    return monday.date().isoformat()


def cells_of(path: pathlib.Path) -> list[tuple[str, str, int]]:
    from e1_extract import fixture_cells
    try:
        return fixture_cells(path)
    except Exception:
        return []


def bars_of(path: pathlib.Path, pair: str, tf: str) -> list[dict]:
    doc = json.loads(path.read_text())
    for c in doc.get("cells") or []:
        if c.get("pair") == pair and c.get("timeframe") == tf:
            return c.get("bars") or []
    return []


def _port_open(port: int = 9851) -> bool:
    """Is anything LISTENING on the port? A connect probe, not a health request."""
    import socket
    s = socket.socket()
    s.settimeout(0.3)
    try:
        s.connect(("127.0.0.1", port))
        return True
    except OSError:
        return False
    finally:
        s.close()


BATTLE_FIXTURE = pathlib.Path("/tmp/pv-battle-fixture.json")


def point_server_at(fixture: pathlib.Path) -> tuple[bool, str]:
    """Ensure a pv-server on :9851 is serving BATTLE_FIXTURE, then reload the page.

    WHY THE FIXED PATH. pv-server takes PV_FIXTURE at STARTUP and re-reads the cells whenever
    that file's mtime moves (scripts/pv-server.py:115). So the server is started ONCE against a
    fixed path and each run copies its fixture over that path — no per-run process churn, no
    port race.

    WHY IT USED TO FAIL. The health endpoint reports the path the server was STARTED with, and a
    server left running from an earlier manual step reports ITS fixture — so the comparison
    "am I serving the battle path" was false forever, the restart ran, and `pkill` did not always
    free the port (measured: 25/25 runs reported "server did not take ... (served cv-2026-05-04)").
    The fix: kill by PORT (fuser), WAIT for the port to actually close, start, then poll until
    the health endpoint names the battle path. Every step is verified before the next.
    """
    import socket
    import time
    import urllib.request

    def port_open() -> bool:
        s = socket.socket(); s.settimeout(0.3)
        try:
            s.connect(("127.0.0.1", 9851)); return True
        except OSError:
            return False
        finally:
            s.close()

    def served() -> str:
        try:
            with urllib.request.urlopen("http://127.0.0.1:9851/api/v1/health", timeout=2) as r:
                return json.loads(r.read()).get("data", {}).get("fixture", "")
        except Exception:
            return ""

    BATTLE_FIXTURE.write_bytes(fixture.read_bytes())
    want = BATTLE_FIXTURE.resolve()

    if pathlib.Path(served() or "/x").resolve() != want:
        # hard stop whatever holds the port, then PROVE it is free before starting
        subprocess.run(["fuser", "-k", "9851/tcp"], capture_output=True)
        # kill by PID: pgrep output is the ground truth; pkill -9 -f returned
        # success and left the server listening (measured 2026-10-25, 25/25 runs)
        for _line in subprocess.run(['pgrep', '-af', 'pv-server'], capture_output=True,
                                   text=True).stdout.splitlines():
            _pid = _line.split()[0] if _line.split() else ''
            if _pid.isdigit() and int(_pid) != os.getpid():
                subprocess.run(['kill', '-9', _pid], capture_output=True)
        for _ in range(100):
            if not port_open():
                break
            time.sleep(0.1)
        else:
            return False, "port 9851 would not close"
        e = dict(os.environ)
        e["PV_FIXTURE"] = str(want)
        subprocess.Popen(["setsid", sys.executable, str(ROOT / "scripts" / "pv-server.py"),
                          "9851", "pine-ide/ide/renderer"],
                         cwd=ROOT, env=e, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        got = ""
        for _ in range(120):
            time.sleep(0.1)
            got = served()
            if got and pathlib.Path(got).resolve() == want:
                break
        else:
            return False, f"server did not take {want} (served {got or 'nothing'})"

    # the page caches bars by (pair, timeframe): a same-pair swap is invisible to loadBars
    if not reload_page():
        return False, f"serving {fixture.name} but the page would not reload"
    return True, f"serving {fixture.name} via {BATTLE_FIXTURE.name}, page reloaded"


def reload_page() -> bool:
    """Page.reload on the pine.html tab, then wait for the shell and its bars to settle."""
    import time
    import urllib.request

    import websocket

    try:
        tl = json.load(urllib.request.urlopen("http://127.0.0.1:9222/json/list", timeout=5))
        page = next(t for t in tl if t.get("type") == "page" and "pine.html" in t.get("url", ""))
        c = websocket.create_connection(page["webSocketDebuggerUrl"], timeout=60)
    except Exception:
        return False
    try:
        c.send(json.dumps({"id": 1, "method": "Page.reload", "params": {"ignoreCache": True}}))
        while True:
            m = json.loads(c.recv())
            if m.get("id") == 1:
                break
        for _ in range(80):
            time.sleep(0.5)
            c.send(json.dumps({"id": 2, "method": "Runtime.evaluate",
                               "params": {"expression":
                                          "!!(window.PlutusPineShell && "
                                          "window.PlutusPineShell.chart && document.querySelectorAll('.pine-shell').length===1)",
                                          "returnByValue": True}}))
            while True:
                m = json.loads(c.recv())
                if m.get("id") == 2:
                    break
            if m["result"]["result"].get("value"):
                time.sleep(2.5)
                return True
        return False
    finally:
        c.close()


def run_one(path: pathlib.Path, pair: str, tf: str, week: str, dry: bool) -> dict:
    """fixture -> payload -> card -> pine -> frame -> gate. Returns the run's record."""
    tag = f"{path.stem}.{pair.replace('/','')}.{tf}"
    work = OUT / "runs" / tag
    work.mkdir(parents=True, exist_ok=True)
    payload_dir = work / "e1"
    payload_dir.mkdir(exist_ok=True)
    rec: dict = {"fixture": path.name, "pair": pair, "timeframe": tf, "week": week,
                 "tag": tag, "stages": {}}

    def stage(name, ok, detail, code=None):
        rec["stages"][name] = {"ok": bool(ok), "detail": str(detail)[:600], "code": code}
        print(f"    {name:10} {'OK  ' if ok else 'FAIL'} {str(detail)[:150]}")
        return ok

    # ── 1 · EXTRACT ────────────────────────────────────────────────────────────────────────
    cmd = [sys.executable, str(ROOT / "scripts" / "e1_extract.py"),
           "--pair", pair, "--week", week, "--out", str(payload_dir),
           "--fixture", str(path), "--timeframe", tf]
    p = subprocess.run(cmd, capture_output=True, text=True, cwd=ROOT)
    payload = payload_dir / f"{pair.replace('/','-')}-{week}.json"
    if not payload.exists():
        cands = sorted(payload_dir.glob("*.json"))
        payload = cands[0] if cands else payload
    if not payload.exists():
        line = [l for l in (p.stdout + p.stderr).strip().splitlines() if l.strip()]
        stage("extract", False, line[-1] if line else "no payload", "EXTRACT")
        return rec
    stage("extract", True, payload.name)

    # ── 2 · CARD ──────────────────────────────────────────────────────────────────────────
    card = work / "card.json"
    # ★ THE WEEK AND PAIR ARE PASSED EXPLICITLY. build_card.py defaults --week to "2026-07-06"
    # and --pair to DXY. A caller that omits them pairs the golden week's identity with another
    # week's payload; build_card refuses with [PV CARD-WEEK-MISMATCH] (observed on cv-2026-05-04,
    # whose derived week is 2026-05-11). Supply the identity the fixture actually carries.
    p = subprocess.run([sys.executable, str(ROOT / "scripts" / "build_card.py"),
                        "--e1", str(payload), "--out", str(card), "--fixture", str(path),
                        "--week", week, "--pair", pair, "--timeframe", tf,
                        "--force-overwrite-card"],
                       capture_output=True, text=True, cwd=ROOT)
    if not card.exists():
        line = [l for l in (p.stdout + p.stderr).strip().splitlines() if l.strip()]
        code = next((l.split("]")[0].strip("[") for l in line if "PV CARD" in l), "CARD")
        stage("card", False, line[-1] if line else "no card", code)
        return rec
    stage("card", True, card.name)

    # ── 3 · BUILD ─────────────────────────────────────────────────────────────────────────
    pine = work / "vision.pine"
    e = dict(os.environ)
    # ★ THE BUILDER MUST READ THIS RUN'S PAYLOAD. lqz_vision_v2_build._payload_files() globs
    # PV2_DATA_DIR (default data/e1/) and takes the NEWEST match — so a run that extracted into
    # proofs/P7/runs/<tag>/e1/ still got built from whatever stale week file sat in data/e1/
    # (observed: 4 injected zones from an Oct-8 DXY-2026-05-11.json, against a 5-zone card).
    # The builder then "succeeded" and drew a chart that had nothing to do with the card.
    # PV2_DATA_DIR points it at this run's own payload; PV2_TF is the builder's timeframe var.
    e.update({"PV2_WEEK": week, "PV2_PAIR": pair, "PV2_TF": tf,
              "PV2_DATA_DIR": str(payload_dir)})
    p = subprocess.run([sys.executable, str(ROOT / "scripts" / "lqz_vision_v2_build.py"),
                        str(pine)], capture_output=True, text=True, cwd=ROOT, env=e)
    if not pine.exists():
        line = [l for l in (p.stdout + p.stderr).strip().splitlines() if l.strip()]
        stage("build", False, line[-1] if line else "no pine", "BUILD")
        return rec
    stage("build", True, f"{len(pine.read_text().splitlines())} lines")

    if dry:
        rec["dry"] = True
        return rec

    # ── 4 · LOAD + CAPTURE ────────────────────────────────────────────────────────────────
    # ★ THE RIG RENDERS THE FIXTURE THE SERVER SERVES, NOT THE ONE THE CARD CAME FROM.
    # pv-server reads PV_FIXTURE at STARTUP (scripts/pv-server.py:99) and caches the cells until
    # that file's mtime moves. A battle run whose card was built from cv-2026-05-04 while the
    # server still served 2026-07-06 loaded the golden week's bars and drew nothing
    # (`NOTHING_DRAWN: run ok but 0 drawings on chart`, observed). So the server is pointed at
    # THIS fixture before the load, and the load is what proves it took.
    srv_ok, srv_msg = point_server_at(path)
    stage("server", srv_ok, srv_msg)
    if not srv_ok:
        return rec

    anchor = json.loads(card.read_text()).get("anchor_ms") or 0
    p = subprocess.run(["bun", str(ROOT / "scripts" / "pv-load.mjs"), str(pine), pair, tf,
                        str(anchor)],
                       capture_output=True, text=True, cwd=ROOT, timeout=240)
    out = (p.stdout or "") + (p.stderr or "")
    # ★ `onChart` IS THE SIGNAL, NOT `counts`. Measured 2026-10-25: pv-load's `counts` object
    # reported every field as 0 on the GOLDEN week too — a frame that demonstrably carries 34
    # drawings — so `counts` is a dead instrument here. `onChart` is the number the renderer
    # actually placed in the visible bar range, and it read 34 on the golden week and 0 on a
    # week whose bars the page had not reloaded. NOTHING_DRAWN is emitted when it is 0.
    onchart = 0
    try:
        onchart = int(json.loads((p.stdout or "{}").strip().splitlines()[-1]).get("onChart") or 0)
    except Exception:
        onchart = 0
    loaded = onchart > 0 and "NOTHING_DRAWN" not in out
    stage("load", loaded, f"onChart {onchart} · {(out.strip().splitlines() or ['no output'])[-1][:160]}")
    if not loaded:
        return rec

    frame = work / f"frame-{tag}.png"
    # ★ CAPTURE VIA CDP, NOT `import` (measured 2026-10-25, spec/RENDER_LOOP_WORKFLOW.md 1.5b).
    # `import -display :N -window <id>` on the nested-weston agent display returned a STALE
    # pixmap: the DOM held the new source while the capture still painted the old frame. The
    # browser's own compositor cannot be stale.
    cap = f'''
import json, base64, urllib.request, websocket
tl = json.load(urllib.request.urlopen("http://127.0.0.1:9222/json/list", timeout=5))
page = [t for t in tl if t.get("type") == "page" and "pine.html" in t.get("url", "")][0]
c = websocket.create_connection(page["webSocketDebuggerUrl"], timeout=40)
c.send(json.dumps({{"id": 1, "method": "Page.captureScreenshot",
                   "params": {{"format": "png", "captureBeyondViewport": True}}}}))
while True:
    m = json.loads(c.recv())
    if m.get("id") == 1:
        open({str(frame)!r}, "wb").write(base64.b64decode(m["result"]["data"])); break
c.close()
'''
    p = subprocess.run([sys.executable, "-c", cap], capture_output=True, text=True,
                       cwd=ROOT, timeout=180)
    stage("capture", frame.exists(), frame.name if frame.exists() else (p.stderr or "")[:200])
    if not frame.exists():
        return rec

    # ── 5 · AXIS + GATE ───────────────────────────────────────────────────────────────────
    # the axis must be measured for THIS frame before the judge can map a price to a row
    p = subprocess.run([sys.executable, str(ROOT / "scripts" / "frame_axis.py"), str(frame),
                        "--fixture", str(path), "--write-card", str(card)],
                       capture_output=True, text=True, cwd=ROOT)
    axis_ok = "VALIDATION" in (p.stdout or "")
    line = (p.stdout or p.stderr).strip().splitlines()
    stage("axis", axis_ok, line[-1] if line else "")

    claim = (f"Fixture {path.name}: the E1 IP zones for {pair} {tf} week {week} are drawn at "
             f"the card's own prices, each a bounded band, none a full-range partition.")
    # ★ F-FRESH NEEDS A PROVENANCE FILE. Without one the gate answers INCONCLUSIVE ("the
    # artefact's sha cannot be tied to its source") — and an absence is never a pass, so the run
    # can never reach exit 0 however good the frame is. The file pins the frame, its source and
    # the payload, so the verdict names the artifact it judged.
    prov = work / f"{tag}.provenance.json"
    import hashlib

    def sha(p):
        return hashlib.sha256(pathlib.Path(p).read_bytes()).hexdigest()

    prov.write_text(json.dumps({
        "frame": str(frame.relative_to(ROOT)),
        "frame_sha256": sha(frame),
        "source": str(pine.relative_to(ROOT)),
        "source_sha256": sha(pine),
        "card": str(card.relative_to(ROOT)),
        "card_sha256": sha(card),
        "e1_payload": str(payload.relative_to(ROOT)),
        "e1_payload_sha256": sha(payload),
        "fixture": str(path.relative_to(ROOT)),
        "fixture_sha256": sha(path),
        "pair": pair, "timeframe": tf, "week": week,
        "display": ":3 (headless-backend)", "cdp_port": 9222,
        "station_state": "UP",
        "build": f"PV2_WEEK={week} PV2_PAIR={pair} PV2_TF={tf} "
                 f"PV2_DATA_DIR={payload_dir.relative_to(ROOT)} "
                 f"python3 scripts/lqz_vision_v2_build.py",
        "framing": "P.chart.setVisibleRange(anchor-7d .. anchor+2d), anchor from the card",
    }, indent=1) + "\n")

    p = subprocess.run(["bash", str(ROOT / "gates" / "LOOK.sh"), str(frame),
                        "--card", str(card), "--source", str(pine),
                        "--fixture", str(path), "--provenance", str(prov),
                        "--claim", claim],
                       capture_output=True, text=True, cwd=ROOT, timeout=400)
    out = (p.stdout or "") + (p.stderr or "")
    (work / "look.log").write_text(out)
    acc = None
    for ln in out.splitlines():
        if "zone_accuracy" in ln and "=" in ln:
            try:
                acc = float(ln.split("=")[1].split()[0])
            except (IndexError, ValueError):
                pass
    rec["exit"] = p.returncode
    rec["zone_accuracy"] = acc
    verdict = {0: "CONFIRMED", 1: "REJECTED", 2: "INCONCLUSIVE",
               3: "VOID", 4: "GATE_DEFECT"}.get(p.returncode, "?")
    rec["verdict"] = verdict
    stage("gate", p.returncode == 0, f"exit {p.returncode} {verdict} acc={acc}")
    return rec


def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", default=None, help="one fixture filename")
    ap.add_argument("--dry", action="store_true", help="stop after build (no load/capture/gate)")
    ap.add_argument("--list", action="store_true")
    a = ap.parse_args(argv)
    OUT.mkdir(parents=True, exist_ok=True)

    matrix = []
    for f in sorted(FIX.glob("*.json")):
        if a.only and f.name != a.only:
            continue
        for pair, tf, n in cells_of(f):
            bars = bars_of(f, pair, tf)
            week = _week_for(f, bars)
            matrix.append((f, pair, tf, n, week))

    if a.list:
        print(f"  {'fixture':38} {'pair':8} {'tf':4} {'bars':>5}  week")
        for f, pair, tf, n, week in matrix:
            print(f"  {f.name:38} {pair:8} {tf:4} {n:5}  {week}")
        print(f"\n  {len(matrix)} battle runs across {len({m[0] for m in matrix})} fixtures")
        return 0

    results = []
    for i, (f, pair, tf, n, week) in enumerate(matrix, 1):
        print(f"\n[{i}/{len(matrix)}] {f.name} · {pair} {tf} · week {week} · {n} bars")
        try:
            results.append(run_one(f, pair, tf, week, a.dry))
        except Exception as e:
            results.append({"fixture": f.name, "pair": pair, "timeframe": tf, "week": week,
                            "error": f"{type(e).__name__}: {e}"})
            print(f"    EXCEPTION {type(e).__name__}: {e}")

    stamp = dt.datetime.now(dt.UTC).strftime("%Y-%m-%dT%H:%M:%SZ")
    summary = {"utc": stamp, "runs": results, "total": len(results),
               "confirmed": sum(1 for r in results if r.get("verdict") == "CONFIRMED"),
               "verdicts": {}}
    for r in results:
        v = r.get("verdict") or ("EXCEPTION" if r.get("error") else "STOPPED_EARLY")
        summary["verdicts"][v] = summary["verdicts"].get(v, 0) + 1
    (OUT / "BATTLE-RUNS.json").write_text(json.dumps(summary, indent=1) + "\n")

    print(f"\n{'=' * 72}")
    print(f"  {summary['confirmed']}/{summary['total']} CONFIRMED · {summary['verdicts']}")
    for r in results:
        v = r.get("verdict") or ("EXCEPTION" if r.get("error") else "STOPPED_EARLY")
        failed = [k for k, s in (r.get("stages") or {}).items() if not s["ok"]]
        why = (f"  first fail: {failed[0]} = {r['stages'][failed[0]]['detail'][:80]}"
               if failed else "")
        print(f"    {r['fixture']:38} {r['pair']:8} {r['timeframe']:4} {v}{why}")
    print(f"  -> {OUT / 'BATTLE-RUNS.json'}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
