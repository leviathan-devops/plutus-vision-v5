// _ctest.mjs — does the engine render distinct color.rgb / hex / color.new box colors?
const script = `//@version=6
indicator("ctest", overlay=true, max_boxes_count=10)
if barstate.islast
    box.new(bar_index-10, 101.30, bar_index, 101.295, bgcolor=color.new(color.rgb(220,100,50), 70), border_color=color.rgb(220,100,50))
    box.new(bar_index-10, 101.25, bar_index, 101.245, bgcolor=color.new(color.rgb(0,150,150), 70), border_color=color.rgb(0,150,150))
    box.new(bar_index-10, 101.20, bar_index, 101.195, bgcolor=color.new(#ff9800, 70), border_color=#ff9800)
    box.new(bar_index-10, 101.15, bar_index, 101.145, bgcolor=color.new(color.red, 70), border_color=color.red)
`;
const r = await fetch("http://127.0.0.1:9741/run", {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ script, pair: "DXY", timeframe: "1H", limit: 300 })
});
const j = await r.json();
console.log("success:", j.success, "code:", j.code || "");
const d = j.data || j;
const vis = d.vision || d;
const draws = (vis && (vis.drawings || vis.scene)) || [];
console.log("counts:", JSON.stringify(vis && vis.counts));
const boxes = (draws.all && draws.all()) || draws;
// dump any box colors
const s = JSON.stringify(vis).slice(0, 3000);
const cols = [...s.matchAll(/"(?:bgcolor|border_color|bgColor|fill)"\s*:\s*("[^"]*"|\{[^}]*\})/g)].map(m => m[1]).slice(0, 12);
console.log("colors found:", JSON.stringify(cols));
console.log("raw slice:", s.slice(0, 600));
