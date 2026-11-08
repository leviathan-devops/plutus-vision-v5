// _ctest3.mjs — mimic the E1 render (bar_index anchor + box.new) on the ALIVE IDE's EURUSD chart.
import { readFileSync } from "node:fs";
const src = `//@version=6
indicator("e1test", overlay=true, max_boxes_count=10)
zf(string cat, string deg) =>
    color result = color.gray
    if cat == "RES"
        result := color.new(color.rgb(210,80,40), 70)
    else if cat == "MID"
        result := color.new(color.rgb(255,152,0), 70)
    else if cat == "SUP"
        result := color.new(color.rgb(0,150,150), 70)
    result
if barstate.islast
    _bm = math.max(1, timeframe.in_seconds() * 1000)
    _bAnchor = bar_index - 72
    _lx = math.max(0, _bAnchor - 2)
    _rx = _bAnchor + 1
    box.new(_lx, 1.1300, _rx, 1.1290, bgcolor = zf("RES","HEAVY"), border_color = color.rgb(210,80,40), border_width = 2)
    box.new(_lx, 1.1250, _rx, 1.1240, bgcolor = zf("MID","MODERATE-HEAVY"), border_color = color.rgb(255,152,0), border_width = 2)
    box.new(_lx, 1.1200, _rx, 1.1190, bgcolor = zf("SUP","MODERATE-HEAVY"), border_color = color.rgb(0,150,150), border_width = 2)
`;
const list = await (await fetch("http://127.0.0.1:9225/json/list")).json();
const page = list.find((t) => t.type === "page" && t.title === "Plutus Dashboard");
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((ok, no) => { ws.onopen = ok; ws.onerror = no; });
let n = 0;
const call = (m, p = {}) => new Promise((ok) => { const id = ++n; const h = (e) => { const d = JSON.parse(e.data); if (d.id === id) { ws.removeEventListener("message", h); ok(d); } }; ws.addEventListener("message", h); ws.send(JSON.stringify({ id, method: m, params: p })); });
const expr = `(async () => {
  const P = window.PlutusPineShell;
  P.editor.setSource(${JSON.stringify(src)}); P.editor.flush();
  await P.loadBars({ pair: "EURUSD", timeframe: "1H" });
  await new Promise(r => setTimeout(r, 2500));
  const rr = await P.run({ silent: false });
  await new Promise(r => setTimeout(r, 2500));
  const V = P.state().lastVision || {};
  const bx = (V.drawings && V.drawings.boxes) || [];
  return { ok: rr.ok, counts: rr.run && rr.run.counts, nBox: bx.length, colors: bx.map(b => b.color + "|" + b.borderColor) };
})()`;
let r; for (let i = 0; i < 3; i++) { r = await call("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true }); if (!r.result?.exceptionDetails) break; await Bun.sleep(1500); }
console.log(JSON.stringify(r.result?.result?.value ?? r.result, null, 1));
ws.close();
