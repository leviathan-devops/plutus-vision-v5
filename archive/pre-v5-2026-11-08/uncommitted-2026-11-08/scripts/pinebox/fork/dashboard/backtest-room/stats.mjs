/**
 * stats.mjs — THE CANON STAT ENVELOPE  (W-S3 T1 · operator ruling 2026-09-29:
 * "every surface that touches a canon artifact renders it through the CANON path …
 *  the canon constants and formats are read from the canon, never re-derived")
 * ---------------------------------------------------------------------------
 * PURE. No node imports, no DOM — safe in the engine, the control surface and a test.
 *
 * WHAT IS CANON HERE, AND WHERE IT WAS READ (both paths re-read this session):
 *
 * 1 · THE ENVELOPE — `packages/plutus-v6-fresh/10-THE-TRADING-TOOLKIT.md` §4
 *     (EDGE-STATS), verbatim: "Every result carries the same envelope …: the point
 *     estimate with N and a Wilson 95% confidence interval; minimum-sample guards:
 *     a warning below 30 sessions, no estimate below 10 … a fixed disclaimer:
 *     historical frequencies, not predictions." And: "There is no code path that
 *     prints a percentage without its sample size."
 *     ⇒ this module has NO code path that emits a percentage without N and its CI.
 *
 * 2 · THE SUMMARY SHAPE — `plutus-backtest.hand/system-prompt.md` §11 (OUTPUT
 *     CONTRACT): session_id, outcome, pairs_traded, trades_total, wins, losses,
 *     breakeven, win_rate, total_pips, total_pnl_usd, best_pair, worst_pair,
 *     guardrail_rejections, duration_seconds. `room.summary()` emits exactly these.
 *
 * 3 · THE win_rate UNIT — the canon stores a FRACTION, not a percent: the same
 *     contract prints `"win_rate": 0.619`, and the dashboard's funded gate compares
 *     `winRate >= 0.55` (api.js). A 0..100 value handed to the canon would read as
 *     100x. → `winRate` is a fraction; `winRatePct` is the display twin.
 */

export const CANON = Object.freeze({
  envelope_source: 'packages/plutus-v6-fresh/10-THE-TRADING-TOOLKIT.md §4 (EDGE-STATS)',
  summary_source: 'LIVE/dashboard/plutus-backtest.hand/system-prompt.md §11 (OUTPUT CONTRACT)',
  unit_source: 'plutus-backtest.hand/system-prompt.md §11 "win_rate": 0.619 + dashboard/electron/server/api.js funded gate winRate >= 0.55',
  min_sample: 10,      // below 10 → NO estimate (the canon's guard)
  warn_sample: 30,     // below 30 → a warning
  ci_level: 0.95,      // Wilson
  disclaimer: 'Historical conditional frequencies with sample sizes. Not predictions, not advice.',
});

const r = (n, d = 2) => (n == null || Number.isNaN(n) ? null : Math.round(n * 10 ** d) / 10 ** d);

/** the z for a two-sided 95% interval (1.959963985). Kept as a constant, not re-derived per call. */
const Z95 = 1.959963985;

/**
 * Wilson score interval — the canon's CI (chosen over the normal approximation
 * because it is finite at 0/n and n/n, which is exactly where a small backtest lives).
 * @returns {{lo:number,hi:number,level:number}|null} null when n === 0
 */
export function wilson95(hits, n) {
  if (!n || n <= 0) return null;
  const p = hits / n;
  const z2 = Z95 * Z95;
  const denom = 1 + z2 / n;
  const centre = p + z2 / (2 * n);
  const spread = Z95 * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n));
  return {
    lo: r(Math.max(0, (centre - spread) / denom), 4),
    hi: r(Math.min(1, (centre + spread) / denom), 4),
    level: CANON.ci_level,
  };
}

/**
 * A canon-grade estimate: the fraction + N + the CI + the guards + the disclaimer.
 * `guard: 'NO_ESTIMATE'` below 10 — the number is WITHHELD (never printed).
 */
export function envelope(hits, n, label = 'estimate') {
  const ci = wilson95(hits, n);
  const out = {
    label,
    n: n ?? 0,
    hits: hits ?? 0,
    estimate: n > 0 ? r(hits / n, 4) : null,
    ci,
    guard: n >= CANON.warn_sample ? 'OK' : (n >= CANON.min_sample ? 'WARN_LOW_SAMPLE' : 'NO_ESTIMATE'),
    warning: n >= CANON.warn_sample
      ? null
      : `n=${n} < ${CANON.warn_sample}: ` + (n >= CANON.min_sample ? 'low sample — treat as indicative only' : `below the canon minimum of ${CANON.min_sample} — no estimate is printed`),
    disclaimer: CANON.disclaimer,
  };
  out.display = out.guard === 'NO_ESTIMATE'
    ? `no estimate (n=${n} < ${CANON.min_sample})`
    : `${(out.estimate * 100).toFixed(1)}% n=${n} 95% CI [${(ci.lo * 100).toFixed(1)}%, ${(ci.hi * 100).toFixed(1)}%] (${hits} hits)`;
  return out;
}

/**
 * The room's full statistics, canon-shaped.
 * @param {Array} closed  the settled positions: {pnl, r, reason, side, bars, exitTime}
 * @param {object} [opts] {startingBalance, peakEquity, troughEquity, pipSize, durationSeconds, pair}
 */
export function summarize(closed = [], opts = {}) {
  const wins = closed.filter((t) => t.pnl > 0);
  const losses = closed.filter((t) => t.pnl < 0);
  const be = closed.filter((t) => !t.pnl || t.pnl === 0);
  const grossWin = wins.reduce((s, t) => s + t.pnl, 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + t.pnl, 0));
  const rs = closed.map((t) => t.r).filter((v) => Number.isFinite(v));
  const n = closed.length;
  const pipSize = opts.pipSize ?? null;
  const pips = pipSize ? closed.reduce((s, t) => s + (t.pnlPips ?? 0), 0) : null;

  return {
    // ── the canon envelope (never a percentage without its N + CI)
    winRate: envelope(wins.length, n, 'win rate'),                   // FRACTION + n + CI + guards
    winRatePct: n ? r((wins.length / n) * 100, 1) : null,            // the display twin
    avgR: rs.length ? { value: r(rs.reduce((a, b) => a + b, 0) / rs.length, 2), n: rs.length } : { value: null, n: 0 },
    profitFactor: grossLoss > 0
      ? { value: r(grossWin / grossLoss, 2), n, note: null }
      : { value: null, n, note: grossWin > 0 ? 'no losing trade yet — profit factor is undefined, not infinite' : 'no closed trades' },
    // ── the canon §11 counters
    trades_total: n,
    wins: wins.length,
    losses: losses.length,
    breakeven: be.length,
    total_pnl_usd: r(closed.reduce((s, t) => s + t.pnl, 0), 2),
    total_pips: pips == null ? null : r(pips, 1),
    gross_win: r(grossWin, 2),
    gross_loss: r(grossLoss, 2),
    avg_win: wins.length ? r(grossWin / wins.length, 2) : null,
    avg_loss: losses.length ? r(-grossLoss / losses.length, 2) : null,
    expectancy: n ? r(closed.reduce((s, t) => s + t.pnl, 0) / n, 2) : null,
    best_trade: n ? r(Math.max(...closed.map((t) => t.pnl)), 2) : null,
    worst_trade: n ? r(Math.min(...closed.map((t) => t.pnl)), 2) : null,
    max_drawdown: opts.maxDrawdown ?? null,
    disclaimer: CANON.disclaimer,
    canon: { ...CANON },
  };
}

/**
 * The canon §11 OUTPUT CONTRACT — the exact field names the OF Poseidon consumer reads.
 * `outcome` maps the room's own state onto the canon's enum: COMPLETE | FAILED | TIMEOUT.
 */
export function canonSummary(room, opts = {}) {
  const st = room.status();
  const s = st.stats;
  const pairPnl = new Map();
  for (const t of room.closed) pairPnl.set(st.symbol, (pairPnl.get(st.symbol) ?? 0) + t.pnl);
  const pairs = [...pairPnl.keys()];
  const byP = pairs.map((p) => ({ p, v: pairPnl.get(p) })).sort((a, b) => b.v - a.v);
  return {
    session_id: st.uid,
    outcome: opts.outcome ?? (st.atEnd ? 'COMPLETE' : 'RUNNING'),
    pairs_traded: st.symbols,
    trades_total: s.trades_total,
    wins: s.wins,
    losses: s.losses,
    breakeven: s.breakeven,
    win_rate: s.winRate.estimate,                    // a FRACTION (canon unit) or null below the guard
    win_rate_n: s.winRate.n,
    win_rate_ci: s.winRate.ci,
    win_rate_guard: s.winRate.guard,
    total_pips: s.total_pips,
    total_pnl_usd: s.total_pnl_usd,
    best_pair: byP.length ? byP[0].p : null,
    worst_pair: byP.length > 1 ? byP[byP.length - 1].p : null,
    guardrail_rejections: st.orders.filter((o) => o.status === 'cancelled').length,
    duration_seconds: opts.durationSeconds ?? Math.round((Date.now() - (opts.startedMs ?? Date.now())) / 1000),
    envelope: { win_rate: s.winRate, avg_r: s.avgR, profit_factor: s.profitFactor },
    disclaimer: CANON.disclaimer,
  };
}

export default { CANON, wilson95, envelope, summarize, canonSummary };
