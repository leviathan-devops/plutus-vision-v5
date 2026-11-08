# ARSUMBRIS PLUTUS KNOWLEDGE GRAPH — MASTER BLUEPRINT v1
**System:** the arsumbris knowledge-graph deployment for Plutus doctrine
**Winner source:** the LIVE system (~/arsumbris repos @ tag 0.0.1-alpha + au-host commit b49c705 + MASTER_CONTEXT corpus + device configs) — extracted 2026-09-17, first-hand, by the builder session
**What it IS (one sentence):** you write markdown files; a Rust daemon parses them into a typed graph and serves them over a socket; a desktop app renders that graph; a kernel gates every agent action against it; a mining layer (Semantica, PROPOSED) would read the same files for patterns you didn't hand-author — and can never write law.
**Companion docs:** `MASTER_CONTEXT/OPERATOR_MANUAL.md` (how to USE — §1-12) · `reports/Arsumbris_Semantica_Blueprints_v1.md` (the mining layer) · threads `arsumbris` + `system-debugging` (the durable record)

---

## §1 MACRO BLUEPRINT

```
┌───────────────────────────────────────────────────────────────────────┐
│                        THE PLUTUS KNOWLEDGE SYSTEM                    │
│                                                                       │
│  [S1 AUTHOR]  operator writes cards ── MASTER_CONTEXT/*.md (§2.1)    │
│       │ save                                                          │
│       ▼                                                               │
│  [S2 INDEX]   au-engine daemon ─────── watch→parse→validate (§2.2)   │
│       │ socket ~/.arsumbris/au-engine/run/<hash>.sock                │
│       ├──────────────────────────────┬────────────────────────────────┤
│       ▼ wire                          ▼ wire                          │
│  [S3 RENDER]  au-host (Electron)   [S4 GATE]  au-mcp kernel           │
│       panes · intents · rail          44 tools · mediate/act/         │
│       (§2.3)                          observe (§2.4)                  │
│       │ adapter launchEntry           │ MCP stdio                     │
│       ▼                               ▼                                │
│  [S5 HARNESS] terminal pane ── omp session, gate-mounted (§2.5)      │
│                                                                       │
│  [S6 SUPERVISE] kgm fleet ── observe→heal(read-back)→lint(§2.6)      │
│  [S7 MINE]      semantica ── PROPOSED, candidates-only wall (§2.7)   │
└───────────────────────────────────────────────────────────────────────┘
```

## §2 LIFECYCLE SECTIONS (execution order)

### S1 · AUTHOR — the substrate is git-tracked markdown

WHAT: law as files. HOW: a card = YAML frontmatter (a typed claim) + body (quote + prose + `[[wikilinks]]`). WHERE: `MASTER_CONTEXT/rulings/R09-rrr-floor-2p5.md` (the exemplar; full text in-graph). WHY: D13/R19 — *"Doctrine is QUOTED, never synthesized…"* — the operator is the only law-writer; the filesystem is the database; git is the history.

**The card template (verbatim shape):**
```yaml
---
type: plutus-ruling
id: "R39"                      # regex-checked: /^R[0-9]{1,2}$/
quote: "…operator words verbatim…"
source: "CORPUS_FILE.md:123"   # the anchor (21/38 anchored; 17 flagged)
status: operator-confirmed     # enum-checked
---
# R39 — slug
Body: context, supersession history, [[R09-rrr-floor-2p5]] links.
```

**Current census (measured 2026-09-17):** 121 nodes · 21 edges (4 doctrine + 17 structural) · 0 diagnostics · 38 rulings · 16 hard-limits · 1 lesson · 3 gates · 3 state · 6 terms · 7 type-defs · 3 profiles · 39 root files · 5 NON-NEGOTIABLE-RELOAD.

### S2 · INDEX — the engine

WHAT: one Rust daemon per workspace entry, holding the live typed graph. HOW: inotify watch → re-parse changed spans → validate claims → version++ → serve. WHERE: `~/arsumbris/au-engine/target/release/au` (built 50.72s, cargo 1.98.1); wire contract `crates/au-engine/WIRE.md` (schema_version 29 — battery B3). WHY: live indexing (~1s/save, measured) with diagnostics-as-lint — never a blocked save.

Checks in execution order: (1) frontmatter parses; (2) `type:` resolves against a def in `type/` (SINGULAR dir — trap); (3) field shapes — regex refinements are SLASH-delimited `String{/^R[0-9]{1,2}$/}` (battery B1: plutus-ruling.type.yaml:2) and a bare `/` inside a character class terminates the regex; (4) enum membership; (5) `[[wikilink]]` targets exist (filenames, not ids); (6) repo conventions (name==folder; self-declaration `type: au.engine.repo::au-engine`).

### S3 · RENDER — au-host

WHAT: the human window. HOW: a composition (`MASTER_CONTEXT/workspace-layout.yaml`) mounts panes; every action is a typed intent. WHERE: `~/arsumbris/au-host` (Electron 42.3.0; patches commit b49c705 — battery B8: 6 `webglDead` guards). WHY: humans and agents drive the SAME surface (intents), so automation never forks the UI.

Launch law (measured): direct-built binary + `--ozone-platform=x11 --force-renderer-accessibility` — the env-hint path failed across dev-server respawns; the explicit switches never did. Pane chrome: `Collapse · Move · ⋮ · Remove`; **Add pane** picker: 14 projections.

### S4 · GATE — the kernel

WHAT: per-workspace daemon owning every agent action. HOW: `mcp.json` entry `plutus-au` → `au-mcp-adapter-cc/bin/omp-server.ts` → `buildLaunchEnv({workspace})` mints `AU_MCP_SESSION` (battery B5: omp-server.ts:5,10) → MCP stdio shim dials the kernel socket. 44 tools. Every call: `mediate → act → observe`, journaled; read-guard floor (no writing an unread file); state-touching calls without a session refuse legibly. WHY: agents read QUOTED law; provenance per action.

**THE OWNERSHIP LAW (incident-forged, OPEN-003):** the HOST owns the kernel child (`host.mcp.start()` — launch-command.ts:13, battery B7). A second kernel on the same socket reads as "mcp off" and "+ New session" dies silently at prepareProfileTerminal (launch-command.ts:5). My hub service did exactly this; stopped 2026-09-17; in-app session verification PENDING.

### S5 · HARNESS — adapters and sessions

WHAT: any CLI agent becomes a launchable harness. HOW: an adapter REPO carries a self-declaring type-def; the host enumerates `subtypes(base="mcp.adapter")`, resolves the repo dir from `source.file`, runs `node <launchEntry> --workspace …`, reads ONE JSON line, spawns into a terminal pane. WHERE: `~/arsumbris/au-mcp-adapter-omp/type/mcp.adapter.omp.type.yaml:11-12` (`contractVersion: 0`, `agentBinary: omp` — battery B6); measured launch output: `{"session":"a2e91c76…","binary":"/home/leviathan/.bun/bin/omp","argv":[],"env":{"AU_MCP_SESSION":…}}`. Binary paths resolve from `~/.arsumbris/au-host/config/paths.yaml` `binaries:` block. Discovered adapters (measured): `[mcp.adapter.cc, mcp.adapter.codex, mcp.adapter.omp]`.

### S6 · SUPERVISE — kgm

WHAT: machine-checked liveness + lint. HOW: manager-machine boilerplate (battery 37/0); Desired `daemon:plutus-au-engine` (observe status+wire → heal = detached restart + READ-BACK → never trusts the spawn); Desired `lint:plutus-knowledge` (diagnostics>0 → RAISE, no auto-heal — doctrine surfaces, never self-edits). WHERE: `PLUTUS_Knowledge/kgm/fleet.ts`; DB `~/.manager-machine/plutus-knowledge/store.sqlite`; journal `kgm/journal/journal.log` (battery B9: last row `"tick complete: checked=2 drifted=1 healed=1 raised=1"`). Crash-first work rows resume on the next tick (proven: `checkpoint=start`).

### S7 · MINE — Semantica (PROPOSED — owner: operator GO)

WHAT: the pattern-mining layer over the same corpus. HOW (per its repo, v0.6.x): ingest → NER extraction → entity resolution (the exact machinery the 17 UNANCHORED rulings need) → KG in swappable stores → deterministic reasoning → `record_decision` per trade. WHERE it would mount: `mcp.json` second entry `semantica-mcp` (stdio, `SEMANTICA_KG_PATH`). **THE WALL:** its output lands in `MASTER_CONTEXT/candidates/` — NEVER in `rulings/`. Machines propose; the operator promotes. Status: NOT INSTALLED.

## §3 DISPATCH TRACES

**T1 · file save → graph update → UI (measured):**
```
operator saves rulings/R39-x.md (editor, S3)
→ inotify event → engine re-parse (S2, ~1s) → version++ (now 4)
→ diagnostics: none → host file-tree live-updates
→ Force Graph node appears on next layout pass
```
**T2 · OMP agent reads law (measured):**
```
omp session start → mcp.json spawns omp-server.ts (stdio)
→ buildLaunchEnv → AU_MCP_SESSION=<uuid> → kernel socket dial
→ tool au_instances_of{type:"plutus-ruling"}
→ kernel mediates → engine read → 38 instances (fields+hash+locator)
→ observe journal row → structured result to the agent
```
**T3 · host intent (measured, twice):**
```
au_host_intent_fire{intent:"open-intent",
  payload:{target:{type:"file-selection", path:"…/BIBLE_4.5.md"}}}
→ {"command":"fireIntent","claimed":true}
→ reader tab mounts the document; Force Graph highlights the node
```
**T4 · adapter session launch (BROKEN at hop 4 — OPEN-003):**
```
1 rail "+ New session" click (S3)
2 prepareProfileTerminal (launch-command.ts:5)
3 host.mcp.start() — ✗ the host's kernel child is OFF
   (socket owned by the rogue hub service → diagnostic in the
    feedback line, no spawn)
4 [pending fix] node launchEntry → JSON → pty spawn → omp TUI pane
```
**T5 · kgm tick (measured):**
```
bun kgm/fleet.ts tick → observe (status ready=false) → drift row
→ heal: detached spawn → poll status ×30 → read-back ready=true
→ healed row (pid logged) → lint probe (diagnostics) → verdict JSON
```

## §4 TYPES + ENGINE CHECKS

The seven schemas (verbatim, `MASTER_CONTEXT/type/`):
```yaml
plutus-ruling:     id 'String{/^R[0-9]{1,2}$/}' · quote String ·
                   source String · status [active|superseded|
                   operator-confirmed|ratified]
plutus-hard-limit: id 'String{/^HL-[0-9]{2}$/'} · rule · anchor
plutus-lesson:     id 'String{/^P2-[0-9]{2}$/}' · name · wrong ·
                   correct · law
plutus-gate:       name · command · pass · cadence [every-change|
                   per-wave|ship-bar|manual]
plutus-state:      component · value · verifiedAt Date · evidence
plutus-term:       term · definition
plutus-doc:        title · kind [bible|spec|macro|feedback|analysis|
                   doctrine|manual|reload] · status [canon|
                   superseded|draft]
```
Engine checks, guard order: parse → type-resolution → shape/regex → enum → reference-existence → convention (drift severity). Failure polarity: EVERY failure is a diagnostic; NONE blocks the save. Frozen constants: wire schema 29; socket = fnv1a64(realpath) under `~/.arsumbris/au-engine/run/` (WIRE.md); frozen pair SHAs appear twice (HL-07 + state/frozen-pair — battery B2).

## §5 INVOKE PSEUDOCODE

**P1 · engine re-index (per save):**
```
on file_change(path):
  span = read(path)
  if path ends .type.yaml: reparse type-def; rebuild type graph
  else if frontmatter present:
    claim = parse(frontmatter)
    def = type_graph.resolve(claim.type)
    if def missing: emit(type-repo-not-a-dependency); return
    for field in def.fields:
      value = claim[field.name]
      if field.regex and not matches(value): emit(refinement-bad-shape)
      if field.enum and value not in field.enum: emit(enum-mismatch)
    for link in body[[...]]: ensure target file exists else emit(
      navigational-target-not-found)
  version += 1
  broadcast change_event to subscribers
```
**P2 · wire frame (both directions):**
```
send(request):
  body = json(request); emit 4-byte BE len(body); emit body
receive():
  len = read4(); body = read(len); return json(body)
```
**P3 · session mint (omp-server.ts):**
```
main():
  workspace = env.AU_MCP_WORKSPACE
  {env, session} = buildLaunchEnv({workspace})     # SDK
  spawn(node, [mcp-server.ts], env=merge(process.env, env),
        stdio=inherit)                             # MCP over our stdio
```
**P4 · adapter launch (bin/launch.ts):**
```
main(argv):
  workspace = flag(--workspace) ?? cwd
  binary = flag(--binary) ?? "/home/leviathan/.bun/bin/omp"  # absolute
  {env, session} = buildLaunchEnv({workspace})
  print json({session, binary, argv: [], env, command: binary})
  # contract: stdout is ONE JSON object; diagnostics to stderr
```
**P5 · kgm heal (fleet.ts):**
```
observe(daemon):
  st = au daemon status(REPO)
  if not st.ok: return "daemon-down"
  if wire_read(diagnostic_counts) fails: return "socket-dead"
  return null
heal(drift):
  child = detached_spawn(au daemon start REPO)
  loop 30×: sleep 500ms; if status.ok: return healed(read-back)
  throw heal-failed
```
**P6 · WebGL graceful degrade (stage.ts / avatars.ts, commit b49c705):**
```
constructor():
  probe = canvas.getContext("webgl2") ?? canvas.getContext("webgl")
  if not probe:
    webglDead = true; append(bubble); return        # UI continues
try: mount 3D companion
catch: replace with muted zzz placeholder; log; NEVER rethrow
```
**P7 · the wall (S7, PROPOSED):**
```
on semantica.proposal(entity, evidence):
  write candidates/<slug>.md (fields: proposal, evidence, refs)
  NEVER write rulings/ | hard-limits/ | state/
  operator promotes by hand → new card → graph updates
```

## §6 TREES

**Component tree (S-sections → repos):**
```
└─ plutus-knowledge-system
   +- S1 substrate ......... MASTER_CONTEXT/ (121 nodes)
   +- S2 engine ............ ~/arsumbris/au-engine (7 crates)
   +- S3 host .............. ~/arsumbris/au-host (14 projections)
   +- S4 gate .............. ~/arsumbris/au-mcp + au-mcp-core(+sdk)
   +- S5 harness ........... au-mcp-adapter-{cc,codex,omp}
   +- S6 supervisor ........ PLUTUS_Knowledge/kgm (fleet.ts)
   +- S7 mining ............ PROPOSED (semantica)
```
**File tree (the corpus, caps: shown=13 dirs, total=13):**
```
MASTER_CONTEXT/
+- NON-NEGOTIABLE-RELOAD/ 5   ★ raw law
+- rulings/ 38 · hard-limits/ 16 · lessons/ 1 · gates/ 3
+- state/ 3 · terms/ 6 · type/ 7 · profiles/ 3
+- reports/ 2 (engineering report + blueprints)
+- knowledge-graph/ (graph.db — LEGACY, archive pending)
+- 39 root files (bibles · specs · OPERATOR_MANUAL · session record)
```
**Call tree — a gate read (hot path):**
```
omp tool call
+- omp-server.ts (stdio MCP)
   +- buildLaunchEnv → AU_MCP_SESSION
   +- kernel socket (au-mcp/run/<hash>.sock)
      +- mediate (allow · journal)
      +- engine socket (au-engine/run/<hash>.sock)
         +- read handler → instances_of → 38 instances
      +- observe (journal row)
```

## §7 LAWS + INVARIANTS

1. **D13/R19 (THE WALL):** doctrine is QUOTED, never synthesized; an unquotable claim does not get built. Anchor: `rulings/R19-quote-law.md`; mechanism: operator-only writes to `rulings/`; S7 candidates-only.
2. **LINT, NOT POLICE:** every engine failure is a diagnostic; no save is ever blocked. Anchor: the 106→42→3→0 ladder (walked 2026-09-16); mechanism: §4 guard order.
3. **HOST OWNS THE KERNEL:** exactly one kernel per workspace socket, spawned by the host. Anchor: OPEN-003 (launch-command.ts:13); mechanism: hub services on that socket are forbidden.
4. **THE ANCHOR LAW:** a ruling's `source` must be a real corpus `file:line`; unanchored = flagged, not trusted. Anchor: 21/38 anchored; 17 flagged `UNANCHORED-IN-CORPUS`.
5. **READ-BACK HEALING:** a heal is not done until `status` re-reports ready. Anchor: kgm journal healed rows (pid + read-back); mechanism: P5.
6. **X11 + AX LAW:** au-host launches `--ozone-platform=x11 --force-renderer-accessibility` or automation loses both pixels and the AX tree. Anchor: EN-002 + the bare-tree observation.
7. **BUILD BEFORE PATCH:** projections serve BUILT dist ESM — source patches require `pnpm --filter <pkg> build`. Anchor: OPEN-001 addendum.
8. **PARSE-EDIT-VALIDATE:** never string-surgery YAML a parser reads; never substring-test a registry — parse names. Anchor: EN-005/B5 incidents.
9. **ABSOLUTE BINARY PATHS:** agent binaries resolve from `paths.yaml binaries.*`, never PATH. Anchor: the execvp failure + fix.
10. **ONE DISPLAY TRUTH:** the session DISPLAY must be the live one (:1); stale ancestor env (Orca :99) poisons every child. Anchor: EN-001; mechanism: `orca-ide-launch` resolver.
11. **APPEND-ONLY EVERYWHERE:** threads, journals, git history, supersede-never-rewrite cards. Anchor: R22 `status: superseded` (spent, kept).
12. **STATE FRESHNESS:** `state/` cards carry what is PROVEN, with date + evidence; a claim without a state card is an opinion. Anchor: state/frozen-pair (SHA ×2, 2026-09-16).

## §8 ERROR VOCABULARY + SCHEMA + SHELL

**Diagnostic codes observed (the vocabulary):** `shape-syntax-error` · `refinement-bad-shape` (message: "…is not a recognized refinement predicate (expected a comparison, 'integer', or a /regex/)") · `type-def-outside-type-dir` · `repo-folder-name-mismatch` · `engine-schema-type-unwritten` · `readme-type-undeclared` · `required-field-absent` · `body-section-missing` · `navigational-target-not-found` · `type-repo-not-a-dependency` · `discover-member-unmounted` · `undeclared-nested-repo` · `discover-member-is-a-dependency` · `peer-unmounted`.

**Wire errors:** `malformed read: missing field 'base'` (subtypes) · `malformed read: unknown variant 'references'` (the verb catalog: 34 reads).

**The forkable shell (a builder starts here):**
```
repo/
  .arsumbris/repo.yaml      type: au.engine.repo::au-engine · name=<folder>
  .arsumbris/workspace.yaml type: au.engine.workspace::au-engine ·
                             edit: [<self>] · discover: [mcp-bundle, host-bundle]
  type/law.type.yaml        fields with slash-regex refinements
  README.md                 type: au.engine.readme::au-engine · tldr: …
                             sections: Repo Overview / What / Use / Extend
  cards/…                   frontmatter claims + [[links]]
```

## §9 BACKWARDS MAP + PROVENANCE

**Component → section (N/N, zero orphans):** substrate→S1 · engine→S2 · host→S3 · kernel/gate→S4 · adapters/harness→S5 · kgm→S6 · semantica→S7 · types→§4 · wire→P2/§4 · launchers (arsumbris/orca-ide-launch)→Laws 6,10 · registries (repos/paths/recents.yaml)→S5/Law 8 · threads+skills→provenance below · V5 pipeline→context only (frozen pair SHAs, §4).

**Variant table:**
| variant | delta vs winner | verdict |
|---|---|---|
| au-host @ tag 0.0.1-alpha (upstream) | lacks WebGL degrade | superseded by |
| **au-host @ b49c705 (winner)** | 2 files, +40/−9 (stage.ts, avatars.ts — battery B10) | THE source |
| PLUTUS_Knowledge v0 seed | 66 cards, retired from graph | history (kgm home) |
| knowledge-graph/graph.db | legacy corbell sqlite, 126MB | archive pending |

**Why-wired ledger (law → mechanism → reason):** D13 → operator-only rulings/ + candidates wall → W9 regression class · lint-not-block → diagnostics subsystem → files never hostage · host-owns-kernel → mcp child lifecycle → OPEN-003 · read-back → kgm heal → CLI lies · X11+AX → launch flags → Wayland protocol + focus law · absolute paths → paths.yaml → execvp ENOENT.

**Re-host guide (numbered):** (1) clone the 23 repos @ 0.0.1-alpha + adapter-omp; (2) cargo build au-engine; (3) pnpm install au-host + `--filter app` chain + `--filter au-avatar build`; (4) apply b49c705 (cherry-pick); (5) `seed-device-config.py --write --au-path …`; (6) point repos.yaml at the corpus; (7) write the corpus shell (§8); (8) mcp.json → plutus-au; (9) kgm copy + tick; (10) launch host with the two flags. **True only with this audit present.**

**Left out + why:** the use-case layer (how to operate day-to-day) lives in `OPERATOR_MANUAL.md` — not duplicated here (no-duplication law). The V5 trading pipeline is context, not component.

---

## AUDIT APPENDIX (battery §5)

| # | claim | anchor | verdict |
|---|---|---|---|
| B1 | ruling id regex | plutus-ruling.type.yaml:2 | GREEN |
| B2 | frozen SHAs ×2 | HL-07.md + state/frozen-pair.md | GREEN |
| B3 | wire schema 29 | WIRE.md | GREEN |
| B4 | socket = fnv1a64(realpath) | WIRE.md (fleet implements, unnamed) | GREEN (re-anchored) |
| B5 | session mint | omp-server.ts:5,10 | GREEN |
| B6 | adapter contract | mcp.adapter.omp.type.yaml:11-12 | GREEN |
| B7 | launch chain + break point | launch-command.ts:5,13 | GREEN |
| B8 | WebGL patch | commit b49c705; 6 webglDead sites | GREEN |
| B9 | kgm verdict | journal last row | GREEN |
| B10 | variant divergence | git diff --stat: 2 files +40/−9; tree clean | GREEN |
| B11 | 38/38 typed claims | ls + grep counts | GREEN |

**Open items carried:** OPEN-003 (in-app session spawn — fix staged, verification pending) · 17 unanchored rulings · graph.db archive · S7 install.

## §2-APPENDIX · PRODUCTION CENSUS (real units, from disk)

The 38 rulings (id · anchor-state · status) — the law inventory:

| R | anchor | status | | R | anchor | status |
|---|---|---|---|---|---|---|
| R01 | MATHEXPR:512 ✅ | active | | R20 | L2_SPEC:459 ✅ | active |
| R02 | ⚠️ | active | | R21 | ⚠️ | active |
| R03 | L2_SPEC:87 ✅ | active | | R22 | ⚠️ | superseded |
| R04 | MACRO:30 ✅ | active | | R23 | ⚠️ | active |
| R05 | MACRO:57 ✅ | active | | R24 | ⚠️ | active |
| R06 | L2_SPEC:498 ✅ | active | | R25 | ⚠️ | active |
| R07 | LEXICON:151 ✅ | active | | R26 | ⚠️ | active |
| R08 | ⚠️ | active | | R27 | L2_SPEC:453 ✅ | active |
| R09 | MATHEXPR:507 ✅ | op-confirmed | | R28 | ⚠️ | active |
| R10 | ⚠️ | active | | R29 | ORCA_FORK:397 ✅ | active |
| R11 | MACRO:121 ✅ | active | | R30 | ⚠️ | active |
| R12 | ⚠️ | active | | R31 | ⚠️ | active |
| R13 | MACRO:378 ✅ | active | | R32 | ⚠️ | active |
| R14 | ⚠️ | active | | R33 | ORCA_FORK:396 ✅ | active |
| R15 | MACRO:946 ✅ | active | | R34 | ⚠️ | active |
| R16 | B4.5:436 ✅ | active | | R35 | SESSION:1 ✅ | op-confirmed |
| R17 | B4.5:164 ✅ | active | | R36 | SESSION:1 ✅ | op-confirmed |
| R18 | B4.5:381 ✅ | active | | R37 | SESSION:1 ✅ | op-confirmed |
| R19 | MATHEXPR:17 ✅ | active | | R38 | ⚠️ | op-confirmed |

Doctrine edges (measured link_graph): gate-class→R38 (field+body) · P2-01→R38 · R37→R09.
Composition edges: 17 (layout self-links + keymap).


## POST-OVERHAULT ADDENDUM (2026-09-17)

The KG overhaul wave landed: **583 mechanism cards** extracted from the full corpus by 7 parallel
scouts → assembled into `mechanisms/` as `plutus-mechanism` type instances. Graph: **703 nodes ·
24 edges · 0 diagnostics · 649 total typed cards**. The `Knowledge_Graph_Map_v2.md` is the
interactive transcription (5,904 lines). The cross-link pass (24 edges across 649 nodes = the
visible gap) is the next P1.
