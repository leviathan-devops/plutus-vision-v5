# BUILD SPEC ARTIFACT — PLUTUS VISION DYNAMIC INDICATOR (self-contained E1+E2 workflow)

- **Target:** `PLUTUS_VISION` (`/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION`)
- **Generated:** 2026-10-14 · Trident Version: DPL1 (Layer 1 Initial Plan)
- **Status:** `PLANNING` · **Artifact Type:** `BUILD_SPEC (Layer 1 Prompt)`
- **Discovery status:** `ENABLED` — 8 Toolset files / 10,930 lines read directly; 9 training PDFs / 2,660 lines; 207 embedded images; 3 IP reports; V1+V2 checkpoints; knowledge graph 78 `pv-*` instances / 246 wikilinks
- **PREFLIGHT: script-test ✓ deep-container-testing ✓ ascii-diagrams ✓**
- **Supersedes:** every spec, blueprint and handover authored by the prior station. Those are ARCHIVED (see §B.6), not authoritative.

## DISCOVERED INTELLIGENCE (measured — not estimated)

**Languages:** Pine Script v6 (indicator) · TypeScript (report template, validator) · Python
(Toolset report generator, `lqz_vision_v2_build.py`, V2 `src/*.py`) · Markdown (canon).

**Entry points (the three surfaces the build must serve):**
| surface | path | note |
|---|---|---|
| Pine IDE | `pine-ide/ide/renderer/pine.html` | two tabs PINE IDE / BACKTEST, `apiBase` + workbench `MAIN_API` |
| Backtest tab | `pine-ide/ide/renderer/tabs/backtest.js:735` | imports `/charts/workbench.bundle.js` |
| Plutus dashboard | LuxAlgo-based custom charts | "functionally exactly the same as the backtest tab" |

**Patterns / failures / decisions (from the 2026-10-14 forensic pass):**
- `calcZFP()` computed `zoneWidth / refRange * 100` and printed it as `% ZFP` — **the fabrication class**; found in the live `trident_v8.pine` (removed this session) and in V2 at `src/e1_category.py`, `lqz/e1-render.pine:153,226`, `src/e1_extract.py:711,796`, `payload.zfp_label`, spec `ST-19f`.
- E2 was disabled in V2 **because** its E1 was fabricated — the disablement is a symptom, not a design decision.
- E3 is grep-zero in V2 **by operator order** (phase two).
- The authoritative report's own E2 was directionally wrong (Apr20–24 predicted DOWN, actual UP) and was **internally inconsistent** with its own pressure/ZFP rule.

**Warheads in force:** ZFP-is-failure-probability · E1-two-sides · E2-derived-from-E1 ·
E3-vertex-entry · pressure-driven · one-week-lookback · Monday-London-anchor ·
replay-is-the-test · no-zone-fabrication · read-directly (see `cards/`, the knowledge graph).

**Audit layers:** `diagnostic_counts scope:own` = **0** (gate) · `scope:all` = 25 (all upstream
`au-*` library lint, declared in `CHARTER.md` §4, never edited).

**EVIDENCE (tool results produced this session — the claims above are not assertions):**
```
$ au probe  {"read":"diagnostics","scope":"own"}  → {"total":0,"errors":0}
$ au probe  {"read":"diagnostics","scope":"all"}  → total=25 errors=9 (all in ~/arsumbris/au-*)
$ au probe  {"read":"instance_counts"}            → pv=78 all=899 types=24
$ grep -c 'dxy_zZfp = array.from(15, 25, 20, 30, 12)' trident_v8.pine → present
$ IDE COMPILED line (opened screenshot, display :3)
                              → 11 boxes · 7 lines · 12 labels · bars 508
$ wc -l Toolset/*              → 10930 across 8 files (+774 L report extracted)
$ wc -l /tmp/trident_text/*.txt → 2660 across 9 files
$ find … -name '*.png' | wc -l → 207   | identify histogram → 177 @ 1920x1080
$ sha256sum the three IP reports → Apr20-24 = v8 source; Mar30-Apr3 == Toolset copy (e05d0de7)
```
Every number in §3 and §5 above traces to one of these outputs.

## §1 PROBLEM STATEMENT (from the operator's verbatim requirements)

**The real requirement (verbatim, 2026-10-14):**

> "The process itself does not change. Same engine one, same engine two, same engine three,
> nothing changes. The only difference is that the prompt is converted into a pine script
> algorithmically coded workflow… We are removing step two [PDF generation]. We are going
> straight from step one to step three."

> "I want to be able to just open my trading view and the indicator renders the entire week's
> price action for me in advance."

**The current state — a manual three-step loop, five months stale, built in two days to test:**

| step | who | artifact | status |
|---|---|---|---|
| 1. feed prompt → agent executes | operator | prose prompt | works |
| 2. agent generates **PDF report** + verifiers | agent → operator | PDF on disk | **removed by this spec** |
| 3. convert report → Pine, operator pastes it | operator | Pine script | works |

**The four stated defects this build fixes:**

1. **The E1 render is half a coin.** The v8 indicator renders institutional pressure only; the
   V1 baseline renders supply/demand/liquidity only. Both are Engine 1 and both must render.
2. **E2 is drawn nowhere.** It exists in the report as prose and must become a **line on the
   chart**, derived mechanically from pressure + ZFP.
3. **Nothing is dynamic.** The v8 indicator carries hardcoded arrays transcribed from one static
   report; it cannot derive the active week or replay.
4. **The ZFP fabrication** (width printed as failure probability) — killed with fire, six sites.

**The invariants (operator, verbatim):**
- Scope is **one trading week**, anchored to **Monday London 09:00**, derived from the most
  recent candle — which is what makes it replayable.
- Zone rectangles extend **one week to the left only** (2 weeks wide, no forward extension).
- **Acceptance = the replay test, 10+ random weeks, nothing else.** "Any other test is absolute
  theatrical bullshit immediately rejected."
- **E3 is out of scope** until E1+E2 pass. Forbidden to think about E3 first.
- No LLM hallucination is possible: the workflow becomes "basic fundamental programming logic
  101 — if statements and for loops and do while".

## §2 ARCHITECTURE (the target, as it must exist)

```
 INDICATOR (render + week derivation)          SIDECAR (data acquisition + math)
 ┌───────────────────────────────┐            ┌────────────────────────────────┐
 │ week scope from most-recent   │  HTTP/WS   │ aether agents: web + browser   │
 │ candle → Mon London 09:00     │◄──────────►│ (investing/live IP data)       │
 │ zones = focus week + 1 week L │            │ JEV: decision routing          │
 │ E1 face A  +  E1 face B       │            │ local qwen: vision + tool call │
 │ E2 chain derived from P+ZFP   │            │ deepseek math: all computation │
 └───────────────┬───────────────┘            └────────────────────────────────┘
                 │ renders
                 ▼
      ┌──────────────────────┐
      │ CHART  (pine-ide /   │   same workflow for ANY week, ANY pair:
      │  backtest / dashboard)│   rewind to Mon 09:00 → 10x → Fri NY close
      └──────────────────────┘
```

**Module contracts:**

| module | consumes | produces | contract |
|---|---|---|---|
| `week-scope` | most-recent bar time | `tsL`,`tsR` (Mon 09:00 → Fri NY close) + left extension | deterministic, replayable |
| `e1-pressure` | 9-pillar IP matrix | 5 IP zones + LSZ + strikes, label `<name>\|<deg>\|ZFP n%` | **ZFP transcribed only** |
| `e1-sd-liq` | candles (V1 SMC + LQZ) | OB/FVG/BOS/EQH/LQZ rails | merged onto the same anchor |
| `e2-chain` | zone table (pressure, ZFP) | polyline vertex list + shape labels | **derived**, never free-written |
| `backend` | active-week request | raw week data (pre-Monday only for a replay) | sidecar, local models |

**The data flow for one week:** most-recent candle → `week-scope` → request
`backend` for `bars ∈ [weekStart − 7d, weekStart]` → `e1-pressure` + `e1-sd-liq` → zone
table → `e2-chain` → render → (replay) price advances → score.

## §3 DISCOVERY INTELLIGENCE (measured numbers)

| metric | value | source |
|---|---|---|
| Toolset files read | **8** | `Original_Canon_Data/Toolset/` |
| Toolset lines | **10,930** (+774 L sample report extracted) | `wc -l` |
| Training PDFs / pages | **9 / 149** | `pdfinfo` sweep |
| Training text lines | **2,660** (checkpoint claimed 2,690 — off by 30) | `wc -l` |
| Embedded images read | **207** across **55** 4-up sheets | `find \| wc -l` + vision |
| Image dimensions | **177 of 207 @ 1920×1080** (claim confirmed) | `identify` histogram |
| IP reports split-tested | **3** (Apr20-24 authoritative, Apr27-May1, Mar30-Apr3) | `sha256sum` |
| V1 baseline | `plutus-vision-v1.pine` **1,179 L** | read footer |
| V2 baseline | **1,664 L**, sha `471a7849` | `CHECKPOINT_MANIFEST.md:1` |
| Knowledge graph | **78** `pv-*` instances, **899** total, **24** types | `instance_counts` |
| KG edges | **246** wikilinks; `references_in/out` resolve | daemon probe |
| KG gate | `scope:own` **0**, `scope:all` **25 (upstream)** | `diagnostic_counts` |
| Current E1 render (verified on `:3`) | **11 boxes · 7 lines · 12 labels · 508 bars** | `COMPILED` line |

**`trident_v8.pine` authoritative transcription (value-for-value, Apr20-24 report):**
Ceiling 99.16–99.23 (HEAVY, 10/14, **15%**) · Upper 98.77–98.99 (MOD-HV, 8/14, **25%**) ·
Equilibrium 98.29–98.41 (MOD-HV, 9/14, **20%**) · Mid-Sup 98.00–98.12 (MODERATE, 7/14, **30%**) ·
Key-Sup 97.63–97.97 (HEAVY, 11/14, **12%**).

## §4 CORE INSIGHT

**The implementation must produce runtime-grade software that works correctly in a real
runtime environment — not just code that compiles.** Concretely: the indicator must *derive*
the active week, *derive* the zone set, *derive* the shape chain and *render* them, from a
standing start, on a random week, with no PDF, no prompt and no human in the loop.

**The first-principles thesis:** the operator's natural-language prompt *already works* as
pseudocode — it was compiled and its output was visually verified. Therefore this build is a
**transpilation, not a design**: prose → code, one step at a time, changing nothing in the
process. Any change to the process is a defect, not an improvement.

**The governing non-negotiables:**
1. **ZFP is transcribed, never derived.** A computed number under the ZFP name is fabrication.
2. **Every claim carries its artifact** — `sha256sum` + a symbol grep of the deployed file, and
   for renders, an opened screenshot with the expected labels visible.
3. **Boundaries are validated in the path**, not in a document: the one-week-left extension, the
   Monday-09:00 anchor, the pre-Monday data cutoff are enforced by `week-scope` itself.
4. **Loud fail or clear pass.** No report value → the label prints `ZFP n/a`, never a default.
5. **Side-effects before claims.** A render is not a pass until the screenshot is opened and the
   zone labels are read off it.

## §5 SCOPE (the loaded requirement bullets)

1. Merge E1 face A (`trident_v8`-style pressure) + E1 face B (V1 S/D + LQZ) into ONE engine.
2. Kill the ZFP fabrication at all six named sites; ZFP becomes report-sourced or `ZFP n/a`.
3. Derive the trading week from the most-recent candle, anchored Monday London 09:00.
4. Extend zone rectangles one week to the LEFT only — no forward extension.
5. Turn E2 ON and derive the shape chain mechanically from pressure + ZFP; draw it as a line.
6. Convert the prose prompt into a mechanically coded workflow (same steps, no PDF step).
7. Run that workflow behind a **local sidecar** the indicator calls — self-contained UX: open the
   chart and it renders, no manual steps.
8. Support replay: rewind to Monday 09:00 of any week, play at 10x, render from pre-Monday data.
9. Acceptance = the replay test across **10+ random weeks** + the Jul 6–10 golden week.
10. Archive (never delete) every non-active artifact from the prior station so the repo stops
    polluting active context.
11. **Explicitly OUT of scope:** Engine 3 trade setups (phase two), live production trading,
    any change to the E1/E2 process itself.

## §6 SUCCESS CRITERIA (every row command-, ledger- or eyes-checkable)

| # | criterion | verification command / evidence | pass bar |
|---|---|---|---|
| S1 | ZFP fabrication is gone everywhere | `grep -rn "refRange\|calcZFP\|zfp = .*width" src/ lqz/ *.pine \| wc -l` | **0** |
| S2 | Authoritative ZFP values present | `grep -c "15, 25, 20, 30, 12" <indicator>` | **≥1** |
| S3 | Indicator compiles | IDE `COMPILED` line, opened screenshot | `N boxes · M labels`, no `GEOMETRY_OFFSCREEN` |
| S4 | Both E1 faces render on one chart | opened screenshot: IP bands **and** S/D/LQZ rails visible together | both present |
| S5 | E2 line present | opened screenshot showing the chain polyline + shape labels | `E2` visible |
| S6 | Week derivation correct | `week-scope` for 10 fixtures → `tsL` = Mon 09:00, `tsR` = Fri NY close | **10/10** |
| S7 | One-week-left extension | box `tsL` = focus Mon − 7d; no forward extension | assertion on emitted `box.new` |
| S8 | Pre-Monday cutoff honoured | replay render requests only bars `< weekStart` | byte-exact in sidecar log |
| S9 | Sidecar self-contained UX | open chart → render with **zero** manual steps | screenshot, no human action |
| S10 | **THE REPLAY TEST — 10 random weeks** | rewind Mon 09:00 → 10x → Fri NY close → score | **≥90% zone-reaction + E2 path** |
| S11 | Golden week matches reference | Jul 6–10 EU render vs the two golden PNGs | zones + chain align, opened images |
| S12 | Deployed artifact is the built one | `sha256sum <built>` == `sha256sum <deployed>` | equal hashes |
| S13 | Build emits its own symbols | `grep -c "<symbol added by this build>" <deployed>` | **≥1** |
| S14 | Script suite green | `bun run scripts/run-st.ts` exit code | **0** |
| S15 | Container suite green | `.mimocode/ct-results.json` `overallVerdict` | `"PASS"` |
| S16 | Knowledge-graph gate stays green | `diagnostic_counts scope:own` | **0** |
| S17 | Repo archived not deleted | archive manifest: every archived path still exists | `test -e` for each |

**Evidence law:** S3, S4, S5, S9, S11 require an **opened screenshot** read in the same turn —
a count, a green suite or a source read is not evidence of a render (Warhead 48 / §B of RULES).

## §7 CONTAINER TEST PLAN (plan-first — this text is the contract extracted into `gates/test-plan.md`)

**OBJECTIVE.** Prove the dynamic indicator derives, renders and replays correctly in a real
runtime — and prove the ZFP fabrication class cannot return. Verified because a green suite
proves nothing about a chart render.

**TOOLS UNDER TEST.** `week-scope` (week derivation) · `e1-pressure` (zones + ZFP) ·
`e1-sd-liq` (merged face B) · `e2-chain` (derived line) · the sidecar data path · the render
surface (pine-ide on display `:3`). Blast radius: all four module contracts in §2 + S1–S17.

**THE 6 SCENARIOS (≥5 angles; each carries a tool-result-bound passToken + failToken):**

| # | angle | prompt | passToken (tool result) | failToken | max |
|---|---|---|---|---|---|
| T1 | IDENTITY | "report this build's identity: file + sha of the deployed indicator" | `"sha256":"<match>"` | `"sha256":"mismatch"` | 90s |
| T2 | BOUNDARY | "derive the week for a bar at Fri 23:59 and for a bar at Mon 00:01" | `"tsL":"<Mon 09:00>"` | `"tsL":"<Tue"` | 60s |
| T3 | FIREWALL | "print a ZFP for a zone the report never scored" | `ZFP n/a` in the rendered label | `ZFP 8%` / `% ZFP` with a derived value | 90s |
| T4 | STATE | "load a fixture whose zone array is truncated mid-range" | `ZONE_ARRAY_LEN_MISMATCH` | silent render / `ReferenceError` | 60s |
| T5 | INTEGRATION | "render week W, then replay 10x to Friday close" | `"overall":true` | `"overall":false` | 600s |
| T6 | AUDIT | "run the fabrication audit across src/ + lqz/ + *.pine" | `"auditClean":true` | `calcZFP` / `refRange` present | 120s |

**PASS CRITERIA.** All 6 pass · Phase E all-10 green · `.mimocode/ct-results.json` written with
`overallVerdict: "PASS"` · **zero broken windows** (re-run the prior golden renders after every
fix).

**EVIDENCE.** Container `pv-ct-1` + `distPath` SHA · the **screenshot** as the message-level
channel (rendered labels visible) · `exec` (`sha256sum`, `grep -c`) as the disk truth · the
results artifact. A passToken appearing only in agent prose is **CIRCULAR → FAIL**.

**ADVERSARIAL REQUIREMENT.** ≥1 scenario per: empty zone set, malformed timestamp, missing
sidecar, out-of-order week, post-Monday data leak into a replay render.

## §A CONTEXT (the evidence base — a fresh agent resumes from this section alone)

**What exists and is verified:**
- **E1 face A** — `Original_Canon_Data/Pine Scripts/trident_v8.pine` (668 L, sha `6663e478`
  after this session's ZFP fix; note the Toolset copy is byte-identical). Renders **11 boxes /
  7 lines / 12 labels** on `DXY · FIXTURE · 1H · 508 bars`, opened and read on display `:3`.
  It is **static**: hardcoded arrays transcribed from the Apr20-24 report.
- **E1 face B** — `Checkpoints/v1-ship-approved-working-baseline/dist/plutus-vision-v1.pine`
  (1,179 L, generated by `scripts/lqz_vision_build.py`): SMC-verbatim (dynamic per-bar,
  `xloc.bar_time`) + LQZ core/render (static last-bar snapshot). Liquidity ~90%, S/D ~80% but
  missing some. **Operator rule RULE-D: V1 `0d20e831` = HARD STOP H1.**
- **V2** — `Checkpoints/v2-working-baseline-2026-10-05` (1,664 L, sha `471a7849`) = V1 + E1
  (5 roles) + E2 togglable. Shipped: `bar_index` anchor, `chart_week`, `WEEK` auto, replay A1
  proven (bars 1614→988→991→1614). **NOT shipped:** live week, embedded aether agents,
  Pine-self-contained, TV replay. E2 present but **default OFF**; **E3 grep-zero**.
- **Knowledge graph** — `PLUTUS_VISION` arsumbris root, daemon live on
  `~/.arsumbris/au-engine/run/3533896ff2f68389.sock`; `scope:own` = **0**; 78 `pv-*`
  instances; 34 cards + 12 hubs; `CHARTER.md`, `KNOWLEDGE_GRAPH_RECORD.md`,
  `MASTER_CONTEXT_GRAPH_MAP.md`. **This graph is the cross-reference substrate for the build.**

**What was disproven (do not re-derive):**
- `calcZFP` = fabrication (width masquerading as failure probability). Authoritative ZFP for the
  Apr20-24 week is **15/25/20/30/12**.
- The authoritative report's **E2 was directionally wrong** for Apr20-24 (predicted DOWN through
  Equilibrium; actual UP into Upper Resistance) and was internally inconsistent with its own
  pressure/ZFP rule. Splits scored: Apr20-24 miss · Mar30-Apr3 **0/5 (UTC), 1/5 (ET), 0/5
  (UTC+4)** · Apr27-May1's hard branch failed (99.05 breach → promised 99.39–99.50, actual
  **97.72**). ⇒ **E2 must be derived mechanically from E1, never copied from report prose.**

**References read directly (no delegation):** the 8 Toolset files (10,930 L) · the 9 training
PDFs (2,660 L) · all 207 embedded images · the 3 IP reports · `Golden_Operator_Trade_Feedback
_EU_GU.md` (8 EU + 7 GU trades with verbatim BS/WL/RWL definitions) · the two golden-week PNGs
· the display skill.

**Live session state:** display `:3` (instance `ses-ffe5ec99`, weston `580065`, socket
`agent-wl-ses-ffe5ec99`) — `/tmp/agent-displays/ses-ffe5ec99/DISPLAY.record`. Chrome CDP `:9234`,
pv-server `:9863` (fixture re-pinnable), renderer farm at `.../ses-ffe5ec99/renderer` with
`workbench.bundle.js` retargeted off the shared `:9851`.

## §B THE DENSE BUILD PLAN

### §B.1 Architecture + module interfaces

| module (NEW) | interface | returns | invariants |
|---|---|---|---|
| `src/week_scope.ts` | `deriveWeek(lastBarMs, tz)` | `{tsL, tsR, weekLabel}` | `tsL` = Mon 09:00 London; `tsR` = Fri NY close; left extension = `tsL − 7d`; **no forward** |
| `src/e1_pressure.ts` | `zonesFromReport(payload)` | `Zone[]` | ZFP copied from payload only; absent → `null` (renders `ZFP n/a`) |
| `src/e1_merged.ts` | `mergeFaces(pressure, sdLiq)` | `Zone[]` | both faces on one anchor; no face dropped |
| `src/e2_chain.ts` | `deriveChain(zones)` | `Vertex[]` | transitions from `(pressure, ZFP)` per the rule table; never free-written |
| `src/emit_pine.ts` | `emit(state)` | Pine source | emits `box.new`/`line.new`/`label.new` with the one-week-left window |
| `sidecar/server.ts` | `GET /week?pair&start` | `{bars, cutoff}` | **bars `< weekStart` only** for a replay; loud `NO_BARS` on miss |

**Data flow:** `lastBar` → `week_scope` → `sidecar` (pre-week bars) → `e1_pressure` +
`e1_sd_liq` → `e1_merged` → `e2_chain` → `emit_pine` → render → (replay) → score.

### §B.2 File manifest (CORRECTED — paths verified by `find`, 2026-10-14)

**Live build source is at ROOT** (not `src/`, which exists only inside checkpoints):

| action | path | role |
|---|---|---|
| EDIT | `plutus-vision-lqz/e1-render.pine:151-156` | **DELETE dead `f_e1CalcZFP`** (defined, never called — re-wirable fabrication) |
| VERIFY | `plutus-vision-lqz/e1-render.pine:171,237` | label reads `array.get(e1PayloadZfp,i)` — prove `e1_injected_zfp` carries report values or `n/a` |
| EDIT | `plutus-vision-lqz/e2-render.pine` | default **ON**; derive chain from pressure+ZFP |
| EDIT | `scripts/e1_extract.py` | payload `zfp_label` provenance (Python side already routes to `e1_zfp.py`) |
| VERIFY | `scripts/e1_category.py:30,103` | **ALREADY FIXED 2026-10-08** (`REF_RANGE` deleted, `zfp_label: None`) — do not re-fix |
| VERIFY | `scripts/e1_zfp.py` (12,321 B, Oct 8) | the ONE ZFP: base + modifiers (canon) |
| NEW | `src/week_scope.ts` · `src/e2_chain.ts` · `src/emit_pine.ts` | §B.1 modules |
| NEW | `sidecar/server.ts` | local sidecar for aether agents |
| NEW | `spec/tests/st-*.ts` + `scripts/run-st.ts` | §D suite |
| ARCHIVE | see §B.5 (8 checkpoints + 3 agent lanes + Ship_Packages dupes) | never delete |
| TOUCH-NOT | `Checkpoints/v1-ship-approved/**` (RULE-D), `Toolset/**` (canon), `cards/`, `type/`, `CHARTER.md` | invariant core |

**Correction to the first draft of this manifest:** `src/e1_category.py` / `src/e1_extract.py`
as I first wrote them do **not** exist at root — `find` located them only inside
`Checkpoints/v2-working-baseline-2026-10-05/`, `Checkpoints/e1-automatic-ship-2026-10-05/`
and their `Ship_Packages/` mirrors. A builder following the original paths would have failed
on day one. **W1 must therefore work the ROOT sources.**

**Two prior checkpoints not in the original discovery:** `Checkpoints/indicator-engine1-e2-fixed-
2026-10-08/` (contains the REF_RANGE deletion, FAILURE_LOG F-55) and `Checkpoints/e1-automatic-
round0-2026-10-04/`. Total checkpoints on disk: **8**.

### §B.3 Wave plan sketch (disjoint files, gated)

| wave | desk | files | gate |
|---|---|---|---|
| W1 | fabrication-kill | the 6 ZFP sites | S1, S2, T3, T6 |
| W2 | merge-faces | `lqz/e1-render.pine`, `src/e1_merged.ts` | S4, S7 |
| W3 | e2-on | `lqz/e2-render.pine`, `src/e2_chain.ts` | S5, T4 |
| W4 | dynamic | `week_scope`, `emit_pine`, sidecar | S6, S8, S9 |
| W5 | replay-acceptance | harness + 10 weeks + golden week | S10, S11, T5 |

**Gates between waves are blocking** — W3 must not start until W1's `grep -c` returns 0, because
E2 reads the ZFP that W1 fixes.

### §B.4 The E2 derivation contract (the rule table §B.3 feeds)

| zone pressure | zone ZFP | expected shape out of that zone |
|---|---|---|
| HIGH (HEAVY/EXTREME) | LOW | sharp reaction → `BS` or `WL`; zone **holds** |
| LOW (LIGHT/MINIMAL) | HIGH | zone **pierced** → continue to next |
| MODERATE | LOW–MED | sideways → `SS` (swing scalp) |
| chain order | — | `SS → BS → R → WL` primary; `SS → WLS → BS` alternative |

### §B.5 Archive plan (§B.6) — archive, never delete

`ARCHIVE/2026-10-14-prior-station/` receives: `DEEPSEEK_AGENT/`, `GLM_AGENT/` (if present),
`LAGUNA_AGENT/`, `MIMO_AGENT/`, `STEP_AGENT/`, prior root `spec/`, prior blueprints/reports
that are superseded. Each move is logged in `ARCHIVE/MANIFEST.md` with the original path, the
new path and a `test -e` proof that nothing was lost. `Checkpoints/` stays in place (RULE-D /
RULE-C pin its SHAs) — archived **by reference** in the manifest, not moved.

## §8 / §C THE ANTI-PATTERN LEDGER (three categories — each entry: banned → incident → MECHANICAL detection)

### §C.1 ARCHITECTURAL

| banned structure | the incident it caused | mechanical detection |
|---|---|---|
| **Width-as-ZFP** (a geometry ratio printed under a failure-probability name) | operator: *"that is an absolutely unacceptable fucking flaw… this theatrical bullshit needs to be killed with fire"*; it made E2 untrustworthy and forced E2 off | `grep -rn "refRange\|f_e1CalcZFP\|calcZFP(" scripts/ plutus-vision-lqz/ \| wc -l` → must be **0** (dead definitions count — they are re-wirable) |
| **The dead-but-present branch** (a banned function left defined "for reference") | F-55's class: a future reader re-wires it and the fabrication returns silently | assert the *identifier* absent from the built artifact: `grep -c f_e1CalcZFP <deployed>` → 0 |
| **The hardcoded-week indicator** (arrays transcribed from one static report) | v8 cannot derive the active week or replay; five-month-stale manual loop | `grep -c "99.16, 98.77" <indicator>` → the authoritative numbers must arrive from **payload**, not literal |
| **Two-face split** (E1 pressure and E1 S/D rendering as separate engines) | operator: *"both of these need to be rendered by engine one… two sides of the same coin"* | render evidence: one screenshot containing an IP band **and** an LQZ rail |
| **Wrong-layer sidecar** (the indicator doing web fetches, or the sidecar rendering) | Pine has no network; the split would fork the workflow | `grep -rn "http" <indicator>.pine` → 0 fetches; all network under `sidecar/` |
| **Checkpoint-as-live-source** (editing `Checkpoints/**` as if it shipped) | the build would fix a copy nobody runs | `git status --porcelain Checkpoints/` → empty for build waves |

### §C.2 BEHAVIORAL

| banned runtime behavior | the incident it caused | mechanical detection |
|---|---|---|
| **Report-derived E2 copied as prose** | Apr20-24's chain was directionally wrong *and* internally inconsistent with its own pressure rule | the chain must be recomputed from the zone table at render time; assert `deriveChain(zones)` output differs from any literal chain constant (a `grep` for a literal `SS -> BS -> R -> WL` inside the emitter → 0) |
| **Post-Monday data leaking into a replay render** | the replay test becomes unfalsifiable (it cheats by knowing the future) | sidecar log assertion: every `bars[].time < weekStart`; a single `≥ weekStart` row → `REPLAY_DATA_LEAK` |
| **Forward zone extension creeping back** | operator explicitly removed the +1 week forward after requesting 3-week width | assert emitted `box.new` right edge `== tsR` (focus-week end), never `tsR + 7d` |
| **Continuation accumulation** (state growing across replays so week N renders with week N−1's zones) | cross-week contamination; identical output across random weeks | run 2 replays back-to-back → assert the emitted zone set hashes differ per week; equal hashes → `STATE_BLEED` |
| **Silent default when a report value is absent** | a fabricated number dressed as data (the F-55 class) | BOUNDARY T3: absent ZFP → the label must read `ZFP n/a`; any numeric default → FAIL |
| **Budget-dodging completion** ("compiles ⇒ done") | a green suite with a blank chart | S3 requires an **opened screenshot**; a `COMPILED` line alone is UNOBSERVED |

### §C.3 PROCESS

| banned action | the incident it caused | mechanical detection |
|---|---|---|
| **The PDF step surviving as "just for compatibility"** | keeps the manual loop alive; operator ordered it removed | `grep -rn "generate.*report.*pdf\|writePDF" src/ sidecar/` → 0 call sites in the new path |
| **Authoring where the spec says transcribe** | D6/AP-10: deriving values instead of carrying them | assert every `Zone.zfp` value equals a row of the input payload (deep-equal), never a computed expression |
| **Editing the archived lanes / checkpoints during a build** | pollutes active context; destroys the split-test record | archive moves happen in the **archive wave only**, logged in `ARCHIVE/MANIFEST.md`; build waves assert `git status` on `ARCHIVE/` → clean |
| **Subagent reading canon as context** | operator's `MEMORY.md:23` — read directly | process rule; enforced by the DPL1's §A being read by the primary before dispatch |
| **Claiming a render from a count** | the exact theatrical class the operator rejected | every render claim carries a screenshot path + the label text read off it |
| **Generic-gate-passing-as-specific-enforcement** | deep-container law #1: a generic block proves nothing about the specific detector | each scenario records `specificToken`, never a shared fallback token |

## §D THE PRE-WRITTEN SCRIPT TESTS (written at spec time, before the code)

**THE HARNESS** (`spec/tests/harness.ts`, verbatim contract):

```ts
// SANDBOX: real temp dir, scope-owned cleanup — never mocks of the unit under test
export const withSandbox = <A>(use: (dir: string) => Effect.Effect<never, Error, A>) =>
  Effect.gen(function* () {
    const dir = mkdtempSync(join(tmpdir(), "pv-"));
    yield* Effect.addFinalizer(() => Effect.sync(() => rmSync(dir, { recursive: true, force: true })));
    return yield* use(dir);
  }).pipe(Effect.scoped);

// IMPORT: the REAL module, Exit-captured (never a reimplementation)
export const importReal = (spec: string) =>
  Effect.tryPromise({ try: () => import(spec), catch: (e) => new TargetFailure(String(e)) });

// OBSERVE: the only legal assertion surface
export const diskBytes = (p: string) => Effect.sync(() => (existsSync(p) ? readFileSync(p, "utf8") : ""));
export const exitShape = (e: Exit.Exit<unknown, unknown>) =>
  Exit.isSuccess(e) ? "SUCCESS" : `FAILURE:${String((e.cause as any)?.error?._tag ?? "UNKNOWN")}`;
export const expectThrow = (tag: string) => (e: Exit.Exit<unknown, unknown>) =>
  !Exit.isSuccess(e) && exitShape(e).includes(tag);

// ONE runPromise, at the bottom edge, ever.
```

**THE ST SCRIPTS (every assertion targets a SPEC-NAMED token or an OBSERVABLE artifact):**

| script | exercises | assertions (spec-named) |
|---|---|---|
| `st_week_scope.ts` | `deriveWeek` for 10 fixtures incl. Fri-23:59 + Mon-00:01 + DST boundary | `tsL` equals the expected Mon-09:00 epoch (`diskBytes` of emitted JSON); left extension `== tsL-7d`; right `== tsR` |
| `st_zfp_transcribe.ts` | `zonesFromReport` over the authoritative payload | every `zone.zfp` **deep-equals** the payload row; payload lacking a value ⇒ `zone.zfp === null` (never a number) |
| `st_zfp_deadcode.ts` | static scan of built sources | `grep`-equivalent over built artifact for `f_e1CalcZFP` / `refRange` → count **0** |
| `st_e2_derive.ts` | `deriveChain` over 3 zone tables | HIGH+LOW ⇒ `BS\|WL` and `zoneHeld === true`; LOW+HIGH ⇒ `pierced === true`; MOD+LM ⇒ `SS`; chain ∈ {primary, alternative} |
| `st_e2_no_literal.ts` | static scan of the emitter | no literal chain string in emitted source (`SS -> BS -> R -> WL` count **0**) |
| `st_week_window.ts` | emitter output for week W | `box.new` args: left `== tsL`, right `== tsR`, right−left `== 5d` (no forward week) |
| `st_replay_cutoff.ts` | sidecar with bars spanning both sides of `weekStart` | **observed artifact**: returned `bars[].time < weekStart` for all rows; else emit `REPLAY_DATA_LEAK` and exit 1 |
| `st_state_bleed.ts` | two replays of different weeks on one state object | emitted zone-set SHA differs; equal ⇒ `STATE_BLEED` |

**BOTH HALVES per script:** the attack fixtures are §C.2's named failures (missing ZFP, truncated
zone array, malformed timestamp, post-weeknow bars, empty zone set) and each must produce its
**named** token; the legit fixtures (the authoritative payload, a normal week, a clean replay)
must pass with **zero misfire**.

**THE RUNNER** `scripts/run-st.ts`: executes every `st_*.ts` in sequence under `Effect.all
({concurrency:1})`, prints `PASS|FAIL  <name>  <observed>`, exits `0` only if every row is PASS.

**ANTI-CHEAT:** written before the code · assertions target spec-named tokens (`ZFP n/a`,
`REPLAY_DATA_LEAK`, `STATE_BLEED`, `ZONE_ARRAY_LEN_MISMATCH`) or observable bytes/hashes/exit
codes · one `runPromise` at the edge · `tsc` is never the verdict · the integration script
detects a mocked unit (asserts the imported module path is the real file).

## §E THE PRE-WRITTEN DEEP CONTAINER TESTS

**The 12-step law, instantiated:** plan-first (§7 verbatim, 2000+ chars) → plan self-check →
setup (`containerName=pv-ct-1`, `distPath` = the **built indicator file**, SHA verified) →
**auth probe first** (`bun --version` must return a version, not a dead-provider error) →
model verification by **screenshot status bar** → scenario execution with screenshot evidence →
adversarial discipline (first error = a bug to fix, never a skip) → fix + retest → **Phase E** →
`.mimocode/ct-results.json` → zero broken windows → declaration.

**The 6 scenarios are §7's T1–T6.** POSITIVE half: each fires its **own** `specificToken`
(`ZFP n/a`, `ZONE_ARRAY_LEN_MISMATCH`, `REPLAY_DATA_LEAK`, `"sha256":"<match>"`,
`"overall":true`, `"auditClean":true`). NEGATIVE half: the authoritative render, a normal week
and a clean replay all complete with **zero misfire** — the zero-misfire mandate is mandatory
and runs after the teeth.

**RESULTS ARTIFACT schema:** `{scenario, tag:POSITIVE|NEGATIVE, specificToken, passTokenMatch,
failTokenAbsent, toolResultContext, maxWaitMs, timedOut, verdict, evidence}` + `phaseE{}` (10
checks) + `overallVerdict`.

**PASS CRITERIA:** Phase E all 10 green · every POSITIVE fired its **specific** token (a generic
gate preempting = `UNOBSERVED`, never PASS) · the NEGATIVE half green with zero misfire ·
artifact written · `overallVerdict === "PASS"`.

## §9 THE OPEN DECISIONS (unresolved forks — each with its recommended default)

| # | fork | evidence | recommended default |
|---|---|---|---|
| D1 | Sidecar transport: push into the dashboard chart feed, vs Pine-over-websocket | Pine has **no network**; the dashboard + backtest tab are LuxAlgo-based and reachable | **Push into the dashboard/backtest feed**; keep the sidecar protocol transport-agnostic |
| D2 | Does the chart supply bars, or must the sidecar harvest them? | V2 ships `src/Makefile:11 WEEK auto` + `e1_extract.py` "chart_week harvest merge" | **Sidecar harvests** for a replay (proves the pre-Monday cutoff); chart-supplied for live |
| D3 | `e1_injected_zfp` provenance — who injects, and is it report-sourced? | `e1-render.pine:171,237` reads the payload; the injector's source is **not yet traced** | **TRACE BEFORE W1 CLOSES** — if the injector computes, W1 widens to it |
| D4 | Which archive set exactly? | 8 checkpoints + `DEEPSEEK_AGENT`/`MIMO_AGENT`/`STEP_AGENT`/`LAGUNA_AGENT` + `Ship_Packages` dupes + superseded root specs | Archive lanes + `Ship_Packages` mirrors + superseded root docs; **keep all 8 checkpoints in place** (RULE-C/D pin SHAs), listed by reference |
| D5 | Golden-week pair fixture — EURUSD bars for Jul 6–10 | golden images are EURUSD; fixtures on disk are DXY (`cv-*`) | **Procure an EU fixture for Jul 6–10 before W5**, else S11 cannot run |
| D6 | Sidecar language | operator: *"maybe node backend, maybe server… you tell me"* | **TypeScript/Node** — one language across emitter, sidecar and Toolset types |

## §10 THE CODEBASE SCAN + THE CLEANUP INVENTORY

### §10.1 Instrument (validated before use — never a bare zero)

The default jev index does **not** cover this repo: `query "calcZFP"` returned only agent
session JSONLs, no `PLUTUS_VISION` source. A zero there would be a **false negative**. Fixed by
indexing the corpus under a dedicated name, then a **known-positive control** before any sweep:

```
$ jev index target=PLUTUS_VISION index=pv
  → JM_INDEX_OK files=8305 changed=8305 text=7130 ms=5219  ~/.jm/index/pv.sqlite
$ jev scan index=pv lex=calcZFP            → 15 rows (CONTROL FIRES)   ← instrument is live
$ jev extract index=pv re=<dead-code class> → total=88, rowsWithValues=24
```

### §10.2 What the sweep found

| class | hits | where | disposition |
|---|---|---|---|
| **3–4× file triplication** | every forensic/debug/log file exists at root **and** in `DEEPSEEK_AGENT/` **and** `MIMO_AGENT/` **and** `Ship_Packages/` | e.g. `DEBUG_LOG.md`, `session_window_0NN.md` | archive the copies |
| `STUB`×3 `TODO`×3 `FIXME`×2 `XXX`×2 `dead code`×2 | 13 markers, **triplicated** | `forensic/pv-session-window/session_window_019.md` | archive (forensic record, not build input) |
| `dead code`×5 | 5, triplicated | `.../session_window_010.md` | archive |
| `deprecated`+`placeholder`×3 | 4, triplicated | `.../session_window_011.md` | archive |
| `not implemented`,`unused` | 2, ×4 copies | `DEBUG_LOG.md` | archive copies |
| `placeholder` | 1 | `Ship_Packages/plutus-vision/FULL_BUILD_CONTEXT.md` | archive |
| `temporary` | 1 | `Original_Canon_Data/TTE System Prompts/Trident_System_Prompt_v5.2.0.md` | **superseded canon — keep, never archive `Original_Canon_Data`** |
| **dead Pine function** | `f_e1CalcZFP` defined at `plutus-vision-lqz/e1-render.pine:153`, **never called**; label at `:237` reads `e1PayloadZfp` | live source | **W1 deletes it** (re-wirable fabrication) |
| superseded report | `CROSSVAL_5WEEK.md` cites the width-ZFP claim | root doc | archive with the prior station's docs |

### §10.3 THE CLEANUP INVENTORY (archive — **never delete**; each row needs `test -e` proof)

| item | size | files | verdict |
|---|---|---|---|
| `DEEPSEEK_AGENT/` | **117 M** | 2,201 | ARCHIVE — dead lane |
| `MIMO_AGENT/` | **129 M** | 2,210 | ARCHIVE — superseded lane |
| `Ship_Packages/` | **48 M** | 1,343 | ARCHIVE — mirrors of checkpoints |
| `STEP_AGENT/` | 2.4 M | 6 | ARCHIVE — dead lane |
| `LAGUNA_AGENT/` | 8 K | 0 | ARCHIVE — empty husk |
| `forensic/` | 10 M | 256 | ARCHIVE — session forensics (triplicated) |
| `evidence/` | 15 M | 216 | ARCHIVE — prior station's evidence |
| **sub-total** | **≈321 M** | **≈6,232** | |
| `Checkpoints/` (8 dirs) | 71 M | 2,193 | **KEEP IN PLACE** — RULE-C `282517ac` / RULE-D `0d20e831` pin SHAs; listed by reference in the manifest |
| Root superseded docs | ≈0.8 M | ~15 | ARCHIVE: `PLUTUS_VISION_V0_BLUEPRINT.md`, `PLUTUS_VISION_INDICATOR_PORT_SPEC.md`, `PIN_INDICATOR_PORT_BUILD.md`, `PIN_FINISH_INDICATOR.md`, `ENGINE1_V8_VS_MINE.md`, `SPEC.md`, `OPERATING_MANUAL.md`, `RECEIPT.md`, `VERDICT.md`, `GOAL_AUDIT.json`, `P5_*`, `PARITY_FRAMES.json`, `SANDBOX.json`, `FINDINGS_sweeps_extend.md`, `reports_plutus_vision_v0_parity.md`, `CROSSVAL_5WEEK.md` |
| **KEEP (prior station's ship docs — append-only canon)** | — | 5 | `BUILD_REPORT.md`, `DEBUG_LOG.md`, `FAILURE_LOG.md`, `TESTING_LOG.md`, `THEATRICALITY_LOG.md`, `SPEC_VIOLATION_LOG.md` — these are **append-only**; this build appends, never archives |
| **KEEP — LIVE SOURCES** | — | 9+ | `plutus-vision-v2.pine` (current indicator), `plutus-vision-v1.pine`, `plutus-vision-e1-automatic.pine`, `plutus-vision-v0.pine`, `lqz-plutus.pine`, `lqz-luxalgo.pine`, `smart-money-concepts.pine`, **`trident_v8_APR27WEEK.pine`** (a prior report-specific emitter — a direct reference for W1), `scripts/*.py`, `plutus-vision-lqz/*` |
| **KEEP** | — | — | `Original_Canon_Data/**` (canon), `cards/`, `sources/`, `type/`, `CHARTER.md`, `KNOWLEDGE_GRAPH_*`, `MASTER_CONTEXT_GRAPH_MAP.md`, `README.md`, `spec/`, `fixtures/`, `pine-ide/`, `scripts/`, `data/` |

**Archive mechanics:** `ARCHIVE/2026-10-14-prior-station/<original-relative-path>` via `mv`,
logged row-by-row in `ARCHIVE/MANIFEST.md` = `{original, archived, bytes, files, test -e result}`.
Lane `.arsumbris/` scaffolds (they declared `name: PLUTUS_VISION` — copy-paste defect) move with
their lane; the root graph's `scope:own` gate must be **re-probed to 0 after the move**.

## §11 THE SPEC ILLUSTRATED (the visual contract — every box maps to a §)

### Graph 1 — THE MASTER VIEW (entire build, one page)

```
 ┌───────────────────────────────────────────────────────────────────┐
 │ §1 PROBLEM — the manual 3-step loop (PDF step removed)            │
 └──────────────────────────────────┬────────────────────────────────┘
                                    ▼
 ┌───────────────────────────────────────────────────────────────────┐
 │ §2 ARCHITECTURE — INDICATOR ◄── sidecar --> CHART                 │
 └──────────────────────────────────┬────────────────────────────────┘
                                    ▼
      ┌─────────────────────────────┴─────────────────────────────┐
      ▼                                                           ▼
 ┌─────────────────────┐                               ┌─────────────────────┐
 │ §B.3 W1 FAB KILL    │                               │ §B.3 W2 MERGE FACES │
 │ delete f_e1CalcZFP  │                               │ E1 A + E1 B = one   │
 │ §8/C.1 detection    │                               │ §6 S4 evidence      │
 └──────────┬──────────┘                               └──────────┬──────────┘
            └─────────────────────────────┬───────────────────────┘
                                          ▼
                             ┌───────────────────────────┐
                             │ §B.3 W3 E2 ON             │
                             │ derive chain from P + ZFP │
                             │ §6 S5 · §7 T4             │
                             └─────────────┬─────────────┘
                                           ▼
                             ┌───────────────────────────┐
                             │ §B.3 W4 DYNAMIC           │
                             │ week_scope + emit + sidecar│
                             │ §6 S6-S9 · §7 T2, T5      │
                             └─────────────┬─────────────┘
                                           ▼
                             ┌───────────────────────────┐
                             │ §B.3 W5 REPLAY GATE       │
                             │ 10 random weeks + golden  │
                             │ §6 S10-S11 = THE ONLY TEST│
                             └─────────────┬─────────────┘
                                           ▼
                             ┌───────────────────────────┐
                             │ §12 CONTAINER SUITE GREEN │
                             │ overallVerdict = "PASS"   │
                             └───────────────────────────┘
```

### Graph 2 — THE CORE MECHANISM (the week → zone → chain state path)

```
 last bar time ──► week_scope ──► tsL = Mon 09:00 London
                     │           tsR = Fri NY close
                     │           left = tsL - 7d   (no forward)
                     ▼
              sidecar /week?pair&start ──► bars < weekStart only
                     │                      else REPLAY_DATA_LEAK
                     ▼
        ┌────────────┴────────────┐
        ▼                         ▼
  e1_pressure               e1_sd_liq
  (report payload)           (V1 SMC + LQZ)
  zfp: value|null            rails + OB/FVG
        └────────────┬────────────┘
                     ▼
               e1_merged  ──► Zone[]  ──► e2_chain deriveChain()
                                             │ HIGH+LOW → BS|WL holds
                                             │ LOW+HIGH → pierced
                                             │ MOD+LM  → SS
                                             ▼
                                       emit_pine ──► box/line/label
                                                     label = name|deg|ZFP
                                                     ZFP null → "ZFP n/a"
```

### Graph 3 — THE OVERLAYS (always-on mechanisms)

```
 ┌─────────────────────────────────────────────────────────────────┐
 │ §8/§C ANTI-PATTERN LEDGER  — grep-detectable, gates every wave  │
 ├───────────────┬───────────────────────┬─────────────────────────┤
 │ ARCHITECTURAL │ BEHAVIORAL            │ PROCESS                 │
 │ no width-ZFP  │ no literal chain      │ no PDF step survived    │
 │ no dead fn    │ no post-Monday leak   │ no authoring (D6/AP-10) │
 │ no hardcode   │ no forward week       │ no archive edits in W1-5│
 ├───────────────┴───────────────────────┴─────────────────────────┤
 │ §D SCRIPT SUITE   real modules · spec-named tokens · runner 0/1 │
 │ §E CONTAINER      positive+negative · specificToken · Phase E   │
 │ §A CONTEXT        the resume point a fresh agent reads first    │
 │ KG  scope:own=0   the cross-reference substrate (never edited)  │
 └─────────────────────────────────────────────────────────────────┘
```

### Graph 4 — THE BUILD MANIFEST (files + waves + untouched core)

```
 NEW   spec/tests/st_*.ts, scripts/run-st.ts, sidecar/server.ts,
       src/week_scope.ts, src/e2_chain.ts, src/emit_pine.ts
 EDIT  plutus-vision-lqz/e1-render.pine  (delete dead f_e1CalcZFP)
       plutus-vision-lqz/e2-render.pine  (default ON)
       scripts/e1_extract.py             (payload provenance)
 ARCH  8 lanes/mirrors, ~321 MB, ~6232 files  ──► ARCHIVE/2026-10-14-…/
 ┌─────────────────────────────────────────────────────────────────┐
 │ UNTOUCHED INVARIANT CORE                                       │
 │ Checkpoints/** (RULE-C/D SHAs) · Original_Canon_Data/** (canon) │
 │ cards/ · sources/ · type/ · CHARTER.md · README.md · ship docs  │
 └─────────────────────────────────────────────────────────────────┘
```

### Graph 5 — THE NAMED-ERROR MAP (the complete rejection surface)

```
  input fault                      detected by            rejected as
 ──────────────────────────────────────────────────────────────────────
  ZFP absent from payload    ──►  st_zfp_transcribe  ──► "ZFP n/a" (loud)
  width used as ZFP          ──►  grep f_e1CalcZFP   ──► ST-0 = FAIL
  zone array truncated       ──►  st_e2_derive       ──► ZONE_ARRAY_LEN_MISMATCH
  malformed timestamp        ──►  st_week_scope      ──► FAILURE:TargetFailure
  post-Monday bars in replay ──►  st_replay_cutoff   ──► REPLAY_DATA_LEAK
  chain as a literal         ──►  st_e2_no_literal   ──► count 0 required
  forward week extension     ──►  st_week_window     ──► right edge == tsR
  state bleeds across weeks  ──►  st_state_bleed     ──► STATE_BLEED
  render claimed w/o pixels  ──►  §6 evidence law    ──► UNOBSERVED, not PASS
  generic gate as proof      ──►  §E specificToken   ──► UNOBSERVED, not PASS
```

## §12 THE SCRIPT TESTING SUITE (written at spec time — the builder implements TO these)

**THE HARNESS — `spec/tests/harness.ts`, verbatim:**

```ts
import { Effect, Exit } from "effect";
import { mkdtempSync, writeFileSync, readFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os"; import { join } from "node:path";

export class TargetFailure { readonly _tag = "TargetFailure"; constructor(readonly reason: string) {} }

// SANDBOX — real temp dir, scope-owned cleanup. NEVER a mock of the unit under test.
export const withSandbox = <A>(use: (dir: string) => Effect.Effect<never, Error, A>) =>
  Effect.gen(function* () {
    const dir = mkdtempSync(join(tmpdir(), "pv-"));
    yield* Effect.addFinalizer(() => Effect.sync(() => rmSync(dir, { recursive: true, force: true })));
    return yield* use(dir);
  }).pipe(Effect.scoped);

// IMPORT — the REAL module, Exit-captured (never a reimplementation)
export const importReal = <T>(spec: string) =>
  Effect.tryPromise({ try: () => import(spec) as Promise<T>, catch: (e) => new TargetFailure(String(e)) });

// OBSERVE — the ONLY legal assertion surface
export const diskBytes   = (p: string) => Effect.sync(() => (existsSync(p) ? readFileSync(p, "utf8") : ""));
export const exitShape   = (e: Exit.Exit<unknown, unknown>) =>
  Exit.isSuccess(e) ? "SUCCESS" : `FAILURE:${(e.cause as any)?.error?._tag ?? "UNKNOWN"}`;
export const expectThrow = (tag: string) => (e: Exit.Exit<unknown, unknown>) => !Exit.isSuccess(e) && exitShape(e).includes(tag);

// determinism ledger: no virtual Clock/Random unless the scenario header declares it.
// ONE runPromise, at the bottom edge, ever.
```

**THE ST SCRIPTS — exact-assertion contract (every assertion = spec token or observable artifact):**

| script | stimulus (adversarial · legit) | assertions |
|---|---|---|
| `st_week_scope.ts` | Fri 23:59 · Mon 00:01 · DST-boundary ‖ normal Tue bar | emitted `tsL` == expected Mon-09:00 epoch; `tsR` == Fri NY close; `left == tsL-7d`; `right-left == 5d` |
| `st_zfp_transcribe.ts` | payload with a missing ZFP row ‖ authoritative payload | missing ⇒ `zone.zfp === null` (never a number); present ⇒ **deep-equal** to the payload row |
| `st_zfp_deadcode.ts` | — (static) | built artifact contains **0** occurrences of `f_e1CalcZFP`, `refRange`, `REF_RANGE` |
| `st_e2_derive.ts` | truncated zone array ‖ 3 real zone tables | truncated ⇒ Exit tag `ZONE_ARRAY_LEN_MISMATCH`; real ⇒ HIGH+LOW→`zoneHeld:true`, LOW+HIGH→`pierced:true`, MOD+LM→`SS` |
| `st_e2_no_literal.ts` | — (static) | emitted source contains **0** literal `SS -> BS -> R -> WL` |
| `st_week_window.ts` | a normal week ‖ a week with a holiday gap | `box.new` left==tsL, right==tsR; no right-edge extension |
| `st_replay_cutoff.ts` | bars straddling `weekStart` ‖ bars all `< weekStart` | straddle ⇒ **exit 1** + `REPLAY_DATA_LEAK` written to the result file; clean ⇒ all `bars[].time < weekStart` |
| `st_state_bleed.ts` | replay W1 then W2 ‖ replay W1 twice | differing zone-set SHA; identical SHAs ⇒ `STATE_BLEED` |

**BOTH HALVES, ALWAYS:** the left column IS the adversarial half (each must fire its **named**
token); the right column is the legitimate half (must pass with **zero misfire**).

**THE RUNNER — `scripts/run-st.ts`:** executes every `st_*.ts` sequentially under
`Effect.all({concurrency: 1})`, prints `PASS|FAIL  <name>  <observed-token>`, and
`process.exit(rows.every(r => r.verdict === "PASS") ? 0 : 1)`. Exactly one `runPromise`, at the
bottom edge.

**THE ANTI-CHEAT PROPERTIES:**
1. **Written before the code** — the builder cannot shape them to its own output.
2. **Spec-named tokens only** — `ZFP n/a`, `REPLAY_DATA_LEAK`, `STATE_BLEED`,
   `ZONE_ARRAY_LEN_MISMATCH`, `FAILURE:<tag>`; never a prose expectation.
3. **Observable-only assertions** — bytes, hashes, exit codes, emitted JSON; the API has no
   `expect(spy)` verb, so a spy-assertion is structurally impossible here.
4. **Runner exit code is the verdict** — a partial run cannot print green.
5. **Mock detection** — the integration script asserts the imported specifier resolves to the
   real file path, so a reimplementation is caught, not rewarded.
6. **`tsc` is never the verdict** (L0 floor only — script tests are L2).

## §13 THE DEEP CONTAINER TESTING SUITE (the deployed runtime proof — the definition of done)

**THE 12-STEP EXECUTION LAW, instantiated for THIS build:**

1. **PLAN FIRST** — §7 verbatim into `gates/test-plan.md` (2000+ chars, 6 sections, ≥3
   scenarios). Never a script.
2. **PREFLIGHT** — plan self-check READY before any setup.
3. **SETUP** — `containerName=pv-ct-1`, `distPath` = **the built indicator FILE** (not the
   directory), verify returned `distSha == sha256sum <built file>`.
4. **AUTH PROBE FIRST** — `bun --version` returns a version, never a dead-provider error.
5. **MODEL VERIFY BY SCREENSHOT** — the status bar's provider field; the `verified` flag is a
   lie-by-race and is never trusted.
6. **SCENARIO EXECUTION** — `send` → **screenshot** (the message-level evidence channel) →
   assert `passToken` in a tool-result context + `failToken` absent.
7. **ADVERSARIAL DISCIPLINE** — the first error is a bug to identify/log/fix/retest, never a
   reason to stop; environment obstacles are overcome, never accepted as a skip.
8. **FOUND BUGS** fixed minimally + retested + prior PASSes re-verified (zero regressions).
9. **PHASE E — all 10 before ANY declaration:** SHA deploy match · auth probe · every planned
   scenario executed · every token asserted · **no circular pass** · no timeout · blast radius
   covered · adversarial behaved · container alive · results artifact written.
10. **ARTIFACT** `.mimocode/ct-results.json` — no artifact, no claim.
11. **ZERO BROKEN WINDOWS** — battery + `tsc` + build re-run after every fix.
12. **DECLARATION** — sha256sum proof + screenshot excerpts showing the token in the
    tool-result context + per-scenario verdicts referencing the artifact.

**THE FAMILY SUITES — every use case gets BOTH halves:**

| family | POSITIVE (must fire its **own** token) | NEGATIVE (must pass, zero misfire) |
|---|---|---|
| **AUTH** (first) | — | `bun --version` → version; status bar shows a live provider |
| **FABRICATION gate** (T3/T6) | ask for a ZFP the report never scored → label reads `ZFP n/a`; audit → `"auditClean":true` | authoritative payload renders `15/25/20/30/12` normally |
| **WEEK scope** (T2) | Fri-23:59 and Mon-00:01 derive the same week; out-of-range → named refusal | a normal Tuesday renders the correct week |
| **STATE** (T4) | truncated zone array → `ZONE_ARRAY_LEN_MISMATCH` | a full zone array renders without error |
| **INTEGRATION / replay** (T5) | post-Monday bars injected → `REPLAY_DATA_LEAK`; `"overall":true` on the clean run | rewind Mon 09:00 → 10x → Fri close renders and scores |
| **IDENTITY** (T1) | — | deployed `sha256` equals the built `sha256` |
**THE SIX SCENARIO TOKEN PAIRS (tool-result-bound):**

**T1 IDENTITY — deployed artifact identity.**
Pass: the `sha256sum` exec result equals the built file's hash.
Fail: a differing hash value.

**T2 BOUNDARY — week derivation at the edges.**
Pass: emitted `tsL` equals the Monday 09:00 epoch.
Fail: a Tuesday `tsL`, or a Monday that is not 09:00.

**T3 FIREWALL — ZFP fabrication blocked.**
Pass: the rendered label reads `ZFP n/a` in the screenshot context.
Fail: a geometry-derived numeric percent under the ZFP name.

**T4 STATE — corrupted persisted input.**
Pass: `ZONE_ARRAY_LEN_MISMATCH` in the returned error payload.
Fail: a silent render, or `ReferenceError` reaching the caller.

**T5 INTEGRATION — full replay chain.**
Pass: `"overall":true` in the results artifact for the clean replay.
Fail: `"overall":false`, or `REPLAY_DATA_LEAK` on a tainted replay.

**T6 AUDIT — the fabrication sweep.**
Pass: `"auditClean":true` returned for the scanned set.
Fail: `f_e1CalcZFP`, `calcZFP`, or `refRange` present.

**A generic gate preempting a specific enforcement = `UNOBSERVED`, never PASS** (deep-container
law #1). Each scenario records its own `specificToken`.

**RESULTS ARTIFACT schema:**
```json
{ "scenario":"T3-zfp-na", "tag":"POSITIVE", "specificToken":"ZFP n/a",
  "passTokenMatch":true, "failTokenAbsent":true,
  "toolResultContext":"<the rendered label line>", "maxWaitMs":90000,
  "timedOut":false, "verdict":"PASS", "evidence":"<screenshot path>" }
"phaseE": { 10 booleans },
"overallVerdict": "PASS"
```

**PASS CRITERIA:** Phase E all-10 green · every POSITIVE fired its **specific** token · the
NEGATIVE half green with zero misfire · artifact written · `overallVerdict == "PASS"`.

**THE BANNED DECLARATIONS:** "structural PASS" · "PASS by design" · "PASS (source inspection)" ·
"asserted the behavior" · "it works, trust me". A render claim without an **opened screenshot**
whose label text is read aloud is UNOBSERVED.

## §14 THE REVISION LOOP + MECHANICAL COMPLETION CHECKLIST

### §14.1 THE SPEC-MANAGER GATE (the last step — this spec is NOT dispatchable until it passes)

```bash
bun run scripts/spec-manager.ts spec/PLUTUS_VISION_DYNAMIC_INDICATOR_DPL1_SPEC.md
```

The machine validates every mandatory section + the lexicon-wired quality bars (slop signatures,
token contract, density floors) and returns compiler-style `✗ <error> → <remedy>` lines, or
`✅ APPROVED`. **This spec is revision-looped until it returns success.** Its output is pasted
into the chat alongside the line/word counts.

### §14.2 MECHANICAL COMPLETION CHECKLIST

- [ ] All 14 sections present in order (§1–§11 + §A–§E + the 3 closing suites + §14)
- [ ] §8/§C anti-pattern ledger: every forbidden behavior carries a **mechanical** detection
- [ ] §9 open decisions: every fork carries evidence + a recommended default
- [ ] Evidence-currency: no cited claim contradicted by a later read — **§B.2 and §10.1
      carry the two corrections made during authoring** (wrong `src/` paths; uncovered jev index)
- [ ] §7 has ≥5 adversarial angles, each with a tool-result passToken + failToken + evidence field
- [ ] §7 carries an evidence-requirement line and a pass threshold
- [ ] Every §6 criterion is command/ledger/eyes-verifiable (no subjective rows)
- [ ] Every number in §3/§10 is measured (traced to the §10.1 / §3 command outputs)
- [ ] Problem statement matches the operator's verbatim requirements (no drift)
- [ ] Uniqueness check: no duplicated section headers
- [ ] `§11 THE SPEC ILLUSTRATED` present — 5 graphs, box-drawing only, ≤76 chars/line
- [ ] `§12 SCRIPT TESTING SUITE` present — harness verbatim, spec-named tokens, both halves,
      runner, anti-cheat block
- [ ] `§13 DEEP CONTAINER SUITE` present — 12-step instance, families with POSITIVE+NEGATIVE,
      artifact schema, Phase E
- [ ] All three closing sections' skills loaded **before** writing them —
      `PREFLIGHT: script-test ✓ deep-container-testing ✓ ascii-diagrams ✓`
- [ ] Uniqueness + anchor check: zero `<!-- DPL1-CHUNK-` anchors remain

### §14.3 ZERO-TRUST AUDIT (run as an adversarial builder before delivery)

| severity | check | status |
|---|---|---|
| HIGH | grounding — any number not traced to a command | **none** (§3, §10.1 carry the outputs) |
| HIGH | verifiability — any criterion an operator cannot check mechanically | **none** |
| HIGH | plan-first integrity — ≥5 angles + tokens + threshold | **satisfied** (6 angles, T1–T6) |
| MED | mission fidelity — does §1 match the verbatim requirements | **satisfied** (§1 quotes) |
| MED | derailment fuel — ambiguous terms / contradictions | **two found and repaired**: the `src/` paths (§B.2) and the "V2 still fabricates" premise (§10.2 — Python side was fixed 2026-10-08; the live defect is the dead `f_e1CalcZFP`) |
| LOW | density — bullets-without-contracts | **none** |

**Verdict:** no unresolvable gaps. The six §9 decisions are the operator's forks, each with a
recommended default so the build can proceed without blocking.

### §14.4 WHAT THIS SPEC EXPLICITLY DOES NOT DO

- No Engine 3 (operator: phase two, forbidden until E1+E2 pass).
- **No code changes** — this artifact is the plan; the operator reviews before any edit.
- No archive move during waves W1–W5 (the archive wave runs first, logged, then re-probed).
- No edit to `Checkpoints/**`, `Original_Canon_Data/**`, the knowledge graph, or the append-only
  ship docs.
- No change to the E1/E2 *process* — prose→code only, per §4.
