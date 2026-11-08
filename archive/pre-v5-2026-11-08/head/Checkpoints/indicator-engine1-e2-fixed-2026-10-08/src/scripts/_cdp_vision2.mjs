const list = await (await fetch("http://127.0.0.1:9225/json/list")).json();
const page = list.find((t) => t.type === "page" && t.title === "Plutus Dashboard");
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((ok,no)=>{ws.onopen=ok;ws.onerror=no;});
let n=0; const call=(m,p={})=>new Promise(ok=>{const id=++n;const h=e=>{const d=JSON.parse(e.data);if(d.id===id){ws.removeEventListener("message",h);ok(d);}};ws.addEventListener("message",h);ws.send(JSON.stringify({id,method:m,params:p}));});
const expr=`(() => {
  const P=window.PlutusPineShell; const V=(P.state()||{}).lastVision||{};
  const bx=V.boxes; const o={bxType:typeof bx, bxIsArr:Array.isArray(bx), bxKeys:bx&&Object.keys(bx).slice(0,8), bxLen:bx&&bx.length};
  const arr = Array.isArray(bx)?bx:(bx&&bx.items)||[];
  o.n=arr.length;
  o.sample=arr.slice(0,12).map(b=>({color:b.color,bg:b.bgcolor||b.backgroundColor||b.fill,border:b.borderColor,a:b.a&&b.a.price,b:b.b&&b.b.price}));
  return o;
})()`;
const r=await call("Runtime.evaluate",{expression:expr,returnByValue:true});
console.log(JSON.stringify(r.result?.result?.value??r.result,null,1).slice(0,2500));
ws.close();
