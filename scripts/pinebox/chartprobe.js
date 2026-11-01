(() => {
  // chartprobe.js - what the RENDERER itself says is on the chart right now. Evaluated in the page over CDP by stages/verify.sh.
  // Nothing here names a colour, a week, a price or a theme: the candle colours, the visible range and the column of every
  // in-view bar come from the live renderer (PlutusPineShell.chart.rendererControl.renderer), so a recolour or a re-zoom changes
  // the answer the verifier expects instead of breaking it.
  const shell = window.PlutusPineShell;
  const chart = shell && shell.chart;
  const r = chart && chart.rendererControl && chart.rendererControl.renderer;
  if (!r || !r.coords || !Array.isArray(r.bars) || !r.mountContainer) return JSON.stringify({ state: "NOT_READY", why: "the renderer, its coordinate mapper, its bars or its mount are not present yet" });
  const vr = chart.getVisibleRange();                        // null when no bar is in view (measured: a pan past the data)
  const m = r.mountContainer.getBoundingClientRect();
  const base = { total: r.bars.length, vr, mount: { l: m.left, t: m.top, w: m.width, h: m.height }, inner: [innerWidth, innerHeight], dpr: window.devicePixelRatio, W: r.coords.widthPx, H: r.coords.dataHeightPx, up: r.candleUp, down: r.candleDown };
  if (!vr) return JSON.stringify(Object.assign(base, { state: "EMPTY_RANGE", inView: 0, cols: [] }));
  const cols = [];
  let inView = 0;
  for (const b of r.bars) {
    if (b.time < vr.from || b.time > vr.to) continue;
    inView++;
    const x = r.coords.timeToX(b.time);
    if (x >= 0 && x < base.W) cols.push([Math.round(x * 100) / 100, b.close >= b.open ? 1 : 0]);
  }
  return JSON.stringify(Object.assign(base, { state: inView > 0 ? "OK" : "EMPTY_RANGE", inView, cols }));
})()
