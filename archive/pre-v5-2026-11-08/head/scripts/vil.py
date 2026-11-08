#!/usr/bin/env python3
"""vil.py — the PLUTUS_VISION ship gate (replaces the code-audit gate).
Implements Bibles/VISION_IN_THE_LOOP_ENGINEERING_BIBLE.md Part 2 / 7.1 / 7.4:

  STEP 1 render with a written expectation      (pv-load.mjs on the running pine-ide)
  STEP 2 extract byte-exact                     (X11 window grab of the IDE → PNG)
         Grade 1: bytes > 0 · magic 89504e47 · sha256 · pixel std (unjudgeable gate)
         Grade 2: structure = the run's own drawing counts (boxes/lines/labels on chart)
  STEP 3 LOOK with an INDEPENDENT reader        (local Qwen VL via rail :9754/vil/look —
                                                 not the agent that built the indicator)
  STEP 4 verdict PASS | FAIL | INCONCLUSIVE     (no reader / unjudgeable / bad bytes →
                                                 INCONCLUSIVE, NEVER an approval)
  §7.1  zero-hint battery: clean control · planted defect · unjudgeable · dead channel
  §7.4  results artifact → <tree>/vil/vil-results.json

  python3 vil.py                 # merged indicator × 15m 30m 1H 4H  + the battery
  python3 vil.py --tfs 1H        # subset
Exit 0 only when every case verdicts as EXPECTED (clean PASS, battery cases as designed).
The agent's own multimodal read (the engineer's gate, bible §7.3) is recorded separately
in TESTING_LOG against the same sha256s — this script never claims it.
"""
import argparse, base64, hashlib, json, os, pathlib, subprocess, sys, time, urllib.request

W = pathlib.Path(__file__).resolve().parent.parent
SHOTS = W / "vil" / "shots"
RAIL = "http://127.0.0.1:9754/vil/look"
TASK = ("vision verdict: does this chart render the Plutus vision indicator (zone boxes / "
        "shape line / labels)? Reply PASS, FAIL or INCONCLUSIVE with one sentence.")
EXPECT = ("EUR/USD candles across the window; SMC: BOS/CHoCH text labels on swing-structure "
          "lines + Strong/Weak High/Low; order-block zones (blue bull / red bear); VOIDS: "
          "thin grey stacked slices; POOLS: buyside/sellside liquidity lines + zones; "
          "SWEEPS: wick-sweep boxes. Nothing cropped, nothing blank.")


def sh(*a, timeout=180):
    return subprocess.run(a, capture_output=True, text=True, timeout=timeout)


def grade1(png: pathlib.Path):
    """Byte-exact checks + the unjudgeable-frame gate (pixel std)."""
    if not png.exists():
        return {"ok": False, "why": "TRANSPORT: no file"}
    data = png.read_bytes()
    rec = {"path": str(png), "bytes": len(data), "magic": data[:4].hex(),
           "sha256": hashlib.sha256(data).hexdigest()}
    if data[:4] != b"\x89PNG":
        return {**rec, "ok": False, "why": "TRANSPORT: magic != PNG"}
    try:
        from PIL import Image, ImageStat
        im = Image.open(png); im.load()
        std = sum(ImageStat.Stat(im.convert("L")).stddev)
    except Exception as e:
        return {**rec, "ok": False, "why": f"TRANSPORT: decode failed ({type(e).__name__})"}
    rec["pixelStd"] = round(std, 2)
    if std < 4:
        return {**rec, "ok": False, "why": "MEASUREMENT: unjudgeable frame (near-uniform)"}
    return {**rec, "ok": True}


def look(png: pathlib.Path):
    body = json.dumps({"image_base64": base64.b64encode(png.read_bytes()).decode(),
                       "task": TASK}).encode()
    try:
        r = json.load(urllib.request.urlopen(urllib.request.Request(
            RAIL, data=body, headers={"Content-Type": "application/json"}), timeout=150))
        d = r.get("data", r)
        return {"verdict": d.get("verdict"), "answers": d.get("answers"),
                "note": d.get("note"), "reader": d.get("model"), "ms": d.get("ms")}
    except Exception as e:
        return {"verdict": None, "error": f"READER_DOWN: {e}"}


def render(pine: pathlib.Path, pair, tf, out: pathlib.Path):
    r = sh("bun", str(W / "scripts/pv-load.mjs"), str(pine), pair, tf, timeout=150)
    run = None
    for line in r.stdout.splitlines():
        if line.startswith("{"):
            run = json.loads(line)
    time.sleep(1.5)
    s = sh("bash", str(W / "scripts/pv-ide.sh"), "--shot", str(out))
    return run, (r.stderr.strip() or None), s.returncode


def judge(case, g1, structure, reader):
    """PASS only when bytes are good, the frame is judgeable, a reader SAW it, and the
    reader's semantic answer agrees with the structural cross-check."""
    if not g1["ok"]:
        return "INCONCLUSIVE", g1["why"]
    if not reader.get("verdict"):
        return "INCONCLUSIVE", reader.get("error") or "no reader verdict"
    drawn = (structure or {}).get("onChart") or 0
    if reader["verdict"] == "PASS" and drawn > 0:
        return "PASS", "reader PASS + structure drew %d" % drawn
    if reader["verdict"] == "PASS" and drawn == 0:
        return "FAIL", "reader PASS but structure drew 0 (reader over-fire)"
    return reader["verdict"], reader.get("note")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--tfs", default="15m,30m,1H,4H")
    ap.add_argument("--pair", default="EUR/USD")
    a = ap.parse_args()
    SHOTS.mkdir(parents=True, exist_ok=True)
    pine = W / "plutus-vision-v0.pine"
    cases = []

    # clean runs: the merged indicator on every timeframe
    for tf in a.tfs.split(","):
        out = SHOTS / f"merged-{a.pair.replace('/', '')}-{tf}.png"
        run, err, _ = render(pine, a.pair, tf, out)
        g1 = grade1(out)
        rd = look(out) if g1["ok"] else {"verdict": None, "error": "not read (grade-1 failed)"}
        v, why = judge("clean", g1, run, rd)
        cases.append({"id": f"clean-{tf}", "design": "PASS", "expectation": EXPECT,
                      "verdict": v, "why": why, "extraction": g1,
                      "structure": run and {k: run.get(k) for k in ("title", "counts", "bars", "onChart")},
                      "loadError": err, "reader": rd, "channel": "x11-window-grab + run-JSON"})

    # §7.1 planted defect: compiles, draws NOTHING — the reader must not approve it
    planted = W / "vil" / "planted-empty.pine"
    planted.write_text("//@version=6\nindicator('planted defect', overlay = true)\nplot(na)\n")
    out = SHOTS / "battery-planted-empty.png"
    run, err, _ = render(planted, a.pair, "1H", out)
    g1 = grade1(out); rd = look(out) if g1["ok"] else {"verdict": None}
    v, why = judge("planted", g1, run, rd)
    cases.append({"id": "battery-planted-defect", "design": "FAIL", "verdict": v, "why": why,
                  "extraction": g1, "structure": run and {"onChart": run.get("onChart")}, "reader": rd})

    # §7.1 unjudgeable frame: all black
    from PIL import Image
    black = SHOTS / "battery-black.png"; Image.new("RGB", (816, 640)).save(black)
    g1 = grade1(black); v, why = judge("black", g1, None, {})
    cases.append({"id": "battery-unjudgeable-black", "design": "INCONCLUSIVE", "verdict": v,
                  "why": why, "extraction": g1})

    # §7.1 dead channel: a truncated PNG
    trunc = SHOTS / "battery-truncated.png"
    trunc.write_bytes((SHOTS / f"merged-{a.pair.replace('/', '')}-1H.png").read_bytes()[:3000]
                      if (SHOTS / f"merged-{a.pair.replace('/', '')}-1H.png").exists() else b"\x89PNG")
    g1 = grade1(trunc); v, why = judge("trunc", g1, None, {})
    cases.append({"id": "battery-dead-channel", "design": "INCONCLUSIVE", "verdict": v,
                  "why": why, "extraction": g1})

    # leave the IDE showing the indicator again
    render(pine, a.pair, "1H", SHOTS / "final-1H.png")

    ok = all(c["verdict"] == c["design"] for c in cases)
    res = {"runId": time.strftime("VIL-%Y%m%dT%H%M%S"), "tree": str(W),
           "indicatorSha256": hashlib.sha256(pine.read_bytes()).hexdigest(),
           "bible": "Bibles/VISION_IN_THE_LOOP_ENGINEERING_BIBLE.md",
           "scenarios": cases,
           "overallVerdict": "PASS" if ok else "FAIL"}
    (W / "vil" / "vil-results.json").write_text(json.dumps(res, indent=1))
    for c in cases:
        flag = "ok " if c["verdict"] == c["design"] else "XX "
        print(f"{flag}{c['id']:28} design={c['design']:12} verdict={c['verdict']:12} "
              f"sha={c.get('extraction', {}).get('sha256', '-')[:12]}  {str(c['why'])[:90]}")
    print(f"VIL GATE: {res['overallVerdict']}  -> {W / 'vil' / 'vil-results.json'}")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
