/**
 * replay.mjs — THE BACKTEST ROOM ENGINE  (SHELL_ANCHOR §5.2 / §7 · W-S3 T1)
 * ---------------------------------------------------------------------------
 * A PURE bar-by-bar replay state machine. No node builtins, no deps, no DOM,
 * no network, no clock: every transition is a function of (bars, order book,
 * cursor). The control surface (`control.mjs`, :9443) hosts one instance per
 * session; the tab (`renderer/tabs/backtest.js`) is a CLIENT of it.
 *
 * THE REPLAY LAW (future hidden): the series is loaded whole, but only bars
 * `[0 .. cursor]` are ever readable through `window()`/`status()`. Bars past
 * the cursor do not exist for the room. `visibleBars === cursor + 1` — exactly
 * one more per `step(+1)`, exactly one fewer per `step(-1)`.
 *
 * REWIND IS DETERMINISTIC: a snapshot of the mutable state is taken for every
 * bar. `step(-1)` restores it; a forward jump REPLAYS the bars in between so
 * orders fill identically; a backward jump truncates later snapshots so a
 * re-step re-derives the same state. No hidden history, no drift.
 *
 * FILL MODEL (documented, conservative, deterministic on one bar):
 *   market ................. next bar's open
 *   limit .................. the level once touched (bar low<=level buy / high>=level sell)
 *   stop ................... the level once crossed (bar high>=level buy / low<=level sell)
 *   SL / TP ................ the level; if the bar OPENED beyond it (a gap) the
 *                            open is used instead — never a better-than-market fill
 *   same-bar SL+TP ......... SL wins (the conservative branch)
 *   closePartial / manual .. the CURRENT visible bar's close
 *   exit price field ....... the level actually used (gap-aware)
 *
 * SIZING: `qty` (units) or `riskPct` (% of balance). riskPct needs an SL:
 *   qty = (balance * riskPct/100) / |entryPrice - slPrice|     (valuePerUnit = 1)
 *
 * LEVEL MODES (sl/tp/trailing/be all accept the same shape):
 *   {mode:'price', value}  an absolute price
 *   {mode:'ticks', value}  value * tickSize
 *   {mode:'pct',   value}  value % of the reference price
 *   {mode:'r',     value}  value * the position risk (|entry - sl|)
 *   a bare number == {mode:'price'}
 */

import { summarize, canonSummary } from './stats.mjs';

/** Every refusal carries a NAME. No third state. */
export const CODES = Object.freeze({
  NO_BARS: 'NO_BARS',
  BAD_DATE: 'BAD_DATE',
  START_DATE_OUT_OF_RANGE: 'START_DATE_OUT_OF_RANGE',
  BAR_RANGE_EXHAUSTED: 'BAR_RANGE_EXHAUSTED',
  NO_SESSION: 'NO_SESSION',
  SESSION_NOT_FOUND: 'SESSION_NOT_FOUND',
  BAD_ORDER: 'BAD_ORDER',
  BAD_SIDE: 'BAD_SIDE',
  BAD_TYPE: 'BAD_TYPE',
  BAD_QTY: 'BAD_QTY',
  BAD_PRICE: 'BAD_PRICE',
  RISK_SIZING_NO_SL: 'RISK_SIZING_NO_SL',
  ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
  POSITION_NOT_FOUND: 'POSITION_NOT_FOUND',
  BAD_PCT: 'BAD_PCT',
  BAD_LEVEL: 'BAD_LEVEL',
  BAD_RATE: 'BAD_RATE',
  BAD_DELTA: 'BAD_DELTA',
  UNSUPPORTED: 'UNSUPPORTED',
});

export class ReplayError extends Error {
  constructor(code, message, detail = {}) {
    super(message);
    this.name = 'ReplayError';
    this.code = code;
    this.detail = detail;
  }
}

const r2 = (n) => (n == null || Number.isNaN(n) ? null : Math.round(n * 100) / 100);
const iso = (ms) => (ms == null ? null : new Date(ms).toISOString());
const DIR = { buy: 1, sell: -1, long: 1, short: -1 };

function num(v) {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function roundTo(v, step) {
  if (!step || step <= 0) return v;
  return Math.round(v / step) * step;
}

/** is a level an ABSOLUTE price (a bare number or {mode:'price'})? */
function isAbsolute(level) {
  const n = num(level);
  if (n != null) return true;
  return !!level && typeof level === 'object' && String(level.mode || 'price') === 'price';
}

function absPrice(level) {
  const n = num(level);
  return n != null ? n : num(level?.value);
}

/**
 * A level → a NON-NEGATIVE DISTANCE (price units).
 *   bare number  → bareIsDistance ? |n| : |n - ref|
 *   {ticks,value}→ |value| * tickSize
 *   {pct,value}  → |value|/100 * ref
 *   {r,value}    → |value| * risk            (risk = |entry - sl|, required)
 * Used for SL/TP (with bareIsDistance=false) and for trailing/BE (true).
 */
function toDistance(level, { ref, tickSize = 0.00001, risk = null, label = 'level', bareIsDistance = false } = {}) {
  if (level == null) return null;
  const bare = num(level);
  if (bare != null) return bareIsDistance ? Math.abs(bare) : Math.abs(bare - ref);
  if (typeof level !== 'object') {
    throw new ReplayError(CODES.BAD_LEVEL, `${label}: not a price or a level object`, { level });
  }
  const v = num(level.value);
  if (v == null) throw new ReplayError(CODES.BAD_LEVEL, `${label}: level.value missing`, { level });
  switch (String(level.mode || 'price')) {
    case 'price':
      return Math.abs(v - ref);
    case 'ticks':
      return Math.abs(v) * tickSize;
    case 'pct':
      return (Math.abs(v) / 100) * ref;
    case 'r':
      if (!risk) throw new ReplayError(CODES.BAD_LEVEL, `${label}: mode 'r' needs an SL (no risk yet)`, { level });
      return Math.abs(v) * risk;
    default:
      throw new ReplayError(CODES.BAD_LEVEL, `${label}: unknown mode '${level.mode}'`, { level });
  }
}

/**
 * A trailing spec → a positive distance from the FAVOURABLE extreme.
 *  20 | {dist:20} | {dist:{mode:'ticks',value:20}} | {mode:'pct',value:0.4}
 * A bare number here is a DISTANCE in price units (never a price).
 */
export function trailingDistance(t, opts = {}) {
  if (t == null) return null;
  if (typeof t === 'object' && t.dist != null) {
    const inner = t.dist;
    const n = num(inner);
    if (n != null) return Math.abs(n);
    return toDistance(inner, { ...opts, bareIsDistance: true });
  }
  const n = num(t);
  if (n != null) return Math.abs(n);
  return toDistance(t, { ...opts, bareIsDistance: true });
}

/**
 * Resolve an SL/TP level into a concrete price, ROLE- and SIDE-aware:
 *   role 'sl' → the ADVERSE side of ref   (buy: ref - d, sell: ref + d)
 *   role 'tp' → the FAVOURABLE side of ref (buy: ref + d, sell: ref - d)
 * An absolute price given on the wrong side is refused (never silently flipped).
 */
function resolveStop(level, { ref, dir, tickSize, risk = null, label, role, round }) {
  if (level == null) return null;
  if (role === 'sl' && level && typeof level === 'object' && String(level.mode) === 'r') {
    throw new ReplayError(CODES.BAD_LEVEL, 'an SL cannot be given in R units (R is measured FROM the SL) — use price/ticks/%', { sl: level });
  }
  if (isAbsolute(level)) {
    const px = absPrice(level);
    if (!Number.isFinite(px)) throw new ReplayError(CODES.BAD_LEVEL, `${label}: not a price`, { level });
    if (role === 'sl') {
      if (dir === 1 && px >= ref) throw new ReplayError(CODES.BAD_LEVEL, `buy SL must be BELOW the entry ref (${px} >= ${ref})`, { sl: px, ref });
      if (dir === -1 && px <= ref) throw new ReplayError(CODES.BAD_LEVEL, `sell SL must be ABOVE the entry ref (${px} <= ${ref})`, { sl: px, ref });
    } else {
      if (dir === 1 && px <= ref) throw new ReplayError(CODES.BAD_LEVEL, `buy TP must be ABOVE the entry ref (${px} <= ${ref})`, { tp: px, ref });
      if (dir === -1 && px >= ref) throw new ReplayError(CODES.BAD_LEVEL, `sell TP must be BELOW the entry ref (${px} >= ${ref})`, { tp: px, ref });
    }
    return round(px);
  }
  const d = toDistance(level, { ref, tickSize, risk, label });
  return round(role === 'sl' ? ref - dir * d : ref + dir * d);
}

/**
 * The replay room. One instance == one backtest session.
 */
export class ReplayRoom {
  /**
   * @param {object} cfg
   * @param {Array<{time:number,open:number,high:number,low:number,close:number,volume?:number}>} cfg.bars
   * @param {object} cfg.session  {uid,name,symbol,timeframe,startDate,endDate,startingBalance,strategy,playbook,symbols}
   * @param {object} [cfg.spec]   instrument spec {tickSize,qtyStep,minQty,valuePerUnit}
   */
  constructor({ bars, session, spec } = {}) {
    if (!Array.isArray(bars) || bars.length === 0) {
      throw new ReplayError(CODES.NO_BARS, 'no bars: the session has no price series to replay', {
        session: session?.uid ?? null,
        got: Array.isArray(bars) ? 0 : typeof bars,
      });
    }
    const bad = bars.findIndex((b) => !b || !Number.isFinite(b.time) || !Number.isFinite(b.close));
    if (bad >= 0) {
      throw new ReplayError(CODES.NO_BARS, `malformed bar at index ${bad} (needs finite time+close)`, { index: bad });
    }
    this.bars = bars.slice().sort((a, b) => a.time - b.time);
    this.session = {
      uid: session?.uid ?? `bt-${Date.now()}`,
      name: session?.name ?? 'unnamed session',
      symbol: session?.symbol ?? 'EUR/USD',
      timeframe: session?.timeframe ?? '1H',
      strategy: session?.strategy ?? null,
      playbook: session?.playbook ?? null,
      symbols: Array.isArray(session?.symbols) && session.symbols.length ? session.symbols.slice(0, 5) : [session?.symbol ?? 'EUR/USD'],
      startDate: session?.startDate ?? null,
      endDate: session?.endDate ?? null,
      startingBalance: num(session?.startingBalance) ?? 10000,
    };
    this.spec = {
      tickSize: num(spec?.tickSize) ?? 0.00001,
      qtyStep: num(spec?.qtyStep) ?? 1,
      minQty: num(spec?.minQty) ?? 1,
      valuePerUnit: num(spec?.valuePerUnit) ?? 1,
      // the CANON pip size for this pair (canon.mjs reads it from the backtest hand's
      // PIP_SIZES map) — never re-derived here. null disables the pip fields.
      pipSize: num(spec?.pipSize) ?? null,
      pipValueUsdPerLot: num(spec?.pipValueUsdPerLot) ?? null,
      specSource: spec?.specSource ?? null,
    };

    // ── the start date decides where the replay BEGINS (the first hidden bar is startIndex+1)
    const { startIndex } = this.#resolveStart(this.session.startDate);
    this.startIndex = startIndex;
    this.endIndex = this.#resolveEnd(this.session.endDate);

    // ── mutable state
    this.cursor = startIndex;
    this.orders = [];        // working + filled orders (the order book)
    this.positions = [];     // OPEN positions
    this.fills = [];         // every fill, in fill order (entry + partial + exit)
    this.closed = [];        // aggregated CLOSED positions (the stats population)
    this.realized = 0;
    this.equitySeries = [];
    this.sessionNotes = '';
    this.tags = [];
    this.playing = false;
    this.rate = 1;
    this.seq = 0;
    this.#snapshots = [];
    this.#equityAtStart = this.session.startingBalance;

    // prime the mark-to-market at the start bar (realized 0, unrealized 0)
    this.#mark();
  }

  #snapshots;
  #equityAtStart;

  // ──────────────────────────────────────────────────────────────── range maths
  #resolveStart(startDate) {
    if (startDate == null || startDate === '') return { startIndex: 0, why: 'no start date → the first bar' };
    const t = typeof startDate === 'number' ? startDate : Date.parse(startDate);
    if (!Number.isFinite(t)) {
      throw new ReplayError(CODES.BAD_DATE, `start date is not a date: ${JSON.stringify(startDate)}`, {
        startDate,
        accepted: 'ISO-8601 string or epoch ms',
      });
    }
    if (t < this.bars[0].time) {
      throw new ReplayError(CODES.START_DATE_OUT_OF_RANGE, 'start date is before the first available bar', {
        requested: iso(t),
        range: [iso(this.bars[0].time), iso(this.bars[this.bars.length - 1].time)],
      });
    }
    if (t > this.bars[this.bars.length - 1].time) {
      throw new ReplayError(CODES.START_DATE_OUT_OF_RANGE, 'start date is after the last available bar', {
        requested: iso(t),
        range: [iso(this.bars[0].time), iso(this.bars[this.bars.length - 1].time)],
      });
    }
    let i = this.bars.findIndex((b) => b.time >= t);
    if (i < 0) i = this.bars.length - 1;
    return { startIndex: i };
  }

  #resolveEnd(endDate) {
    if (endDate == null || endDate === '') return this.bars.length - 1;
    const t = typeof endDate === 'number' ? endDate : Date.parse(endDate);
    if (!Number.isFinite(t)) {
      throw new ReplayError(CODES.BAD_DATE, `end date is not a date: ${JSON.stringify(endDate)}`, { endDate });
    }
    const idx = this.bars.findIndex((b) => b.time > t);
    return idx < 0 ? this.bars.length - 1 : Math.max(idx - 1, 0);
  }

  // ──────────────────────────────────────────────────────────────── snapshots
  #snapshot() {
    return structuredClone({
      cursor: this.cursor,
      orders: this.orders,
      positions: this.positions,
      fills: this.fills,
      closed: this.closed,
      realized: this.realized,
      equitySeries: this.equitySeries,
      seq: this.seq,
      balance: this.balance,
    });
  }

  #restore(snap) {
    this.cursor = snap.cursor;
    this.orders = snap.orders;
    this.positions = snap.positions;
    this.fills = snap.fills;
    this.closed = snap.closed;
    this.realized = snap.realized;
    this.equitySeries = snap.equitySeries;
    this.seq = snap.seq;
  }

  #pushSnapshot() {
    this.#snapshots[this.cursor] = this.#snapshot();
  }

  // ──────────────────────────────────────────────────────────────── accounting
  get balance() {
    return this.session.startingBalance + this.realized;
  }

  /** unrealized marked at the CURRENT visible close */
  get unrealized() {
    const px = this.bars[this.cursor]?.close ?? 0;
    let u = 0;
    for (const p of this.positions) u += (px - p.entry) * p.qty * DIR[p.side] * this.spec.valuePerUnit;
    return u;
  }

  get equity() {
    return this.balance + this.unrealized;
  }

  #mark() {
    const px = this.bars[this.cursor]?.close ?? 0;
    let u = 0;
    for (const p of this.positions) u += (px - p.entry) * p.qty * DIR[p.side] * this.spec.valuePerUnit;
    const eq = this.balance + u;
    this.equitySeries[this.cursor] = eq;
    return eq;
  }

  /** peak-to-trough of the marked equity series, in currency + % of peak */
  #drawdown() {
    let peak = -Infinity;
    let dd = 0;
    let peakAt = null;
    for (let i = 0; i < this.equitySeries.length; i++) {
      const v = this.equitySeries[i];
      if (v == null) continue;
      if (v > peak) {
        peak = v;
        peakAt = i;
      }
      const d = peak - v;
      if (d > dd) dd = d;
    }
    return { currency: r2(dd), pct: peak > 0 ? r2((dd / peak) * 100) : 0, peakAt };
  }

  get stats() {
    return summarize(this.closed, {
      pipSize: this.spec.pipSize ?? null,
      maxDrawdown: { currency: this.#drawdown().currency, pct: this.#drawdown().pct },
    });
  }

  /** the canon §11 OUTPUT CONTRACT (stats.mjs · system-prompt.md §11) */
  summary(opts = {}) {
    return canonSummary(this, opts);
  }

  // ──────────────────────────────────────────────────────────────── reads
  now() {
    const bar = this.bars[this.cursor];
    return { index: this.cursor, time: bar.time, iso: iso(bar.time), bar: { ...bar } };
  }

  /** bars [0..cursor] — the ONLY bars the room may ever show (future hidden) */
  get visible() {
    return this.bars.slice(0, this.cursor + 1);
  }

  /** the render window: the last `lookback` revealed bars (>=1) */
  window(lookback = 200) {
    const n = Math.max(1, Math.min(Number(lookback) || 200, this.cursor + 1));
    return { from: this.cursor + 1 - n, to: this.cursor, bars: this.bars.slice(this.cursor + 1 - n, this.cursor + 1) };
  }

  status() {
    const w = this.window(1);
    return {
      uid: this.session.uid,
      name: this.session.name,
      symbol: this.session.symbol,
      timeframe: this.session.timeframe,
      strategy: this.session.strategy,
      playbook: this.session.playbook,
      symbols: this.session.symbols,
      startDate: this.session.startDate,
      endDate: this.session.endDate,
      startingBalance: this.session.startingBalance,
      barsTotal: this.bars.length,
      startIndex: this.startIndex,
      endIndex: this.endIndex,
      cursor: this.cursor,
      visibleBars: this.visible.length,          // === cursor + 1  (ADV-a)
      futureHidden: this.bars.length - 1 - this.cursor,
      atStart: this.cursor <= 0,
      atEnd: this.cursor >= this.endIndex,
      firstVisibleTime: iso(this.bars[0].time),
      now: this.now(),
      playing: this.playing,
      rate: this.rate,
      balance: r2(this.balance),
      equity: r2(this.equity),
      realized: r2(this.realized),
      unrealized: r2(this.unrealized),
      openRisk: r2(this.positions.reduce((s, p) => s + (p.riskAmount || 0), 0)),
      stats: this.stats,
      // LIVE orders: 'working' (a resting limit/stop) AND 'queued' (a market order waiting
      // for the next bar's open). Measured defect this fixes: a queued market order was
      // invisible in status(), so a client could not see its own pending entry.
      orders: this.orders
        .filter((o) => o.status === 'working' || o.status === 'queued')
        .map((o) => ({ ...o, pendingFill: o.status === 'queued' })),
      positions: this.positions.map((p) => ({ ...p })),
      recentFills: this.fills.slice(-12).map((f) => ({ ...f })),
      closedTrades: this.closed.slice(-40).map((t) => ({ ...t })),
      sessionNotes: this.sessionNotes,
      tags: this.tags,
    };
  }

  // ──────────────────────────────────────────────────────────────── transport
  step(delta) {
    const d = num(delta);
    if (d !== 1 && d !== -1) {
      throw new ReplayError(CODES.BAD_DELTA, `step delta must be +1 or -1 (got ${JSON.stringify(delta)})`, { delta });
    }
    const target = this.cursor + d;
    if (target < 0) {
      throw new ReplayError(CODES.BAR_RANGE_EXHAUSTED, 'already at the first bar: cannot step back', {
        requested: target, min: 0, max: this.endIndex,
      });
    }
    if (target > this.endIndex) {
      throw new ReplayError(CODES.BAR_RANGE_EXHAUSTED, 'already at the last bar of the session: cannot step forward', {
        requested: target, min: 0, max: this.endIndex,
        rangeEnd: iso(this.bars[this.endIndex].time),
      });
    }
    if (d === 1) this.#advanceTo(target);
    else this.#rewindTo(target);
    return this.status();
  }

  #advanceTo(target) {
    for (let i = this.cursor + 1; i <= target; i++) {
      this.#pushSnapshot();      // snapshot the state AS OF the previous bar
      this.cursor = i;
      this.#processBar(i);
      this.#mark();
      this.#pushSnapshot();      // and as of this one
    }
  }

  #rewindTo(target) {
    const snap = this.#snapshots[target];
    if (!snap) {
      throw new ReplayError(CODES.BAR_RANGE_EXHAUSTED, `no state snapshot at bar ${target} — cannot rewind`, {
        requested: target, min: 0,
      });
    }
    this.#restore(snap);
    // truncate: re-stepping must RE-DERIVE, never replay a stale branch
    for (let i = target + 1; i < this.#snapshots.length; i++) this.#snapshots[i] = undefined;
    this.equitySeries.length = target + 1;
  }

  /** jump to an absolute time (ms or ISO), a bar index, or by a delta of bars */
  jump(arg) {
    let target;
    if (typeof arg === 'number' || (typeof arg === 'string' && !arg.trim().startsWith('{'))) {
      const t = typeof arg === 'number' ? arg : Date.parse(arg);
      if (!Number.isFinite(t)) throw new ReplayError(CODES.BAD_DATE, `jump target is not a time: ${JSON.stringify(arg)}`, { arg });
      let i = -1;
      for (let k = this.bars.length - 1; k >= 0; k--) {
        if (this.bars[k].time <= t) { i = k; break; }
      }
      if (i < 0) {
        throw new ReplayError(CODES.BAR_RANGE_EXHAUSTED, 'jump target is before the first bar', {
          requested: iso(t), min: iso(this.bars[0].time), max: iso(this.bars[this.endIndex].time),
        });
      }
      target = i;
    } else if (arg && typeof arg === 'object') {
      if (arg.barIndex != null) target = num(arg.barIndex);
      else if (arg.ms != null) return this.jump(num(arg.ms));
      else if (arg.time != null) return this.jump(String(arg.time));
      else if (arg.bars != null) target = this.cursor + num(arg.bars);
      else throw new ReplayError(CODES.BAD_DELTA, 'jump needs {ms}|{time}|{barIndex}|{bars}', { arg });
    } else {
      throw new ReplayError(CODES.BAD_DELTA, 'jump needs {ms}|{time}|{barIndex}|{bars}', { arg });
    }
    if (target == null || !Number.isFinite(target)) {
      throw new ReplayError(CODES.BAD_DELTA, `jump target is not a number: ${JSON.stringify(arg)}`, { arg });
    }
    if (target < 0 || target > this.endIndex) {
      throw new ReplayError(CODES.BAR_RANGE_EXHAUSTED, `jump to bar ${target} is out of range [0..${this.endIndex}]`, {
        requested: target, min: 0, max: this.endIndex,
        requestedTime: target >= 0 && target < this.bars.length ? iso(this.bars[target].time) : null,
        minTime: iso(this.bars[0].time), maxTime: iso(this.bars[this.endIndex].time),
      });
    }
    if (target === this.cursor) return this.status();
    // A JUMP STOPS THE REPLAY (root cause, measured 2026-10-02). The operator: "it automatically plays whenever
    // I replay ... it does not stop it from continuing the replay". Measured directly against the room:
    //   before /jump: cursor=1661 playing=true   after /jump: cursor=1544 playing=true   +2.5s: 1557 still true
    // The seek itself never touched this.playing, so the replay simply carried on from the new position - which
    // reads as "it plays on its own the moment I rewind", and made PAUSE look dead (the replay was never asked
    // to stop). Positioning is a pause: a seek moves the cursor and HOLDS there (also TradingView's behaviour).
    this.playing = false;
    if (target > this.cursor) this.#advanceTo(target);
    else this.#rewindTo(target);
    return this.status();
  }

  play(rate) {
    const r = num(rate ?? 1);
    if (r == null || r <= 0 || r > 100) {
      throw new ReplayError(CODES.BAD_RATE, `play rate must be 0 < rate <= 100 bars/s (got ${JSON.stringify(rate)})`, { rate });
    }
    this.rate = r;
    this.playing = true;
    return this.status();
  }

  pause() {
    this.playing = false;
    return this.status();
  }

  // ──────────────────────────────────────────────────────────────── the bar tick
  #processBar(i) {
    const bar = this.bars[i];

    // 1 · MARKET orders queued on a previous bar fill at THIS bar's open
    for (const o of this.orders) {
      if (o.status !== 'queued' || o.type !== 'market') continue;
      this.#fillEntry(o, bar.open, i, bar);
    }

    // 2 · working limit / stop orders trigger intrabar
    for (const o of this.orders) {
      if (o.status !== 'working') continue;
      const dir = DIR[o.side];
      if (o.type === 'limit') {
        if (dir === 1 && bar.low <= o.price) this.#fillEntry(o, Math.min(o.price, bar.open), i, bar);
        else if (dir === -1 && bar.high >= o.price) this.#fillEntry(o, Math.max(o.price, bar.open), i, bar);
      } else if (o.type === 'stop') {
        if (dir === 1 && bar.high >= o.price) this.#fillEntry(o, Math.max(o.price, bar.open), i, bar);
        else if (dir === -1 && bar.low <= o.price) this.#fillEntry(o, Math.min(o.price, bar.open), i, bar);
      }
    }

    // 3 · manage every open position against this bar
    for (const p of [...this.positions]) this.#managePosition(p, bar, i);
  }

  #managePosition(p, bar, i) {
    const dir = DIR[p.side];

    // 3a · auto-breakeven BEFORE the stops are evaluated (it can only reduce risk)
    if (p.be && !p.beArmed) {
      let trigDist;
      if (p.be === true) trigDist = p.riskPerUnit ?? null;           // `be:true` == the 1R trigger
      else {
        const src = typeof p.be === 'object' ? (p.be.trigger ?? p.be.dist ?? p.be) : p.be;
        trigDist = trailingDistance(src, { ref: p.entry, tickSize: this.spec.tickSize, risk: p.riskPerUnit, label: 'be.trigger' });
      }
      if (trigDist == null || !(trigDist > 0)) {
        throw new ReplayError(CODES.BAD_LEVEL, 'auto-breakeven needs a positive trigger distance (a number, a {mode,value}, or true for 1R)', { be: p.be });
      }
      const reached = dir === 1 ? bar.high >= p.entry + trigDist : bar.low <= p.entry - trigDist;
      if (reached) {
        const offDist = typeof p.be === 'object' && p.be.offset != null
          ? (trailingDistance(p.be.offset, { ref: p.entry, tickSize: this.spec.tickSize, risk: p.riskPerUnit, label: 'be.offset' }) ?? 0)
          : 0;
        const target = p.entry + dir * offDist;
        const better = dir === 1 ? target > (p.sl ?? -Infinity) : target < (p.sl ?? Infinity);
        if (better) {
          p.sl = this.#roundPrice(target);
          p.slMoves = (p.slMoves || 0) + 1;
        }
        p.beArmed = true;
      }
    }

    // 3b · trailing: advance from the bar's favourable extreme
    if (p.trailing) {
      const dist = trailingDistance(p.trailing, { ref: p.entry, tickSize: this.spec.tickSize, risk: p.riskPerUnit, label: 'trailing' });
      if (dist == null || !(dist > 0)) {
        throw new ReplayError(CODES.BAD_LEVEL, 'trailing needs a positive distance (a number in price units, {dist}, or {mode,value})', { trailing: p.trailing });
      }
      const prevExt = p.extreme ?? p.entry;
      const ext = dir === 1 ? Math.max(prevExt, bar.high) : Math.min(prevExt, bar.low);
      p.extreme = ext;
      const next = dir === 1 ? ext - dist : ext + dist;
      const better = dir === 1 ? next > (p.sl ?? -Infinity) : next < (p.sl ?? Infinity);
      if (better) {
        p.sl = this.#roundPrice(next);
        p.slMoves = (p.slMoves || 0) + 1;
      }
    }

    // 3c · SL then TP; if both live in one bar, SL wins (conservative)
    if (p.sl != null) {
      const hit = dir === 1 ? bar.low <= p.sl : bar.high >= p.sl;
      if (hit) {
        const px = dir === 1 ? Math.min(p.sl, bar.open) : Math.max(p.sl, bar.open);
        return this.#exitPosition(p, 100, px, i, bar, 'SL');
      }
    }
    if (p.tp != null) {
      const hit = dir === 1 ? bar.high >= p.tp : bar.low <= p.tp;
      if (hit) {
        const px = dir === 1 ? Math.max(p.tp, bar.open) : Math.min(p.tp, bar.open);
        return this.#exitPosition(p, 100, px, i, bar, 'TP');
      }
    }
  }

  /** round to the tick AND strip the float artifact: Math.round(px/tick)*tick on
   *  1.16915/0.00001 yields 1.1691500000000001, which then lands in the DB ledger and
   *  in every consumer's price cell (measured defect). toFixed(10) cleans it at the
   *  source so the engine, the API and the ledger all agree on the printed value. */
  #roundPrice(px) {
    const t = this.spec.tickSize;
    if (!(t > 0)) return px;
    return Number((Math.round(px / t) * t).toFixed(10));
  }

  // ──────────────────────────────────────────────────────────────── the order book
  /** place an order; returns {order, position?} */
  place(order = {}) {
    const side = String(order.side || '').toLowerCase();
    if (!DIR[side]) throw new ReplayError(CODES.BAD_SIDE, `side must be buy|sell (got ${JSON.stringify(order.side)})`, { order });
    const type = String(order.type || 'market').toLowerCase();
    if (!['market', 'limit', 'stop'].includes(type)) {
      throw new ReplayError(CODES.BAD_TYPE, `type must be market|limit|stop (got ${JSON.stringify(order.type)})`, { order });
    }
    const lastClose = this.bars[this.cursor].close;

    // trigger price for limit/stop (an ABSOLUTE price, required, correct side of market)
    let price = null;
    if (type !== 'market') {
      const raw = order.price ?? order.limitPrice ?? order.stopPrice;
      if (!isAbsolute(raw)) {
        throw new ReplayError(CODES.BAD_PRICE, `${type} order needs an ABSOLUTE price (a number or {mode:'price',value}); got ${JSON.stringify(raw)}`, { order });
      }
      price = this.#roundPrice(absPrice(raw));
      if (price == null || !Number.isFinite(price)) {
        throw new ReplayError(CODES.BAD_PRICE, `${type} order needs a price (order.price)`, { order });
      }
      if (type === 'limit' && DIR[side] === 1 && price > lastClose) {
        throw new ReplayError(CODES.BAD_PRICE, `buy limit must be BELOW the market (${price} > ${lastClose})`, { price, lastClose });
      }
      if (type === 'limit' && DIR[side] === -1 && price < lastClose) {
        throw new ReplayError(CODES.BAD_PRICE, `sell limit must be ABOVE the market (${price} < ${lastClose})`, { price, lastClose });
      }
      if (type === 'stop' && DIR[side] === 1 && price < lastClose) {
        throw new ReplayError(CODES.BAD_PRICE, `buy stop must be ABOVE the market (${price} < ${lastClose})`, { price, lastClose });
      }
      if (type === 'stop' && DIR[side] === -1 && price > lastClose) {
        throw new ReplayError(CODES.BAD_PRICE, `sell stop must be BELOW the market (${price} > ${lastClose})`, { price, lastClose });
      }
    }

    // the entry reference used to resolve %/R levels and risk sizing
    const ref = type === 'market' ? lastClose : price;

    // SL first (a %/R TP needs it), then TP — both role- and side-aware
    const dir = DIR[side];
    const rr = (x) => this.#roundPrice(x);
    const sl = resolveStop(order.sl, { ref, dir, tickSize: this.spec.tickSize, label: 'sl', role: 'sl', round: rr });
    const riskPerUnit = sl != null ? Math.abs(ref - sl) : null;
    const tp = resolveStop(order.tp, { ref, dir, tickSize: this.spec.tickSize, risk: riskPerUnit, label: 'tp', role: 'tp', round: rr });

    // ── sizing
    let qty = num(order.qty);
    let riskPct = num(order.riskPct);
    if (qty == null) {
      if (riskPct == null) {
        throw new ReplayError(CODES.BAD_QTY, 'an order needs qty (units) or riskPct (% of balance)', { order });
      }
      if (riskPerUnit == null || riskPerUnit === 0) {
        throw new ReplayError(CODES.RISK_SIZING_NO_SL, 'riskPct sizing needs an SL to derive the size', { riskPct, ref });
      }
      qty = (this.balance * (riskPct / 100)) / (riskPerUnit * this.spec.valuePerUnit);
    }
    if (!Number.isFinite(qty) || qty <= 0) {
      throw new ReplayError(CODES.BAD_QTY, `qty must be > 0 (got ${JSON.stringify(order.qty)})`, { qty });
    }
    qty = roundTo(qty, this.spec.qtyStep);
    if (qty < this.spec.minQty) qty = this.spec.minQty;

    const o = {
      id: `O${++this.seq}`,
      createdBar: this.cursor,
      createdTime: this.bars[this.cursor].time,
      side,
      type,
      price: price == null ? null : this.#roundPrice(price),
      qty,
      riskPct: riskPct ?? null,
      sl: sl == null ? null : this.#roundPrice(sl),
      sl0: sl == null ? null : this.#roundPrice(sl),
      tp: tp == null ? null : this.#roundPrice(tp),
      trailing: order.trailing ?? null,
      be: order.be ?? null,
      status: 'working',
      note: order.note ?? null,
      tag: order.tag ?? null,
    };
    // MARKET: `marketFill:'now'` fills at the LAST VISIBLE CLOSE — the price the operator sees, nothing
    // from the future (the TradeZella/TV replay ticket). Without it (events recorded before 2026-09-30)
    // the order queues and fills at the NEXT bar's open, so an old session replays exactly as it filled.
    const fillNow = type === 'market' && order.marketFill === 'now';
    if (order.marketFill != null && order.marketFill !== 'now' && order.marketFill !== 'next-open') {
      throw new ReplayError(CODES.BAD_ORDER, `marketFill must be 'now' or 'next-open' (got ${JSON.stringify(order.marketFill)})`, { marketFill: order.marketFill });
    }
    if (type === 'market') o.status = 'queued';

    // a market order fills immediately only if the session has no next bar yet —
    // in that case the order stays queued and the refusals above already guarded it.
    // NO HEDGING — one direction at a time per symbol, like TradeZella. Checked BEFORE
    // the order enters the book (a refused order must leave no trace).
    this.#assertNoOpposite(o);
    this.orders.push(o);
    if (fillNow) this.#fillEntry(o, lastClose, this.cursor, this.bars[this.cursor]);
    return { order: { ...o }, status: this.status() };
  }

  /** NO HEDGING, enforced over BOTH open positions and live (queued/working) orders.
   *  The order is checked BEFORE it is pushed, so a refused order never lands in the book.
   *  (Measured defect this fixes: a queued market buy + a queued market sell both filled on
   *  the next bar, producing two opposing positions — the position-only check missed it.) */
  #assertNoOpposite(o) {
    const myDir = DIR[o.side];
    const opp = this.positions.find((p) => DIR[p.side] === -myDir);
    if (opp) {
      throw new ReplayError(CODES.UNSUPPORTED, `hedging is not allowed: a ${opp.side} position is open`, {
        openPosition: opp.id, openSide: opp.side, orderSide: o.side,
      });
    }
    const live = (o2) => o2.status === 'queued' || o2.status === 'working';
    const oppOrder = this.orders.find((o2) => live(o2) && DIR[o2.side] === -myDir);
    if (oppOrder) {
      throw new ReplayError(CODES.UNSUPPORTED, `hedging is not allowed: a live ${oppOrder.side} order (${oppOrder.id}) is in the book`, {
        openOrder: oppOrder.id, openOrderSide: oppOrder.side, openOrderStatus: oppOrder.status, orderSide: o.side,
      });
    }
  }

  modify(id, patch = {}) {
    const o = this.orders.find((x) => x.id === id);
    const p = this.positions.find((x) => x.id === id);
    if (!o && !p) throw new ReplayError(CODES.ORDER_NOT_FOUND, `no order or position with id ${JSON.stringify(id)}`, { id });
    if (o) {
      if (o.status !== 'working') {
        throw new ReplayError(CODES.ORDER_NOT_FOUND, `order ${id} is ${o.status}, not modifiable`, { id, status: o.status });
      }
      const oref = o.price ?? this.bars[this.cursor].close;
      const odir = DIR[o.side];
      const orisk = o.sl0 != null ? Math.abs(oref - o.sl0) : null;
      const rr = (x) => this.#roundPrice(x);
      if (patch.price != null) {
        if (!isAbsolute(patch.price)) {
          throw new ReplayError(CODES.BAD_PRICE, `price must be an ABSOLUTE number (got ${JSON.stringify(patch.price)})`, { price: patch.price });
        }
        o.price = this.#roundPrice(absPrice(patch.price));
      }
      if (patch.sl !== undefined) o.sl = patch.sl == null ? null : resolveStop(patch.sl, { ref: oref, dir: odir, tickSize: this.spec.tickSize, risk: orisk, label: 'sl', role: 'sl', round: rr });
      if (patch.tp !== undefined) o.tp = patch.tp == null ? null : resolveStop(patch.tp, { ref: oref, dir: odir, tickSize: this.spec.tickSize, risk: orisk, label: 'tp', role: 'tp', round: rr });
      if (patch.trailing !== undefined) o.trailing = patch.trailing;
      if (patch.be !== undefined) o.be = patch.be;
      if (patch.qty != null) {
        const q = num(patch.qty);
        if (!(q > 0)) throw new ReplayError(CODES.BAD_QTY, `qty must be > 0 (got ${JSON.stringify(patch.qty)})`, { qty: patch.qty });
        o.qty = roundTo(q, this.spec.qtyStep);
      }
      return { order: { ...o }, status: this.status() };
    }
    // a live position: SL/TP/trailing/BE only (qty moves only through closePartial)
    const pref = this.bars[this.cursor].close;
    const prr = (x) => this.#roundPrice(x);
    if (patch.sl !== undefined) p.sl = patch.sl == null ? null : resolveStop(patch.sl, { ref: pref, dir: DIR[p.side], tickSize: this.spec.tickSize, risk: p.riskPerUnit, label: 'sl', role: 'sl', round: prr });
    if (patch.tp !== undefined) p.tp = patch.tp == null ? null : resolveStop(patch.tp, { ref: pref, dir: DIR[p.side], tickSize: this.spec.tickSize, risk: p.riskPerUnit, label: 'tp', role: 'tp', round: prr });
    if (patch.trailing !== undefined) p.trailing = patch.trailing;
    if (patch.be !== undefined) { p.be = patch.be; p.beArmed = false; }
    if (patch.qty != null) {
      const q = num(patch.qty);
      if (!(q > 0)) throw new ReplayError(CODES.BAD_QTY, `qty must be > 0 (got ${JSON.stringify(patch.qty)})`, { qty: patch.qty });
      if (q > p.qty) throw new ReplayError(CODES.UNSUPPORTED, 'scale-in must be a new order, not a modify', { qty: q, open: p.qty });
      p.qty = roundTo(q, this.spec.qtyStep);
      p.riskAmount = p.riskPerUnit != null ? p.riskPerUnit * p.qty * this.spec.valuePerUnit : null;
    }
    return { position: { ...p }, status: this.status() };
  }

  cancel(id) {
    const o = this.orders.find((x) => x.id === id);
    if (!o) throw new ReplayError(CODES.ORDER_NOT_FOUND, `no order with id ${JSON.stringify(id)}`, { id });
    if (o.status !== 'working' && o.status !== 'queued') {
      throw new ReplayError(CODES.UNSUPPORTED, `order ${id} is ${o.status}, not cancellable`, { id, status: o.status });
    }
    o.status = 'cancelled';
    return { order: { ...o }, status: this.status() };
  }

  /** close a percentage of a position at the CURRENT visible close (25/50/75/100 + custom) */
  closePartial(pct, opts = {}) {
    const p = opts.positionId ? this.positions.find((x) => x.id === opts.positionId) : this.positions[0];
    if (!p) {
      throw new ReplayError(CODES.POSITION_NOT_FOUND, 'no open position to close', { positionId: opts.positionId ?? null });
    }
    const n = num(pct);
    if (n == null || n <= 0 || n > 100) {
      throw new ReplayError(CODES.BAD_PCT, `close pct must be 0 < pct <= 100 (got ${JSON.stringify(pct)})`, { pct });
    }
    const bar = this.bars[this.cursor];
    const px = opts.price != null ? num(opts.price) : bar.close;
    if (px == null) throw new ReplayError(CODES.BAD_PRICE, 'close price is not a number', { price: opts.price });
    if (n === 100) return this.#exitPosition(p, 100, px, this.cursor, bar, opts.reason || 'MANUAL');
    const qty = Math.min(roundTo((p.qty * n) / 100, this.spec.qtyStep), p.qty);
    if (!(qty > 0)) {
      throw new ReplayError(CODES.BAD_PCT, `a ${n}% close of ${p.qty} units rounds to 0`, { pct: n, openQty: p.qty, qtyStep: this.spec.qtyStep });
    }
    this.#recordFill(p, qty, px, this.cursor, bar, n === 100 ? 'exit' : 'partial', opts.reason || 'PARTIAL');
    const pnl = (px - p.entry) * qty * DIR[p.side] * this.spec.valuePerUnit;
    p.realized += pnl;
    this.realized += pnl;
    p.qty = roundTo(p.qty - qty, this.spec.qtyStep);
    if (p.qty <= 0) this.#settle(p, px, this.cursor, bar, opts.reason || 'PARTIAL');
    else p.riskAmount = p.riskPerUnit != null ? p.riskPerUnit * p.qty * this.spec.valuePerUnit : p.riskAmount;
    this.#mark();
    return { fill: this.fills[this.fills.length - 1], position: { ...p }, status: this.status() };
  }

  // ──────────────────────────────────────────────────────────────── fills
  #fillEntry(o, px, i, bar) {
    const riskPerUnit = o.sl0 != null ? Math.abs(px - o.sl0) : null;
    const p = {
      id: `P${++this.seq}`,
      orderId: o.id,
      side: o.side,
      qty: o.qty,
      qty0: o.qty,
      entry: this.#roundPrice(px),
      entryBar: i,
      entryTime: bar.time,
      sl: o.sl,
      sl0: o.sl0,
      tp: o.tp,
      trailing: o.trailing,
      be: o.be,
      beArmed: false,
      extreme: this.#roundPrice(px),
      riskPerUnit,
      riskAmount: riskPerUnit != null ? riskPerUnit * o.qty * this.spec.valuePerUnit : null,
      realized: 0,
      slMoves: 0,
      state: 'open',
    };
    o.status = 'filled';
    o.filledBar = i;
    o.filledPrice = p.entry;
    this.positions.push(p);
    this.#recordFill(p, o.qty, p.entry, i, bar, 'entry', 'ENTRY');
    this.#mark();
    return p;
  }

  #exitPosition(p, pct, px, i, bar, reason) {
    const qty = pct === 100 ? p.qty : Math.min(roundTo((p.qty * pct) / 100, this.spec.qtyStep), p.qty);
    if (!(qty > 0)) throw new ReplayError(CODES.BAD_PCT, `a ${pct}% close of ${p.qty} rounds to 0`, { pct, openQty: p.qty });
    const price = this.#roundPrice(px);
    this.#recordFill(p, qty, price, i, bar, pct === 100 ? 'exit' : 'partial', reason);
    const pnl = (price - p.entry) * qty * DIR[p.side] * this.spec.valuePerUnit;
    p.realized += pnl;
    this.realized += pnl;
    p.qty = roundTo(p.qty - qty, this.spec.qtyStep);
    if (p.qty <= 0 || pct === 100) {
      this.#settle(p, price, i, bar, reason);
    }
    this.#mark();
    return { fill: this.fills[this.fills.length - 1], position: p.state === 'closed' ? null : { ...p }, status: this.status() };
  }

  #settle(p, px, i, bar, reason) {
    const idx = this.positions.indexOf(p);
    if (idx >= 0) this.positions.splice(idx, 1);
    p.state = 'closed';
    p.exit = px;
    p.exitBar = i;
    p.exitTime = bar.time;
    p.exitReason = reason;
    p.bars = i - p.entryBar;
    // ── the CANON formulas (plutus-backtest.hand/close-trade.js computeTradeResult):
    //    pnl_pips = (exit-entry)*dir / pipSize(pair)   [pipSize READ from the canon map]
    //    r_multiple = pnl_pips / risk_pips             [risk_pips from the ORIGINAL sl]
    //    r_multiple is identical to pnl/riskAmount (both numerator and denominator
    //    scale by the same pip value) — the pip form is kept so the canon fields
    //    and the room's currency fields can be cross-checked against each other.
    const pipSize = this.spec.pipSize;
    const dir = DIR[p.side];
    const pnlPips = pipSize ? ((px - p.entry) * dir) / pipSize : null;
    const riskPips = pipSize && p.riskPerUnit ? p.riskPerUnit / pipSize : null;
    const r = riskPips && riskPips !== 0
      ? pnlPips / riskPips
      : (p.riskAmount ? p.realized / p.riskAmount : null);
    this.closed.push({
      id: p.id, side: p.side, qty: p.qty0, entry: p.entry, exit: px,
      entryTime: p.entryTime, exitTime: p.exitTime, bars: p.bars,
      pnl: r2(p.realized), r: r == null ? null : r2(r), reason,
      pnlPips: pnlPips == null ? null : r2(pnlPips, 1),
      riskPips: riskPips == null ? null : r2(riskPips, 1),
      sl0: p.sl0, tp: p.tp, slMoves: p.slMoves || 0,
      result: p.realized > 0 ? 'WIN' : (p.realized < 0 ? 'LOSS' : 'BREAKEVEN'),
    });
  }

  #recordFill(p, qty, px, i, bar, kind, reason) {
    this.fills.push({
      seq: this.fills.length + 1,
      positionId: p.id,
      orderId: p.orderId ?? null,
      side: p.side,
      kind,                       // entry | partial | exit
      reason,
      qty,
      price: this.#roundPrice(px),
      barIndex: i,
      time: bar.time,
      iso: iso(bar.time),
      pctOfPosition: kind === 'entry' ? null : r2((qty / p.qty0) * 100),
      pnl: kind === 'entry' ? 0 : r2((px - p.entry) * qty * DIR[p.side] * this.spec.valuePerUnit),
      qtyRemaining: kind === 'entry' ? p.qty : roundTo(p.qty - qty, this.spec.qtyStep),
    });
  }

  // ──────────────────────────────────────────────────────────────── notes
  note(text, opts = {}) {
    if (opts.tradeId) {
      const t = this.closed.find((x) => x.id === opts.tradeId);
      if (!t) throw new ReplayError(CODES.POSITION_NOT_FOUND, `no closed trade ${JSON.stringify(opts.tradeId)}`, { tradeId: opts.tradeId });
      t.note = String(text ?? '');
      if (Array.isArray(opts.tags)) t.tags = opts.tags.slice();
      return { trade: { ...t }, status: this.status() };
    }
    this.sessionNotes = `${this.sessionNotes ? this.sessionNotes + '\n' : ''}${String(text ?? '')}`;
    if (Array.isArray(opts.tags)) this.tags = Array.from(new Set([...this.tags, ...opts.tags]));
    return { status: this.status() };
  }

  toJSON() {
    return this.status();
  }
}


export default ReplayRoom;
