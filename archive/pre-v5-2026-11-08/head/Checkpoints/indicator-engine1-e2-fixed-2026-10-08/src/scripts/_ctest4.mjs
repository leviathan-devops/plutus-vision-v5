// _ctest4.mjs — the EXACT injection + E1 render pattern from my pine, isolated.
const src = `//@version=6
indicator("e1test4", overlay=true, max_boxes_count=10)
var array<float> e1_top = array.new<float>()
var array<float> e1_bot = array.new<float>()
var array<string> e1_cat = array.new<string>()
if bar_index == 0
    e1_top.push(1.1300)
    e1_top.push(1.1200)
    e1_bot.push(1.1290)
    e1_bot.push(1.1190)
    e1_cat.push("RES")
    e1_cat.push("SUP")
zf(string cat) =>
    color result = color.gray
    if cat == "RES"
        result := color.new(color.rgb(210,80,40), 70)
    else if cat == "SUP"
        result := color.new(color.rgb(0,150,150), 70)
    result
if barstate.islast
    _n = array.size(e1_top)
    _bm = math.max(1, timeframe.in_seconds() * 1000)
    _bAnchor = bar_index - 72
    _lx = math.max(0, _bAnchor - 2)
    _rx = _bAnchor + 1
    if _n > 0
        for i = 0 to _n - 1
            _top = array.get(e1_top, i)
            _bot = array.get(e1_bot, i)
            _mid = (_top + _bot) / 2
            _hw = math.max((_top - _bot) * 0.28, _mid * 0.00012)
            box.new(_lx, _mid + _hw, _rx, _mid - _hw, bgcolor = zf(array.get(e1_cat, i)), border_color = color.rgb(210,80,40), border_width = 2)
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
  await new Promise(r => setTimeout(r, 2000));
  return { ok: rr.ok, counts: rr.run && rr.run.counts, err: rr.error || null };
})()`;
let r; for (let i = 0; i < 3; i++) { r = await call("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true }); if (!r.result?.exceptionDetails) break; await Bun.sleep(1500); }
console.log(JSON.stringify(r.result?.result?.value ?? r.result, null, 1));
ws.close();
