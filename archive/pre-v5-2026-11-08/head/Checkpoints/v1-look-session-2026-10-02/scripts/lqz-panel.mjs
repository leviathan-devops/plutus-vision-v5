#!/usr/bin/env bun
/**
 * lqz-panel.mjs — W6: the operator's judgment surface.
 *
 * SPEC step-4: "a 4-panel grid [library reference | D1 luxalgo | D2 plutus |
 * D3 vision] on identical bars is written, opened, and the operator records
 * APPROVED."
 *
 * The grid exists because three separate verdicts are not one comparison: the
 * library's look and each deliverable's look must be visible SIDE BY SIDE, on
 * the same fixture, before the operator can say APPROVED or name the delta.
 *
 * Panels 2-4 are captured LIVE from the Pine IDE page over CDP, clipped to the
 * chart element, after loading each deliverable and running it — never from a
 * cached frame on disk. Only the library reference is a file, and it is captioned
 * as such (it is the operator's own GBPUSD capture, not this fixture).
 *
 * Usage: bun scripts/lqz-panel.mjs [timeframe]   (default 1H)
 * Writes: reports/panel-grid-<tf>.png
 */

import { $ } from "bun";

const TF = Bun.argv[2] || "1H";
const PAIR = "EUR/USD";
const IDE = "http://127.0.0.1:9851";
const OUT = `reports/panel-grid-${TF}.png`;
const TMP = "/tmp/lqz-panel";
await $`mkdir -p ${TMP}`.quiet();

const DELIVERABLES = [
  { key: "D1", file: "lqz-luxalgo.pine", mark: "LQZ LuxAlgo", expect: "LQZ LuxAlgo", label: "D1  lqz-luxalgo\nLuxAlgo SL/POOL/VOID detectors, one consolidated full-width layer" },
  { key: "D2", file: "lqz-plutus.pine", mark: "LQZ Plutus", expect: "LQZ Plutus", label: "D2  lqz-plutus\noperator candle strategy, full-width emitter" },
  { key: "D3", file: "plutus-vision-v1.pine", mark: "Plutus Vision", expect: "Plutus Vision v1", label: "D3  plutus-vision-v1\nSMC + LQZ consolidated" },
];

// ── the reference: the operator's own 'LIQUIDITY LADDERS' capture ────────────
const LIB_DIR = "/home/leviathan/Pictures/WINNING_TRADE_LIBARARY/LIQUIDITY LADDERS";
const libList = await $`ls ${LIB_DIR}`.text();
const libFile = libList.split("\n").filter(Boolean)[0];
if (!libFile) { console.error("PANEL_GRID_FAIL: no library reference frame"); process.exit(1); }

// ── CDP plumbing ────────────────────────────────────────────────────────────
const targets = await (await fetch("http://127.0.0.1:9222/json/list")).json();
const page = targets.find((t) => t.type === "page" && t.url.includes("9851"));
if (!page) { console.error("PANEL_GRID_FAIL: no Pine IDE page on :9222 (is 9851 up?)"); process.exit(1); }

const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let msgId = 0;
const call = (method, params = {}) =>
  new Promise((res, rej) => {
    const i = ++msgId;
    const h = (e) => {
      const d = JSON.parse(e.data);
      if (d.id === i) { ws.removeEventListener("message", h); d.error ? rej(new Error(JSON.stringify(d.error))) : res(d.result); }
    };
    ws.addEventListener("message", h);
    ws.send(JSON.stringify({ id: i, method, params }));
  });
const ev = async (expr) => {
  const r = await call("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error("page eval: " + JSON.stringify(r.exceptionDetails).slice(0, 300));
  return r.result.value;
};

// ── the chart's own rectangle, so every panel is clipped the same way ────────
// Ask the page rather than guessing offsets: the layout has moved before and a
// hard-coded crop silently captures the wrong region.
const rect = await ev(`(() => {
  const el = document.querySelector('#chart, canvas.chart, .chart-canvas, canvas') ||
             [...document.querySelectorAll('canvas')].sort((a,b)=>
               (b.clientWidth*b.clientHeight)-(a.clientWidth*a.clientHeight))[0];
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
})()`);
if (!rect) { console.error("PANEL_GRID_FAIL: no chart element found in the page"); process.exit(1); }
console.log(`chart element ${rect.w}x${rect.h} at ${rect.x},${rect.y}`);

// ── capture each deliverable, live ──────────────────────────────────────────
const captured = [];
for (const d of DELIVERABLES) {
  const src = await (await fetch(`${IDE}/${d.file}`, { cache: "no-store" })).text();
  const st = await ev(`(async () => {
    const P = window.PlutusPineShell;
    P.editor.setSource(${JSON.stringify(src)}); P.editor.flush();
    // ASSERT the source landed. Without this the loop ran the SAME script three
    // times (all three panels reported D3's 5b/79l/21L) because setSource + an
    // immediate run() races the editor's flush.
    const want = ${JSON.stringify(d.mark)};
    let held = "";
    for (let i = 0; i < 40; i++) {
      held = (P.editor.getSource ? P.editor.getSource() : (P.editor.getValue ? P.editor.getValue() : "")) || "";
      if (held.includes(want)) break;
      await new Promise(r => setTimeout(r, 250));
    }
    if (!held.includes(want)) return JSON.stringify({ ok: false, error: "editor never held " + want });
    await P.loadBars({ pair: ${JSON.stringify(PAIR)}, timeframe: ${JSON.stringify(TF)} });
    await new Promise(r => setTimeout(r, 1500));
    const before = P.state().lastVision?.drawingIds?.[0]?.id ?? null;
    // FIXED POINT, not a single shot. The editor's flush is debounced, so the FIRST
    // run() after setSource compiles the PREVIOUS source — measured: D1 compiled
    // 'Plutus Vision v1'. Running until the returned title IS this deliverable is
    // the only deterministic form; each attempt is asserted, never assumed.
    // The budget is 20, not 8: a legitimate panel measured SEVEN runs to land (D3),
    // and the adversarial battery then watched 8 attempts exhaust without landing at
    // all. A retry budget one attempt above the worst observed case is a coin flip.
    let rr = null, got = null, tries = 0;
    for (; tries < 20; tries++) {
      rr = await P.run({ silent: true });
      got = rr.run && rr.run.title;
      if (got && got.includes(${JSON.stringify(d.expect)})) break;
      await new Promise(r => setTimeout(r, 700));   // let the debounced flush land
    }
    // run() returns the COMPILED script's own metadata, so its title names exactly
    // which deliverable ran. Asserting it is the only deterministic per-panel
    // identity: lastVision carries no title, and "the frame changed" was too weak
    // (it went off by one — each panel froze the previous deliverable).
    if (!got || !got.includes(${JSON.stringify(d.expect)})) {
      return JSON.stringify({ ok: false, error: "after " + tries + " runs still compiled '" + got + "'" });
    }
    // then wait for the drawn frame to land (the drawing ids are new per run)
    let v = P.state().lastVision;
    for (let i = 0; i < 80; i++) {
      v = P.state().lastVision;
      if (v && (v.drawingIds?.[0]?.id ?? null) !== before) break;
      await new Promise(r => setTimeout(r, 250));
    }
    return JSON.stringify({ ok: rr.ok, held: held.includes(want), title: got, tries: tries + 1,
                            cleared: v && v.cleared, boxes: v && v.boxes, lines: v && v.lines,
                            labels: v && v.labels });
  })()`);
  const s = JSON.parse(st);
  if (!s.ok || !s.held) { console.error(`PANEL_GRID_FAIL: ${d.key} — ${st}`); process.exit(1); }
  const shot = await call("Page.captureScreenshot", {
    format: "png",
    clip: { x: rect.x, y: rect.y, width: rect.w, height: rect.h, scale: 1 },
  });
  const path = `${TMP}/${d.key}.png`;
  await Bun.write(path, Buffer.from(shot.data, "base64"));
  console.log(`  ${d.key} "${s.title}" in ${s.tries} run(s) ok=${s.ok} cleared=${s.cleared} ${s.boxes}b/${s.lines}l/${s.labels}L  -> ${path}`);
  captured.push({ ...d, path, stats: s });
}

// ── THE IDENTICAL-PANEL GUARD ───────────────────────────────────────────────
// Three panels that are the same frame is the exact defect this grid exists to
// expose, and it shipped once already. Two identical shas = the grid is a lie.
const shas = await Promise.all(captured.map(async (c) =>
  (await $`sha256sum ${c.path}`.text()).split(" ")[0]));
const uniq = new Set(shas);
if (uniq.size !== captured.length) {
  console.error("PANEL_GRID_FAIL: captured panels are not distinct — " + shas.map((s,i)=>`${captured[i].key}=${s.slice(0,12)}`).join(" "));
  process.exit(1);
}
console.log("panels distinct: " + shas.map((s, i) => `${captured[i].key}=${s.slice(0, 12)}`).join(" "));

// ── the grid, composed and captioned ────────────────────────────────────────
// The panel metadata travels as JSON, never interpolated into the Python source:
// a caption with a newline in it is a Python syntax error, and that cost a run.
const manifest = {
  tf: TF, out: OUT,
  panels: [
    { caption: "LIBRARY REFERENCE - the operator's own WINNING_TRADE_LIBARARY / LIQUIDITY LADDERS",
      sub: "the reference look - a ladder of thin full-width lines + zone bands",
      path: `${LIB_DIR}/${libFile}` },
    ...captured.map((c) => ({
      caption: c.label.split("\n")[0],
      sub: `${c.stats.boxes} boxes - ${c.stats.lines} lines - ${c.stats.labels} labels - cleared ${c.stats.cleared}`,
      path: c.path,
    })),
  ],
};
await Bun.write(`${TMP}/manifest.json`, JSON.stringify(manifest, null, 2));

const py = `
import json, pathlib
from PIL import Image, ImageDraw, ImageFont

M = json.loads(pathlib.Path("${TMP}/manifest.json").read_text())
PANELS = M["panels"]
W, H = 980, 560
HEAD, GAP = 62, 14
COLS, ROWS = 2, 2
grid_w = COLS * W + (COLS + 1) * GAP
grid_h = ROWS * (H + HEAD) + (ROWS + 1) * GAP

try:
    font  = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 15)
    small = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 13)
    big   = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 22)
except Exception:
    font = small = big = ImageFont.load_default()

canvas = Image.new("RGB", (grid_w, grid_h + 54), (12, 14, 18))
draw = ImageDraw.Draw(canvas)
draw.text((GAP, 16), f"LQZ PANEL GRID - {M['tf']} - EUR/USD - identical bars (limit 1603)",
          font=big, fill=(235, 238, 242))
draw.text((GAP, grid_h + 26),
          "panels 2-4 captured live over CDP from the Pine IDE, clipped to the chart element - never a cached frame",
          font=small, fill=(140, 148, 158))

for i, p in enumerate(PANELS):
    col, row = i % COLS, i // COLS
    x = GAP + col * (W + GAP)
    y = 54 + GAP + row * (H + HEAD + GAP)
    im = Image.open(p["path"]).convert("RGB")
    s = min(W / im.width, H / im.height)          # fit, never crop: a crop can hide the defect
    im = im.resize((max(1, int(im.width * s)), max(1, int(im.height * s))), Image.LANCZOS)
    ox, oy = x + (W - im.width) // 2, y + HEAD + (H - im.height) // 2
    draw.rectangle([x, y, x + W, y + HEAD + H], outline=(52, 58, 68), width=1)
    draw.rectangle([ox, oy, ox + im.width, oy + im.height], fill=(0, 0, 0))
    canvas.paste(im, (ox, oy))
    draw.text((x + 8, y + 6), p["caption"], font=font, fill=(226, 232, 240))
    col2 = (200, 180, 120) if i == 0 else (120, 200, 140)
    draw.text((x + 8, y + 26), p["sub"], font=small, fill=col2)

out = pathlib.Path(M["out"])
out.parent.mkdir(exist_ok=True, parents=True)
canvas.save(out)
print(f"wrote {out}  {canvas.size[0]}x{canvas.size[1]}")
`;
await Bun.write(`${TMP}/compose.py`, py);
const composed = await $`python3 ${TMP}/compose.py`.text();
console.log(composed.trim());
ws.close();
console.log("PANEL_GRID_OK");
process.exit(0);
