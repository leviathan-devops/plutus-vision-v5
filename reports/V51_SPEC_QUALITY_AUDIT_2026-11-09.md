# V5.1 SPEC QUALITY AUDIT — 2026-11-09

## Verdict

**DISPATCHABLE AFTER TWO PREREQUISITES.**

The three V5.1 review documents are now internally consistent, mechanically audited, free of the independent audit's blocker findings, and clear enough for a competent builder to execute W3a **without redesigning the organ layer**. They are not permission to start immediately:

1. the operator must approve the V5.1 fork;
2. the active CP-005 presentation defect must be repaired into a legible checkpoint, because W3a.4 explicitly refuses to measure organ labels against the current giant-table/overlapping-label frame.

This audit does **not** claim the full indicator works. The live measured state remains CP-005: correct data, unreadable presentation, 6/8 = 75.0% outcome on CP-004, and no random-week/E2/E3 acceptance.

## Audited artifacts

| Artifact | Lines | SHA-256 |
|---|---:|---|
| `design/5.1 update notes.md` | 400 | `625cad700e72696282c8a42564f94cb15516d63a6627a7f86250ecf01d04bf9a` |
| `design/DESIGN_BLUEPRINT_v5.1_CLOUDFLARE.md` | 1,167 | `21cd7e6ce5eee03704e98f94ab3c1225647461db60c072ac0b913d0b51169574` |
| `design/BUILD_WORKFLOW_v5.1_CLOUDFLARE.md` | 555 | `b2e4b341e34e38a0fb50cb27dea97cee70c5fb913617fce1379b3061dfc88be1` |

Commit:

```text
5981fa3 docs(v5.1): repair organ-spec audit findings
```

Parent commit:

```text
7a69130 docs(v5.1): add the organ-transplant review design
```

## Audit method

1. Re-read the V5.0 blueprint/workflow and the V5.1 fork first-hand.
2. Generated a V5.0 → V5.1 edit-block diff and classified every inherited change.
3. Ran the eight-gate spec audit on both governing documents.
4. Ran a zero-authoring-context read-only reviewer audit.
5. Ran an independent Mimo reasoning audit over the V5.1 organ sections and donor modules.
6. Mechanically checked all three documents for:
   - placeholders;
   - secrets;
   - stale paths;
   - broken relative references;
   - donor SHA drift;
   - markdown fence balance;
   - ASCII box width;
   - invalid JSON examples;
   - forbidden imports/scope.
7. Repaired every BLOCKER/HIGH finding and re-ran the gates.

One process disclosure: a read-only reviewer agent had already been dispatched before R-34 was read. It made no edits and returned the blocker list. No further subagent is used; the repairs and final verification were first-hand.

## Mechanical gate results

| Gate | Result | Evidence |
|---|---|---|
| Blueprint SPEC-AUDIT | **APPROVED 0/8** | spec-audit tool on `design/DESIGN_BLUEPRINT_v5.1_CLOUDFLARE.md:1` |
| Workflow SPEC-AUDIT | **APPROVED 0/8** | spec-audit tool on `design/BUILD_WORKFLOW_v5.1_CLOUDFLARE.md:1` |
| Donor hashes | **11/11 PASS** | every SHA in `design/DESIGN_BLUEPRINT_v5.1_CLOUDFLARE.md:719` matches disk |
| Card example JSON | **PASS** | `TESTED_2X` has exactly two events; numeric prices; valid donor IDs |
| Placeholders/TODO | **0** | all three documents |
| Secret-shaped text | **0** | all three documents |
| Markdown fences | balanced | all three documents |
| ASCII diagram width | ≤76 columns | all three documents |
| Git diff check | clean | no whitespace errors in commit `5981fa3` |
| External grader | PASS | `PV-GATE: PASS 5981fa3eea5a admin HEAD` |

## Independent findings and repairs

| Finding | Original severity | Repair now in the spec |
|---|---|---|
| F1 random-week promotion was impossible before unlock | BLOCKER | W3a.5 now emits only `M1_CANDIDATE`, `METADATA_ONLY`, or `REJECTED`; `PROMOTED` waits for the post-unlock random-week gate (`design/BUILD_WORKFLOW_v5.1_CLOUDFLARE.md:309`) |
| F2 selected donor modules were not standalone | BLOCKER | donors are `.ts.txt` reference copies; runtime uses current-type adapter ports; old dependencies are never imported (`design/DESIGN_BLUEPRINT_v5.1_CLOUDFLARE.md:713`) |
| F3 OBCV temporal anchor/30m lane undefined | BLOCKER | `anchorMs == card.window.cutoff`; every bar must be pre-cutoff; absent 30m is `OBCV_30M_DATA_MISSING` (`design/BUILD_WORKFLOW_v5.1_CLOUDFLARE.md:782`) |
| F4 OBCV ATR-relative rewrite contradicted donor algebra | HIGH | absolute floors retained: 4H 50 pips, 1H 30, 30m 20; only pip→tick conversion is asset-aware (`design/DESIGN_BLUEPRINT_v5.1_CLOUDFLARE.md:1081`) |
| F5 update-note card example was self-invalid | HIGH | valid numeric example, split `detector`/`reconciliation`, donor-format IDs, `TESTED_2X` with two events (`design/5.1 update notes.md:234`) |
| F6 EURUSD/DXY asset fork | HIGH | W3a names EURUSD 2026-07-06 as the active shadow card and states DXY M1-complete remains unchanged (`design/BUILD_WORKFLOW_v5.1_CLOUDFLARE.md:8`) |
| F7 R-36 render window missing | HIGH | every drawing clips to `[Monday−7d, Friday 21:00Z]`; old origins are card-only (`design/DESIGN_BLUEPRINT_v5.1_CLOUDFLARE.md:257`, `:499`) |
| F8 derived card violated write-once sealing | HIGH | organ metadata writes a schema-versioned derived card with new SHA and `supersedes_sha256`; base card is immutable (`design/DESIGN_BLUEPRINT_v5.1_CLOUDFLARE.md:267`) |
| F9 quarantine list diverged three ways | HIGH | one closed disposition table; LMV adapter owns touch taxonomy; E2 anchors wait for W3a.6 (`design/DESIGN_BLUEPRINT_v5.1_CLOUDFLARE.md:713`) |
| F10 four/five/six frame ambiguity | MEDIUM | exactly six A/B frames including legible frame 0 (`design/DESIGN_BLUEPRINT_v5.1_CLOUDFLARE.md:1040`) |
| F11 freshness replacement would break downstream fields | MEDIUM | `reactionsPreCutoff` and `reactionState` remain derived views with explicit mapping (`design/DESIGN_BLUEPRINT_v5.1_CLOUDFLARE.md:1020`) |
| F12 unmatched LMV rungs had no sink | MEDIUM | card-level `unassignedPrecision[]` added (`design/DESIGN_BLUEPRINT_v5.1_CLOUDFLARE.md:987`) |
| F13 SHIP_PACKAGES citation violated R-39 | MEDIUM | external browser proof is historical-only and unread by this build (`design/DESIGN_BLUEPRINT_v5.1_CLOUDFLARE.md:360`) |
| F14 donor constants unclassified | MEDIUM | constants annex with exact values and dispositions (`design/DESIGN_BLUEPRINT_v5.1_CLOUDFLARE.md:1092`) |

## V5.0 drift/regression result

No V5.0 canon requirement was dropped. The following survive explicitly:

- complete nine-pillar E1;
- six-dimension scoring and structural bonus;
- full-output plus MODERATE+ synthesis;
- no spot-distance filter;
- no width-derived ZFP;
- no Yahoo/yfinance bars;
- Part IX pair-specific translation;
- Part X render rules plus the R-30 S/D overlay resolution;
- 95% Pinebox visual acceptance;
- E2/E3 deferral;
- immutable baseline and archived H1 seal;
- no synthetic zones or synthetic evidence;
- no old runtime/clients;
- no push without operator order.

V5.1 changes the live composition seam from the stale V5.0 planned generator/output to the current M1 implementation:

```text
m1/src/run.ts     -> m1/out/e1-card-<asset>-<monday>.json
m1/src/compose.ts -> m1/out/plutus-vision-v5-e1.pine
```

This is not a regression: it corrects inherited design text to the actual implemented path and forbids forking a second generator without an operator ruling.

## Buildability assessment

### W3a.0 — donor quarantine

**Clear.** The builder copies exact donor bytes as `.txt`, records SHA and disposition, ports algorithms to current types, and proves no runtime import reaches the quarantine.

### W3a.1 — shadow organs

**Clear.** Active asset/card, temporal anchor, pre-cutoff assertion, 30m absence behavior, and shadow output are named.

### W3a.2 — metadata attach

**Clear.** It writes a derived, versioned card, preserves all existing geometry/downstream fields, and adds `unassignedPrecision`.

### W3a.3 — OBCV reconciliation

**Clear.** Equivalence metrics, BoM/MoM classifier of record, canonical Level conversion, and canonical assembly scoring are explicit.

### W3a.4 — A/B render

**Clear after prerequisites.** It needs operator approval plus a legible post-CP-005 baseline. It then has six frames, a 13-band recall denominator, and a measured room-budget artifact.

### W3a.5 — pre-unlock decision

**Clear.** `M1_CANDIDATE | METADATA_ONLY | REJECTED`; no promotion before unlock.

### W3a.6 — E2 contract preparation

**Deferred and clearly marked.** It is not a full E2 port and does not start until M1 acceptance/unlock.

## Residual risks — why “full indicator working” is not yet claimable

1. **CP-005 presentation is still unreadable.** The operator ruled the current data render correct but the giant table, stacked bands, LSZ anchoring, and label pile wrong. Organ work must not preempt that repair.
2. **The measured engine outcome is 75%, not 95%.** CP-004 remains 6/8. Z36 and Z39 are open engine-rule defects.
3. **Too many irrelevant/high-score zones remain unresolved.** R-37 bans a cap; the cluster/selection computation must yield the correct set. OBCV can add candidates and could worsen readability if promoted carelessly.
4. **Room object budget is proven to exist but not yet measured as an integer.** W3a.4 requires a bisection artifact before A/B.
5. **No production Cloudflare acquisition pipeline exists.** The local/disk M1 build is not the nineteen-source production pipeline.
6. **Protocol A image chain is not production-complete.**
7. **Random-week generalisation is locked and unproven.**
8. **E2 implementation is not started.** Only its future anchor contract is defined.
9. **E3 remains deferred.**
10. **LMV lookback may be shorter than donor default.** The spec now requires `LMV_LOOKBACK_TRUNCATED` rather than silent degradation.
11. **OBCV may add duplicate S/D surfaces.** The equivalence ratio and canonical scoring reduce this, but the A/B render must prove no duplicate inflation.
12. **The operator must still approve V5.1.** These documents are review artifacts, not an implementation order.

## Final answer to the confidence question

**Am I 100% confident these documents are clear enough to build W3a?** Yes, after operator approval and CP-005 presentation repair, they are clear enough for a competent builder to execute W3a without redesigning the organ layer.

**Am I 100% confident the full indicator will work?** No, and no honest engineer would claim that before the remaining measured gates pass. The documents are buildable; the indicator is not yet accepted. The next true completion evidence remains an opened, legible Pinebox render at 95%+ on the active golden week, followed by the locked random-week matrix.
