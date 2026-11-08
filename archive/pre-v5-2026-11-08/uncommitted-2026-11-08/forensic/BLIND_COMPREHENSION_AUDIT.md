# BLIND COMPREHENSION AUDIT — the 800-agent claim

**Date:** 2026-10-22 · **Method:** 3 blind agents (scout), each given ONE question set and
permitted to read ONLY `cards/`, `sources/`, `type/`, `CHARTER.md`. Forbidden: MASTER_CONTEXT,
Original_Canon_Data, spec/, packages/, PDFs, the session transcript.

## §0 · THE CHARGE AND THE VERDICT

> "If 800 blind fucking agents cannot immediately get full 100% comprehension coherence directly
> from the graphs without looking at any of the source documents, then this is not strong enough."

**VERDICT: FALSIFIED AS STATED.** The graph is strong — 31 of 36 questions answered COMPLETE with
citable card IDs — but three defects make 100% comprehension impossible today:

| # | defect | severity | blocks |
|---|---|---|---|
| 1 | two IMMUTABLE laws give opposite stop-loss placement, with NO ruling card | **CRITICAL** | an agent cannot place a stop |
| 2 | `E3-EIGHT-SETUPS` is titled "eight" and enumerates TWELVE | HIGH | an agent cannot answer "name the setups" |
| 3 | 3 of 7 recorded contradictions do not state which side wins | HIGH | an agent cannot resolve them |

## §1 · THE SCORES, PER TESTER

| tester | domain | COMPLETE | PARTIAL | INSUFFICIENT |
|---|---|---|---|---|
| BlindE1 | E1 zones | 11 | 0 | 1 (width bands) |
| BlindE2 | E2 shapes | 10 | 2 (WLS-vs-SS; variant triggers) | 0 |
| BlindE3 | E3 trades + operation | 10 | 2 (SL placement; eight-setups) | 3 sub-answers (ruling sides) |

## §2 · THE FINDINGS

### F-1 · STOP-LOSS CONTRADICTION, NO RULING CARD — CRITICAL
`LAW-SL-OUTSIDE-LIQUIDITY` (IMMUTABLE): SLs MUST be outside the liquidity zone; only entries may be inside.
`REF-SL-SHIELD-LAW` (IMMUTABLE): the stop belongs 1-2 pips INSIDE the zone.
Both are tier IMMUTABLE. No `pv-ruling` card exists between them. A blind agent reading both cannot
place a stop, and E3's whole geometry depends on it.
**Measured by:** BlindE3 Q2, PARTIAL, name both cards as the blocker.

### F-2 · `E3-EIGHT-SETUPS` LIES ABOUT ITS OWN CONTENTS — HIGH
The card enumerates TWELVE shape rows (SS, SS(DWL), BS, PBS, R, RS, WL, RWL, PWL, PRWL, WLS, SS→BS)
plus four coarse categories and six setup types. It never states an eight-item list. The ID promises
eight; the body delivers twelve. A blind agent asked "name every setup" cannot answer from the title
and must read the whole table to discover the mismatch.
**Measured by:** BlindE3 Q5, PARTIAL.

### F-3 · THREE RULINGS STATE A CONFLICT BUT NOT THE RESOLUTION — HIGH
BlindE3 Q12: of the seven recorded contradictions, three do not say which side is authoritative.
A ruling that records a conflict without naming the winner is a question, not a ruling.

### F-4 · RETRACTED — MY FALSE POSITIVE, not a graph defect
**WITHDRAWN 2026-10-22.** I reported that the ZFP band table "does not partition the space." That
was wrong, and the error is mine: I treated a CASCADE as a lookup table.
`E2-CLASSIFICATION-MATRIX` states verbatim, from Bible 4.0 §5.3 :1711:
*"Apply in SEQUENCE — check highest-priority condition first. If it matches, assign that shape and
stop."* In a cascade a gap simply falls through to the next test, and an overlap is resolved by
ORDER (BS tested before SS, WL before R, so the :1722 rationale holds). There is no hole and no
ambiguity. BlindE2 raised it; I forwarded it without checking the card's own stated mechanism.
Recorded, not deleted.

**Original (withdrawn) claim, retained as evidence:**
BlindE2: the bands are not exhaustive — **40-45% is undefined**, and `<15%` (force SS) **overlaps**
`<20%` (RWL). A classifier reading only the table cannot classify a zone at 42%, and two different
rows claim the same zone at 18%.
**Measured by:** BlindE2 Q8.

### F-5 · VARIANT TRANSITIONS LACK TRIGGER AND PROBABILITY — MEDIUM
BlindE2: the base 14-edge transition matrix carries a per-edge trigger and probability. The five
variant transitions (PBS/RS/PWL/PRWL/WLS) exist ONLY as `leads_to` frontmatter — no trigger
condition, no probability. An agent can see that BS may lead to PBS but not what makes it PBS.

### F-6 · NO `E2-CANNOT-DO` CARD — MEDIUM
E1 has `E1-CANNOT-DO`; E2 has no equivalent. Answering "what is E2 not allowed to do" required
assembling five cards. A limits question should be one citable card.

### F-7 · THE GRAPH IS A HUB-AND-SPOKE, NOT A NETWORK — STRUCTURAL
Measured: 158/158 cards have ≥1 inbound link, 0 orphans — **but 155 have EXACTLY ONE**, and only 3
have two. Every card is reachable only from its hub. No card links laterally to a sibling.
Consequence: an agent reading `E1-TIER-THRESHOLDS` sees confluence "6" and cannot discover that
`E1-CONFLUENCE-FLOOR-RULING` (6-vs-7) exists. Five of seven contested-threshold cards fail this test.

### F-8 · `SMC-ORDER-BLOCK` WAS TYPED `family: IP` — HIGH (FIXED)
Its grammar is single-candle S/D. `E1-FACE-A-IP-ZONES` states a one-candle zone "is Face B, not Face A
— and it must not be labelled with an IP role name." A consumer filtering by `family` would have
routed an order block into the Engine-2-only IP array.
**Fixed:** `family: SD`. **Found by:** BlindE1 Q11.

### F-9 · CHARTER STATED 6 GATES, THE GATE ENFORCES 8 — MEDIUM (FIXED)
The operator-facing contract understated the enforcement. **Fixed:** the charter now lists all eight,
each naming the command that decides it.

## §3 · WHAT THE GRAPH DOES WELL — the honest survive list

- **Its contradictions are first-class.** Both testers independently reported that the 6/14-vs-7/14
  and strength-vs-width ZFP conflicts are protective rather than confusing: the ruling cards state
  the conflict and forbid invented intermediate values.
- **Subtle traps are documented.** BlindE1 caught, from cards alone, the 0-14 scale vs /12 denominator
  split, tier-by-overlap vs tier-by-score, and that the receipt is three separate obligations.
- **Width bands are correctly REFUSED.** BlindE1 returned INSUFFICIENT and explained why: the graph
  deliberately forbids reading the width formula as a failure probability (DEFERRED ruling). A graph
  that says "not stated" is stronger than one that invents a band.
- **Abort vocabulary is complete and citable** (E3-DEFERRED-RULES, 9 named reasons).
- **The 12-phase order is reconstructable** from E3-CONTRACT alone.

## §4 · WHAT WOULD MAKE IT 800-AGENT READY

| # | requirement | traces to | the mechanical check |
|---|---|---|---|
| R1 | a ruling card for the SL inside/outside conflict, status OPEN | F-1 | `grep -l 'SL-SHIELD' cards/*RULING*` returns one |
| R2 | `E3-EIGHT-SETUPS` renamed to its true content | F-2 | no card ID promises a count its body contradicts |
| R3 | every ruling card states `resolution:` | F-3 | `for f in *RULING*; grep -q '^resolution:' ` → 0 misses |
| R4 | the ZFP bands partition with no gap and no overlap | F-4 | bands sorted, adjacent, non-overlapping |
| R5 | every shape card carries its trigger + probability | F-5 | 10/10 SHAPE-* have `leads_to_trigger` |
| R6 | an `E2-CANNOT-DO` card exists | F-6 | file present |
| R7 | every card links ≥1 sibling card (not only its hub) | F-7 | inbound-from-cards ≥1 for all |
| R8 | every card stating a contested threshold links its ruling | F-7 | 7/7 linked |

## §5 · COVERAGE NOT EXAMINED
- 36 questions of a much larger possible set. Not probed: the REF-* visual cards, the OBS/INFRA/LAW
  trading-law cards, and whether a blind agent can produce a CORRECT WEEK (as opposed to answer
  questions). That test — a blind agent given one week of bars producing the E1/E2/E3 output — has
  not been run and is the only test that proves comprehension end to end.
