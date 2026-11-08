# M1 BINDING SPEC BUNDLE — VERBATIM AUTHORITY, IN PRECEDENCE ORDER

Generated: 2026-11-08T15:29:17.193081+00:00

**This file adds no design. It concatenates live authority documents verbatim.**

**Precedence:** operator rulings → v5 blueprint → v5 workflow → M1 execution contract → gate policy. If any copied body disagrees with the live file, the live file wins; re-copy it rather than interpreting this bundle.


# BEGIN VERBATIM 1 OPERATOR RULINGS: OPERATOR_RULINGS_PV.md

# OPERATOR RULINGS — PLUTUS_VISION
<!--
  The operator's own directives, verbatim, recovered from the build session transcript
  and given a citable home so no card has to cite a derived spec. Every line below is
  HIS wording. Where a line number is given it is the transcript line.
-->

## R-01 · The no-PDF architecture (2026-10-21, l.1013)
> "the current process we have is a manual three-step process. Step one, I feed the prompt to the agent... Step two, the agent generates the PDF report... Step three, the agent converts the verified reports data to Pine Scripts and puts that in the indicator."
> "the explicit fucking requirement for this build is that this PDF report as a step is removed. And this is done entirely by code in real time."
> "the prompt that generated the report itself needs to be translated into code that can run in a sidecar so that the indicator can automatically render this dynamically and does not need the manual compile the report and then copy paste the data step."

## R-02 · The sidecar contract (l.4190)
> "the output contract should probably be one JSON per week. That's cleanest. We want to keep everything batch, parallel, async where possible. As few steps in the loop as possible."
> "Assume total black hat mentality... anti-fragile, deterministic, as few fucking steps as possible, so that this just works like a fucking browser. You just click it, it just opens, it just works."
> "the sidecar agent is vision capable that's what the sidecar is for."
> "assume that you're building everything from scratch do not port anything in"

## R-03 · E2 is two phases (l.3618)
> "Phase 0 = current reality. Phase 1 = E1 zone model from original Canon E1 (face A). Phase 2 = supply/demand/liquidity added on top of IP zones (face B). Phase 3 = E2 phase one: the BOXES. Phase 4 = E2 face B: the LINE."
> "the chain leads and the shapes follow"

## R-04 · The engine decomposition (l.3607)
> "Engine one is the supply, demand, liquidity, and the institutional pressure zones. Engine 2 covers the shape chain, which is calculated from engine 1 data. Engine 3 is the actual trade setups."
> "If you do engine 1 correctly, engine 2 is obvious. If you compute engine 2 correctly, engine 3 is obvious."

## R-05 · Canon-only vocabulary (2026-10-21)
> "what is CHoCH that is not canon to my strategy. do not loop in any random terms that are 'market standard' but not part of my strategy. keep everything specific to MY actual data that is in all of these docs"

## R-06 · The graph's purpose (2026-10-21)
> "for the next 7,000 fucking sessions, I can just say go read the graph and within less than a single minute every single agent has full fucking context immediately permanently compaction proof idiot proof derailment proof"

## R-07 · The trade-count reality + the confidence gate (2026-10-22)
> "This is correct. The way that this is written is 100% correct. There are only on any given trading week a maximum of eight trades per pair that can be traded on the one hour time frame. Period. Like there are only one to two real moves per day on any given pair. Period."
> "maximum 10 per week anywhere from six to ten per week one to three per day usually one to two per day"
> "this immediately rejects all of the fabricated bullshit garbage fucking trade setups because without this agents hallucinate that there's 27 fucking trades on a single day which is absolute garbage filth trash"
> "the only thing that we change is the rrr floor on standard is increased from 1.5 to 2 and the rr on high is increased from 2 to 2.5"
> "65 the inclusion gate? Yes, 100%. I don't want anything that is less than high confidence."
> "I don't want any conditional fucking garbage... God tier and high is the new normal. Everything else is rejected. I don't even want to see it on my chart."

## R-08 · The target state (2026-10-22)
> "I want this thing to be so good that I can wake up... I just open my fucking computer with my eyes half closed. I look at the indicator, I see what the trade centers for the day are, I just blindly yeet 50 million fucking dollars into the trade, forget about it... Your job is to fucking code this in such a way where that is not only possible, but that's fucking normal."

## R-09 · The annotation grammar — position boxes vs zones (2026-10-22)
> "The red boxes is the stop loss zone. The green boxes is the entry to the take profit zone. This is literally what the trade setup tools look like when you draw them on TradingView using the actual long and short position tools. This is different from the full screen horizontal rectangles that go from the left to the right side of the screen. Those are zones. There's a big difference. You need to be able to tell the fucking difference."
> "The entry is on the intersection between the red and the green box. So from the entry down to the bottom is the stop loss threshold and from the entry up to the top is the take profit threshold... the far edge of the green box is the take profit, the far edge of the red box is the stop loss, and the intersection point between the two boxes is the entry."
> "the analysis was done on the one hour with some minor refinements on the 30 minute, the 15 minute was just for execution. But that's for me as a human... You as an AI do not need to do this because it's all computable from data so keep the one hour as the authoritative source"

## R-10 · Rockets are not trades (2026-10-22)
> "These are explicitly marking rockets for Fibonacci rockets and liquidity rockets. These are not normal trades. You need to ignore these. You need to look at the actual trade setup boxes with the actual drawing tools like I said."

## R-11 · The trade inventory already exists (2026-10-22)
> "Here is the full analysis that GLM 5.1 did with an external VLM five months ago on the exact same trades I just told you to look at. Get all of the fucking data correctly right now."

## R-12 · The build is operator-driven, turn by turn, on Pinebox (2026-11-06)
> "we're gonna build the indicator on Pine Box directly. Like you're gonna open Pine Box on my physical display. I'm gonna look at it, and we are going to base everything off of /skill:vision-in-the-loop By directly looking at the fucking rendered pixels inside of the Pine IDE and we're gonna go turn by turn. We're gonna go piece by piece. We are not going to attempt to build the whole fucking thing in one shot."
> "You're not allowed to do anything autonomously. You're not allowed to make any decisions autonomously."
> "You do not get to make decisions autonomously. I am the one driving the fucking build. You are the executor and you are gonna function as an obedient co-pilot that does exactly what I fucking say and nothing else. Period"

## R-13 · The only test is Pinebox + the chart (2026-11-06)
> "Yes, no code review, no unit test."
> "you can use bash for normal build work - all TESTING is only allowed to be doen through pinebox. any "test" that is not **literally** "run the code through pinebox and look at the chart" is explicitly forbidden"
> "A) render your code on the chart / B ) look at the chart / C) is it perfect. yes or no. look at the cnadles. do they react to your render with neo-in-the-matrix level precision. yes or no. boolean true/false. if false - score w/ clef/jev how accurate it is."
> "pinebox is your TESTING ENVIRONMENT. ANY "tests" THAT ARE NOT LITERALLY RUN IN PINEBOX FOLLOWING THE EXACT A,B,C PROCESS I LAID OUT ABOVE IN POINT #2 IS FUCKING REJECTED AND EXPLICITLY FORBIDDEN."

## R-14 · E1 is the v5.3.3 prompt, every token (2026-11-06)
> "/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION/Original_Canon_Data/Trident_System_Prompt_v5.3.3_DOWNLOAD_ME.md this LITERALLY EXPLAINS EVERYTHING ABOUT ENGINE 1 VERBATIM IN THE MOST CLEAR EXPLICITY POSSIBLE WAY THESE ARE THE EXACT FUCKING ISNTRUCTIONS WE ARE TRANSLATING INTO CODE FOR E1. NOTHING IS ALLOWED TO BE CHANGED OR EDITED OR WATERED DOWN OR ELFT OFF. EVERY SINGLE FUCKING TOKEN OF E1 IN THIS PROMPT - FOLLOW THESE EXACT INSTRUCTIONS. CONVERT THIS TO CODE."

## R-15 · Acceptance: the golden week, then 15 random weeks, uniform 95%+ (2026-11-06)
> "First we're gonna completely nail engine one and get it fully mastered, tested, validated, 95% plus accurate. across 15 different random weeks, five on three different assets."
> "measured against the actual fucking price action on the chart. literally render your shit on the pine IDE and look at the chart. is the actual price action 95% accurate to your predictions and render like the Jul 6-10 golden week examples?"
> "ANY random 15 fucking weeks from the moment Trump's 2nd term as US president began it does not fucking matter AT ALL. first we validate the golden week of Jul 6-10 since we a visual oracle to judge against already. once that SUCCEEDS at 95%+ accuracy then any random 15 weeks. if we do not have the SAME 95%+ ACCURACY UNIFORM ACROSS 15 RANDOM FUCKING WEEKS - YOU CODED IT WRONG. NO HARDCODED FIXED CONST BULLSHIT."
> "THE ENGINES AND CALCULATIONS NEED TO BE STRUCTURED ON THE MACRO PRINCIPLES SO THAT ONCE WE HIT THE TARGET ON THE GOLDEN WEEK IT WILL WORK UNIVERSALLY EBCAUSE EVERY SINGLE WEEK AND ASSET FOLLOWS THE EXACT SAME PRINCIPLES. YOU ARE NTO AHRDCODING SOME VISUAL SLOP BULLSHIT. YOU ARE BUILDING A PREDICTION ENGINE THAT CAN ACCURATELY FOLLOW THE E1/E2/E3 STRUCTURE. I HAVE PERSONALLY TESTED THIS THE STRATEGY WORKS UNIVERSALLY ON EVEYR ASSET, EVERY TIMEFRAME. THERE IS NO FLAW IN THE STRATEGY. IT WORKS EXACTLY THE WAY I SAID. THE ISSUE IS **ALWAYS** YOUR SHITTY CODE."

## R-16 · E3 authority = the corrected E3 prompt; v8 archived (2026-11-06)
> "the AUTHORITY is /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION/Original_Canon_Data/TRIDENT_v5.3.3_CORRECTED_E3_ENGINE.md which does not yet exist as code and is not to even eb touched until E1/E2 are WORKING. fix this in the graph. june era shit slop python code is archived and for historical reference only"
(Graph: cards/E3-AUTHORITY-RULING.md. Iron Law 2 is SUPERSEDED.)

## R-17 · ZFP is strength only; width ZFP is deleted (2026-11-06)
> "ANYTHIN THAT CALCULATES ZFP BASED ON FUCKING PIXEL WIDTH NEEDS TO BE PERMANENTLY FUCKING DELETED THIS IS THEATRICAL BULLSHIT. ZFP = ZONE FAILURE PROBABILITY WHAT DO YOU THINK THAT MEANS OBVIOUSLY ON STRENGTH AND NOTHING ELSE."
(Restates the 2026-10-22 ruling in cards/E1-ZFP-DUAL-DEFINITION-RULING.md.)

## R-18 · The deliverable and the phase order (2026-11-06)
> "a working fuckign indicator with a functioning E1 that renders the actual S/D/L + IP zones for any trading week it is pointed at with 95%+ accuracy. then we build on top of that foundation to incorporate E2 at the same quality + precision level follow the same process that successfully calibrated E1. then the same with E3 once E2 passes the tests."
> "Once engine one is working then we're going to Move to engine two. We're gonna repeat the exact same building and testing process on engine two that we had validated on engine one that got engine one production grade. Same exact process."

## R-19 · The harvest is all of Part III; the sidecar runs on pi-durable inside Cloudflare (2026-11-06)
> "half the data comes from the web sources lsited in the 5.3.3 promtp thats the entire fucking reason we are building a sidecar agent on pi durable."
> "so then all this needs to be added in obviously last agent watered it down against explicit instructions"
> "the sidecar agent is harnessed on pi durable according to the concept and frameworks of /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/agent_plugin_boilerplates/aether_agent_backend_v2 and runs IN CLOUDFLARE as a cloudflare durable object + worker runtime so that it is always on 24/7 and doesnt need my physical device active to function. we need to get clear on this. browser run is just the cloudflare broser runtime"

## R-20 · The tools are done; the Plutus build is unlocked (2026-11-06)
> "This was locked until the tools were done. The tools are now done."
> "750 megabytes is accepted."
> "The Pine Box build is already completed and it's deployed on host and you can use the tool right now."

## R-21 · Mechanical workflows, never an agent loop (2026-11-06)
> "yes option A ~ fuck an agent loop. we need MECHANICAL WORKFLOWS with specific model-enabled STEPS in the workflow lets start designing this like a zapier tree not a fucking agent loop. fuck agent loops."
(Option A = pi-durable runs code tasks inside the Durable Object; models appear only as named steps — Clairic reads, Clef judges. No model chooses a step, a page, or a tool.)

## R-22 · Cloudflare replaces the physical device (2026-11-06)
> "yes 100% cloudlfare is officialy replacing my physical device i should eb able to run this from a fuckign arduino if i so choose. EVERYTHING runs on cloudlfare now unless it physically cannot for a tangible reason and then we use the local device only for that specific step."

## R-23 · Bars come from TradingView via tvdatafeed, not yfinance (2026-11-06)
> "where the fuck is yfinance coming from? what is this? explain. should be tvdatafeed."
(Matches PLUTUS_ARCHITECTURE_BIBLE_v2.1.md:1173-1175 "NEVER use Yahoo Finance. TradingView tvDatafeed ONLY." and Iron Law 9, :1384. Overrides the yfinance + Yahoo rows of the v5.3.3 prompt, :755-756 and :766.)

## R-24 · investinglive needs a headed browser (2026-11-06)
> "investing live obviously needs headed."
(Agrees with the v5.3.3 prompt :813: "investinglive.com blocks headless browsers with 403/CloudFront.")

## R-25 · The cf/ draft is archived; v5 is the authoritative design (2026-11-06)
> "sure archive it we are building authoritative v5 right now"
(cf/ moved to archive/cf-draft-2026-11-01/, reference only.)

## R-26 · The headed browser runs locally, on the Plutus dashboard's browser tab (2026-11-06)
> "ok run it locally then we can have the headed browser run localy. we already have a browser tab on plutus dashbaord built for exactly this."
> "either way we can use the plutus dashbaord browser tab on local device for all headed browser needs. i will have the pinebox agent add this as a 3rd tab to pinebox as well so its in the testing env"
> "i will be using the plutus-dashbaord as THE runtime env for all trading once this is production grade anyways"
(Container cost rule: a container only if < 5% of the month's included usage for daily use; measured memory share for a headed standard-1 run is 16% at 2 min/day, so local.)

## R-27 · plutus-browser is its own host tool, separate from Pinebox (2026-11-07)
> "can you package plutus browser as a standalone self contained tool like we have pinebox as a proper tool? then update the ship package for this and deploy it to host. we can keep these as 2 separate tools its easier that way."
(Done: CLI + actions.json + OMP extension + deploy.sh; commit 0fc9fd2, tag ship/plutus-browser-v2026.11.07-1; package SHIP_PACKAGES/plutus-browser.)

## R-28 · Tunnel routing: the simplest Cloudflare default, no steps for the operator (2026-11-07)
> "use whatever is simplest do the cloudflare default dont add any steps for me"

## R-29 · The v5 design is written for the operator to review (2026-11-07)
> "write it so i can review"

## R-30 · The entire E1 renders on the chart, layered ON TOP of the v1 working baseline (2026-11-07)
> "what the fuck do you mean we need to see THE ENTIRE FUCKIN E1 RENDERED ON THE CHART ~ you need to also integrate this ON TOP OF the foundation laid with /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION/Checkpoints/v1-ship-approved-working-baseline ~ this is a combination of LuxAlgo's liquidity + S/D indicators. the Liqudity zones are A+ and the S/D are A- need some minor improvement to catch ALL the relevant zones but this already solves 1 side of the coin so you just need to add the E1 canon from the prompt (2nd side of the coin) to be rendered ON TOP OF this. that way it can auto detect any trading week and render the ACCURATE zones for that specific tradying week. FULL E1 data no partial bullshit"
(The v1 seal plutus-vision-v1.pine, sha 0d20e831..., stays unedited (H1): E1 is added as a layer in a new file.)

## R-31 · Operator pace and scope on small jobs (2026-11-07)
> "what is taking so long" / "this should be a simple 2 minute taks"
(A packaging job is not a bug hunt on the runtime. Do what was ordered; do not add unrequested fixes.)

## R-32 · What subagents are for (2026-11-07)
> "subagents are for BUILDING and DEEP CONTEXT EXTRACTION OF THOUSANDS OF LINES OF RANDOM SCATTERED CONTEXT FROM THE FILEBASE. NOT 300 LINES OF DIRECT FIRST HAND CONTEXT YOU ARE FUCKING RESPONSIBLE FOR"
> "handle this yourself"
(A known file or range I am responsible for - the 5.3.3 prompt, a named checkpoint - is read first-hand by me. Subagents build, or hunt scattered context across the file base. Seven E1 extraction readers were killed on this ruling; their files in design/e1-extract/ are unused and not evidence.)

## R-33 · Pinebox Cloud is verified and its old open checklist is not a gate (2026-11-08)
> "everything works i ve verified it myself"
> "there are no remaining bugs"
> "treat open verification tasks as cosmetic or agentic perfectionism"
(Use the updated central SHIP_PACKAGES/pinebox Cloud substrate directly. Do not reopen its historical F-items or rerun its verification checklist before building PLUTUS VISION.)

# END VERBATIM 1 OPERATOR RULINGS

# BEGIN VERBATIM 2 V5 DESIGN BLUEPRINT: DESIGN_BLUEPRINT_v5.0_CLOUDFLARE.md

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

# END VERBATIM 2 V5 DESIGN BLUEPRINT

# BEGIN VERBATIM 3 V5 BUILD WORKFLOW: BUILD_WORKFLOW_v5.0_CLOUDFLARE.md

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

# END VERBATIM 3 V5 BUILD WORKFLOW

# BEGIN VERBATIM 4 M1 EXECUTION CONTRACT: EXECUTION_CONTRACT.md

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

# END VERBATIM 4 M1 EXECUTION CONTRACT

# BEGIN VERBATIM 5 GATE POLICY: policy.json

{
  "schema": 1,
  "name": "PLUTUS VISION M1 git gate",
  "created_at": "2026-11-08T10:26:59.479562+00:00",
  "gate_parent": "9b061e08dad8551d1ad4fb17620f4850d2aa9e83",
  "branch": "step_agent",
  "milestone": "M1_GOLDEN_WEEK",
  "enforce_stop_after_m1": true,
  "model": {
    "provider": "opencode-go",
    "endpoint": "http://127.0.0.1:4097/zen/go/v1/responses",
    "key_command": "$HOME/.omp/agent/bin/go-key.sh",
    "model": "mimo-v2.6-flash",
    "min_score": 7,
    "timeout_seconds": 120,
    "vision_control": "gates/controls/mimo-vision-control.json"
  },
  "grader_context": [
    "design/DESIGN_BLUEPRINT_v5.0_CLOUDFLARE.md",
    "design/BUILD_WORKFLOW_v5.0_CLOUDFLARE.md",
    "m1/EXECUTION_CONTRACT.md"
  ],
  "m1": {
    "asset": "DXY",
    "week": "2026-07-06",
    "tf": [
      "1H",
      "4H"
    ],
    "card_prefix": "m1/out/",
    "composition_prefix": "m1/out/"
  },
  "limits": {
    "max_work_commits_between_checkpoints": 2,
    "max_changed_files_work_commit": 80,
    "max_model_prompt_chars": 220000,
    "max_diff_chars": 100000
  },
  "protected_paths": [
    "archive/",
    "Checkpoints/v1-ship-approved-working-baseline/",
    "Original_Canon_Data/",
    "MASTER_CONTEXT/OPERATOR_RULINGS_PV.md",
    "design/",
    ".githooks/",
    "gates/policy.json"
  ],
  "allowed_work_prefixes": [
    "m1/",
    "gates/controls/"
  ],
  "forbidden_m1_path_patterns": [
    "(^|/)e2(/|$)",
    "(^|/)e3(/|$)",
    "(^|_)engine[-_]?2($|/)",
    "(^|_)engine[-_]?3($|/)",
    "random[-_]?weeks?/",
    "validation[-_]?weeks?/"
  ],
  "forbidden_m1_expansion_assets": [
    "EURUSD",
    "GBPUSD",
    "AUDUSD"
  ],
  "required_visual_families": [
    "IP resistance zones",
    "IP equilibrium zone",
    "IP support zones",
    "Liquidity Sweep Zones",
    "canonical 4H/D1 supply/demand zones beyond the v1 baseline",
    "option-strike targets",
    "POI tier and pressure-degree data",
    "strength-based ZFP data",
    "BoM/MoM classification",
    "mitigation and reaction counts",
    "intra-zone precision levels",
    "core/spike boundaries where applicable",
    "card/run identity and missing-data status"
  ],
  "checkpoint": {
    "min_png_bytes": 20000,
    "m1_complete_min_images": 2,
    "allowed_statuses": [
      "MATCHED",
      "WRONG",
      "MISSING",
      "EXTRA",
      "UNOBSERVABLE"
    ],
    "required_completion_status": "MATCHED"
  },
  "tokens": {
    "admin_sha256": "732f6423962cb7e4adb4c1932abd533b6a436f4c3b04c2210f67fcc35d690b7a",
    "operator_unlock_sha256": "3a27dd41726368229c816f89e48320279e518a77e31fc5c98399f68640e4712b"
  },
  "failure_mode": "FAIL_CLOSED"
}

# END VERBATIM 5 GATE POLICY
