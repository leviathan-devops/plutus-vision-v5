# CANON MANIFEST — Plutus (created 2026-09-24)

> This is the per-project contract for the canon doc system. `canon-doc-update` reads
> it FIRST; `canon-doc-setup` scaffolds it. Every field below is checkable.

## PROJECT IDENTITY

| Field | Value |
|---|---|
| Project | Plutus — trading intelligence (knowledge graph + V6 architecture + model server stack) |
| Project root | `/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS/MASTER_CONTEXT` |
| Canon docs dir | `<root>/context_management/` |
| Doc count | **11** (9 standard + 2 high-frequency logs) |
| Last update | **2026-09-24** (model server stack stood up; 2 logs created; D-008..D-014 recorded) |
| Updated by | the 2026-09-24 session |

## THE 11 DOCS (semantics · floor · owner)

| # | Doc | Semantics | Floor | What it carries |
|---|---|---|---|---|
| 1 | `COMPACTION_SURVIVAL.md` | **OVERWRITE** | 200+ | the resume anchor: operating laws, settled doctrine, paths, residuals |
| 2 | `CURRENT_STATE.md` | **OVERWRITE** | 200+ | per-module status — architecture as it IS, not as designed |
| 3 | `NEXT_STEPS.md` | **OVERWRITE** | 200+ | the wave plan with done-when criteria |
| 4 | `TASK_QUEUE.md` | **OVERWRITE** | 200+ | gates · active · completed · backlog · blocked |
| 5 | `BUILD_STATE.md` | **OVERWRITE + append SHA** | 200+ | artifact inventory, SHA chain, verified results, frozen machinery |
| 6 | `CHANGELOG.md` | **APPEND** | 200+ | session entries: accomplished + evidence, decisions verbatim, failures + root cause, honest disclosures |
| 7 | `POST_COMPACTION_PROMPT.md` | **OVERWRITE** | 200+ | the fresh agent's exact entry sequence |
| 8 | `DECISION_CHAIN.md` | **APPEND** | 200+ | every ruling with context + alternatives rejected |
| 9 | `EVIDENCE_STATE.md` | **APPEND + overwrite summary** | 200+ | verified evidence (SHAs, measured numbers); the honest UNVERIFIED list |
| 10 | `RUNNING_BUILD_LOG.md` | **APPEND (highest frequency)** | grows | one entry per work unit, at the moment of the work |
| 11 | `RUNNING_DEBUG_LOG.md` | **APPEND (highest frequency)** | grows | one entry per debug insight, at the moment of insight |

**The overwrite docs (1,2,3,4,5,7) describe NOW** — stale content is REMOVED, not archived.
**The append docs (6,8,9,10,11) accumulate history** — never edit or delete a prior entry.

## THE FREQUENCY CONTRACT

| Trigger | Docs updated |
|---|---|
| Every work unit / debug event | **10, 11** (the 2 logs) — the moment it happens |
| Every milestone / wave / ruling | 1, 2, 3, 4, 5, 8, 9 |
| Session end | 6 |
| Before compaction / before ship | 1, 7 |

The 2 logs run AHEAD of the milestone docs. If only one thing is remembered: **the moment
something is learned, it goes in a log.**

## THE SUBSTANCE GATES

- **GATE U1** — density ≥200 lines per standard doc; ≥3 `file:line` refs per doc;
  `BUILD_STATE` + `EVIDENCE_STATE` carry ≥1 SHA.
- **GATE U2** — cross-consistency: the read-first docs' recorded SHA == the true artifact SHA.
  *(Plutus note: this project's build artifact is the V5 dist at `PLUTUS/agent`, which is
  REFERENCE-ONLY and not rebuilt this session. The model-server layer's identity is the
  script SHA set + the model byte-identities in `BUILD_STATE.md`. A fresh agent must not
  expect a V6 dist SHA — no V6 code exists yet.)*
- **GATE U3** — the 2 logs have timestamped entries if work happened.
- **GATE U4** — this manifest's "Last update" field is refreshed.

## THE PATHS THAT MATTER

```
Canon docs            /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS/MASTER_CONTEXT/context_management/
Runbook (WHAT)        .../MODEL_SERVERS_RUNBOOK_2026-09-24.md
Operator manual (HOW) .../MODEL_SERVERS_OPERATOR_MANUAL.md
Model scripts         /home/leviathan/models/servers/{jevk5,qwen35-4b,ds-math}.sh
Model weights         /home/leviathan/models/gguf/*.gguf
llama.cpp runtime     /home/leviathan/beellama.cpp/beellama-v0.4.6/llama-server
CPU-only embed binary /home/leviathan/llama.cpp/build-cpu/bin/llama-server
V5 reference (frozen) /home/leviathan/.omp/wt/plutus-main-66dfa4c/PLUTUS/agent  @ 8f4ac74
```

**NEVER write canon docs into an omp worktree.** Operator ruling, 2026-09-24: *"what is
this bullshit filepath PUT IT IN THE SHARED WORKSPACE"*.

## THE KNOWN DIVERGENCE (read before trusting the model lineup)

`DECISION_CHAIN` D-014: the V6 blueprint rules **Decider-2B** (decision) + **Limite 1B via
vLLM** (math); the machine runs **JevK5** + **DeepSeek-R1-Distill on llama.cpp**. The
relationship is an **OPEN OPERATOR RULING**. Do not assume; ask.

## EXEMPT PATHS (their own standards, not the canon floors)

- `reports/` — blueprints and wave artifacts (their own line expectations)
- `MODEL_SERVERS_*.md` — the runbook + manual (operator-manual-generate's 12-section shape)
- `type/`, `rulings/`, `mechanisms/` — the arsumbris corpus (operator-authored schemas)
- `OPERATOR_MANUAL.md` — the in-graph Plutus manual (pre-existing)
