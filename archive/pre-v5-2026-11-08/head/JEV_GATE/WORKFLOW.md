# THE JEV-GATED SUCCESS JUDGE — THE EXACT WORKFLOW (immutable, mandatory)

**Authority:** the operator's ruling (2026-10-09), verbatim: *"The only success gate is a NOUL yes
or no decision from the JEV manager tool … pre-loaded with all of the context … And then Jev is
gonna decide on its own yes or no … if it says yes but you did not give it full context immediately
reject it."* · *"You are explicitly forbidden from judging or grading anything."*

**THE ONE LAW:** there is exactly ONE success gate. It is a `noul` decision from the local JEV
engine (`jm decision-tree`, the JevK5 model). No person, agent, subagent, unit test, exit code,
battery, script, or the builder's own reasoning may pass anything. **Anything you grade, test, or
pass yourself is REJECTED on sight.**

---

## §1 — WHAT IT IS

```
┌─ THE JEV-GATED SUCCESS JUDGE ───────────────────────────────────────────────────────┐
│                                                                                     │
│  THE JUDGE:  jm decision-tree  →  the local JevK5 4B model at                        │
│              http://127.0.0.1:8090/v1/systemone  (a llama.cpp GGUF server)           │
│              It returns ONE `noul` per row: the probability the answer is YES.       │
│                                                                                     │
│  THE QUESTION (the recipe, JEV_GATE/recipe.json):                                    │
│    "Given the FULL context + the ARTIFACT: is this RUNTIME-GRADE and                 │
│     PRODUCTION-GRADE? YES only if ALL FOUR hold with ZERO exceptions:                │
│       (1) the indicator COMPUTES Engine 1 + Engine 2 LIVE from the chart's own       │
│           bars — NOT baked/injected literals;                                        │
│       (2) the FULL spec is implemented;                                             │
│       (3) ALL bugs handled (no dead paths, one ZFP, one renderer);                   │
│       (4) PROPERLY TESTED with a live render on 5 real weeks with forward action.    │
│     Any partial / theatrical / baked-literal / untested artifact is a NO."           │
│                                                                                     │
│  THE DECISION (src/judge/policy.ts + src/verbs/decision-tree.ts):                    │
│    noul >= act (0.80)   → route "act"      → YES, PASS                              │
│    noul >= flag (0.50)  → route "escalate" → NOT a pass → REJECT                     │
│    noul <  flag (0.50)  → route "noop"     → NO → REJECT                             │
│    policy.fail = "closed" → a judge outage REFUSES (never a pass)                    │
│                                                                                     │
│  THE BINARY: only `route=act` is YES. Everything else (escalate, noop, a refusal,    │
│              a timeout, an outage) is REJECT. There is no third state.               │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

## §2 — HOW IT WORKS (the data flow, exact)

```
  JEV_GATE/run_gate.sh [artifact]                                     (v2 — FULL CONTEXT)
        │
        │ (1) ASSEMBLE THE FULL CONTEXT — nothing omitted (~227KB measured):
        │     · the WHOLE spec (PLUTUS_VISION_INDICATOR_PORT_SPEC.md)
        │     · the 6 ship docs (the latest entries)
        │     · the git history (last 40 commits)
        │     · the checkpoints (ls)
        │     · the WHOLE theatricality log (the anti-patterns)
        │     · the WHOLE artifact source (the .pine, 108KB)
        │     → full_context.txt
        │
        │ (2) CHUNK — the judge's payload cap is ~48KB, so the full context is split on line
        │     boundaries into ~38KB chunks (measured: 7 chunks). The artifact EVIDENCE header
        │     (sha, the SC-19 count, the ta.* count) is prepended to EVERY chunk.
        │
        │ (3) JUDGE EACH CHUNK — jm decision-tree --rows … --recipe JEV_GATE/recipe.json
        │     → one `noul` per chunk (the local JevK5 model)
        │
        │ (4) ROUTE + AGGREGATE — policy {act:0.8, flag:0.5, fail:closed}.
        │     The verdict is the AND: EVERY chunk must be `act`. ANY chunk not act → REJECT.
        │
        └─(5) EMIT — "JEV VERDICT: YES" (exit 0)  |  "JEV VERDICT: NO — REJECTED" (exit 1)
```

**MEASURED THIS SESSION (the current build, the full context):**
```
$ bash JEV_GATE/run_gate.sh
chunks: 7  (sizes: [37964, 37914, 37999, 37859, 37998, 37996, 21601])
JEV GATE (full context, 7 chunks):
  chunk 0/6  noul=0.012   route=noop
  chunk 1/6  noul=0.364   route=noop
  chunk 2/6  noul=0.002   route=noop
  chunk 3/6  noul=0.005   route=noop
  chunk 4/6  noul=0.108   route=noop
  chunk 5/6  noul=0.048   route=noop
  chunk 6/6  noul=0.073   route=noop
JEV VERDICT: NO — at least one context chunk is not act. THE ARTIFACT IS REJECTED.
EXIT: 1
```
**The current build is REJECTED by JEV on every chunk (max noul=0.364).** That is the gate working
over the FULL context — not a dense summary.

**THE WIRING FILES:**
- `JEV_GATE/recipe.json:1` — the `noul` question + the policy (the thresholds).
- `JEV_GATE/run_gate.sh:1` — the runner: assemble → chunk → judge each → aggregate (AND) → emit.
- `JmManager/src/verbs/decision-tree.ts:149-165` — the aggregation (`answersToPolicyValue`).
- `JmManager/src/judge/policy.ts:31-33` — the route ladder (`act` / `escalate` / `noop`).
- the judge server — `http://127.0.0.1:8090/v1/systemone` (the local JevK5 4B GGUF).

## §3 — THE MECHANICAL SUCCESS GATE (the ONLY one)

```bash
# THE GATE. Run it. Read the verdict. act = YES, anything else = REJECTED.
export JM_JUDGE_URL=http://127.0.0.1:8090/v1/systemone
bash /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION/JEV_GATE/run_gate.sh [artifact]
# exit 0 = JEV said YES (route=act) · exit 1 = REJECTED (any non-YES)
```

**MEASURED THIS SESSION (the current build):**
```
$ bash JEV_GATE/run_gate.sh
JM_DECISIONS rows=1 decided=1 act=0 escalate=0 noop=1 calls=1 cached=0 requests=1
JEV GATE: route=noop  noul=0.007
JEV VERDICT: NO — the artifact is REJECTED (any non-YES is a rejection).
EXIT: 1
```
**The current build is REJECTED by JEV at noul=0.007.** That is the gate working.

## §4 — THE FALSE-PASS FIX (why the gate can be trusted)

Wiring the gate exposed a false-PASS in `decision-tree.ts`: `answersToPolicyValue` raised BOTH
`a.noul` AND `a.confidence` and took `Math.max` — so a confident NO (`noul=0.086`, `confidence=0.914`)
aggregated to 0.91 and routed `act`. **The gate would have PASSED the artifact JEV rejected.**
FIXED (a `noul` answer routes on `noul` ONLY). PROVEN with a control pair:
```
item 0 (runtime-grade):  route=act    noul=0.816  → YES
item 1 (baked-literal):  route=noop   noul=0.086  → NO    ← was ACT before the fix
```
Logged F-122 (FAILURE_LOG) + EN-119 (DEBUG_LOG).

## §5 — THE CONTEXT-COMPLETENESS LAW (the operator's second requirement)

**A YES reached WITHOUT the full context is VOID.** The gate (v2) assembles the FULL context and
chunks it, so completeness is MECHANICAL — but verify before trusting ANY `act`:
```
THE CONTEXT MUST CONTAIN (all of them, or the YES is REJECTED):
  [ ] the WHOLE spec (PLUTUS_VISION_INDICATOR_PORT_SPEC.md)
  [ ] the 6 ship docs (the latest entries)
  [ ] the live graph / the git history / the checkpoints
  [ ] the WHOLE artifact source (the .pine)
IF ANY IS MISSING → REJECT the YES, re-supply the context, re-run the gate.
```
The gate prints the chunk count + the sizes; a single tiny chunk means pieces were omitted → REJECT.

## §6 — THE ANTI-PATTERNS (every way to cheat/bypass — ALL BANNED)

```
AP-G1  SELF-GRADING: the builder (or any agent/subagent) declaring its own work a PASS.
       → the builder is a CLAIM; only JEV judges. VIOLATION = REJECT.
AP-G2  A TEST AS THE GATE: citing a unit-test count / "N tests pass" / a green battery as a
       success reason. Tests are regression guards, NEVER evidence. VIOLATION = REJECT.
AP-G3  AN EXIT CODE AS THE GATE: "exit 0 / RC=0 therefore it works." VIOLATION = REJECT.
AP-G4  A WEAKER GATE SUBSTITUTED: replacing the JEV gate with VIL / a script / "direct look"
       and calling it PASS. (The 2026-10-08 substitution, F-120.) VIOLATION = REJECT.
AP-G5  PARTIAL CONTEXT: running the gate without the full context, then trusting the YES.
       VIOLATION = REJECT + re-run with the full context.
AP-G6  THE DEGRADED-RUN-AS-PASS: a judge outage / timeout / refusal reported as a pass.
       `policy.fail=closed` REFUSES; a refusal is a REJECT. VIOLATION = REJECT.
AP-G7  THE RECIPE TAMPER: editing recipe.json to lower `act` / soften the question so the
       artifact passes. The recipe is FROZEN; a change is a REJECT + an F entry.
AP-G8  THE THRESHOLD TAMPER: reading `escalate` (0.5–0.8) as a pass. Only `act` is YES.
AP-G9  THE EVIDENCE-SUBSTITUTION: hand-writing the artifact evidence (the SC-19 count) instead
       of running the grep. The evidence must be a TOOL RESULT.
AP-G10 THE CACHED-FALSE-YES: trusting a cached decision after the artifact changed. Re-run the
       gate on the CURRENT artifact; a stale verdict is VOID.
AP-G11 THE SELF-REPORTED-VERDICT: typing "JEV VERDICT: YES" in prose. Only run_gate.sh's exit
       code counts; a typed verdict is a REJECT.
AP-G12 THE BOOTSTRAPPED-JUDGE: modifying the judge (the model, the adapter, decision-tree.ts) to
       make it say yes. The judge is IMMUTABLE for the build; a change is a REJECT.
```

**THE META-AP:** any reasoning that concludes "this is fine" without the gate's `act` is AP-G1.

## §7 — THE PERSISTENT TODO (immutable, mandatory)

```
[PERMANENT] RUN THE JEV GATE AND POST ITS VERDICT — do not pass anything yourself.
  the gate:  bash JEV_GATE/run_gate.sh [artifact]
  the pass:  route=act  (only).  Everything else = REJECT.
  the context: full (spec + ship docs + graph + git + artifact) — partial context = REJECT.
  forbidden: self-grading, a test count, an exit code, a weaker gate, a tampered recipe,
             a typed verdict, a bootstrapped judge. (AP-G1..AP-G12)
  failure to run the gate = the work is DELETED.
```

## §8 — THE STOP (the only legal finish)

**The run is DONE only when `bash JEV_GATE/run_gate.sh` prints `JEV VERDICT: YES` (route=act) over
the FULL context AND the operator looks at the live render (C16).** ANYTHING LESS IS OPEN. No
self-declared completion. No "looks good". The gate's `act` is the only green.
