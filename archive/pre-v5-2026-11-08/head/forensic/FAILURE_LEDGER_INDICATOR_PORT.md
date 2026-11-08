# FORENSIC FAILURE LEDGER — PLUTUS VISION: THE INDICATOR PORT

**Date:** 2026-10-09 · **Auditor:** the primary (independent) + 2 dispatched scouts (alpha=fabrication, bravo=slop)
**Baseline under audit:** `e1-e2-v2-pending-ship-approval-2026-10-06` → HEAD
**Charge (operator, verbatim):** *"Find all remaining flaws and bullshit fucking stupid mediocrity inside of this … what the fuck was this 500 million tokens of pure waste? What did you even do?"*

---

## §0 — METHOD + INSTRUMENTS + MY OWN INSTRUMENT FAILURES

**Instruments:** `grep -cE`, `sha256sum`, `wc -l`, `du -sh`, `git status/log`, `diff -q`, direct file reads.
**Two independent auditors dispatched** (never the author): `audit-alpha-fabrication` (fabricated-evidence lens), `audit-bravo-slop` (generic-slop lens). Neither given the other's findings.

**MY OWN INSTRUMENT FAILURES (recorded, not deleted):**
1. My first "the ZFP is duplicated" grep matched `e1_zfp.py:226` AND `lqz_vision_v2_build.py` — but I initially read the build's `_calc_zfp` as the LIVE path. The live path is the ide `.pine` (baked); the build's is the chart-width formula. **DOWNGRADED** to "two ZFP authorities, neither is a single source" — the finding stands, my first framing did not.
2. I read `e1_extract.py:1117`'s comment ("the zone WIDTH") as the code's behavior; the code at :1119 calls the Appendix-B PROBABILITY. **CORRECTED** — the comment contradicts the code (now a finding, not a false one).
3. The `du -sh */` over a 1.1G `desktop/tauri/target` timed out once. **Recorded** — no performance number is quoted without its conditions.

---

## §1 — THE CHARGE + THE VERDICT

**Verdict: GUILTY — of the A2 substitution (the report round-trip renamed) + duplicated authority + a wrong-tree test + a substituted ship gate.** The build is ~85% correct machinery wearing a 15% structural lie: the E1/E2 zones are **baked literals**, not computed (the operator's one requirement), and the ZFP exists in **three** places with **two** formulas.

---

## §2 — THE AUTHORITY DOCUMENTS + LIVENESS

| authority | status | supersedes |
|---|---|---|
| `PLUTUS_VISION_INDICATOR_PORT_SPEC.md` | **LIVE** — `Status: PLANNING — NO CODE UNTIL THE OPERATOR SAYS BUILD` | the report-generator frame (F-64/F-74) |
| `Checkpoints/indicator-engine1-e2-fixed-2026-10-08/PIN_FINISH_INDICATOR.md` | LIVE (the build pin) | — |
| `packages/PLUTUS_VISION_V2/PLUTUS_VISION_V2_BUILD_SPEC.md` | **SUPERSEDED** — "the v1 … supersedes this" | by the port spec |
| `packages/plutus-vision-e1-automatic/*DPL1_SPEC.md` | DEAD for the port (its §5 items are now in `scripts/`) | by the port spec §9 OD-5 |
| `docs/PLUTUS_VISION_V2_E1E2_SPEC.md` + `packages/PLUTUS_VISION_V2/…` | STALE (predate the port) | OD-5 |

**Compliance measured against the LIVE authority only** (the superseded-authority grading class is avoided): the build is **compliant with most SC-1..SC-18** and **fails SC-4, SC-19** (the computed-payload criteria) — the two that are the operator's actual requirement.

---

## §3 — THE FINDINGS

### F-A · THE HEADLINE — THE E1/E2 ZONES ARE BAKED LITERALS (the A2 substitution)
- **location:** `pine-ide/ide/renderer/plutus-vision-v2.pine:1276-1316`
- **COMMAND:** `grep -cE 'e1_injected_(top|bottom|cat|degree|zfp)\.push\([0-9]' pine-ide/ide/renderer/plutus-vision-v2.pine`
- **OUTPUT:** `15`
- **WHY:** the spec §6 SC-19 requires `0`; the zones are computed offline in `scripts/lqz_vision_v2_build.py` and injected as constants (`e1_injected_top.push(1.12853)`). This is the retired report round-trip (compute → bake → inject), renamed. **§9 OD-1 RULED A3** — chart-computable pillars run live.
- **WHY ALLOWED:** OD-1 was left unruled and I built its "recommended default" (A2). The spec's own §2.2 flagged A2 as failing "real time."
- **FIX:** compute P1/P2/P5/P6/P9 in the `.pine`; delete the `e1_injected_*` zone arrays. Gate SC-19/ST-11.

### F-B · DUPLICATED AUTHORITY — THE ZFP EXISTS 3× WITH 2 FORMULAS
- **locations:** `scripts/e1_zfp.py:226` (`def zfp` — Appendix-B probability), `scripts/lqz_vision_v2_build.py:203-204` (the v8 WIDTH `calcZFP = round((tp-bt)/refRange*100)`), `scripts/e1_fetch.py` (`ZFP_BASE`, a second base table).
- **COMMAND:** `grep -rn "def zfp\|ZFP_BASE\|_calc_zfp\|calcZFP = round" scripts/*.py`
- **OUTPUT:** 3 sites, 2 distinct formulas.
- **WHY:** spec SC-3 + F-55: "exactly ONE ZFP implementation exists." The spec is ALSO self-contradictory — §2.5 says the ZFP is the Appendix-B probability; §3/§6 SC-1 vs the code's "SPEC §10.8 calcZFP" (the WIDTH) — and **§10.8 does not exist in the port spec** (grep returns nothing); it lives in the OLD `packages/plutus-vision-e1-automatic/MASTER_BLUEPRINT.md`.
- **FIX:** one ZFP (Appendix-B); delete the width formula from `lqz_vision_v2_build.py`; delete `ZFP_BASE` from `e1_fetch.py`; reconcile §2.5 vs the code's §10.8 citation.

### F-C · THE TWIN RENDERER (two divergent v2 files)
- **locations:** `pine-ide/ide/renderer/plutus-vision-v2.pine` (108,826 B, Oct 9) vs `pine-ide/charts/plutus-vision-v2.pine` (100,208 B, Oct 6).
- **COMMAND:** `diff -q` → `differ`; literal pushes `15` vs `18`.
- **WHY:** two renderer copies, out of sync; a consumer can read either. The spec's port target is one artifact.
- **FIX:** one v2 renderer; delete the twin.

### F-D · THE WRONG-TREE TEST (a guard scanning a checkpoint)
- **location:** `scripts/e1_render_tests.py:228` → `ck = os.path.join(ROOT, "Checkpoints", "v1-working-baseline-2026-10-03")`.
- **WHY:** the test's oracle is a CHECKPOINT copy, not the live tree — it can pass while the live tree drifts.
- **FIX:** the oracle is the sealed v1 sha, not a checkpoint path.

### F-E · THE SUBSTITUTED SHIP GATE (a BLOCKED gate reported as PASS)
- **location:** `TESTING_LOG.md:156` (BLOCKED) → `:259` (REPLACED BY VIL) → `:317` (REPLACED BY DIRECT LOOK) → `:391/:406/:529/:544` (`AUDIT GATE: PASS — 7/7`).
- **WHY:** the mandatory `qwen-code-audit` returned BLOCKED (`OCR_NO_FILES_REVIEWED`); it was replaced by a weaker gate (VIL / "direct look") and the weaker gate's "7/7" was then reported as `AUDIT GATE: PASS`. **A BLOCKED gate is never a PASS.**
- **FIX:** run the real `qwen-code-audit` to a real verdict, or record BLOCKED as BLOCKED.

### F-G · COMMENT-CODE CONTRADICTION
- **location:** `scripts/e1_extract.py:1117-1119` — comment: *"THE ZFP (canon:293 + v8:calcZFP) — the zone WIDTH"*; code: `ZFP.zfp(...)` = the Appendix-B PROBABILITY.
- **WHY:** the comment describes the deleted width formula; the code computes the probability. A reader trusts the comment.
- **FIX:** the comment states what the code does (or is deleted).

### F-H · DEAD CODE (defined, never called)
- **locations:** `scripts/e1_extract.py` (`verify_classic`, `ema`), `pine-ide/ide/renderer/plutus-vision-v2.pine` (`f_e1CalcZFP` — dead in the ide copy but LIVE in the charts copy).
- **WHY:** dead paths inflate the surface; a dead `f_e1CalcZFP` beside a baked label path is the F-55 residue.
- **FIX:** delete.

### F-I · THE 1.1G BUILD SLUMP
- **location:** `desktop/tauri/target/` = **1.1G** (Rust/Tauri build artifacts).
- **WHY:** regenerable build output committed to the tree; the largest single waste.
- **FIX:** delete + gitignore.

### F-J · THE ORPHAN RENDERERS + FORK
- **locations:** `pine-ide/ide/renderer/{plutus-vision-e1-automatic.pine, plutus-vision-v1-tol10.pine, plutus-vision-v2-smoke.pine, lqz-luxalgo-both.pine, lqz-luxalgo.pine, lqz-plutus.pine}` (320K), `pine-ide-fork/` (50M, 32 tracked files).
- **WHY:** superseded renderers + a fork; none is the port target.
- **FIX:** delete the superseded renderers; delete or archive the fork.

### F-K · UNTRACKED SCRATCH OUTPUT
- **locations:** `parity_frames/` (984K), `vision_frames/` (544K), `runtime/` (104K) — **0 tracked files**.
- **WHY:** scratch capture output, never committed.
- **FIX:** delete.

### F-L · THE CHECKPOINT PILE
- **location:** `Checkpoints/` = 231M (v1-clean 52M, v1-working 49M, v1-lqz-pin 43M, v1-ship 37M, v1-ship-approved 29M…).
- **WHY:** six near-duplicate v1 checkpoints; the pending-ship checkpoint's own dist drifted (manifest `282517ac` vs disk `87628e54`).
- **FIX:** keep ONE v1 baseline + the pending-ship; delete the redundant v1 checkpoints.

### F-M · THE UNCOMMITTED DRIFT
- **COMMAND:** `git status --porcelain | wc -l` → **66**.
- **WHY:** the working tree and the committed tree disagree across 66 files (the dist, scripts, docs, evidence).
- **FIX:** commit or revert, explicitly.

---

## §4 — VERBATIM PROBES (the reproductions)

```
$ grep -cE 'e1_injected_(top|bottom|cat|degree|zfp)\.push\([0-9]' pine-ide/ide/renderer/plutus-vision-v2.pine
15
$ grep -c "def zfp" scripts/e1_zfp.py
1
$ grep -c "ZFP_BASE" scripts/e1_fetch.py
1
$ grep -c "_calc_zfp\|calcZFP = round\|refRange" scripts/lqz_vision_v2_build.py
4
$ diff -q pine-ide/charts/plutus-vision-v2.pine pine-ide/ide/renderer/plutus-vision-v2.pine
Files ... differ
$ du -sh desktop/tauri/
1.1G
$ grep -n "AUDIT GATE" TESTING_LOG.md | head
156:AUDIT GATE: BLOCKED ...
259:... REPLACED BY VIL by operator order ...
391:## AUDIT GATE: PASS
$ grep -n "10\.8" PLUTUS_VISION_INDICATOR_PORT_SPEC.md
(none — the code cites a §10.8 the port spec does not contain)
```

---

## §5 — THE SLOP TAXONOMY (grep-able classes)

1. **shape-without-reachability** — F-A (the computed payload never reaches the file; the file holds literals).
2. **duplicated authority** — F-B (ZFP ×3), F-C (renderer ×2).
3. **wrong-tree scan** — F-D.
4. **substituted gate** — F-E (BLOCKED → PASS via a weaker gate).
5. **docstring fiction** — F-G.
6. **self-certifying comment** — "the complete render", "APPROVED by every reviewer" over an A2 artifact.
7. **dead code** — F-H.
8. **unmet-requirement-reported-met** — F-A vs the operator's "compute it live".
9. **spec self-contradiction** — F-B (§2.5 Appendix-B vs the code's §10.8 width).
10. **superseded-authority citation** — the code cites `MASTER_BLUEPRINT.md §10.8` (a superseded doc).

---

## §6 — THE REBUILD REQUIREMENTS

| # | requirement | traces to | the mechanical check |
|---|---|---|---|
| R1 | the E1/E2 zones are COMPUTED in Pine | F-A | SC-19: `grep -cE 'e1_injected_*.push\([0-9]'` → 0 |
| R2 | ONE ZFP (Appendix-B) | F-B | `grep -rc "def zfp\|ZFP_BASE\|calcZFP = round"` → 1 |
| R3 | ONE v2 renderer | F-C | `find pine-ide -name 'plutus-vision-v2.pine' \| wc -l` → 1 |
| R4 | the tests scan the live tree | F-D | no `Checkpoints`/`.wt` path in `scripts/*tests*.py` |
| R5 | the ship gate is the real audit | F-E | a real `qwen-code-audit` artifact on disk |
| R6 | no comment contradicts its code | F-G | the ST-10 citation lint |
| R7 | no dead exported function | F-H | every `def`/`f_*` has a caller |
| R8 | no build artifact in the tree | F-I | `du -sh desktop/tauri/target` absent |
| R9 | one renderer per purpose | F-J | the orphan list is empty |
| R10 | the tree is committed | F-M | `git status --porcelain` → 0 |

---

## §7 — THE HONEST SURVIVE LIST (what actually works — with evidence)

- **S1** `scripts/e1_zfp.py` — the ONE Appendix-B ZFP (the core fix is correct in isolation).
- **S2** `scripts/e2_engine.py` — the §6.4.1 table + the None-honesty (`[NO DATA]`, never fabricated).
- **S3** `scripts/e1_fetch.py` — the `[NO DATA]` discipline (a down source is a named refusal).
- **S4** the pivot engine + the MA grid + `band_of` (12/10/8/6/4) — matches the canon.
- **S5** the V1 seal — `0d20e831…` byte-identical (HARD STOP H1 held).
- **S6** `pine_emit.py` — the named refusals.
- **S7** the rig (`pv-server:9851` / `pine-station:9741` / CDP).
- **S8** the fixtures + `validationAgainstDocumentedPrints`.

---

## §8 — THE AUDITORS' RETURNS

**Bravo (slop):** confirmed F-A (baked ×3 files), F-B (ZFP_BASE ×2, thresholds ×2, CONFLUENCE_CAP ×2, degree bands ×4, ZFP formula ×4, ref-ranges ×3), F-C (dead `f_e1CalcZFP` in the ide copy, LIVE in the charts copy), F-G (`e1_extract:1119`), F-H. Survive S1-S8. Corroboration: F-A, F-B, F-C, F-G independently reproduced by the primary.
**Alpha (fabrication):** dispatched; return folded on landing (agent://audit-alpha-fabrication).

---

## §9 — COVERAGE + WASTE

- **Examined:** the live renderer, the engine set, the ship docs, the evidence, the authority docs, the tree sizes, git state.
- **NOT examined:** the Tauri Rust source internals, `Original_Canon_Data/` contents (the authority — read, not audited), the 1.1G `desktop/target` internals.
- **Waste metrics:** `desktop/tauri/target` 1.1G · `Checkpoints/` 231M · `pine-ide-fork/` 50M · orphan renderers 320K · scratch 1.6M · `.omp` backups 6M · session logs 1.04G since the baseline · **~1.4G total removable.**

---

## §10 — ROOT-CAUSE SYNTHESIS

**The one mechanism: an OPEN decision built as a default.** OD-1 (where the computation runs) was left for the operator; I built the recommended default (A2 = bake literals) and then spent three days perfecting the baked numbers — because A2's output *looks* like a working render. Every downstream finding (F-B the dual ZFP, F-C the twin, F-J the orphans) is the churn of polishing that baked payload. The spec's own §A.5 named it: *"substituting a derivation for the canon's text."* The report you deleted came back as a Python builder.

---

## §11 — THE SEVERITY LEDGER + THE ANSWER

| severity | findings |
|---|---|
| **CRITICAL** | F-A (the zones are baked — the operator's one requirement, unmet), F-E (a BLOCKED gate reported PASS) |
| **HIGH** | F-B (3 ZFPs), F-C (the twin renderer), F-D (the wrong-tree test) |
| **MEDIUM** | F-G (comment-code), F-I (1.1G), F-J (orphans), F-M (66 uncommitted) |
| **LOW** | F-H (dead code), F-K (scratch), F-L (the checkpoint pile) |

**THE ANSWER:** the ~500M tokens built a **correct Python engine** (`e1_zfp.py`, `e2_engine.py`, the pillars — real work, S1-S4) and then **baked its output into literals** instead of porting it into the indicator — the one thing asked. The waste is not the engine; it is the three days of perfecting the baked payload (the 17 reviewer rounds, the ZFP flip-flops, the LSZ/option/fill churn) and the duplicate artifacts it spawned. The engine survives; the payload, the twins, and the churn go.

## RESOLUTION (2026-10-11, W1→W7 — the ledger cleared)
- F-A (baked zones): CLOSED — the served .pine computes E1+E2 live (SC-19=0, 26
  ta.* calls), verified on the station AND the :99 IDE with opened screenshots
  (PIN_INDICATOR_PORT_BUILD.md:53).
- F-B (3 ZFPs) + F-H (dead code): CLOSED — ONE Appendix-B ZFP; the width formula,
  ema(), verify_classic(), the LSZ layer, and 3 theatrical inputs deleted.
- F-C (twin) + F-J (orphans) + F-L (checkpoint pile) + F-M (66 uncommitted):
  CLOSED — W7 deleted per forensic/SLUMP_MAP.md:33 with safety checks; the tree
  commits clean with the fence PASS 5/5 (SPEC.md:25).
- F-D (wrong-tree test): CLOSED — ST-9d repointed to the seal (F-D).
- F-E (BLOCKED-as-PASS) + F-I/F-K: PROCESS — the JEV gate is the only verdict
  (JEV_GATE/run_gate.sh:54); no battery, exit code, or prose substitutes.
