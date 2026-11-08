#!/usr/bin/env bun
// _cdp_vision.mjs — dump the study's OWN drawings (lastVision) with colors, to find the gold boxes.
const list = await (await fetch("http://127.0.0.1:9225/json/list")).json();
const page = list.find((t) => t.type === "page" && t.title === "Plutus Dashboard");
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((ok, no) => { ws.onopen = ok; ws.onerror = no; });
let n = 0;
const call = (m, p = {}) => new Promise((ok) => { const id = ++n; const h = (e) => { const d = JSON.parse(e.data); if (d.id === id) { ws.removeEventListener("message", h); ok(d); } }; ws.addEventListener("message", h); ws.send(JSON.stringify({ id, method: m, params: p })); });
const expr = `(() => {
  const P = window.PlutusPineShell;
  const V = (P.state() || {}).lastVision || {};
  const o = { vKeys: Object.keys(V) };
  const dr = { boxes: V.boxes, lines: V.lines, labels: V.labels };
  o.drKeys = Object.keys(dr);
  o.counts = V.counts || null;
  const bx = dr.boxes || [];
  o.boxes = bx.map(b => ({ color: b.color, bg: b.bgcolor || b.backgroundColor || b.fill, border: b.borderColor, a: b.a && b.a.price, b: b.b && b.b.price, x: b.xloc }));
  const ln = dr.lines || [];
  o.lines = ln.slice(0, 12).map(l => ({ color: l.color, a: l.a && l.a.price, b: l.b && b.b.price }));
  const lf = dr.labels || [];
  o.labels = lf.slice(0, 12).map(l => ({ color: l.color, text: (l.text||"").slice(0,24), price: l.price }));
  return o;
})()`;
const r = await call("Runtime.evaluate", { expression: expr, returnByValue: true });
console.log(JSON.stringify(r.result?.result?.value ?? r.result, null, 1).slice(0, 3000));
ws.close();
