// Does a LOCKED drawing survive deletion through every path? Report COUNTS only.
const list = await (await fetch("http://127.0.0.1:9222/json/list")).json();
const page = list.find((t) => t.type === "page" && t.url.includes("9851"));
if (!page) { console.log("NO_PAGE"); process.exit(1); }
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r) => { ws.onopen = r; });
const expr = `(function(){
  var S = window.PlutusPineShell.chart.drawings;
  var n = function(){ try { return S.toJSON().drawings.length; } catch(e){ return -1; } };
  var before = n();
  var all = S.toJSON().drawings;
  var locked = all.filter(function(d){ return d.locked === true; }).length;
  var t = all.filter(function(d){ return d.locked === true; })[0];
  var ret;
  try { ret = S.remove(t.id); } catch (e) { ret = 'THREW ' + e.message; }
  var afterSingle = n();
  try { S.removeMany(all.slice(0, 10).map(function(d){ return d.id; })); } catch (e) {}
  var afterMany = n();
  return JSON.stringify({
    total: before, lockedCount: locked,
    afterRemoveOne: afterSingle, afterRemoveMany: afterMany,
    removeReturnType: typeof ret,
    verdict: (afterSingle === before && afterMany === before) ? 'LOCKED_REMOVE_REFUSED' : 'STILL_DELETABLE'
  });
})()`;
const res = await new Promise((r) => {
  ws.send(JSON.stringify({ id: 1, method: "Runtime.evaluate", params: { expression: expr, returnByValue: true } }));
  ws.onmessage = (e) => { const d = JSON.parse(e.data); if (d.id === 1) r(d); };
});
ws.close();
console.log(res.result?.result?.value || JSON.stringify(res).slice(0, 300));