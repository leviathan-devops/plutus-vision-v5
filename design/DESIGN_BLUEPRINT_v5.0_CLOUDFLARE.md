# DESIGN BLUEPRINT v5.0 — PLUTUS VISION: THE FULL E1 INSTITUTIONAL MAP, ON TOP OF THE APPROVED V1 BASELINE

**Status:** FOR OPERATOR REVIEW. Not an implementation approval. Not a claim that E1 works.
**Authority:** `Original_Canon_Data/Trident_System_Prompt_v5.3.3_DOWNLOAD_ME.md` for E1, plus operator rulings R-12 through R-32 in `MASTER_CONTEXT/OPERATOR_RULINGS_PV.md`.
**Supersedes:** `DESIGN_BLUEPRINT_v4.1_CLOUDFLARE.md` and `BUILD_WORKFLOW_v4.1_CLOUDFLARE.md`. The archived `archive/cf-draft-2026-11-01/` is not an input.
**Scope of this document:** Cloudflare acquisition and mechanical orchestration; complete E1 computation; complete E1 rendering on top of the approved v1 baseline; automatic asset/week selection; the Pinebox acceptance loop. E2 and E3 are explicitly deferred.
**Implementation partner:** `BUILD_WORKFLOW_v5.0_CLOUDFLARE.md`, the ordered execution workflow for this design.

---

## 0. THE OPERATOR'S TARGET, VERBATIM

> "you need to also integrate this ON TOP OF the foundation laid with /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION/Checkpoints/v1-ship-approved-working-baseline ~ this is a combination of LuxAlgo's liquidity + S/D indicators. the Liqudity zones are A+ and the S/D are A- need some minor improvement to catch ALL the relevant zones but this already solves 1 side of the coin so you just need to add the E1 canon from the prompt (2nd side of the coin) to be rendered ON TOP OF this. that way it can auto detect any trading week and render the ACCURATE zones for that specific tradying week. FULL E1 data no partial bullshit"

That is the acceptance target: **the entire E1 map for the selected trading week, drawn on the chart, on top of the existing price-structure baseline.** It is not "six plausible bands." It is not a harvested JSON file. It is not a Cloudflare health check. It is not a report that mentions the other eight pillars while only one changes pixels.

---

## 1. THE ARCHITECTURE IN ONE PICTURE

```
┌─────────────────────────────┐
│  PINEBOX                    │
│  chart asset + target week  │
└──────────────┬──────────────┘
               ▼
┌─────────────────────────────┐
│  CLOUDFLARE WORKER          │
│  run = asset + Monday       │
└──────────────┬──────────────┘
               ▼
┌─────────────────────────────┐
│  PI-DURABLE OBJECT          │
│  ordered code tasks         │
└──────────────┬──────────────┘
               ▼
┌─────────────────────────────┐
│  SOURCE EXECUTORS           │
│  bars / pages / macro data  │
└──────────────┬──────────────┘
               ▼
┌─────────────────────────────┐
│  NAMED MODEL STEPS ONLY     │
│  Clairic reads, Clef judges │
└──────────────┬──────────────┘
               ▼
┌─────────────────────────────┐
│  FULL E1 CODE               │
│  nine pillars + all classes │
└──────────────┬──────────────┘
               ▼
┌─────────────────────────────┐
│  IMMUTABLE E1 CARD          │
│  evidence → zones → render  │
└──────────────┬──────────────┘
               ▼
┌─────────────────────────────┐
│  V1 BASELINE + E1 LAYER     │
│  one new composition        │
└──────────────┬──────────────┘
               ▼
┌─────────────────────────────┐
│  LOOK AT PINEBOX CHART      │
│  true/false, then Clef/Jev  │
└─────────────────────────────┘
```

There are **two independent source planes**:

1. **Cloudflare** fetches bars, public pages, macro releases, options images and institutional research; stores raw evidence; runs the mechanical E1 pipeline; emits one immutable card per `(asset, week)`.
2. **The local host** does only the two things Cloudflare cannot do: operate the headed investinglive browser and render the real Pinebox chart for visual acceptance.

The two planes meet at named bindings, not an agent loop and not a local orchestration daemon.

---

## 2. THE BASELINE: EXACTLY WHAT IS PRESERVED AND WHAT IS NOT

### 2.1 The file identities, measured on 2026-11-07

| identity | path | lines | SHA-256 |
|---|---|---:|---|
| operator-named working baseline | `Checkpoints/v1-ship-approved-working-baseline/dist/plutus-vision-v1.pine` | 1,179 | `82da437af969a3157bd9454cbe70497ce01cf71fe4681b9e2401b754aa90cd43` |
| sealed H1 renderer | `pine-ide/ide/renderer/plutus-vision-v1.pine` | 1,270 | `0d20e8314ce992fc23e27f1b97fed76b981c84e78c647bbe6b3d6e1206517bd1` |

They are different files. **H1 remains untouched.** The composition starts from the operator-named checkpoint baseline, not from an assumption that those two files are identical.

The existing generator, `scripts/lqz_vision_build.py:52-90`, assembles:

- the LuxAlgo SMC section from `plutus-vision-v0.pine`;
- `plutus-vision-lqz/lqz-core.pine`;
- `plutus-vision-lqz/lqz-render.pine`;
- a single indicator declaration.

The baseline contains LuxAlgo S/D/order-block machinery, structural tools and the operator's candle-liquidity engine. Its full-width emitter is `f_lqzRender()` (`Checkpoints/v1-ship-approved-working-baseline/dist/plutus-vision-v1.pine:1140-1160`). It keeps the most recent levels in a bounded buffer (`:886-893`), clusters and scores them, then emits liquidity bands. Its default detector is `"candles"` (`:867`). The LuxAlgo tap functions are stubs returning empty values (`:5-9`).

**Therefore:** this is a working price-structure baseline, not four functioning LuxAlgo liquidity feeds. The v5 design preserves the measured working baseline and does not describe its stubs as external E1.

### 2.2 Add-only composition

A new generator, `scripts/plutus_vision_v5_build.py`, will produce a **new** artifact:

`pine-ide/ide/renderer/plutus-vision-v5-e1.pine`

It will read, not modify:

- `Checkpoints/v1-ship-approved-working-baseline/dist/plutus-vision-v1.pine`;
- the existing modular render sources where their contract is canon-correct;
- the new `plutus-vision-lqz/e1-v5-render.pine`;
- a generated, validated card for the selected asset and week.

The v1 declaration, detector, S/D logic, liquidity clustering and full-width emitter remain intact. New E1 declarations use an `e1v5_` namespace. There is one `indicator()` declaration and one final render block. v1 renders first; E1 draws after it.

### 2.3 Existing E1 work is not the v5 foundation

The repository already contains partial E1 machinery. It is reusable only where it implements canon, not by inheritance:

- `plutus-vision-lqz/e1-render.pine:18-22` supports at most six zones and a small table.
- `plutus-vision-e1-automatic.pine:2-31` has IP/options/table visibility and fixed historical date inputs.
- `pine-ide/ide/renderer/plutus-vision-v2.pine:1351-1408` contains a chart-derived approximation whose comments describe selected pillars and an intraday proxy.
- `scripts/e1_extract.py:1047-1243` clusters a subset of pillars into a positional ladder and limits the result to five zones (`:1213-1216`).
- `scripts/e1_extract.py:154-183` contains a Yahoo OHLC reader, contrary to R-23.
- `plutus-vision-lqz/e1-render.pine:151-155` still contains the width-derived ZFP function; R-17 makes strength the only ZFP basis.

These are **evidence of partial prior work, not authority**. The v5 card and full-output renderer replace the six-zone/five-slot model and the chart-proxy computation. Canon-correct colour and drawing helpers can be ported; no approximation is promoted because it is convenient.

---

## 3. THE E1 OBJECT: WHAT "FULL" MEANS

The prompt defines Engine 1 at `Trident_System_Prompt_v5.3.3_DOWNLOAD_ME.md:348`:

> "9-Pillar 6D Hybrid System + 4H Zone Overlay + POI Tier Classification + Zone Reaction Counter + BoM/MoM Classification"

It answers where the walls are, how strong they are, which are real and which still have reactions left.

A complete E1 output has:

- every retained level, its pillar, exact price, provenance, source time and cutoff status;
- all computed IP zones, including zones excluded from the synthesis view;
- all LSZs, with type, priority, source dates and optional BoM overlap;
- all canonical 4H/D1 supply/demand zones, with BoM/MoM and mitigation state;
- intra-zone precision levels and core/spike separation where applicable;
- six-dimension scoring and structural-extreme bonus;
- pressure degree, POI tier, strength-based ZFP and measured-move target when triggered;
- BoM/MoM, mitigation and reaction counts;
- ladder-step status and other E1 metadata needed downstream;
- pair-translation evidence and Layer 2 verdicts for EUR/USD and GBP/USD;
- missing-data records with their impact, never silent omission.

### 3.1 The nine pillars and the baseline boundary

| Pillar | Canonical computation and evidence | Baseline relation |
|---|---|---|
| **P1 — Multi-timeframe pivots** | Classic, Fibonacci, Camarilla; weekly plus each of the last three daily sets; extended historical periods; verification before use (`:967-1059`) | **New external computation.** v1 does not implement this 42-level engine |
| **P2 — MA confluence** | EMA/SMA 9/10/20/50/100/200, 3+ within 0.15 DXY, recapture of 50/100/200 within three sessions (`:1065-1079`) | **New.** Not the four chart EMAs in the old v2 approximation |
| **P3 — Component option conversion** | Full DXY formula and weights, with current component rates, audit trail and notional tiers (`:1092-1165`) | **New.** Cloudflare calculation; no Pine conversion code |
| **P4 — Institutional commentary** | Explicit analyst levels only; tiers 1/2/3 weights 3/2/1; consensus across sources (`:1179-1199`) | **New.** Named model extraction step, then code scoring |
| **P5 — Structural extremes, price anchors, liquidity engineering** | 90/180-day D1, 4H and conditional 1H scans; order blocks, LSZs, magnets, intra-zone levels, core/spike and BoM/MoM (`:1205-1421`) | **Partial overlap.** Preserve v1 visuals; canonical P5 is independently computed and completes missing zones |
| **P6 — Fibonacci and round-number grid** | Prior-week/extended swings, fib levels and big figures (`:1424-1426`) | **New full implementation.** No arbitrary proximity filter |
| **P7 — Derivatives arena** | Wide pressure-arena boundaries; primary 9-pillar map remains the source of exact zones (`:1430-1432`) | **New.** Supplementary evidence, not a replacement zone source |
| **P8 — EUR/USD primary strike conversion** | EUR/USD strikes and notional confidence using the current K factor; tiers and audit trail (`:1436-1451`) | **New.** EUR/USD P3 output feeds P8; it is not final (`:1163`) |
| **P9 — Regime, ZFP and breakout magnitude** | Regime classification, strength-based failure probability and measured-move projection for ZFP >45% (`:1455-1459`) | **New.** No pixel/width-derived ZFP |

### 3.2 Scoring and zone assembly are not the liquidity cluster

The canonical six dimensions are Technical, Options-Derived, Analyst Consensus, Structural, Psychological and Regime/Dynamic, each 0–2 points, plus up to +2 Structural Extreme Bonus (`:1465-1484`).

- **12–14:** EXTREME
- **10–11:** HEAVY
- **8–9:** MODERATE-HEAVY
- **6–7:** MODERATE
- **4–5:** LIGHT
- **0–3:** MINIMAL

Every level from every pillar is retained without filtering by distance from spot (`:1496-1503`, and the principle at `:722-735`). Levels within 0.15 DXY are high-density; within 0.10 DXY they are tight confluence. A group's pressure degree follows its highest-scoring level.

This is **not** the v1 liquidity clustering algorithm. E1 does not feed its institutional map into `lqzSink()` and call the output canonical. The two engines coexist: v1 draws its price-derived liquidity; E1 draws the canonical institutional map with its own data and provenance.

### 3.3 Full-output versus synthesis

`Part V §5.2.1` says MODERATE and above appear in the clean synthesis, while LIGHT and MINIMAL remain in the full protocol output (`:1631-1646`). v5 preserves both:

- **full card:** all canonical zones and evidence;
- **default chart synthesis:** MODERATE and above;
- **full-data inspection layer:** LIGHT, MINIMAL, excluded and rejected candidates with named reasons, visible on demand and always present in the card.

A display mode is not permission to discard data. A cap of five or six zones is not a canonical substitute for this two-view model.

### 3.4 Classifications that must survive into the card

- **BoM/MoM:** origin versus continuation of a directional move (`:1145-1152`).
- **Reaction count:** 0 virgin, 1–2 active, 3+ depleted (`:1154-1161`).
- **Mitigation:** 0X, 1X, 2X, 3X and paradox 4–5X holding (`:1378-1385`).
- **POI tier:** computed confluence, not a decorative constant.
- **Zone role:** resistance ceiling, upper resistance, equilibrium, mid-range support, key support band, LSZ, breakout extension target.
- **Intra-zone levels:** precision floor/ceiling/mid-anchor and their sources (`:1312-1339`).
- **Core/spike:** body core versus wick extension and its half-score LSZ treatment (`:1411-1420`).

---

## 4. AUTOMATIC ASSET AND WEEK SELECTION

### 4.1 Run identity

Every run has exactly one identity:

```json
{
  "asset": "DXY",
  "week_monday": "2026-07-06",
  "requested_by": "pinebox-week-selection"
}
```

The selected Pinebox week determines the Monday; the chart symbol determines the asset. No default golden-week literal is allowed in production. The golden week is a test fixture, not an engine constant.

The Worker rejects a non-Monday date as `W0_WEEK_NOT_MONDAY`. It rejects an unsupported symbol as `W0_ASSET_UNSUPPORTED`. An unknown chart ticker renders a named refusal, not DXY data.

### 4.2 Time window and no hindsight

The trading week is:

- open: Sunday 22:00 UTC before Monday;
- information cutoff: Monday 09:00 London, including the fixed UK daylight-saving table;
- end: Friday 21:00 UTC.

This is the single window rule carried forward from the v4.1 design at `DESIGN_BLUEPRINT_v4.1_CLOUDFLARE.md:328-339`, and it matches the canon's temporal-boundary requirement at `Trident_System_Prompt_v5.3.3_DOWNLOAD_ME.md:427-441`.

The selected week's future candles are **test observations**, never E1 inputs. The Pinebox chart can show the week's outcome while E1 uses only evidence available at the boundary. Raw evidence carries publication and retrieval timestamps. A post-cutoff record is stored for audit but cannot affect the prediction.

### 4.3 Render interval

Part X uses the data week's Monday minus 14 days and Friday plus 21 days, with `xloc.bar_time` (`:3755-3769`). The renderer calculates those timestamps from the selected card. There are no fixed April or July dates in the engine.

---

## 5. CLOUDFLARE EXECUTION: A MECHANICAL TREE, NOT AN AGENT LOOP

### 5.1 The control plane

- **Worker:** validates `(asset, week)`, starts or retrieves a run, serves the resulting card and generated Pine.
- **Durable Object named `e1:<asset>:<monday>`:** serialises one run and its write-once card. A second request reads the first card's hash; it does not overwrite it.
- **pi-durable code Tasks:** execute the named steps inside the Durable Object (R-21, Option A). The orchestration is a fixed tree of code calls. No model chooses the next step.
- **R2:** immutable raw source bytes, screenshots/images, normalized evidence, cards and generated Pine. Keys include asset, week, source and retrieval timestamp.
- **D1:** searchable run, source, evidence, zone, judgement and acceptance metadata. R2 remains the byte authority.
- **Worker secrets:** the plutus-browser bearer token and any provider credentials, never in the card or Pine.

### 5.2 Ordered run steps

| Step | Owner | Input | Output | Failure |
|---|---|---|---|---|
| **R0 Resolve** | Worker | chart asset + selected Monday | validated run identity and window | named input refusal |
| **R1 Acquire independent sources** | code tasks | source manifest | raw evidence in R2 | per-source named error; no fabricated bytes |
| **R2 Normalize** | code tasks | raw evidence | typed OHLC, macro values, page text, image references | source-specific schema error |
| **R3 Read images/text** | Clairic tasks | stored images and source text | candidate fields with spans and confidence | named extraction failure; no invented numbers |
| **R4 Reconcile** | code | independent reads | confirmed or `[UNCLEAR]` fields | conflicts cannot enter calculations |
| **R5 Compute nine pillars** | code | confirmed evidence | all levels and provenance | missing evidence recorded, no proxy pillar |
| **R6 Assemble E1** | code | all pillar outputs | zones, scores, classifications, reactions and ZFP | arithmetic/provenance error |
| **R7 Judge** | Clef | compact receipts and expected checks | bounded verdicts | model unavailable = unjudged, not approved |
| **R8 Seal** | Durable Object | validated E1 object | immutable card + SHA | write/hash failure |
| **R9 Compose** | code | card + baseline | generated v5 Pine | schema/render-generation error |
| **R10 Accept** | operator + Pinebox | real chart | true/false, then Clef/Jev score | below 95% = not accepted |

R1 independent reads run concurrently with per-source result capture. The stages that consume evidence remain ordered. No failed source turns into a fabricated substitute; its missing-data row states the impact.

### 5.3 Model boundaries

**Clairic** reads an image or source document into typed candidate values. It does not decide a zone's pressure, trade direction, next step or completion. Protocol A uses its three required image passes and two-of-three reconciliation (`Trident_System_Prompt_v5.3.3_DOWNLOAD_ME.md:836-853`).

**Clef** judges explicit receipts and chart failures. It does not create source data, repair missing values or declare acceptance on its own.

**Jev** is used for local calibrated classification/scoring where applicable. The code owns all branches and effects. No model verdict can replace a chart observation.

---

## 6. SOURCE EXECUTORS: ALL NINETEEN CANONICAL INPUT FAMILIES

The source list is `Trident_System_Prompt_v5.3.3_DOWNLOAD_ME.md:747-767`, with execution order at `:778-800`. The v5 implementation uses the source **data**, not the prompt's obsolete tool brand names. The existing local `z-ai` commands are not a Cloudflare architecture.

| Canon item | Executor in v5 | Evidence required | Measured status on 2026-11-07 |
|---|---|---|---|
| investinglive OTC expiries | **Local plutus-browser**, called through Worker VPC binding | date-specific page URL, embedded image bytes, three-pass extraction, reconciliation | Headed page and expiry rows read; Worker→tunnel `/health` proven. Full Protocol A image pipeline **not built** |
| ForexFactory calendar | Cloudflare Browser Run or direct parser where sufficient | event name, exact date/time, impact, forecast/previous | Page retrieval measured working |
| TreasuryDirect auctions | HTTP JSON | auction date/security/CUSIP, bid-to-cover | Plain API available; v5 parser not built |
| FRED RRP | HTTP CSV/data endpoint | value and publication date | Direct browser retrieval unsuitable; data fetch to implement |
| EIA WPSR | HTTP PDF/document + extraction | release time and inventory deviation | Release-window restrictions recorded; parser not built |
| Fed H.10 | HTTP page/table | current component rates and publication date | Retrieval measured working |
| Yahoo DXY history | **Replaced by TradingView OHLC** (R-23) | daily/weekly H/L/C and timestamps | No Yahoo dependency allowed |
| TradingView DXY OHLC | **TradingView tvDatafeed-compatible client in Cloudflare** | D1/4H/1H bars sufficient for 90/180-day scans | Not implemented in the Worker |
| TradingView DXY technicals | Cloudflare Browser Run/HTTP DOM extraction | EMA/SMA values and buy/sell/neutral counts | Page loads; MA-value extraction unproven |
| forex.com DXY research index | Cloudflare page retrieval | article URL, title, timestamp | Index measured loading |
| DXY institutional search | Approved web search/retrieval step | dated article text and explicit levels | Executor not selected/deployed |
| DXY technical research | Cloudflare page retrieval | dated institutional text | Not built |
| DXY Q&A research | Cloudflare page retrieval | dated institutional text | Not built |
| TradingView DXY structured research | Cloudflare page retrieval | structured dated levels | Not built |
| EUR/USD technicals | Cloudflare page retrieval + pair OHLC | pair MAs, consensus, H/L/C | Not built |
| GBP/USD technicals | Cloudflare page retrieval + pair OHLC | pair MAs, consensus, H/L/C | Not built |
| AUD/USD technicals | Cloudflare page retrieval + pair OHLC | pair MAs, consensus, H/L/C | Not part of the three-asset acceptance set; source family retained |
| EUR/USD institutional search | Approved retrieval step | pair-specific dated explicit levels | Not built |
| GBP/USD institutional search | Approved retrieval step | pair-specific dated explicit levels | Not built |
| AUD/USD institutional search | Approved retrieval step | pair-specific dated explicit levels | Source family retained |

### 6.1 The headed acquisition path

```
┌─────────────────────────────┐
│  WORKER / PI-DURABLE        │
└──────────────┬──────────────┘
               │ BROWSER.fetch
               ▼
┌─────────────────────────────┐
│  WORKERS VPC SERVICE        │
└──────────────┬──────────────┘
               ▼
┌─────────────────────────────┐
│  NAMED TUNNEL               │
└──────────────┬──────────────┘
               ▼
┌─────────────────────────────┐
│  PLUTUS-BROWSER ID 20       │
│  local port 30020           │
└──────────────┬──────────────┘
               ▼
┌─────────────────────────────┐
│  IMAGE + URL TO R2          │
└─────────────────────────────┘
```

The production call is a Worker `vpc_services` binding named `BROWSER` to service `01a1b53f-a0b8-7de2-a193-78f0b6d5f835`, reaching `http://localhost:30020` through named tunnel `972a42d8-fad2-44c9-8abb-cb39b9d823c3`.

The Worker uses the bearer token from a Worker secret for every route except `/health`. The local instance is started with `plutus-browser up --id 20`. plutus-browser is **not** the orchestrator, not a second Pinebox and not a substitute chart environment.

### 6.2 The tunnel is proven, not production-complete

Measured proof: a probe Worker returned `/health` 200 with the local instance PID and `/status` 401 without the bearer token (`SHIP_PACKAGES/plutus-browser/docs/TESTING_LOG.md:131-139`). The probe Worker was deleted and the instance stopped.

Remaining operational work:

- run cloudflared as a supervised service, not a one-off `setsid` process;
- define the startup/health contract for instance 20 before a harvest;
- store the token as a Worker secret;
- prove the complete date-page → image → R2 → Clairic chain, not only `/health`.

---

## 7. PAIR ARCHITECTURE: DXY DIRECTION, PAIR-SPECIFIC PRICES

The causal model is one-directional: USD macro forces → DXY → EUR/USD and GBP/USD (`Trident_System_Prompt_v5.3.3_DOWNLOAD_ME.md:3261-3310`).

**The only valid translation is Structural Equivalence (Approach B):**

1. Complete and verify the DXY E1 map.
2. Read DXY directional conviction and map its role to the pair role.
3. Harvest the pair's own MAs, swings, research, options, fib and round levels.
4. Match the conviction to the pair's own structural levels.
5. Apply Layer 2 verification.
6. Record the source DXY zone, mapping rule, pair sources, verification, divergences and final status.

DXY resistance maps to pair support; DXY support maps to pair resistance; LSZ direction inverts. The **prices never convert arithmetically** (`:3336-3360`). P3/P8 option-strike conversion is an E1 input to the **DXY** map; it is not a licence to convert DXY zones into pair prices.

### 7.1 Layer 2 requirements

For each pair and translated zone:

- two independent spot sources agreeing within five pips;
- TradingView 200-day MA;
- at least three institutional S/R levels from at least two independent sources;
- MA signal consensus;
- prior-week H/L/C from the pair's own bars;
- pair options data where available, otherwise the named no-data status;
- translated zone within 100 pips of a verified pair structural level.

The statuses are VERIFIED HIGH (7/7), VERIFIED MODERATE (5–6/7), PARTIALLY VERIFIED (3–4/7), UNVERIFIED (<3/7), with the treatment specified at `:3466-3485`. Zone edge roles ultimately follow the pair's own data where it conflicts with the DXY implication (`:3647`). Every translated zone carries the audit fields at `:3660-3683`.

Yahoo/yfinance references in this canon section are superseded by R-23: all OHLC and bar-derived pair data come from TradingView.

---

## 8. THE E1 CARD: CONTRACT BETWEEN COMPUTATION AND RENDERING

### 8.1 Versioned immutable object

Each card has `schema_version`, `asset`, `week_monday`, `window`, `source_manifest`, `pillars`, `zones`, `translation`, `missing_data`, `judgements`, and `render_policy`. The Durable Object seals it once. Its SHA is embedded in the generated Pine and displayed in its audit table.

### 8.2 Evidence record

Every external value retains:

```json
{
  "source_id": "investinglive",
  "source_url": "https://investinglive.com/orders/...",
  "retrieved_at": "...",
  "published_at": "...",
  "raw_r2_key": "e1/DXY/2026-07-06/investinglive/....png",
  "content_sha256": "...",
  "extractor": "clairic-protocol-a",
  "extractor_version": "...",
  "span": "...",
  "confidence": null,
  "cutoff_status": "BEFORE_CUTOFF"
}
```

A model cannot manufacture an evidence record. A missing value has a named missing-data record instead.

### 8.3 Level and zone records

A level carries `id`, `pillar`, `kind`, `price`, `source_evidence_ids`, `timeframe`, `formed_at`, `scores`, `legacy_bonus`, `structural_bonus`, `verification` and `notes`.

A zone carries at minimum:

- `id`, `top`, `bottom`, `mid`, `role`, `name`, `timeframe`;
- constituent `level_ids` and independent `pillar_ids`;
- six dimension scores, structural-extreme bonus, total score and pressure degree;
- POI tier, strength-based ZFP and optional measured-move target;
- BoM/MoM, mitigation count, reaction count and their source bars;
- sweep status, ladder-step status, entry/TP classification where E1 requires it;
- LSZ type/priority/extension/source dates where applicable;
- intra-zone precision levels and core/spike fields where applicable;
- synthesis visibility and the reason for any exclusion;
- pair translation audit and Layer 2 verdict when on EUR/USD or GBP/USD.

The card is self-describing: the chart does not infer BoM/MoM, ZFP or POI tier from colours or widths.

### 8.4 Refusal and incomplete data

No card is labelled COMPLETE unless the required protocol evidence and validations are present. If a source is missing, the card says what is missing and the impact. It does not silently turn the missing source into a neutral score. A run that cannot establish required arithmetic or provenance returns `E1_CARD_INVALID` and no renderable card.

---

## 9. RENDERING: EVERY E1 FAMILY ON TOP OF V1

### 9.1 The layering law

The new composition draws **v1 first**, then E1. v1's LuxAlgo S/D and liquidity bands remain available. E1's renderer never mutates v1 arrays or changes v1 zone meaning.

The E1 payload is generated from the card. Pine contains final verified pair-specific prices, timestamps, labels and classifications. It contains no DXY formula, no reverse pair conversion, no web access and no agent decision loop.

### 9.2 Render coverage matrix

| E1 object | Chart representation | Data/inspection representation |
|---|---|---|
| IP resistance | RED pressure-ladder box, 30% fill, solid border | name, degree, strength-based ZFP, score, provenance |
| IP equilibrium | **#FF9800** orange pressure-ladder box | same complete receipt |
| IP support | TEAL pressure-ladder box | same complete receipt |
| LSZ | GREEN boxes; ACTIVE brighter/thicker | source swing/date, side, priority, BoM overlap and extension |
| Option strikes | AMBER lines; width 2 for ≥$1.5B, width 1 otherwise | strike, notional, source date/time, tier and expiry status |
| Canonical S/D | v1 LuxAlgo S/D **plus** canonical 4H/D1 zones not represented by v1 | origin candle date, BoM/MoM, mitigation and exact edges |
| POI tier/confluence | visible label/audit table | all six dimensions and structural bonus |
| BoM/MoM | S/D label and audit row | origin evidence and directional leg |
| Reaction/mitigation | audit row and optional compact label | counted events with bar/time references |
| Intra-zone levels | fine time-anchored lines within the parent zone | type and source (1H, fib, close, round) |
| Core/spike | distinct core/spike boundaries or audit rows | body-core versus wick-LSZ role |
| Regime/measured move | E1 audit table | regime, ZFP receipt and target when ZFP >45% |
| Missing data | visible named status, never a blank silent layer | protocol, reason, impact |
| Card/run identity | audit table | asset, Monday, window, card SHA, schema version |

This matrix is an implementation requirement. "Full E1" is false if any canonical family is merely computed and then omitted from the chart or its inspectable map.

### 9.3 The Part X S/D conflict and its resolution

Part X says S/D zones are not auto-mapped (`Trident_System_Prompt_v5.3.3_DOWNLOAD_ME.md:3714`, `:3919`). R-30 later orders the **entire E1** on top of a baseline that already draws LuxAlgo S/D.

The design therefore separates two render paths:

- **Part X auto-generated E1 layers:** IP, LSZ and option strikes follow Part X's drawing rules.
- **R-30 operator-authorized composition:** the v1 S/D layer is retained and the canonical P5 4H/D1 zones are additionally rendered with their BoM/MoM and mitigation evidence.

This is the narrow, explicit resolution: **do not violate Part X's E1 render template; satisfy the later operator order by adding the separate canonical S/D overlay.** It does not delete S/D, hide it, or pretend LuxAlgo's approximation is the complete canonical scan.

### 9.4 Drawing contract

- `xloc=xloc.bar_time` for E1 boxes, lines and labels.
- IP fill `color.new(base, 70)`, borders fully opaque.
- IP label: `"{ZoneName} | {PressureDegree} | {strength-based ZFP}% ZFP"`; full degree names.
- LSZ uses green boxes with no default text clutter; details remain inspectable.
- Option strike label at the interval midpoint.
- IP zones sorted top-to-bottom; independent blocks per asset.
- E1 drawing budgets declared explicitly; card validation counts required primitives before composition. A declared count is not proof the host runtime accepts it; the first Pinebox run measures actual capacity and refuses overflow by name.
- `var` arrays for generated data; separate asset blocks rather than ternary array selection.
- Price format: DXY `#.##`; EUR/USD and GBP/USD `#.####`.
- Unknown ticker: `E1_ASSET_UNSUPPORTED`, not a DXY render.
- Missing/invalid card: `E1_CARD_INVALID` with reason; v1 still renders, but no substitute E1 zones appear.

### 9.5 S/D correction work

The existing LuxAlgo order-block list is bounded and can delete zones on mitigation. That is a candidate explanation for missing zones, not a measured diagnosis.

The correction sequence is:

1. Compare v1's S/D objects with canonical P5's exact origin-candle zones on the golden week.
2. Identify missing, wrongly edged and wrongly classified zones separately.
3. Preserve the v1 visual language while adding every canonical zone required by P5.
4. Do not "fix" the problem by drawing every historical LuxAlgo block forever.
5. Re-render and inspect overlap, labels and candle readability after each change.

---

## 10. THE BUILD ORDER: E1 FIRST, E2/E3 LATER

E3 remains governed by `Original_Canon_Data/TRIDENT_v5.3.3_CORRECTED_E3_ENGINE.md`, not by the archived Python engine. It does not enter the implementation until E1 and E2 are accepted.

E2 is also outside this build's first acceptance gate. The new v5 composition must not inherit the existing v2 E2 path merely because the source file exists. Its table has no fabricated chain, alternative or trade rows.

The E1 pipeline can emit the fields E2 will need later—zone reactions, ZFP, role, ladder steps—without drawing an E2 path now.

---

## 11. THE ONLY ACCEPTANCE LOOP

### 11.1 Golden week

1. Start the required local browser and tunnel services.
2. Select **DXY**, the golden week **July 6–10**, in Pinebox.
3. Run the complete Cloudflare acquisition and E1 computation for that week with its real information cutoff.
4. Generate and load the v5 composition in Pinebox.
5. Open the actual chart capture.
6. Compare the complete E1 map against the operator's oracle: all IP/LSZ/S/D/options and classifications.
7. **True at 95%+ or false.**
8. If false, score with **Clef/Jev**, name the incorrect family and mechanism, repair it and repeat the exact same chart scenario.
9. A corrected family cannot regress a previously accepted v1 or E1 family.

### 11.2 Generalisation

After the golden week:

- 15 random trading weeks since **2025-01-20**;
- DXY, EUR/USD and GBP/USD;
- uniform **95%+** acceptance;
- no hardcoded week prices, week-specific labels, zone literals or golden-week code branches.

The fixture `fixtures/bars/2026-07-06.json` currently contains **382 1H DXY bars** from timestamp `1782086400000` through `1783987200000`. It is a finite fixture, not the complete 90/180-day E1 input and not proof of generalisation.

### 11.3 What is not acceptance

- a Worker health check;
- a successful options page fetch;
- a card with arbitrary levels;
- a six-zone screenshot;
- a passing parser or unit battery;
- a model's assertion that the chart looks right;
- a source-only review.

---

## 12. IMPLEMENTATION WORKSTREAMS

### W0 — Freeze identity and the input contract

Define asset/week/window, card schema version, evidence timestamps, cutoff checks and immutable run identity. Establish the exact baseline input SHA and new output path.

### W1 — Cloudflare acquisition

Implement the Worker, Durable Object, pi-durable code tasks, R2/D1 records, TradingView bars, the remaining source executors, plutus-browser production binding and supervised local service startup.

### W2 — Extraction and reconciliation

Implement source schemas, Clairic Protocol A three-pass image reading, analyst-level extraction with source spans, reconciliation and missing-data records. Models cannot enter the orchestration path.

### W3 — Nine-pillar engine

Implement P1–P9 with formulas and verification. P1 runs all required weekly/daily/historical pivot sets. P5 includes its full structural and liquidity scans. P3/P8 retain current-rate audit trails. P9 uses strength only.

### W4 — E1 assembly and translation

Implement zone assembly, scoring, classifications, reactions, intra-zone levels, ZFP and measured move. Then DXY-first pair translation with Layer 2 verification and full audit trails.

### W5 — Card and full renderer

Seal the immutable card. Build the new v5 composition from the exact baseline. Implement IP, LSZ, options, canonical S/D and all required inspection layers. Remove the old five/six-zone and width-ZFP constraints from this new path.

### W6 — Pinebox acceptance and repair

Run the golden-week visual loop, repair by measured defect family, then the random-week/three-asset matrix. The loop ends only on uniform chart acceptance or a named hard block.

### W7 — Package the working system

After chart acceptance, update the ship record and package the **actual deployed Worker artifacts, source inputs, baseline hash, E1 composition and acceptance evidence**. Do not package a design as a working indicator.

---

## 13. FAILURE MODES THE DESIGN MUST PREVENT

| Failure | Mechanism prevented |
|---|---|
| A handful of chart bands is called "full E1" | nine-pillar run manifest + full card + render coverage matrix |
| v1 liquidity is mistaken for the canonical map | separate E1 computation and renderer; v1 arrays untouched |
| Only six strongest zones survive | full-output and synthesis views; no positional five-slot ladder |
| DXY arithmetic creates pair prices | pair-specific acquisition and Part IX audit trail |
| Future week data changes the forecast | publication/cutoff checks on every evidence record |
| Options page text substitutes for the required image | embedded-image evidence + three-pass reconciliation |
| Model prose becomes a zone | typed evidence spans, code-owned calculations and immutable raw bytes |
| Width becomes ZFP | strength/type-based ZFP and modifiers only |
| Missing source silently becomes a valid score | named missing-data records and impact classification |
| Part X hides S/D | separate operator-authorized canonical S/D overlay |
| Pine is edited by hand for a week | generated card-specific arrays and timestamps |
| A passing local test is called indicator acceptance | Pinebox chart observation and Clef/Jev scoring |
| Old E2/E3 leaks into E1 delivery | v5 E1 composition has no inherited E2/E3 computation or path |
| Browser tool exists but harvest fails | production service supervision and full image-chain test |

---

## 14. CURRENT EVIDENCE AND HONEST REMAINDER

### 14.1 Proven

- The named v1 baseline exists at the measured hash above and its modular generator is understood.
- The complete E1 canon ranges governing this design were read first-hand, including Parts II–V, IX and X and Appendices A–C/E.
- plutus-browser is installed as a separate host tool; its installed files match the 22-file ship package and the package audit is PASS.
- The local headed browser read real investinglive data and produced an opened chart/page capture.
- Worker→VPC→named tunnel→local browser `/health` was 200 and unauthenticated `/status` was 401.
- The current partial E1 implementation's limits have been inspected: fixed/limited zones, chart-derived approximations, Yahoo references and width-derived ZFP remain in legacy paths and are not adopted.

### 14.2 Not built or not proven

- No v5 design document existed before this file.
- No Cloudflare Worker/DO/pi-durable E1 pipeline is deployed.
- TradingView bars in Cloudflare are not implemented.
- The full nineteen-source acquisition matrix is not implemented.
- The Protocol A embedded-image→three-pass→R2 chain is not implemented.
- The complete nine-pillar E1 card and canonical S/D overlay are not implemented.
- `plutus_browser` has not been invoked through a new OMP tool session.
- The tunnel is not reboot-persistent and instance 20 is not currently running.
- No 95% E1 chart result exists. No generalisation claim exists.

---

## 15. REVIEW POINTS FOR THE OPERATOR

These are explicit design consequences, not requests to reduce scope:

1. **Baseline:** v5 starts from the named 1,179-line checkpoint and never edits the 1,270-line H1 seal.
2. **Full E1:** the old five/six-zone output is rejected as the v5 target. Full protocol output and MODERATE+ synthesis coexist.
3. **S/D:** the later full-E1 order is implemented as a separate canonical S/D overlay while Part X's IP/LSZ/options render rules are preserved.
4. **Cloudflare:** pi-durable code Tasks inside a Durable Object, not the archived Cloudflare Workflow plan and not a host bar uploader.
5. **Week:** Pinebox's selected asset/week is the run identity; future candles are only test evidence.
6. **Models:** Clairic reads, Clef/Jev judges, code decides and executes.
7. **Delivery:** E1 is built and visually accepted before E2/E3 work begins.

---

## 16. AUTHORITY INDEX

| Subject | Source |
|---|---|
| Engine 1 purpose | `Original_Canon_Data/Trident_System_Prompt_v5.3.3_DOWNLOAD_ME.md:347-350` |
| E1 foundations and classifications | same file `:468-504`, `:1145-1161` |
| 19-source acquisition | same file `:739-800` |
| Protocol A image extraction | same file `:808-867` |
| Nine pillars and DXY conversion | same file `:923-1459` |
| Scoring and zone assembly | same file `:1465-1503` |
| Full versus synthesis output | same file `:1627-1646` |
| Pair translation and Layer 2 | same file `:3257-3683` |
| Pine rendering | same file `:3688-4004` |
| ZFP and pivot checks | same file `:4052-4107` |
| Baseline identity and generator | `Checkpoints/v1-ship-approved-working-baseline/dist/plutus-vision-v1.pine`; `scripts/lqz_vision_build.py:1-90` |
| Existing partial renderer | `plutus-vision-lqz/e1-render.pine:1-314`; `pine-ide/ide/renderer/plutus-vision-v2.pine:1300-1415` |
| Existing partial engine | `scripts/e1_extract.py:1-183`, `:1047-1243`; `scripts/e1_zfp.py:1-138` |
| Operator rulings | `MASTER_CONTEXT/OPERATOR_RULINGS_PV.md` R-12 through R-32 |
| Browser and tunnel proof | `SHIP_PACKAGES/plutus-browser/docs/TESTING_LOG.md:111-139` |
| Week window carried forward | `design/DESIGN_BLUEPRINT_v4.1_CLOUDFLARE.md:328-339` |

**End of v5.0 design for review. The next artifact is execution only after the operator reviews this design.**
