const list = await (await fetch("http://127.0.0.1:9225/json/list")).json();
const page = list.find((t) => t.type === "page" && t.title === "Plutus Dashboard");
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((ok,no)=>{ws.onopen=ok;ws.onerror=no;});
let n=0; const call=(m,p={})=>new Promise(ok=>{const id=++n;const h=e=>{const d=JSON.parse(e.data);if(d.id===id){ws.removeEventListener("message",h);ok(d);}};ws.addEventListener("message",h);ws.send(JSON.stringify({id,method:m,params:p}));});
const expr=`(() => {
  const P=window.PlutusPineShell; const o={};
  try {
    const store=P.chart.drawings.ctrl.store;
    o.storeType=typeof store;
    const items = store && (store.all ? store.all() : (store.items || store._items || (store.size?[...store.values()]:null)));
    o.n = items ? items.length : "?";
    o.kinds = {};
    o.gold = [];
    if (items) for (const d of items) {
      const k = d.kind || d.type || "?";
      o.kinds[k] = (o.kinds[k]||0)+1;
      const c = String(d.color || d.bgcolor || d.backgroundColor || d.style && (d.style.bgColor||d.style.lineColor) || "");
      if (/c8a|b99a|a880|d4a|e6b|c9a|b79a/i.test(c) || (d.props && d.props.glyph)) o.gold.push({kind:k, c, price: d.anchors && d.anchors[0] && d.anchors[0].price});
    }
  } catch(e){ o.err = "ERR "+e.message; }
  return o;
})()`;
const r=await call("Runtime.evaluate",{expression:expr,returnByValue:true});
console.log(JSON.stringify(r.result?.result?.value??r.result,null,1).slice(0,2500));
ws.close();
