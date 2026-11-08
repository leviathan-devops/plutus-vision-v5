// OHLC-Intelligence-Lexicon-v1.0 — tests/properties.ts
// The property-based skeletons: the confidence range [0,1] + the totality (no throw)
// + the determinism (same data → same verdict, 500 runs) — the MPSE law.
// The theatrical always-pass firewall is a derailment — every machine needs a
// failing case PROVEN here (the per-machine.test.ts carries the block cases).
import { classify, classifyAggregate } from '../src/core/engine';
import { DEFAULT_MACHINES } from '../src/machines/index';
import { phantomFixture, ssFixture, defendFixture, obviousLongFixture, emptyTradesFixture } from './fixtures';

const DATA_CASES = [phantomFixture(), ssFixture(), defendFixture(), obviousLongFixture(), emptyTradesFixture()];

export function runProperties(): { pass: number; fail: number; failures: string[] } {
  let pass = 0, fail = 0;
  const failures: string[] = [];
  for (let run = 0; run < 500; run++) {
    for (const data of DATA_CASES) {
      for (const machine of DEFAULT_MACHINES) {
        // the totality: every machine classifies any LexiconData without throwing
        const a = machine.classify({ data });
        // the confidence range property: pos/(pos+neg+1) is always in [0,1]
        const inRange = a.confidence >= 0 && a.confidence <= 1;
        // the determinism property: same data → same verdict (the 500 re-runs)
        const b = machine.classify({ data });
        const sameVerdict = a.action === b.action && a.confidence === b.confidence && a.intent === b.intent;
        // the MPSE law: the verdicts are the same via the aggregate path too
        const c = machine.id === 'obvious-trades' ? classifyAggregate({ data }, machine.families) : classify({ data }, machine.families);
        const coherent = c.action === a.action;
        if (inRange && sameVerdict && coherent) pass++;
        else {
          fail++;
          if (failures.length < 10) failures.push(`run ${run} ${machine.id}: range=${inRange} same=${sameVerdict} coherent=${coherent} conf=${a.confidence.toFixed(3)} action=${a.action}`);
        }
      }
    }
  }
  return { pass, fail, failures };
}

// run: bun test tests/properties.ts — expect fail === 0
console.log(runProperties());
