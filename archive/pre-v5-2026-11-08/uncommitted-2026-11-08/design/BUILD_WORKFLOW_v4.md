# PLUTUS VISION — BUILD WORKFLOW v4
## 29 turns · every turn ends at a pinned gate · the executor decides nothing

---

# §0 · THE PSTACK MANDATE

pstack is the operational engine. A turn that produces work without these four substrates is refused.

```
1  pstack-create-verification-skill
   generates verify-plutus/SKILL.md with LAUNCH · DOCTOR · DRIVE · EVIDENCE · CLEANUP
   plus features/F1..F5 (one file per user-facing surface, four fixed H2s)
   PROVEN by running it once end to end  -> P0.T1

2  THE FEATURE MAP  features/F1..F5
   the coverage denominator. A proof that drives one entry point is INCOMPLETE.

3  show-me-your-work  PROOF/decision-trail.tsv
   one row per decision, written by the gate, never by the executor.

4  THE PRINCIPLES
   encode-lessons-in-structure : the 2nd occurrence of a class becomes a CHECK + a fixture pair
   attack-the-premise         : 2 fixes failing the SAME gate means the PREMISE is wrong
   prove-it-works             : the artifact, never the source
   never-block-on-the-human   : reversible work proceeds
   guard-the-context-window   : bulk to subagents, summaries in context
```

**Enforcement:** a phase whose exit criterion does not name its gate and its card is refused.

---

# §1 · THE VERIFICATION CARD

The judge never sees the repo. It sees a card. Schema: `vcards/_schema.json`.

```
┌──────────────────────────────────────────────────────────────────────────┐
│ VCARD                                             budget 3,500 tok        │
├──────────────────────────────────────────────────────────────────────────┤
│ IDENTITY   id · phase · gate · feature (F1..F5)                          │
│ CONTEXT    mandate <=2000 · laws <=200 · acceptance <=200                │
│ SUBJECT    path · sha256 · measurements · artifact_sha   (MEASURED)      │
│ CLAIM      the executor's own words this turn, VERBATIM  <=300           │
│ QUERY      noul mandate_met · noul claim_contradicted                    │
│            choice defect_class · score completeness                      │
│ VERDICT    written by the gate, never by the executor                    │
└──────────────────────────────────────────────────────────────────────────┘
```

**Refusal:** `tokens(card) > 6000` -> the gate refuses the card (`CARD_OVERFLOW`) and judges nothing.
A truncated card silently destroys the judgement, so it is never sent.

**Card id format:** `<phase>.<turn>.<feature>.<gate>` — e.g. `P0.T3.F2.G2`.

---

# §2 · THE SIX GATES

| gate | subject | predicate | exit codes |
|---|---|---|---|
| G0 DOCTOR | the rig | pid alive ∧ port ours ∧ build sha == frozen | 0/1/2/3/4 |
| G1 ARITHMETIC | the frame | C01–C20 pixel checks | 0/1/2/3/4 |
| G2 STRUCTURAL | card + .pine | receipts re-add ∧ no stub ∧ no literal price | 0/1/2/3/4 |
| G3 SEMANTIC | card digest + claim | `mandate_met >= act` ∧ `claim_contradicted < act` | 0/1/2/3/4 |
| G4 PERCEPTION | the frame | labels read ∧ compared to the card | 0/1/2/3/4 |
| G5 AGREEMENT | all verdicts | agree ∧ the known-bad control REFUSED | 0/1/2/3/4 |

```
0 PASS · 1 FAIL · 2 INCONCLUSIVE · 3 VOID/STALE/TAMPERED · 4 GATE_DEFECT
```

**The verdict algebra — the executor may not reinterpret it:**

```
any G1/G2 critical ................. FAIL
p(claim_contradicted) >= act ....... FAIL
p(mandate_met) < act ............... FAIL
G1..G4 disagree .................... INCONCLUSIVE
the known-BAD control passes ....... VOID
all agree, all above act ........... PASS
```

**Proven on this host (all five paths, real run):**

```
1 PASS            rc=0
2 FAIL            rc=1
3 VOID stale      VOID:STALE_SUBJECT:/tmp/subject-ok.txt      rc=3
4 VOID tampered   VOID:GATE_TAMPERED:G1                        rc=3
5 GATE_DEFECT     GATE_DEFECT:_dead:negative_rc=0              rc=4
```

---

# §3 · THE CALIBRATION LAW

```
1 LABEL   20 frame pairs (clean/corrupt) + the golden week's 8 setups
2 SWEEP   act in {0.50,0.60,0.70,0.80,0.90}; precision + recall at each point
3 READ    max < 0.5      -> THE QUESTION is broken, rewrite it
          spread < 0.25  -> the question does not discriminate
4 CONTROL positive >= 0.85 AND negative <= 0.15 on EVERY arm
5 RECORD  act · the sweep · the date · the model id -> calibration/<gate>.json
```

A gate whose `act` is not in a calibration file is `E_UNCALIBRATED` and refuses to judge.
`src/gate/policy.ts` throws at construction when `source` is empty or `rows < 1`.

---

# §4 · THE SELF-VALIDATING LOOP

```
OUTER (per turn)
  a  the executor does the turn's work
  b  the turn ends at its gate
  c  PASS         -> the gate writes the verdict + the TSV row; the next turn opens
     FAIL         -> the card's defect_class routes the fix (§5)
     INCONCLUSIVE -> supply the missing input; an absence is never a pass
     VOID         -> the gate failed its control: repair the GATE, then redo
  d  a phase closes ONLY on a PASS whose exit criterion names the card

INNER (the gate validating itself, every run)
  1  the gate runs its own good/bad fixtures FIRST
  2  they do not separate -> exit 4, judge nothing
  3  recompute the subject sha vs the card's -> mismatch exit 3
  4  the gate writes the verdict; the executor writes NOTHING
```

**Four mechanical things make an unattended run correct:**

```
1 THE HOOK     .githooks/pre-commit refuses a commit touching a judged artifact
               without a PASS row in PROOF/decision-trail.tsv
2 THE LEDGER   one TSV row per decision + one verdict json per card
3 THE CONTROL  every gate run proves its fixtures separate
4 THE RECORD   runtime/record.json: last PASS card, open phase, next command
```

A run is DONE when a replay gate passes on a **frozen** artifact — never when the executor says so.

---

# §5 · FAILURE-CLASS ROUTING

```
defect_class        owner layer              the fix goes there
─────────────────────────────────────────────────────────────────────────────
MISREAD_VALUE       cf/src/steps/clairic.ts  the field schema or an invariant
TIER_PROMOTION      cf/src/e1/zfp.ts         the conjunction, not the threshold
RECEIPT_BROKEN      cf/src/e1/zfp.ts         the arithmetic or a modifier gate
UNLICENSED_SHAPE    cf/src/e2/chain.ts       the licensed table
CHAIN_ORDER         cf/src/e2/chain.ts       the walk / transition table
GEOMETRY_WRONG      cf/src/e3/setups.ts      entry/SL/TP from zone edges
CLAIM_FALSE         the executor             the claim, not the gate
RENDER_WRONG        pine/                    the draw order or the cast
```

**2nd occurrence of a class** -> a new CHECK + a fixture pair (encode-lessons-in-structure).
**2 fixes failing the SAME gate** -> the premise is wrong; census, re-derive (attack-the-premise).

---

# §6 · THE SIX LAWS

```
1 A GATE'S SUBJECT IS ITS PRODUCT — the emitted artifact and its generator, never its own source.
2 A GATE IS SYMMETRIC — accepts a known-good and refuses a known-bad, proven every run.
3 A VERDICT COMES FROM THE ARTIFACT — never prose, a count, a filename, a sha, a status field.
4 THE EXECUTOR NEVER VERIFIES — it runs the gate; it may not edit it or write the verdict.
5 EVERY PHASE EXITS ON A JUDGED ARTIFACT — a file property is not an exit.
6 THE DECISION TRAIL IS WRITTEN AS YOU GO — reconstructed records are not controlled runs.
```

---

# §7 · THE DEBUG LOOP (bounded)

```
FAIL -> read the card's class -> fix the OWNER layer -> re-run the SAME gate on the SAME subject
three rounds maximum on one gate. On the third: the premise is wrong. Census, re-derive.
a fix that makes a different check fail is a NET REGRESSION: restore and narrow.
```

---

# §8 · THE FORBIDDEN LIST (verbatim in every turn block)

```
advance on a red gate                          weaken or lower a gate to pass it
reuse evidence produced before a fix           describe an artifact you did not open
report a count/sha/suite/token as a verdict    let a filename assert a verdict
edit the gate from inside the build            write the verdict you are being judged by
pass the corpus to the judge instead of a card set a threshold without a sweep
declare done without a frozen-artifact PASS    skip the control because it "always" passes
```

---

# §9 · THE CHECKS THAT EARN THEIR PLACE

```
read coverage READ == TOTAL          an elided read hides the line that is the bug
subject callability                  a renderer defined and never invoked renders nothing
before/after artifact sha            a build exiting 0 without changing output ships the old thing
deploy equality                      a stale Worker serves yesterday's build
artifact identity                    loading a different file than the one judged
region control                       the frame is not blank — but the subject area is
source-leak                          a value read from the source while claiming the artifact
scope + freshness before a zero      a zero from the wrong scope reads as "none exists"
card token budget                    a truncated card silently destroys the judgement
control separation                   obvious-good and obvious-bad must score far apart
the second occurrence                a repeating class becomes structure, not a note
```

---

# §10 · MECHANICAL BLOCKING

```
gates/gate.sh <gate> <subject> <sha|-> <card>     0/1/2/3/4
gates/pins/<gate>.sha                             a modified gate exits 3 before judging
.githooks/pre-commit                              refuses an unproven judged artifact
runtime/record.json                               last PASS card · open phase · next command
gates/firewall.sh                                 D1..D8, one command, exit nonzero = FAIL
```

**Firewall detectors, measured:**

```
D1 gate pins            tamper gates/G1.sh -> FIREWALL:PIN_MISMATCH:G1   rc=1
D2 advice-as-prevention design/ + cf/                                   rc=0
D3 telescope-default-4H any live .ts                                    rc=0
D4 literal price        pine/ only (legacy ratchet D7)                   rc=0
D5 stub                 return {stubbed:true}                            rc=0
D6 record               runtime/record.json has next_command             rc=0
D7 legacy ratchet       .pine literal-price count <= 59                  rc=0
D8 worker typecheck     tsc --noEmit -p cf/tsconfig.json                 rc=0
```

---

# §11 · THE TURNS

Every turn is **P0 ENTRY · A ACTION · E EVIDENCE · R REASON · G GATE · C COMMIT**.

## P0 · INSTRUMENT — 7 turns

### P0.T1 · THE DRIVER
```
P0  record.json phase=P0 turn=P0.T1
A   pstack-create-verification-skill against PLUTUS_VISION
    -> verify-plutus/SKILL.md (LAUNCH/DOCTOR/DRIVE/EVIDENCE/CLEANUP) + features/F1..F5
E   the generated skill; 5 feature files; one DRIVE run against F1
R   the driver is generated, not hand-written; the feature map is the denominator
G   bash verify-plutus/run.sh --feature F1 --once ; echo rc=$?     # expect 0
    bash verify-plutus/run.sh --feature F1 --once --expect-fail ; echo rc=$?   # expect nonzero
C   feat(p0): verify-plutus generated and proven once
    body: driver rc=0 on F1 · rc!=0 with --expect-fail · card P0.T1.F1.G0
```

### P0.T2 · G0 DOCTOR
```
P0  P0.T1 rc=0
A   write gates/G0.sh ; fixtures/G0.good|bad ; pin
    gates/G0.sh: pid alive ∧ port owner == us ∧ build sha == runtime/frozen.sha
E   bash gates/gate.sh G0 fixtures/G0.good "$(sha256sum fixtures/G0.good|cut -d' ' -f1)" P0.T2.F1.G0
    bash gates/gate.sh G0 fixtures/G0.bad  "$(sha256sum fixtures/G0.bad |cut -d' ' -f1)" P0.T2.F1.G0b
R   a rig worth driving has a live pid, our port, and the frozen build
G   good -> 0 ; bad (dead pid) -> 1
C   feat(gates): G0 doctor with a dead-pid negative
```

### P0.T3 · G2 STRUCTURAL
```
P0  P0.T2 rc=0
A   write gates/G2.sh: every zone.receipt satisfies base+Σmods==raw ∧ no stub ∧ no literal price
E   bash gates/gate.sh G2 fixtures/card-good.json "$(sha256sum fixtures/card-good.json|cut -d' ' -f1)" P0.T3.F2.G2
    bash gates/gate.sh G2 fixtures/card-broken.json ... P0.T3.F2.G2b
R   pixels cannot show a receipt that does not add up
G   good -> 0 ; broken (raw+1) -> 1 ; bash gates/firewall.sh -> 0
C   feat(gates): G2 structural with a broken-receipt negative
```

### P0.T4 · G4 PERCEPTION
```
P0  P0.T3 rc=0
A   write gates/G4.sh: Clairic reads zfp_labels/tier_labels/zone_count; code compares to the card
E   bash gates/gate.sh G4 fixtures/frame-good.png ... P0.T4.F1.G4
    bash gates/gate.sh G4 fixtures/frame-slab.png ... P0.T4.F1.G4b
R   the model reads; the code decides
G   good -> 0 ; slab (zone_count 0) -> 1
C   feat(gates): G4 perception with the known-bad control
```

### P0.T5 · G3 SEMANTIC + CALIBRATION
```
P0  P0.T4 rc=0
A   write gates/G3.sh ; label 20 pairs ; sweep act ; write calibration/g3.json
E   the sweep table printed; the chosen act; the positive and negative control scores
R   a threshold without a sweep is a copied number
G   positive >= 0.85 ∧ negative <= 0.15 ∧ act present in calibration/g3.json
C   feat(gates): G3 semantic with a derived act
```

### P0.T6 · G5 AGREEMENT
```
P0  P0.T5 rc=0
A   write gates/G5.sh: G1..G4 agree ∧ the control is REFUSED
E   forced disagreement -> 2 ; passing control -> 3 ; all agree -> 0
R   agreement is what turns four opinions into a verdict
G   bash gates/gate.sh G5 fixtures/frame-good.png ... -> 0
    bash gates/gate.sh G5 fixtures/disagree.json  ... -> 2
    bash gates/gate.sh G5 fixtures/control-pass.json ... -> 3
C   feat(gates): G5 agreement + control void
```

### P0.T7 · THE HOOK + THE RECORD
```
P0  P0.T6 rc=0
A   write .githooks/pre-commit: refuse a commit touching pine/ or cf/src/ without a PASS row
    write runtime/record.json with next_command
E   git commit --allow-empty -m test -> refused (no row)
    after a PASS row exists          -> accepted
R   the hook is what makes the gate unskippable
G   the unproven commit -> rc!=0 ; the proven commit -> rc=0 ; bash gates/firewall.sh -> 0
C   chore(gates): pre-commit hook + runtime/record.json
```

## P1 · L0 DATA — 4 turns (blocked on the feed)

### P1.T1 · CAPTURE
```
P0  P0.T7 rc=0
A   POST /run {pair:"DXY", week:"2026-07-06", barsR2Key:"bars/DXY/2026-07-06.json", optionsUrl:"…"}
E   the run row in D1 (status=armed) ; the PNG in R2 captures/2026-07-06/DXY/options.png
R   the capture is content-addressed, so a stale page cannot pass as this week
G   a blank page -> W2_CAPTURE_EMPTY ; a known-bad sha -> W2_CAPTURE_KNOWN_BAD
C   feat(l0): browser capture with the known-bad list
```

### P1.T2 · EXTRACT
```
P0  P1.T1 rc=0
A   Clairic + the 7 fields; I1..I5 as throws (cf/src/steps/clairic.ts)
E   GET /ledger?run=pv-2026-07-06-DXY -> one row, stage=extract.options
R   five invariants turn a decode error into a named refusal
G   a planted /1000 ladder -> W2_I2_UNITS ; a short array -> W2_I1_ALIGNMENT
C   feat(l0): Clairic extraction with five invariants
```

### P1.T3 · ABSTENTION
```
P0  P1.T2 rc=0
A   a planted-null field in the fixture image; p_null > 0.5 -> W2_INCONCLUSIVE
E   the planted null returns value=null (not a guess); the fabricated value returns 0.99
R   the guess field is never read; an absence is a result, not a number
G   planted null -> rc=0 with value null ; fabricated -> rc=1
C   feat(l0): abstention + the planted-null control
```

### P1.T4 · THE CALLER CONTRACT
```
P0  P1.T3 rc=0
A   e1Build's ctxBase: every key the ZFP requires, built explicitly
E   a missing key -> ZFP_INPUT_MISSING:<key> ; the 671-zone scan computes 0
R   the caller cannot silently omit an input
G   bash cf/test/zfp-parity.ts -> 23/23 ; a removed key -> ZFP_INPUT_MISSING
C   feat(e1): the explicit ZFP context contract
```

## P2 · E1 — 4 turns

### P2.T1 · COMPUTE
```
P0  P1.T4 rc=0
A   pillars -> cluster -> confluence -> degree -> ZFP receipt -> roles (cf/src/e1)
E   the golden week's zone count, the role names, each receipt's base and modifier list
R   every number is arithmetic over declared inputs
G   every zone has a receipt ∧ sd(zfp) >= 1.0 ∧ a width perturbation changes nothing
C   feat(e1): zone map with receipts
```

### P2.T2 · ATTEST A
```
P0  P2.T1 rc=0
A   Z1..Z4 in one Clef request, the receipt as state
E   the four probabilities per zone; the ledger row
R   the judge audits the derivation, not the number
G   the planted-bad zone is REFUSED ; >20% refused -> E1_ATTESTATION_DRIFT
C   feat(e1): attestation stage A
```

### P2.T3 · ATTEST B
```
P0  P2.T2 rc=0
A   Z5..Z6 with stage A's answers in the state
E   the per-zone completeness score; refusals recorded
R   dependent questions are a second request, never a hoped-for visibility
G   a zone with a forgotten level -> E1_RECEIPT_INCOMPLETE
C   feat(e1): attestation stage B
```

### P2.T4 · ROLES + FACE B
```
P0  P2.T3 rc=0
A   assign the five IP roles by position; build face B; LQZ counters
E   five role ids; the OB/FVG/BOS counts; the rail hues
R   the roles are positional, never price-ordered
G   E1_ROLE_COUNT fires when a role is missing ; the golden week shows exactly 5
C   feat(e1): roles and face B
```

## P3 · E2 — 4 turns

### P3.T1 · CANDIDATES
```
P0  P2.T4 rc=0
A   segment -> anatomy -> target zone ZFP -> licensed set -> rank -> keep 8
E   the kept ids; each licensed set; the band per target
R   the model can never name a shape outside the licensed set
G   a candidate outside the licensed set cannot exist ; >8 -> sliced
C   feat(e2): candidate set with licensed options
```

### P3.T2 · STAGE A
```
P0  P3.T1 rc=0
A   A1..A4, one request, state completeness checked first
E   four probabilities per candidate; vetoes named
R   four independent clauses, four failure modes
G   a mis-shaped span falsified ; a long into resistance falsified
C   feat(e2): stage A clauses
```

### P3.T3 · STAGE B
```
P0  P3.T2 rc=0
A   B1 new-structure; the Choice only when |licensed| >= 2
E   the licensed_singleton flag; a NONE terminating a leg
R   a Choice with one option is a question that cannot fail
G   singleton recorded ; NONE terminates ; a fabricated shape rejected
C   feat(e2): stage B and the licensed Choice
```

### P3.T4 · STAGE C + WALK
```
P0  P3.T3 rc=0
A   C1 energy, C2 hinge zone; walk the transition table; assign days; build the alternative
E   the chain links, their days, the alternative's decision zone
R   the walk is code; the model only subtracts
G   a swapped pair -> E2_CHAIN_ORDER ; a trim raising confidence -> E2_CONFIDENCE_INVERSION
    no alternative -> E2_ALTERNATIVE_INVALID
C   feat(e2): stage C, walk, days, alternative
```

## P4 · E3 — 4 turns

### P4.T1 · GEOMETRY
```
P0  P3.T4 rc=0
A   entry at a 1H/30m/15m edge; SL opposite + 2..5 pips; TP nearest opposing on the path
E   the four numbers per candidate; the anchor zone id
R   E3 owns exactly four numbers
G   a 4H edge -> E3_ANCHOR_TF_INVALID ; no TP -> E3_TP_NULL
C   feat(e3): geometry from zone edges
```

### P4.T2 · KILL CLAUSES
```
P0  P4.T1 rc=0
A   K1..K10 before any model
E   each refusal with its code; the surviving count
R   geometry and count are what code is good at
G   a 2.4 RRR -> E3_RRR_BELOW_FLOOR ; a 9th setup -> E3_WEEKLY_CAP
C   feat(e3): ten kill clauses
```

### P4.T3 · STAGE A
```
P0  P4.T2 rc=0
A   D1..D5 in one request
E   five probabilities per setup; the vetoes (D2<0.8, D3<0.8, D5<2)
R   an SL inside the noise or a TP off the path kills the setup outright
G   an SL inside the noise -> E3_VETO ; a TP off-path -> E3_VETO
C   feat(e3): stage A clauses
```

### P4.T4 · STAGE B + EVICT
```
P0  P4.T3 rc=0
A   D6..D7 on the survivors; evict to 8/week and 3/day
E   the emitted set; the refusals; the per-day counts
R   eviction keeps the best, never the first seen
G   a duplicate -> E3_DUPLICATE ; a 9th -> E3_WEEKLY_CAP ; inverted SL/TP inverts the hit test
C   feat(e3): stage B and eviction
```

## P5 · REPLAY — 2 turns

### P5.T1 · FREEZE
```
P0  P4.T4 rc=0
A   freeze the code: write runtime/frozen.sha = sha256 of cf/src + pine/
E   the sha; record.json frozen=true
R   the judged artifact must be the artifact that ships
G   a post-freeze edit -> sha mismatch -> VOID (rc=3)
C   chore: freeze the artifact
```

### P5.T2 · REPLAY
```
P0  P5.T1 rc=0
A   run the 10 operator-drawn weeks through the frozen artifact
E   the per-week verdict table; golden and held-out scored separately
R   a build tuned to the golden week fails the held-out set
G   >=90% golden AND >=90% held-out ; golden PASS + held-out FAIL -> REJECT (hardcoded)
C   test(p5): the held-out replay
```

## P6 · VERIFY — 2 turns

### P6.T1 · WIRE G3 + G4
```
P0  P5.T2 rc=0
A   G3 on the card digest + the claim; G4 on the frame's labels
E   the two verdicts; the deltas named
R   the claim and the pixels are different subjects
G   a corrupted card -> G2 FAIL naming the field ; a wrong label -> G4 FAIL naming the delta
C   feat(gates): G3 and G4 on the real frame
```

### P6.T2 · THE CONTROL
```
P0  P6.T1 rc=0
A   run the slab through the full chain
E   the slab's verdict; the discarded run list
R   a judge that cannot see must void the run
G   the slab -> VOID (rc=3) ; every verdict in that run discarded
C   test(gates): the control voids the run
```

## P7 · DELIVERY — 2 turns

### P7.T1 · PASTE
```
P0  P6.T2 rc=0
A   GET /card -> paste into the single Pine input field
E   the rendered frame; the card sha printed in the script comment
R   the script is written once; the card is data
G   the card renders ; removing it prints CARD: ABSENT — FACE A OMITTED
C   feat(delivery): the paste path
```

### P7.T2 · TAB
```
P0  P7.T1 rc=0
A   the dashboard tab reads GET /card and renders the same JSON
E   the two frames; the two card shas
R   one card, one truth, two surfaces
G   sha(card) identical on both paths ; the frames byte-identical after normalisation
C   feat(delivery): tab parity
```

---

# §12 · THE SELF-CHECK (this gate can fail)

```
[x] can any turn close on a file property, a count, or a sha?        NO  — every G is a gate rc
[x] can the executor edit the gate or write the verdict?             NO  — gate.sh writes it
[x] is there a card for every judged unit, and does it fit budget?   YES — schema + refusal
[x] does every arm carry a positive AND a negative control?          YES — control_pair, exit 4
[x] is every threshold backed by a recorded sweep?                   YES — policy() throws
[x] does the record allow a cold agent to resume at the exact turn?  YES — runtime/record.json
[x] does the feature map define coverage, or "what I remembered"?    MAP — features/F1..F5
[x] if every agent lied, what would still be caught?                 G2 + G4 + G5
[x] if the judge were blind, what would catch it?                    the control -> VOID (rc=3)
```

**The residual:** G0, G2, G3, G4, G5 and verify-plutus are specified with fixtures but not yet
written. P0.T2–T6 build them. Until they exist, the ladder above P0 is a design, not a capability.

**Blocked, named:** `OPTIONS_FEED_ABSENT` (P1) · `CLOUDFLARE_API_TOKEN_ABSENT` (deploy) ·
`D1_ID_ABSENT` · `R2_BUCKET_ABSENT` · `CALIBRATION_ABSENT` (P0.T5).
