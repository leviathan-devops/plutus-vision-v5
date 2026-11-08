# MASTER PROMPT — PLUTUS VISION INDICATOR PORT (the pin's depth)

The PIN (`/goal`) is the entry. THIS is the operating depth. The binding authority is
`packages/PLUTUS_VISION_INDICATOR_PORT/PLUTUS_VISION_INDICATOR_PORT_DPL1_SPEC.md` (1,033 lines).

## §1 THE MISSION
Port the Toolset's Engine 1 (the 9-Pillar zone map) + Engine 2 (the macro shape chain) into the
Pine indicator so it computes live from the chart's bars and renders on the V1 baseline. The
report step is REMOVED. Transcribe the approved Toolset — never re-derive it. (The operator,
2026-10-07, verbatim: "convert this into the indicator so that it dynamically renders the working
infrastructure on top of the V1 baseline … everything in the tool set is the approved working
version.")

## §2 THE AUTHORITY — THE TOOLSET (6 files; the ONLY frame)
`Original_Canon_Data/Toolset/` — the spec (4,216 ln), the corrected E3 (1,685), the v8 reference
(1,284), the retired report oracle (1,576), the retired validator (780), the fractal contract (721).
NOTHING outside this directory is cited. (F-70: searching outside the frame is the paid-for failure.)

## §3 THE 8 PHASES (each with its mechanical exit gate)
- P0 ABSORB (goal-prompt): the baseline measured FIRST-HAND this turn — `git log -1`, the battery,
  `sha256sum` the dist + the engines. Inherited numbers are STALE.
- P1 SPEC (goal-prompt/build-package): DONE — this package (DPL1 + wave-plan + blueprint).
- P2 PREFLIGHT (hydra-mode): the P5 checklist ALL green before any dispatch — spec exists, the
  wave-plan's gates are proven by EXECUTED scripts, the container plan meets its READY checklist,
  the roster at floors, file sets DISJOINT, the board initialized.
- P3 EXECUTE (hydra-mode + SDD): parallel waves against frozen interfaces; every return audited
  (per-hunk verdicts + a coverage map in `.trident/wave-audit/<wave>.md`); the battery green.
- P4 RUNTIME (runtime-grade): occupy the driver's seat — the live rig, first-person operations
  with pre-registered expectations, bugs found BY RUNNING.
- P5 ADVERSARIAL (red-team): a full corpus pass returns ZERO confirmed defects AND the docs sweep
  is clean AND the unswept frontier is named.
- P6 DOCUMENT (canon + ship): the 11 canon docs + the 5 ship docs, gated, with the AUDIT GATE line.
- P7 CHECKPOINT (saving-checkpoints): src + dist+SHA + 11 canon + 5 ship + visual/runtime-state.png
  + manifest, ONE seal mode (never manifest-only), hyphens-only name.
- P8 VERDICT (goal-prompt): the legal-stop definition met in FULL.

## §4 THE WAVES (7 — see the wave-plan; parallel after W1)
W1 THE ZFP (critical path) · W2 THE ASSEMBLY · W3 THE PILLARS · W4 THE LSZ + 4H · W5 THE PINE
EMISSION · W6 THE GATES · W7 THE CLEANUP. W1 must land before W2 (the assembly calls the ZFP).
W5 last (it consumes everything). Interfaces are frozen in the blueprint — consumers build against
them; only integration serializes.

## §5 THE PROOF CONTRACT (four tiers; a claim without its tier artifact is VOID)
- L0: tsc/build exit codes.
- L1: unit — PURE functions only.
- L2 SCRIPT TEST: real modules in a real sandbox, observation-channel assertions (diskBytes, rows,
  exitShape) — never spies. Runner exit code = the verdict.
- L3/L4 THE RIG: the container + the host-live round — results JSON + screenshot + the storage probe.
Named tests (selectable): `test_zfp_discriminates` · `test_zone_count_data_driven` ·
`test_names_positional` · `test_payload_computed` · `test_dimension_not_flat` · `test_v1_seal_intact`.
EVERY enforcement gets POSITIVE + NEGATIVE halves: the attack fires its SPECIFIC token; the legit
op passes with ZERO misfire. A GENERIC gate preempting a specific one = UNOBSERVED, never PASS.
Bound every token to a TOOL RESULT (verbatim output, an artifact path, RC=0, exit 0). Never prose.

## §6 THE RUNTIME SEAT (mandatory — the author's seat is the default failure)
Declare it: "I am the driver of <the rig>." Then: H1 start the REAL instance (the pine-ide rig:
pv-server :9851, pine-station :9741, vil-rail :9754, CDP). H2 operate FIRST PERSON — load the Pine,
render a week, each op with a PRE-REGISTERED expectation. H3 every break is the deliverable: op#,
expected, actual VERBATIM, mechanism, fix, retest. H4 push it — two weeks, a hostile week, a
restart. H5 fix IN the hot seat; retest on the SAME instance. H6 the runtime ledger: what RUNNING
taught that READING could not. H7 close only when nothing unexperienced remains AND the residual is
NAMED. ZERO BUGS FOUND IS A RED FLAG. THE SECOND OPERATOR: a zero-context subagent, given ONLY the
operating docs, must operate it.

## §7 THE ADVERSARIAL LOOP (adversarial-first)
Map every exported decision function; the surface map IS the probe plan. Corpus per function =
positive + negative + edge + the FULL evasion family. Probes run against the DEPLOYED runtime
(live; source-import is BANNED); every probe names its bundle SHA. Adjudicate EVERY failure BOTH
ways (my expectation wrong? / real defect?) BEFORE any fix. The loop terminates only when a FULL
pass returns ZERO confirmed defects AND the docs sweep is clean AND the unswept frontier is named.

## §8 THE DOC CONTRACT
- canon (11, `context_management/`): the 2 logs (RUNNING_BUILD_LOG + RUNNING_DEBUG_LOG) update at
  the MOMENT of work, >= every other doc. Gate: 200+ lines, >=3 file:line refs, the 5 read-first
  docs agree on the dist SHA.
- ship (5): BUILD_REPORT (500+), DEBUG_LOG (500+), FAILURE_LOG, SPEC_VIOLATION_LOG, TESTING_LOG
  (both zones). Gate: 50+ lines, evidence refs, the newest SHA == the true dist.
- AUDIT GATE: a code-audit artifact on disk AND the TESTING_LOG carries
  `AUDIT GATE: PASS|FAIL|BLOCKED`. FAIL blocks every ship-ready claim; BLOCKED is never PASS.
- A completed todo without its doc entry is an UNFINISHED todo.

## §9 THE CHECKPOINT CONTRACT
Enter P3 with a ROUND-ZERO checkpoint (the restore point). At P7 produce a checkpoint with: src
(full tree, verified count) · the dist + SHA · context_management (11) · the 5 ship docs (absences
recorded) · the spec + artifacts · visual/runtime-state.png (the rig capture) · CHECKPOINT_MANIFEST
(state + HONEST GAPS) · ONE seal mode (full-tree lock OR no-lock — NEVER manifest-only). Hyphens only.

## §10 HARD STOPS
- Secrets out-of-band; never in the repo, chat, logs, or doc rows.
- The guarded rig path: the round ENDS at the handoff (state sha + path + atomic mv + restart), then retest.
- Rig down / provider quota exhausted -> BLOCKED with the retry condition. Never PASS.
- Operator-owned actions (OD-1, OD-3, OD-4): state them, continue on independent fronts, never stall.

## §11 ANTI-DERAIL (this tree's nouns — each FAILS THE WAVE ON SIGHT when it produces a claim)
1. RE-DERIVATION OVER TRANSCRIPTION: writing my own clustering/ZFP/constants where the Toolset has
   the mechanism. The countermeasure: grep the Toolset first; if it exists, transcribe with its
   file:line. (F-67, F-76)
2. SEARCHING OUTSIDE THE FRAME: citing the v4.5.3 tree or any path outside `Original_Canon_Data/Toolset/`. (F-70)
3. THE INVENTED REQUIREMENT: building a report generator the operator removed. (F-64, F-74)
4. THE HAND-WRITTEN PAYLOAD: typing zone values into the Pine instead of computing them. (F-56)
5. VERIFYING AGAINST MY OWN OUTPUT: a green gate that asserts the engine's output, not the canon's
   worked example. (F-78)
6. APPROVAL-GATING / PERMISSION-ASKING on ordered work. (F-75)
7. BUILDING AFTER A STOP: "do not build" is an instruction. (F-85)
8. THE STALL FLAG measures stream silence, not work — never cancel disk-proven work on quiet alone.

## §12 ANTI-STOP (these never close the run)
1. Stationarity ("no change in N turns") is not done — re-probe, widen, escalate.
2. A sub-inner pass (one wave green, ST rows green) never closes the run — only the legal stop does.
3. Memory-complete: "I already verified this" without a this-turn re-run is STALE, not PROVEN.
4. Theater-complete: prose summaries, typed-but-unrun commands, screenshots without artifacts.
5. Blocked-as-done: a BLOCKED state names its resume condition and is never a pass.
6. Partial-scope close: one wave's green with siblings open is progress, not completion.
7. "Zero bugs found" as success — the session did not push, or reported from the author's seat.
8. An empty runtime ledger.

## §13 RESUME POINTERS (a fresh session resumes from DISK, never from the pin's frozen numbers)
- spec `packages/PLUTUS_VISION_INDICATOR_PORT/PLUTUS_VISION_INDICATOR_PORT_DPL1_SPEC.md`
- wave-plan `packages/PLUTUS_VISION_INDICATOR_PORT/wave-plan.md` · blueprint `.../blueprint.md`
- wave audits `.trident/wave-audit/` · canon `context_management/` · ship docs at the project root
- checkpoints `Checkpoints/<TOKEN>/` · this depth `MASTER_PROMPT.md`

## §14 CURRENT POINTERS (2026-10-11 — the live ends)
- The binding pin is PIN_INDICATOR_PORT_BUILD.md:1 (JEV is the only gate); the OD-1
  A3 ruling lives at PIN_INDICATOR_PORT_BUILD.md:73; the fence pins at SPEC.md:25.
- The served artifact is pine-ide/ide/renderer/plutus-vision-v2.pine; its W6 litmus
  evidence regenerates fresh on every gate run (JEV_GATE/run_gate.sh:54).
