const src = `//@version=6
indicator("noop", overlay=true)
plot(close)`;
const list = await (await fetch("http://127.0.0.1:9225/json/list")).json();
const page = list.find((t) => t.type === "page" && t.title === "Plutus Dashboard");
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((ok,no)=>{ws.onopen=ok;ws.onerror=no;});
let n=0; const call=(m,p={})=>new Promise(ok=>{const id=++n;const h=e=>{const d=JSON.parse(e.data);if(d.id===id){ws.removeEventListener("message",h);ok(d);}};ws.addEventListener("message",h);ws.send(JSON.stringify({id,method:m,params:p}));});
const expr=`(async()=>{const P=window.PlutusPineShell;try{P.clearDrawings()}catch(e){}P.editor.setSource(${JSON.stringify(src)});P.editor.flush();await P.loadBars({pair:"EURUSD",timeframe:"1H"});await new Promise(r=>setTimeout(r,2500));const rr=await P.run({silent:false});await new Promise(r=>setTimeout(r,2000));return{ok:rr.ok,counts:rr.run&&rr.run.counts};})()`;
let r;for(let i=0;i<3;i++){r=await call("Runtime.evaluate",{expression:expr,awaitPromise:true,returnByValue:true});if(!r.result?.exceptionDetails)break;await Bun.sleep(1500);}
console.log(JSON.stringify(r.result?.result?.value??r.result));
ws.close();
