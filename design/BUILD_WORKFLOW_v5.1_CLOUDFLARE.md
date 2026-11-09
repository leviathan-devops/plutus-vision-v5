# BUILD WORKFLOW v5.1 — FULL E1 PLUS THE ORGAN-TRANSPLANT STAGES

**Status:** execution plan for operator review. Active M1 CP-005 remains the live build; no v4.5.3 organ is integrated yet. `artifact_class: system`
**Companion to:** `DESIGN_BLUEPRINT_v5.1_CLOUDFLARE.md`.
**Review notes:** `design/5.1 update notes.md:1`.
**Order:** W0 → W1 → W2 → W3 → W3a → W4 → W5 → W6 → W7. E2 and E3 still do not start inside M1; only their anchor contracts may be prepared after E1 acceptance.

## MISSION

Execute the V5.1 organ-transplant stages on the active EURUSD 2026-07-06 golden-week card without preempting M1 presentation cleanup: quarantine non-executable donor references, run ported OBCV/LMV/freshness/pressure adapters in shadow mode, attach only proven metadata to a resealed derived card, reconcile OBCV through canonical scoring, and classify organs only through Pinebox captures and the git checkpoint gate.

## SCOPE

In scope: the active EURUSD 2026-07-06 E1 card; OBCV reconciliation; LMV rungs; freshness events; pressure state; donor provenance; derived-card resealing; Pinebox golden week A/B renders after presentation repair; checkpoint artifacts; and operator review. DXY M1-complete requirements are unchanged and are not satisfied by EURUSD organ work. Out of scope before unlock: random weeks, E2 implementation, E3, old runtime integration, synthetic zones, and Pinebox source modification.

## ACCEPTANCE CRITERIA

1. The running workflow produces a shadow artifact for OBCV, LMV, freshness, and pressure without changing the base E1 card or Pinebox golden week render.
2. Metadata attachment leaves every existing E1 zone geometry unchanged, writes a schema-versioned derived card with a new SHA and supersedes link, and never mutates the sealed base card.
3. OBCV additions are limited to reconciled P5 candidate levels that receive canonical scores through `m1/src/assemble.ts`, then appear in the Pinebox golden week A/B capture with measured object budget and oracle overlap.
4. Every pre-unlock decision is `M1_CANDIDATE`, `METADATA_ONLY`, or `REJECTED`, and cites committed captures, derived/base card hashes, donor hashes, checkpoint state, and the external grader verdict.

---

## The execution rule

Each phase produces an observable artifact and a named next action. No phase claims that the indicator works because code exists. The only E1 acceptance artifact is the real Pinebox chart at the required accuracy.

A required unavailable input produces a named error and a missing-data record. It never produces invented evidence, a different execution environment, or a different artifact labelled as the requested one.

A donor organ is another input, not an authority. A donor/canon conflict rejects the donor output by name; it never changes the canonical rule.

---

## W0 — IDENTITY, BASELINE AND SCHEMA

### W0.1 Freeze the baseline contract

- Read `Checkpoints/v1-ship-approved-working-baseline/dist/plutus-vision-v1.pine` and record its SHA-256.
- Confirm the archived H1 renderer at `archive/pre-v5-2026-11-08/head/pine-ide/ide/renderer/plutus-vision-v1.pine` still matches SHA-256 `0d20e8314ce992fc23e27f1b97fed76b981c84e78c647bbe6b3d6e1206517bd1`.
- Keep the live generated output at `m1/out/plutus-vision-v5-e1.pine`.
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

## W3a — V4.5.3 ORGAN-TRANSPLANT STAGES
This wave is available only after operator approval of `DESIGN_BLUEPRINT_v5.1_CLOUDFLARE.md:1`. It must not preempt the active M1 presentation cleanup recorded at `m1/checkpoints/CP-005/checkpoint.json:1`. The active golden-week asset is EURUSD 2026-07-06 at CP-005 unless the operator changes it; DXY remains approved.

### W3a.0 — Quarantine reference donors and port adapters

- Create `m1/donors/v453/reference/`.
- Store selected donor sources as non-executable `.txt` copies (for example `lmv.ts.txt`) with byte-identical content and SHA-256 provenance.
- Never place a donor `.ts` file where Bun/TypeScript can compile or import it.
- Record dispositions in `m1/donors/v453/PROVENANCE.json`: executable-port source versus reference-only.
- Port the six executable organ algorithms into current M1 types under `m1/src/organs/`.
- Runtime code never imports the quarantine or the old dependency graph.
- Copy no runtime, client, E3, synthesis, secret-shaped file, or transitive old dependency.
- **Exit:** reference hashes match; adapters compile; no runtime import resolves into `m1/donors/`.

### W3a.1 — Shadow the organ adapters

Implement current-type adapters under `m1/src/organs/`:

- `lmv.ts` (including the lqz-matrix touch taxonomy);
- `obcv.ts`;
- `freshness.ts`;
- `pressure.ts`.

Temporal law:

```text
anchorMs == card.window.cutoff (Monday 09:00 London)
every input bar.timestamp <= anchorMs
any later bar in an organ input is ORGAN_INPUT_POST_CUTOFF and fails the shadow run
```

OBCV runs 4H and 1H lanes first. A 30m lane runs only if pre-cutoff 30m bars are already present in the typed evidence contract; otherwise the shadow records `OBCV_30M_DATA_MISSING` and draws no inference from the absent lane.

Run the adapters beside the current card and emit:

```text
m1/out/organ-shadow-<checkpoint>.json
```

The shadow output records:

- every LMV rung and zone assignment;
- every OBCV candidate and reconciliation class;
- every freshness event/state;
- every pressure lifecycle/link;
- every rejection token.

**Exit:** shadow output exists for EURUSD 2026-07-06. The base canonical card and chart are byte-for-byte unaffected.

### W3a.2 — Attach metadata to a derived, resealed card

- Assign LMV rungs to existing canonical zones.
- Add the freshness event ledger additively.
- Keep existing downstream fields `reactionsPreCutoff` and `reactionState` as derived views:
  - `FRESH` → `Virgin`;
  - `TESTED_1X`/`TESTED_2X` → `Active`;
  - `DEPLETED` → `Depleted`;
  - `VIOLATED` → `Depleted` plus `pressure.pierced=true`.
- Attach pressure lifecycle and defense state.
- Put zone-less LMV rungs in card-level `unassignedPrecision[]`.
- Do not add zones.
- Do not change any zone edge.
- Do not add chart objects.
- Never overwrite `m1/out/e1-card-EURUSD-2026-07-06.json`; write a schema-versioned derived card with a new SHA and `supersedes_sha256` pointing to the base.

**Exit:** the derived card gains `precision`, `unassignedPrecision`, `freshness`, and `pressure` blocks with complete provenance; its new SHA is recorded; the base card and composition geometry remain unchanged.

### W3a.3 — Reconcile OBCV S/D through canonical assembly

- Run current P5 and the OBCV adapter independently.
- Classify every pair as `AGREED`, `OBCV_ADDITIONAL`, `OBCV_MISSING_CURRENT`, `EDGE_CONFLICT`, or `REJECT`.
- Convert `OBCV_ADDITIONAL` candidates into current P5 `Level` records with complete provenance.
- Pass those levels through `m1/src/assemble.ts`; canonical six-dimension scoring, clustering, POI, ZFP, and degree decide whether they merge or form zones.
- Preserve current geometry on `EDGE_CONFLICT`.
- Record every disagreement and every missing 30m lane as `OBCV_30M_DATA_MISSING`.

**Exit:** the reconciliation matrix and updated card are committed; every added/merged S/D object has canonical score provenance and complete OBCV metadata. No unscored OBCV geometry exists.

### W3a.4 — A/B Pinebox render after presentation repair

Prerequisite: the CP-005 presentation defect is repaired and a legible baseline checkpoint exists. Do not measure organ labels against the current giant-table/overlapping-label frame.

Using the same operator-active asset, week, timeframe, and Pinebox instance mode:

0. legible current baseline;
1. current composition;
2. current + metadata;
3. current + canonically scored OBCV-added S/D;
4. current + pressure/LMV inspection;
5. full V5.1 candidate.

For each frame record:

- capture SHA;
- total drawn objects and objects added by the organ layer;
- label collisions;
- recall against the 13 collapsed operator bands using CP-003's YES/PARTIAL/MISS method;
- false additions;
- edge deltas;
- previously accepted family regression.

Before the first A/B run, measure the room's render-failure object boundary by bisection from the legible baseline and record the integer, method, and capture hashes in `m1/out/room-budget-<checkpoint>.json`.

**Exit:** all frames are committed as one checkpoint comparison and opened by a vision-capable reader; the room-budget artifact exists with a measured integer boundary.

### W3a.5 — M1 candidate decision, before operator unlock

An organ may become an **M1 candidate** only when:

1. YES recall increases, or the operator explicitly accepts a metadata-clarity gain;
2. no operator band becomes `MISS` and no previously accepted family regresses;
3. object count remains inside the measured room budget;
4. provenance is complete;
5. the operator accepts the visual result.

Random-week testing remains forbidden before the M1-complete operator unlock. Therefore the pre-unlock decisions are exactly:

```text
M1_CANDIDATE | METADATA_ONLY | REJECTED
```

`PROMOTED` is impossible before the post-unlock random-week gate. Historical tuning constants remain shadow/M1-candidate values until that gate.

**Exit:** a `V5.1_ORGAN_DECISION` record lists each organ as `M1_CANDIDATE`, `METADATA_ONLY`, or `REJECTED`, with measured evidence.

### W3a.6 — Prepare E2 contracts only after E1 acceptance

After M1-complete and operator unlock:

- port `ShapeDayZone` as an ID-only contract;
- map current zone IDs and LMV defended edges;
- build the pressure-aware transition table from 5.3.3 Part IV;
- keep the storyline engine read-only.

No E2 shape chain, path render, or E3 logic starts in W3a.

---

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

### W5.2 Extend the live M1 composition generator

Extend `m1/src/compose.ts`, not the archived generator path:

- read the exact v1 checkpoint baseline;
- read every sealed `m1/out/e1-card-*.json` selected for the composition;
- preserve v1 code and render order;
- keep `e1v5_`-namespaced declarations, card arrays and renderer;
- emit `m1/out/plutus-vision-v5-e1.pine`;
- upload that generated file through the Pinebox indicator/room API;
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

### W5.5 Apply the R-36 two-week clip and repair temporal anchoring

- Clip every E1 object to `[week_monday - 7 days, week_friday 21:00 UTC]`.
- Start an LSZ drawing at its last qualifying pre-cutoff reaction or the left clip boundary, never its old origin candle alone.
- Keep older origins as card metadata only.
- Remove the debug/provenance table and five-field label pile from the chart; card data moves to the inspect layer.
- Re-render and verify that no object crosses the whole active week from a month-old origin.

**Phase completion:** a legible generated artifact is loaded into Pinebox, every E1 family is available on chart or in the inspect layer, temporal anchoring satisfies R-36, and no zone-count cap was used. This is a render milestone, not yet an accuracy pass.

---

## W6 — PINEBOX ACCEPTANCE AND REPAIR

### W6.1 Golden-week gate

For the operator-designated golden-week asset and July 6–10 — live CP-005 is EURUSD, while DXY remains approved:

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
| W3a | donor provenance, shadow output, metadata attach, OBCV reconciliation, and A/B captures | importing old runtime or claiming organ value without pixels |
| W4 | complete DXY and pair-specific E1 cards | five/six positional zones or arithmetic pair conversion |
| W5 | complete E1 chart on top of v1 | a build success or a six-zone screenshot |
| W6 | golden 95%+, then 15 random weeks × 3 assets at uniform 95%+ | unit tests or model assertions |
| W7 | audited package of the accepted deployed system | packaging the unbuilt design |

- **Interim end; the M1 gate amendment below controls the first execution phase.**

## AUTHORITY INDEX

- design/DESIGN_BLUEPRINT_v5.1_CLOUDFLARE.md:1 — the architecture this workflow executes.
- design/5.1 update notes.md:1 — the operator-review rationale for the organ layer.
- design/BUILD_WORKFLOW_v5.1_CLOUDFLARE.md:1 — this workflow’s own execution order and exit table.
- Checkpoints/v1-ship-approved-working-baseline/dist/plutus-vision-v1.pine:1 — the preserved price-structure floor.
- Original_Canon_Data/Trident_System_Prompt_v5.3.3_DOWNLOAD_ME.md:348 — Engine 1’s nine-pillar definition.
- Original_Canon_Data/TRIDENT_v5.3.3_CORRECTED_E3_ENGINE.md:1 — deferred E3 authority, outside M1.
- MASTER_CONTEXT/OPERATOR_RULINGS_PV.md:132 — R-30, the full-E1-on-the-baseline order this workflow gates.

## M1 GIT-GATE AMENDMENT — THE FIRST EXECUTION PHASE (2026-11-08)

This amendment controls the first execution phase: the operator-selected golden-week asset and trading week `2026-07-06`. The live CP-005 baseline is EURUSD (`m1/checkpoints/CP-005/checkpoint.json:5`); DXY remains an approved M1 asset. Random weeks and later waves wait for operator review. The enforcement is mechanical, in git:

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
random-week work, E2 implementation, E3, or packaging. V5.1 donor work may run as W3a only after
operator approval and must not bypass the M1 visual gate.

**End of V5.1 workflow for operator review.**
