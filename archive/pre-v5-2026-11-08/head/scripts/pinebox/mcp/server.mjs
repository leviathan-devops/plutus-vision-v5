#!/usr/bin/env node
// server.mjs - the PINEBOX MCP surface. A THIN FORWARDER over the CLI (blueprint section 9).
//
// It reads ../actions.json, turns a tools/call into `pinebox` argv, runs it, and returns
// { ok, text, details } - or, on a failure, { ok:false, error:"<TOKEN>", detail }. It
// implements no verb, so a fix in the CLI is a fix here, and a foreign runtime can branch on
// `error` because it is ALWAYS a token:
//   a CLI refusal   -> its own token (PORT_TAKEN:<port>, INSTANCE_LIVE, CONFIG_BLOCK_ABSENT, ...)
//   BAD_ARGS        -> the arguments failed validation here, before anything was spawned
//   MCP_TIMEOUT     -> the verb did not answer within the deadline and was killed
//   CLI_SPAWN_FAILED-> the CLI could not be started at all
//   FAILED          -> the CLI exited non-zero WITHOUT a refusal (a crash); detail has stderr
//
// stdio, newline-delimited JSON-RPC 2.0. No dependencies.
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const CLI = process.env.PINEBOX_CLI ?? resolve(HERE, "..", "pinebox");
// A timeout is a SAFETY BOUND: `Number("foo")` is NaN, `Number("")` is 0 and a negative or huge value
// makes setTimeout fire immediately, so every verb would answer MCP_TIMEOUT for no reason. Anything
// that is not a plain integer in 100..3600000 ms is a loud startup failure, not a silent default.
const RAW_TIMEOUT = process.env.PINEBOX_MCP_TIMEOUT_MS ?? "120000";
const RUN_TIMEOUT_MS = /^\d+$/.test(String(RAW_TIMEOUT)) ? Number(RAW_TIMEOUT) : NaN;
if (!(RUN_TIMEOUT_MS >= 100 && RUN_TIMEOUT_MS <= 3600000)) {
  console.error(`PINEBOX_MCP_STARTUP_FAILED: PINEBOX_MCP_TIMEOUT_MS must be an integer in 100..3600000, got '${RAW_TIMEOUT}'`);
  process.exit(2);
}
const MAX_LINE = 1 << 20;   // a JSON-RPC line over 1 MiB is refused, not buffered forever

// A missing or malformed action table is a startup failure with a clear message - not an
// uncaught exception with no JSON-RPC error and no hint.
let TABLE;
try {
  TABLE = JSON.parse(readFileSync(resolve(HERE, "..", "actions.json"), "utf8"));
  if (!TABLE || typeof TABLE.actions !== "object" || typeof TABLE.params !== "object") throw new Error("missing `actions` or `params`");
} catch (e) {
  console.error(`PINEBOX_MCP_STARTUP_FAILED: cannot load actions.json: ${e.message}`);
  process.exit(2);
}

// The verb is `verb`; drive's own computer-use verb (the table's `action` param) is `drive_action`.
const properties = { verb: { type: "string", enum: Object.keys(TABLE.actions), description: "the PINEBOX verb" } };
for (const [k, v] of Object.entries(TABLE.params)) properties[k === "action" ? "drive_action" : k] = v;

const TOOL = {
  name: "pinebox",
  description:
    "The Pine IDE as a self-contained, multi-instance agent computer. `up` brings an instance up " +
    "(a headed window that stays in the background, three services on a port block derived from " +
    "the id, the IDE served with that instance's own ports, a verified frame); shot/load/drive act " +
    "on it in-process over CDP and never raise a window. A refusal is a TOKEN in `error`.",
  inputSchema: { type: "object", properties, required: ["verb"], additionalProperties: false },
};

// Validate against the table BEFORE spawning: unknown keys, wrong types and non-finite numbers
// are BAD_ARGS. (Silently String()-coercing an object to "[object Object]" or an array to
// "a,b" forwarded garbage to the CLI.)
function validate(p) {
  if (p === null || typeof p !== "object" || Array.isArray(p)) return "arguments must be an object";
  if (typeof p.verb !== "string") return "`verb` is required and must be a string";
  if (!Object.prototype.hasOwnProperty.call(TABLE.actions, p.verb)) return `unknown verb '${p.verb}'`;
  for (const [k, v] of Object.entries(p)) {
    if (k === "verb") continue;
    const spec = Object.prototype.hasOwnProperty.call(properties, k) ? properties[k] : null;   // own keys only: "constructor" must not pass
    if (!spec) return `unknown argument '${k}' (additionalProperties is false)`;
    if (v === undefined || v === null) continue;
    if (spec.type === "number" && !(typeof v === "number" && Number.isFinite(v))) return `'${k}' must be a finite number`;
    if (spec.type === "boolean" && typeof v !== "boolean") return `'${k}' must be a boolean`;
    if (spec.type === "string" && typeof v !== "string") return `'${k}' must be a string`;
    if (spec.type === "array" && !Array.isArray(v)) return `'${k}' must be an array`;
  }
  return null;
}

function argvFor(p) {
  const row = TABLE.actions[p.verb];
  const argv = [...row.argv];
  for (const f of row.flags) {
    // the table's `action` flag is drive's computer-use verb; MCP names it drive_action
    const v = f === "action" ? p.drive_action : p[f];
    if (v === undefined || v === null || v === false || v === "") continue;
    if (v === true) argv.push("--" + f); else argv.push("--" + f, String(v));
  }
  return argv;
}

// A stdio MCP server process serves ONE client, so that client is ONE session: the launcher passes CU_SESSION_ID, and a client that does not gets a
// session minted from this process (isolated by default - never a shared default instance). The model cannot set it: it is not a tool argument.
const SESSION_ID = /^[A-Za-z0-9][A-Za-z0-9._-]{3,79}$/.test(process.env.CU_SESSION_ID ?? "")
  ? process.env.CU_SESSION_ID
  : `mcp-${process.pid}-${Date.now().toString(36)}`;

// a judged verify makes several judge calls (about 1-1.3 s per clause measured 2026-11-03, clauses concurrent): it gets a longer bound than the other verbs
const JUDGE_TIMEOUT_MS = Math.max(RUN_TIMEOUT_MS, 480000);
function run(argv, timeoutMs = RUN_TIMEOUT_MS) {
  const { promise, resolve: done } = Promise.withResolvers();
  // detached => the CLI leads its OWN process group, so a timeout can signal the whole tree. Killing
  // only the CLI left its grandchildren holding the stdout pipe, `close`
  // never fired, and the call never answered.
  const c = spawn(CLI, argv, { stdio: ["ignore", "pipe", "pipe"], detached: true, env: { ...process.env, CU_SESSION_ID: SESSION_ID } });
  let out = "", err = "", settled = false, timedOut = false;
  const settle = (r) => { if (settled) return; settled = true; clearTimeout(timer); done(r); };
  const killTree = (sig) => { try { process.kill(-c.pid, sig); } catch { try { c.kill(sig); } catch { /* already gone */ } } };
  const timer = setTimeout(() => {
    timedOut = true;
    killTree("SIGTERM");                                  // lets the CLI's own EXIT cleanup run first
    setTimeout(() => killTree("SIGKILL"), 5000).unref();  // then force it
    settle({ code: 124, timedOut: true, out: out.trim(), err: err.trim() });   // answer NOW, do not wait for a pipe
  }, timeoutMs);
  const cap = (s, chunk, max) => { s += chunk; return s.length > max ? s.slice(-max) : s; };
  c.stdout.on("data", (d) => { out = cap(out, d, 1 << 20); });
  c.stderr.on("data", (d) => { err = cap(err, d, 1 << 18); });
  c.on("error", (e) => settle({ code: 127, spawnError: String(e), out, err }));
  c.on("close", (code) => settle({ code: code ?? 1, timedOut, out: out.trim(), err: err.trim() }));
  return promise;
}

// A refusal line is `REFUSED  <TOKEN>  <dash>  <detail>`. The dash may be an em/en dash or a
// hyphen and the token may carry `:` `.` `-`; parse the shape, not one exact punctuation, and
// keep every detail line (a multi-line detail was cut to its first line).
const REFUSAL = /REFUSED\s+([A-Za-z0-9_:.\-]+)\s+[\u2014\u2013-]+\s*([\s\S]*)/;

async function callTool(p) {
  const bad = validate(p);
  if (bad) return { ok: false, error: "BAD_ARGS", detail: bad };
  const judged = p.verb === "verify" && p.arith !== true;   // verify judges by default (the arith-only path makes no model call)
  const bound = judged ? JUDGE_TIMEOUT_MS : RUN_TIMEOUT_MS;
  const r = await run(argvFor(p), bound);
  if (r.spawnError) return { ok: false, error: "CLI_SPAWN_FAILED", detail: `${r.spawnError} (CLI=${CLI})` };
  if (r.timedOut) return { ok: false, error: "MCP_TIMEOUT", detail: `verb '${p.verb}' did not answer within ${bound}ms and was killed` };
  if (r.code === 0) {
    let details = null;
    try { details = JSON.parse(r.out.split("\n").pop()); } catch { /* text */ }
    return { ok: true, text: r.out, details };
  }
  const m = r.err.match(REFUSAL);
  if (m) return { ok: false, error: m[1], detail: m[2].trim().slice(0, 1200) };
  return { ok: false, error: "FAILED", detail: (r.err || r.out || `exit ${r.code}`).slice(0, 1200) };
}

const send = (o) => process.stdout.write(JSON.stringify(o) + "\n");

async function handle(msg) {
  try {
    if (msg.method === "initialize") {
      send({ jsonrpc: "2.0", id: msg.id, result: { protocolVersion: msg.params?.protocolVersion ?? "2024-11-05", capabilities: { tools: {} }, serverInfo: { name: "pinebox", version: TABLE.version } } });
    } else if (msg.method === "tools/list") {
      send({ jsonrpc: "2.0", id: msg.id, result: { tools: [TOOL] } });
    } else if (msg.method === "tools/call") {
      const r = await callTool(msg.params?.arguments);
      send({ jsonrpc: "2.0", id: msg.id, result: { content: [{ type: "text", text: JSON.stringify(r) }], isError: !r.ok } });
    } else if (msg.method === "ping") {
      send({ jsonrpc: "2.0", id: msg.id, result: {} });
    } else if (msg.id !== undefined && !String(msg.method ?? "").startsWith("notifications/")) {
      send({ jsonrpc: "2.0", id: msg.id, error: { code: -32601, message: `unknown method ${msg.method}` } });
    }
  } catch (e) {
    if (msg?.id !== undefined) send({ jsonrpc: "2.0", id: msg.id, error: { code: -32603, message: String(e?.message || e) } });
  }
}

// Only tools/call is SERIALIZED (instances share a display and a port space). initialize,
// tools/list and ping answer immediately: queueing them behind a 120 s verb made a healthy
// server look hung.
let callChain = Promise.resolve();
let buf = "";
let discarding = false;     // inside an oversized line: drop input up to its newline, answering ONCE
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  if (discarding) {
    const nl = chunk.indexOf("\n");
    if (nl < 0) return;                    // still inside the oversized line
    chunk = chunk.slice(nl + 1);
    discarding = false;
  }
  buf += chunk;
  if (buf.length > MAX_LINE && buf.indexOf("\n") < 0) {
    // one error for the whole line - a per-chunk error flooded the client with hundreds of replies
    buf = ""; discarding = true;
    send({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "parse error: line exceeds 1 MiB" } });
    return;
  }
  let i;
  while ((i = buf.indexOf("\n")) >= 0) {
    const line = buf.slice(0, i); buf = buf.slice(i + 1);
    if (!line.trim()) continue;
    // the 1 MiB bound applies to EVERY line, including one that arrived whole with its newline
    if (line.length > MAX_LINE) { send({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "parse error: line exceeds 1 MiB" } }); continue; }
    let msg;
    try { msg = JSON.parse(line); }
    catch { send({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "parse error: not valid JSON" } }); continue; }
    // `null`, a number, a string or an array parses fine and then threw on `msg.method` OUTSIDE any
    // try/catch, killing the whole stdio server: a JSON-RPC message must be an object
    if (msg === null || typeof msg !== "object" || Array.isArray(msg)) {
      send({ jsonrpc: "2.0", id: null, error: { code: -32600, message: "invalid request: a JSON-RPC message must be a JSON object" } }); continue;
    }
    if (msg.method === "tools/call") callChain = callChain.then(() => handle(msg)).catch((e) => console.error("MCP_CALL_FAILED", String(e)));
    else handle(msg);
  }
});
