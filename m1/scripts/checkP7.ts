// checkP7.ts - P1.TURN-04 gate. Tier-1 ICE walls bound the arena; post-cutoff
// snapshots refuse; a snapshot with no tier-1 wall names P7_NO_TIER1_WALL.
import { runWindow } from '../src/window';
import { pillar7Exchange, p7ExchangeSourceMissing } from '../src/p7exchange';

const W = runWindow('DXY', '2026-07-06');
const H = 3_600_000;
// Legitimate: two tier-1 DXY walls + one sub-tier wall + one wrong-pair wall.
const good = pillar7Exchange({
  source: 'ICE',
  published_at: W.cutoffUtc - 2 * H,
  walls: [
    { pair: 'DXY', price: 99.2, notional_usd: 2_000_000_000 },
    { pair: 'DXY', price: 100.8, notional_usd: 1_600_000_000 },
    { pair: 'DXY', price: 100.1, notional_usd: 900_000_000 },
    { pair: 'EURUSD', price: 1.14, notional_usd: 5_000_000_000 },
  ],
}, 'DXY', W.cutoffUtc);
if (!good.arena || good.arena.floor !== 99.2 || good.arena.ceiling !== 100.8 || good.missingToken !== null)
  throw new Error(`P7_ARENA_FAIL: ${JSON.stringify(good.arena)}`);
if (good.levels.length !== 2) throw new Error('P7_LEVELS_FAIL');
console.log(`P7_EXCHANGE_ARENA_OK floor=${good.arena.floor} ceiling=${good.arena.ceiling} walls=${good.arena.walls}`);
// Adversarial: post-cutoff snapshot refuses by name.
try {
  pillar7Exchange({ source: 'CME', published_at: W.cutoffUtc + H, walls: [{ pair: 'DXY', price: 99, notional_usd: 2e9 }] }, 'DXY', W.cutoffUtc);
  throw new Error('P7_CUTOFF_ADVERSARIAL_FAIL');
} catch (e) {
  if ((e as Error).message.includes('P7_CUTOFF_ADVERSARIAL_FAIL')) throw e;
  if (!(e as Error).message.includes('P7_AFTER_CUTOFF')) throw e;
  console.log('P7_AFTER_CUTOFF_REJECTED');
}
// Named absence: no tier-1 wall -> arena null + P7_NO_TIER1_WALL + missing_data row.
const thin = pillar7Exchange({
  source: 'CME',
  published_at: W.cutoffUtc - H,
  walls: [{ pair: 'DXY', price: 99.5, notional_usd: 800_000_000 }],
}, 'DXY', W.cutoffUtc);
if (thin.arena !== null || thin.missingToken !== 'P7_NO_TIER1_WALL' || !thin.missing?.length)
  throw new Error(`P7_THIN_FAIL: ${JSON.stringify(thin)}`);
console.log('P7_NO_TIER1_WALL_NAMED');
// Acquisition failure path is named, never a silent option-wall fallback.
const missing = p7ExchangeSourceMissing('ICE feed unreachable for the M1 run');
if (missing.missingToken !== 'P7_EXCHANGE_SOURCE_MISSING') throw new Error('P7_MISSING_TOKEN_FAIL');
console.log('P7_EXCHANGE_SOURCE_MISSING_NAMED');
