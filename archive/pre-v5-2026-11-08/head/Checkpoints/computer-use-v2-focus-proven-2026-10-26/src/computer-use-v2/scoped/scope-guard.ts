// ═══ SCOPE GUARD — THE CHOKEPOINT (production-runtime hardening) ═══
//
// WHY THIS FILE EXISTS. Every mechanism in this boilerplate is a PATH decision:
// where does this session's state live, and which DB do we open. A path decision
// that is not validated is the exact class this boilerplate was extracted to kill
// ("the no-global-file ruling"). Before this guard there was no SINGLE place that
// every path converged on — each function trusted its input.
//
// THE HARDENING LAWS (from production-runtime-hardening):
//   L1  ONE CHOKEPOINT. Every path/identifier the module returns or interpolates
//       passes through a function HERE. Not per-call-site checks.
//   L2  NAMED, READABLE REFUSAL. Never a bare TypeError, never a silent fallback.
//   L3  FAIL CLOSED. A refusal throws; it never returns a substitute.
//   L4  CONTAINMENT, not equality. A child is inside a parent by path RELATIVE
//       resolution — never a string prefix (defect 7: a denylist naming
//       "Shared_Workspace" missed the protected repo that lives INSIDE it).
//
// ── WHY exact-match refusal and not a /tmp ban ──────────────────────────────
// Legitimate projects live under /tmp during tests (mkdtemp), and the sanctioned
// BUN_TEST isolation file lives in /tmp. The violation is a state/DB rooted AT a
// shared global directory — so the guard refuses the DIRECTORY ITSELF, never a
// descendant. `/tmp` is refused; `/tmp/wss-bp-abc/proj` is a legitimate project.

import * as path from 'node:path';
import * as os from 'node:os';

/** Directories that must never HOST workspace state (the shared-global-file law). */
export const SHARED_GLOBAL_ROOTS: readonly string[] = [
  '/', '/tmp', '/var', '/etc', '/usr', '/opt', '/root',
  '/dev', '/proc', '/sys', '/run', '/boot', '/home',
];

export class ScopeGuardError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ScopeGuardError';
  }
}

function refuse(what: string, reason: string, value: string): never {
  throw new ScopeGuardError(`[scope-guard] REFUSED ${what}: ${reason} — got "${value}"`);
}

/** Normalize to an absolute, lexically-clean path (no `..`, no trailing slash). */
export function normalizePath(p: string): string {
  return path.resolve(p);
}

/** L1: an input that becomes a state path or a DB dir must be ABSOLUTE.
 *  A relative value resolves against process.cwd() — the cross-workspace spill
 *  class (two sessions in different cwds silently share or split state). */
export function assertAbsolute(p: unknown, what: string): string {
  if (typeof p !== 'string' || p.trim().length === 0) refuse(what, 'not a non-empty string', String(p));
  const v = p.trim();
  if (!path.isAbsolute(v)) refuse(what, 'not an absolute path (a relative path resolves against cwd and spills across workspaces)', v);
  return normalizePath(v);
}

/** L1: a directory that HOSTS workspace state may not BE a shared global root
 *  (exact match) nor the operator's home directory itself. */
export function assertNotSharedGlobal(dir: unknown, what: string): string {
  const d = assertAbsolute(dir, what);
  const home = normalizePath(os.homedir());
  for (const root of SHARED_GLOBAL_ROOTS) {
    if (d === normalizePath(root)) {
      refuse(what, `"${root}" is a SHARED GLOBAL directory — workspace state must be project-scoped (the no-global-file law)`, d);
    }
  }
  if (d === home) {
    refuse(what, 'the home directory itself is not project-scoped — use a subdirectory', d);
  }
  return d;
}

/** L4: containment by RELATIVE resolution, never a string prefix.
 *  Returns the normalized child when it is inside `parent`; refuses otherwise
 *  (including the parent itself and any `..` escape). */
export function assertContained(parent: unknown, child: unknown, what: string): string {
  const p = assertAbsolute(parent, `${what} (parent)`);
  const c = assertAbsolute(child, `${what} (child)`);
  const rel = path.relative(p, c);
  if (rel === '') refuse(what, 'the child IS the parent — joins must add a segment', c);
  if (rel === '..' || rel.startsWith('..' + path.sep) || path.isAbsolute(rel)) {
    refuse(what, `escapes its scope root "${p}"`, c);
  }
  return c;
}

/** L1: SQL identifiers are INTERPOLATED into the statement text (they cannot be
 *  bound as parameters). An unvalidated identifier is an injection. */
const IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;
export function assertIdentifier(name: unknown, what: string): string {
  if (typeof name !== 'string' || !IDENTIFIER.test(name)) {
    refuse(what, 'not a valid SQL identifier ([A-Za-z_][A-Za-z0-9_]*)', String(name));
  }
  return name;
}

/** Validate a whole identifier set at once (table + columns). */
export function assertIdentifiers(names: readonly unknown[], what: string): string[] {
  return names.map((n) => assertIdentifier(n, what));
}
