# PLUTUS V5 — BUILD PACKAGE SYNTHESIS (FULL-CONTEXT, VERIFIED)

**Artifact class:** ARCHITECTURE / CONTEXT PACKAGE (the V5 full-context synthesis)
**Generated:** 2026-09-28 · **Method:** an 18-desk context-extraction wave (6 V5 + 6 V6 + 6 supplement) + primary first-hand reads
**Real tree:** `/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS/LIVE/agent`
**Authority order:** the live tree wins; this doc follows within the session. Doctrine is QUOTED, never synthesized (D13/R19).
**Quote convention:** profanity-bearing verbatim quotes are elided as `[…]` with their source anchor preserved — read the anchor for the exact words.

---

## §0 THE STATE BANNER (verified by tool result THIS session, not inherited)

| Fact | Measured value | The command that produced it |
|---|---|---|
| Frozen pair `src/mdve/sl-lmv.ts` | `912940832fac44bc838d53423cbb921eff501de60a9f2641bf20c1d1497eaeab` | `sha256sum src/mdve/sl-lmv.ts` |
| Frozen pair `src/mdve/trade-dedup.ts` | `33914c897e7775402eefd7d13a5d3675667a2ace576b55a689bc864401a680e4` | `sha256sum src/mdve/trade-dedup.ts` |
| Frozen-pair verdict | **BYTE-IDENTICAL to spec** (zero drift) | the two sums vs §5B |
| JESL kernel battery | **2 pass / 0 fail / HELLO-GATE ALL GREEN** | `bun test src/jesl/` |
| Golden gate harness | PRESENT (`diag-reasoning-chain-golden.ts`, 51,439 B) | `ls -la` |
| Golden gate RUN | **BLOCKED — fixture ABSENT** (`/tmp/opencode/bars_raw.json` ENOENT) | `bun diag-reasoning-chain-golden.ts --day=2026-07-06` |
| Injector | `MASTER_CONTEXT/PLUTUS_MASTER_CONTEXT_INJECTOR.md` — 1,324 lines / 264,815 B, SHA `aeb9f31b…` | `sha256sum` (both copies identical) |
| Injector navigation manifest | `MASTER_CONTEXT/INJECTOR_NAVIGATION_MANIFEST.json` — 5,932 B, SHA `bc47cbd6…` | `sha256sum` |
| Live tree git | repo EXISTS, **ZERO commits** (`master` unborn) | `git log` |
| v5.0 baseline artifact | `0d383a15cd97a0abc929cebc05859bd0d218705587e3e6bd5971bc2758e98d5e` | V51_COMPARISON §9 |
| V5.1 gated artifact | `77bc8707f4ab2f80…` (post FIX-4b) / `429b5cc8a7c96f42…` (pre) | V51_COMPARISON §9 + MANIFEST |
| V5.1 suite | **528 pass / 0 fail** (container + host, matching) | MANIFEST |
| The newest checkpoint | `Checkpoints/v5.1-gates-wired-guard-fired-draft/` (2026-09-26) | `ls -la` |

**THE DRIFT LEDGER (recorded, not acted on):**
1. **PATH DRIFT:** the injector (§3 P3-1, §5A) states the workspace root as
   `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Trident_Agent/Active_Projects/Plutus_Agent`
   → **ABSENT on disk**. The REAL tree is `…/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS/LIVE/agent`.
   The top-level `PLUTUS/agent/` is a byte-identical stale copy (same injector SHA `aeb9f31b…`).
2. **STATE-DOC STALENESS:** `context_management/BUILD_STATE.md` and `NEXT_STEPS.md` head with the
   **v4.5.2-era SHAs (2026-08-04)** (`dist 9c0c21ee…` 1.29MB/145 modules, report `3b2e011d…`).
   `EVIDENCE_STATE.md` advances past that to the **2026-08-11 Monday-gold checkpoint**
   (gate 5/5 ≤3p, G1-G10 10/10, outcome 5/5 +17.84R, exit 0, determinism `0bbab1f7eb52e915`).
   The **newest artefact** is the 2026-09-26 `v5.1-gates-wired-guard-fired-draft` checkpoint.
3. **FIXTURE DRIFT:** `/tmp/opencode/bars_raw.json` is absent (tmp cleared) — the P3-3
   reconstruction case. The source CSVs live in the sibling agent fixtures (Vibe 4H + Air 1H).
4. **INJECTOR VERSION:** the injector's §6 reads v1.0→v3.1, dated 2026-09-05; the tree has
   advanced to V5.1 (2026-09-25/26). The injector is the *doctrine* anchor; the v5.1 package is
   the *build* anchor. Both are live; neither supersedes the other.

---

## §1 THE MISSION + THE TWO ERAS (never confuse them)

**THE ONE-SENTENCE LAW (verbatim, DECISION_CHAIN A1 / injector §1.2):**
> "E3 is a natural RESULT we ARRIVE AT from E1 + 2 being done properly. It becomes very [profane-adverb] obvious when E1 + E2 are done correctly it is really just a classification + precision alignment engine of the E1 + E2 data… 90% of the work is in E1 + E2." — `…/PLUTUS_E1_E2_E3_MACRO_CONTEXT.md:13`

**THE v5.1 MISSION (verbatim, `packages/plutus-v5.1/00-MISSION.md`):**
> "write a detailed spec to disk for Plutus V5.1. We're gonna go ahead and forward iterate this version… this version 5 is a clean baseline. Let's go ahead and fix everything that's wrong with it as a V5.1 so that we can have version history and direct comparison… create the build package for V 5.1 completely so that it's clean and there's no derailment field. We have literally everything explicitly [documented]." — `packages/plutus-v5.1/00-MISSION.md:8-15`

**THE TWO ERAS:**
| Era | What it is | Where | Status |
|---|---|---|---|
| **THE CANON PIPELINE** (v4.5.x lineage) | `report-v452.ts` (1,719L) + `src/brains/shape-brain.ts` (3,311L) + `src/mdve/*` (mirror, setup-gen, cascade-translation, refinement-machine, lmv, obcv, lqz-matrix, sl-lmv FROZEN, trade-dedup FROZEN) + `src/pipeline/*` + 42 `diag-*.ts` | `LIVE/agent/` | **THE GENERATIVE ENTRY** — 25+ checkpoints of proven machinery; the golden gate runs on real bars through THIS tree |
| **THE V5 TREE** | `src/e1` · `src/e2` · `src/card` · `src/kernel` · `src/substrate` · `src/runtime` · `src/graph` · `src/jesl` · `src/visual` · `src/aether` · `src/enforcement` (34 domains) | `LIVE/agent/src/` | **VERIFICATION-SIDE** — rebuilt machines, card assembler/loader, trade-computer, substrate L1-L6, the Effect kernel (SEPARATE from `src/jesl`), the graph client, the JESL test kernel. 646/0 container-tested (injector §1.9.3) |
| **V5.1** (the build) | the frozen v5.0 + the four doctrine gates + the E2-preference fix + the product-lane scorer + the null test + the week unblock | `packages/plutus-v5.1/` + `Checkpoints/v5.1-gates-wired-guard-fired-draft/` | **BUILT to DRAFT** (2026-09-26) — the 76.2% guard FIRED, the operator ruling pending |

**THE ONE-LINE THESIS (verbatim, `packages/plutus-v5.1/00-INDEX.md`):**
> "v5.0 is a better machine with no laws — V5.1 puts the laws back: four gates, one chain pool, one loud ATR, one product lane, one null test. The score may fall; the measurement becomes true. That is the whole build."

---

## §2 THE FROZEN CUSTODY (never changes)

```
sl-lmv.ts        912940832fac44bc838d53423cbb921eff501de60a9f2641bf20c1d1497eaeab
trade-dedup.ts   33914c897e7775402eefd7d13a5d3675667a2ace576b55a689bc864401a680e4
prediction-2026-07-06.json   0d383a15cd97a0abc929cebc05859bd0d218705587e3e6bd5971bc2758e98d5e
```
These three are byte-identical through EVERY wave and EVERY checkpoint (the canon-lineage
`v4.5.1_LIVE_MARKET_CAPABLE` → … → `v4.5.4_MONDAY_GOLD_STANDARD_ACHIEVED` → `v5.1-gates-wired…`).
**A drift on either `.ts` file is a CRITICAL STOP for all work** (injector §1.11 #7).

**THE LOCKED IMMUTABLES (never touched, never "fixed"):**
`Checkpoints/monday-gold-standard-achieved/` · `Checkpoints/v4.5.1_LIVE_MARKET_CAPABLE/` ·
`Checkpoints/v4.5.2_OVERHAULED_BASELINE/` (MANIFEST `147598aa`). The Checkpoint-glob test
errors (`Checkpoints/*/src/*.test.ts` importing `./temporal.js`) are UNTOUCHABLE pre-existing noise.

---

## §3 THE ARCHITECTURE (E1 → E2 → E3 → REPORT — strict linear, no override)

**THE LINEAR LAW (verbatim, `…/PLUTUS_E1_E2_E3_MACRO_CONTEXT.md:19-21`):**
> "Previous engine data PROVIDES THE STRUCTURE FOR the next one. Next engine's data MUST FIT WITHIN THE CONSTRAINTS of the previous engine's data archtiecture this is absolutely non negotiable" + "E3 is not permitted to override pre-existing E1/E2 data architecture nor is it allowed to [just] randomly fabricate its own rules and make [things] up."

**THE SUBSYSTEM CHAIN (as built — anchors):**
| Stage | Module | Anchor | Produces |
|---|---|---|---|
| E1 zones | V5: `src/e1/core` + `src/e1/machines` · canon: 9-pillar-lobe + ob-engine + lmv + obcv + lqz-matrix | `src/e1/core/types.ts:38` | `ZoneMapSnapshot` (zones, rungs, lexiconVerdicts, pressureStates) |
| E2 machines | V5: `src/e2/machines` (6, W3 GREEN 138/0) · canon: `buildE2Core` `report-v452.ts:1050-1225` | `src/e2/machines/shape-chain-machine.ts:168` | designations (ZONE-IDS-ONLY), chains, cascade records |
| E3 anchors | V5: `src/kernel/trade-computer.ts` · canon: `mirror.ts` `cascadeV45`/`reAnchorMirror`/`computeLmvTP` | `src/kernel/trade-computer.ts` | `TradeProjection[]` (E/SL/TP/RRR, full provenance) |
| Report | `report-v452.ts:1244` `runChainV452` | — | `report_v452.md` + stats |

**THE V5 DOMAIN MAP (34 `src/*` dirs, measured this session):**
```
src/aether/ 2 · src/agents/ 1 · src/brains/ 17 · src/card/ 6 · src/clients/ 15 · src/constants/ 1
src/e1/ 29 · src/e2/ 28 · src/enforcement/ 6 · src/engine/ 5 · src/engine3/ 6 · src/engines/ 1
src/graph/ 6 · src/hooks/ 6 · src/identity/ 2 · src/jesl/ 8 · src/kernel/ 21 · src/mdve/ 40
src/pipeline/ 32 · src/report/ 6 · src/runtime/ 10 · src/semantic-firewall/ 9 · src/substrate/ 140
src/tools/ 2 · src/tvi/ 17 · src/utils/ 2 · src/vei/ 6 · src/visual/ 7   (+140 root .ts incl. the diag battery)
```

**THE 5-TOOL CHAIN (Bible 4.0 Part 3, sequential — the agent reasons BETWEEN calls, each tool mechanically validates the previous):**
`T1 harvest` (execFile python3 tv_fetch_ohlc, 120s/50MB) → `T2 zones` (3-LAYER FIREWALL: fs.access + VLM YES/NO + price-regex; DXY FIRST) →
`T3 shapes` (ShapeBrain.compute) → `T4 charts` (per pair×TF draw + screenshot + the 2-prompt VLM: supply separately from demand) →
`T5 setups` (firewall again + min 3 VLM_CONFIRMED + generateSetups) → `resetContext()`.

**THE CONTAINER/BROWSER STACK (Bible 4.0 Part 2 — the composition law):**
TradingView renders a **WebGL canvas**; a CDP `Input.dispatchMouseEvent` creates a synthetic
PointerEvent with `isTrusted:false`; **without a compositor** the canvas IGNORES it → clicks land
on the container, never the canvas. **Weston+XWayland** routes events through the compositor's
input pipeline, which trusts them. Xvfb is **PURGED** (`apt-get purge -y xvfb && rm -f /usr/bin/Xvfb`)
so nobody "simplifies" onto it. L0-L9: Docker(--init,host-net) → dbus → Weston 9.0 headless 1920×1080
→ XWayland :0 → Chromium 120 CDP **6930** → TV SPA → watchdog (167L, 10s dual-check HTTP+WS
`Runtime.evaluate "1+1"` to catch ZOMBIE Chrome) → TV MCP 36-38 tools → Plutus plugin (9 tools) →
opencode plutus agent.

---

## §4 THE CANON LAW — RULINGS R1-R34 + THE META-RULINGS (verbatim, the supreme canon)

**Source:** `PLUTUS_MASTER_CONTEXT_INJECTOR.md §1.1` (derived from T2 §1 + DECISION_CHAIN §A/B/C +
the NON-NEGOTIABLE-RELOAD corpus). `DECISION_CHAIN §E`: "The doctrine wins. The code is the work order."

| # | The ruling (elided where profane; the anchor holds the exact words) | Anchor |
|---|---|---|
| R1 | "E3 is a natural RESULT we ARRIVE AT from E1+2… 90% of the work is in E1+E2" | MACRO:13 |
| R2 | "E1→E2→E3 each one BUILDS ON TOP of the previous… absolutely non negotiable" | MACRO:19 |
| R3 | "E3 is not permitted to override pre-existing E1/E2 data architecture" | MACRO:21 |
| R4 | "pressure mechanics are the fundamental reality everything is built on top of" | MACRO:30 |
| R5 | "Liquidity is the BLOOD of the entire market" | MACRO:57 |
| R6 | "3 pips outside the back edge of the entry zone, or 1-2 pips inside the close edge of the next rung" | MACRO:243 |
| R7 | "zones usually fail on the THIRD mitigation" | MACRO:70 |
| R8 | "recency bias is NOT the LAW. Older zones valid if E1 pressure has an E2 pathway" | MACRO:81 |
| R9 | "2.5 RR or above is valid… TARGET is always 4R+" → SUPERSEDED by B10: "MINIMUM 3 RRR NOTHING LESS" | Bible4.5:570 |
| R10 | "strong pressure = near instant reaction = closest edge exit. Weak = delayed = far edge" | MACRO:253 |
| R11 | "no holding trades over the weekend. all trades CLOSE ON FRIDAY" | MACRO:121 |
| R12 | "Everything on EU maps 1:1 to DXY EXACTLY in the inverse direction" | MACRO:289 |
| R13 | "FIBONACCI is PURELY an E3 tool… do not touch until later" | MACRO:376-380 |
| R14 | "The agent/codebase must self validate based on RULES and LOGIC not hardcoded data" | MACRO:401 |
| R15 | "no DXY correlation… pure TTE reasoning" | MACRO:946 |
| R16 | "max setups should be removed… ALL valid setups should be mapped" | Bible4.5:593-595 |
| R17 | "spot price is practically irrelevant… day native" | Bible4.5:607,612 |
| R18 | "The mirror is not per pip precision… 80%. The 20% optimized for the actual pair" | Bible4.5:381 |
| R19 | "Doctrine is QUOTED, never synthesized… Anything that can't be quoted doesn't get built" | Bible4.5:705 |
| R20 | "3 attempts on each anchor (3 E, 3 SL, 3 TP)" | MACRO:421 |
| R21 | "S/D zones 4H→1H… BoM OBs are 4H/1H only… LQZ 1H→30m→15m" | Bible4.5:651-654 |
| R22 | "save tangible improvements… wipe everything for 4.5.2 onwards" | Bible4.5:188 |
| R23 | f(T)=8+(-8)×2=24 (8/pair excl AUD); MORE fine, LESS not | Bible4.5:89,601 |
| R24 | "place intelligent SLs NOT a fixed const. the market will eat fixed const garbage alive" | BR:35 |
| R25 | "the SL depth becomes a MEASURED quantity, never a fixed pip" | BR:39 |
| R26 | "safety > profit… 3R is better than a loss… [dumb] losses are degenerate" | BR:38 |
| R27 | "a refine/retry is correct. not a hard throw" | BR:44 |
| R28 | "literally all of these losses comes from not verbatim following my exact instructions" | BR:45 |
| R29 | "NOTHING SHOULD BE PRICE ANCHORED EVER… ZONE ANCHORED" | DEBUG:1231 |
| R30 | "temporally anchored to LONDON SESSION PRE-MARKET" ANALYSIS_POINT_MS=1783317600000 | BR:723 |
| R31 | "EVERYTHING should be tangible Lexicon filters + MPSE engines with 0 dumb garbage" | BR:727 |
| R32 | "decision making machine that deterministically makes intelligent decisions. 95% deterministic" | BR:37 |
| R33 | "golden tolerance 3 pips after EVERY change — not 30, not 10, THREE" | golden-gate.ts:18-20 |
| R34 | "lets see if it hits all 23 or falls short anywhere" | BR:339 |

**THE META-RULINGS:**
- **D13 / R19 — THE QUOTE LAW:** before ANY doctrine-touching decision: re-read the evidence from disk, QUOTE the exact words with a source. A paraphrase is a claim; the quote is the law.
- **D98 — THE CASCADE LAW:** "E2 calculated ONLY on DXY, injected into EU w/ invert, completed EU injected into GU." The GENERATIVE cascade is mandatory architecture (§6).
- **D101 — THE WAVE-CHANNEL LAW:** "GENERATE WORKS FINE. IGNORE THE PHANTOM COMPLETE. GENERATE AND READ." The wave-manager's premature `complete, agents:[]` toast is cosmetic; the agents ARE dispatched. The session stream is the ONLY liveness truth.
- **D62/D7-D10 — AGENT-IN-THE-LOOP:** the shadow agent was "[a cheat]" — the primary agent reasons in-session; STEP A (E1→E2 designation) + STEP B (E2→E3 chain) are visible agent steps; host testing not container (D10).
- **D63 — THE ZERO-SLOP LAW:** "EVERYTHING should now be tangible Lexicon filters + MPSE engines with 0 dumb degenerate garbage anywhere." A rule that cannot be a lexicon predicate or a deterministic MPSE structure is DELETED, never kept as a fallback.
- **D-R1..D-R7 (W0 ratification 2026-09-04, binding — BUILD_STATE.md:336):** RRR 2.5-floor/4R-target · thresholds armed · XState kept · in-process sentinels · shared.db consolidation · frozen pair through W5 · TS report port.
- **A17 — THE EATEN CONTRACT:** eaten = EVENT-SEQUENCE scoped. CONSUMPTION = close beyond the far edge AND STAYED. DEFENSE = interact + hold + ≥2p turn-back (re-establishes fuel). Sweep-and-reverse = DEFENSE. Gap-through = left-behind, NOT eaten.
- **A18 — THE BASELINE RULE:** an environment-level report-hash drift (A/B-proven, trade content byte-identical) is recorded as the NEW baseline and never litigated again.

**THE DO-NOT-VIOLATE LAW (injector §1.11 — the 16 hard limits):** no hardcoded prices in selection/emission ·
no fixed-constant SLs · no fallbacks-as-primary · no identical-every-day output · no fitted calibration ·
E3 never overrides E1/E2 · the frozen pair byte-identical · the LOCKED checkpoints untouched ·
doctrine quoted · no caps on setups · no weekend holds · no wall-clock in decision logic ·
subagents never write canon docs · never the raw task tool as the primary dispatch · never rebuild the
canon pipeline · the registry is append-only + exactly 8 refusal tokens.

<!-- DOC-PART-1-COMPLETE -->

---

## §5 THE E1 PRESSURE LAW — THE FUNDAMENTAL REALITY

**THE FOUNDATION (R4/R5, verbatim, `PLUTUS_E1_E2_E3_MACRO_CONTEXT.md:30,57`):**
> "pressure mechanics are the fundamental reality everything is built on top of" · "the market moves based on liquidity. S/D just provide the direction firepower and set the market structure of pressure mechanics + shape chain anchors. The LIQUIDITY is what actually FUELS the price action. Liquidity is the BLOOD of the entire market. S/D are the pressure zones, LQZ are the fuel zones. Both are needed - but LQ is what the candles need to actually eat and absorb before a move. This is why Liquidity shields exist. The candles eat the liquidity in front of the S/D and in doing so the S/D (and its internal nested liquidity) is protected from mitigation and thus has a longer lifespan."

### 5.1 THE BoM/MoM TAXONOMY
| Type | Birth | Conviction | Law |
|---|---|---|---|
| **BoM** (Break-of-Momentum) | AT the break = ORIGIN zone | unmitigated + prior=NONE/OPPOSITE → the 100% reaction zone — the highest-conviction anchor | the origin law |
| **MoM** (Momentum) | DURING the move | a VIRGIN MoM mid-BS/WL-pathway = the DEATH ZONE | the one exception to the 3-mitigation rule |
| **phantom-BoM** (D56) | type-2 virgin MoM: large-OB + fakeout + PRE-formation opposing-BoM reaction + macro-origin continuation | classified AT the formation-window (temporal rewind); day-end post-hoc verification | death-rule scope: 30m virgin MoMs + 1H type-1 ONLY — 4H zones NEVER (all get ≥1 reaction) |
| **fortress-BoM** | a visible, proven BoM | SEPARATE category from the phantom | the #8 golden trade class |
| **tf-hierarchy (D56)** | 4H = KING (owns the E2 chain) · 1H = GENERAL (owns E3 setups) · 30m = CAPTAIN (per-trade context) | HTF > LTF — pressure is set by the higher timeframe and cascades down | the telescope law R21: S/D 4H→1H · BoM OBs 4H/1H only · LQZ 1H→30m→15m |

### 5.2 THE OBCV GATES (Order-Block Confirmation Vision)
| Gate | Threshold | Mechanism |
|---|---|---|
| **Displacement (D)** | body ≥ 1.5× average AND range ≥ 1.5× ATR | institutional-grade move, not noise. **ATR14 ENDING AT i−1** (never including the impulse bar — the v4.4 Bug-3 lesson: the impulse inflates its own anchor ATR and blinds the detector) |
| **Freshness (F)** | balance-width ≥ 3.0 AND balance-factor ≥ 0.65 | the OB's internal balance must be clean; width gates 4H 15-40 / 1H 8-25 / 30m 5-15 pips |
| **Temporal (T)** | a 30m orphan inside the OB → REJECT | an orphan candle = no institutional origin |
| **Prior-context** | BoM requires prior NONE\|OPPOSITE, MoM requires prior SAME — else REJECT | lookbacks L(4H)=18 / L(1H)=36 / L(30m)=24, ε 0.5, θ 0.25 |
| **θ thresholds** | 4H 50p / 1H 30p / 30m 15-20p (pip-scaled) | the impulse detector |
| **The zone** | `[origin.low, origin.high]` FULL — never the impulse candle; ONE origin = ONE zone | the singular-origin law (Bible 4.0 §7.4.6 Step 0f, ZERO TOLERANCE) |

### 5.3 BATTLES-NOT-BARS
One retest = ONE event regardless of candle count in the band. Dwell ≠ attack. The zone state changes
on EVENTS (`TouchKind: SWEEP | WICK_REJECT | BODY_DEFEND | CONSOL_DWELL | PASS_THROUGH`, `src/e2/machines/types.ts:16`), never bar counts.

### 5.4 THE FORTRESS MECHANIC
4+ strong holds (defense events) → the Fire→Earth transition → ~95% probability the next move FLIPS at
that zone. The strongest single E1 signal. The dam analogy: after enough absorbed pressure the structure
itself becomes the wall.

### 5.5 THE ZONE LIFECYCLE (the mitigation ladder)
`VIRGIN → ACTIVE1 → ACTIVE2 → DEPLETED (3rd mitigation → usually fails, R7) → FORTRESS (4+ strong → the 95% flip) → BROKEN (role reversal)`
- The flip: a failed supply reaction → the demand zone forms from the higher low → the retest is a BUY.
- Break validation: if the MoM zone is unbroken, a lower-tf break is NOT a clean break — still bullish. **E2 validates breaks; E1 never assumes them** (the false-positive break-of-structure law).
- **HIERARCHY (Bible 4.0 §7.4.6):** Zone Type > Mitigation > Trend — "an unmitigated MoM in an opposing trend is WEAKER than a 2X mitigated BoM".

### 5.6 THE LQZ SHIELD LAW
A liquidity zone in front of an S/D protects it: the front shield must be SWEPT before the S/D can be
pierced; the rear shield before the move continues past. The shield PROJECTS its shielded zone's pressure
(weaker but real). **An LQZ sweep INTO a pressure zone = fuel delivery.** The nested LQZ = "the Earth within the Fire".

### 5.7 THE ZoC LADDER + THE CHAIN
A zone needs 3+ timeframe confluence + an LQZ shield + BoM-quantity ≥ 4 to be a Zone-of-Control anchor.
OBs are ONE-TIME-USE (a mitigated OB is spent). **TP-of-N = Entry-of-(N+1)** — trades chain (§7.4).

### 5.8 THE PAIR CALIBRATIONS (measured, not invented)
| Pair | Element ladder | Pip size | Zone buffer | Profile |
|---|---|---|---|---|
| DXY | Air → Fire | 0.01 | 15 pips | the compass — London zone-to-zone, NY wakes |
| EUR/USD | Fire → Earth (62.4% DXY-correlation era) | 0.0001 | 25 pips | the swing engine — PA touches the overlap directly, NO shield |
| GBP/USD | Earth → Water | 0.0001 | 35 pips | the scalp — LIQUIDITY is the only thing respected; S/D gets PIERCED, shields protect |
| AUD/USD | (molasses) | 0.0001 | 15 pips | the outlier — 2-4 days; HTF+Reinf only; Tokyo+London never NY; max 3 |

### 5.9 THE EATEN/FUEL SEMANTICS (A17)
A bar interacting with the rung band `[bottom−ε, top+ε]` (ε = 2 pips, the LMV reaction-band canon)
classifies as CONSUMPTION (closes beyond the far edge AND STAYS) or DEFENSE (interacts, holds at/inside
the far edge, next bar turns ≥2p back). **eaten ⟺ the LAST event is a consumption.** A defense AFTER a
consumption RE-ESTABLISHES the fuel. Sweep-and-reverse = DEFENSE. Gap-through (no band intersection) =
left-behind, NOT eaten. Verified: the trade #2/#4 switch reproduces (EU demand 1.14004: Mon SHIELD_FUEL → Wed PRESSURE_STRUCTURE, 8 zones in the gate).

### 5.10 THE SWEPT-SIDE LAW (W2 fix, `lmv.ts:700-724` + `candle-pressure.ts:363-373`)
The swept side of a zone matters — the DXY 101.14 rung is SELL_SIDE after the sweep. The side vote is a
lexicon predicate, not a heuristic. (The LMV oracle 7/7 depends on it.)

### 5.11 THE LMV MACHINE + THE E1 CONSTANTS
The LQZ rung universe: modal-cluster emission, 1p dedup, ε=0.25×ATR, ≥3 points across ≥2 windows,
prominence 1p, cluster 2p, span 4p, quantum 1p, lookback 720. **Sweep = 1.5×/2p/6b/24-bar** ·
LONG_WICK = 2.5×+5p / sharp max(15p, 1.5ATR) / 3b · SHORT_WICK = 3p/3bars/2p/25-span · confirm 2-types/3p ·
caps 20/50/75. **The ZFP (zero-fuel percentage, 0-14 ladder):** sweep-lookback 24-bar, the zfp ladder
`20 + floor((t−3)/2)×5 cap 60`; `ZFP_ZONE_FAILURE_THRESHOLD = 45` (`shape-brain.ts:555`) — the tipping
point where institutional defense transitions "likely holds" → "likely fails"; drives the SS→BS.

### 5.12 THE 6 DIMENSIONS OF INDEPENDENCE (max 2/12 each = 16.7% — EXTREME requires ≥6 independent agreements)
D1 Technical (price math) · D2 Options (contractual positioning — the delta-hedge obligation IS the
magnetism; the NY Cut Cage + the Spring Release) · D3 Analyst (published levels are PUBLIC SIGNALS of
PRIVATE positioning) · D4 Structural (microstructure memory — swing wicks are forensic evidence of defense)
· D5 Psychological (.00/.50 anchors) · D6 Regime. Score 0-14; below 6/14 the win-rate < 50% (the hard firewall floor).

---

## §6 THE E2 SHAPE + CASCADE LAW — THE STORYLINE (D98)

**E2 = THE STORYLINE (verbatim, `PLUTUS_E1_E2_E3_MACRO_CONTEXT.md:93`):**
> "SPECIFICALLY HOW I AM LOOKING AT E1 PRESSURE MECHANICS ON ZONES AND HOW I AM USING E2 SHAPE CHAIN MECHANICS TO FORM THE STORYLINE NARRATIVE ON TOP OF THE E1 PRESSURE MECHANICS THIS IS EXTREMELY [important] FOR ANY E3 TRADE SETUPS TO EVEN BE REMOTELY ACCURATE. YOU WILL NOT HAVE 'WATER ELEMENT' FLOW IF THIS IS [broken]."

### 6.1 THE SHAPE VOCABULARY
`ShapeCode = "SS" | "BS" | "R" | "WL" | "RWL" | "WLS" | "PBS"` (typed — `src/e1/core/types.ts:38` + `src/e2/machines/shape-chain-machine.ts:15`). The canonical golden week chain: **Mon SS → Tue BS → Wed R → Thu BS → Fri WL** (×3 pairs, W3 discharge verified, 0 divergence).

### 6.2 THE ZFP GUARDS
| Transition | Guard | Constant/anchor |
|---|---|---|
| SS → BS | zfp > 0.45 AND marubozu-anatomy | `ZFP_SS_BS_MIN = 0.45` |
| BS → R | 0.20 ≤ zfp ≤ 0.40 | `ZFP_BS_R_LO/HI = 0.20/0.40` |
| BS → RWL | opposing-BoM AND sweep confirmed | structural |
| zfp < 0.20 on a BS attempt | HardWall → RWL | the wall law |
| 4+ SS in a session | the NY-BS override | the afternoon law |
| Macro contradiction | `chainsContradict → INCONCLUSIVE` + evidence recorded (`:62-80`) | never silent |
| Divergence | > 0.35 → `applyDivergenceFlip` (MACRO WINS) | `DIVERGENCE_MAX = 0.35` (`src/e2/machines/types.ts:9`) |

### 6.3 THE D98 GENERATIVE CASCADE (canon implementation `report-v452.ts:1050-1225`)
1. **DXY brain = the SOURCE:** `buildShapeBrain('DXY')` :1063 → setZoneMap → compute() → own 5-day chain + buildDayDecomposition.
2. **EU brain (its OWN chain):** :1064 — compute() on EU zones.
3. **GU brain WITH EU INJECTION (THE CASCADE):** `guBrain.injectShapeSequence(euShape.shapeChain.dayDecomposition.map((d) => ({ shape: d.shape })))` at :1095. Inside `buildShapeChain` (`shape-brain.ts:3099-3101`): `nextShape = injectedChain[i] ? injectedChain[i].shape : predictNextShapePressureAware(...)`. **The GU picks its OWN zones; the SHAPES come from the EU.**
4. **Translation validation:** `translateCascadeDayMap(DXY→EU, 'INVERSE')` :1139-41 + (EU→GU, 'KEPT') :1144-46. **B3 verbatim:** "No cascade is literally a translation of the exact map/data that currently exists on the cascade pair to the receiving pair. THIS IS WHY E1 OF THAT SPECIFIC PAIR NEEDS TO BE RUN FIRST SO ZONES OF THE SAME ELEMENT CAN BE PROPERLY MATCHED. BoM --> BoM, MoM --> MoM, S/D --> D/S (DXY/EU), S/D --> S/D (EU --> GU), PAIR SPECIFIC LQZ GENERATED UNBIASED FROM CASCADE."
5. **Divergence:** `computeChainDivergence(EU,DXY)` :1172-74 + (GU,EU) :1175-77; breach → `applyDivergenceFlip` (macro authority wins).
6. **The side-inversion law (D50 verbatim):** "supply --> demand and demand --> supply dxy supply --> eu demand and vice versa this is clearly not [inverting] correctly" — the inverse is the ZONE-SIDE inversion. **ANY E3-side check consuming ONE designation (`keyZoneId`) for both directions is structurally broken:** LONG mirrors consume `demandZoneId`, SHORT the `supplyZoneId`, at EVERY layer (anchor match, designated-zone gate, entry resolution). The cascade machine FORBIDS raw DXY zone-ids in GU (`cascade-machine.ts:92-103` FORBIDDEN_PRECEDENT).
7. **V5 cascade machine:** `IDLE→DXY_DONE→EU_CASCADE→EU_CORE→GU_DONE` (`cascade-machine.ts:58`); REQUIRES `dxyInverseExists` (:73) + mirrors non-empty (:83); MISSING_PREREQUISITE/FORBIDDEN_PRECEDENT named violations; `CascadeLoopGuard` dedup :112-156 (note: `loopDetected` swallows tracker errors → false at :143-149 — the ONE silent-fallback, flagged LOUD-FAIL-VIOLATION minor).

### 6.4 THE DAY DECOMPOSITION
Mon–Fri loop; `projectZoneForDay` per day; `dayOpenSpot = Mon prior-Friday-close, Tue–Fri prior ± travelMid` (**data-derived — NEVER a constant**); `dayBandCarry` chains Mon→Fri. The C-1 fix killed the E2-null day (day-band forward projection + median travel + Monday exclusion).

### 6.5 ZONE RELEVANCE = THE PRESSURE-STATE FUNCTION (A6)
The operative defense = the zone whose pressure is CURRENTLY operative (mitigation counts, absorption,
BoM/MoM, confluence, liquidity density). **The SL anchor SWITCHES with the pressure state.**

### 6.6 THE E2 MACHINES (V5, W3 GATE GREEN 138/0)
| Machine | States | File:line |
|---|---|---|
| ShapeChain | the 7-shape table + guards | `shape-chain-machine.ts:168` |
| Designation | `OPEN→DESIGNATED→CONSUMED\|INCOMPLETE` — **ZONE-IDS-ONLY** (SC-7 type proof :20-25: NO price/top/bottom/floor/ceiling fields) | `designation-machine.ts:75` |
| Cascade | `IDLE→DXY_DONE→EU_CASCADE→EU_CORE→GU_DONE` | `cascade-machine.ts:58` |
| ZonePressure | event-driven, 4H-never-death (router :59, guards :114/:153) | `zone-pressure-machine.ts:70` |
| Freshness | the pressure mirror | `freshness-machine.ts:47` |
| Workflow | `E1→E2→E3→REPORTED`; skip-transitions ABSENT (:46) | `workflow-machine.ts:22` |

---

## §7 THE E3 RESOLUTION LAW — CLASSIFICATION + PRECISION ALIGNMENT

E3 = the classification + precision-alignment engine over E1+E2. **It NEVER overrides (§3).** Machinery:
the ADM + the ladder-steps geometry + the RRR doctrine.

### 7.1 THE ADM STATE MACHINE
`IDLE → MEASURE → ANCHOR → VERIFY → EMIT / REJECT`.
- **The 5 measures:** m1 wick-extreme · m2 dispersion (MEDIAN, never mean) · m3 width-scale · m4 nesting · m5 defended-extreme.
- **HYBRID delegation:** the ADM owns the VERDICT + the SL; the reasoning chain owns the ENTRY + the TP. Neither fabricates the other's output.
- **The 3-attempt law (R20):** "3 attempts on each anchor (3 E, 3 SL, 3 TP)". A rejected setup is REFINED, never thrown (R27). D58: hard-throw ONLY after 3 refinements + the SQLite failure store + end-of-pipeline synthesis with next steps.
- **B7 (the 3D refinement machine):** "refinement machine needs full awareness of pipeline mechanics and cascade mechanics AND trade setup mechanics (3D refinement machine)… the model will ALSO INFERENCE based on this for the final conclusion this is not purely mechanical it is 60-40 deterministic/model inference" + "A rejected setup is not a dead setup. The entry is the hard-won insight; SL/TP are engineering. A 1.8-RRR trade with a valid entry is a good trade with a dumb anchor."

### 7.2 THE LADDER-STEPS SL LAW (R6/A5, verbatim, `MACRO:241-249`)
> "3 pips outside the back edge of the entry zone, or 1-2 pips inside the close edge of the *next rung* relevant zone. In the case of the EU trade the next rung relevant zone was the supply zone. you need to look at the zones like ladder steps. It is either 3 pips outside the far edge of the current step we enter on, or 1-2 pips inside the close edge of the NEXT STEP away (opposite direction of the projected trade direction - if it is a short then this is the next step UP. if it is a long this is the next step DOWN) from the entry step. This is to ensure the SL has breathing room for volatility while still being tight enough to maximize RRR."
- **NOT hardcoded (A5):** "it is not S/D = SL and LQZ = E hardcoded. No." The relevant zone = whichever pressure structure is the operative defense FOR THAT TRADE.
- The SL depth is a MEASURED quantity (R25), never a fixed pip (R24). **SL ceiling 36 pips HARD (D17).** D35: "SL goes INSIDE the next LQZ next to the entry zone. Should usually be within < 20 pips."
- **D53/D55 (v4.5.3, the measured entry mechanics):** the SS-shape's LONG resolves the SELL_SIDE rung whose top sits within 10p below the demand anchor floor (the nested sell-side liquidity — "Set E at the TP level of trade #1… the nested liquidity zone that sits inside this demand at 1.14110 - 1.14020"). The SHORT's proximity ranks by `|rung.top − zone.top|` (TOPMOST = first swept). Lesson from D53: the reversed proximity sort put the FARTHEST rung first — caught by the both-sides re-measurement.

### 7.3 THE TP EDGE LAW (R10/A8, verbatim)
> "the stronger the pressure of the zone, the weaker the mitigation will be prior to the reaction. Strong pressure zones = near instant reaction. exit on the closest zone edge and even potentially add a 1-2 pip spread so you dont miss the exit. Weak pressure zones = delayed reaction. Maximize the profits you catch from these while the candles are still inside of them."
- **CASCADE lanes:** the TP = the structurally-equivalent projected opposing BoM zone — **NEVER "the nearest" (B6 verbatim):** "NEVER have I said 'the nearest'. No. This needs to follow proper TP calculation mechanics and match to the zone of opposing pressure that will ACTUALLY cause a reaction this is LITERALLY what E1 and E2 are for. STRUCTURALLY EQUIVALENT not this wank of false metrics like nearest or strongest".
- **CAVEAT (the audit's correction):** the DXY SOURCE lane's golden TPs = the DAY's projected opposing zone (Mon LONG TP 101.115 = the Monday supply).
- **The TP cap-walk (ZR-3.4):** walk past shallow LQZ shelves (candle-count zfp-20 pass-through) to the real wall — the wall is classified from E1 PRESSURE MECHANICS, never candle counts alone (the D37 #1 root cause).

### 7.4 THE CHAINING LAW
**TP-of-N = Entry-of-(N+1).** The EU #2's entry = the EU #1's TP. Mirrors chain identically (ZR-4.2). The D11 chained-entry gate enforces it. **V5.0 measured chain rate 0/18 vs oracle 15/18** — the V5.1/V5.2 build's core deficit.

### 7.5 THE RRR DOCTRINE
Floor 2.5R (valid-if-high-probability) → **B10 SUPERSEDES:** "MINIMUM 3 RRR NOTHING LESS IS ACCEPTABLE IDK WHERE THE [slop] CAME FROM ALL MY TRADES ARE 4+ SO 3 IS THE MINIMUM." + "NOT A SINGLE ONE OF MY TRADES IS BELOW RRR = 3.5." → D-R1 ratified 2.5/4R+. **TARGET = 4R+.** The machine MUST NOT optimize for low-R filter-passing volume. RRR = a CONSEQUENCE of the zone geometry — never a forced target.
- The distribution law: E2 exact-match registers its anchor into `usedAnchors` — N distinct trades from N distinct zones (ZR-4.1).
- The count law (R23): `f(T) = 24/week` (8/pair excl AUD). "ALL valid setups should be mapped. The filter will kill [dumb] setups" (D16). The 6-11 rule: "6-11 setups PER PAIR"; >12/pair = the filter is broken.

### 7.6 THE ENTRY-SIDE SHAPE LAW (D51)
Recovery/reversal trades (RWL/R/RS/PRWL) resolve the demand's DEEP internal rung (far edge); whiplash/scalp trades (SS/BS/WL) resolve the NEAR edge.

### 7.7 THE FIBONACCI DEFERRAL (R13/A14)
Verbatim: "FIBONACCI AIR ELEMENT IS ADVANCED AS BEEN INTENTIONALLY OMITTED UNTIL THE CURRENT E1/E2/E3 ARCHITECTURE IS 100% BULLETPROOF… YOU WILL 1000000% DERAIL INTO [slop] IF YOU DO FIBONACCI WITHOUT A SOLID FOUNDATION. ALSO FIBONACCI AIR ELEMENT IS NOT NECESSARY AT ALL FOR CORE TRADES IT IS ONLY FOR REINFORCEMENTS." **E4-later, reinforcement-only**, requires a new candle-vision class on E2+E3 with swing-anchor recency bias.

### 7.8 THE HALLUCINATION DETECTOR + MANUAL REVIEW (B8/B9)
"build a hallucination detector engine into this as well that immediately red alerts false model claims… for all rejected trades." The review stage: rejected setups logged → agent review of diamonds-in-the-rough (SEQUENTIAL for precision) → mechanical batch quality filter → 2 revision attempts → final report with refinement notes.

---

## §8 THE TEMPORAL + TESTING LAW

### 8.1 THE TEMPORAL ANCHOR
1. **THE ANCHOR:** `ANALYSIS_POINT_MS = 1783317600000` (Monday 2026-07-06 06:00 UTC — the pre-London hour). Verbatim (D63): "In the 1H before london session starts is when i manually do all my analysis and setup my trades for the day and then close the charts and the prices action just fills my limit orders and hits TP/SL accordingly. That's what this pipeline needs to replicate." `WEEK_START_MS = 1783296000000`. The Friday-close anchor `1783702800000` is **DEAD** (the I-4 lesson — it was the OLD anchor).
   **⚠ ANCHOR CONFLICT (recorded by the engine-specs desk):** `PLUTUS_V4.5.4_REASONING_CHAIN_L1_SPEC.md:16.1` carries `ANCHOR_MS 1783702800000` + `WEEK_START 1783296000000`, contradicting the ADM's `ANALYSIS_POINT 1783317600000`. **The live/anchor-doctrine value governs** (1783317600000); the L1 line is a stale-era residue.
2. **THE SNAPSHOT:** everything visible UP TO the analysis point is the decision data. The pipeline never sees the future (`FutureBarLeak` runtime guard — `src/e1/adapters` throws the REAL leak; boundary `t === anchorMs` passes).
3. **THE FILL MODEL (D55):** the temporal lock governs GENERATION; the outcome simulation fast-forwards to the day-end (NY close − 1 hour = 20:00 UTC). Same-bar TP+SL = **LOSS** (conservative). SL-first on ambiguity.
4. **THE WEEK CYCLE:** London = sharp reactions; NY = deep continuation. **ALL trades CLOSE Friday (R11).** Monday starts fresh on the Monday-open price action. Monday's E2 = the PRIOR Friday's close context.
5. **NO WALL-CLOCK in core** (the bible ban): decision logic never reads `Date.now` — temporal position comes from data + the analysis-point anchor. (The JESL kernel's `Date.now` sites are TIMING STAMPS on results, not decision inputs.)

### 8.2 THE 3-PIP GOLDEN GATE
1. **THE 3-PIP LAW (R33):** "golden tolerance 3 pips after EVERY change — not 30, not 10, THREE." `ORACLE_TOLERANCE_PIPS = 3` (`src/pipeline/golden-gate.ts:50`); the G1 entry tolerance = 2 (`golden-gate.ts:52`).
2. **THE CANON BATTERY:** `bunx tsc --noEmit` → `bun build src/index.ts --outdir dist --target bun` → `bun report-v452.ts` → `sha256sum report ×2` (determinism) → `bun diag-golden-coverage.ts` (the 3-pip count) → `sha256sum` the frozen pair. PASS = every command green + the report sha ×2 identical + the frozen pair unchanged. **A frozen-pair drift = CRITICAL STOP for all work.**
3. **THE GOLDEN GATE HARNESS:** `bun diag-reasoning-chain-golden.ts --day=2026-07-06` → G1-G10 + A1-A7 + OUTCOME ≥4/6 + determinism ×2 + the frozen pair. **VERIFIED STATE (2026-09-05, real bars):** 5/5 convergence (DXY L 100.945 · DXY S 101.140 · EU S 1.14395 · EU L 1.14110 · GU L 1.33330), A1-A7 7/7, OUTCOME 4/4, wall 0.2s. G1-G10 = 8/10: G1 (EU fortress emission) + G4 (DXY→EU inversion) = the **DOCUMENTED C-3B-era residuals** (spec:319 future wave) — **NOT regressions**. *(THIS SESSION: the run is BLOCKED — the fixture is absent.)*
4. **THE ORACLE ISOLATION LAW (D13/R14):** the golden levels live ONLY in `golden-gate.ts` + the diag scripts — NEVER in the emission path (the grep-gate). Corrupting the oracle MUST NOT change pipeline output (the S6 container test proves the mutation isolation).
5. **THE TEMPORARY-SCAFFOLD LAW (A15):** the golden anchor is TEMPORARY ARCHITECTURE — clearly labelled, removed once solid. "The agent/codebase must be able to self validate based on RULES and LOGIC not a hardcoded data set." **Phase 2 of testing = MULTIPLE UNRELATED WEEKS with consistent prediction quality** ("not some [dumb] pattern matching slop that breaks in any real market scenarios").
6. **THE OUTCOME-SIM RULES:** trigger = first bar covering E after the anchor; exit = first-touch SL/TP walking forward; same-bar TP+SL = LOSS; MAE/MFE tracked; `MAE/SL-dist < 0.40` = SL too wide, `> 0.70` = entry too early; R = `|TP−E|/|E−SL|` for a win, −1.0 for a loss; the parse gate: LONG `sl < e < tp`, SHORT `tp < e < sl`.
7. **THE DETERMINISM BASELINE:** `report_v452.md` sha ×2 byte-identical after EVERY change; the NEW baseline is recorded and never litigated (A18).

### 8.3 THE JESL KERNEL LAW (`src/jesl/`) — THE TEST MACHINERY
**WHY IT EXISTS:** the pipeline had 42 manual diag scripts, no mechanical enforcement that ALL gates run, no tamper-proof evidence, no replay. Any agent could skip a gate, fake a result, or claim a run that never happened. The JESL machine makes skipping/faking/tampering **STRUCTURALLY IMPOSSIBLE** — the machinery enforces correctness, not discipline.
**THE THREE PARTS:** (1) THE CARD — `specs/jesl/plutus-pipeline-test.json`, DATA in git, diffable; (2) THE KERNEL — `src/jesl/`, the executor that runs cards; (3) THE JOURNAL — the sha256 hash-chained JSONL, PROOF.

**THE KERNEL FILE MAP (measured, this session's `ls`):**
| File | Lines | Role |
|---|---|---|
| `registry.ts` | 1,898 B | append-only impl store — `register(impl)` :20; identical re-register OK :26-30; conflicting → `[JESL UNKNOWN-NODE]` :31-38 |
| `executor.ts` | 13,606 B | channel-model runner — `validateDoc` :52 (Kahn + tier + caps); `run` :181; readiness rule :244-253; caps gate :269-277 |
| `journal.ts` | 3,695 B | sha256 hash chain — `canonicalSerialize` :5 (skips self+ts+undefined); genesis prev = `"genesis"` :64; `verifyChain` :105 |
| `nodes.ts` | 23,072 B | 8 impls + `defaultRegistry` — `generate` :89 (ALWAYS throws UNBRACKETED); gate/shell-exec/math-eval/journal-sink |
| `errors.ts` | 1,643 B | `JESL_MAX_RETRIES=2` :1; `JeslCode` = EXACTLY 8 tokens |
| `types.ts` | 2,965 B | Verdict, NodeKind (8), NodeFamily (6), `WorkflowDoc` ($schema trident-workflow-v1) |
| `hello.test.ts` | 15,180 B | the gate battery — SC-1/9/10/13 |
| `index.ts` | 860 B | barrel |

**THE CHANNEL MODEL (the structural gate-refusal):** each edge carries a via-name; a node fires ONLY when ALL its inbound via-channels are written (the readiness rule). A FAIL gate writes FAIL to its channel → downstream reads FAIL → CANNOT produce PASS → `summarizeVerdict` sees ANY FAIL → overall FAIL → exit 1. **NO skip flag exists.** Removing a gate node = dangling edge = `[JESL UNKNOWN-NODE]` at validation. `set -e` can be deleted from a bash script; a JESL gate can only be removed by a VISIBLE card diff.

**THE EIGHT REFUSAL TOKENS (frozen law, exactly 8):** `[JESL UNKNOWN-NODE]` · `[JESL CYCLE]` · `[JESL TIER-VIOLATION]` · `[JESL UNBRACKETED-GENERATION]` · `[JESL CAP-UNBOUND]` · `[JESL ORACLE-MISSING]` · `[JESL CHANNEL-UNSET]` · `[JESL NO-SEED]` (DEAD — zero throw sites, flagged, removal pending). **`RETRY-EXHAUSTED` is NOT a token** — exhaustion produces a loud FAIL result with `error: { reason: "RETRY-EXHAUSTED", message }`; refusals BLOCK runs, exhaustion FAILS results.

**THE JOURNAL MECHANICS:** `self = sha256Hash(canonicalSerialize(base) + "|jesl|" + prev)`; canonicalSerialize EXCLUDES self+ts+undefined and sorts keys → **hashes are time-independent**. `runId = sha256Hash(docHash + "|jesl|" + seed).slice(0,16)`. Replay: non-empty `query(runId)` → `verifyChain` MUST pass (else ORACLE-MISSING) → `covers` rebuilds results from `kind==="verdict"` rows → `{invoked: 0}`. **TAMPER PROOF:** mutating any prior row's payload changes its canon.

**THE VERIFIED STATE (this session):** `bun test src/jesl/` → **2 pass / 0 fail / HELLO-GATE: ALL GREEN** (the 28 assertion groups incl. SC-1 8-kinds, SC-4 sha256, SC-5 exactly-8 tokens, SC-9 sink commit, SC-10 tamper detect/restore, SC-13 determinism ×2).

---

## §9 THE V5 BUILD PACKAGE (the deliverable class the operator named)

### 9.1 THE PACKAGE (`packages/plutus-v5.1/` — 10 files, 174,636 B)
| File | Lines | Role | Its gate |
|---|---|---|---|
| `00-MISSION.md` | 58 | the mission verbatim + the extraction + the open questions | the ≤5 question rule |
| `01-DISCOVERY.md` | 152 | the measured landing zone (every row with its command) | anchor-or-nothing |
| `plutus-v5.1_DPL1_SPEC.md` | 1,078 | **THE BUILD AUTHORITY** — the 14-section DPL1 contract | the §12 checklist |
| `plutus-v5.1_MASTER_BLUEPRINT.md` | 1,002 | the nine-section canon + the battery §9.4 | the battery |
| `06-WAVES.md` | 76 | the 4-wave structure (entry → desks → exit) | per-wave gates |
| `06.5-WORKER-PLAN.md` | 134 | `WORKERS: 3` + the oracles + the audit | worker-planning `check.sh` exit 0 |
| `07-GOALS.md` | 149 | the 4 goal prompts + the hydra chart | the judge's rule |
| `RUNNING_BUILD_LOG.md` | 179 | APPEND-ONLY build record | — |
| `RUNNING_DEBUG_LOG.md` | 333 | APPEND-ONLY debug record | — |
| `context_management/` | 13 docs | the canon set + the growing bible | the manifest's semantics |

**Base:** `plutus-v5.0.0-full-package` (FROZEN, never edited). **Non-negotiables:** (1) the frozen pair byte-identical forever; (2) v5.0 preserved whole for direct A/B; (3) every gate rejection LOUD + logged; (4) the chain is a preference, never a force; (5) **the score may fall as the band narrows — the measurement becoming honest is the point, not a regression.**

### 9.2 THE FIVE DISCOVERED DEFECTS (measured, `01-DISCOVERY.md` / DPL1 §2)
1. **THE UNWIRED GATES (grep-measured, both trees):** `MAX_ENTRY_DISTANCE` (6 v4.5.3 consumers → **0** in v5.0) · `MAX_ENTRY_DISTANCE_PIPS` (6→0) · `SL_MAX_HARD` (6→0) · `MAX_SETUPS_PER_CATEGORY_PER_PAIR` (1→gone) · `CONSOLIDATION_WEEK_FLOORS` (2→0). The four doctrine gates exist in the constants file with ZERO consumers.
2. **THE LOST RULE LAYER:** `v4.5.3 src/semantic-firewall/index.ts` → **30 rules**; `v5.0 src/semantic-firewall/` → **ABSENT**; the 7 key rule IDs (CS8/CS11/CS18/AD8/AD4/CS9/CS13) → **0 hits in `src/`**.
3. **THE E2-CORE DAY-COLLAPSE (the −43-point mechanism):** v45pw (no shapeDay) emits 57 EU entries across 308p; **v45e2 (shapeDay) emits 17 EU entries, ALL = 1.14147** — every source on a day resolves the day's SINGLE designated zone (`mirror.ts:4326-4328`).
4. **THE WEEK GATE:** `forward-predict.ts:42-52` hardcodes `ANCHOR = 1783317600000` + `WEEK = "2026-07-06"` + `if (bundle.week !== WEEK) throw` → v5.0 cannot be pointed at any other week **by construction**.
5. **THE SCORER'S MAX-OF-SIX:** `score-golden.ts:110-122` reports the MAX of 6 lane configurations. Lane distribution (golden week): `19.0 / 19.0 / 76.2 / 90.5 / 47.6 / 23.8` — mean 46.0, median 47.6, **max 90.5 ← REPORTED**.
6. **THE ORDER-DEPENDENT TEST:** `bun test src specs` → 1 FAIL (matrix-bridge); `bun test src/mdve/matrix-bridge.test.ts` alone → 4 pass / 0 fail → cross-file state pollution.

**THE HEADLINE:** "**The v5.0 acceptance gate reports the best of six lane configurations on the one week the package ships bars for, measured by a test that a random scatter of the same trade count in the same price band satisfies 58% of the time.**" The engine has real signal (+6.8 over chance, p = 0.0005) but the measurement cannot show how much.

### 9.3 THE FIXES (V5.1 = 14 items, nothing else)
- **FIX-1 the four gates (CS8/CS11/CS18/AD8) wired into `cascadeV45`:** G1 the entry distance · G2 the SL bound · G3 the chain pool (register + the +2 rank bonus) · G4 the caps + the frozen-dedup identity pass. The gateLog field on every lane result (181+ loud entries).
- **FIX-2 the rule layer:** `src/rules/doctrine-rules.ts` (170L) + the 20-test battery; every Reject token asserted both halves.
- **FIX-3 the product-lane declaration:** ONE product line (`PRODUCT_LANE`); the ablation labelled, never scored.
- **FIX-4 the E2-core preference:** the authoritative match → the +2 rank bonus, so the doctrinally-correct E2-core lane no longer collapses.
- **FIX-5 the null test:** `null-test.ts` (8,000 Monte-Carlo trials) — measures the test's OWN chance baseline.
- **FIX-6 the matrix-bridge isolation** (the ambient-lock fixture epoch).
- **FIX-7 the week unblock** (`forward-predict.ts` argv parameter, 3 lines).
- **FIX-8 the bundle builder** (`build-bundle.ts`, the C4 deliverable — validated in-session, promotion deferred behind the guard ruling).
- **FIX-9 the ATR non-skip** (the loud-fail conversion — the floor silently skipped becomes ATR-0 refuses).

### 9.4 THE WAVES + WORKERS
**WAVES A→B→C→D:** A the unblock + hygiene · B the four gates · C the measurement · D the comparison. **WORKERS: 3** (one worktree each, disjoint scopes):
| Worker | Worktree | Branch | Gate | SME domain | Sole scope |
|---|---|---|---|---|---|
| W1 the unblock + hygiene | `.wt/v51-w1` | `v5.1/w1-unblock` | `bun test src specs && sha256sum specs/acceptance/prediction-2026-07-06.json` | the acceptance harness + test isolation | forward-predict.ts · matrix-bridge.test.ts · trading-constants.ts:320-331 |
| W2 the four gates | `.wt/v51-w2` | `v5.1/w2-gates` (from W1) | `bun test src specs && bun test src/rules/` | cascadeV45's anchor/geometry machinery | src/rules/* · mirror.ts · the gateLog field |
| W3 the measurement | `.wt/v51-w3` | `v5.1/w3-measurement` (from W2) | `bun null-test.ts && bun score-golden.ts` | the scorer, the null instrument, the bundle builder | score-golden.ts · null-test.ts · build-bundle.ts · mirror.ts:4326-4328 |

**THE JUDGE'S RULE:** tool-result tokens only; the orchestrator re-runs OR-1..OR-10. **OR-1..OR-10** = the oracle battery (10 rows).

---

## §10 THE RESULT — V5.1 CLOSED, V5.2 AT 14/21 (the measured truth)

### 10.1 THE V5.1 COMPARISON TABLE (the DPL1 §7 contract — every row measured)
| Metric | v5.0 (frozen) | V5.1 | Gate | Verdict |
|---|---|---|---|---|
| EU emitted band | 308.0p | **49.5p** | ≤ 80p | **PASS** |
| EU ACTIVE mirrors | 57 | **4** | — | — |
| GBP/USD emitted band | 320.6p | **0.0p** (1 mirror) | ≤ 120p | PASS |
| RRR max | 2041.0 | **21.16** | ≤ 50 | **PASS** |
| emitted/week (EU+GU) | 94–105 | **5** | ≤ 24 | **PASS** |
| duplicate entries | 6–15 | **0** | = 0 | **PASS** |
| chain (emitted transitions) | 0/18 | 0/3 — **the pool live, inert** (D-V51-06) | ≥ 10/18 | **NOT MET** |
| chance baseline | **58%** | **0.0%** | ≤ 25% | **PASS** |
| product score | 90.5% (max-of-6) | **38.1%** (v45e2, one lane) | ≥ 76.2% | **THE GUARD — FIRED** |
| the edge over chance | ~32 points | **~38 points** | — | **THE SIGNAL GREW** |
| suite | 507/1 | **528/0** | 0 fail | **PASS** |
| determinism | ×2 | ×2 (`429b5cc8…`) | identical | **PASS** |
| week flexibility | 1 (throws) | any bundle | runs | **PASS** |
| gateLog | absent | **181+ loud entries** | present | **PASS** |
| the E2-core collapse | 17 × 1.14147 | **spread (3 unique / 41.9p)** | v45e2 ≥ v45pw | **PASS — the doctrinal path now leads** |

**THE HEADLINE (verbatim, V51_COMPARISON §2):**
```
  v5.0:  90.5% = 58 points of COVERAGE + ~32 points of SIGNAL
  V5.1:  38.1% =  0 points of COVERAGE + ~38 points of SIGNAL
  THE GATES DID NOT WEAKEN THE ENGINE — THEY EXPOSED IT.
```
**THE AUDIT GATE:** `AUDIT GATE: PASS (0 critical/high open on the V5.1 delta)`; `GUARD STATE: FIRED (38.1% < 76.2%)`; `SHIP-READY: BLOCKED on the ruling`.

### 10.2 THE V5.2 ITERATION (the build continued past the checkpoint — 2026-09-27)
V5.2 landed **five mechanisms**, each measured, each doctrinally sound — **8/21 → 14/21**:
| Wave | Mechanism | Measured effect |
|---|---|---|
| W6 | THE SPREAD POLICY | the first score-raising fix (8→9) |
| W7 | THE DAY-NATIVE CS-1 REFERENCE | the GU revived (the CS-1 reference = the mirror's WEEKDAY mapped to the BATTLE week) |
| W10 | THE CS-1 BATTLE-WEEK REFERENCE | 8/21 → 9/21 (the EU's 1.1403 + 1.1425 mirrors revived) |
| W11 | THE PER-DIRECTION SUBCAP | 9 → 10/21 (4 slots per (category, direction), not 4 per category) |
| W12 | THE SPREAD=9 TUNE | 10 → 11/21 (the GU 2→5 mirrors with its FIRST HIT 1.3366 at 1.0p) |
| W14 | THE PIVOT PRIORITY (the operator's TP(N)=E(N+1) law) | the LONG pivot 1.14127 (anchor 1.14110 — the oracle's exact level) evicts the wasted 1.13830 → the EU LONG becomes 4/4 |
| W12b | THE SPREAD=4 TUNE | the EU 4/8 → 7/8 (the 1.13935, 1.14295, 1.1411 revived; the sweep 3/4/5/6 → 12/14/12/11 names 4 as the optimum) |

**V5.2 FINAL STATE:** `14/21 (DXY 6/6 · EU 7/8 · GU 1/7)` · suite `528/0` · null `0.0%` PASS · the frozen pair `912940832fac44bc…/33914c897e777540…` intact · determinism `857aaa456fe61693 ×2` · mirror `f16fd9cc` (both trees) · the container L4 verified.

**THE ROOT-CAUSE FINDINGS (V5.2's named blockers):**
- **B3 IS WRONG AS STATED.** The rung table does NOT lack rungs at the oracle's EU levels: ALL 8 have rungs within 3p (1.14110 Δ0.0p, 1.14225 Δ0.0p, 1.14295 Δ0.0p, 1.13950 Δ0.5p). The blocker is the **SELECTION + the SPREAD**, not the rungs. (For the GU, B3 IS real: the LONG levels 1.3333 and 1.3385 have NO BUY_SIDE rung within 3p — the nearest are 1.3327 (6p) and 1.3337 (4p).)
- **B2 IS REAL AND DEEPER THAN THE CASCADE.** The E2 shape cascade designates ALL FIVE EU days `PBS:SHORT` while the oracle alternates SHORT/LONG across 7 distinct shapes. **The direction imbalance originates in the E2 designation, not the mirror cascade.**
- **THE CAP-KEY FINDING.** ALL EU mirrors carry category `"Swing Scalp"` (the DXY sources are 59 Swing Scalp / 2 HTF Swing), so the SWING_SCALP_SHORT cap fills at 4 and blocks the 1.14474 candidates. The oracle's 8 EU trades span 7 SHAPES, so its cap never binds. **The mirror's category = the source's structure class, NOT the shape — the shape-keyed cap is the named next mechanism.**
- **THE TESTED-AND-REVERTED:** W15 (unconditional budget competition → 12/21, evicts hits) · W16 (shape-keyed category via shapeDay → 13/21, no discrimination) · W13 (per-pair spread — the GU cascade mirrors the EU's ACTIVE set, so changing the EU's spread changes the GU's sources; a COUPLING → reverted to global SPREAD=9).

**THE HONEST CHOICE (verbatim, the RUNNING_DEBUG_LOG):** "The W6-only 9/21 included 2 CS-1-invalid mirrors = a FITTED score (the pin's anti-derail: a constant/state kept to preserve a pass). The W7 state (8/21) is doctrinally correct: the invalid mirrors excluded, the GU alive."

---

## §11 THE MACHINERY LAYER (what a V5/V6 build consumes)

### 11.1 MDVE — THE EYES (`src/mdve/`, spec `PLUTUS_V4.4_MDVE_SPEC.md` v1.0 DESIGN LOCKED, 1,022L)
The zone engine. Sub-engines: **OB/S-D detector** (absorbs `4h-sd-lobe`, multi-TF 4H+1H+30m, formationMs added) ·
**LQZ MATRIX** (NEW `lqz-matrix.ts`: bucket ε=0.25×ATR14-1H, TouchKind 5-way, equivalence-merge, MIN_PATTERN_TYPES=2,
completeness invariant) · **BoM/MoM classifier** (piecewise-total, sweepEvent/legEstablished/consolidationAnatomy) ·
**freshness state machine** (FRESH→TESTED1x→TESTED2x→DEPLETED|VIOLATED) · **weekly narrative** · **scaffold ladder**
(union→sort→3-pip-dedup→±200p filter→cap 40) · **reaction-validity + corrected dedup** (zoneId|session|day,
OFFERED/CONSUMED state machine) · **MIRROR ENGINE** (findMirrorAnchor ±24h → buildMirror pair-native SL/TP →
cascade + emergent merge). Output: `ChartModel` per pair per week. **Contracts: MDVE_DOCTRINE 5 MathContracts**
(zone-integrity, reaction-validity, mirror-floor, output-count f(T)=24, no-fabrication).

### 11.2 VEI — THE HANDS (`src/vei/`, spec v2.0 DESIGN LOCKED, 1,033L)
`ledger.ts` (~140L, 20-action ring, sha256 fingerprints) · `truth.ts` (~260L, ViewState+hash, affine cache,
anchor coverage) · `detectors.ts` (~300L, **13 total predicates D1–D13**, fixed evaluation order, ≤3 findings) ·
`guidance.ts` (~280L, 4-part templates + coordinate injection + sitreps) · `profiles/tradingview.ts` (~180L,
prefix `tv-browser_tv_`, settle table) · `wire.ts` (~100L, the K-contract). Ladder L0–L3 with hysteresis.
**Laws: zero LLM, zero deps, guidance≠action, evidence-or-silence, fail-silent-off.**

### 11.3 PVE — THE JUDGE (DESIGN ONLY, `PLUTUS_PVE_DESIGN_SPEC.md` 218L)
**DO NOT BUILD until E3 reaches A-grade on the golden.** 21 features (A1–A8 zone 0.45 / B1–B6 geometry 0.35 /
C1–C7 context 0.20) → LLR log-odds accumulator → path simulation (P_entry_fill, P_tp_first, P_sl_first;
Law-14 walk; exact-key dedup) → P_final with shrinkage → grades A+≥0.80/A≥0.70/B≥0.60/C≥0.50 FLAG/F<0.50 REJECT.

### 11.4 TVI — THE VISUAL ENFORCER (`src/tvi/`, spec v1.0, 2,599L)
vkg (100 nodes A30/B25/C15/D15/E10/F5) → `vcm.ts` (8-phase, top-5, <2ms) → `veb.ts` (**P1–P5 BLOCK-capable
before-gates**, V1–V5 recording after-gates) → `vst.ts` (7-table bun:sqlite) → `vgs.ts` → `orchestrator.ts` →
`vld.ts` (6 patterns) + `vtm.ts` (TRUSTED>0.85/STANDARD>0.60/GUIDED). ZIP: `ZONE|8-field lines` → `parseZoneLines`
→ `verifyZone` (7 checks) → `enrichWithEngine1`. **Superseded by MDVE for identity; live for discipline.**

### 11.5 THE FRACTAL DOCTRINE (no code — the classification law, `Trident_Fractal_Architecture_FirstPrinciples_v2.3.md`, 721L)
"A MAP not a generator." 4 densities (Earth=LQZ/IP, Fire=S/D BoM/MoM, Water=shapes, Air=Fib) × 3 attack styles
(FR/Fire-precision, LR/Water-precision, FLR/Earth-heavy) + the cycle Earth→Fire→Water→Air→Earth + TF scaling +
wormholes + ladder→spiderweb + rockets as fractal amplification + trip-wire mechanics. **Law: density=WHAT, attack=HOW.**
The 4 context-bloat derailments (lazy-matching / shortcuts / fabrication / mechanic-degradation) → fresh-pipeline-per-pair, zero carryover.

### 11.6 AGENT-IN-THE-LOOP (the 7-tool pipeline, `PLUTUS_V4.5.4_AGENT_IN_THE_LOOP_ENGINEERING_SPEC.md` CME v2.0, 2,928L)
`harvest → zones(E1: T1–T6 telescoping + LMV + OBCV + lexicons 1/3/4) → [STEP A: StepADesignation, firewall
zoneId∈map + rationale≥40c+price] → shapes(E2: lexicon 5 + macro authority) → [STEP B: machine ledger T1–T7+T9
shown, agent decides T8/T10/T11, machine validates WARN W-1..W-7 + refine≤3] → setups(E3: lexicon 6,
assertProjectionContract, E3-NEVER) → gate(G1–G10) → resetContext`. **The shadow executor DELETED**; the grep gate
enforces no fetch. The failure store `chain_failures` (GROUNDING_WARN / REFINEMENT_EXHAUSTED / CONTRACT_VIOLATION / MACRO_DIVERGENCE).

### 11.7 THE SIX LEXICONS (`src/mdve/lexicons/`, spec `PLUTUS_V4.5.4_LEXICON_SPEC.md` 301L)
Machine form `TradingLexiconRule` + `TradingPatternFamily`(descriptive/suggestive/substitute/use) + classify +
enforce(A/B) + escapeHatch + escalation=3; **confidence = pos/(pos+neg+1)**. Six wirings: L1→LMV side vote ·
L2→E2 shapes · L3→E1 typing + the death-rule exemption (phantom-BoM HARD all-4) · L4→designation pressureScore +
the SL switch · L5→chain + macro authority · L6→STEP B baseline. **The ISE law (injector P2-11):** typed
PatternFamily + evidence triad + INCONCLUSIVE; the regex stays a NAMED mechanical detector.

### 11.8 THE OVERHAUL L1 (`PLUTUS_V4.5.4_OVERHAUL_L1_SPEC.md` 722L)
The build authority (SUPERSEDED as napkin by CME v2.0 which EXTENDS it). W0 state-verify → W1 E1 engines →
W2 mirror fixes → W3 lexicons → W4 shadow+WARN → W5 STEP tools → W6 E3 precision → W7 W6 gate → W8 host deploy.
Gates: tsc 0, frozen pair SHAs, diag exit 0, report determinism ×2, convergence table, wall ≤5min.

### 11.9 THE CORBELL GRAPH SUBSTRATE (`CORBELL_GRAPH_OPERATOR_MANUAL.md` 549L OPERATIONAL)
V5 = a corbell graph MAP + a compiled lexicon LAW in `shared.db` + the 10 verbs + the LSP reflex + calibration +
the 11-token engine. **The DB IS TRUTH** (snapshot = append ledger; fail-closed CORPUS_MISSING/GRAPH_EMPTY →
INCONCLUSIVE; HONEST-SILENT unbound; DETERMINISTIC byte-identical; DECLARED classification wins; DISTINCT not
rowcount). The 10 verbs: who-calls · chain-BFS64 · must-implement · unwired · rule · violations · consistency ·
semantic/code-search · docs-patterns · `--format llm` + bug-hunt (RECON MAP SCAN TRACE STRIKE REPORT).
Measured: `1940 nodes / 3647 edges`, 171 files (161 indexed + the report-v452.ts symlink), zero Checkpoints poison,
scoped rebuild 10s; 2,837 cards → predicates fp `bc6ce1a0584a` from 32 Tier-1 docs.

### 11.10 THE HEADED-BROWSER CONTRACT (contested port — record it)
**Port conflict:** the injector/Bible 4.0 §7.1 says **CDP 6930**; `T1_HEADED_CHROME_DOCKER_REFERENCE.md` (curl-verified
by the graph-tools desk) says **9333 authoritative**; Bible 4.0 Part 2 history says 9228 = Xvfb-era (dead), 9333 =
desktop default (wrong), 6930 = correct. **Resolution: verify live by `curl` before acting; the T1 doc is v2.0 and
curl-verified, the injector is v2026-09-05.** Everything else agrees: dbus → Weston 9.0 headless 1920×1080 →
XWayland :0 → Chromium 120 (ozone-x11) → the profile keepalive → the TV SPA → MCP 38 tools; **Xvfb PURGED**;
the compositor is MANDATORY; hover is NON-NEGOTIABLE (25% offset, no-hardcode, aria-label, ACK-per-frame).

---

## §12 THE LIVE TREE + THE BATTERIES

### 12.1 THE VERIFIED BATTERIES (as recorded)
| Battery | Result | Source |
|---|---|---|
| V5 suite (container) | 646 pass / 0 fail / 59,865 expects / 46 files | injector §1.9.3 (2026-09-05) |
| V5 suite (V5.1/V5.2) | **528 pass / 0 fail** (container + host, matching) | V51 MANIFEST |
| V5 suite (V6-pin baseline) | 1,195 pass / 0 fail / 119,019 expects / 84 files | V6 GOAL_PIN BASELINE |
| JESL kernel | 2 pass / 0 fail / HELLO-GATE ALL GREEN | **this session** |
| e1 lexicons | 158 pass / 0 fail (W2 GATE GREEN) | injector §1.9.6 |
| e2 machines | 138 pass / 0 fail (W3 GATE GREEN) | injector §1.9.6 |
| card consumers | 128 pass / 0 fail / 557 expects | injector §1.14.4 |
| The 15-diag battery | 8 PASS + 7 ADJUDICATED DELTAS (fixture-sensitivity + C-3B residuals) | injector §5K |
| The golden gate | 5/5 ≤3p, A1-A7 7/7, OUTCOME 4/4, G1-G10 8/10 (C-3B residuals) | injector §1.7.3 (2026-09-05) |

### 12.2 THE S-SPEC CORPUS + THE GRAPH
`specs/mpse/` S-1..S-7: 46 MathExpr → 46 predicates, fp `8acfe74f…`. `specs/e2-discharge.json` 5/5 (the D17 mutant verdicts).
`.trident/knowledge-graph/shared.db` = 126,468,096 B · 1940 nodes / 3647 edges · fp `bc6ce1a0584a`;
`rule_cards` 5,674 (2×2,837 appended); `predicates` 4,611 across TWO generations (`52b6e17419ac` + `bc6ce1a0584a`).
**READ-ONLY** (`bun:sqlite readonly`; the sqlite3 CLI is ABSENT).

### 12.3 THE FIXTURE STATE (P3-3)
`/tmp/opencode/bars_raw.json` = `RawFeed[] {pair, timeframe, bars:[{timestamp(ms),open,high,low,close,volume}], error}`
— 12 feeds (3 pairs × 4 TFs), rebuilt from REAL CSVs: `Plutus_Vibe_Agent/fixtures/weeks/2026-07-06/{1H,4H}/*.csv`
(4H = 428-432 bars/pair) + `Plutus_Air_Agent/fixtures/weeks/2026-07-06/1H/*.csv` (1H = 1,225-1,228 bars/pair).
Weeks 2026-07-13 + 2026-07-20 also on disk. **30m/15m = documented GAP** (no surviving decision-window data).
**NEVER aggregate 1H→4H to fill the gap** (forged closes). Acceptance = BEHAVIORAL, never hash-equal to a lost original.
*(THIS SESSION: the fixture is absent — the golden gate cannot run until P3-3 is re-executed.)*

---

## §13 THE OPEN QUEUE (prioritized, as the docs state it)

### 13.1 V5.1/V5.2 — the build queue
| P | Item | Done-when |
|---|---|---|
| **P0** | THE GUARD RULING (the operator) | the 76.2% floor vs the honest 38.1% scale — accept (the signal grew) or rule a targeted relaxation |
| **P0** | WAVE D — the V51_COMPARISON table | delivered (the committee doc) + the SecondOperator receipt |
| **P1** | **DECOUPLE the GU's source set from the EU's emitted set** | the GU could mirror the pre-spread EU candidates, or the DXY directly — then the EU's 5 and the GU's 1+ coexist (W13's coupling) |
| **P1** | the spread doctrine | the EU grid ~8.5p, the GU wider — a per-pair spread that does not couple through the cascade |
| **P1** | the E2 `PBS:SHORT` root (B2) | the E2 designation's all-5-days PBS:SHORT diagnosed + corrected (the direction imbalance originates in E2, not the mirror) |
| **P1** | FIX-4b depth (the offer-side chain mechanism, SC-7) | the emitted chain ≥10/18 (the pool is live but inert) |
| **P2** | the 26 non-critical firewall rules (V5.2) | restored or re-derived as lexicon predicates |
| **P2** | the 30m/15m harvest depth | one week only (the harvest seam: the TV-API + the session) |
| **P2** | the GU broker reconciliation | the OANDA-vs-CSV caveat stands |
| **P2** | Pine phase-2 render | named in the V5.2 ledger; V5.1 only constrains its shape |
| **P2** | reinforcements + per-week oracles + the GU LONG rung absence + TP saturation | |

### 13.2 V5 (injector §5J) — the doctrine queue
1. **Phase 2** — the JESL card (11 nodes) + LIVE graph R1/R2 mapping + STALE-CARD preflight + the integration test.
2. **Phase 3** — the `plutus-pipeline-jesl-test` skill body + the run script.
3. **W6** validator run · **W7** conformanceZero (pin the live graph fp) · **W8** deletions (kill-list, OPERATOR-GATED).
4. **F4** real-bars harvest — BLOCKED-EXTERNAL (TV credentials / cooldown / manual routing).
5. **C-3B residuals** — G1 EU-fortress emission + G4 DXY→EU inversion (spec:319).
6. **The V5-native generative cascade** — the 5-piece gap (bridge, injection call, Mon-Fri loop, designation-derivation, honest divergence).
7. **Kernel pass-2** — the `{ok:1}` fan-out fallback (loud-fail), the dead `!handle` branch, the NO-SEED dead token, the `Date.now` wall-clock removal, the cascade `loopDetected` swallow.

### 13.3 THE EVIDENCE_STATE PENDING ITEM
EVIDENCE_STATE (2026-08-11): "THE PENDING (the operator decision): the FULL-WEEK pipeline run (the 23-trade acceptance) — pending the operator confirmation after the outcome-timeframe explanation."

---

## §14 THE CROSS-REFERENCES + THE SUPERSESSION LEDGER

### 14.1 THE SUPERSESSION LEDGER (era → contributed → superseded-by → current authority)
| Era | Contributed | Superseded-by | Current authority |
|---|---|---|---|
| v4.2.1 remediation | doctrine/engine3/browse/backtest/firewall/LQZ-720 | v4.3 | historical |
| v4.3 build | volume restoration + anchor geometry + retry + TVI + ladder | v4.4 | historical |
| v4.4 (MDVE/VEI) | the eyes + the hands; MDVE 0dedd262 LOCKED | v4.5 | MDVE is LIVE machinery |
| v4.5 / v4.5.1 | refinement + LMV; `d6457756` the new LOCKED baseline | v4.5.2 | historical |
| v4.5.2 overhaul | telescoping / LMV / OBCV / E2-forward / cascade / RRR3.0 | v4.5.4 | the BUILD_STATE.md head still names it |
| v4.5.3 | the clean baseline (CLEAN_BASELINE checkpoint) | v4.5.4 | historical |
| v4.5.4 | the Monday-gold standard (`5/5`, 2026-08-11) | v5.0 | the EVIDENCE_STATE anchor |
| v5.0 | the "better machine with no laws" (frozen baseline) | V5.1 | `plutus-v5.0.0-full-package` FROZEN |
| **V5.1** | **the precision pass (4 gates + the null test + the week unblock)** | **V5.2** | **the checkpoint (unsealed, guard fired)** |
| **V5.2** | **the 5 landed mechanisms (14/21)** | — | **THE CURRENT BUILD (the RUNNING_DEBUG_LOG)** |

### 14.2 THE DOCUMENTED CONFLICTS (surface them before deciding)
1. **THE ANCHOR:** `ANALYSIS_POINT_MS 1783317600000` (Mon 06:00 UTC, pre-London — the injector §1.6, R30) **vs** `1783702800000` (Fri Jul-10 17:00 ET — the v4.5.4-era EVIDENCE_STATE / the forensics desk; the injector calls this DEAD, the I-4 lesson). **The eras differ; the current doctrine value governs.**
2. **THE BROWSER PORT:** 6930 (injector / Bible 4.0 §7.1) vs 9333 (T1 v2.0, curl-verified). **Verify live.**
3. **THE INJECTOR ROOT PATH:** absent → the real tree (the drift ledger §0).
4. **THE STATE-DOC HEAD:** BUILD_STATE.md heads at the v4.5.2 era (2026-08-04) — stale vs the newer evidence.
5. **THE RRR STACK:** 1.0 (legacy flat) → 1.5-2.0 (category, v4.5.3) → 2.5 (D-R1 floor) → 3.5 (the week standard) → 4+ (B10 target) → 5.7 (a ticketed min). **Newest governs: floor 2.5, target 4+.**

### 14.3 WHAT AGREES (the stable spine)
The frozen pair · the 3-pip tolerance · E1→E2→E3 linear-no-override · D98 cascade · E2-designates-E3-obeys ·
the ladder-steps SL · the strength-edge TP · the chaining law · the 3-attempt refinement · R29 zone-anchored ·
the oracle isolation (D13) · the behavioural (never hash-equal) fixture acceptance · the determinism ×2 baseline.

---

## §15 THE READING ORDER + THE RESUME SEQUENCE (for a fresh session)

**THE CORPUS READING ORDER (injector §26):** Bible 4.0 → Bible 4.5 → GOLDEN-23 → DEEP-FIX-CODEX → E2-CASCADE-SPEC →
ANCHOR-DOCTRINE → MDVE → TVI → PVE → TELESCOPE(TTE-ENG).

**THE 6-CHECK STATE VERIFY:** the frozen-pair SHAs · `tsc 0` · `bun build` 0 · sha ×2 determinism · the golden count · the container hash.

**THE 8-RULE DISCIPLINE:** tsc+build before any claim · sha ×2 after every change · 3-pip-only acceptance · the
frozen list honoured · checkpoints at every gate · loud-fail everywhere · the quote law · the audit-own-stats law.

**THE RESUME SEQUENCE:**
1. Verify: the frozen pair SHAs (must be `91294083…`/`33914c89…`), `bun test src/jesl/` green, the golden gate 5/5 (reconstruct the fixture via P3-3 first), BUILD_STATE's tail = the current era.
2. Read the injector §0→§6 in order; then the v5.1 package's `00-INDEX` → `01-DISCOVERY` → the DPL1 §1-§7 → the MASTER_BLUEPRINT §1/§7/§9.
3. Read `packages/plutus-v5.1/RUNNING_DEBUG_LOG.md` tail (the V5.2 state: 14/21) + the newest checkpoint's `V51_COMPARISON.md`.
4. Read `context_management/POST-COMPACTION_PROMPT.md` + the DECISION_CHAIN's D98/D101.
5. **The first task:** the GUARD RULING (operator) → then the GU-decouple (P1) → then the E2 PBS:SHORT root (P1) → then FIX-4b (the chain).

**THE PATHS (the V5 operating table):**
| Path | What |
|---|---|
| `report-v452.ts` | THE canon pipeline entry (1,719L; loadFixture :364, buildE2Core :1050-1225, runChainV452 :1244) |
| `src/brains/shape-brain.ts` | the E2 machinery (3,311L; injectShapeSequence :3308, buildShapeChain ~:3099) |
| `src/mdve/mirror.ts` | the E3 anchors + cascade (cascadeV45, reAnchorMirror, selectPairNativeZone, computeLmvTP) |
| `src/mdve/{sl-lmv,trade-dedup}.ts` | **THE FROZEN PAIR** — byte-identical law |
| `src/pipeline/golden-gate.ts` | GOLDEN_ORACLE :43-47 · ORACLE_TOLERANCE_PIPS=3 :50 · G1_ENTRY_TOLERANCE_PIPS=2 :52 |
| `src/jesl/` | THE TEST KERNEL (registry/executor/journal/nodes/errors/types/index/hello.test.ts) |
| `packages/plutus-v5.1/` | **THE V5 BUILD PACKAGE** (10 files, 174KB) |
| `Checkpoints/v5.1-gates-wired-guard-fired-draft/` | the newest checkpoint (2026-09-26, unsealed) |
| `.trident/knowledge-graph/shared.db` | 126MB · 1940n/3647e · fp bc6ce1a0584a (READ-ONLY) |
| `context_management/{BUILD_STATE,DEBUG_LOG,DECISION_CHAIN}.md` | the canon docs (APPEND-ONLY) |
| `/tmp/opencode/bars_raw.json` | the reconstructed golden-week fixture (P3-3 — currently ABSENT) |

<!-- V5-SYNTHESIS-COMPLETE -->

---

## §16 THE ANTI-PATTERN LEDGER (P2-1..P2-12 — the trap vs the worked fix)

Each pair = the trap (observed, with its failure mode) vs the worked fix. Converted to law.

**P2-1 THE TEST-MACHINE ARCHITECTURE (the real-week-runner incident).** *WRONG:* a test runner executing 3 pairs
INDEPENDENTLY and running the cascade as a post-hoc VERIFIER (`real-week-runner.ts` — divergenceScore hardcoded 0,
`injectShapeSequence` never called) → D98 violated; the machine tested a DIFFERENT pipeline. *CORRECT:* the test invokes
the CANON entry (`report-v452.ts`) which performs the real generative cascade. *LAW:* the test machinery wraps the PRODUCTION entry; it never re-implements the production flow.

**P2-2 THE FIXTURE ACCEPTANCE CRITERION (the hash-equal trap).** *WRONG:* demand the rebuilt fixture hash-match a lost
original → "F4 data unavailable" paralysis while the REAL data sat in sibling agents' fixtures. *CORRECT:* acceptance is
BEHAVIORAL (golden 5/5 ≤3p + outcome + determinism ×2 + frozen pair). *LAW:* acceptance = does the BEHAVIOUR reproduce, not does the byte-stream match a ghost.

**P2-3 THE PREMATURE-COMPLETE BELIEF (the phantom war).** *WRONG:* read the wave-manager toast `COMPLETE — all 0 agents
returned` as evidence; conclude the channel is broken; stall or kill live agents → 5 phantom misdiagnoses across 2 sessions.
*CORRECT:* D101 — GENERATE → IGNORE the toast → READ the session streams → the agents are mid-work → harvest on TRUE completion + return-integrity (truncation signals = KICK). *LAW:* the observable state (stream, disk, artifacts) is the only truth; tool self-reports are claims.

**P2-4 THE SPEC-OVERWRITE PANIC (DEFECT A).** *WRONG:* on the 31-error template-validation refusal, assume the roster was
lost, rewrite the spec, or abandon the channel. *CORRECT:* the overwrite hits ONLY the session-scoped path
(`wave-spec.ses_<id>.json`) — the plain path SURVIVES; `cp` → re-fire; the refusal burns ZERO budget. *LAW:* check the disk state before believing a destructive claim.

**P2-5 THE PRICE-ANCHORED SELECTION (R29).** *WRONG:* select/emit levels by proximity to a hardcoded price → the machine
sees different zones than the operator on the SAME chart; golden misses at Δ14.9p/Δ16.5p while the map held the right levels.
*CORRECT:* ZONE-ANCHORED only — selection walks the zone/rung structure (zones and rungs ONE pool, rung-direct as tiebreak
only). *LAW:* "NOTHING SHOULD BE PRICE ANCHORED EVER… ZONE ANCHORED."

**P2-6 THE CASCADE-AS-VERIFIER MISREAD (B2/B3).** *WRONG:* treat the cascade as a signal the pair-specific output is checked
against post-hoc, or skip pair-specific E1 and translate directly → the receiving pair gets zones from the WRONG element table.
*CORRECT:* "E2 DESIGNATES, E3 OBEYS… CORE = E1 strength based. CASCADE = structural equivalent." The cascade TRANSLATES the map
to the receiving pair's OWN E1 zones (element-matched); divergence ≤ 0.35 is the leash. *LAW:* run the receiving pair's E1 FIRST; translate into its zones; validate; never emit raw donor zone-ids.

**P2-7 THE SIDE-INVERSION BUG (D50).** *WRONG:* one designation (`keyZoneId`) consumed for both trade directions → the LONG
mirrors anchor on the supply; the SHORT geometry collapses. *CORRECT:* direction-appropriate at EVERY layer (LONG→demandZoneId,
SHORT→supplyZoneId). Measured: the golden 10 → 12/21 with the EU #4 Δ0.7p. *LAW:* the mirror's side = the trade's direction, resolved through the zone-side inversion.

**P2-8 THE EVAL() SHORTCUT (the math-eval design).** *WRONG:* implement expression evaluation with `eval()`/`new Function`
because "it's internal" → a card is DATA; any file that can write the card can execute arbitrary code; tamper-evidence dies.
*CORRECT:* the safe recursive-descent parser (`src/jesl/nodes.ts` math-eval): tokenize → parse → evaluate with a whitelist
(abs/sqrt/min/max/round/floor/ceil), vars from config + inbound, NON-FINITE and BAD-EXPR as loud FAILs. Zero eval surface.
*LAW:* data-driven computation is interpreted by a whitelist engine, never by the host evaluator.

**P2-9 THE FLOAT-EXACTNESS SLOP (the RRR-test lesson, 2026-09-05).** *WRONG:* assert `abs(1.1411-1.141)/abs(1.141-1.1407) == 1/3`
within 1e-9 → float64 cancellation on decimal FX arithmetic (~1e-4) → a FALSE test failure masking real regressions.
*CORRECT:* prove the ENGINE with exactly-representable values (powers of two) + assert the realistic case at the honest bound
(`|v − 1/3| < 1e-3`). *LAW:* binary-exact assertions only on binary-exact values.

**P2-10 THE REFERENCE-ALIASING TAMPER TEST (the SC-10 lesson).** *WRONG:* `const saved = row.evidence; mutate(row.evidence); row.evidence = saved`
— the saved reference IS the mutated object; the "restore" writes the tampered state back. *CORRECT:* capture the PRIMITIVE
(`const state = row.evidence.state`), mutate, assert `verified:false`, restore the primitive, assert `verified:true`.
*LAW:* save/restore around in-place mutation copies primitives, never references.

**P2-11 THE REGEX-SLOP TOWER (the ISE law).** *WRONG:* a "classifier" that is 8 regex bodies with a name and no types →
Order-1 triage wearing intelligence's uniform. *CORRECT:* the PatternFamily (typed members) + the evidence triad
{Pattern, State, Evidence: node+file:line} + the fail-state INCONCLUSIVE. The regex stays a NAMED mechanical detector.
*LAW:* detection may be mechanical; classification must be typed; a finding without its evidence triad does not exist.

**P2-12 THE FROZEN-CONSTANT SL / FIXED PIP (R24/R25).** *WRONG:* SL = entry ± N pips (a constant) → "the market will eat fixed
const garbage alive" — volatility eats the tight ones, waste eats the wide ones. *CORRECT:* the SL = the ladder geometry
(3p outside the entry step's far edge OR 1-2p inside the next step's close edge), a MEASURED quantity per trade; the ceiling 36p
is the only constant. *LAW:* constants bound the geometry; the geometry sets the level.

---

## §17 THE TROUBLESHOOTING MATRIX (the 26-row diagnostic table)

| # | SYMPTOM | CAUSE (mechanism) | FIX |
|---|---|---|---|
| 1 | `buildChartModel` throws; spot = 0 | the fixture lacks 4H bars | run P3-3; the fixture-guard gate catches it as FIXTURE-GAP |
| 2 | golden convergence < 5/5 | an E3/E2 change shifted anchors; or the fixture changed | systematic-debug: which of the 5 anchors moved, Δ pips each; fix the ROOT, never the tolerance (R33 stays 3) |
| 3 | G1/G4 failing | the documented C-3B-era residuals | NOT a regression — the spec:319 wave's scope |
| 4 | report sha differs between 2 runs | nondeterministic source input (Date/time/env) in the computation path | hunt the wall-clock/env read |
| 5 | frozen-pair sha mismatch | someone edited `sl-lmv.ts`/`trade-dedup.ts` | **CRITICAL STOP**; restore the byte-exact file; identify the writer |
| 6 | GU emits trades in the wrong direction context | the cascade side-inversion consumed ONE designation (D50) | direction-appropriate consumption at EVERY layer |
| 7 | divergence > 0.35 | the pair-specific E2 drifted | `applyDivergenceFlip` AND investigate the drift |
| 8 | `wave-spec` validation: 31 placeholder errors | DEFECT A — the manager template-overwrote the session-scoped spec | `cp` the plain roster → the scoped path; re-fire |
| 9 | wave toast `complete, agents:[]` | D101 — the toast is premature cosmetic noise | READ the session streams |
| 10 | `task_status` blocked / says cancelled for a live desk | `task_status` is FIREWALL-BLOCKED | `trident-wave-read sessionId` — the stream is the only liveness truth |
| 11 | `bun test src/` shows 2 Checkpoints errors | bun root-discovery globs `Checkpoints/*/src/`; the LOCKED copies import `./temporal.js` | pre-existing, UNTOUCHABLE; use `bun test $(find src -name "*.test.ts")` → 662 pass / 0 live fails |
| 12 | container Effect version drift | the container resolved its own Effect | `effect@4.0.0-beta.74` PINNED in package.json |
| 13 | `[JESL CAP-UNBOUND] node=X field=shell` | the node requires a cap the runner did not bind | run with `boundCaps` including the cap |
| 14 | `[JESL CHANNEL-UNSET] deadlock` | an inbound via-name nothing writes | fix the `edge.via` name or seed the channel |
| 15 | `[JESL CYCLE] … stalled` | a dependency cycle, or a genuine stall past `RUN_DEADLINE_MS=60000` | fix the graph |
| 16 | `verifyChain` false on a fresh journal | tampering (or a buggy writer) | locate `brokenAtIndex`; NEVER consume a corrupt replay |
| 17 | `journal-sink` throws CAP-UNBOUND field=journal | the node ran under a bare handle | run under Executor |
| 18 | math-eval FAIL NON-FINITE on 1/0-style | division by zero / overflow — by design | the expr needs a guard; NON-FINITE is the loud state |
| 19 | math-eval FX ratio off ~1e-4 | float64 cancellation | round to pips BEFORE dividing |
| 20 | gate FAIL BAD-ASSERT | config defect: unknown op, malformed `$.path`, empty asserts | fix the CARD config |
| 21 | LSP reports .ts errors bun test passes | LSP strictness ≠ runtime | triage LSP noise separately |
| 22 | tvdatafeed / TV fetch dead | npm 404 + PyPI gone + GitHub deleted; WS host rate-limited | BLOCKED-EXTERNAL: needs credentials / cooldown / manual provisioning |
| 23 | doc write rejected "under-specified" | the DOC DENSITY GATE floor | assemble via bash heredoc appends; finalize with DOC-COMPLETE |
| 24 | golden gate passes but the diag battery < 8 | the battery is fixture-sensitive | re-run P3-3 + adjudicate each fail |
| 25 | a subagent claims done but the disk is unchanged | phantom completion | the audit: stream complete + return intact + DISK CHANGE |
| 26 | rate limit / 429 / stalled retries | provider quota | SWITCH THE MODEL immediately (the two-step /models procedure) |

---

## §18 THE GOLDEN ORACLE (the 23 trades + the 7 LQZ levels)

### 18.1 THE MONDAY 5/5 ORACLE (tolerance 3 pips, R33)
`DXY SHORT 101.14` · `DXY LONG 100.945` · `EU SHORT 1.14395` · `EU LONG 1.14110` · `GU LONG 1.33330`.
`GOLDEN_ORACLE TS shape` (`golden-gate.ts:43-47`): `Record<PairKey, Array<{dir: Direction; entry: number}>>`, `PairKey = "DXY"|"EUR/USD"|"GBP/USD"`.

### 18.2 THE GOLDEN-8 DXY (E/SL/TP/RRR)
| # | Day | Dir | E | SL | TP | RRR |
|---|---|---|---|---|---|---|
| 1 | Mon | SS LONG | 100.945 | 100.905 | 101.115 | 4.25 |
| 2 | Mon | BS SHORT | 101.14 | 101.200 | 100.845 | 4.92 |
| 3 | Tue | R LONG | 100.845 | 100.77 | 101.190 | 4.60 |
| 4 | Wed | SS SHORT | 101.19 | 101.25 | 100.975 | 3.58 |
| 5 | Wed | RWL LONG | 100.975 | 100.905 | 101.240 | 3.79 |
| 6 | Wed | BS SHORT | 101.235 | 101.330 | 100.680 | 5.84 |
| 7 | Thu | ladder | — | — | — | — |
| 8 | Fri | WL+RWL continuation | — | — | — | — |

### 18.3 THE EU 8 (E/SL/TP)
`1.14395/1.14485/1.14110` · `1.14110/1.13990/1.14460` · `1.14460/1.14560/1.14020` · `1.14020/1.13970/1.14295` ·
`1.14295/1.14330/1.14000` · `1.13935/1.13850/1.14475` · `1.14225/1.14165/1.14555` · `1.14555/1.14540/1.14165`.

### 18.4 THE GU 7 (E/SL/TP)
`1.33330/1.33250/1.33965` · `1.33965/1.34065/1.33330` · `1.33660/1.33740/1.33275` · `1.33280/1.33190/1.34270` ·
`1.34260/1.34365/1.33850` · `1.33850/1.33760/1.34500` · `1.34500/1.34625/1.33960`.

### 18.5 THE 7 GOLDEN LQZ LEVELS
`100.845 / 100.945 / 100.975 / 101.14 / 101.19 / 101.235 / 101.240` (spacings 10.0 / 3.0 / 16.5 / 5.0 / 4.5 / 0.5p).

### 18.6 THE KEY REASONING PATTERNS
`E = trade #N's TP (chaining)` · `3rd mitigation → far edge` · `fortress at the 5th → RWL` · `fib 0.618/1.618 confluence (E4, deferred)`.

---

## §19 THE DOCTRINE QUOTES (long-form verbatim — the ones that anchor everything)

1. **A1 (E3=result):** "E3 is a natural RESULT we ARRIVE AT from E1 + 2 being done properly. It becomes very [profane] obvious when E1 + E2 are done correctly… 90% of the work is in E1 + E2."
2. **A2 (linear):** "Previous engine data PROVIDES THE STRUCTURE FOR the next one. Next engine's data MUST FIT WITHIN THE CONSTRAINTS of the previous engine's data architecture this is absolutely non negotiable."
3. **A4 (liquidity):** "S/D are the pressure zones, LQZ are the fuel zones… The candles eat the liquidity in front of the S/D and in doing so the S/D (and its internal nested liquidity) is protected from mitigation and thus has a longer lifespan."
4. **A5 (ladder SL):** "you need to look at the zones like ladder steps."
5. **B6 (TP):** "STRUCTURALLY EQUIVALENT not this [nonsense] of false metrics like nearest or strongest."
6. **B10 (RRR):** "MINIMUM 3 RRR NOTHING LESS IS ACCEPTABLE… ALL MY TRADES ARE 4+."
7. **A14 (fib):** "YOU WILL 1000000% DERAIL INTO [slop] IF YOU DO FIBONACCI WITHOUT A SOLID FOUNDATION."
8. **A15 (scaffold):** "The agent/codebase must be able to self validate based on RULES and LOGIC not a hardcoded data set… not some [dumb] pattern matching slop that breaks in any real market scenarios."
9. **D63 (slop):** "how many other dumb… hardcoded rules like this are derailing and infecting the codebase?… EVERYTHING should now be tangible Lexicon filters + MPSE engines with 0 dumb degenerate garbage anywhere."
10. **D7 (shadow):** "we are replacing all shadow agent steps with the proper primary agent so that we can accurately see what is happening… the shadow agent was a cheat basically."
11. **D63-temporal:** "In the 1H before london session starts is when i manually do all my analysis and setup my trades for the day and then close the charts and the prices action just fills my limit orders and hits TP/SL accordingly. That's what this pipeline needs to replicate."
12. **D101 (channel):** "GENERATE WORKS FINE. IGNORE THE PHANTOM COMPLETE. GENERATE AND READ. IGNORE THE COMPLETION MESSAGE. EVERYTHING WORKS FINE."
13. **R33:** "golden tolerance 3 pips after EVERY change — not 30, not 10, THREE."
14. **A16 (cascade proof):** "Everything I found on this EU chart maps 1:1 to DXY EXACTLY simply in the inverse direction… i will bet my life on it."

*(Source anchors: `PLUTUS_MASTER_CONTEXT_INJECTOR.md §5I` for every quote above; `PLUTUS_E1_E2_E3_MACRO_CONTEXT.md` for A1-A16; `Bible4.5` for B6/B10; the DECISION_CHAIN for D7/D63/D101.)*

<!-- V5-SYNTHESIS-EXTENDED -->

---

## §20 THE E1 DEEP MECHANICS (the pressure machinery at scoring depth)

### 20.1 THE ZFP POST-PROCESSOR (Pillar 9 — the pressure ladder)
`ZFP = P(institutional defense fails before momentum exhausts)`. **Base by wall class:** Hard 5-15 / Standard 15-30 /
Soft 30-50 / One-Touch 50-70 / Post-Expiry Ghost 20-40 / LSZ special (breach-then-reverse). **Modifiers:** expiry timing
+20-30 · macro against +15-25 · momentum building +10-20 · cross-pair +15-25 · cascade (zone above broke) +20-30 · EMA200
regime cross +15-25. **`>45 = BREAKOUT (SS→BS)`; `<20 = HARD WALL (BS→RWL)`.** Measured Move = `Breakout_Point + Range_Height`.
**Pressure step-function:** 12-14 EXTREME <10% · 10-11 HEAVY 10-25 · 8-9 MOD-HEAVY 20-35 · 6-7 MOD 30-45 · 4-5 LIGHT 40-60 ·
0-3 MINIMAL >60. **The 7→8 step shifts ZFP 10-15% — worth MORE than 11→12 (5-10%).**

### 20.2 THE LMV MATRIX (the rung universe)
The candle-matrix rung detector: bucket ε=0.25×ATR14-1H; neighborhood 1; prominence 1p; cluster 2p; span 4p; ≥3 points;
≥2 windows; EPS 0.25 ATR; quantum 1p; the zfp ladder. **The matrix → zones bridge** is the LMV's job; the modal-cluster
emission + the 1p dedup are the resolution mechanisms. **The golden-LQZ oracle state: 3/7 at ≤1p (100.849 Δ0.4, 100.949 Δ0.4,
101.130 Δ1.0); the other 4 fail via the resolution mechanisms — the telescoped runs + modal emission + 1p dedup are the fix.**

### 20.3 THE TELESCOPING (T1-T6 — the HTF→LTF refinement, the #1 macro-derailment root cause)
`T1` the LQZ TF-parameterize (sweep-lookback 1H 24 / 30m 20 / 15m 30 · wick 5/3/2 · sharp 15/10/6 · align 3/2/1) ·
`T2` the 4H→1H nesting (containment + refinedLabel + dual +3 / triple +5) · `T3` the 1H→30m minor · `T4` **the origin-TF gate
(30m → MoM forced; `isBoM = tf∉{30m,15m}`)** · `T5` the LQZ 1H→30m→15m · `T6` the snapshot merge.
**Telescoping was COMPLETELY ABSENT in the live engine** (the live = 4H-S/D + 1H-LQZ hardcoded '4H' `engine.ts:465`; MDVE =
independent 4H+1H+30m no cross-TF; the ONLY telescoping = dead legacy :3021-3179; 15m harvested-used-by-nobody; bom-mom
TF-agnostic = a 30m BoM possible TODAY = doctrine violation). **The #1 root cause of ALL macro derailments.**

### 20.4 THE ZONE-PRESSURE ROUTING + THE FRESHNESS MIRROR
The event-driven router (`zone-pressure-machine.ts:70`; router :59, guards :114/:153) with the 4H-never-death rule.
The freshness mirror (`freshness-machine.ts:47`): the pressure state mirrors the mitigation ladder
(UNMITIGATED→SOFTLY(1)→MITIGATED(2-3)→HEAVILY(4+, ineligible)).

### 20.5 THE BoM DECISION TREE (the origin classifier)
`isImpulse = body ≥1.5×μ_body(prev4) ∧ |c−o| ≥1.5×ATR ∧ D≥θ_t ∧ structureBroken`; θ 4H 50p / 1H 30p / 30m 15-20p.
`zone = [origin.low, origin.high]` (FULL, never the impulse). The prior classifier (NONE dwell ≤0.5 ATR / OPPOSITE / SAME via
signed sums; L 18/36/24, ε 0.5, θ 0.25) → **BoM = NONE|OPPOSITE ∧ bw≥3.0 ∧ bf≥0.65 ∧ widthGate**; MoM = SAME.
**The zfp BoM 10/18/32/65, MoM 65/22/38/70.** Invariants: partition (no double-count) · nesting (the containment DAG) · width (the TF gates).

### 20.6 THE 5-TOOL ORCHESTRATION + PipelineRunContext
`PipelineRunContext` (module-level shared state via `ensureContext(weekStart)`): `weekStart`, `temporalAnchor`,
`harvestData{ohlc 4H, ohlcByPairTf, spots, optionsDateLink}`, `zoneMapSnapshot`, `shapeSnapshot`, `screenshots[]`,
`validatedZones[]`, `errors[]`, `setupCounter`, `manualStepOutputs`. `resetContext()` at T5 end. **Context-lost = restart from T1.**

---

## §21 THE MODULE INVENTORY (the canon E1/E2/E3 line — status)

| Module | Purpose | Status |
|---|---|---|
| `src/mdve/mirror.ts` | the E3 anchors + cascadeV45 | the D37-era overhaul target; canon |
| `src/mdve/setup-gen.ts` | the DXY source lane | SOLID (the DXY 6/6 era) |
| `src/mdve/cascade-translation.ts` | structural-equivalence translation | SOLID |
| `src/mdve/refinement-machine.ts` | the 3D refinement | the per-anchor 3-attempt machine (ZR-3.5) |
| `src/mdve/{lmv,lqz-matrix}.ts` | the LQZ rungs + matrices | MUTABLE PROTOTYPES |
| `src/mdve/{ob-engine,bom-mom,obcv,freshness,lqz-lobe}.ts` | the E1 substrate | HONEST canon |
| `src/mdve/lexicons/` | the six lexicons | BUILT (W4) |
| `src/brains/9-pillar-lobe.ts` | the E1 9 pillars | WIRED |
| `src/brains/shape-brain.ts` | the E2 brain + `injectShapeSequence` | **THE generative core** |
| `src/pipeline/engine.ts` | the 5-tool chain + STEP A/B | FROZEN w/ documented exceptions |
| `src/vei/` | the hands (13 detectors) | DESIGN LOCKED, build status per module |
| `src/pipeline/golden-gate.ts` | the 3-pip oracle | FROZEN (the oracle isolation law) |
| `src/jesl/` | the test kernel | **PHASE-1 GREEN (8 kinds, sha256 journal, exactly-8 tokens)** |
| `src/e1` / `src/e2` / `src/card` / `src/kernel` | the V5 verification machinery | W2/W3 GATE GREEN (158/0, 138/0, 128/0) |
| `src/rules/doctrine-rules.ts` | the V5.1 rule layer (CS8/CS11/CS18/AD8) | **BUILT (V5.1)** |
| `42 diag-*.ts` | the regression suite | 8 green + 7 adjudicated deltas |

**THE FROZEN LIST (byte-identical through every era):** `sl-lmv.ts` `91294083…` · `trade-dedup.ts` `33914c89…` ·
`lmv 77e56cd0` · `engine 3deb2814` · the harnesses `454b8abc`/`ce975356`/`a4dc01c1`/`f8ed6b20`/`2006ce2e`.

**THE 5 CRITICAL BUGS (Bible 4.0:4034-4180):** SL-inside-zone (the fixed-buffer proof: a 10.7p zone + 8p buffer put the SL INSIDE
the zone) · overtrade/day · Asian-fill kills (session-decorative → liquidity-conditional) · rocket-edge A-vs-B · LSZ-mandatory
(84% false-reject). **THE META-LAW:** every silent-degrade survived because nothing asserted the negative — the firewall's
FORBIDDEN codes + the JESL gates exist because of THIS ledger.

<!-- V5-SYNTHESIS-FINAL -->

---

## §22 THE CONTAINER STACK + THE FIREWALL + THE CONTAINER TEST

### 22.1 THE L0-L9 STACK
```
L0  Docker (--init, host-net)
L1  dbus session bus
L2  Weston 9.0 headless 1920x1080 (+ xwayland.so)
L3  XWayland :0   (verify /tmp/.X11-unix/X0)
L4  Chromium 120  (--no-sandbox --disable-gpu --remote-debugging-port=6930
                   --remote-debugging-address=0.0.0.0
                   --user-data-dir=/tmp/tv-browser-profile --keep-alive-for-test + anti-throttle)
L5  TradingView SPA (WebGL canvas)
L6  chrome-watchdog.sh &  (167L, 10s dual-check)
L7  TV Browser MCP (36-38 tools, stdio/CDP)
L8  Plutus plugin (9 tools + 4 hooks)
L9  opencode plutus agent
```
**THE WATCHDOG (167L, 10s dual-check):** HTTP `/json/version` (catches full crash) + WebSocket `Runtime.evaluate "1+1"`
(catches **ZOMBIE Chrome** — process alive, renderer dead, commands dropped). Self-heal: `pkill -9` → display from `weston.log`
→ relaunch identical flags → 30s readiness (15×2s) → max 5 restarts then 60s cooldown.
**LOGIN PERSISTENCE:** the profile bind-mounted `/tmp/tv-browser-profile`; `Default/Cookies` SQLite holds the TV auth;
survives restarts; verify by body-text absence of "Look first"/"Join for free".

### 22.2 THE 36-38 MCP TOOLS
Browser Control 5-6 (desktop/container/screenshot/reset-PANIC/get_state/navigate) · Input 7 (click/double/right/drag/scroll/type/press_key 60+ VK) ·
High-level 1 (value_overwrite = dblclick select-all + type) · Drawing 6 (long/short position, fib retracement diagonal anchors,
rectangle, trend line, horizontal) · API Drawing 3 (`tv_list_drawings` via `_exposed_chartWidgetCollection` — ids + exact price/bar coords,
no pixel hunting) · Navigation 8 (zoom, canvas_pan safe-drag 12-point probe, canvas_zoom at price/time, set_timeframe 1m-1W toolbar-first,
get_view, find_empty_area, navigate_to intents, refine_element_coordinates) · Price Mapping 2 (`find_price_y` via priceScale).

### 22.3 THE 67 FIREWALL RULES + THE ANTI-FABRICATION 3-LAYER
**67 semantic rules** (ZT/CS/RRR/SL/PROX/BE1-12) + the `isReportGeneration` mode flag (ZT-2/5/8/9/12 skip in report mode — they govern
live positions). **THE 3-LAYER ANTI-FABRICATION (T2/T5 per pair):** (1) `fs.access` on the screenshot — unbypassable;
(2) VLM YES/NO "is this an options expiry table?"; (3) price-regex `\d+\.\d{3,}` + generic-string reject (len<20, 'zone confirmed'-class).
**The v4.5.3 rule layer = 30 rules** (`grep "^  id: '" = 30`); the four that map to the measured defects: **CS8** SL must not exceed
the cap · **CS11** max 3 setups per category per pair · **CS18** no zone gaps between entry and TP · **AD8** entries within max distance from spot.

### 22.4 THE CONTAINER TEST (S1-S7, 2026-09-05 — all PASS)
`S1` full battery 646/0/59,865 · `S2` the G3 runner in-container (5/5 Monday + determinism; exit 1 by design on synthetic bars = D102) ·
`S3` multiweek 12/12 · `S4` frozen pair in-container · `S5` spec gate · `S6` harness 23/0 incl. the D13 oracle-mutation isolation ·
`S7` adversarial `loadCard("{CORRUPTED")` → TYPED `CARD_JSON_CORRUPT` (no silent accept).
**Deployment law:** dist sha host==container verified; `effect@4.0.0-beta.74` PINNED (the drift lesson); data files + `profile.yaml` transferred explicitly.
**Container name:** `plutus-v5-ct-20260905`.

### 22.5 THE REPORT + THE OUTPUT CONTRACTS
The weekly report: ONCE per week, 36 sections, calendar + Pine-v6, BE-gated. The W6 report-port targets 52 rules / 25 sections
(the Leviathan template) — the validator is the rules-table row count. **The VLM zone-line protocol:** `ZONE|type|top|bottom|tf|BoM/MoM|conf|evidence`
pipe-lines (≥7 parts; supply separately from demand) — the only sanctioned VLM→data channel; JSON-only response, temp 0.0.
**The deterministic scaffold law:** the scaffold contains ZERO golden-week content; determinism lives in the COMPUTATION.

---

## §23 THE OPERATOR PROTOCOLS (the human procedure the machine replicates)

**THE E1 READ (7 steps):** 1 open the 4H, identify the S/D origins (singular-candle rule: full high-low incl. wicks) ·
2 classify BoM (prior NONE/OPPOSITE) vs MoM (prior SAME) · 3 check mitigation state (0-5 ladder) · 4 find the LQZ shields
(1H/30m) in front · 5 score the pressure (6-dim + ZFP) · 6 mark the operative defense (the freshest strong structure) ·
7 only NOW look at 1H/30m refinements (**telescope DOWN, never up**).
**THE E2 READ (6 steps):** 1 read the week's shape chain on 4H · 2 name the current shape by the anatomy table · 3 apply the
TARGET-ZFP matrix · 4 build the storyline (7 parts: current shape, contested pressure, projected next, break-validation,
strength comparison, macro arc, warframe) · 5 check the energy (70-80/20-30, the recharge ratio) · 6 project tomorrow's shape + the DayBand.
**THE E3 CONSTRUCTION (7 steps):** 1 the E2 designation names the zone · 2 the entry = the LQZ edge (shape-driven: RWL/R deep,
SS/BS near) · 3 the SL = the ladder rule · 4 the TP = the opposing zone's edge by strength (close+spread if strong-and-fresh,
far if weak-or-3rd-mitigation-imminent) · 5 compute RRR (consequence, never target) · 6 the chaining check (E = prior TP) ·
7 the refinement loop (3 attempts per anchor before any hard reject).

**THE RISK FRAMEWORK:** 3-5% risk per trade (10% high-conviction) · 15% max day drawdown · EOD close · the weekly PnL review ·
**the 30-50% dollar-cluster rule:** if 30-50% of the open risk sits in one correlation cluster (short-EU + short-GU + long-DXY = ONE
dollar bet counted three times), cut to the strongest single expression. **EU/GU/DXY mirrors are ONE trade wearing three pairs** —
the floor checks count SETUPS; the risk engine counts EXPRESSIONS.

**THE 8-PATTERN CATALOG:** 1 SS→BS the breakout · 2 the scalps (virgin-LQZ first-strike, London) · 3 R→BS/WL the transition ·
4 BS→R→RWL the failed-breakout reversal · 5 PBS→R→WLS the post-surge consolidation · 6 R→WL the snap-back · 7 WL→RWL the violent
reversal (0 recovery) · 8 the ladders (LL/FLR/FR rockets, 25-30× combined).

<!-- V5-SYNTHESIS-1000 -->

---

## §24 THE MONDAY-GOLD CHECKPOINT + THE TWO-ERA TRUTH (the live-state retry's additions)

### 24.1 THE MONDAY-GOLD CHECKPOINT RECORD (verbatim, root `EVIDENCE_STATE.md`)
`Checkpoints/v4.5.4_MONDAY_GOLD_STANDARD_ACHIEVED/` = the src (hash-verified: **ADM `e9d696d4` · chain `a639d8d5` · mirror `fc59a5c3` · battery `5a06ce11`**)
+ the L2 spec + the TTE report + the wave audits + the MANIFEST.
**THE ACCEPTANCE:** the golden gate **5/5 at ≤3p** (G1-G10 10/10 + A1-A7 7/7) + the **OUTCOME 5/5 wins (net +17.84R)** — EXIT 0 —
the determinism **`0bbab1f7eb52e915`** (parallel = sequential = run1 = run2).
**THE MACHINE'S EMITTED CONVERGENCE (vs the oracle, ≤3p):** DXY L `100.918` Δ2.7p · DXY S `101.120` Δ2.0p · EU S `1.14390` Δ0.5p ·
EU L `1.14095/1.14120` Δ1.0-1.5p · GU L `1.33343` Δ1.3p · GU SHORT REJECTED.
**THE DIST:** `a6383b6587f95f6d4352bb4176f397b9320ea8e951565b4ee994319c9aedd6cf` (1.42-1.43MB, 163-164 modules).
**THE ANCHOR:** `1783317600000` (pre-London).

### 24.2 THE TWO-ERA TRUTH + THE DOC-FRESHNESS RANKING (verbatim, the retry)
**Two eras:** (a) the **v4.5.4 MONDAY-GOLD canon, 2026-08-11, LOCKED immutable**; (b) the **V5 line**: v5.0 frozen → **V5.1 guard-fired draft (2026-09-26,
MODE B — NO LOCK, a living snapshot)** → **V5.2 selection/spread work (2026-09-27)**.
**THE FRESHNESS RANKING:** `context_management/` (the root canon) is **3 weeks-1 month old (STALE)**; `packages/plutus-v5.1/context_management/` +
`reports/` + `RUNNING_BUILD_LOG.md` are the freshest for V5 (**15h-1d**).
**⇒ A RESUME MUST READ THE PACKAGE'S context_management FIRST, not the root's.**

### 24.3 THE SURVIVAL LAWS (verbatim, `packages/plutus-v5.1/context_management/COMPACTION_SURVIVAL.md`)
The survival laws + the resume order + **8 open gates** + the verbatim probes. **THE RESUME ORDER:** the package's `CURRENT_STATE` → `EVIDENCE_STATE`
(the per-gate table + the instrument failures + the 3-week evidence + R-1..R-7) → `COMPACTION_SURVIVAL` → the `RUNNING_BUILD_LOG` tail (the V5.2 W1-W12 record).

### 24.4 THE V5.2 BUILD RECORD (verbatim, `RUNNING_BUILD_LOG.md`)
**V5.2 W1-W12: spread · day-native CS-1 · subcap · 8 → 11/21** (+ the W14 pivot priority + the W12b spread=4 → **14/21**).
The 5 landed mechanisms each carry their measured effect; the tested-and-reverted (W13 per-pair spread, W15, W16) each carry their reason.

---

## §25 THE FINAL V5 STATE (one paragraph)

**PLUTUS V5 IS A LIVE, TWO-LINE BUILD.** The **canon line** (v4.5.4 lineage → the Monday-gold checkpoint `5/5 +17.84R`) is LOCKED and immutable.
The **V5 build line** is in flight: v5.0 is FROZEN as the baseline; **V5.1 wired the four doctrine gates + the E2-preference fix + the null test + the week unblock,
turned a coverage-inflated 90.5% into an honest 38.1%, and FIRED the 76.2% guard — the operator's ruling is pending**; **V5.2 then landed five measured mechanisms
and climbed 8/21 → 14/21** (DXY 6/6, EU 7/8, GU 1/7), suite 528/0, null 0.0%, the frozen pair intact. Every gate green except the chain (the pool live but inert,
FIX-4b scoped). **The named blockers: the E2 designating all-5-days `PBS:SHORT` (B2), the E1 selection+spread (B3, refuting the rung-absence hypothesis),
the shape-vs-category cap key, and the GU↔EU cascade coupling.**

<!-- PLUTUS-V5-SYNTHESIS-FINAL-ADDENDUM -->
