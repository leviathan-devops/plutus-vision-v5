// OHLC-Intelligence-Lexicon-v1.0 — tests/per-machine.test.ts
// The per-machine behavior skeletons: every machine MUST have a case that CLASSIFIES
// (the FOR evidence fires — the classify case) + a case that REJECTS (the block CAN
// fire — a firewall that never fires is theater). Every fixture is hand-computed.
import { candlePressureMachine, candleShapeMachine, zoneClassificationMachine, zonePressureMachine, shapeChainMachine, obviousTradesMachine } from '../src/machines/index';
import {
  phantomFixture, rejectedZoneFixture, defendFixture, noReactionTouchFixture,
  ssFixture, noMatchShapeFixture, virginBoMFixture, rejectedPressureFixture,
  ssToBsFixture, emptyChainFixture, obviousLongFixture, emptyTradesFixture,
} from './fixtures';

const CASES: Array<{ machine: any; data: any; expectClassify: boolean }> = [
  { machine: zoneClassificationMachine, data: phantomFixture(), expectClassify: true },         // the phantom BoM all-4 → FORTRESS
  { machine: zoneClassificationMachine, data: rejectedZoneFixture(), expectClassify: false },   // the REJECT totality → REJECT
  { machine: candlePressureMachine, data: defendFixture(), expectClassify: true },              // the body defended the level
  { machine: candlePressureMachine, data: noReactionTouchFixture(), expectClassify: false },    // no family's FOR evidence fires
  { machine: candleShapeMachine, data: ssFixture(), expectClassify: true },                     // the SS consolidation signature
  { machine: candleShapeMachine, data: noMatchShapeFixture(), expectClassify: false },          // no shape piece matches
  { machine: zonePressureMachine, data: virginBoMFixture(), expectClassify: true },             // the VIRGIN BoM (the ENTRY-PRIMARY +40)
  { machine: zonePressureMachine, data: rejectedPressureFixture(), expectClassify: false },     // the REJECT zone has no pressure state
  { machine: shapeChainMachine, data: ssToBsFixture(), expectClassify: true },                  // the SS→BS breakout step
  { machine: shapeChainMachine, data: emptyChainFixture(), expectClassify: false },             // no chain step fires
  { machine: obviousTradesMachine, data: obviousLongFixture(), expectClassify: true },          // the forward-reasoning aggregate
  { machine: obviousTradesMachine, data: emptyTradesFixture(), expectClassify: false },         // no projection FOR evidence
];

export function runPerMachine(): { pass: number; fail: number; failures: string[] } {
  let pass = 0, fail = 0;
  const failures: string[] = [];
  for (const c of CASES) {
    const res = c.machine.classify({ data: c.data });
    const classified = res.action === 'classify';
    if (classified === c.expectClassify) pass++;
    else {
      fail++;
      failures.push(`${c.machine.id}: expected classify=${c.expectClassify} got ${classified} (conf ${res.confidence.toFixed(2)}, intent ${res.intent})`);
    }
  }
  return { pass, fail, failures };
}

console.log(runPerMachine());
