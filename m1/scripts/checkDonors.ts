// checkDonors.ts — P3.TURN-01 gate. No imports from organs (pure fs + crypto).
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';

const DIR = 'm1/donors/v453/reference';
const PROV = `${DIR}/PROVENANCE.json`;
const EXPECTED = ['lmv.ts.txt', 'lqz-matrix.ts.txt', 'freshness.ts.txt', 'zone-pressure.ts.txt', 'obcv.ts.txt', 'bom-mom.ts.txt', 'ob-engine.ts.txt', 'shape-brain.ts.txt', 'storyline-engine.ts.txt'];
const REF_ONLY = ['ob-engine', 'shape-brain', 'storyline-engine'];

let fail = 0;

// 1. File set exact: nine .txt copies, zero executable .ts.
const files = existsSync(DIR) ? readdirSync(DIR).filter((f) => f.endsWith('.txt')).sort() : [];
const missing = EXPECTED.filter((f) => !files.includes(f));
const extraTs = existsSync(DIR) ? readdirSync(DIR).filter((f) => f.endsWith('.ts')) : [];
if (!missing.length && !extraTs.length) console.log('DONOR_NON_EXECUTABLE_OK');
else { console.log(`DONOR_NON_EXECUTABLE_MISSING missing=[${missing}] ts=[${extraTs}]`); fail = 1; }

// 2. SHA provenance: disk bytes == PROVENANCE entry == read-only source bytes.
try {
  const prov = JSON.parse(readFileSync(PROV, 'utf8')) as { source_root: string; files: { source: string; copy: string; sha256: string }[] };
  let allOk = true;
  for (const f of prov.files) {
    const disk = createHash('sha256').update(readFileSync(`${DIR}/${f.copy}`)).digest('hex');
    const src = createHash('sha256').update(readFileSync(`${prov.source_root}/${f.source}`)).digest('hex');
    if (disk !== f.sha256 || disk !== src) { allOk = false; console.log(`DONOR_SHA_MISMATCH ${f.copy} prov=${f.sha256} disk=${disk} src=${src}`); }
  }
  if (prov.files.length === EXPECTED.length && allOk) console.log('DONOR_SHA_OK');
  else { console.log(`DONOR_SHA_FAIL entries=${prov.files.length} allOk=${allOk}`); fail = 1; }
} catch (e) { console.log(`DONOR_SHA_FAIL ${(e as Error).message}`); fail = 1; }

// 3. No runtime import resolves into m1/donors (scan all .ts outside donors; this gate's own grep string excluded).
const hits = execSync(`grep -rn 'm1/donors' --include='*.ts' m1/src m1/scripts 2>/dev/null || true`, { encoding: 'utf8' })
  .trim().split('\n').filter(Boolean).filter((l) => !l.includes('checkDonors.ts'));
if (!hits.length) console.log('DONOR_NO_RUNTIME_IMPORT');
else { console.log(`DONOR_RUNTIME_IMPORT_FOUND\n${hits.join('\n')}`); fail = 1; }

// 4. Reference-only brains have no .ts anywhere under m1 (neither donors nor organs).
const stray = REF_ONLY.filter((b) => existsSync(`${DIR}/${b}.ts`) || existsSync(`m1/src/organs/${b}.ts`));
if (!stray.length) console.log('DONOR_FORBIDDEN_FILES_ABSENT');
else { console.log(`DONOR_FORBIDDEN_FILES_PRESENT [${stray}]`); fail = 1; }

process.exit(fail);
