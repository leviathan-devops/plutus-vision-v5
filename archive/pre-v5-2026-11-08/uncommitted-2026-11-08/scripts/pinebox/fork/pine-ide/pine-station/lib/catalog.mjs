/**
 * catalog.mjs — the station's PINE CATALOG.
 *
 * The chart's studies control offers two families:
 *   1. Vela's own NATIVE indicators (queried in-page via
 *      `chart.availableNativeIndicators()` — Apache-2.0, no engine), and
 *   2. these PINE sources, executed HERE by PineTS (AGPL, isolated).
 *
 * Every entry is a complete, runnable v5 script. They are the station's shipped
 * examples — the chart's source box is prefilled from one of them and the
 * operator edits from there. Kept deliberately small and legible: each is a
 * known-good smoke case for the station itself.
 */

export const PINE_CATALOG = [
  {
    id: 'ema-ribbon',
    name: 'EMA Ribbon',
    kind: 'indicator',
    overlay: true,
    description: 'Two EMAs + a crossover marker. The canonical study smoke case.',
    script: `//@version=5
indicator("EMA Ribbon", overlay=true)
len = input.int(20, "Fast length")
e = ta.ema(close, len)
plot(e, "EMA 20", color=color.new(color.yellow, 0), linewidth=2)
plot(ta.ema(close, 50), "EMA 50", color=color.new(color.blue, 0), linewidth=1)
plotshape(ta.crossover(e, ta.ema(close, 50)), title="Cross up", style=shape.triangleup, location=location.belowbar, color=color.new(color.lime, 0))`,
  },
  {
    id: 'sma-200',
    name: 'SMA 200',
    kind: 'indicator',
    overlay: true,
    description: 'The bias line.',
    script: `//@version=5
indicator("SMA 200", overlay=true)
plot(ta.sma(close, 200), "SMA 200", color=color.new(color.white, 30), linewidth=1)`,
  },
  {
    id: 'rsi',
    name: 'RSI (14)',
    kind: 'indicator',
    overlay: false,
    description: 'Relative strength with the 30/70 rails.',
    script: `//@version=5
indicator("RSI 14", overlay=false)
r = ta.rsi(close, 14)
plot(r, "RSI", color=color.new(color.purple, 0), linewidth=1)
hline(70, "Overbought", color=color.new(color.red, 40))
hline(30, "Oversold", color=color.new(color.green, 40))`,
  },
  {
    id: 'macd',
    name: 'MACD (12,26,9)',
    kind: 'indicator',
    overlay: false,
    description: 'MACD line, signal line and histogram.',
    script: `//@version=5
indicator("MACD", overlay=false)
[macdLine, signalLine, hist] = ta.macd(close, 12, 26, 9)
plot(macdLine, "MACD", color=color.new(color.blue, 0))
plot(signalLine, "Signal", color=color.new(color.orange, 0))
plot(hist, "Hist", color=color.new(color.gray, 0), style=plot.style_columns)`,
  },
  {
    id: 'bollinger',
    name: 'Bollinger Bands (20,2)',
    kind: 'indicator',
    overlay: true,
    description: 'The middle band with its two envelopes.',
    script: `//@version=5
indicator("Bollinger Bands", overlay=true)
basis = ta.sma(close, 20)
dev = 2 * ta.stdev(close, 20)
plot(basis, "Basis", color=color.new(color.gray, 0))
plot(basis + dev, "Upper", color=color.new(color.teal, 20))
plot(basis - dev, "Lower", color=color.new(color.teal, 20))`,
  },
  {
    id: 'atr',
    name: 'ATR (14)',
    kind: 'indicator',
    overlay: false,
    description: 'Average true range — the sizing input.',
    script: `//@version=5
indicator("ATR 14", overlay=false)
plot(ta.atr(14), "ATR", color=color.new(color.orange, 0))`,
  },
  {
    id: 'donchian',
    name: 'Donchian Channel (20)',
    kind: 'indicator',
    overlay: true,
    description: 'Highest high / lowest low of the last 20 bars.',
    script: `//@version=5
indicator("Donchian 20", overlay=true)
hi = ta.highest(high, 20)
lo = ta.lowest(low, 20)
plot(hi, "Upper", color=color.new(color.green, 30))
plot(lo, "Lower", color=color.new(color.red, 30))
plot((hi + lo) / 2, "Mid", color=color.new(color.gray, 40))`,
  },
  {
    id: 'vwap',
    name: 'Session VWAP',
    kind: 'indicator',
    overlay: true,
    description: 'Volume-weighted average price, anchored to the session.',
    script: `//@version=5
indicator("Session VWAP", overlay=true)
plot(ta.vwap, "VWAP", color=color.new(color.gold, 0), linewidth=2)`,
  },
  {
    id: 'ema-cross-strategy',
    name: 'EMA Cross (strategy — emits fills)',
    kind: 'strategy',
    overlay: true,
    description: 'A real strategy: entries and exits come back as trades markers.',
    script: `//@version=5
strategy("EMA Cross", overlay=true)
fast = ta.ema(close, 9)
slow = ta.ema(close, 21)
if ta.crossover(fast, slow)
    strategy.entry("L", strategy.long)
if ta.crossunder(fast, slow)
    strategy.close("L")
plot(fast, "Fast", color=color.new(color.yellow, 0))
plot(slow, "Slow", color=color.new(color.blue, 0))`,
  },
];

export const CATALOG_BY_ID = new Map(PINE_CATALOG.map((s) => [s.id, s]));
export const DEFAULT_SCRIPT = PINE_CATALOG[0].script;
