#!/usr/bin/env node
// server.mjs - the PINEBOX MCP surface. A THIN FORWARDER over the CLI (blueprint section 9).
//
// It reads ../actions.json, turns a tools/call into `pinebox` argv, runs it, and returns
// { ok, text, details } - or, on a refusal, { ok:false, error:"<TOKEN>", detail }. It
// implements no verb, so a fix in the CLI is a fix here, and a foreign runtime can branch on
// `error` because it is a token (PORT_TAKEN:<port>, INSTANCE_LIVE, CONFIG_BLOCK_ABSENT, ...).
//
// stdio, newline-delimited JSON-RPC 2.0. No dependencies.
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const CLI = process.env.PINEBOX_CLI ?? resolve(HERE, "..", "pinebox");
const TABLE = JSON.parse(readFileSync(resolve(HERE, "..", "actions.json"), "utf8"));

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

function argvFor(p) {
  const row = TABLE.actions[p.verb];
  if (!row) return null;
  const argv = [...row.argv];
  for (const f of row.flags) {
    // the table's `action` flag is drive's computer-use verb; MCP names it drive_action
    const v = f === "action" ? p.drive_action : p[f];
    if (v === undefined || v === null || v === false) continue;
    if (v === true) argv.push("--" + f); else argv.push("--" + f, String(v));
  }
  return argv;
}

function run(argv) {
  const { promise, resolve: done } = Promise.withResolvers();
  const c = spawn(CLI, argv, { stdio: ["ignore", "pipe", "pipe"] });
  let out = "", err = "";
  c.stdout.on("data", (d) => (out += d));
  c.stderr.on("data", (d) => (err += d));
  c.on("close", (code) => done({ code: code ?? 1, out: out.trim(), err: err.trim() }));
  return promise;
}

async function callTool(p) {
  const argv = argvFor(p ?? {});
  if (!argv) return { ok: false, error: "BAD_VERB", detail: `unknown verb '${p?.verb}'` };
  const r = await run(argv);
  if (r.code === 0) {
    let details = null;
    try { details = JSON.parse(r.out.split("\n").pop()); } catch { /* text */ }
    return { ok: true, text: r.out, details };
  }
  const m = r.err.match(/REFUSED\s+([A-Za-z_:0-9]+)\s+—\s+([\s\S]*)/);
  return { ok: false, error: m ? m[1] : "FAILED", detail: m ? m[2].split("\n")[0].trim() : (r.err || r.out) };
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
      send({ jsonrpc: "2.0", id: msg.id, result: { protocolVersion: msg.params?.protocolVersion ?? "2024-11-05", capabilities: { tools: {} }, serverInfo: { name: "pinebox", version: TABLE.version } } });
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
