// _ctest2.mjs — global-const vs inline vs function color, all three in one run.
const script = `//@version=6
indicator("ctest2", overlay=true, max_boxes_count=10)
RR = color.new(color.rgb(210,80,40), 70)
TT = color.new(color.rgb(0,150,150), 70)
zf(string cat) =>
    color result = color.gray
    if cat == "RES"
        result := RR
    else if cat == "SUP"
        result := TT
    result
if barstate.islast
    box.new(bar_index-10, 101.30, bar_index, 101.29, bgcolor=color.new(color.rgb(210,80,40),70), border_color=color.rgb(210,80,40))
    box.new(bar_index-10, 101.25, bar_index, 101.24, bgcolor=RR, border_color=color.rgb(210,80,40))
    box.new(bar_index-10, 101.20, bar_index, 101.19, bgcolor=zf("RES"), border_color=color.rgb(210,80,40))
    box.new(bar_index-10, 101.15, bar_index, 101.14, bgcolor=zf("SUP"), border_color=color.rgb(0,150,150))
`;
const r = await fetch("http://127.0.0.1:9741/run", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ script, pair: "DXY", timeframe: "1H", limit: 300 }) });
const j = await r.json();
const vis = (j.data || j).vision || (j.data || j);
console.log("success:", j.success);
for (const b of (vis.drawings?.boxes || [])) console.log("box", b.a.price, "->", b.color, "| border", b.borderColor);
