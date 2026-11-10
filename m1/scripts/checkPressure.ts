// checkPressure.ts — P3.TURN-07 gate. Deterministic battle fixtures (test data).
import { buildPressure } from '../src/organs/pressure';
import type { TouchEvent, OrganZone } from '../src/organs/candlePressure';

let fail = 0;
const UNIT = 1;
const zone: OrganZone = { lo: 100, hi: 100.1, side: 'demand' };
let t = 1000;
const ev = (kind: TouchEvent['kind'], pierce = false, gap = false): TouchEvent => ({
  time: t++, kind, pre_side: 'above', test_bar_id: t, exit_bar_id: null, pierce, reclaim: kind === 'SWEEP', gap_through: gap,
});

// Lifecycle: 0->VIRGIN 1->ACTIVE_1 2->ACTIVE_2 3->DEPLETED 4+ hold->FORTRESS pierced->BROKEN.
{
  const got = [
    buildPressure(zone, [], [], UNIT).lifecycle,
    buildPressure(zone, [ev('WICK_REJECT')], [], UNIT).lifecycle,
    buildPressure(zone, [ev('WICK_REJECT'), ev('BODY_DEFEND')], [], UNIT).lifecycle,
    buildPressure(zone, [ev('WICK_REJECT'), ev('BODY_DEFEND'), ev('SWEEP')], [], UNIT).lifecycle,
    buildPressure(zone, [ev('WICK_REJECT'), ev('BODY_DEFEND'), ev('SWEEP'), ev('CONSOL_DWELL')], [], UNIT).lifecycle,
  ];
  const want = ['VIRGIN', 'ACTIVE_1', 'ACTIVE_2', 'DEPLETED', 'FORTRESS'];
  if (got.join(',') === want.join(',')) console.log(`PRESSURE_LIFECYCLE_OK ${got.join(',')}`);
  else { console.log(`PRESSURE_LIFECYCLE_FAIL got=${got.join(',')}`); fail = 1; }
}
// FORTRESS holds without pierce; any pierce -> BROKEN (terminal over count).
{
  t = 2000;
  const fort = buildPressure(zone, [ev('WICK_REJECT'), ev('BODY_DEFEND'), ev('SWEEP'), ev('CONSOL_DWELL')], [], UNIT);
  const brok = buildPressure(zone, [ev('WICK_REJECT'), ev('SWEEP', true)], [], UNIT);
  if (fort.lifecycle === 'FORTRESS' && !fort.pierced) console.log('PRESSURE_FORTRESS_OK');
  else { console.log(`PRESSURE_FORTRESS_FAIL lifecycle=${fort.lifecycle} pierced=${fort.pierced}`); fail = 1; }
  if (brok.lifecycle === 'BROKEN' && brok.pierced) console.log('PRESSURE_BROKEN_OK');
  else { console.log(`PRESSURE_BROKEN_FAIL lifecycle=${brok.lifecycle}`); fail = 1; }
}
// SHIELD: nearest front-side liquidity within 20 pips -> SHIELD_FUEL, else PRESSURE_STRUCTURE.
{
  t = 3000;
  const withShield = buildPressure(zone, [ev('WICK_REJECT')], [100.25], UNIT);
  const without = buildPressure(zone, [ev('WICK_REJECT')], [], UNIT);
  if (withShield.shield === 100.25 && withShield.operativeDefense === 'SHIELD_FUEL') console.log('PRESSURE_SHIELD_OK');
  else { console.log(`PRESSURE_SHIELD_FAIL shield=${withShield.shield} def=${withShield.operativeDefense}`); fail = 1; }
  if (without.shield === null && without.operativeDefense === 'PRESSURE_STRUCTURE') console.log('PRESSURE_STRUCTURE_OK');
  else { console.log('PRESSURE_STRUCTURE_FAIL'); fail = 1; }
}
// Gap-through PASS_THROUGH is not a battle: 3 gaps + 1 real -> ACTIVE_1, not DEPLETED.
{
  t = 4000;
  const battles = [ev('WICK_REJECT'), ev('PASS_THROUGH', false, true), ev('PASS_THROUGH', false, true), ev('PASS_THROUGH', false, true)];
  const out = buildPressure(zone, battles, [], UNIT);
  if (out.battles === 1 && out.lifecycle === 'ACTIVE_1') console.log('PRESSURE_GAP_NOT_BATTLE');
  else { console.log(`PRESSURE_GAP_NOT_BATTLE_FAIL battles=${out.battles} lifecycle=${out.lifecycle}`); fail = 1; }
}
process.exit(fail);
