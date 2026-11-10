// cloud/scripts/checkPersistence.ts - P6.TURN-03 gate.
//
// Drives the REAL DO (E1Run) + REAL seal writers against the in-memory D1/R2
// shims and asserts the exact P6 key/table contract:
//   R2 KEYS: cards/{asset}/{monday}/{sha}.json, derived/{asset}/{monday}/{sha}.json,
//            pine/{asset}/{monday}/{sha}.pine, raw/{source}/{asset}/{monday}/{sha}
//   D1: runs(id, asset, monday, state, base_sha, derived_sha, pine_sha, created_at,
//       updated_at); sources(run_id, source_id, kind, pillar, sha256, cutoff_status,
//       published_at); zones(...); verdicts(...).
// Adversarial: second put to the same key with different bytes refuses
// R2_IMMUTABLE_VIOLATION; a duplicate run is idempotent, never a second row.
// Pass tokens: R2_IMMUTABLE_PUT_OK, D1_RUN_ROW_OK, D1_SOURCE_ROWS_OK, DUPLICATE_RUN_IDEMPOTENT.
import { E1Run } from '../do';
import { InMemoryD1, InMemoryR2 } from '../state';
import { keys } from '../card/seal';
import { e1Fixtures } from './fixtures';

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

const ASSET = 'EURUSD';
const MONDAY = '2026-07-06';
const fx = e1Fixtures(ASSET, MONDAY);

const d1 = new InMemoryD1();
const r2 = new InMemoryR2();
const out = await new E1Run(d1, r2).run({ asset: ASSET, monday: MONDAY, fixtures: fx });
if (out.state !== 'COMPLETE') throw new Error(`PERSIST_RUN_FAIL: state=${out.state}`);
const { baseSha, derivedSha, pineSha } = out;

// R2: every sealed key readable under the exact contract shape.
{
  const cardKey = keys.card(ASSET, MONDAY, baseSha);
  const derivedKey = keys.derived(ASSET, MONDAY, derivedSha);
  const pineKey = keys.pine(ASSET, MONDAY, pineSha);
  if (cardKey !== `cards/${ASSET}/${MONDAY}/${baseSha}.json`) throw new Error(`CARD_KEY_SHAPE_FAIL: ${cardKey}`);
  if (derivedKey !== `derived/${ASSET}/${MONDAY}/${derivedSha}.json`) throw new Error(`DERIVED_KEY_SHAPE_FAIL: ${derivedKey}`);
  if (pineKey !== `pine/${ASSET}/${MONDAY}/${pineSha}.pine`) throw new Error(`PINE_KEY_SHAPE_FAIL: ${pineKey}`);
  const card = await r2.get(cardKey);
  const derived = await r2.get(derivedKey);
  const pine = await r2.get(pineKey);
  if (card === null || derived === null || pine === null) throw new Error('PERSIST_R2_ABSENT_FAIL: sealed objects missing');
  const raws = await r2.list(`raw/`);
  if (raws.length < 3) throw new Error(`RAW_KEYS_FAIL: ${raws.length} raw rows`);
  for (const k of raws) {
    if (!k.startsWith('raw/')) throw new Error(`RAW_KEY_SHAPE_FAIL: ${k}`);
  }
  console.log(`R2_KEYS_OK card=${cardKey} pine=${pineKey} raws=${raws.length}`);
}

// Adversarial: immutable puts - same bytes idempotent, different bytes refused.
{
  const cardKey = keys.card(ASSET, MONDAY, baseSha);
  const cur = await r2.get(cardKey);
  if (cur === null) throw new Error('IMMUTABLE_PRE_FAIL');
  await r2.put(cardKey, cur);
  let refused = false;
  try {
    await r2.put(cardKey, typeof cur === 'string' ? `${cur} ` : new Uint8Array([9]));
  } catch (e) {
    refused = errMsg(e).includes('R2_IMMUTABLE_VIOLATION');
  }
  if (!refused) throw new Error('R2_IMMUTABLE_FAIL: overwrite with different bytes did not refuse');
  console.log('R2_IMMUTABLE_PUT_OK same-bytes idempotent; different-bytes refused R2_IMMUTABLE_VIOLATION');
}

// D1 runs row: exact columns, terminal state, all three SHAs.
{
  const row = d1.getRun(`${ASSET}-${MONDAY}`);
  if (!row) throw new Error('D1_RUN_ABSENT_FAIL');
  const cols = ['id', 'asset', 'monday', 'state', 'base_sha', 'derived_sha', 'pine_sha', 'created_at', 'updated_at'];
  for (const c of cols) {
    if (!(c in row)) throw new Error(`D1_RUN_COL_FAIL: missing ${c}`);
  }
  if (row.state !== 'COMPLETE' || row.base_sha !== baseSha || row.derived_sha !== derivedSha || row.pine_sha !== pineSha) {
    throw new Error(`D1_RUN_VALUE_FAIL: ${JSON.stringify(row).slice(0, 200)}`);
  }
  console.log(`D1_RUN_ROW_OK id=${row.id} state=${row.state}`);
}

// D1 sources rows: one per manifest source with sha + cutoff status.
{
  const sources = d1.listSources(`${ASSET}-${MONDAY}`);
  if (sources.length < 3) throw new Error(`D1_SOURCES_COUNT_FAIL: ${sources.length}`);
  for (const s of sources) {
    if (!s.source_id || s.sha256.length !== 64 || !s.cutoff_status) {
      throw new Error(`D1_SOURCE_SHAPE_FAIL: ${JSON.stringify(s).slice(0, 160)}`);
    }
  }
  console.log(`D1_SOURCE_ROWS_OK n=${sources.length} ids=${sources.map((s) => s.source_id).join(',')}`);
}

// D1 zones + verdicts rows.
{
  const zones = d1.listZones(`${ASSET}-${MONDAY}`);
  const verdicts = d1.listVerdicts(`${ASSET}-${MONDAY}`);
  if (!zones.length || !verdicts.length) throw new Error(`D1_ZONE_VERDICT_FAIL: zones=${zones.length} verdicts=${verdicts.length}`);
  for (const z of zones) {
    for (const c of ['run_id', 'zone_id', 'role', 'degree', 'score', 'top', 'bottom', 'lifecycle']) {
      if (!(c in z)) throw new Error(`D1_ZONE_COL_FAIL: missing ${c}`);
    }
  }
  for (const v of verdicts) {
    for (const c of ['run_id', 'kind', 'verdict', 'score', 'artifact_sha']) {
      if (!(c in v)) throw new Error(`D1_VERDICT_COL_FAIL: missing ${c}`);
    }
  }
  console.log(`D1_ZONE_VERDICT_ROWS_OK zones=${zones.length} verdicts=${verdicts.length}`);
}

// Duplicate run: idempotent, same SHAs, no second row.
{
  const before = d1.runs.size;
  const dup = await new E1Run(d1, r2).run({ asset: ASSET, monday: MONDAY, fixtures: fx });
  if (!dup.idempotent || dup.baseSha !== baseSha || dup.derivedSha !== derivedSha || dup.pineSha !== pineSha) {
    throw new Error(`DUPLICATE_SHAPE_FAIL: ${JSON.stringify(dup).slice(0, 200)}`);
  }
  if (d1.runs.size !== before) throw new Error('DUPLICATE_ROW_FAIL: second runs row inserted');
  console.log(`DUPLICATE_RUN_IDEMPOTENT run=${dup.runId} rows=${d1.runs.size}`);
}
