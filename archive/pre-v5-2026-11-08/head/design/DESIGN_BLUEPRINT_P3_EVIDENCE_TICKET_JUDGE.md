# DESIGN BLUEPRINT — PHASE 3 · THE EVIDENCE-TICKET JUDGE (an independent System One inside the tool)

**Status:** SPEC. Phase 1 (the two tools) is deployed. Phase 2 (the agent-desk verb surface) is specified
and is the next thing EXECUTED. This document is Phase 3: the tool stops asking the agent whether its own
work is good, and instead returns a **ticket** — a hash-addressed bundle of (blueprint section, screenshot,
judge verdict, boolean) — that a mechanical gate can require before any success claim lands.

**What is being manufactured:** an embedded verifier. The tool captures the frame, hands it — with the
*excerpt* of the blueprint that governs it — to a **local, independent System One judge**, gets a typed
verdict, and writes an **evidence ticket** whose SHA-256 is the only thing a success claim may cite.

---

# §0 · THE CONSTRAINT, AND THE SPLIT IT FORCES

**THE MEASURED LAWS** (read off the live host, not assumed):

```
  the judge        :8090 → imajev-4b-Q6_K · modalities ["text","image"] · backend llama:200
  its projector    llama-server --mmproj imajev-4b-mmproj-f16.gguf      ← image input is REAL, today
  its window       -c 16384          ← 16,384 tokens TOTAL
  its state cap    state_char_cap 24000
  its image form   "multipart/form-data: image[] + request"
```

> **THE ONE PHYSICAL LAW: THE JUDGE IS 4 BILLION PARAMETERS WITH 16,384 TOKENS, AND ONE IMAGE COSTS
> HUNDREDS OF THEM.** It cannot hold a repository, a diff, a conversation, or a design document. It can
> hold *one picture and one question* — and only if that question arrives with the smallest sufficient
> text.

**THE SPLIT IT FORCES — five consequences, each of which is a component**

```
CONSTRAINT: a 16K window holding one image
   │
   ├─ 1 · THE BLUEPRINT CANNOT BE SENT. A SECTION must be.
   │      → every normative clause carries a stable id (§5.3) and the tool sends exactly the clauses
   │        that govern the artifact under judgement, capped and counted (§2 budget).
   │
   ├─ 2 · ONE QUESTION PER CALL. A compound question collapses a 4B judge to ~0.5 and clears nothing.
   │      → the judge is asked a NOUL ("does this frame satisfy clause B7.2?") and, when the answer is
   │        no, a CHOICE over a CLOSED defect-class list (§5.2). Never "assess this".
   │
   ├─ 3 · THE IMAGE MUST BE DOWNSCALED AND CROPPED TO THE REGION UNDER TEST.
   │      → a failure mode is a region, not a picture: the ticket names the region, the capture crops to
   │        it, and the full frame is kept beside it for the human (§4.3).
   │
   ├─ 4 · THE VERDICT MUST BE TYPED AND THE TICKET MUST BE CONTENT-ADDRESSED.
   │      → {section, screenshot, judgment, pass:bool} → one SHA-256 → a bundle that unpacks into exactly
   │        those four parts (§6). A verdict without its ticket id is not evidence.
   │
   └─ 5 · THE ENFORCEMENT CANNOT BE A PROSE RULE.
          → TTSR reads the PROSE STREAM and cannot stat a file; a success claim is gated by a HOOK that
            CAN (tool_result / before_agent_end) plus the pre-commit (§7). Stated plainly because the
            operator asked for "a TTSR rule" — the token it injects is real, but it is the *alarm*, and
            the hook is the *lock*.
```

**WHAT THE CONSTRAINT KILLS (designs that would have looked complete)**

- "Give the judge the whole blueprint and the screenshot" — 40k tokens into a 16k window; the adapter
  truncates and the judgement becomes a coin flip nobody can see.
- "Ask the judge to assess the render quality" — no ceiling, no defect list, and a 4B model answers
  "looks good" to almost anything (the measured compound-question failure).
- "Store the verdict in the agent's prose" — the agent is the one being judged; its prose is the claim.
- "Have TTSR block the claim" — TTSR cannot read the filesystem; a rule that cannot see a ticket cannot
  require one. The hook can, so the hook does.
- "Reuse one ticket across phases" — a ticket is bound to (section id + artifact sha + judge call id);
  rebinding is a new ticket or it is a forgery.

---

# §1 · THE STACK — six planes, ONE dependency direction

```
  L5  ENFORCE     the hook + TTSR alarm + pre-commit    the only layer that can refuse a claim
        ▲
  L4  TICKET      the content-addressed bundle           §6 — the artifact a claim may cite
        ▲
  L3  JUDGE       the System One call (noul / choice)    §5 — the independent verdict
        ▲
  L2  EXCERPT     clause selection + budget packing      §2 — the only thing the judge ever reads
        ▲
  L1  CAPTURE     frame → region crop → downscale        §4 — pixels into a judge-sized form
        ▲
  L0  BINDING     clause ids in the blueprint            §5.3 — a design that can be cited
```

| plane | consumes | produces | owner | when absent |
|---|---|---|---|---|
| **L0 BINDING** | a blueprint with `[B7.2]` ids | a clause table (id → text) | the design docs | `CLAUSE_NOT_FOUND` — nothing can be judged |
| **L1 CAPTURE** | the instance + a region spec | a cropped, downscaled PNG + its sha | pinebox/computer | `CAPTURE_FAILED` / `REGION_EMPTY` |
| **L2 EXCERPT** | clause ids + the budget | a packed prompt under the cap | the tool | `BUDGET_EXCEEDED` — refuses instead of truncating |
| **L3 JUDGE** | the excerpt + the image | `{answer, p, class}` typed | :8090 | `JUDGE_DOWN` / `JUDGE_TIMEOUT` — never a pass |
| **L4 TICKET** | the four parts | `ticket-<sha256>` + a ledger row | the tool | `TICKET_WRITE_FAILED` |
| **L5 ENFORCE** | a claim + the ticket dir | allow, or a refusal that names the missing ticket | hooks | `NO_TICKET` — the claim is refused |

**No arrow points down.** L5 never judges; L4 never calls the model; L3 never reads a file; L2 never
captures; L1 never knows a clause exists. Each plane is independently testable, and a broken judge (L3)
cannot corrupt a ticket (L4) that was already written.

---

# §2 · L2 — THE EXCERPT AND ITS BUDGET (the arithmetic that keeps the window honest)

The judge's window is 16,384 tokens **including the image**. The image's cost is model-specific and
must be MEASURED per capture size, not assumed — so the tool measures it once per resolution and stores
the constant (M6: every number traced).

```
BUDGET (measured constants live in the gate file, never in this prose)
  image, 1024x576 q80 .......... I_1024   (measured once, recorded)
  image, 512x288  q80 ........... I_512    (measured once, recorded)
  instructions .................. <= 400 tok   (fixed text, authored once)
  clauses ....................... <= 2,000 tok (the excerpt)
  the question .................. <= 120 tok
  headroom for the answer ....... >= 1,000 tok
  ---------------------------------------------------------------
  REFUSE when (I + instructions + clauses + question + answer) > 15,000
```

**Packing rules (mechanical, in this order):**

1. the clauses named by the **phase's evidence requirement** (the execution workflow's ticket table) —
   always included, never trimmed;
2. then clauses the artifact's **defect class** can violate (the class list of §5.2);
3. then, if budget remains, the section's own heading + the one sentence before each clause.

**The refusal is the design:** `BUDGET_EXCEEDED` names which clauses were dropped and by how much. A
silently truncated prompt is the one failure this plane exists to prevent — the answer would be about a
document the judge did not receive.

---

# §3 · THE PROCESS IT PRESERVES

**Before:** the agent rendered, then told the operator "it works". Whether it looked was unverifiable —
the operator re-asked five times, and the truthful answer ("I did not open the frame") was never obtainable
from the transcript.

**After, and preserved:** the operator still says *"open pinebox, run the indicator, look at it"*. What
changes is the last step: **"look at it" is no longer the agent's act.** The tool captures, the judge
decides, the ticket records. The agent's claim is then either backed by a `pass:true` ticket or refused
by the hook — and the ticket is a file with a hash, not a sentence.

**Nothing about the operator's workflow changes. What changes is who is believed.**

---

# §4 · L1 — CAPTURE: pixels into a judge-sized form

| field | value |
|---|---|
| consumes | the instance id + a **region** (`full` \| `chart` \| `x,y,w,h` as fractions) |
| produces | `region.png` (cropped, downscaled, q80) + `frame.png` (the untouched full capture) + both shas |
| invariant | the region box is in the ticket, so a second reader can reproduce the crop from the full frame |
| failure | `CAPTURE_FAILED` · `REGION_EMPTY` (the crop is one colour) · `FRAME_BLANK` |

**Why a region and not a frame:** a failure lives somewhere. "The zone band is fat" is a claim about the
chart pane, and a 1626×931 full frame spends its tokens on a file tree and a status bar. The crop is not
cosmetic — it is what makes a 4B judge able to see anything at all.

**The invariant that makes it auditable:** the full frame is kept BESIDE the crop and its sha is in the
ticket. A human disputing a verdict can re-crop the same region and re-ask the same question.

---

# §5 · L3 — THE JUDGE: one clause, one question, one typed answer

## §5.1 The two primitives (nothing else is allowed)

| primitive | shape | used for |
|---|---|---|
| **NOUL** | "Does this frame show <clause's observable>? yes/no" → `p(yes)` | the pass/fail of a clause |
| **CHOICE** | "Which of these describes the defect? <closed list>" → `p` per label | naming WHAT is wrong, so the fix has an owner |

A FREE-TEXT answer is banned: it cannot be thresholded, cannot be hashed into a ticket as a decision, and
a 4B model asked "what is wrong" writes a paragraph that reads plausibly and binds to nothing.

## §5.2 The defect-class list is CLOSED (it is the routing table)

The classes come from the measured failures of this project, not from imagination:

```
FAT_BLOCK          a band fills the range instead of sitting at its level
PERMUTED_TICK      an axis label sits where another should be
WRONG_WEEK         the frame's week label differs from the loaded bars' ISO week
EMPTY_CHART        the pane is blank or holds one colour
CANDLES_CRUSHED    an overlay forces the price axis so the bars collapse
LABEL_OVERLAP      text collides with text or with the plot
WRONG_COLOURS      the element's colour violates the clause's colour law
MISSING_ELEMENT    a required element is absent
  (NO ESCAPE HATCH - the nine classes above are EXHAUSTIVE. The choice question forces one
   of them. If the judge cannot place the defect the call returns DEFECT_UNCLASSIFIED and
   the run is FAIL/INCONCLUSIVE - never routed, never bucketed, never counted as a class.
   An unclassifiable defect means the TAXONOMY is deficient: the line stops and the
   taxonomy is extended before any further verdict is accepted.)
```

Each label maps to an OWNER FILE in the execution workflow's routing table. A class that fires twice
becomes a new mechanical check (the structural-encoding law), never a paragraph.

## §5.3 Clause ids — a design that can be cited

Every normative clause in a blueprint carries a stable id in the text: `… (C3.1)`. The clause table is
extracted mechanically (`grep -oE '\([A-Z][0-9]+\.[0-9]+\)'` + the sentence it closes), so the excerpt is
never hand-copied. A clause without an id cannot be judged, and `CLAUSE_NOT_FOUND` says exactly that.

## §5.4 Calibration is DERIVED, and the controls run every time

```
  1  fixtures: N known-good frames and N known-bad frames, labelled by the operator (or by a
     measured defect injected on purpose)
  2  sweep the threshold 0.5 / 0.6 / 0.7 / 0.8 / 0.9; record precision + recall
  3  max < 0.5 → the QUESTION is broken (usually compound) → rewrite it, do not lower the bar
     spread < 0.25 → the question does not discriminate → rewrite it
  4  every call: a positive control (obvious pass, must be >= 0.85) and a negative control
     (obvious fail, must be <= 0.15) go through the SAME clause. If they do not separate:
     JUDGE_BLIND → the run is VOID, never a pass.
  5  `act` is written into the gate file WITH the sweep beside it. It is not a taste.
```

**The measured reason rule 3 exists:** a compound question ("is this a shipping failure or a defect?")
caps a 4B judge below 0.5 and clears no threshold; a single sharp claim measured 0.949 with a 0.902
spread. The judge is not weak — a two-part question is.

---

# §6 · L4 — THE EVIDENCE TICKET (exactly the operator's four parts)

```
evidence/
  tickets/<sha256>.ticket/
      1 · clause.md          the blueprint section text + its clause ids (the requirement)
      2 · region.png         the cropped visual artifact      + its sha
      2b· frame.png          the full frame (re-crop proof)   + its sha
      3 · judgment.json      the judge call: model, clause ids, question, answer, p, class,
                             threshold in force, raw response VERBATIM, latency, call id
      4 · pass.json          {"pass": true|false}  ← BOOLEAN, written by the TOOL, never the agent
      manifest.json          the four part shas + the bundle sha + created_at + instance
  tickets/<sha256>.tar.zst    the same four parts, one file — "unzip and unpack"
  ledger.jsonl                one row per ticket: sha, phase, clause ids, verdict, class, artifact sha
```

**The hash is over the parts, not over a mood:** `sha256 = H(clause.sha + region.sha + judgment.sha +
pass.sha)`. Re-hashing the four parts must reproduce it. A ticket whose hash does not recompute is
`TICKET_CORRUPT` and is refused by the gate that reads it.

**`pass` is derived, never asserted:** `pass = (p >= act) AND (the controls separated)`. The tool computes
it from §5.4's constants. An agent cannot write a `true` into part 4 any more than it can write the
judge's `p` — both come from the call.

**A failing ticket is a first-class artifact.** `pass:false` tickets are kept, listed by the ledger, and
are what the execution workflow's "second occurrence → new check" rule reads. Deleting a failing ticket is
the one act this plane treats as sabotage, and the ledger (append-only, hash-chained by row sha) makes it
visible.

---

# §7 · L5 — ENFORCEMENT: the lock, the alarm, and the one thing that can actually refuse

**The honest split the operator's request implies but a single mechanism cannot deliver:**

| layer | can it read the tickets dir? | what it does |
|---|---|---|
| **the hook** (`tool_result` / `before_agent_end` in the OMP extension) | YES | refuses a turn whose text claims success and names no ticket, or names one that is absent/`pass:false`/corrupt |
| **the pre-commit gate** | YES | refuses a commit whose message cites a ticket that does not exist or does not cover the changed artifact sha |
| **TTSR rule** | NO — it sees the prose stream only | injects the correction text when a claim pattern appears; it is the ALARM that makes the violation visible in the transcript, and it says so |

**Claim vocabulary (the detector's pattern, not a suggestion):** a turn's text matching
`(works|verified|passes|it's good|render is correct|success|done|shipped)` while (a) no ticket id appears
anywhere in the turn AND (b) no gate exit 0 is quoted → `CLAIM_WITHOUT_TICKET`.

**The three refusals the lock prints:**
```
NO_TICKET        the claim cites no ticket id
TICKET_ABSENT    the id is not on disk
TICKET_FAILED    the ticket exists and pass:false  (the claim contradicts the judge)
```

**Why the ticket id must be in the CLAIM:** it makes the claim auditable by a reader who has only the
transcript — the operator's original complaint was that this was impossible.

---

# §8 · THE DEGRADATION CONTRACT — every dependency of the judge path

| dependency absent | the system does | the caller sees |
|---|---|---|
| **the judge (`:8090`)** | **refuses**. There is no fallback judge: a different model is a different instrument, and its `act` is not this `act` | `JUDGE_DOWN` — and the claim stays unproven |
| **the judge's image projector** (`--mmproj`) | refuses image calls; a TEXT-ONLY verdict about a render is worthless | `JUDGE_NO_VISION` |
| **the controls** (a good/bad frame pair) | the run is VOID; no ticket is written | `JUDGE_BLIND` / `CONTROL_UNSEPARATED` |
| **a clause id** for the thing being judged | refuses | `CLAUSE_NOT_FOUND` |
| **budget headroom** | refuses, naming the clauses dropped | `BUDGET_EXCEEDED` |
| **the region** (empty crop) | refuses | `REGION_EMPTY` |
| **the ticket dir** (unwritable) | refuses the claim; the verdict is not lost, it is not produced | `TICKET_WRITE_FAILED` |
| **the ledger** | the ticket exists but is not indexed; the hook still finds it by id | `LEDGER_APPEND_FAILED` (loud, non-fatal) |
| **the hook** (extension not loaded) | the claim is NOT gated — and the tool says so in its own result | `ENFORCEMENT_ABSENT` printed with every ticket |

**The one degradation REFUSED:** a passing ticket produced by anything other than a separated-control
judge call. A fabricated `pass:true` is worse than no ticket, because it is indistinguishable from
evidence to every later reader.

---

# §9 · THE LEARN LOOP

```
  every call writes a ledger row  →  "which clauses fail most" is a query, not a memory
  a class firing twice            →  a new mechanical check in the gate (structural encoding)
  DEFECT_UNCLASSIFIED at all      ->  the taxonomy is deficient: stop the line and extend it
  a judge answer ~0.5 on a clause →  the CLAUSE is unobservable as written; rewrite the clause
  a ticket disputed by a human    →  the region + question are re-run and the two tickets are compared;
                                     a disagreement is a calibration incident, not a re-roll
```

The ledger is append-only and row-hash-chained, so "the operator was shown 3 tickets and 2 were failing"
is a fact the record can settle.

---

# §10 · ANTI-PATTERNS, EACH WITH A MECHANICAL DETECTOR

| # | the defect this build will produce | the detector | token |
|---|---|---|---|
| T1 | the whole blueprint sent to a 16K judge | the packer sums tokens and refuses over budget | `BUDGET_EXCEEDED` |
| T2 | a compound question | calibration: a compound clause scores < 0.5 and its sweep is recorded | `CLAUSE_UNOBSERVABLE` |
| T3 | a threshold set by taste | the gate file carries the sweep beside `act`; a missing sweep is a refusal | `THRESHOLD_UNCALIBRATED` |
| T4 | the judge never proven able to see | positive + negative control on every call | `CONTROL_UNSEPARATED` |
| T5 | a `pass:true` with no judge call | the ticket hash recomputes from the four parts; a fabricated one cannot | `TICKET_CORRUPT` |
| T6 | the agent writing the verdict | part 4 is written by the tool; the hook refuses a claim whose ticket it did not write | `TICKET_UNSIGNED` |
| T7 | a ticket reused for a different artifact | the ticket binds the artifact sha; a mismatch is refused | `ARTIFACT_MISMATCH` |
| T8 | a failing ticket deleted | the ledger is append-only and hash-chained; absence is visible | `LEDGER_HOLE` |
| T9 | a success claim with no ticket | the hook greps the claim vocabulary and the tickets dir | `CLAIM_WITHOUT_TICKET` |
| T10 | a stale artifact judged | the capture sha is taken AFTER the run settles, and `NO_FRESH_FRAME` refuses a repeat | `NO_FRESH_FRAME` |
| T11 | a crop that hides the defect | the full frame rides in the ticket; a region that is one colour is refused | `REGION_EMPTY` |
| T12 | a text-only judge answering about pixels | the health check asserts `modalities` contains `image` | `JUDGE_NO_VISION` |
| T13 | enforcement silently absent | every ticket result prints `ENFORCEMENT_ABSENT` when the hook is not loaded | `ENFORCEMENT_ABSENT` |

---

# §11 · THE BUILD SEQUENCE — every exit can fail

| phase | builds | EXIT (a check that can fail) |
|---|---|---|
| **P3a · adapter** | `judge.mjs`: the :8090 client (multipart, image + request), the noul + choice calls, the health assertion | a health probe proving `modalities` contains `image`, and one real call returning a typed answer with `p` |
| **P3b · excerpt + budget** | the clause extractor + the packer | a clause table extracted from a real blueprint, and a `BUDGET_EXCEEDED` refusal on an over-long clause set |
| **P3c · ticket** | the four-part writer + the bundle + the ledger + hash recomputation | a ticket written, hash recomputed from its parts, and a tampered copy refused `TICKET_CORRUPT` |
| **P3d · controls + calibration** | the fixture pair, the sweep, `act` recorded beside it | the positive control ≥ 0.85 AND the negative ≤ 0.15 in ONE run, or the run is VOID |
| **P3e · verify --judge** | the tool verb: capture → crop → excerpt → judge → ticket | `pinebox verify --judge --clause C3.1` returns a ticket id; a deliberately broken render returns `pass:false` with a named class |
| **P3f · enforcement** | the extension hook + the pre-commit gate + the TTSR alarm | a claim with no ticket is refused by the hook; a commit citing an absent ticket is refused; the TTSR alarm fires in the transcript |
| **P3g · phase wiring** | the execution workflow's ticket table: which clauses must have a passing ticket per phase | the workflow refuses to close a phase whose required ticket ids are missing |

---

# §12 · WHAT IT INHERITS

| inherited from | why it must not change |
|---|---|
| the aether backend pattern (`aether_agent_backend_v2`: a shell that execs a durable backend with a CLI seam) | the tool stays a shell; the judge path is a backend with its own state and receipts — the same shape that already ships on this host |
| `verify`'s existing predicate set (week / ports / bars / drawings / frame / fresh) | those are ARITHMETIC and cost no model call; the judge is added ABOVE them, never instead of them |
| the refusal-ledger discipline (`refusals.jsonl`) | the ticket ledger is the same append-only, row-hash-chained shape |
| the one action table (`core/actions.json`) | `verify --judge` is a flag on an existing verb, not a 32nd verb nobody can find |
| the pstack verification-driver shape (`verify-<app>` with LAUNCH/DOCTOR/DRIVE/EVIDENCE/CLEANUP) | the ticket IS the EVIDENCE stage; the driver already has the slot |

---

# §13 · THE FILE LAYOUT

```
scripts/pinebox/
  judge/                       THE NEW PACKAGE (the embedded verifier)
    judge.mjs                  :8090 client: health, noul, choice (multipart image + request)
    clauses.sh                 the clause extractor (grep by id) + the clause table cache
    pack.mjs                   the budget packer (refuses over budget, names what was dropped)
    capture.mjs                region crop + downscale + sha (full frame kept beside it)
    ticket.mjs                 the four-part writer, the bundle, the ledger row, the hash
    calibrate.mjs              the fixture pair, the sweep, the derived `act`
    act.json                   the DERIVED threshold, with its sweep recorded beside it
  stages/verify.sh             `--judge` branch: capture -> pack -> judge -> ticket
  test/judge-*.sh              T1..T13's detectors, one must-fail each
evidence/                      the tickets (gitignored: content-addressed, regenerable per run)
~/.omp/agent/extensions/pinebox/index.ts   the hook: CLAIM_WITHOUT_TICKET / TICKET_ABSENT / TICKET_FAILED
~/.omp/agent/rules/claim-evidence.md       the TTSR alarm (injects; cannot stat)
```

---

# §14 · THE RISK REGISTER

| sev | risk | mitigation | what would falsify the mitigation |
|---|---|---|---|
| CRIT | the judge answers ~0.5 on every clause (a compound or unobservable question) and the tool ships verdicts nobody can trust | the calibration sweep + the control pair on EVERY call; `CONTROL_UNSEPARATED` VOIDs the run | a run whose positive and negative controls land within 0.2 of each other and still produces a ticket |
| CRIT | a fabricated `pass:true` reaches the ledger | the hash recomputes from the four parts; part 4 is written by the tool; the hook cross-checks the id | a ticket whose recomputed hash differs from its name but is still accepted |
| CRIT | the 16K window truncates and the judge answers about a document it did not receive | the packer refuses `BUDGET_EXCEEDED` rather than truncate | a ticket whose `judgment.json` shows fewer clauses than its `clause.md` |
| HIGH | the region crop hides the defect (a clean corner of a broken chart) | the full frame rides in the ticket; `REGION_EMPTY` refuses a one-colour crop | a `pass:true` whose full frame a human reads as broken |
| HIGH | the enforcement is absent and nobody notices | every ticket result prints `ENFORCEMENT_ABSENT` when the hook is not loaded | a session claiming success with the hook unloaded and no warning printed |
| HIGH | the judge lane dies and a *different* model silently answers | the health check asserts model id AND `modalities`; a mismatch refuses | a verdict whose `judgment.json` names a model other than `imajev-4b-Q6_K` |
| MED | tickets accumulate unbounded (a 100KB frame per call) | content-addressed + deduplicated by hash; the ledger row carries the size | an evidence dir growing without bound across a phase |
| MED | the TTSR alarm fires on legitimate prose (mentions of "works") | the alarm also requires the ABSENCE of a ticket id, and it injects rather than blocks | an alarm firing on a turn that cites a valid ticket |
| LOW | the region fractions are wrong for a different pane size | the region is fractions of the live canvas, and the crop box is written into the ticket for reproduction | a ticket whose crop does not contain the element it judged |

---

# SUMMARY — the design in one breath

The local System One judge is measured to be image-capable at `:8090` (`imajev-4b-Q6_K`, `--mmproj`, 16,384
tokens), so the tool stops asking the agent whether its own render is good: it captures the frame, crops to
the region under test, packs ONLY the blueprint clauses that govern it into the remaining budget, asks one
typed question, and writes a content-addressed evidence ticket whose four parts are the clause text, the
cropped pixels, the judge's verbatim judgment, and a boolean the TOOL computes — so a success claim is
either backed by a ticket that re-hashes correctly and says `pass:true`, or refused by a hook that can read
the disk, with the TTSR rule as the alarm that makes the absence visible.

---

## WHERE THE JUDGE CONTRACT IS ANCHORED TODAY (measured with grep -n at commit time)

| contract | anchor |
|---|---|
| the verify predicate set the judge sits above | `scripts/pinebox/stages/verify.sh:40` |
| the week arithmetic a judged clause reuses | `scripts/pinebox/stages/verify.sh:16` |
| the stale-frame rule a ticket must respect | `scripts/pinebox/stages/verify.sh:80` |
| the verb table `verify --judge` extends | `scripts/pinebox/actions.json:209` |
| the blueprint gate every design must pass | `gates/blueprint-gate.sh:4` |
| the chain the judge's detectors join | `scripts/pinebox/test/run.sh:28` |

---

# §15 · MEASURED — the calibration is DONE, and it changes three clauses

**The measurement (2026-10-26, live `:8090/v1/systemone`, `POST multipart` with `image` + `request`):**

```
question (one claim, noul)
  "Does this image show a price chart with candlestick bars and two overlaid coloured
   moving-average lines?"
POSITIVE control  (a drawn chart scene, 512x288)  ->  noul = 0.9470   >= 0.85  PASS
NEGATIVE control  (a uniform blank,    512x288)  ->  noul = 0.0712   <= 0.15  PASS
SEPARATION 0.876   |  image cost 1,173 input tokens  |  latency 1.24s / 0.81s
modality reported by the judge: "image"  ·  model imajev-4b-Q6_K
```

**So the question in §14's CRIT row — "can a 4B judge separate a chart from a blank?" — is ANSWERED: yes,
with a 0.876 gap, on the first control pair.** The instrument is not blind. `act` is therefore derivable
(§5.4) rather than hoped for, and the 1,173-token image cost at 512×288 is the constant the §2 budget
uses.

### Correction C1 · NO CROP — capture the CHART ELEMENT (operator ruling)

The operator's words: *"why would we crop anything? We don't crop shit… the screenshot should be specific
just to the chart section of Pine IDE. We don't need the entire fucking dashboard."*

`crop` and `element capture` are different acts and the design had the wrong one:

| rejected | adopted |
|---|---|
| screenshot the dashboard, then cut a pixel rectangle out of it | **capture the chart pane ELEMENT** — `Page.captureScreenshot` with a `clip` set to the canvas element's `getBoundingClientRect()` |
| the region is a fraction the caller guesses | the region is the element the page owns; nothing outside it is ever rendered into the image |
| a lossy pixel cut that can hide an edge | the element's own box, so a clipped axis label at the boundary is still inside the image |

**Compression, not amputation:** the image is sized so the whole chart pane fits the budget (measured
1,173 tok at 512×288; a full pane at 1024×576 is measured once and recorded), and if it still exceeds the
budget the tool compresses (quality, then scale) and RECORDS the factor in the ticket — it never drops
part of the chart.

### Correction C2 · TEMPORAL ANCHORING is a clause, not a hope

The operator's words: *"I gave a specific week of July 6th through 10, and then the Pine IDE was rendering
this active week and there was nothing visible… the July 6-10 week was rendered on this week's price
action instead."*

Three anchor defects, each now a judged clause with its own id:

| id | the clause | the check |
|---|---|---|
| **A1** | the chart's visible time range must CONTAIN the requested week's bars | `chart --view` range ∩ the fixture's ISO week ≠ ∅ |
| **A2** | the frame's week label must equal the bars' ISO week | `WEEK_MISMATCH` (already implemented) |
| **A3** | the rendered price band must be consistent with the fixture's own range | the visible min/max price must lie within the fixture's [low, high] ± padding |

A1 is the one that was missing: the chart can be labelled correctly and still be SCROLLED AWAY from the
week, which is exactly the "nothing visible" failure. A1 is arithmetic (no model), so it is checked on
every `run`, before any judge call.

### Correction C3 · THE JUDGE HAS A NARRATIVE EPOCH (it is not stateless)

The operator's words: *"the judge verification needs to have context continuity… a narrative epoch that is
being built turn by turn with progressive memory… so the judge remembers what happened between the last
call and this one."*

The judge is 4B with 16K — it cannot remember anything by itself, so the **epoch is passed in as the
`state` field**, assembled by the tool from the ticket ledger:

```
state = epoch_head        (2 lines: what this build is, what is being judged now)
      + last K verdicts   (K<=5: clause id · pass/fail · defect class · the one-line delta)
      + the repeat alarm  (the SAME clause has failed N times -> say so, and say what keeps recurring)
      + the delta since last call (what changed in the artifact: sha changed? week changed? bars?)
```

Bounded by the measured `state_char_cap` (24,000 chars) and the §2 token budget. An epoch that overflows
is COMPRESSED by rule — the oldest verdicts collapse to a count — never truncated mid-sentence.

**The consequence for the ticket:** part 3 (`judgment.json`) records the epoch hash, so a verdict is
reproducible *with the memory that produced it*. Two identical frames judged with different epochs are
different judgements, and the ticket says which one it was.

---

# §16 · THE NARRATIVE EPOCH — IT ALREADY EXISTS; WIRE IT, DO NOT BUILD IT

**Measured, not assumed.** The operator's instinct ("doesn't this already exist inside the aether agent")
is CORRECT. Two implementations exist on this host, and P3 adopts the aether one because it is the
substrate PINEBOX already inherits:

### The aether implementation (adopted)

```
aether-context-manager.ts:12   "(b) THE CHAIN: the memory's last-N generations + the epoch summary."
aether-context-manager.ts:60   epochSummary(): string;
aether-context-manager.ts:387  const epochSummary = memory.epochSummary();
aether-context-manager.ts:390  const chainText = renderChain(sessionWindow, priorPrompts, epochSummary);
scope-memory.ts:94,107,119     CREATE TABLE …        ← the store is SQLITE, not in-process memory
```

So the chain is already: **last-N generations + prior prompts + `epochSummary`** rendered into one text
block. That IS the narrative epoch. P3 does not invent a memory; it points the existing
`renderChain(...)` at the ticket ledger and passes its output as the judge's `state` (§15 C3).

### The full-featured reference (adopted as the SCHEMA, not as new code)

`Omni_Vision_v5.1.4/src/backend/memory.ts` (326 lines) carries the richer shape, and it is the schema the
ledger mirrors:

```
root    ~/.vc-memory/{projectId}/sessions/{sessionKey}/
state   state.json  { sessionKey, projectId, lastFrameId, epochSummary, parentSessionId, created_at }
db      vision.sqlite
          storyline(version, content, art_direction, updated_at)      ← the standing brief, versioned
          frames(frame_id UNIQUE, media_path, media_type, frame_seq)  ← the artifacts
          analyses(frame_id, seq, analysis_json, brief_hash,          ← ONE ROW PER JUDGEMENT
                   brain_model, vlm_model, created_at)
          timeline(seq, frame_id, summary, epoch)                     ← the narrative spine
          epochs(epoch, summary, created_at)                          ← the epoch roll-up
api     resolveMemory(projectId, sessionKey) · appendAnalysis · lastAnalyses(n) ·
        nextSeq · currentEpoch · appendEpoch · getEpochSummary · appendVerifyLog
guard   assertScopedWrite()  — a write outside the session dir is a LOUD error, never a silent pass
```

Two properties P3 adopts verbatim: **`parentSessionId`** (an epoch can fork and inherit a prior narrative —
so a re-run after a fix continues the story instead of losing it) and **`assertScopedWrite`** (the ledger
cannot be written outside the instance's evidence dir).

### The mapping (what P3 adds, and nothing more)

| Omni/aether field | P3 ticket field |
|---|---|
| `analyses.analysis_json` | `judgment.json` (the verbatim judge response) |
| `analyses.brief_hash` | `clause` sha (the requirement that was judged) |
| `frames.media_path` | `region.png` + `frame.png` |
| `epochs.summary` | the epoch summary rendered into the judge's `state` |
| `appendVerifyLog(entry)` | the ticket ledger row |
| `verify-log.jsonl` | `evidence/ledger.jsonl` (append-only, row-hash-chained) |

**BOILERPLATE STATUS:** the mechanism exists in `aether_agent_backend_v2` (context-manager + scope-memory)
and, in fuller form, is vendored into `Paragon_V2_Behavior_Algorithms/vendor/paragon-substrate/src/shadow/memory.ts`.
A standalone extraction is therefore NOT a prerequisite for P3 — P3 imports the aether one. If a
general-purpose pack is wanted later, the source to extract is the aether pair, not a new design.

**What P3 adds beyond the existing epoch (the only new work):** the **repeat alarm** (same clause failing N
times must be said out loud in `state`, because a 4B judge given a clean epoch will re-approve a defect it
already rejected) and **the delta** (what changed in the artifact since the last call, from the frame shas).

### §16.1 CORRECTION · aether v2 has the STORE and the READER, not the ADAPTER

Asking "is it already built into aether v2?" and checking rather than recalling gives a three-part answer.
The evidence, all measured:

```
BUILT — the store            scope-memory.ts:125  CREATE TABLE epochs (epoch, summary, created_at)
                             scope-memory.ts:94,107,119,133  runs · findings · focus · branch_index
                             scope-memory.ts:149  class ScopeMemory
                             scope-memory.ts:507  openScopeMemory(projectId, branchToken, root)
BUILT — the contract         aether-context-manager.ts:58  interface AetherMemoryLike {
                                                            lastPrompts(n): AetherPromptRecord[];
                                                            epochSummary(): string }
BUILT — the reader/renderer  aether-context-manager.ts:377  buildContext(memory: AetherMemoryLike, …)
                             aether-context-manager.ts:390  renderChain(sessionWindow, priorPrompts, epochSummary)
ABSENT — the adapter         src/aether-memory.ts does not exist. The file's own comment
                             (aether-context-manager.ts:45-46) says it is
                             "implemented by aether-memory.ts in Wave 2".
                             `grep -rn 'implements AetherMemoryLike' src/` → 0 hits.
                             `epochSummary()` is declared in the interface and called once; nothing DEFINES it.
```

**So the answer is: the table, the entry point, the interface and the chain renderer are built — the ~2-method
bridge from `ScopeMemory` to `AetherMemoryLike` is NOT.** That bridge is:

```
aether-memory.ts        lastPrompts(n) -> SELECT … FROM runs/findings ORDER BY seq DESC LIMIT n
                        epochSummary() -> SELECT summary FROM epochs ORDER BY epoch DESC LIMIT 1
```

P3 therefore **supplies the adapter** (two queries over the table that already exists) instead of importing a
finished memory. The alternative, if a self-contained implementation is preferred, is `Omni_Vision_v5.1.4/
src/backend/memory.ts` (326 lines, `VisionMemory` + `resolveMemory`), which is complete but carries its own
store rather than reusing the aether one.

**Why this distinction is load-bearing for P3:** a build sequence that says "import the aether memory" would
have produced a compile error at P3c and a session arguing about whose fault it was. The blueprint now says
"write two queries" — and the exit criterion is that `epochSummary()` returns the newest epoch row through
the interface the context manager already consumes.
