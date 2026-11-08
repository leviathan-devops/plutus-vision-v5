#!/usr/bin/env node
// server.mjs - the MCP surface. A THIN FORWARDER over the CLI (blueprint 7D, risk R7).
//
// It reads core/actions.json, turns a tools/call into CLI argv, runs `computer`, and
// returns { ok, text, details } - or, on a refusal, { ok:false, error:"<TOKEN>", detail }.
// It implements no action itself, so a bug fixed in the core is fixed here too, and a
// foreign runtime (a web agent, Gro, GLM) can branch on `error` because it is a token.
//
// stdio, newline-delimited JSON-RPC 2.0. No dependencies.

import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const CLI = resolve(HERE, "..", "computer");
const TABLE = JSON.parse(readFileSync(resolve(HERE, "..", "core", "actions.json"), "utf8"));

const names = Object.keys(TABLE.actions);
const properties = { action: { type: "string", enum: names, description: "the action to run" } };
for (const [k, v] of Object.entries(TABLE.params)) properties[k] = v;

const TOOL = {
  name: "computer",
  description:
    "A self-contained Linux computer: a headed display, a terminal and a scoped filesystem. " +
    "shell_up creates a display that ANSWERS; shell_spawn launches an app INTO it; the drive " +
    "actions (focus/click/type/key/screenshot) act on it WITHOUT raising a window, so the " +
    "operator's focus is never stolen - proven per call by a behavioural probe. A refusal is " +
    "a TOKEN in `error`, never prose: branch on it.",
  inputSchema: { type: "object", properties, required: ["action"], additionalProperties: false },
};

// action + params -> CLI argv, from the table alone
function argvFor(params) {
  const row = TABLE.actions[params.action];
  if (!row) return null;
  const argv = [...row.argv];
  for (const f of row.flags) {
    const v = params[f];
    if (v === undefined || v === null || v === false) continue;
    const flag = "--" + f.replace(/_/g, "-");
    if (v === true) argv.push(flag); else argv.push(flag, String(v));
  }
  if (row.tail) {
    const tail = params[row.tail];
    if (Array.isArray(tail) && tail.length) argv.push("--", ...tail.map(String));
  }
  return argv;
}

function run(argv) {
  const { promise, resolve } = Promise.withResolvers();
  const p = spawn(CLI, argv, { stdio: ["ignore", "pipe", "pipe"] });
  let out = "", err = "";
  p.stdout.on("data", (d) => (out += d));
  p.stderr.on("data", (d) => (err += d));
  p.on("close", (code) => resolve({ code: code ?? 1, out: out.trim(), err: err.trim() }));
  return promise;
}

async function callTool(params) {
  const argv = argvFor(params ?? {});
  if (!argv) return { ok: false, error: "BAD_ACTION", detail: `unknown action '${params?.action}'` };
  const r = await run(argv);
  if (r.code === 0) {
    let details = null;
    try { details = JSON.parse(r.out); } catch { /* the core printed text, not JSON */ }
    return { ok: true, text: r.out, details };
  }
  const m = r.err.match(/REFUSED\s+([A-Z_]+)\s+—\s+([\s\S]*)/);
  return { ok: false, error: m ? m[1] : "FAILED", detail: m ? m[2].trim() : (r.err || r.out) };
}

const send = (o) => process.stdout.write(JSON.stringify(o) + "\n");

let buf = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", async (chunk) => {
  buf += chunk;
  let i;
  while ((i = buf.indexOf("\n")) >= 0) {
    const line = buf.slice(0, i); buf = buf.slice(i + 1);
    if (!line.trim()) continue;
    let msg; try { msg = JSON.parse(line); } catch { continue; }

    if (msg.method === "initialize") {
      send({ jsonrpc: "2.0", id: msg.id, result: {
        protocolVersion: msg.params?.protocolVersion ?? "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: { name: "computer-use", version: TABLE.version },
      } });
    } else if (msg.method === "tools/list") {
      send({ jsonrpc: "2.0", id: msg.id, result: { tools: [TOOL] } });
    } else if (msg.method === "tools/call") {
      const r = await callTool(msg.params?.arguments);
      send({ jsonrpc: "2.0", id: msg.id, result: { content: [{ type: "text", text: JSON.stringify(r) }], isError: !r.ok } });
    } else if (msg.method === "ping") {
      send({ jsonrpc: "2.0", id: msg.id, result: {} });
    } else if (msg.id !== undefined && !msg.method?.startsWith("notifications/")) {
      send({ jsonrpc: "2.0", id: msg.id, error: { code: -32601, message: `unknown method ${msg.method}` } });
    }
  }
});
