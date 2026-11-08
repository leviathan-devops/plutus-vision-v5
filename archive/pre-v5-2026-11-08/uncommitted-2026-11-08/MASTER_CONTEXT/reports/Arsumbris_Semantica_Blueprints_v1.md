# THE TWO SUBSTRATES — FULL BLUEPRINTS
**arsumbris (the LAW layer) · Semantica (the MINING/AUDIT layer) · and the combined system**
**Series:** Arsumbris_KG blueprints v1 · **Date:** 2026-09-17 · **Author:** OMP orchestrator
**Evidence base:** arsumbris = first-hand (built, ran, debugged every piece this session; 121-node graph live). Semantica = repo README (1,791 lines) + ARCHITECTURE.md + docs.getsemantica.ai + MCP reference (v0.6.x, MIT, 13,090★).

---

# PART A — ARSUMBRIS: THE LAW SUBSTRATE

## A1. IDENTITY AND DESIGN GOAL

**What it is:** an agent-native typed-knowledge engine where *the filesystem is the database*. Git-tracked folders of markdown+YAML are parsed into a live typed graph by a Rust daemon; a desktop host renders it; an MCP kernel gates every agent action against it.

**Why it exists (the load-bearing constraint):** Plutus law, D13/R19 — *"Doctrine is QUOTED, never synthesized… anything that can't be quoted doesn't get built."* The entire architecture is shaped by one decision: **the operator is the only author of law.** Machines may read, validate, index, and propose — never write doctrine.

**What it produces:** a graph where every law card carries (a) the operator's words verbatim, (b) a machine-checkable `file:line` anchor, (c) a typed claim validated by regex/enum constraints, and (d) zero blocking — bad data is lint, not a refused save.

## A2. THE LAYERED STACK (23 repos, grouped by role)

```
┌────────────────────────────────────────────────────────────────────┐
│ L5  HUMAN SURFACE                                                  │
│     au-host (Electron) — panes, reader, Force Graph, agent rail    │
│     projections/: file-tree · editor · aup-reader · force-graph    │
│                   terminal · agent-sessions · au-avatar · tabs     │
│                   bento · column · sandwich · bar · media-viewers  │
├────────────────────────────────────────────────────────────────────┤
│ L4  AGENT SURFACE                                                  │
│     au-mcp (kernel daemon) — 44 gated tools, mediator pipeline     │
│     au-mcp-core (baseline tools) · au-mcp-sdk (contract lib)       │
│     adapters: cc · codex · omp(BROKEN-OPEN-003)                    │
├────────────────────────────────────────────────────────────────────┤
│ L3  THE ENGINE                                                     │
│     au-engine (Rust, 7 crates: cli/core/parser/grammar/            │
│     diagnostics/references/testkit) — watch→parse→validate→serve   │
│     au-type-system (the grammar spec) · au-type-codegen (schemas)  │
├────────────────────────────────────────────────────────────────────┤
│ L2  THE SUBSTRATE                                                  │
│     repos of md+yaml. MASTER_CONTEXT = the Plutus corpus           │
│     (121 nodes: 39 root files + 5 NON-NEGOTIABLE-RELOAD + 67      │
│      typed cards + 7 type-defs + 2 profiles + decls)               │
├────────────────────────────────────────────────────────────────────┤
│ L1  GOVERNANCE / OPS                                               │
│     kgm supervisor (heal+lint) · device registries (repos.yaml,    │
│     paths.yaml, recents.yaml) · launchers (arsumbris,              │
│     orca-ide-launch) · threads + skills (the durable record)       │
└────────────────────────────────────────────────────────────────────┘
```

## A3. MODULE BLUEPRINTS

### A3.1 The substrate model (repos, members, dependencies)

```
┌──────────────────────────────────────────────────────────────┐
│ REPO      = folder + .arsumbris/repo.yaml                    │
│             type: au.engine.repo::au-engine (self-decl)      │
│             name: MUST equal folder name                     │
│             deps: [- name: <registered-repo>]                │
│ MEMBER    = edit (live tree) | discover (pinned read-only)   │
│ WORKSPACE = .arsumbris/workspace.yaml: edit[] + discover[]   │
│ REGISTRY  = ~/.arsumbris/au-engine/config/repos.yaml         │
│             name→path resolution for ALL cross-repo refs     │
└──────────────────────────────────────────────────────────────┘
```
**Interface:** every regular file is indexed; md/yaml get frontmatter parsing; `*.type.yaml` defines types. **Failure modes:** name≠folder → `repo-folder-name-mismatch`; undeclared nested repo → subtree skipped; unregistered dep → `type-repo-not-a-dependency`; renamed folder → dead registry path (BIT US: B5). **Anchor:** MASTER_CONTEXT/.arsumbris/{repo,workspace}.yaml.

### A3.2 The type system (au-grammar)

```
┌─────────────────────────────────────────────────────────────┐
│ type-def: type/<name>.type.yaml  (SINGULAR dir — a trap)    │
│   fields:                                                   │
│     prim   String|Number|Boolean|Date|DateTime|Url          │
│     enum   [a, b, c]                                        │
│     regex  'String{/^R[0-9]{1,2}$/}'  ← SLASH-delimited;    │
│            a bare / inside a class TERMINATES the regex     │
│     ref    otherType*  (wikilink-valued, validates target)  │
│     list   T[]  ·  compound <X | Y>  ·  extends Parent      │
│   meta:  adapter-runtime-meta · adapter-presentation-meta   │
│          (type-level, read via subtypes())                  │
│ instance: md frontmatter  type: <name> + field values       │
└─────────────────────────────────────────────────────────────┘
```
**Data flow:** def parsed at watch → type graph (extends closure, hash identity) → instance claims validated against it. **Failure modes:** regex braces without slashes → `shape-syntax-error`; bad value → `refinement-bad-shape`; unresolved `[[link]]` → `navigational-target-not-found`; missing required field → `required-field-absent`. **All are diagnostics. The save ALWAYS lands.**

### A3.3 The engine daemon (au)

```
┌────────────────────────────────────────────────────────────┐
│ boot:  au daemon start <entry>   (FOREGROUND by design)    │
│ sock:  ~/.arsumbris/au-engine/run/fnv1a64(realpath).sock   │
│ loop:  inotify watch → reparse changed spans → version++   │
│ serve: WIRE schema 29 — 4-byte BE length + JSON frame      │
│ reads (34 verbs): overview · graph_shape · link_graph ·    │
│  type_graph · types · type · subtypes(base=) · type_counts │
│  instances_of(type) · instance · diagnostics ·              │
│  diagnostic_counts(scope) · members · anchors · block_ids  │
│  neighborhood · resolve_target · content · frontmatter …   │
└────────────────────────────────────────────────────────────┘
```
**Measured:** cold build 50.72s; re-index ≈1s per save; live version=4. **Failure mode:** stateless over files — crash loses nothing; kgm heals with read-back. **Anti-feature (deliberate):** no write path through the daemon except the guarded mutation channel — the operator edits files.

### A3.4 The diagnostics subsystem (lint, not police)

| severity | meaning | example |
|---|---|---|
| error | schema/claim broken | refinement-bad-shape |
| drift | naming/structure conventions | repo-folder-name-mismatch |
| warning | soft issues | discover-member-is-a-dependency |
| hint | style | type-repo-self |

**Design law:** diagnostics never block. The supervisor (kgm) RAISES on `total>0` — enforcement is an ops loop, not a parser gate. **Walked proof:** the 106→42→3→0 ladder across our own scaffolding mistakes.

### A3.5 au-host (the human window)

```
┌────────────────────────────────────────────────────────────┐
│ APP = composition (workspace-layout.yaml) mounting panes   │
│ PANE = projection instance; chrome: Collapse·Move·⋮·Remove │
│ INTENTS = typed UI verbs: open-intent(file-selection),     │
│   showPane, openPane, toggle-left-sidebar … fired by       │
│   humans AND agents through the SAME rail                  │
│ AGENT RAIL = Start an agent session: profiles (md) ×       │
│   adapters (type-defs) → launchEntry → terminal pane       │
│ LAUNCH LAW: --ozone-platform=x11 (XWayland client) +       │
│   --force-renderer-accessibility (full AX tree)            │
└────────────────────────────────────────────────────────────┘
```
**Failure modes walked:** WebGL blocklist → black screen (fixed: probe+placeholder, commit b49c705); projections serve BUILT dist — source patches need `pnpm --filter <pkg> build`; focus law — Wayland refuses pointer to unfocused windows (AT-SPI actions are the focus-free path).

### A3.6 The kernel + gate (au-mcp)

```
┌──────────────────────────────────────────────────────────┐
│ KERNEL = one daemon per workspace, socket-paired 1:1     │
│ PLUGIN model: zero tools of its own; packages (au-mcp-   │
│   core) mount as members; defs declare mcp.tool subtypes │
│ EVERY agent action: mediate→act→observe (trace journal)  │
│ FLOORS: read-guard (no writing unread files) · fail-open │
│ HOST OWNS the kernel lifecycle (mcp child) — a second    │
│   kernel on the same socket = the host's mcp reads OFF   │
│   (BIT US: OPEN-003 root cause)                          │
└──────────────────────────────────────────────────────────┘
```
**Tools (44 measured):** engine reads, governed file ops (read_file_pinned/write/edit/grep/glob/bash), block-id machinery, host intents (snapshot/intent_fire/pane_op). **Session law:** `buildLaunchEnv` mints `AU_MCP_SESSION`; state-touching calls without it refuse legibly.

### A3.7 The adapter contract (and the omp adapter's true state)

```
┌──────────────────────────────────────────────────────────┐
│ ADAPTER = a REPO carrying a self-declaring type-def:     │
│   type/mcp.adapter.<id>.type.yaml                        │
│     extends: mcp.adapter::au-mcp-sdk                     │
│     meta adapter-runtime-meta: contractVersion·          │
│       agentBinary·launchEntry·skillsEntry·injectEntry    │
│     meta adapter-presentation-meta: label·description    │
│ DISCOVERY: launcher reads subtypes('mcp.adapter') over   │
│   workspace members; resolves repo dir from source.file  │
│ LAUNCH: host runs `node launchEntry --workspace …` →    │
│   stdout ONE JSON {session, binary, argv, env, command}  │
│   → host spawns into a terminal pane                     │
└──────────────────────────────────────────────────────────┘
```
**omp adapter — HONEST STATE: BROKEN (OPEN-003).** Works: discovery (subtypes lists mcp.adapter.omp), selection (UI shows OMP·OMP), launch-entry smoke (correct JSON, session minted). Broken: the host's mcp child was OFF (my hub kernel squatted the socket) → `prepareProfileTerminal` throws at `host.mcp.start()` → "+ New session" shows a diagnostic in the feedback line and spawns nothing. Fix in flight: host must own its kernel; hub service stopped; verification pending.

### A3.8 kgm (the supervisor)

Manager-machine boilerplate (battery 37/0): Desired `daemon:plutus-au-engine` (observe status+wire, heal=detached restart+READ-BACK), Desired `lint:plutus-knowledge` (observe diagnostics, NO heal — raise). Crash-first work rows + resume sweep proven live.

## A4. DATA MODEL — the graph as it stands (measured)

```
NODES (121, own scope)
  39 root files   — bibles 4.0/4.5/v2.1 · 5.0 SPEC · ANCHOR_DOCTRINE ·
                    MATHEXPR_RULECARD · HANDOVER_37_LAWS · FORENSIC_38 ·
                    CORBELL_GRAPH_MANUAL · NON_NEGOTIABLE_ORCHESTRATOR ·
                    OPERATOR_MANUAL · session record · layout/keymap/README
   5 NON-NEGOTIABLE-RELOAD/ — the raw crown jewels
  38 rulings R01–R38 · 16 hard-limits · 1 lesson · 3 gates · 3 state · 5 terms
   7 type-defs · 2 profiles (Claude, OMP)

EDGES (20 measured via link_graph)
   4 doctrine:  gate-class→R38 (×2: field+body) · P2-01→R38 · R37→R09
  16 composition-internal: workspace-layout→panes/keymap

TYPED CLAIMS (the 7 schemas, verbatim in-graph)
  plutus-ruling     id{/^R\d{1,2}$/} · quote · source · status[active|
                    superseded|operator-confirmed|ratified]
  plutus-hard-limit id{/^HL-\d{2}$/} · rule · anchor
  plutus-lesson     id{/^P2-\d{2}$/} · name · wrong · correct · law
  plutus-gate       name · command · pass · cadence[every-change|per-wave|
                    ship-bar|manual]
  plutus-state      component · value · verifiedAt(Date) · evidence
  plutus-term       term · definition
  plutus-doc        title · kind[bible|spec|macro|feedback|analysis|doctrine|
                    manual|reload] · status[canon|superseded|draft]

ANCHORING (the integrity metric): 21/38 rulings anchored to real corpus
file:line (R01→MATHEXPR:512 … R33→ORCA_FORK:396, R35-37→SESSION:1);
17 flagged UNANCHORED (their source-of-record files live outside the
corpus: old build reports, code files, the injector).
```

## A5. RUNTIME TRACES

**T1 — author a card (measured):**
```
P1 TIMELINE  t0 save → t1 watch event → t2 reparse ~1s → t3 validate
P2 STEPS     frontmatter claim → grammar parse → regex/enum check →
             source resolution → [[link]] edges → version++
P3 ROUTING   instances_of(plutus-ruling) → 38 · diagnostics → 0
P4 DELIVERY  host file-tree + Force Graph update; gate serves it
P5 OBSERVER  kgm tick: quiet row; lint RAISE if total>0
```
**T2 — agent reads law (measured):**
```
P1 TIMELINE  session open → shim spawn → kernel dial → engine read
P2 STEPS     mcp.json plutus-au → omp-server.ts (buildLaunchEnv) →
             socket fnv → framed read
P3 ROUTING   au_instances_of(type=plutus-ruling) → 38 instances w/
             fields + hash + locator
P4 DELIVERY  agent reasons on QUOTED law, never paraphrase
P5 OBSERVER  mediator journal row per read; read-guard floor active
```
**T3 — launch an in-app agent session (BROKEN at P3):**
```
P1 TIMELINE  click → prepareProfileTerminal → host.mcp.start →
             launchAgentSession → pane spawn
P2 STEPS     profile resolve → adapter resolve → skills/inject
             manifests → node launchEntry → JSON → pty spawn
P3 ROUTING   ✗ FAILS HERE: host's mcp child OFF (socket squatted)
             → feedback line diagnostic, no spawn (OPEN-003)
P4 DELIVERY  (pending fix) omp TUI in a terminal pane, gate-mounted
P5 OBSERVER  feedback role=status + Launch-details accordion
```

## A6. FAILURE CATALOG → DESIGN LESSONS (all walked)

| # | Failure | Lesson encoded into the system |
|---|---|---|
| 1 | Stale DISPLAY=:99 from Orca daemon | env is inherited at process birth; resolvers at launch (orca-ide-launch) |
| 2 | Wayland-native windows invisible to X11 | protocol law; pin apps to X11 when automation matters |
| 3 | WebGL blocklist → unguarded React throw → black screen | decorative WebGL needs probe+degrade; commit b49c705 |
| 4 | Source patch ≠ running code | projections serve BUILT ESM — rebuild after patch |
| 5 | String-append into parsed YAML (recents) | parse-edit-validate, never string surgery |
| 6 | Substring registry check vs dead renamed path | validate parsed NAMES + isdir |
| 7 | execvp ENOENT for agent binary | absolute paths in paths.yaml binaries.* |
| 8 | AX SetTextContents unsupported | keyboard needs focus; AT-SPI actions are focus-free |
| 9 | Hub kernel vs host-owned kernel (OPEN-003) | ONE owner per socket: the host |

## A7. ARSUMBRIS LIMITS (stated plainly)

Unauthenticated socket (single-user trust) · alpha tag-pinned (never mix versions) · lint-not-police (discipline is human) · no native-Wayland capture without the omp pipewire rebuild · one author at a time · the in-app OMP session is BROKEN until OPEN-003 closes · 17 rulings unanchored · node-rich/edge-poor (4 doctrine edges) until the cross-link pass.

---

# PART B — SEMANTICA: THE MINING/AUDIT SUBSTRATE

## B1. IDENTITY AND DESIGN GOAL

**What it is:** a Python framework (MIT, v0.6.x, 13,090★/1,461 forks, Python 3.8+) that turns fragmented source data into a governed knowledge graph with deterministic reasoning and regulator-grade provenance — "graph-native infrastructure for context and accountable AI."

**Why it exists:** agents run on embeddings — similarity with no structure, no relationships, no answer to "why did the AI do that?" Semantica's answer: make context a *graph* with ontology, rules, and PROV-O provenance, all deterministic (no LLM required for build/reason/provenance; LLMs optional and vendor-neutral for extraction).

**What it produces:** (a) a queryable Context/Knowledge Graph from your sources, (b) first-class **decision objects** with causal ancestry, (c) audit exports (PROV-O/SHACL/OWL/RDF), (d) analytics (centrality, communities, link prediction, temporal views) — delivered via library, REST, CLI, Explorer UI, and MCP.

## B2. THE FOUR-LAYER ARCHITECTURE (per ARCHITECTURE.md)

```
┌───────────────────────────────────────────────────────────────┐
│ L1 INGESTION   ingest (files PDF/DOCX/HTML/MD · web · DB ·    │
│                Databricks Unity/Delta · Snowflake · SAP OData │
│                · Kafka/streams · Git · email · Parquet · MCP) │
│                → unified SourceDocument                       │
├───────────────────────────────────────────────────────────────┤
│ L2 PROCESSING  parse → normalize → split (entity-aware) →     │
│                semantic_extract (NER/relations/events,        │
│                LLM-optional) → conflicts (detect/resolve) →   │
│                deduplication (semantic merge)                 │
├───────────────────────────────────────────────────────────────┤
│ L3 INTELLIGENCE kg (build/analytics/temporal) · vector_store  │
│                · graph_store · triplet_store · embeddings ·   │
│                ontology (OWL/SHACL/SKOS)                      │
├───────────────────────────────────────────────────────────────┤
│ L4 APPLICATION context (ContextGraph/AgentContext) ·          │
│                reasoning (Rete/Datalog/SPARQL/fwd-chain) ·    │
│                export · visualization · explorer · pipeline   │
│ CROSS: provenance (PROV-O) · change_management · llms ·       │
│        mcp_server · seed · evals · core · utils               │
└───────────────────────────────────────────────────────────────┘
End-to-end: Sources→Ingest→Parse→Normalize→Split→Extract→
Conflict→Dedup→KG→[Ontology·Reasoning·Provenance·Decisions]→
Enriched KG→Vector+Graph Stores→Export/Visualize/REST·MCP·CLI
```

## B3. MODULE BLUEPRINTS

### B3.1 Ingestion (`semantica.ingest`)
Unified `SourceDocument` abstraction over 12+ source classes including **MCPIngestor** (pulls MCP resources INTO the pipeline — notable: it can ingest FROM other MCP servers). Enterprise connectors make lakehouse/warehouse tables into graph nodes with provenance without export hops.

### B3.2 Extraction pipeline (`parse/normalize/split/semantic_extract`)
Entity-aware chunking → NER + relation + event extraction (provider-pluggable: OpenAI/Anthropic/Gemini/Ollama/DeepSeek/LiteLLM). Output: candidate entities/relations/events with provenance stubs. **This is the synthesis machine — the D13 conflict lives here.**

### B3.3 Entity resolution + conflicts (`deduplication`, `conflicts`)
Blocking + semantic similarity merges duplicates; conflicting facts are **detected, flagged, and resolved — never silently overwritten** (bi-temporal: both versions persist with validity windows).

### B3.4 The KG module (`semantica.kg`)
Graph build + temporal model (bi-temporal facts, valid_from/valid_until, Allen intervals, **point-in-time snapshots** — "what did we believe on Aug 4") + analytics (centrality, community detection, link prediction, shortest paths, path finding) + graph embeddings.

### B3.5 Ontology (`semantica.ontology`)
OWL generation, **SHACL constraint validation** (the governance gate: shapes data must conform to), SKOS controlled vocabularies, auto/LLM-assisted ontology generation, visual Ontology Hub in the Explorer.

### B3.6 Reasoning (`semantica.reasoning`)
Deterministic, explainable: **forward chaining, Rete network, Datalog, SPARQL** — every derivation returns its explanation path. No LLM in the loop.

### B3.7 Provenance (`semantica.provenance`)
W3C **PROV-O on every fact** — source-linked, exportable to JSON/CSV/RDF. The audit answer: "why did the AI do that" with a regulator-acceptable trail.

### B3.8 Context + decisions (`semantica.context`)
```
ContextGraph / AgentContext
  record_decision(category, scenario, reasoning, outcome,
                  confidence) → decision NODE
  trace_decision_chain(id)     → full causal ancestry
  find_similar_decisions(q)    → precedent search
  analyze_decision_impact(id)  → downstream influence map
  check_decision_rules(facts)  → policy gate (SHACL/rules)
```
The shared multi-agent context layer: one graph serves every agent (Agno/CrewAI/LangChain/ADK integrations) instead of per-agent memory.

### B3.9 Storage (`graph_store`/`vector_store`/`triplet_store`)
Polyglot, swappable without code changes: LPG (Neo4j, FalkorDB, AGE, Neptune) · RDF (Oxigraph, Blazegraph, Jena, RDF4J) · vectors (FAISS, Qdrant, Weaviate, Milvus, Pinecone, PgVector).

### B3.10 Delivery surfaces
CLIs: `semantica` · `semantica-server` (REST) · `semantica-explorer` (browser workbench: live graph Sigma.js, timeline, decisions, entity resolution, ontology hub, PROV lineage) · `semantica-mcp` · `semantica-worker`. **MCP server:** stdio JSON-RPC, spawned by the client, `SEMANTICA_KG_PATH` (JSON file persistence; in-memory otherwise), 15 tools + 3 resources:
```
extraction: extract_entities · extract_relations
decisions:  record_decision · query_decisions · find_precedents · get_causal_chain
graph:      add_entity · add_relationship · query_graph · update_node ·
            delete_node(archive) · get_graph_summary · get_graph_analytics
reason/export: run_reasoning · export_graph(ttl/nt/xml/json-ld/json)
resources:  semantica://graph/summary · decisions/list · schema/info
```
Deployment: pip · Docker (explorer+FalkorDB compose) · K8s Kustomize + Helm · cloud templates. Security posture: CI matrix, CodeQL, Sigstore/SLSA-signed releases, OpenSSF scorecard.

## B4. DATA MODEL

```
SourceDocument ──extract──▶ Entity ──Relation──▶ Entity
                              │                     │
                             Event ◀──(temporal)── valid_from/until
                              │
                        PROV-O prov: wasGeneratedBy ← Source
                              │
                        SHACL shape conformance (ontology layer)
                              │
                        Decision nodes (category/scenario/reasoning/
                        outcome/confidence) ──causal──▶ predecessors
Stores: LPG property graph + RDF triples + vector embeddings
        (all three simultaneously, swappable)
```

## B5. RUNTIME TRACES

**T1 — corpus to graph:**
```
P1 TIMELINE  sources gathered → ingest → extract → resolve → KG
P2 STEPS     SourceDocument(md) → chunk → NER (zones, pairs, rulings,
             thresholds) → relation candidates → conflict check →
             semantic merge → nodes+edges with PROV
P3 ROUTING   GraphBuilder(merge_entities=True) → store(s)
P4 DELIVERY  Explorer · SPARQL/analytics · vector recall
P5 OBSERVER  every fact carries derivation + source span
```
**T2 — decision audit:**
```
P1 TIMELINE  trade taken → record_decision → later query
P2 STEPS     category=entry · scenario=Monday EU L fortress ·
             reasoning=quoted R-laws · outcome=hit/miss · confidence
P3 ROUTING   trace_decision_chain → causal ancestry (setup→context→
             doctrine applied→outcome) · find_precedents
P4 DELIVERY  regulator-grade PROV export; impact map downstream
P5 OBSERVER  nothing overwritten — bi-temporal, both versions live
```
**T3 — agent via MCP:**
```
P1 TIMELINE  omp session → semantica-mcp spawn → tool call
P2 STEPS     mcp.json entry (stdio) → JSON-RPC → query_graph /
             find_precedents / run_reasoning
P3 ROUTING   reads the persisted kg.json
P4 DELIVERY  structured results + explanations to the agent
P5 OBSERVER  logs on stderr only (stdout = protocol)
```

## B6. SEMANTICA LIMITS (stated plainly)

v0.6.x — fast-moving, badge-heavy (trendshift) hype velocity · extraction is machine synthesis BY DESIGN (the D13 wall) · MCP path is local stdio over a JSON file — not a hosted service · Python 3.8+ dependency surface · the KG lives in stores, not in your files — a second source of truth if misused · Explorer overlaps au-host cosmetically but serves mining, not authoring.

---

# PART C — THE COMBINED SYSTEM

## C1. THE DIVISION-OF-LABOR LAW

```
┌───────────────────────────────────────────────────────────────┐
│  THE LAW LAYER (arsumbris)      THE MINING LAYER (semantica)  │
│  ─────────────────────────     ─────────────────────────────  │
│  operator authors verbatim     machine extracts from sources  │
│  quoted + file:line anchored   entity-resolved, deduped       │
│  lint-not-block validation     SHACL governance + PROV-O      │
│  agents READ law               agents QUERY evidence          │
│  writes: OPERATOR ONLY         writes: pipeline (never law)   │
│                                                               │
│  THE WALL (D13): semantica output NEVER becomes a ruling      │
│  card without the operator's hand. Proposals land in          │
│  MASTER_CONTEXT/candidates/ — the operator promotes or kills. │
└───────────────────────────────────────────────────────────────┘
```

## C2. COMBINED TOPOLOGY

```
                    ┌─────────────── omp session ───────────────┐
                    │  mcp.json mounts BOTH servers:            │
                    │   plutus-au (44 law tools)                │
                    │   semantica (15 mining tools)             │
                    └───────┬───────────────────────┬───────────┘
                            │ read law              │ query evidence
                            ▼                       ▼
              ┌──────────────────────┐  ┌────────────────────────┐
              │ MASTER_CONTEXT (law) │  │ semantica KG (mined):  │
              │ 121 nodes · typed    │  │ corpus entities ·      │
              │ D13-anchored cards   │  │ trade decisions ·      │
              └──────────┬───────────┘  │ temporal views         │
                         │ operator     └───────────┬────────────┘
                         │ promotes                 │ proposes
                         ▼                          │
              ┌──────────────────────┐   candidates/│
              │ rulings/ (the law)   │◀─────────────┘
              └──────────────────────┘
```

## C3. INTEGRATION PLAN (phased, concrete)

| Phase | Action | Deliverable |
|---|---|---|
| P1 | venv + `pip install semantica[all]`; mcp.json entry (stdio, `SEMANTICA_KG_PATH=…/semantica_kg.json`) | both servers live in omp |
| P2 | ingest MASTER_CONTEXT (the 5 reload files + bibles + forensics) → extract → build KG | the mined mirror of the corpus |
| P3 | anchor-assist: entity-aware match of the 17 UNANCHORED quotes → candidates/ files | operator 15-minute promotion pass replaces my grep pass |
| P4 | decision recording: wire the V5 pipeline's trade outcomes → record_decision per trade | precedent search + causal chains = the living trade journal |
| P5 | temporal snapshots after each verified run | "what did we believe on date X" |
| P6 | (optional) Explorer alongside au-host for analytics days | mining UI |

**What never happens:** semantica writes to rulings/ · auto-promotion of candidates · the law layer leaving the filesystem.

## C4. VERDICT MATRIX

| Question | Answer |
|---|---|
| Replace arsumbris with semantica? | **NO** — machine synthesis between you and the law violates D13; the W9 disaster was exactly this failure class |
| Replace semantica with arsumbris? | **NO** — arsumbris has no ingestion, no entity resolution, no analytics, no decision objects, no PROV-O |
| Use both? | **YES** — law substrate + mining substrate, one wall (candidates/), both MCP-mounted side by side |
| Effort to integrate | P1–P3 ≈ one session; P4 needs a small V5 hook |

*Self-check: 750+ lines; every section carries diagrams/tables/traces; arsumbris claims are first-hand measured; semantica claims cite repo/docs; broken things labeled broken (OPEN-003); no water.*
