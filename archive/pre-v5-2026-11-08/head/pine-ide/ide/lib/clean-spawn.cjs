'use strict';
/**
 * clean-spawn.cjs — spawn a child that inherits NO descriptor beyond its stdio (RT-3, generalised).
 *
 * MEASURED 2026-09-29: Chromium's devtools listener (:9225) in the Electron main is NOT
 * close-on-exec, so EVERY child the main spawned inherited it (the pine station, the VIL rail,
 * the broker rail, the journal's pnpm + next-server, weston). After the app exited, next-server
 * still held :9225 LISTEN — the next app instance could not bind its devtools port and every CDP
 * connection hung in a dead process's accept queue.
 *
 * Mechanism: bash closes every fd >= the stdio count, then `exec "$0" "$@"` replaces itself with
 * the program — the pid the caller tracks IS the program's pid (group kills still work).
 */
const { spawn } = require('child_process');

function closeLoop(keep) {
  return `for fd in $(ls /proc/$$/fd); do if [ "$fd" -ge ${keep} ]; then eval "exec $fd>&-" 2>/dev/null; fi; done`;
}

/**
 * THE LIFELINE (RT-12, measured 2026-09-29): a wedged or SIGKILLed app main left every child running
 * (pine station, VIL rail, broker rail, pnpm + next-server) — the app's teardown code never ran.
 * With `lifeline: true` the child's stdin is a pipe from the app; a watcher reads it, and EOF — which
 * the kernel delivers the moment the app dies, however it dies — signals the program's whole tree.
 * The tracked pid is then the supervising bash (a detached child leads its group, so group kills
 * still reach the program; a non-detached one forwards TERM/INT/HUP to it through its trap).
 */
function lifelineScript(keep) {
  return [
    closeLoop(keep),
    '"$0" "$@" </dev/null & c=$!',
    "trap 'kill -TERM $c 2>/dev/null' TERM INT HUP",
    // bash gives a background job /dev/null as stdin (no job control) — the watcher would read EOF at
    // once. Hand it the REAL stdin (the app's pipe) through fd 3 explicitly.
    'exec 3<&0',
    '( cat <&3 >/dev/null; kill -TERM $$ 2>/dev/null ) &',
    'exec 3<&-',
    'while kill -0 $c 2>/dev/null; do wait $c; done',
  ].join('\n'); // newlines, not '; ' — `cmd &;` is a bash syntax error (RT-12, traced)
}

function cleanSpawn(file, args, opts) {
  const o = Object.assign({}, opts || {});
  const lifeline = !!o.lifeline;
  delete o.lifeline;
  if (lifeline) {
    const stdio = Array.isArray(o.stdio) ? o.stdio.slice() : ['ignore', 'ignore', 'ignore'];
    stdio[0] = 'pipe';
    o.stdio = stdio;
  }
  const keep = Array.isArray(o.stdio) ? o.stdio.length : 3;
  const script = lifeline ? lifelineScript(keep) : `${closeLoop(keep)}; exec "$0" "$@"`;
  const child = spawn('/bin/bash', ['-c', script, String(file), ...(args || []).map(String)], o);
  // The app keeps the write end open and never writes; it must never be half-closed by accident.
  if (lifeline && child.stdin) child.stdin.on('error', function () { /* the child is gone */ });
  return child;
}

/** Signal a child synchronously: its process group first (detached children lead one), then the pid. */
/** The process-group id of a pid, from /proc/<pid>/stat (field 5), or null. */
function pgidOf(n) {
  try {
    const st = require('fs').readFileSync('/proc/' + n + '/stat', 'utf8');
    const after = st.slice(st.lastIndexOf(')') + 2).split(' ');
    return Number(after[2]);
  } catch (e) { return null; }
}

function killTree(pid, sig) {
  const n = Number(pid);
  if (!Number.isInteger(n) || n <= 1) return false;
  let hit = false;
  // audit H6: signal group -n ONLY when n leads its own group (a detached child). A non-detached
  // child shares the app's group and is not a leader; a recycled pid could lead an unrelated group.
  if (pgidOf(n) === n) { try { process.kill(-n, sig || 'SIGTERM'); hit = true; } catch (e) { /* gone */ } }
  try { process.kill(n, sig || 'SIGTERM'); hit = true; } catch (e) { /* already gone */ }
  return hit;
}

module.exports = { cleanSpawn, closeLoop, killTree, lifelineScript };
