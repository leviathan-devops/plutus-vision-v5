# PLUTUS V6 — NEXT-STEPS BLUEPRINT v2

**Supersedes v1** (the 2026-09-15 artifact — pre-canon, pre-tenancy, pre-correction).
**Base:** `packages/plutus-v6-fresh/` (17,5xx lines, 30 files, three gates green) — THE SPEC.

## §0 THE VERDICT (one screen)

```
  THE STATE  the build package is COMPLETE (16,406+ lines, all floors, 3 gates green).
             the MACHINE does not exist. the canon is on disk; the Jev substrate is LIVE (:8090,
             106ms, 0 tokens); the instruments are frozen; the 5.2 reference is at 14/21.
  THE CAUSE  (1) the 5.2's own record: THREE SPREAD values (12/9/4) each "landed" — a bound fits a
             WEEK, not the market. (2) the operator's mandate: the processing becomes JEY-based.
             (3) the V6 forensic: a decision surface whose output could be DISCARDED silently.
  THE FIX    the canon pipeline (code) + the Jev decision plane at the canon's 5 hooks — gated by
             a PREDICATE that fails when any hook's verdict fails to CHANGE an outcome, when any
             E1/E2 part drifts from v5.3.3, or when the multiweek gate is red.
  THE BAR    ≥90% of the 21 rows (--min=0.9, the operator's own locked directive) on ANY week.
```

## §1 THE MEASURED START STATE

| Component | Declaration | IS IT WIRED? | The evidence |
|---|---|---|---|
| the E1/E2 canon (v5.3.3, 4,216L) | the immutable architecture | **ON DISK, not synced** | `Original_Canon_Data/TTE System Prompts/…` |
| the E3 canon (1,685L) | the 12 phases + the 5 hooks | **ON DISK, not synced** | `Original_Canon_Data/TRIDENT_v5.3.3_CORRECTED_E3_ENGINE.md` |
| the Jev substrate | `:8090` jevk5-4b | **LIVE** (106ms, 0 tokens, measured) | `curl :8090/v1/systemone` |
| the Jev Gates engine | `reason.runChain` · `runtime-array` D1-D7 · `judgeCall` | **BUILT, ORPHANED** (zero callers) | `Jev_Gates/src/jev/` |
| the 5 trading recipe packs | the canon §8.12 | **ABSENT** (grep 0) | the Engineering bible |
| the instruments | score-golden / null / multiweek | **FROZEN** (the checkpoint `specs/`) | `--min=0.9` in the header |
| the 5.2 reference | the tuned pipeline | **LIVE at 14/21** (its own logs) | `packages/plutus-v5.1/` |
| the dashboard | the triangle's viewer | **BUILT, :9430 DOWN** | `FINAL_STATUS.md` |
| the TV layer | the MCP v4 (50 tools) + the 3.0 + the embed machinery | **BUILT, DISCONNECTED** (no edge to V6) | `08-THE-TV-LAYER.md` |
| the tenancy | OpenFang shared w/ Jarvis | **LIVE, single-agent** (jarvis-meta only) | `~/.openfang/config.toml` |
| the per-week bundles/oracles | the generalisation | **ONE bundle, ONE oracle** | `specs/fixtures/bars/` = 1 file |

## §2 ★ THE ROOT CAUSE, VERBATIM

**THE 5.2'S OWN RECORD — the week-coupling** (`packages/plutus-v6-fresh/02-FIRST-PRINCIPLES.md:19-27`, the wave table):
> ```
> W6    SPREAD=12              8 → 9      LANDED
> W12   SPREAD=9              10 → 11     LANDED (the GU 2→5; the first GU hit 1.3366@1.0p)
> W14+W12b  the pivot priority + SPREAD=4  11 → 14   LANDED (the EU 4/8 → 7/8)
> ```
> **THREE different SPREAD values, each "LANDED" at a different moment.** That is the signature of
> gradient descent on a knob — each wave moves the score by the geometry of ONE week's grid, and
> the next week would re-tune it.

**THE OPERATOR'S MANDATE** (`00-MISSION.md:8-10`, verbatim):
> "we still keep the E1/E2/E3 that doesn't change but the codebase mechancis behidn hwo these are
> processed now becomes entirely Jev based w/ coded algorithms being bridges between Jev cores and
> the runtime env"

**THE V6 FORENSIC'S OPERATOR QUOTE** (the discarded-decision class, from the V6_BUILD record):
> "you still havent explain HOW the decisons were even ABLE to be discarded this should be
> mechanically impossible"

**THE CANON'S OWN DIRECTION** (`TRIDENT_v5.3.3_CORRECTED_E3_ENGINE.md:881`, verbatim):
> "Optional in v5.3.3 — required in v6. These hooks allow E3 to be upgraded in-place to a JEV
> decision-plane architecture without rewriting the engine."

**THE BAR** (`specs/acceptance/score-golden.ts`'s header, verbatim):
> "The acceptance bar (operator directive, Task 14): >= 90% of the 21 scoreable rows (the 80% bar
> of the C4 directive was RAISED to 90% by the operator — 'target is now 90%' — locked before the
> loop that achieved it)."

## §3 THE THREE PROOFS

**PROOF 1 — the CODE that commits the error (the 5.2's tuning):**
`grep -n "SPREAD" packages/plutus-v5.1/RUNNING_DEBUG_LOG.md | head -5` → the three landed values
(12/9/4) at :19/:25/:27 of the first-principles doc's transcription. **The code tunes a bound, not
a judgment.**

**PROOF 2 — the ID/TOKEN in the wrong place (the orphaned engine):**
`grep -rn "runChain\|runtime-array\|judgeCall" Jev_Gates/src/ --include="*.ts" | grep -v test` →
the definitions exist (`reason.ts:160L`, `runtime-array.ts:200L`, `kernel.ts:97`) with **zero call
sites** outside the tests. **The judgment machinery is built and unwired.**

**PROOF 3 — the PLAN/DOC that omits the packs (the absent recipes):**
`grep -rn "zone-classification-check\|cascade-routing-check" Bibles/JEV_ENGINEERING_BIBLE.md` →
**0 hits** (the measured finding). **The canon names 5 recipes that exist nowhere on disk.**

## §4 ★ THE PREDICATE

```typescript
interface V6MachineValidity {
  canonSyncPerPart:   "PASS" | "FAIL";   // every E1/E2 part 100% synchronous w/ v5.3.3
  hookEffectCount:    number;            // hooks whose verdict CHANGED an outcome (>= 5)
  recipePackCount:    number;            // authored trading packs (>= 5, versioned JSON)
  goldenScore:        number;            // score-golden --min=0.9 (>= 0.90)
  sustainedNumerator: number;            // multiweek (>= 15 across >= 2 weeks, no floor breach)
  nullBaseline:       number;            // (<= 0.25)
  tenancyBootCheck:   "PASS" | "FAIL";   // the 7-point boot check
}
THE MACHINE IS VALID IFF
  canonSyncPerPart == "PASS" AND hookEffectCount >= 5 AND recipePackCount >= 5
  AND goldenScore >= 0.90 AND sustainedNumerator >= 15 AND nullBaseline <= 0.25
  AND tenancyBootCheck == "PASS"
ELSE V6_MACHINE_NOT_VALID   // a LOUD failure; the build does not ship
```

**THE NAMED ERRORS (the frozen tokens):** `V6_MACHINE_NOT_VALID` · `CANON_DRIFT_PART_<n>` ·
`HOOK_INERT_<hook>` (a hook whose verdict never changes an outcome — the model-answers class) ·
`RECIPE_PACK_ABSENT` · `SUSTAINED_FLOOR_BREACH` · `TENANCY_FAIL_<1-7>`.

**★ THE METRIC INVERSION:** the old number measured the SCORE on ONE week (90.5% = the max-of-6,
satisfied 58% by chance). **The new number measures the GENERALISATION** (the sustained numerator
across ≥2 weeks) **and the WIRING** (the hook effect count). **A green golden with a red multiweek
is NOT VALID. A hook that answers but never flips a verdict is NOT WIRED.**

**THE COUNTERFACTUAL TEST:** *if the fix were reversed* — the hooks unwired, the canon drifted, the
multiweek ignored — **the 5.2's own failure returns** (the one-week fit at 67%) and the V6
forensic's class returns (a discardable decision). **If nothing changes, the predicate is
decorative — this one aims at the mechanism.**

## §5 THE WAVE PLAN (every row an EDGE — the refusal rule stated)

**★ A WAVE NAMING ONLY A FILE AND NO EDGE IS REFUSED.**

| Wave | THE EDGE (the thing that becomes true) | The gate (the predicate fragment) |
|---|---|---|
| **W0** | the instruments + the oracle + the weeks are COPIED and the baseline RE-MEASURED — the reference is pinned | the baseline table + the instrument SHAs recorded |
| **W1** | a candidate's evidence REACHES the hooks — the state/marshal bridges carry the 12 fields + the provenance | `test_candidate_provenance` — every candidate's provenance resolves |
| **W2** | **the 5 hooks DECIDE** — the recipes authored (the canon's criteria verbatim), the hooks wired, a verdict CHANGES an outcome | `test_recipe_packs_authored` · **`test_hook_effect` — each hook's verdict flips an outcome (the HOOK_INERT kill)** |
| **W3** | every bar is DERIVED (the control + the cost) — no invented threshold anywhere | `test_derived_bars_only` |
| **W4** | an unticketed act is BLOCKED — the FactStore's delta gate fires | `test_ticket_blocks_unticketed` |
| **W5** | **ANY week is measurable** — the 3 bundles + the per-week oracles + the sustained gate GREEN | `test_golden_90` · `test_multiweek_sustained` · `test_null_le_25` |
| **W6** | a paper trade's fill is READ BACK — the TV edge closes the loop | `test_browser_live` · `test_paper_trade_fill` |
| **W7** | the adversarial corpus is CLEAN + the audit PASSES + the docs at floor | `GATE: PASS (0 crit/high)` |

**THE DEPENDENCIES:** W1 → {W2, W3, W4, W5} → W6 → W7. **The canon-sync test runs in EVERY wave**
(a drift fails the wave on sight).

## §6 THE DETECTORS (one command, exit nonzero = FAIL)

```bash
# scripts/v6-firewall.sh — the one-command firewall (exit nonzero = FAIL)
canon_sync()   { diff <(the canon part) <(the implementation) || echo "CANON_DRIFT_PART_$1"; }
hook_effect()  { grep -c "verdict_changed" .trident/hook-ledger.jsonl; }
recipe_packs() { ls src/jev/recipes/*.json | wc -l; }
phantom()      { [ -n "$(git diff --name-only)" ] || echo "PHANTOM"; }
unwired()      { grep -rn "runChain" src/ --include="*.ts" | grep -v test | wc -l; }
stale()        { [ src/jev/recipes/*.json -nt dist/ ] || echo "STALE"; }
theatrical()   { grep -L "import.*real" tests/*.test.ts; }
# BUNDLE: bash scripts/v6-firewall.sh → exit 0 = the machine holds
```

| The class | The detector | The auto-reject |
|---|---|---|
| THE PHANTOM | `git diff --name-only` empty | KICK BACK |
| THE UNWIRED | `grep runChain src/` = 0 consumers | FAIL |
| THE INERT HOOK | the hook ledger has no `verdict_changed` row | **HOOK_INERT** FAIL |
| THE STALE | the source mtime > the artifact | FAIL |
| THE THEATRICAL TEST | a test not importing the real artifact | FAIL |
| THE CIRCULAR TOKEN | the token in prose, not a tool result | FAIL |
| THE CANON DRIFT | the per-part diff | **CANON_DRIFT** FAIL |
| THE TENANCY | the 7-point boot check | TENANCY_FAIL FAIL |

## §7 THE EXECUTION CONTRACT

1. **DISPATCH** the wave-manager (`task`); the board initialized BEFORE the first dispatch.
2. **POLL** the session stream (the only liveness truth).
3. **AUDIT per wave:** (a) the stream gate — the return intact; (b) the phantom — sha256 before/after;
   (c) the per-hunk — every hunk on disk; (d) **the mechanical — the orchestrator runs tsc + the
   battery + the firewall ITSELF**; (e) the adversarial — the negative half, zero misfire.
4. **VERDICT** CORRECT | FLAWED | FITTED-TO-GOLDEN | FABRICATION | VIOLATION | CREEP.
5. **CLOSE** the ledger row + the docs.
**The escalation ladder:** violation 1 → kick; 2 → reassign; 3 → **retire the desk, build it yourself.**

## §8 THE EXACT TESTS (positive + negative per component)

| Component | POSITIVE | NEGATIVE (zero misfire) |
|---|---|---|
| the canon sync | the per-part diff clean | **a one-token mutation → CANON_DRIFT fires** |
| hook 1 (zone) | a BoM classified | a wrong-side candidate → DENIES (the B2 kill) |
| hook 2 (shape) | the shape matches | a compound question → the authoring gate FAILS |
| hook 3 (trade) | a valid projection ALLOWs | **an invalid projection → DENIES (fail=closed)** |
| hook 4 (the fuse) | the window healthy | **3 losses in 5 → TRIP → the agent pauses** |
| hook 5 (cascade) | INVERSE routed | a NO_CASCADE case → DENIES (fail=closed) |
| the ledger | a row per decision | a decision with no row → IL-15 FAIL |
| the ticket | a ticketed act runs | an unticketed act → BLOCKED |
| the multiweek | ≥15/21 across ≥2 weeks | **a one-week fit → SUSTAINED_FLOOR_BREACH** |
| the bars | every bar derived | a bare literal → UNDECLARED_THRESHOLD |
| the tenancy | the 7-point boot PASS | **a jarvis-port bind → the suite does NOT boot** |
| the browser | the live port + the fill | software GL / a fake fill → FAIL |

## §9 THE SCOPE (the operator's, VERBATIM — NO SHRINK)

> "i am about to hand to the newly released Opus 5.5 as a test to see if it can one-shot the
> build… Opus should give me a LEGIT WORKING Plutus agnet tested on a real runtime browser +
> trading vew paper trading/bar replay w/ V6 architecture driving all of the autonomous trading
> decisions, local models wired into the agent's operations, Jev being the primary decision making
> intellignet, all new jev bibles… properly integrated, etc etc"

**NO SHRINK. A build that wires fewer components is a FAILED BUILD, not a smaller scope.**

## §10 THE OPEN DECISIONS (each with its default — no stalls)

| OD | The fork | The default |
|---|---|---|
| OD-1 | the 5.2 agent's fate | fork beside; the cutover is the operator's |
| OD-2 | the per-week oracles | the sustained gate until they exist (P0 named) |
| OD-4 | the VRAM eviction | none on the score path; the browser at W6 |
| OD-9 | the React-ban waiver | the codegen path |
| — | the poolside key | **ROTATE (immediate)** |

## §11 WHAT IS ALREADY ON DISK (the pinned package the build starts from)

`packages/plutus-v6-fresh/` — 30 files, ~17,5xx lines: THE_PIN (124, validated) · MASTER_PROMPT (1,166) ·
the DPL1 (3,000) · the blueprint (1,104) · the decision plane (1,044) · the first principles (1,004) ·
the TV layer (1,170) · the toolkit (983) · the triangle (805) · the tenancy (849) · the meta-orchestrator
(637) · the mechanical tool (674) · the Pine render (502) · the UI kit (530) · the waves (559) · the
worker plan (304) + W1-W6 · the discovery (401) · the pi harness (394) · the planning suite (502,
APPROVED) · the question set (237) · the superseded cores (168, marked) · the mission (59) · the goals (63) · the index.

## §12 THE SELF-CHECK + THE RESIDUAL

**SELF-CHECK:** the specs read (the package IS the spec) ✓ · the root cause VERBATIM (5 quotes, anchored) ✓ ·
3 proofs with commands ✓ · **§4 is a PREDICATE with named errors + the counterfactual** ✓ · every wave
an EDGE ✓ · the detectors runnable (the one-command firewall) ✓ · the execution contract + the ladder ✓ ·
both test halves ✓ · the scope VERBATIM + NO SHRINK ✓ · the residual below ✓.

**THE RESIDUAL:** (1) the firewall script is SPECIFIED, not yet written to `scripts/` — W0 mints it;
(2) the per-week oracles' authorship is unowned (OD-2); (3) the canon-sync diff's exact per-part
mechanism (a semantic diff vs a text diff) is W1's first design decision; (4) the 5.2 agent is LIVE —
its final state at the cutover is unknowable now; (5) the one-shot claim is untested until the Opus run.

---

## §13 THE WAVE EDGES EXPANDED (the mechanism per edge — what becomes TRUE and HOW)

### W0 — THE REFERENCE IS PINNED
**The edge:** the instruments + the oracle + the weeks exist in `reference/` with their SHAs recorded,
and the baseline (14/21 · the null 0.0% · the suite 528/0 · the 3-week rows) is re-measured THIS session.
**The mechanism:** `cp` the frozen set from the checkpoint `specs/acceptance/` + `specs/fixtures/` +
`specs/harness/multiweek.ts` → `sha256sum` each → run `score-golden --min=0.9` + `null-test` +
`multiweek` on the COPIED set → the table. **The 5.2 tree is NEVER written (READ-ONLY).**
**The anti-edge (what fails it):** a copied instrument whose SHA differs from the checkpoint's — the reference is unpinned.

### W1 — THE EVIDENCE REACHES THE HOOKS
**The edge:** a candidate carries `{pair, day, direction, entry, sl, tp, anchorZoneId, shape, dayShape,
srcSignalMs, rrr, mitigationCount}` + the provenance chain, and the state constructor + the marshaller
deliver it bounded (≤2KB/item). **The mechanism:** B1 (bars → the observables; the anchor filter;
`NO_BARS`/`FUTURE_BAR_LEAK`) + B2 (the answer → the typed `CoreResult`; the legend unwrap; the quantisation).
**The anti-edge:** a candidate whose provenance does not resolve to an E1 zone + an E2 day — `test_candidate_provenance` FAILS.

### W2 — THE HOOKS DECIDE (the core edge)
**The edge:** the 5 recipes exist as versioned JSON (the canon's criteria VERBATIM), the 5 hooks are
wired at their canon points, **and each hook's verdict CHANGES an outcome** — the ledger records
`verdict_changed` per hook. **The mechanism:** the recipe authoring (the canon §8.12's criteria text →
the bible's schema) → the wiring (hook 1 between `classifySDZone` and the chain build; hook 2 between
`anatomy()` and `classifyShape()`; hook 3 at Phase 12; hook 4 post-`computeAccurateStats`; hook 5 at
Phase 10) → the shadow rollout (50+ rows) → the activation → **the effect test: flip the evidence,
assert the verdict flips.**
**The anti-edge (THE KILL):** a hook that answers but whose verdict never flips an outcome →
`HOOK_INERT_<hook>` — **this is the exact class that let the V6 Decider's output be discarded.**

### W3 — EVERY BAR IS DERIVED
**The edge:** the bars file is the ONLY constant source; each bar carries its control (the 21 rows +
the 9 mutants + the misses) + its cost matrix derivation. **The anti-edge:** a bare literal anywhere
else → `UNDECLARED_THRESHOLD`.

### W4 — THE UNTICKETED ACT IS BLOCKED
**The edge:** the FactStore's 17 observers write immutable rows; the delta gate fires a judgment IFF
a row was appended; an unticketed act BLOCKS with a named remedy. **The anti-edge:** a hard arm
(observed but never blocking) → the anti-brick law VIOLATED.

### W5 — ANY WEEK IS MEASURABLE (the generalisation edge)
**The edge:** 3 bundles exist (2026-06-29 · 07-06 · 07-13) + the per-week oracles + **the sustained
gate GREEN (≥15/21 across ≥2 weeks, no week below the floor)**. **The mechanism:** `build-bundle.ts`
materialises the adjacent weeks from the Vibe/Air CSVs; the oracle rows are authored (OD-2) or the
sustained gate carries the generalisation alone; `multiweek.ts` runs.
**The anti-edge:** a green golden with a red multiweek → `SUSTAINED_FLOOR_BREACH` — **the one-week fit is NOT valid.**

### W6 — THE FILL IS READ BACK (the runtime edge)
**The edge:** a live paper trade WHOSE FILL THE MACHINE CAUSED is read back (`POSITION_OPENED` →
the P&L), and the bar-replay drives a chosen week. **The mechanism:** the TV MCP merge (v4 + the 3.0)
→ the dashboard-hosted Weston display → the 4 tabs (the BUILT machinery connected; the cdp-bridge
re-pointed from container-Chrome) → the ONE edge (the Correlator → the OMS).
**The anti-edge:** a fake fill / software GL / a second browser instance → FAIL.

### W7 — THE CLOSE
**The edge:** the adversarial corpus returns ZERO confirmed defects; `qwen-code-audit` returns
`GATE: PASS (0 crit/high)`; the 11 canon + 6 ship docs are at their floors; the checkpoint is sealed
(the round-zero already exists).

## §14 THE DETECTORS' RAW OUTPUTS (run against the current state — the honest baseline)

```
  $ grep -c "SPREAD" packages/plutus-v5.1/RUNNING_DEBUG_LOG.md
  6            # the three landed values + the reverts — the tuning record

  $ grep -rn "runChain" Jev_Gates/src/ --include="*.ts" | grep -v test | wc -l
  0            # ★ THE ORPHAN — the engine is built, zero consumers

  $ grep -rn "zone-classification-check" Bibles/JEV_ENGINEERING_BIBLE.md | wc -l
  0            # ★ THE ABSENT PACKS — the canon names 5 recipes that exist nowhere

  $ ls specs/fixtures/bars/*.json 2>/dev/null | wc -l     # (the LIVE tree)
  1            # ★ ONE bundle — the generalisation is unmeasurable today

  $ curl -s --max-time 3 http://127.0.0.1:8090/health
  {"ok": true, "model": "jevk5-4b-v0.2-Q8_0", "runtime": "gguf"}   # ✓ THE SUBSTRATE IS LIVE

  $ nvidia-smi --query-gpu=memory.free --format=csv,noheader
  59 MiB       # ★ the constraint — the browser needs the eviction first
```

**THE HONEST READ:** the firewall today returns **FAIL on 4 detectors** (the orphan · the absent
packs · the one bundle · the VRAM) — **that IS the next-steps list, mechanically.**

## §15 THE FIRST THREE COMMANDS (what a successor runs first)

```
  1. cd packages/plutus-v6-fresh && bash scripts/v6-firewall.sh     # the baseline FAIL (expected)
  2. bun specs/acceptance/score-golden.ts --min=0.9                 # the 5.2's 14/21 reproduced
  3. cat .trident/board.md                                          # the board state — then W0
```

<!-- V2 COMPLETE -->
