# BUILD WORKFLOW v5.0 — FULL E1 ON THE V1 BASELINE

**Companion to:** `DESIGN_BLUEPRINT_v5.0_CLOUDFLARE.md`.
**Status:** execution plan for operator review; no E1 implementation has been approved or built by this document.
**Order:** W0 → W1 → W2 → W3 → W4 → W5 → W6 → W7. E2 and E3 do not start inside this workflow.

## The execution rule

Each phase produces an observable artifact and a named next action. No phase claims that the indicator works because code exists. The only E1 acceptance artifact is the real Pinebox chart at the required accuracy.

A required unavailable input produces a named error and a missing-data record. It never produces invented evidence, a different execution environment, or a different artifact labelled as the requested one.

---

## W0 — IDENTITY, BASELINE AND SCHEMA

### W0.1 Freeze the baseline contract

- Read `Checkpoints/v1-ship-approved-working-baseline/dist/plutus-vision-v1.pine` and record its SHA-256.
- Confirm `pine-ide/ide/renderer/plutus-vision-v1.pine` still matches the H1 seal.
- Use a new output: `pine-ide/ide/renderer/plutus-vision-v5-e1.pine`.
- Preserve the v1 baseline's detector, S/D logic, liquidity arrays and final `f_lqzRender()` behaviour.
- **Observable completion:** a build manifest with both measured hashes and an output path that is not either v1 path.

### W0.2 Implement one run identity

Input: `{asset, week_monday, requested_by}`.

- Reject invalid asset and non-Monday date by name.
- Compute Sunday 22:00 UTC open, Monday 09:00 London cutoff and Friday 21:00 UTC end using the fixed UK DST table.
- Bind a run to `e1:<asset>:<week_monday>`.
- No production default to the golden week.

### W0.3 Define the card and evidence schemas

Create versioned TypeScript types and validators for:

- `RunIdentity`, `SourceEvidence`, `PillarLevel`, `E1Zone`, `TranslationAudit`, `MissingData`, `E1Card`, `RenderPolicy`.
- Full E1 fields: all nine pillars, six dimensions, structural bonus, POI, ZFP, BoM/MoM, mitigation, reactions, LSZ, intra-zone levels, core/spike and pair Layer 2 verdicts.
- Separate `full_output` and `synthesis` visibility.
- Every generated card includes asset, Monday, window, source manifest, card SHA and schema version.
- **Completion:** a valid example passes; an absent required provenance or arithmetic check returns `E1_CARD_INVALID` and emits no renderable card.

---

## W1 — CLOUDFLARE ACQUISITION AND LOCAL HEADED SERVICE

### W1.1 Deploy the control plane

- Worker routes: `POST /e1/run`, `GET /e1/card`, `GET /e1/pine`, `GET /e1/status`.
- One Durable Object per asset/week; serialised write-once card.
- pi-durable code Tasks for the fixed steps in blueprint §5.2.
- R2 for raw bytes and immutable cards; D1 for searchable run/source/evidence/zone/verdict metadata.
- Per-source independent reads run concurrently; their results are reconciled before dependent steps.
- **Completion:** a run has one durable identity, stored evidence and one sealed hash; a repeated request returns that same hash.

### W1.2 Implement TradingView bars in Cloudflare

- Implement the tvDatafeed-compatible client and symbol/timeframe mapping for DXY, EUR/USD, GBP/USD and the canon source family.
- Retrieve sufficient D1, 4H and 1H history for P1/P2/P5 and pair Layer 2.
- Aggregate smaller bars only where the canon instructs it; retain raw bars and their source timestamps.
- No Yahoo/yfinance reader or dependency.
- **Completion:** raw TradingView bars for the chosen historical week are stored with retrieval provenance and satisfy the required lookback.

### W1.3 Implement the remaining source executors

Implement the complete source table in blueprint §6:

- ForexFactory calendar;
- TreasuryDirect;
- FRED;
- EIA;
- Fed H.10;
- TradingView technicals and structured research;
- forex.com research;
- pair-specific institutional research and the approved search/retrieval steps.

Each executor has a source-specific typed output and raw R2 evidence. Record source publication and retrieval timestamps. Do not treat a page title as proof that the needed values were extracted.

### W1.4 Make the headed acquisition operational

- Supervise cloudflared as a persistent service for tunnel `972a42d8-fad2-44c9-8abb-cb39b9d823c3`.
- Start and health-check `plutus-browser up --id 20` before harvest.
- Configure Worker binding `BROWSER` to VPC service `01a1b53f-a0b8-7de2-a193-78f0b6d5f835`.
- Store the plutus-browser token as a Worker secret.
- Verify a new OMP session exposes and can invoke `plutus_browser` without claiming that installation alone proves tool registration.
- **Completion:** a deployed Worker performs an authenticated page navigation and returns real page-derived evidence through the tunnel.

---

## W2 — TYPED EXTRACTION AND RECONCILIATION

### W2.1 Protocol A, in full

1. Resolve the date-specific investinglive URL for the requested cutoff.
2. Navigate through plutus-browser.
3. Extract the embedded data-image URL and obtain the image bytes.
4. Store page evidence and image evidence in R2.
5. Run Clairic Pass 1 full-table extraction, Pass 2 targeted verification and Pass 3 cross-check.
6. Reconcile each field with the two-of-three rule.
7. Apply pair and notional filters before calculation.
8. Retain component-pair values needed for P3 even when excluded from the OTC summary.
9. Record `[UNCLEAR]` rather than entering a disputed value.

**Completion:** the card links every option-derived level to its original image and the three extraction receipts. `/health` alone does not satisfy this phase.

### W2.2 Text and institutional-level extraction

- Parse structured OHLC, technical and macro data in code.
- Use Clairic only for named document/image reading steps.
- Require source URL, publication time, exact excerpt/span and candidate price for each institutional level.
- Classify P4 source tiers and analyst consensus in code.
- Do not let model prose become an unsourced level.

### W2.3 Reconcile and record missing evidence

- Apply the temporal boundary to all sources, including pair data.
- Retain disputed values as unclear, not as numeric zero.
- Record protocol, section, reason and impact for every missing item.
- **Completion:** a source that cannot provide a field creates a named missing-data record and cannot silently contribute a confluence score.

---

## W3 — NINE-PILLAR E1 ENGINE

Implement each pillar as a pure code module over the reconciled evidence.

### W3.1 P1 — pivots

- Weekly Classic/Fibonacci/Camarilla and each of the last three daily sets.
- Extended historical periods required by overlap.
- Verify every set using Appendix C formula, ordering, symmetry and range checks.
- Retain all levels; no spot-distance filter.
- Emit the pivot audit trail.

### W3.2 P2 — MA grid

- Full EMA/SMA 9/10/20/50/100/200 data.
- Detect 3+ confluence within 0.15 DXY.
- Detect recapture of 50/100/200 within three sessions and its +2 bonus.

### W3.3 P3 and P8 — option-derived DXY levels

- Acquire current component rates needed for K.
- Compute full component conversion with the canon's weights.
- Feed EUR/USD output into P8 primary conversion.
- Apply the ≥$1.5B, $850M–$1.499B and <$850M tiers.
- Keep all intermediate values and the audit trail.

### W3.4 P4 — analyst consensus

- Apply tier weights and independent-source consensus.
- Include explicit levels only; do not manufacture a level from a general directional article.

### W3.5 P5 — full structural and liquidity scan

- 90-day D1 scan and conditional 180-day extension.
- Exact swing high/low rejection wicks, dates and subsequent reaction.
- D1 order blocks and conviction criteria.
- Dedicated LSZ scan and extension, hidden-liquidity scan and active-trigger scan.
- Repeated extreme magnets and role reversals.
- Intra-zone precision levels.
- Singular-candle 4H S/D construction, BoM/MoM and mitigation.
- Conditional 1H precision anchors and gap-fill logic.
- Price anchors, HWC/LWC and core/spike separation.

### W3.6 P6/P7 — fib/round grid and arena

- Compute fib levels from the correct swings.
- Retain psychological big figures and quarter figures.
- Keep P7 arena boundaries as supplementary evidence rather than replacing the primary map.

### W3.7 P9 — regime and strength-based ZFP

- Classify regime from evidence.
- Implement zone-type base failure probability and Appendix B modifiers.
- No `zoneWidth / referenceRange` calculation anywhere in the v5 path.
- Emit measured-move target when ZFP >45%.

**Phase completion:** every one of the nine pillars has actual output or a named missing-evidence record, and no old five/six-zone selector has run.

---

## W4 — ZONE ASSEMBLY AND PAIR TRANSLATION

### W4.1 Build the full E1 map

- Pool all levels with provenance.
- Score all six dimensions and structural-extreme bonus.
- Cluster according to the 0.10/0.15 DXY rules without spot-proximity filtering.
- Assign pressure degree from the group's highest-scoring level.
- Compute POI, BoM/MoM, mitigation, reactions, ZFP and other required E1 metadata.
- Retain full output and MODERATE+ synthesis separately.
- Include intra-zone precision levels and core/spike details.

### W4.2 Translate DXY conviction to pair-specific levels

- Complete DXY E1 first.
- Apply Part IX role/direction mapping.
- Harvest each pair's own technicals, swings, research, options, fib and round levels.
- Match conviction to pair levels without arithmetic conversion.
- Execute all Layer 2 requirements and cross-validation.
- Record the complete per-zone audit trail, including divergences and exclusion reasons.

**Phase completion:** one immutable DXY card and pair-specific cards whose prices cannot be derived from DXY arithmetic.

---

## W5 — CARD, COMPOSITION AND COMPLETE RENDER

### W5.1 Seal and serve the card

- Validate the full schema, provenance and cutoff status.
- Write once in the Durable Object and store bytes in R2.
- Return the card and SHA to the composition step.

### W5.2 Compose the new indicator

Create `scripts/plutus_vision_v5_build.py`:

- read the exact v1 checkpoint baseline;
- read the selected asset/week card;
- preserve v1 code and render order;
- add `e1v5_`-namespaced declarations, card arrays and renderer;
- emit `pine-ide/ide/renderer/plutus-vision-v5-e1.pine`;
- do not inherit legacy E2/E3 code or five/six-zone limits;
- compute render timestamps from the card, not fixed dates.

### W5.3 Render every required E1 family

Implement the coverage matrix in blueprint §9.2:

- RED/ORANGE/TEAL IP ladder;
- GREEN LSZ;
- AMBER option strikes;
- canonical 4H/D1 S/D overlay in addition to v1's S/D;
- BoM/MoM, mitigation, reactions and POI receipts;
- intra-zone precision levels and core/spike;
- strength-based ZFP and measured-move information;
- pair/asset/week/card identity;
- visible named missing-data and invalid-card states.

Use `xloc.bar_time`, `color.new` fills and full pressure names. Keep inspection tables readable rather than hiding missing E1 data behind a small static table.

### W5.4 Correct S/D against the oracle

- Compare v1's zones with canonical P5 output on the golden week.
- Classify each delta: missing, wrong edge, wrong classification or overdrawn.
- Correct the responsible computation/render seam, not a colour to disguise it.
- Retain v1's approved appearance while adding all required canonical zones.

**Phase completion:** the generated artifact is loaded into Pinebox and the chart contains every E1 family for the selected asset/week. This is a render milestone, not yet an accuracy pass.

---

## W6 — PINEBOX ACCEPTANCE AND REPAIR

### W6.1 Golden-week gate

For DXY July 6–10:

1. Acquire and seal the actual historical card under the Monday cutoff.
2. Load the generated composition in Pinebox.
3. Capture and open the actual chart.
4. Compare all E1 families with the operator's oracle.
5. Return **true at 95%+ or false**.
6. If false, score with Clef/Jev and record each wrong/missing family with its mechanism.
7. Repair the responsible source/calculation/render layer.
8. Re-run the identical chart scenario and re-open the new capture.
9. Confirm no previously accepted v1/E1 family regressed.

### W6.2 Generalisation gate

- Select 15 random weeks since 2025-01-20 without hand-picked zone constants.
- Run DXY, EUR/USD and GBP/USD at uniform 95%+.
- Reject any golden-week literal or week-specific special case.
- Record the per-week and per-asset chart verdicts and scores.

### W6.3 Loop law

`acquire → compute → compose → render → look → score → repair → re-render`

Stop only when the golden gate and the generalisation gate pass, or when a hard block is named with its evidence. E2 starts only after this gate. E3 remains deferred.

---

## W7 — PACKAGE ONLY THE ACCEPTED SYSTEM

After chart acceptance:

- record deployed Worker/DO/pi-durable source and artifact hashes;
- record R2 evidence/card schema versions and the selected acceptance runs;
- record baseline and generated Pine SHAs;
- package the Cloudflare deployment manifest, local plutus-browser service configuration, generator and accepted composition;
- include actual chart evidence and the honest remaining gaps;
- commit explicit paths only and tag only after the package audit passes;
- do not push without an explicit operator order.

---

## WAVE EXIT TABLE

| Wave | Observable exit | Not sufficient |
|---|---|---|
| W0 | immutable run identity + baseline hashes + complete schema | a prose schema with no validator |
| W1 | actual source bytes from all required executors + operational headed path | `/health` or a page title alone |
| W2 | typed evidence, Protocol A reconciliation, missing-data records | model prose or text without the image |
| W3 | all nine pillar outputs with formulas and provenance | P1/P2/P5 only |
| W4 | complete DXY and pair-specific E1 cards | five/six positional zones or arithmetic pair conversion |
| W5 | complete E1 chart on top of v1 | a build success or a six-zone screenshot |
| W6 | golden 95%+, then 15 random weeks × 3 assets at uniform 95%+ | unit tests or model assertions |
| W7 | audited package of the accepted deployed system | packaging the unbuilt design |

- **Interim end; the M1 gate amendment below controls the first execution phase.**

## AUTHORITY INDEX

- design/DESIGN_BLUEPRINT_v5.0_CLOUDFLARE.md:1 — the architecture this workflow executes.
- design/BUILD_WORKFLOW_v5.0_CLOUDFLARE.md:1 — this workflow’s own execution order and exit table.
- Checkpoints/v1-ship-approved-working-baseline/dist/plutus-vision-v1.pine:1 — the preserved price-structure floor.
- Original_Canon_Data/Trident_System_Prompt_v5.3.3_DOWNLOAD_ME.md:348 — Engine 1’s nine-pillar definition.
- Original_Canon_Data/TRIDENT_v5.3.3_CORRECTED_E3_ENGINE.md:1 — deferred E3 authority, outside M1.
- MASTER_CONTEXT/OPERATOR_RULINGS_PV.md:132 — R-30, the full-E1-on-the-baseline order this workflow gates.

## M1 GIT-GATE AMENDMENT — THE FIRST EXECUTION PHASE (2026-11-08)

This amendment narrows the workflow's first execution phase to **M1: DXY, trading week
`2026-07-06`, golden week only**. The random-week matrix in W6 and every later wave wait for the
operator's post-M1 review. The enforcement is mechanical, in git:

- `gates/policy.json:1` — immutable paths, commit limits, model threshold, required E1 families.
- `.githooks/reference-transaction:1` — the non-bypassable commit surface; `--no-verify` cannot skip it.
- `gates/commit_gate.py:316` — context, diff, checkpoint, image, hash, state, and model validation.
- `gates/commit_gate.py:454` — the reference-transaction state machine for every created commit.
- `m1/EXECUTION_CONTRACT.md:128` — the commit protocol shown to the builder and the grader.
- `m1/state.json:1` — the live M1 state: checkpoint sequence, work budget, and operator review.

### Commit classes

| Trailer | Meaning | Mechanical requirement |
|---|---|---|
| `PV-Gate: work` | implementation progress | substantive M1 path, no completion claim, state work counter +1 |
| `PV-Gate: checkpoint` | visual checkpoint | checkpoint object, comparison object, committed PNG, matching hashes |
| `PV-Gate: m1-complete` | M1 result | two captures, all required E1 families `MATCHED`, stop state |
| `PV-Gate: admin` | gate repair only | operator token in `PV_GATE_ADMIN_TOKEN`, no authority/history edits |

The default work budget is **two work commits** between visual checkpoints. A work commit may not
use a completion or success claim; a claim requires a checkpoint image.

### External commit grader

Every created commit is sanity-graded by `mimo-v2.6-flash` through the local OpenCode Go Responses
endpoint. The grader receives:

1. the design blueprint;
2. this workflow;
3. `m1/EXECUTION_CONTRACT.md`;
4. the commit message and diff;
5. checkpoint and comparison JSON when present;
6. every required PNG image.

It returns strict JSON. The commit is accepted only on `verdict: PASS` and `score >= 7`. A missing
model, malformed answer, blank image, unrelated page, obvious fabrication, premature success claim,
or score below threshold rejects the ref update. The verdict ledger is
`~/.local/state/plutus-vision-gate/verdicts.jsonl`.

### The M1 loop and stop

The builder repairs and rerenders until every required E1 family in
`m1/EXECUTION_CONTRACT.md:138` is `MATCHED`. One compile, one card, or one rough screenshot is not
a stopping point. The M1-complete commit sets:

```json
{
  "m1_status": "COMPLETE_AWAITING_OPERATOR_REVIEW",
  "operator_review": "PENDING",
  "complete_commit": "SELF"
}
```

After that commit, every further ref update is rejected until the operator supplies the unlock
token from `~/.config/plutus-vision-gate/operator-unlock.token`. The builder does not start W6,
multi-asset work, E2, E3, or packaging.

**End of workflow.**
