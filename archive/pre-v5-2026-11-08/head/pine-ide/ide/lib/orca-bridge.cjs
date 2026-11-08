'use strict';
/**
 * lib/orca-bridge.cjs — THE ORCA TERMINAL BRIDGE (the dashboard ↔ agents running in Orca).
 *
 * Orca owns the agents' terminals (a PTY per agent, each with a runtime handle `term_…`, exported
 * into the agent's own environment as ORCA_TERMINAL_HANDLE). The dashboard never spawns or owns
 * those terminals: it reads their RENDERED screen (`terminal read --screen` — a TUI's stream output
 * is repaint fragments, the screen is what the operator would see) and, when the operator types into
 * the AGENT'S FACE, delivers the text with `terminal send`. The CLI is invoked with execFile and an
 * argv array — no shell, no interpolation.
 *
 * Every failure is named: ORCA_CLI_ABSENT · ORCA_TIMEOUT · ORCA_ERROR (the CLI's own error) ·
 * ORCA_BAD_REPLY (non-JSON) · BAD_HANDLE · SEND_REFUSED (not a bound agent terminal) · TEXT_TOO_LONG.
 */
const { execFile } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const HANDLE_RE = /^term_[A-Za-z0-9-]{8,64}$/;
const MAX_SEND = 4000;

function coded(code, message, extra) { return Object.assign(new Error(`${code}: ${message}`), { code }, extra || {}); }

/** The Orca CLI for THIS host. Never bare `orca` on Linux outside Orca: that is the GNOME screen reader. */
function resolveCli(env) {
  const e = env || process.env;
  if (e.ORCA_CLI_COMMAND) {
    // an explicit override must be an absolute path to an executable — never a PATH lookup or an argv string
    const c = e.ORCA_CLI_COMMAND;
    let okExec = false;
    try { fs.accessSync(c, fs.constants.X_OK); okExec = path.isAbsolute(c) && fs.statSync(c).isFile(); } catch (err) { okExec = false; }
    if (!okExec) throw coded('ORCA_CLI_INVALID', `ORCA_CLI_COMMAND=${JSON.stringify(c).slice(0, 80)} is not an absolute executable file`);
    try { return fs.realpathSync(c); } catch (err) { throw coded('ORCA_CLI_INVALID', `ORCA_CLI_COMMAND vanished after the check (${err.code || err.message})`); }
  }
  // an ABSOLUTE binary from fixed locations only — never a PATH lookup (a poisoned PATH cannot hijack it)
  for (const c of [path.join(os.homedir(), '.local', 'bin', 'orca-ide'), '/usr/local/bin/orca-ide', '/usr/bin/orca-ide', '/opt/orca/orca-ide']) {
    // a symlink is accepted only when its REAL target is an executable regular file
    // the RESOLVED file is what is executed (a link swapped after the check cannot redirect the exec)
    try { const real = fs.realpathSync(c); fs.accessSync(real, fs.constants.X_OK); if (fs.statSync(real).isFile()) return real; } catch (e) { /* next */ }
  }
  return null; // ORCA_CLI_ABSENT is named at call time — the API still mounts without Orca
}

function createOrcaBridge(opts) {
  const o = opts || {};
  let explicitCli = null;
  if (o.cli) { // an explicit cli passes the SAME absolute-executable rule as ORCA_CLI_COMMAND; its REAL path is executed
    try { const real = fs.realpathSync(o.cli); fs.accessSync(real, fs.constants.X_OK); if (path.isAbsolute(o.cli) && fs.statSync(real).isFile()) explicitCli = real; } catch (e) { explicitCli = null; }
    if (!explicitCli) throw coded('ORCA_CLI_INVALID', `cli ${JSON.stringify(String(o.cli)).slice(0, 80)} is not an absolute executable file`);
  }
  const cli = explicitCli || resolveCli(o.env);
  const need = () => { if (!cli && !o.run) throw coded('ORCA_CLI_ABSENT', 'no orca-ide in ~/.local/bin, /usr/local/bin, /usr/bin or /opt/orca'); };
  const timeoutMs = Number.isFinite(o.timeoutMs) && o.timeoutMs > 0 ? o.timeoutMs : 8000;
  const run = o.run || function (args) {
    need();
    return new Promise(function (resolve, reject) {
      const env = Object.assign({}, process.env);
      delete env.ELECTRON_RUN_AS_NODE; // the orca CLI is itself an Electron app: it must NOT run as node
      execFile(cli, args.concat(['--json']), { timeout: timeoutMs, maxBuffer: 8 * 1024 * 1024, env: env }, function (err, stdout, stderr) {
        if (err && err.code === 'ENOENT') return reject(coded('ORCA_CLI_ABSENT', `${cli} not found`));
        if (err && /maxBuffer/i.test(String(err.message || err.code || ''))) return reject(coded('ORCA_BAD_REPLY', `${args.slice(0, 2).join(' ')} output exceeded 8 MB`));
        if (err && err.killed) return reject(coded('ORCA_TIMEOUT', `${args.slice(0, 2).join(' ')} exceeded ${timeoutMs}ms`));
        let body = null;
        try { body = JSON.parse(String(stdout || '').trim() || 'null'); } catch (e) { /* examined below */ }
        if (!body) return reject(coded(err ? 'ORCA_ERROR' : 'ORCA_BAD_REPLY', String(stderr || stdout || (err && err.message) || 'no output').trim().slice(0, 300)));
        // a NON-ZERO exit is a failure even when it printed JSON (never resolve a failed CLI as success)
        if (err) return reject(coded('ORCA_ERROR', `exit ${err.code}: ${String((body.error && (body.error.message || body.error)) || stderr || 'no error text').slice(0, 300)}`, { orca: body.error || null }));
        if (typeof body !== 'object' || Array.isArray(body)) return reject(coded('ORCA_BAD_REPLY', `unexpected reply: ${String(stdout).slice(0, 120)}`));
        if (body.ok === false || body.error) {
          const m = body.error && (body.error.message || body.error.code || body.error);
          return reject(coded('ORCA_ERROR', String(m).slice(0, 300), { orca: body.error }));
        }
        resolve(body.result !== undefined ? body.result : body);
      });
    });
  };

  function checkHandle(h) { if (!HANDLE_RE.test(String(h || ''))) throw coded('BAD_HANDLE', `not an Orca terminal handle: ${JSON.stringify(String(h)).slice(0, 60)}`); }

  return {
    cli,
    /** Every terminal Orca knows, trimmed to what the face needs. */
    async listTerminals() {
      const r = await run(['terminal', 'list']);
      if (!r || !Array.isArray(r.terminals)) throw coded('ORCA_BAD_REPLY', 'terminal list: no terminals array');
      return r.terminals.filter(function (t) { return t && typeof t === 'object' && HANDLE_RE.test(String(t.handle || '')); }).map(function (t) {
        return { handle: t.handle, title: t.title || '', worktreePath: t.worktreePath || '', connected: !!t.connected, writable: !!t.writable, lastOutputAt: t.lastOutputAt || null };
      });
    },
    /** The RENDERED screen (lines) of one terminal. */
    async screen(handle) {
      checkHandle(handle);
      const r = await run(['terminal', 'read', '--terminal', handle, '--screen']);
      const t = r && (r.terminal || r);
      if (!t || typeof t !== 'object' || !Array.isArray(t.tail)) throw coded('ORCA_BAD_REPLY', `terminal read: no tail for ${handle}`);
      return { handle, status: t.status || null, lines: t.tail, source: t.source || null };
    },
    /** Deliver text into ONE terminal — only a handle the caller vouches is bound (the allowlist). */
    async send(handle, text, sendOpts) {
      const so = sendOpts || {};
      checkHandle(handle);
      // FAIL CLOSED: a caller that supplies no allowlist can send nowhere (audit 2cad66fa)
      // awaited: an async predicate's pending Promise is never mistaken for 'allowed'
      let allowedOk = false;
      try { allowedOk = typeof so.allowed === 'function' && (await so.allowed(handle)) === true; } catch (e) { allowedOk = false; } // a throwing predicate refuses
      if (!allowedOk) throw coded('SEND_REFUSED', `${handle} is not bound to an agent workspace`);
      const s = String(text == null ? '' : text);
      if (s.length > MAX_SEND) throw coded('TEXT_TOO_LONG', `${s.length} > ${MAX_SEND} chars`);
      if (s.includes('\0')) throw coded('TEXT_HAS_NUL', 'a NUL byte cannot travel in an argv'); // named, never a raw TypeError
      // an empty send (a bare Enter into an agent's PTY) is refused unless explicitly asked for
      if (!s.length && so.allowEmpty !== true) throw coded('SEND_EMPTY', 'nothing to send');
      const args = ['terminal', 'send', '--terminal', handle];
      // ONE token: '--text=VALUE'. Measured 2026-09-30: the orca CLI parses a separate value that starts
      // with '-' as a FLAG ('--text --version' -> Unknown flag; '--interrupt' would have interrupted the agent)
      if (s.length) args.push('--text=' + s);
      if (so.enter !== false) args.push('--enter');
      const r = await run(args);
      return { handle, accepted: r && (r.accepted !== undefined ? r.accepted : true), receipt: r };
    },
  };
}

module.exports = { createOrcaBridge, resolveCli, HANDLE_RE, MAX_SEND };
