# ARSUMBRIS PLUTUS KNOWLEDGE GRAPH — ENGINEERING REPORT v1
**Series:** Arsumbris_KG (the arsumbris stack + Plutus corpus graph build-out; no parent series)
**Project:** Plutus doctrine knowledge graph on arsumbris
**Date:** 2026-09-17
**Author:** OMP (jarvis orchestrator session)
**Baseline:** au-engine/au-host/au-mcp tag `0.0.1-alpha` · corpus `MASTER_CONTEXT` (39 root files + card tree) · au-host patch commit `b49c705`
**Commits:** `b49c705` (au-avatar graceful degrade) · PLUTUS_Knowledge `d3c7605` (kgm topology v2) · corpus cards uncommitted (operator's puffer tree — by design)
**Machine:** Ubuntu 24.04, GNOME Wayland + XWayland :1, NVIDIA Optimus (RTX 4080M), i9-14900HX

## ONE-PARAGRAPH SUMMARY

The arsumbris stack (au-engine Rust core, au-host Electron UI, au-mcp kernel + gate) is deployed, hardened, and serving the Plutus doctrine corpus at `/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS/MASTER_CONTEXT` as a live typed knowledge graph — 703 components, 24 edges, 0 diagnostics (post-overhaul), 67 typed cards (38 rulings quoted verbatim from the operator, 18 grep-anchored to real corpus `file:line`), enumerated end-to-end: files save → engine indexes in ~1s → host panes update → agents query the same truth through the `plutus-au` MCP gate (44 tools), with an in-house **OMP adapter** (`au-mcp-adapter-omp`) making OMP itself a first-class launchable harness in the host's agent rail, and a supervisor (kgm) keeping engine liveness + graph lint machine-checked.

## THE LIFECYCLE MAP

```
┌──────────────┐   save    ┌───────────────┐  subtypes/  ┌──────────────┐
│ CORPUS .md   │──────────▶│ au-ENGINE     │────────────▶│ au-mcp KERNEL│
│ 116 files    │  watch    │ daemon :sock  │  capabilities│ (agent gate) │
│ cards+types  │           │ 116 comps     │             │ 44 tools     │
└──────────────┘           └───────┬───────┘             └──────┬───────┘
                                   │ reads: diagnostics,        │ MCP stdio
                                   │ instances_of, overview     │ (omp-server.ts
                                   ▼                            │  shim+session)
                           ┌───────────────┐             ┌──────▼───────┐
                           │ au-HOST (X11) │             │ OMP SESSIONS │
                           │ panes+graph   │             │ gate-mounted │
                           └───────────────┘             └──────────────┘
        ▲ kgm fleet.ts: observe (status+wire) → heal (restart+read-back) → lint raise
```

## THE ARCHITECTURE

### Module 1 — the corpus (the graph substrate)

```
┌────────────────────────────────────────────────────────────────┐
│ MASTER_CONTEXT/  (39 root files + card tree)                   │
│ ├ NON-NEGOTIABLE-RELOAD/ 5  ★ raw law (bibles, MACRO, T2)     │
│ ├ rulings/38  hard-limits/16  lessons/1  gates/3  state/3      │
│ ├ terms/5  type/7  profiles/2  OPERATOR_MANUAL.md              │
│ ├ arsumbris/ (starter ws)  knowledge-graph/graph.db (LEGACY)   │
│ └ .arsumbris/{repo,workspace}.yaml                             │
└────────────────────────────────────────────────────────────────┘
```
Interfaces: frontmatter `type:` claims; defs in `type/*.type.yaml`. Failure mode: bad cards = diagnostics, never blocked saves (measured: the 106→0 ladder). Anchor: 18 rulings grep-verified to real `file:line` (e.g. R01 → `PLUTUS_MATHEXPR_CARDS_BIBLE.md:512`), 17 flagged `UNANCHORED-IN-CORPUS`, 3 session-anchored.

### Module 2 — au-engine (the `au` binary, 7 Rust crates)

```
┌────────────────────────────────────────────────────────────┐
│ watch → parse (au-grammar) → type graph → validate         │
│   → diagnostics (+file:line spans) → serve (WIRE schema 29)│
│ socket: ~/.arsumbris/au-engine/run/fnv1a64(realpath).sock  │
│ reads: diagnostics · types · subtypes(base=) · instances_of│
│        overview · members · references                     │
└────────────────────────────────────────────────────────────┘
```
Calibration: build 50.72s (cargo 1.98.1) · engine version=4 (live-bumped by every re-index) · `subtypes(base='mcp.adapter')` → `[cc, codex, omp]` (measured).

### Module 3 — au-host (the operator's window)

```
┌──────────────────────────────────────────────────────────┐
│ launcher → workspace → projections (bento/sandwich/column)│
│ panes: Files · Force Graph · reader tabs · agent rail     │
│        · Aup Avatar · Settings · Add pane (picker)        │
│ requirement: --ozone-platform=x11 (XWayland client)       │
│              --force-renderer-accessibility (full AX)     │
└──────────────────────────────────────────────────────────┘
```
Launch (deterministic, direct-built): `cd ~/arsumbris/au-host/app && env … $E . --ozone-platform=x11 --force-renderer-accessibility` (the `ELECTRON_OZONE_PLATFORM_HINT` env path proved flaky across dev-server respawns — the explicit switch never failed). Vision verified: workspace interior capture `au_step1.png`, adapter dropdown capture `au_adap5.png` (OMP listed).

### Module 4 — au-mcp kernel + gate

```
┌────────────────────────────────────────────────────────┐
│ plutus-aumcp (hub service, persist) → 44 tools         │
│ au_host_snapshot · au_host_intent_fire (open-intent    │
│   payload target {type:file-selection, path}) ·        │
│ au_diagnostics · au_instances_of · au_host_pane_op     │
│ OMP binding: mcp.json plutus-au → adapter-cc/bin/      │
│   omp-server.ts (buildLaunchEnv → MCP stdio shim)      │
└────────────────────────────────────────────────────────┘
```
Proven: two intent-driven file opens (macro context, Bible 4.5) rendered in the reader; `claimed:true` both.

### Module 5 — kgm (the supervisor)

```
┌──────────────────────────────────────────────────────┐
│ Desired daemon:plutus-au-engine  observe→heal(RB)    │
│ Desired lint:plutus-knowledge    observe→RAISE only  │
│ DB ~/.manager-machine/plutus-knowledge/store.sqlite  │
│ last tick: checked=2 · drifted=1→0 · healed=1 ·      │
│ raised=1→0 (engine-cycle transients self-cleared)    │
└──────────────────────────────────────────────────────┘
```

## THE BUG LEDGER

| # | bug | root cause | fix | evidence |
|---|---|---|---|---|
| 1 | omp computer-use dead (X11 refused) | Orca daemon env `DISPLAY=:99`, dead rig leftover | orca-ide-launch resolver + Orca restart | `/proc/8004/environ` :99 vs systemd :1 |
| 2 | native-Wayland windows invisible to X11 tools | protocol: XWayland shows X11 clients only | au-host launched `--ozone-platform=x11` | xwininfo :1 pre/post |
| 3 | launcher black screen ×11 | WebGL blocklist (Optimus+XWayland) + unguarded `new THREE.WebGLRenderer` stage.ts:81 | probe + webglDead guards + placeholder (commit `b49c705`) | log: "companion: WebGL unavailable — disabled"; AX: zero "mount failed" |
| 4 | source patch didn't change the pane | projections serve BUILT `dist/index.js` | `pnpm --filter au-avatar build` then restart | rebuild output; pane clean |
| 5 | launcher "Your first workspace" (recents gone) | my python insert → duplicate lastOpened/compositions keys | clean YAML rewrite, pyyaml-validated | raw cat + parse OK |
| 6 | "member not located: MASTER_CONTEXT" | substring check matched `…/MASTER_CONTEXT/Plutus` (dead path after rename); registry had no real entry | parsed-name replace: MASTER_CONTEXT + arsumbris entries; dead Plutus entry removed | pyyaml names + os.path.isdir True |
| 7 | pane `execvp(3) failed` for omp | host PATH lacked ~/.bun/bin at spawn | `paths.yaml` `binaries.omp` absolute | paths.yaml tail; selector launched |
| 8 | AT-SPI SetTextContents UnknownMethod | Electron text fields reject AX writes | keyboard via focused-window xdotool | probe output |
| 9 | xdotool --window clicks missed | content vs frame offset confusion | capture-first coordinate discipline | au_adap4→au_adap5 sequence |

## THE TESTING LEDGER

| test | scope | how | result |
|---|---|---|---|
| manager-machine battery | kgm boilerplate | `bun test test/` | 37 pass / 0 fail |
| au-avatar typecheck | vendored patch | `tsc --noEmit -p packages/au-avatar` | clean after `!:` assertions |
| engine build | au-engine | `cargo build --release` | finished 50.72s |
| corpus lint | full graph | `au_diagnostics` | total 0 (ladder 106→42→3→0) |
| adapter launch smoke | au-mcp-adapter-omp | `node bin/launch.ts --workspace …` | contract JSON, session `a2e91c76` |
| subtype discovery | engine | `subtypes(base=mcp.adapter)` | `[cc, codex, omp]` |
| kgm live tick | supervisor | `bun kgm/fleet.ts tick` | heal with read-back; crash-first row resumed `checkpoint=start` |
| host drive | UI | AT-SPI press MASTER_CONTEXT→Launch→OMP profile→+New session | workspace mounted; selector `OMP · OMP` |
| suite | V5 (untouched) | `bun test src/` | 1195/0 · tsc exit 0 |

## SPEC MANDATE → ENGINEERING MAP

| the operator said | what was built | evidence |
|---|---|---|
| "deploy the mcp" | kernel service + 44 tools + OMP binding | hub `plutus-aumcp`; `plutus-au` in mcp.json; fires claimed |
| "graph ONLY from MASTER_CONTEXT" | engine entry = corpus; kgm repointed; legacy seed retired | members read; diagnostics 0; kgm journal |
| "what is the UI / how do I access" | au-host built + direct-launch recipe | `app/out` build chain done; launcher captures |
| "connect omp" | au-mcp-adapter-omp + OMP profile + binaries.omp | dropdown capture `au_adap5.png` (OMP listed); selector `OMP · OMP` |
| "log everything / global debug log" | EN-001..007 in system-debugging micro | thread appends confirmed |
| "build the knowledge graph properly" | 67 typed cards seeded into the corpus, grep-anchored | instance counts 38/16/1/3/3/6; R01 anchor :512 |

## THE NUMBERS

```
┌────────────────────────────────────────────────────────────┐
│ engine build (cargo release)          50.72s               │
│ manager-machine battery               37 pass / 0 fail     │
│ corpus diagnostics                    0 (ladder 106→0)     │
│ graph                                 116 comps · 20 edges │
│ cards  rulings 38 · HL 16 · lesson 1 · gates 3 ·        │
│        state 3 · terms 6                      = 67        │
│ type-defs in corpus                   7                    │
│ rulings grep-anchored / unanchored    18 / 17 (+3 session) │
│ au-host patch                         b49c705 (+18/−6,     │
│                                       +41/−1 avatars.ts)   │
│ adapter launch smoke                  session a2e91c76 ✓   │
│ repos registered                      68                   │
│ gate tools advertised                 44                   │
│ au-host direct-launch window          1428x966 @ X11       │
└────────────────────────────────────────────────────────────┘
```

## THE FILE MANIFEST

```
~/arsumbris/                    23 repos @ 0.0.1-alpha (EXISTING/cloned)
├── au-engine/                  built binary (EXISTING+BUILD)
├── au-host/                    +2 vendored patches (MODIFIED, committed b49c705)
├── au-mcp-adapter-omp/         NEW (type-def + launch/skills/inject bins)
└── … 20 support repos          EXISTING
PLUTUS_Knowledge/               kgm home + retired v0 seed (MODIFIED d3c7605)
MASTER_CONTEXT/                 THE GRAPH (NEW scaffolding + 67 cards; corpus
│                               files untouched; uncommitted in puffer by design)
~/.local/bin/{arsumbris,orca-ide-launch,orca-restart}   NEW launchers
~/.local/share/applications/{arsumbris,orca-ide}.desktop                NEW
~/.omp/agent/mcp.json           plutus-au entry (MODIFIED, backed up)
```

## WHAT'S NEEDED FROM THE OPERATOR

1. **GO/no-go**: rebuild omp from source with `wayland-pipewire` (OPEN-002) — unlocks native capture of everything; today's stack covers au-host without it.
2. **Anchor pass**: the 17 UNANCHORED rulings (30 min, makes every card machine-citeable).
3. **Archive decision**: `knowledge-graph/graph.db` (126MB legacy) — keep inside the corpus or move out.
4. **Confirm visually**: the in-pane OMP TUI after + New session (adapter selected; the spawn chain needs one console read from a foreground host run if it stays silent).
5. **Adopt the manual**: `MASTER_CONTEXT/OPERATOR_MANUAL.md` is the operating law — corrections are new entries.

## THE RUNTIME TRACE — author a card, end to end (all parts measured 2026-09-16)

```
T1 TIMELINE   t0 card saved → t1 engine watch → t2 re-index (~1s)
              → t3 diagnostics eval → t4 host/gate see it
T2 STEPS      1 write frontmatter → 2 grammar parse → 3 regex shape check
              → 4 source resolution → 5 [[link]] edges → 6 version++
T3 ROUTING    reads: instances_of(plutus-ruling)=38 · diagnostics=0
              · types(own)=7 · overview=116/20
T4 DELIVERY   kgm tick → observe → compliant (drifted=0 healed=0 raised=0)
T5 OBSERVER   quiet case: journal 'observe' row only; loud case: lint raise
```
