# M1 EXECUTION CONTRACT — GOLDEN WEEK ONLY

**Milestone:** `M1_GOLDEN_WEEK`
**Asset:** `DXY`
**Trading week:** Monday `2026-07-06` through Friday `2026-07-10`
**Authority:** `design/DESIGN_BLUEPRINT_v5.0_CLOUDFLARE.md:1`
**Execution order:** `design/BUILD_WORKFLOW_v5.0_CLOUDFLARE.md:1`
**Preserved floor:** `Checkpoints/v1-ship-approved-working-baseline/dist/plutus-vision-v1.pine:1`
**Canon:** `Original_Canon_Data/Trident_System_Prompt_v5.3.3_DOWNLOAD_ME.md:348`
**Operator ruling:** `MASTER_CONTEXT/OPERATOR_RULINGS_PV.md:132`

This contract is the build-side supplement to the two design documents above. The git gates read
`gates/policy.json`; this file is context for the builder and the external commit grader. Where this
file and the blueprint differ, the blueprint governs. Where the blueprint and an operator ruling
differ, the ruling governs.

## 1. THE ONE M1 OUTCOME

M1 is complete only when the full Engine 1 zone data for DXY, week `2026-07-06`, is rendered in
Pinebox on top of the preserved v1 baseline, and the opened chart shows price reacting to those
zones with the accuracy the operator's golden-week oracle demands.

A compile is not M1. A health check is not M1. A card with zones is not M1. A first screenshot with
missing families is not M1. A test count is not M1. M1 is the visible chart result.

The final M1 commit must stop for operator review. It must not begin:

- random-week testing;
- EUR/USD or GBP/USD expansion;
- Engine 2;
- Engine 3;
- packaging or shipping;
- a new design generation.

## 2. SOURCE LAWS

1. Use the evidence that already exists on disk for the golden week.
2. Every consumed source is recorded in `m1/evidence/manifest.json` with:
   - `source_path`;
   - `sha256`;
   - `retrieved_from` when it was copied from the archive;
   - `pillar`;
   - `cutoff_status`.
3. A missing source is named in the manifest with `status: "MISSING"` and an impact record.
4. A missing source never becomes a zero, a neutral score, a guessed level, or current-day data.
5. Data published after the Monday `2026-07-06 09:00 London` cutoff cannot influence the E1 card.
6. TradingView bars remain the bar authority, consistent with `MASTER_CONTEXT/OPERATOR_RULINGS_PV.md:104`.
7. investinglive evidence remains the headed-browser path, consistent with `MASTER_CONTEXT/OPERATOR_RULINGS_PV.md:108`.
8. The archived tree under `archive/pre-v5-2026-11-08/` is history, not build input. If golden-week
   evidence lives there, copy it into `m1/evidence/`, hash it, and name the archive provenance.

## 3. BUILD SURFACE

New M1 work belongs under:

- `m1/evidence/`
- `m1/src/`
- `m1/out/`
- `m1/checkpoints/`
- `m1/state.json`
- `gates/` only for gate-owned artifacts

The following are immutable during M1:

- `archive/**`
- `Checkpoints/v1-ship-approved-working-baseline/**`
- `Original_Canon_Data/**`
- `MASTER_CONTEXT/OPERATOR_RULINGS_PV.md`
- `design/DESIGN_BLUEPRINT_v5.0_CLOUDFLARE.md`
- `design/BUILD_WORKFLOW_v5.0_CLOUDFLARE.md`
- `.githooks/**` and `gates/policy.json`, except with an operator admin token

Do not edit Pinebox. Pinebox is the runtime IDE. The build supplies Pine code and evidence to it.

## 4. COMMIT PROTOCOL

Every M1 commit message carries exactly one gate trailer:

- `PV-Gate: work`
- `PV-Gate: checkpoint`
- `PV-Gate: m1-complete`
- `PV-Gate: admin`

### 4.1 Work commits

A work commit:

1. Changes real M1 code, evidence, or generated output.
2. Does not claim completion.
3. Cannot use the words `done`, `complete`, `completed`, `finished`, `works`, `verified`,
   `passed`, `green`, `shipped`, `landed`, or `delivered` in its message.
4. Is externally sanity-graded by the configured vision model on the actual diff.
5. Is limited by `max_work_commits_between_checkpoints` in `gates/policy.json`.

### 4.2 Checkpoint commits

A checkpoint commit carries:

- `PV-Gate: checkpoint`
- `PV-Checkpoint: m1/checkpoints/<id>/checkpoint.json`

It must contain:

1. `m1/checkpoints/<id>/checkpoint.json`
2. `m1/checkpoints/<id>/comparison.json`
3. at least one PNG under `m1/checkpoints/<id>/visual/`
4. the artifacts the checkpoint claims, such as the E1 card or generated Pine composition
5. an updated `m1/state.json`

Every checkpoint has a fresh visual capture. A checkpoint without an opened, hashed PNG is invalid.

### 4.3 M1-complete commit

The M1-complete commit is a checkpoint whose `type` is `m1_complete`. It additionally requires:

- at least two visual captures: one whole-chart frame and one plot/close-up frame;
- every required E1 family in `comparison.json` marked `MATCHED`;
- zero `MISSING`, `WRONG`, `EXTRA`, or `UNOBSERVABLE` required-family rows;
- asset exactly `DXY`;
- week exactly `2026-07-06`;
- the generated composition and card paths present in the commit;
- Pinebox run identity and capture metadata;
- `m1/state.json` with `m1_status: "COMPLETE_AWAITING_OPERATOR_REVIEW"`.

The external grader is explicitly asked whether the images show a plausible full E1 zone map and
price interaction. It is a sanity check, not a replacement for the operator's final review.

### 4.4 Admin commits

Changing the gates or policy requires:

- `PV-Gate: admin`
  - environment: `PV_GATE_ADMIN_TOKEN=<operator-supplied token>`
- No token value is written into the commit message. The hash in `gates/policy.json:1` is the
  only in-repo token material. A builder-generated admin commit is rejected.

## 5. CHECKPOINT OBJECT

`checkpoint.json` must contain:

```json
{
  "schema": 1,
  "id": "M1-001",
  "type": "checkpoint",
  "asset": "DXY",
  "week": "2026-07-06",
  "claims": {
    "evidence_ready": true,
    "engine_ready": false,
    "composition_ready": false,
    "render_observed": false
  },
  "card": "m1/out/e1-card-DXY-2026-07-06.json",
  "composition": "m1/out/plutus-vision-v5-e1-DXY-2026-07-06.pine",
  "comparison": "m1/checkpoints/M1-001/comparison.json",
  "visual": [
    {
      "path": "m1/checkpoints/M1-001/visual/chart.png",
      "expectation": "DXY 1H golden-week chart with v1 liquidity plus the first canonical E1 layer"
    }
  ],
  "pinebox": {
    "mode": "cloud",
    "session": "<session-name>",
    "instance": "<instance-id>",
    "asset": "DXY",
    "timeframe": "1H",
    "week": "2026-07-06"
  }
}
```

Every listed path must exist in the same commit tree. Every PNG must carry its measured `sha256`
in `comparison.json`. A path that exists only in the worktree is not evidence.

## 6. REQUIRED E1 FAMILIES

The M1-complete comparison must resolve every family below to `MATCHED`:

1. IP resistance zones
2. IP equilibrium zone
3. IP support zones
4. Liquidity Sweep Zones
5. canonical 4H/D1 supply/demand zones beyond the v1 baseline
6. option-strike targets
7. POI tier and pressure-degree data
8. strength-based ZFP data
9. BoM/MoM classification
10. mitigation and reaction counts
11. intra-zone precision levels
12. core/spike boundaries where applicable
13. card/run identity and missing-data status

`LIGHT` and `MINIMAL` zones are not permission to omit a family. The full protocol output remains
in the card even when the chart synthesis emphasizes MODERATE and above.

## 7. COMPARISON OBJECT

`comparison.json` must contain:

```json
{
  "schema": 1,
  "checkpoint": "M1-001",
  "oracle_source": "<path or named operator oracle>",
  "asset": "DXY",
  "week": "2026-07-06",
  "rows": [
    {
      "family": "IP support zones",
      "expected": "what the evidence/oracle requires",
      "observed": "what was seen in the opened capture",
      "status": "MATCHED",
      "evidence": ["m1/checkpoints/M1-001/visual/chart.png"]
    }
  ],
  "visual_sha256": {
    "m1/checkpoints/M1-001/visual/chart.png": "<sha256>"
  },
  "summary": {
    "matched": 13,
    "wrong": 0,
    "missing": 0,
    "extra": 0,
    "unobservable": 0
  }
}
```

Allowed row statuses are exactly:

- `MATCHED`
- `WRONG`
- `MISSING`
- `EXTRA`
- `UNOBSERVABLE`

A required `EXTRA` row must explain the unwanted object. It is not a pass for M1 complete.

## 8. THE LOOP LAW

The builder does not stop after one failed or shallow test.

For every wrong or missing family:

1. name the mechanism that produced the defect;
2. repair the responsible source, calculation, or renderer seam;
3. rebuild the card and composition;
4. rerender the same golden-week scenario in Pinebox;
5. capture fresh images;
6. rerun the comparison;
7. confirm previously matched families remain matched.

Only when all required families are `MATCHED` may the builder create the `m1_complete` commit.

If a hard block makes the loop impossible, the checkpoint must say:

- `status: "BLOCKED"`;
- the named blocker;
- the exact evidence;
- the unblock condition.

A blocked checkpoint is honest. A false completion claim is derailment.

## 9. WHAT THE GIT GATE REJECTS

The mechanical gate rejects:

- edits to immutable paths;
- more than `max_work_commits_between_checkpoints` work commits without a visual checkpoint;
- a checkpoint without committed PNG evidence;
- a PNG whose hash does not match `comparison.json`;
- a completion claim in a work commit;
- an M1-complete object without every required family matched;
- E2/E3 work during M1;
- random-week or multi-asset expansion during M1;
- a card or composition path absent from the commit;
- a malformed external-model verdict;
- an external-model score below `7`;
- a commit after M1 complete before operator unlock;
- a gate/policy change without the admin token.

The external model is `mimo-v2.6-flash` through the local OpenCode Go Responses endpoint. It was
vision-controlled on this host: a known-red image returned exactly `RED`.

## 10. PINEBOX USE

Pinebox is used exactly as designed:

1. select `DXY`;
2. select the golden week or a replay window containing it;
3. load the generated composition;
4. let the Pine engine run it;
5. capture the real rendered chart;
6. inspect and compare the pixels;
7. repeat after each repair.

No Pinebox code modification is part of M1.

## 11. STOP CONDITION

When the M1-complete checkpoint passes:

1. the builder stops;
2. the final report presents the chart images, comparison table, card hash, composition hash, and
   commit hash;
3. the operator reviews;
4. no further commit is accepted until the operator unlock token is supplied.

This stop is mechanically enforced, not requested prose.
