import TV from '@mathieuc/tradingview';
const client = new TV.Client();
const chart = new client.Session.Chart();
const out = { symbols: {} };
const syms = process.argv.slice(2).length ? process.argv.slice(2) : ['FX:EURUSD'];
let i = 0;
function next() {
  if (i >= syms.length) { console.log(JSON.stringify(out, null, 1)); client.end(); process.exit(0); }
  const s = syms[i++];
  const t0 = Date.now(); let done = false;
  chart.setMarket(s, { timeframe: '60', range: 300 });
  const timer = setTimeout(() => { if (!done) { done = true; out.symbols[s] = { ok: false, error: 'TIMEOUT 12s' }; next(); } }, 12000);
  chart.onError((...e) => { if (!done) { done = true; clearTimeout(timer); out.symbols[s] = { ok: false, error: e.join(' ') }; next(); } });
  chart.onUpdate(() => {
    if (done || !chart.periods.length) return;
    done = true; clearTimeout(timer);
    const p = chart.periods; // newest first
    out.symbols[s] = { ok: true, ms: Date.now() - t0, n: p.length, newest: new Date(p[0].time * 1000).toISOString(), oldest: new Date(p[p.length - 1].time * 1000).toISOString(), last: p[0], info: { desc: chart.infos.description, exch: chart.infos.exchange, tz: chart.infos.timezone } };
    next();
  });
}
next();
