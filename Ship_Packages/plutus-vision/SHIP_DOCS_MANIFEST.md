# SHIP DOCS MANIFEST — PLUTUS VISION (the JEV context backbone)
Project root: /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION
Dist artifact: pine-ide/ide/renderer/plutus-vision-v2.pine (the file the SHA gate reads; the v1 seal is pine-ide/ide/renderer/plutus-vision-v1.pine)
Served SHA16: 125c94f86e6a2f1d (re-measured 2026-10-14 — full sha256 125c94f86e6a2f1d3009a75c778e02ad16c48e4f3772e8d0d8d95c50af162400; the prior row f4010d31 was STALE, see V-44)
V1 seal SHA: 0d20e8314ce992fc23e27f1b97fed76b981c84e78c647bbe6b3d6e1206517bd1 (HARD STOP H1 — never touch)
Last updated: 2026-10-14 (the layout + backtest ship cycle; entry counters live: F-141 · EN-137 · V-44 · P-11 · T-30; audit gate BLOCKED — F-141)
Ship gate: JEV_GATE/run_gate.sh (the ONLY success gate — all chunks act or REJECT); the fence SPEC.md:25 is the commit gate (FENCE-ROW PASS 5/5 in the message)
Entry counters (floors — the logs are append-only, count live): F-137 · EN-130+ · see the logs, never this row

## WHAT EACH SHIP DOC IS (role · writer · freshness rule · gate consumption)
- BUILD_REPORT.md — the milestone record (what shipped per wave, with shas). Writer: the
  wave agent at each exit. Freshness: appended at every wave exit, never rewritten.
  Gate: JEV_GATE/run_gate.sh:54 tails the last 80 lines into EVERY chunk's context.
- DEBUG_LOG.md — the evidence-note ledger (EN-nn: measured findings with numbers).
  Writer: any debugging agent, the moment a measurement lands. Freshness: append-only.
  Gate: tailed into the JEV context like the rest (JEV_GATE/run_gate.sh:54).
- FAILURE_LOG.md — the derailment ledger (F-nn: what happened, root cause, disposition,
  lesson). Writer: whoever observes the failure, THAT turn. Freshness: append-only;
  F-129..F-137 are the W1→W7 set. Gate: tailed into context (SPEC.md:25 pins the
  fence that cites these entries in re-pin justifications).
- SPEC_VIOLATION_LOG.md — the contract-breach record (rule cited, evidence, fix).
  Writer: the violator or its reviewer. Freshness: append-only. Gate: in context.
- TESTING_LOG.md — the battery record (per-suite pass/fail with counts) + the AUDIT
  GATE line. Writer: whoever runs a suite. Freshness: appended per run; counts are
  point-in-time (re-run, never trust). Gate: in context; the AUDIT GATE line is the
  qwen-code-audit verdict (BLOCKED without an artifact — never upgraded to PASS).
- THEATRICALITY_LOG.md — the anti-pattern ledger (AP-nn: the derailment shape + the
  burn it caused). Writer: the agent that names a new pattern. Freshness: append-only.
  Gate: the WHOLE file goes into context (JEV_GATE/run_gate.sh:54) — the judge reads
  every pattern the build swore not to re-live.
- VISUAL_CHECKPOINTS_LOG.md — the look record (screenshot path + sha + verdict per
  render). Writer: the capturing agent, at capture time. Freshness: one row per look.
  Gate: the W6 litmus binds its screenshot by buffer-sha instead (fresher, stronger).

## FRESHNESS CONTRACT (binding)
- Inherited numbers are STALE until re-run — every wave re-measures the baseline
  (SHAs, battery, tree) in its first turn (PIN_INDICATOR_PORT_BUILD.md:1).
- A counter, sha, or count in this manifest is a POINTER, not a fact — the fact
  lives in the artifact it names. When they disagree, the artifact wins.
- The served-SHA row above names the CURRENT renderer bytes. Any renderer edit
  invalidates it until re-measured. The JEV evidence header re-measures per run.

## TRACEABILITY
- The pin binding these docs: PIN_INDICATOR_PORT_BUILD.md:1 (JEV is the only gate).
- The fence that cites them: SPEC.md:25 (re-pin justifications quote F-entries).
- The slump execution that committed them: forensic/SLUMP_MAP.md:33 (W7 D11).
- The gate consuming them: JEV_GATE/run_gate.sh:54 (tails + whole-file ingestion).

## REFRESH TRIGGERS (when each row above must be re-measured)
- Served SHA16: on EVERY renderer edit — the row is void the moment the file is
  written. Re-measure with sha256sum, never copy. The JEV evidence header
  re-measures per run; this row is the human-readable mirror (stale = lying).
- V1 seal SHA: NEVER changes (HARD STOP H1). If a re-measure differs, STOP — the
  baseline moved and every downstream claim is void until adjudicated.
- Entry counters: floors only. The F-series lives in FAILURE_LOG.md (F-129..F-137
  the W1→W7 set); EN-notes in DEBUG_LOG.md; V/P/T/R across TESTING_LOG.md and the
  validation logs. Bump the floors when a series advances past them.
- Ship gate row: when the gate wiring changes (W6 added the litmus ingestion at
  JEV_GATE/run_gate.sh:54 — this row recorded it). Name the gate + its line.

## READING ORDER (a new session or auditor orients here first)
1. This manifest (what exists, what is fresh). 2. PIN_INDICATOR_PORT_BUILD.md:1
   (the binding pin — goal, waves, laws, the ONLY gate). 3. THEATRICALITY_LOG.md
   whole (the anti-patterns — what not to re-live). 4. FAILURE_LOG.md tail
   (F-129 onward — the current wave set's derailments). 5. SPEC.md:25 (the fence
   contract + the current pins). 6. TESTING_LOG.md tail (battery states).
   7. BUILD_REPORT.md tail (the last milestone). Then the artifact + the rig.

## ROT POLICY (staleness is a defect with an owner)
- Any row marked with a date older than the last wave exit is ROT — refresh or
  delete it. A manifest that points at dead shas is worse than none (it lends
  authority to numbers nothing produces anymore).
- The Oct-09 row rotted exactly this way (baseline 668e89d7 named the ROOT build
  copy while the served renderer moved on). The W7 refresh corrected the target
  to the served file. The lesson is the policy: name the SERVED artifact, and
  say which file the SHA gate reads (JEV_GATE/run_gate.sh:54).
- This file is hand-maintained (no writer script — verified 2026-10-11: zero
  refs in scripts/). Its accuracy is the committer's duty at every ship commit.

## CONSUMERS (who reads what — write for them)
- JEV_GATE/run_gate.sh:54 (the judge): tails BUILD_REPORT/DEBUG_LOG/FAILURE_LOG/
  SPEC_VIOLATION_LOG/TESTING_LOG (80 lines each) + the WHOLE theatricality log.
  Write tails that stand alone — the judge never sees the head.
- The next session (resume from disk): reads this manifest → the pin → the tails.
  Write entries that re-orient a cold reader (numbers WITH dates and shas).
- The auditor (human or OCR): reads the AUDIT GATE line + the fence row. Never
  upgrade a BLOCKED line to PASS (AP-4) — a blocked gate is information, and
  laundering it voids every verdict downstream (PIN_INDICATOR_PORT_BUILD.md:1).
- The fence (SPEC.md:25): cites F-entries in re-pin justifications. Number every
  failure F-nn and every finding EN-nn or the fence cannot cite it.

## FORMAT LAW (per-doc shape — the gate assumes it)
- BUILD_REPORT/DEBUG_LOG/FAILURE_LOG/TESTING_LOG/THEATRICALITY: append-only,
  newest LAST (the gate tails). Never rewrite history — supersede with a new
  entry that names the old one (SPEC.md:25).
- Anchors over adjectives: every claim carries a file:line, a sha, or a count.
  The W-9 density law enforces this at commit time for authored docs.
- No secrets in ANY ship doc (keys, tokens, passwords) — fingerprints/paths only.
  A leaked secret is a security incident, not a doc update.
- END OF MANIFEST — refresh triggers above; when in doubt, re-measure (SPEC.md:25).
