// checkOptions.ts - P2.TURN-04 gate. P3/P8 decimal conversion: K = DXY_ref * EURUSD^0.576 exactly,
// tier order (>=1.5B -> 1, >=850M -> 2, else 3 audit-only), native pair strikes stay in pair space,
// tier-3 rows never become levels.
import { readFileSync } from 'node:fs';
import { pillar3and8, tierOf, type Expiry, type Extraction } from '../src/options';

const ROOT = new URL('../..', import.meta.url).pathname;
const real = JSON.parse(readFileSync(`${ROOT}m1/evidence/protocol-a/extraction.json`, 'utf8')) as Extraction;
// Controlled probe: spot pinned so every expected value is hand-computable.
const probe: Extraction = { ...real, expiries: [], spot_at_publication: { EURUSD: 1.10 } };
const inp = (asset: 'DXY' | 'EURUSD', expiries: Expiry[]) =>
  pillar3and8({ extraction: { ...probe, expiries }, asset, unit: asset === 'DXY' ? 0.01 : 0.0001,
    dxyRef: asset === 'DXY' ? 100 : null, dxyRefAt: 'probe', spotSource: 'probe', h10Status: 'probe' });
// K exactness: 100 * 1.10^0.576.
const empty = inp('DXY', []);
const K = 100 * Math.pow(1.10, 0.576);
if (empty.K === null || Math.abs(empty.K - K) > 1e-9) throw new Error(`P3_K_FAIL: K=${empty.K} expected ${K}`);
// Component conversion exactness: EURUSD strike 1.1234, spot 1.10, w=-0.576 -> 100*(1.1234/1.10)^-0.576.
const e: Expiry = { date: '2026-07-10', cut: '10am NY', pair: 'EURUSD', notional_ccy: 'EUR',
  strikes: [[1.1234, 2.0e9], [1.1300, 1.0e9], [1.1350, 5.0e8]] };
const dxy = inp('DXY', [e]);
const exact = 100 * Math.pow(1.1234 / 1.10, -0.576);
const got = dxy.conversions.find(c => c.strike === 1.1234)!;
if (Math.abs(got.level - exact) > 1e-9) throw new Error(`P3_K_FAIL: converted ${got.level} != ${exact}`);
console.log(`P3_K_EXACT K=${empty.K.toFixed(6)}=100*1.10^0.576; strike 1.1234 -> DXY ${got.level.toFixed(6)}=100*(1.1234/1.10)^-0.576`);
// Tier order: 2.0bn EUR -> T1; 1.0bn EUR -> T2; 0.5bn EUR -> T3 (P8 tiers on the EUR notional).
const tiers = dxy.conversions.map(c => c.tier);
if (!(tiers[0] === 1 && tiers[1] === 2 && tiers[2] === 3)) throw new Error(`P3_TIER_ORDER_FAIL: ${tiers}`);
if (tierOf(1.5e9) !== 1 || tierOf(1.4999e9) !== 2 || tierOf(849e6) !== 3) throw new Error('P3_TIER_ORDER_FAIL: tierOf boundary');
console.log(`P3_TIER_ORDER_OK tiers=${tiers.join(',')}; boundaries 1.5e9->1, 1.4999e9->2, 849e6->3`);
// Tier 3 audit-only: the 0.5bn strike is in conversions and NOT in levels.
if (dxy.levels.some(l => l.meta?.strike === 1.1350)) throw new Error('P3_TIER3_FAIL: tier-3 strike became a level');
if (!dxy.conversions.some(c => c.strike === 1.1350)) throw new Error('P3_TIER3_FAIL: tier-3 row missing from audit');
console.log('P3_TIER3_AUDIT_ONLY 0.5bn strike audited in conversions, absent from levels');
// Native map: identity strikes, P8, K null.
const nat = inp('EURUSD', [e]);
if (nat.K !== null) throw new Error('P8_NATIVE_FAIL: K must be null on the native map');
const n1 = nat.conversions.find(c => c.strike === 1.1234)!;
if (n1.level !== 1.1234) throw new Error(`P8_NATIVE_FAIL: ${n1.level} != 1.1234`);
if (!nat.levels.every(l => l.pillar === 'P8')) throw new Error('P8_NATIVE_FAIL: EURUSD strikes must be P8');
console.log('P8_NATIVE_STRIKE_OK EURUSD 1.1234 stays 1.1234 (identity, P8, K=null)');
// Real fixture: the committed extraction yields tier<=2 EURUSD levels.
const realNat = pillar3and8({ extraction: real, asset: 'EURUSD', unit: 0.0001, dxyRef: null, dxyRefAt: 'n/a', spotSource: real.published_at, h10Status: 'fixture' });
if (!realNat.levels.length) throw new Error('P8_NATIVE_FAIL: real fixture produced zero EURUSD levels');
console.log(`P8_REAL_FIXTURE ${realNat.levels.length} tier<=2 EURUSD levels from the committed extraction`);
