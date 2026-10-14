/**
 * canon.mjs — THE CANON PINE SOURCE, BY PATH + SHA.
 *
 * CANON IS LAW (SHELL_ANCHOR §16, operator ruling 2026-09-29): the pipeline's
 * E1/E2/E3 render goes through the CANON indicator — never a bespoke render and
 * never a re-derived number. So the station does not carry a copy of the canon
 * script: it READS THE CANON FILE FROM DISK, reports its sha256, and runs it.
 * A caller that wants the canon render asks for `canon: true` and gets the file
 * the repo actually holds, identified by hash.
 *
 * MEASURED 2026-09-29 (this station): the canon v8 (v6, 668 lines) runs under
 * PineTS 0.10.0 in ~400–500 ms per pair on the 1H fixture, emitting 11 boxes,
 * 12 labels, 7 lines and 1 table for each of DXY / EUR·USD / GBP·USD — but ONLY
 * when PineTS is constructed with a provider (see bars.mjs `makeProvider`): with
 * a raw bar array `context.pine.syminfo` is undefined and the canon script's
 * `syminfo.ticker` read throws.
 *
 * Override the path for a fixture/verification run: PLUTUS_CANON_PINE=/abs/path
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const LIVE_ROOT = process.env.PLUTUS_LIVE_ROOT
  || '/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS/LIVE';

export const CANON_PINE = process.env.PLUTUS_CANON_PINE
  || path.resolve(LIVE_ROOT, '..', 'Original_Canon_Data', 'Pine Scripts', 'trident_v8.pine');

export function sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

/** Identity of the canon artifact — path, hash, size, line count, Pine version. */
export function canonInfo() {
  if (!fs.existsSync(CANON_PINE)) {
    return { present: false, path: CANON_PINE, sha256: null, code: 'CANON_PINE_ABSENT' };
  }
  const buf = fs.readFileSync(CANON_PINE);
  const text = buf.toString('utf8');
  const version = (text.match(/^\s*\/\/@version\s*=\s*(\d+)/m) || [, null])[1];
  const title = (text.match(/\b(?:indicator|strategy)\s*\(\s*["']([^"']*)["']/) || [, null])[1];
  return {
    present: true,
    path: CANON_PINE,
    sha256: sha256(buf),
    bytes: buf.length,
    lines: text.split('\n').length,
    version: version ? `v${version}` : null,
    title,
  };
}

/** The canon source itself (read fresh every call — the file is the truth). */
export function canonSource() {
  const info = canonInfo();
  if (!info.present) {
    throw Object.assign(new Error(`canon Pine indicator absent at ${CANON_PINE}`), { code: 'CANON_PINE_ABSENT' });
  }
  const script = fs.readFileSync(CANON_PINE, 'utf8');
  return { info, script, sha256: info.sha256 };
}

/** Hash of ANY supplied source — so an overlay is identified as precisely as the canon. */
export function sourceSha(src) {
  return sha256(Buffer.from(String(src || ''), 'utf8'));
}
