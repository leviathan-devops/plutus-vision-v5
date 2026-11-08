# PLUTUS VISION V2 — ENGINE 1 + ENGINE 2 ON TOP OF THE V1 BASELINE

## GOAL

Wire the ORIGINAL canon prompt's **Engine 1** (the institutional pressure map) and **Engine 2**
(the macro shape chain) into the PLUTUS VISION indicator, ON TOP OF the existing V1 baseline,
without touching anything that already works.

**Engine 3 is RULED FLAWED by the operator and is OUT OF SCOPE — no entry, no stop-loss, no
take-profit, anywhere.**

The canon is the only authority:
`PLUTUS/MASTER_CONTEXT/Trident_System_Prompt_v5.3.3_DOWNLOAD_ME.md` — Engine 1 = Part III + IV,
Engine 2 = Part VI.

## BASELINE

**THE V1 WORKING BASELINE IS THE FOUNDATION AND IT SUPERSEDES EVERYTHING ELSE.**

```
artifact   /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION/plutus-vision-v1.pine
sha256     0d20e8314ce992fc        (measured; recorded in every canon doc)
checkpoint Checkpoints/v1-working-baseline-2026-10-03/          (49 MB, the full source tree)
commit     a89fc33 chore(checkpoint): v1-working-baseline-2026-10-03
specs      docs/PLUTUS_VISION_V2_E1E2_SPEC.md      (the 23-item scope + the census)
           docs/PLUTUS_VISION_V2_BUILD_SPEC.md      (this build's architecture + waves)
package    packages/PLUTUS_VISION_V2/               (BUILD_PACKAGE.md, GOAL_PIN.md, both specs)
runtime    trident-v1-vision.service  127.0.0.1:8010  Qwen3.5-4B+mmproj, CPU, hardened
           judge-systemone.service   127.0.0.1:8090  JevK5 judge, 163 ms known-answer probe
```

**THE PROTECTED LAYERS — measured reference counts, re-checked after every wave:**

```
LuxAlgo SMC             226 refs   geometry + BOS/CHoCH/EQL/FVG/extremes    NEVER TOUCHED
SMC order blocks          6 refs   origin-candle mapped                    NEVER TOUCHED
LQZ liquidity bands       4 refs   GREEN, price-keyed merge                 NEVER TOUCHED
```

**FIRST-REPLY CONTRACT — the agent's first reply MUST re-verify the baseline before touching
anything:** print the three reference counts from a live `grep` over `plutus-vision-v1.pine`, print
`sha256sum plutus-vision-v1.pine`, and confirm they read **226 / 6 / 4** and
**0d20e8314ce992fc**. If any count or the sha differs, STOP and report the drift — do not proceed.

## WAVES

The build package is `packages/PLUTUS_VISION_V2/` (BUILD_PACKAGE.md + GOAL_PIN.md + both specs);
the DPL1 scope spec is `docs/PLUTUS_VISION_V2_E1E2_SPEC.md` and the build spec is
`docs/PLUTUS_VISION_V2_BUILD_SPEC.md`. Four waves, in this order. **No wave may paint before its producer exists.**

### PHASE 1 — THE FETCH LAYER (pure code + ONE model call)
Write `scripts/e1_fetch.py`; output `data/e1/<pair>-<week>.json` in the handover's
`trident_template.json` schema. Nine sources: investinglive.com/Orders (the embedded options-table
IMAGE) · TreasuryDirect · FRED · EIA WPSR · ForexFactory · Fed H.10 · Yahoo DX-Y.NYB ·
TradingView technicals · forex.com research.
The temporal boundary is CODE: refuse any input published after Friday 17:00 ET of the prior week;
carry `data_as_of`. Assert `0.1 ≤ notional ≤ 500` (the "already in BILLIONS" trap).
The model is called ONCE, for the image, against `127.0.0.1:8010`, 120 s budget. Exceeded →
`[NO DATA]`. A synthetic 6-row control table runs as a self-test before every live fetch.
Per-wave test identifiers — run each explicitly, never as a batch green:

```
bun test -t ST-1  # fetch: zero fabricated values across all nine sources
bun test -t ST-2  # temporal boundary: no post-Friday-17:00-ET input in the output
bun test -t ST-3  # notional assertion: 0.1 <= notional <= 500 holds, or the run fails
bun test -t ST-4  # the arm control table returns 6/6 strikes, finish=stop
bun test -t ST-5  # with the arm STOPPED, the script still writes [NO DATA] and exits 0
```

### PHASE 2 — E1 RENDERS AS FIVE ZONES
Write `plutus-vision-lqz/e1-render.pine`: **at most six** institutional pressure zones per week.
Colour is a function of `pressure_degree` — NEVER of a positional field (that was v1's banding
defect). `MINIMAL` paints nothing. Bands span the full horizontal extent, anchored at the target
Monday, painting −2 weeks → +3 weeks, both bounds COMPUTED (no hard-coded timestamps).
```
bun test -t ST-6  # the E1 render emits at most six IP zones for one week
bun test -t ST-7  # band(confluence) == pressureDegree for every zone, zero mismatches
bun test -t ST-8  # every band's left edge is the target Monday; no hard-coded timestamp
bun test -t ST-9  # the v1 floor: the reference counts read 226 / 6 / 4 exactly
bun test -t ST-9b # lqz-core.pine + lqz-render.pine are diff-clean vs the baseline checkpoint
```

### PHASE 3 — E2 AS ONE PAINTBRUSH LINE
Pure code: the §6.2 classification matrix, the §6.4.1 ZFP-conditioned transitions, the §6.6
five-step forward mapping with a per-link audit trail and 25% termination, the alternative chain,
the day decomposition with the Trading Speed Rule (+1 day), consolidation phase, TF element
matching. **RULE 1 IS BINDING: every shape names its anchoring zone ids; an unanchored shape is
REFUSED, not rendered.**
Render: ONE thick freehand polyline through the Monday-anchored day anchors, a shape tag per day,
a soft glow, the alternative chain as a dashed ghost, opacity ~55. **One line, NOT a filled area.**
```
bun test -t ST-10 # every shape names its anchoring zone ids; zero unanchored
bun test -t ST-11 # BS + zfp<20% -> RWL, never R and never PBS
bun test -t ST-12 # five day entries with shape + key zone + confidence; +1 day applied
bun test -t ST-13 # an empty zone map yields an empty chain + a NAMED refusal
```

### PHASE 4 — LEGIBILITY + DOCS
Tune until the SMC boxes, the green liquidity bands, the amber→violet pressure zones and the single
forecast line are all simultaneously readable against the operator's winning-trade library. Update
BUILD_REPORT / DEBUG_LOG / TESTING_LOG / THEATRICALITY_LOG.
Gate: the operator looks at the chart. No verdict from numbers alone.

## LAWS

- **ADD ONLY.** The V1 baseline is untouchable. `ST-9` / `ST-9b` are the mechanism; intention is
  not a control.
- **RIPWIRE FIRST-CLASS.** Before any edit to a `.pine` / `.mjs` / `.py` file in this build, run
  `ripwire verb=map` on the tree and `ripwire verb=callers target=<the symbol being changed>`;
  run `ripwire verb=pack-task` before the wave and `ripwire verb=quality-delta` after. A coding
  edit made without a structural map is a blind edit and is rejected on sight.
- **PURE CODE.** The model does ONE job: read the options-table image. A reviewer must be able to
  delete the model call, run the script, and get a valid file with that pillar marked `[NO DATA]`.
- **NO FALLBACKS, NO THEATRE.** A dead source emits `[NO DATA]`. A wrong strike silently becomes a
  fake institutional pressure zone on the chart — the exact failure class this build eliminates.
- **EVERY THRESHOLD IS QUOTED FROM THE CANON.** A threshold you believe is wrong is REPORTED, never
  edited. The canon's 8 documented derailments each began as a "small improvement".
- **ADVERSARIAL FIRST.** The failure paths run FIRST — dead arm, empty corpus, hard wall, temporal
  breach, notional trap. The happy path runs LAST and never first.
- **THE INSTRUMENT MUST BE ABLE TO FAIL.** A measurement that cannot distinguish the defect it
  exists to catch certifies the defect. Prove every instrument with a known positive before
  trusting any zero.

## HARD STOPS

Halt the wave and report. Do not improvise a workaround. Any of these is a hard stop:

- **H1 · THE FOUNDATION IS DAMAGED** — the v1 reference counts drop below 226 / 6 / 4.

- **H2 · A FABRICATED FALLBACK** — `ST-5` fails: the script crashes,
  produces no file, or invents a strike while the arm is stopped. (the script crashes, produces no file, or fabricates a strike
  when the arm is stopped). A fabricated fallback is a release blocker, not a cosmetic bug.
- **H3 · A TEMPORAL BOUNDARY BREACH** — any input published after the Friday 17:00 ET boundary
  appears in the output.
- **H4 · THE NOTIONALS TRAP** — the `0.1 <= notional <= 500` assertion fires: the source is
  emitting millions when it means billions.
- **H5 · THE HARD-WALL RULE BROKE** — `ST-11` fails: BS + zfp<20% yields R or
  PBS. The canon's named "#1 Engine 2 error"; it produced the April 20-24 misprediction.
- **H6 · AN UNANCHORED SHAPE** — any shape reaches the renderer without naming its zone ids.
- **H7 · THE CHART IS ILLEGIBLE** at any gate. Report it; do not tune the v1 layers to make room —
  the NEW layers are what shrink.

## PROOF CONTRACT

Every proof below is a **pass token that must appear in a tool result** — a verbatim command
output, a JSON field, or a captured artifact path. An agent-typed prose claim is THEATRICAL and
counts as FAIL.

```
A1  ARM ALIVE          trident-v1-vision answers the synthetic 6-row control table
                       pass token: "6/6" strikes recovered AND finish_reason="stop"
                       fail token: empty content / finish_reason="length" / timeout
                       bound to: a container/tool result, not prose
A2  DEAD ARM IS HONEST with trident-v1-vision STOPPED, e1_fetch.py still exits 0 and
                       writes a file whose options pillar reads "[NO DATA]"
                       pass token: the literal string "[NO DATA]" in the tool result
                       fail token: any fabricated strike / any crash / no file
A3  THE V1 FLOOR       after every render, the v1 reference counts
                       pass token: "226" AND "6" AND "4" in the grep tool result
                       fail token: any count lower
A4  THE HARD-WALL RULE a synthetic (BS, zfp=18) transition
                       pass token: "RWL" in the tool result
                       fail token: "R" or "PBS"
A5  THE EMPTY CORPUS   E2 against an empty zone map
                       pass token: a NAMED refusal string in the tool result
                       fail token: any shape emitted
A6  THE CHART          a capture path returned by the rig on W29 EUR/USD 1H
                       pass token: the artifact path in the tool result
                       (the VERDICT comes from the operator's eye, not from the path)

INDEPENDENT RE-VERIFICATION (mandatory, a separate agent):
  Re-run A1, A3, A4 and ST-1..ST-13 from a clean checkout of the baseline; diff the
  per-wave claims table against the recorded evidence. Any claim without a matching
  artifact fails the wave. A zero-trust audit of every wave's evidence chain runs
  before the wave is called done.

EXIT: exit 0 from each ST test, RC=0 from e1_fetch.py, and the captured artifact path.
```

## STOP

All six conditions below must hold. Not one item earlier. Each is a separate hard stop.

**DONE WHEN:**

1. `ST-1` … `ST-13` pass, and `A1` … `A6` return their pass tokens in tool results.
2. **The v1 reference counts have NEVER regressed** — 226 / 6 / 4 at every wave gate.
3. `trident-v1-vision.service` is enabled at boot, `Restart=always`, and its sandbox is bound
   (`systemd-analyze security --user trident-v1-vision` ≤ 4.0; the process can read its GGUF and
   cannot write it; verified after a restart, not before).
4. The chart is captured, **looked at by the operator**, and judged clean.
5. Nothing in the artifact implements an Engine 3 primitive.
6. The independent re-verification reports no unbacked claim.

**A green suite without the operator's eye is NOT DONE.** That inversion is what the previous ship
docs committed, and it is the failure this build exists to prevent.
