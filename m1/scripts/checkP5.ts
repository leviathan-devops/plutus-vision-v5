// checkP5.ts - P2.TURN-05 gate. Structural scan (DXY map, unit=1.0 so canon numbers are literal):
// 90/180-day conditional extension, qualified-swing wick rule, S/D width rejection at 0.40 unit,
// LSZ 5-pip band + 10-pip extension, magnet bonuses.
import { pillar5, scanSd } from '../src/p5';
import type { Bar, Ohlc } from '../src/bars';

const DAY = 86_400_000, H = 3_600_000;
const UNIT = 1.0;  // unitFor('DXY') = 1.0 (pip-parity: canon constants stay literal)
const d1 = (i: number, hi: number, lo: number, close: number): Ohlc => {
  const from = Date.UTC(2026, 0, 1) + i * DAY;
  return { key: new Date(from).toISOString().slice(0, 10), from, to: from + DAY, open: close, high: hi, low: lo, close, bars: 24 };
};
// 130 DXY sessions at ~101.00 with controlled swing lows (canon scale, unit=1.0):
const days: Ohlc[] = [];
for (let i = 0; i < 130; i++) {
  if (i === 20) days.push(d1(i, 101.005, 100.85, 101.000));            // legacy-window qualified low (wick 0.15+)
  else if (i === 60 || i === 70) days.push(d1(i, 101.005, 100.80, 101.000)); // two same-price qualified lows
  else if (i === 80) days.push(d1(i, 101.005, 100.995, 100.996));      // tiny wick -> minor
  else days.push(d1(i, 101.005, 100.995, 101.000));
}
const cutoff = days[129].to + 1;
const priorWeek: Ohlc = days[days.length - 7];
const weekly: Ohlc[] = []; for (let i = 0; i < 130; i += 7) weekly.push(days[i]);
// 180-day extension: spot within 1.0 of the legacy day-20 swing (100.85 vs 100.86 -> 0.01).
const near = pillar5(days, [], [], cutoff, 100.86, priorWeek, weekly, UNIT);
if (near.scanDays !== 180) throw new Error(`P5_SCAN_FAIL: scanDays ${near.scanDays} != 180 near legacy`);
if (!near.swings.some(s => s.legacy && s.price === 100.85)) throw new Error('P5_SCAN_FAIL: legacy swing dropped while ON');
const far = pillar5(days, [], [], cutoff, 102.00, priorWeek, weekly, UNIT);
if (far.scanDays !== 90) throw new Error(`P5_SCAN_FAIL: scanDays ${far.scanDays} != 90 far from legacy`);
if (far.swings.some(s => s.legacy)) throw new Error('P5_SCAN_FAIL: legacy kept while OFF');
console.log('P5_SCAN_DAYS_OK near-legacy spot -> 180d (legacy kept), far spot -> 90d (legacy dropped)');
// Wick rule: qualified wick >= 0.15 unit; tiny-wick low is minor.
const q = near.swings.find(s => s.price === 100.80)!;
if (q.wick < 0.15 * UNIT) throw new Error(`P5_SWING_WICK_FAIL: wick ${q.wick}`);
if (!near.minorSwings.some(s => s.price === 100.995) || near.swings.some(s => s.price === 100.995))
  throw new Error('P5_SWING_WICK_FAIL: tiny-wick low misclassified');
console.log(`P5_SWING_WICK_OK qualified wick=${q.wick.toFixed(2)} >= 0.15; tiny-wick 100.995 -> minor`);
// LSZ band: demand LSZ at the 100.80 swing = [100.75, 100.85], extension [100.70, 100.85]; ACTIVE within 0.30.
const lsz = near.lsz.find(l => l.side === 'demand' && Math.abs(l.lo - 100.80) < 1e-9);
if (!lsz) throw new Error(`P5_LSZ_FAIL: no demand LSZ at the 100.80 swing (${near.lsz.map(l => `${l.lo}-${l.hi}`).join(',')})`);
if (Math.abs(lsz.lo - 100.80) > 1e-9 || Math.abs(lsz.hi - 100.85) > 1e-9) throw new Error(`P5_LSZ_FAIL: band ${lsz.lo}-${lsz.hi} != [100.80,100.85] (swing + 5 pips above)`);
if (Math.abs(lsz.extLo - 100.70) > 1e-9 || Math.abs(lsz.extHi - 100.85) > 1e-9) throw new Error(`P5_LSZ_FAIL: ext ${lsz.extLo}-${lsz.extHi} != [100.70,100.85] (+10 pips)`);
if (lsz.priority !== 'ACTIVE SL TRIGGER') throw new Error(`P5_LSZ_FAIL: priority ${lsz.priority}`);
console.log(`P5_LSZ_BAND_OK demand LSZ [${lsz.lo},${lsz.hi}] ext [${lsz.extLo},${lsz.extHi}] ${lsz.priority}`);
// Magnet: two same-price lows -> Repeated Low Magnet, bonus 1.5, carried to the level.
const mag = near.magnets.find(m => m.type === 'Repeated Low Magnet')!;
// Near run: the legacy 100.85 swing is within the 0.05 cluster of the 100.80 lows -> 3 dates -> bonus 2.
if (!mag || mag.dates.length !== 3 || mag.bonus !== 2) throw new Error(`P5_MAGNET_FAIL (near): ${JSON.stringify(mag)}`);
// Far run (legacy dropped by the 90d window): exactly the two 100.80 lows -> bonus 1.5.
const magFar = far.magnets.find(m => m.type === 'Repeated Low Magnet')!;
if (!magFar || magFar.dates.length !== 2 || magFar.bonus !== 1.5) throw new Error(`P5_MAGNET_FAIL (far): ${JSON.stringify(magFar)}`);
if (!near.levels.some(l => l.kind === 'magnet' && l.extremeBonus === 2) || !far.levels.some(l => l.kind === 'magnet' && l.extremeBonus === 1.5))
  throw new Error('P5_MAGNET_FAIL: bonus not carried to levels');
console.log(`P5_MAGNET_BONUS_OK near: 3 dates -> bonus 2; far (90d): 2 dates -> bonus 1.5`);
// SD width rejection: a 1H origin candle 0.46 wide (above the swing low, feeding a real 0.5+ move)
// is rejected by name at the 0.40 canon limit.
const bars: Bar[] = [];
for (let i = 0; i < 130; i++) { const t = Date.UTC(2026, 5, 1) + i * 4 * H; const px = 101.00 + 0.001 * (i % 5);
  bars.push({ time: t, open: px, high: px + 0.002, low: px - 0.002, close: px }); }
bars[10] = { time: bars[10].time, open: 101.00, high: 101.002, low: 100.90, close: 101.000 };  // deep swing low
bars[11] = { time: bars[11].time, open: 101.00, high: 101.40, low: 100.94, close: 101.00 };    // WIDE origin (0.46), above the swing low
for (let k = 12; k < 105; k++) { const px = 101.01 + 0.010 * (k - 12); bars[k] = { time: bars[k].time, open: px, high: px + 0.012, low: px - 0.002, close: px + 0.005 }; }  // up-close bodies
const sd = scanSd(bars, '1H', bars[129].time + 1, UNIT);
const wide = sd.find(z => Math.abs(z.lo - 100.94) < 1e-9);
if (!wide) throw new Error(`P5_SD_WIDTH_FAIL: wide zone never formed (${sd.map(z => `${z.lo}-${z.hi}${z.rejected ? ' REJ' : ''}`).join(', ')})`);
if (!wide.rejected?.includes('width')) throw new Error(`P5_SD_WIDTH_FAIL: ${wide.rejected}`);
console.log(`P5_SD_WIDTH_REJECT 0.46-wide origin rejected: ${wide.rejected}`);
