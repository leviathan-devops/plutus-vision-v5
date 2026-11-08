#!/usr/bin/env python3
"""
e2_engine.py — the E2 shape chain. PURE CODE, no model, no network, no inference.

THE CANON IS THE ONLY AUTHORITY (Trident_System_Prompt_v5.3.3, Part VI):
  · §6.1  the five-shape taxonomy with each shape's IP-zone ZFP SIGNATURE
  · §6.2  the Classification Decision Matrix, applied IN PRIORITY ORDER
  · §6.4.1 the ZFP-CONDITIONED Transition Rules — the TARGET zone's ZFP decides,
          NOT the momentum of the current move. The canon names this the
          "#1 Engine 2 error that caused mispredictions" (the April 20-24 event).
  · §6.5  Timeframe Element Matching — never more than 2 dimensions up
  · §6.6  the Forward Mapping Procedure, five steps, with a per-link audit trail
  · §6.8  Consolidation Phase Detection
  · §6.10 the Trading Speed Rule — "+1 day", "assume 30-50% of the speed"

RULE 1 (zero tolerance): every shape NAMES the zone ids that anchor it. A shape with
no zone behind it is a fabrication and is REFUSED — never emitted. ST-13 pins this.
"""

from __future__ import annotations

import datetime as dt
from dataclasses import dataclass, field

# ── THE ZFP THRESHOLDS — quoted from the canon, never tuned ─────────────────
ZFP_BREAKOUT = 45      # "ZFP > 45% = BREAKOUT THRESHOLD"
ZFP_HARDWALL = 20      # "ZFP < 20% = HARD WALL"
R_STABILISE = 0.35     # |momentum| below this is a STABILISATION (a range, §6.2's R). A
                       # DECISIVE move (>=) is never a range; it carries its own direction.
MIN_CHAIN_CONFIDENCE = 25   # §6.6 step 3: terminate when cumulative < 25%
MAX_CHAIN_LENGTH = 5        # §6.6 step 3

# the six pressure degrees (canon Part III)
DEGREES = ("EXTREME", "HEAVY", "MODERATE_HEAVY", "MODERATE", "LIGHT", "MINIMAL")


@dataclass
class Zone:
    """ONE E1 zone, as PHASE 2 produced it. The engine reads nothing else."""
    id: str
    top: float
    bottom: float
    confluence: int
    zfp: int
    timeframe: str = "1H"
    bom: str = ""            # "BoM" | "MoM" — §6.1 discriminator
    reactions: int = 0        # the BATTLE count, not bars (Bible 4.14)

    @property
    def degree(self) -> str:
        c = self.confluence
        deg = ("EXTREME" if c >= 12 else "HEAVY" if c >= 10 else
               "MODERATE_HEAVY" if c >= 8 else "MODERATE" if c >= 6 else
               "LIGHT" if c >= 4 else "MINIMAL")
        # DEGREES is the canon's six-degree vocabulary the render's colour ladder branches on
        # (audit 2026-10-06: the constant was declared but never read). This guard makes it live —
        # a ladder edit that invented a seventh degree would silently fall through the render's
        # tower to the LIGHT default (a wrong-colour), so it is refused HERE. A NAMED refusal,
        # never a bare assert: `assert` is STRIPPED under `python -O`, so the guard would vanish
        # and a 7th degree would pass silently (audit 2026-10-06, OCR finding #1).
        if deg not in DEGREES:
            raise FabricationRefused(
                f"E2_DEGREE_UNKNOWN: {deg!r} is not in the canon's DEGREES {DEGREES}")
        return deg

    @property
    def is_hard_wall(self) -> bool:
        return self.zfp < ZFP_HARDWALL

    @property
    def is_breakout_risk(self) -> bool:
        return self.zfp > ZFP_BREAKOUT


@dataclass
class Link:
    from_shape: str
    to_shape: str
    trigger_zone_id: str        # NON-EMPTY — Rule 1, the anchoring law
    trigger_zone_zfp: int       # the TARGET zone's ZFP — the transition's cause
    condition: str
    confidence: float


@dataclass
class ShapeChain:
    current: str
    chain: list[Link] = field(default_factory=list)
    alternative: list[Link] = field(default_factory=list)
    anchor_zone_ids: list[str] = field(default_factory=list)
    days: list[dict] = field(default_factory=list)
    consolidation_phase: str = ""
    refusal: str = ""           # set when the engine refuses rather than fabricates
    terminal_shape: str = ""    # the shape price is in at the WEEK'S END (audit 2026-10-06,
                                # e2_engine.py:299) — `current` stays the INITIAL shape the
                                # day-decomposition sequence starts from; this is the terminal

    def cumulative(self) -> float:
        c = 100.0
        for l in self.chain:
            c = c * (l.confidence / 100.0)
        return c


class FabricationRefused(Exception):
    """Raised whenever the engine would emit a shape with no zone behind it."""


# ── §6.2 · THE CLASSIFICATION DECISION MATRIX — priority order ──────────────
# "applied IN SEQUENCE — the highest priority match wins and classification stops"

def classify(bars_momentum: float, zones: list[Zone]) -> tuple[str, str]:
    """Returns (shape, anchoring_zone_id). The anchor is REQUIRED.

    The priority order is not arbitrary — each position fixes a specific
    misclassification the canon names: BS before SS (a pre-breakout pause is BS, not
    SS), WL before R (a violent rejection and a stabilisation look alike but have
    opposite implications), WLS before SS (violent oscillation without the 3-zone cage
    is ordinary consolidation).
    """
    if not zones:
        raise FabricationRefused("E2_NO_ZONES: an empty zone map cannot classify a shape")

    # SORT DETERMINISTICALLY (audit 2026-10-06, OCR finding #3). The priority scans below
    # (`for z in solid`) return the FIRST match in input order, so the same zone set in a
    # different order produced a different anchor and therefore a different chain — `R` and
    # `WLS` sorted, the rest inherited caller order. One canonical order (by mid-price, then id)
    # makes EVERY anchor order-independent.
    solid = sorted([z for z in zones if z.degree != "MINIMAL"],
                   key=lambda z: (z.top + z.bottom, z.id))
    if not solid:
        raise FabricationRefused(
            "E2_NO_SOLID_ZONES: every zone is MINIMAL (confluence < 4); the canon "
            "discards a score of 0-3, so there is nothing to anchor to")

    # 1 · BS — breaks a zone with ZFP > 45%, confirms, a measured-move target exists
    for z in solid:
        if z.is_breakout_risk and bars_momentum > 0:
            return "BS", z.id
    # 2 · WL — surges to a zone with ZFP < 20%, pierces, rejects
    for z in solid:
        if z.is_hard_wall and bars_momentum < 0:
            return "WL", z.id
    # 3 · R — stabilises at a mid-range zone (ZFP 20-40%), < 1 session
    # THE ANCHOR IS THE ZONE NEAREST THE SPOT (fix 2026-10-06). The earlier build returned
    # the FIRST zfp-20-40 zone in list order — the LOWEST support — so the whole walk
    # started at the bottom of the map and could only travel UP (with a dead chain when the
    # momentum pointed down). The operator's play-forward exposed it: the E2 oscillated in
    # the support band and never reached the resistance the week actually rallied to. The
    # anchor is now the mid-range zone closest to the MIDDLE of the zone map (the spot /
    # equilibrium), so the walk can travel BOTH ways — up to the resistance, down to the
    # support — which is what a one-week forecast must do.
    mids = [z for z in solid if 20 <= z.zfp <= 40]
    # A RANGE IS A STABILISATION (§6.2: R "stabilises at a mid-range zone, < 1 session") — a
    # LOW-momentum state by definition. The earlier build fired R whenever ANY mid-zfp zone
    # existed, so a decisive move classified R regardless of its momentum (measured 2026-10-06:
    # the 5-week cross-validation returned R for ALL five weeks across mom −1.0…+1.0 — the E2
    # could never predict direction). R now requires a genuinely flat momentum.
    if mids and abs(bars_momentum) < R_STABILISE:
        ordered = sorted(solid, key=lambda z: (z.top + z.bottom))
        med = ordered[len(ordered) // 2]
        mtop = (med.top + med.bottom) / 2
        return "R", min(mids, key=lambda z: abs(((z.top + z.bottom) / 2) - mtop)).id
    # 4 · WLS — 3+ zones within 0.30-0.50
    # AUDIT 2026-10-06: this measured the spread from `solid[0]` — the INPUT's first zone —
    # so the same zone set in a different order classified differently. Sort by PRICE first,
    # then test the max-min spread of a 3-zone window (deterministic, order-independent).
    ordered = sorted(solid, key=lambda z: (z.top + z.bottom))
    for i in range(len(ordered) - 2):
        win = ordered[i:i + 3]
        spread = max(z.top for z in win) - min(z.top for z in win)
        if 0.30 <= spread <= 0.50:
            return "WLS", win[0].id
    # 5 · SS — both bounds below 30%
    weak = [z for z in solid if z.zfp < 30]
    if len(weak) >= 2:
        return "SS", weak[0].id
    # 6 · RWL — after a BS: violent reversal through the origin, Hard Wall rejection.
    #      §6.2 puts RWL LAST (priority 6). The earlier build checked it THIRD, so a
    #      Hard Wall with 4+ reactions was classified RWL even when R, WLS or SS
    #      matched a higher priority — a priority inversion against the canon's order.
    for z in solid:
        if z.is_hard_wall and z.reactions >= 4:
            return "RWL", z.id

    # THE DECISIVE-MOVE FALLBACK (the LAST priority, after every zone-specific signature). A
    # move too strong to be a stabilisation (|momentum| >= R_STABILISE) with no breakout/hard-wall
    # zone to pin it still carries its own DIRECTION — §6.2's #1 (BS) reads momentum > 0 and #2
    # (WL) reads momentum < 0. The shape anchors to the boundary zone the move travels toward (the
    # resistance ceiling for an up-move, the support floor for a down-move). Without this, a
    # decisive week with no extreme zone falls to the refusal and draws NOTHING while the price
    # moved — the degenerate-R failure in a different costume.
    if bars_momentum >= R_STABILISE:
        return "BS", max(solid, key=lambda z: z.top).id
    if bars_momentum <= -R_STABILISE:
        return "WL", min(solid, key=lambda z: z.bottom).id

    # nothing matched a signature — refuse rather than default to something plausible
    raise FabricationRefused(
        "E2_NO_SIGNATURE: no shape signature matched the zone set; the engine will "
        "not default a shape, because an unanchored guess is the canon's forbidden case")


# ── §6.4.1 · THE ZFP-CONDITIONED TRANSITION TABLE ───────────────────────────
# "The ZFP of the TARGET zone — not the MOMENTUM of the current move — determines
#  what happens next. A powerful BS with extreme momentum that hits a Hard Wall
#  (ZFP < 20%) will STILL produce an RWL — because the wall is DENSER than the move."

def transition(current: str, target_zfp: int) -> "tuple[str, str, float] | None":
    """Returns (next_shape, condition, confidence), or None when no §6.4.1 row matches.

    THE ONE SENTENCE THAT IS THE WHOLE OF §6.4.1: density beats momentum, always.
    It is a fast car hitting a concrete wall. The wall's density exceeds the car's
    momentum; the car does not pass through, it bounces."""
    if target_zfp < ZFP_HARDWALL:
        if current == "BS":
            return ("RWL", f"target zfp {target_zfp} < {ZFP_HARDWALL} = HARD WALL; "
                           f"the wall is denser than the move", 85.0)
        if current in ("SS", "WLS"):
            return ("SS", f"target zfp {target_zfp} < {ZFP_HARDWALL}", 60.0)
    if current == "BS":
        if target_zfp > 80:
            return ("PBS", f"target zfp {target_zfp} > 80 = strong cascade", 80.0)
        if target_zfp > 60:
            return ("PBS", f"target zfp {target_zfp} > 60 = cascade", 65.0)
        if 20 <= target_zfp <= 40:
            return ("R", f"target zfp {target_zfp} in 20-40 = mid-range", 75.0)
    if current == "SS" and target_zfp > ZFP_BREAKOUT:
        return ("BS", f"target zfp {target_zfp} > {ZFP_BREAKOUT} = breakout", 80.0)
    if current == "BS":
        if 40 < target_zfp <= 60:
            # §6.4.1 lists NO BS row for 40-60. §6.4 (the generic Transition Rules
            # table the prompt itself supplies) covers it verbatim: "BS → PBS — the
            # zone fails with extreme momentum; distant target". A target BEYOND the
            # mid-range band (20-40) is failing, so the BS cascades. The earlier build
            # filled this gap with an invented "BS 40-60 → BS" CONTINUATION row — a
            # transition the prompt does not contain, and one that also collided with
            # the no-self-loop guard. It is replaced by the canon's own row.
            return ("PBS", f"target zfp {target_zfp} beyond the 20-40 mid-range = "
                           f"the zone fails (§6.4 BS→PBS)", 65.0)
    if current == "SS":
        return ("SS", f"both bounds < 30 = SS continues (target zfp {target_zfp})", 70.0)
    if current == "WLS":
        return ("BS", f"WLS always resolves into a BS (target zfp {target_zfp})", 85.0)
    if current == "R":
        # CANON E2.3 (docs/PLUTUS_VISION_V2_E1E2_SPEC.md:264): "R → persists >1 session =
        # SS (RECLASSIFY)". The earlier build returned WL — a shape the canon does NOT list
        # for R (audit 2026-10-06, e2_engine.py:238). The RECLASSIFY means the terminal R
        # becomes an SS, so the chain continues into the range state, not a rejection.
        return ("SS", f"R persists >1 session = SS (RECLASSIFY; target zfp {target_zfp})", 60.0)
    if current == "WL":
        # CANON E2.3: "WL → opposite momentum = RWL". The transition takes NO momentum (ST-11a
        # pins the signature: the ZFP decides, not the momentum), so the opponent is read from
        # the TARGET's density: a hard wall (ZFP < 20) IS the opposite move — the price rejects
        # it and reverses again (RWL). With no dense wall the WL collapses into a range (SS).
        if target_zfp < ZFP_HARDWALL:
            return ("RWL", f"WL meets a dense wall (target zfp {target_zfp} < {ZFP_HARDWALL}) "
                           f"= RWL (the reverse)", 70.0)
        return ("SS", f"WL with no opposing wall (target zfp {target_zfp}) = SS", 55.0)
    if current == "RWL":
        return ("SS", f"RWL resolves to SS (target zfp {target_zfp})", 70.0)
    # NO DEFAULT ANSWER. Reaching here means no §6.4.1 row matched. The canon's
    # zero-tolerance code forbids inventing a shape, and a silent fallback is an
    # invented shape wearing a low confidence. The caller treats None as
    # "no rule applies" and terminates the chain — a shorter honest chain beats a
    # longer fabricated one.
    return None


# ── §6.5 · TIMEFRAME ELEMENT MATCHING ──────────────────────────────────────

_TF_ORDER = ["5m", "15m", "30m", "1H", "4H"]


def tf_match(source_tf: str, target_tf: str) -> bool:
    """§6.5 — 'Never more than 2 dimensions up.'

    DEFECT FOUND AND FIXED 2026-10-03 (ST-13f): the first version accepted only
    UPWARD moves, so `4H -> 1H` returned False. The canon's table is NOT one-way:

        4H  -> 4H  (1H acceptable)
        1H  -> 1H  (30m ok)
        30m -> 30m (15m ok)
        15m -> 30m or 1H
        5m  -> 15m or 30m

    A HIGHER timeframe zone CONTAINS lower-timeframe liquidity, so the downward step
    is what makes the table usable: most chains start at the HTF and aim at the entry
    timeframe. The UPWARD step is the one the canon caps, at TWO dimensions —
    'a breakout that originates on 15m liquidity should NOT target a 4H zone — it will
    likely be absorbed before reaching it.' The bound is asymmetric, and that
    asymmetry IS the canon's rule."""
    try:
        d = _TF_ORDER.index(target_tf) - _TF_ORDER.index(source_tf)
    except ValueError:
        return False
    return -1 <= d <= 2




# ── §6.6 · FORWARD MAPPING · steps 1-5 ─────────────────────────────────────

def forward_map(zones: list[Zone], bars_momentum: float, monday: dt.date,
                tf_source: str = "1H") -> ShapeChain:
    """The five-step procedure. Every link carries its audit trail."""
    # STEP 1 — classify, or refuse
    try:
        current, anchor = classify(bars_momentum, zones)
    except FabricationRefused as e:
        return ShapeChain(current="", refusal=str(e))

    chain = ShapeChain(current=current, anchor_zone_ids=[anchor])
    zmap = {z.id: z for z in zones}
    # §6.5 — the INITIAL anchor must satisfy the SAME timeframe reach as every later target
    # (audit 2026-10-06, e2_engine.py:325). The earlier build checked tf_match only inside the
    # walk, so a classification anchored to a zone >2 dimensions up (or an invalid tf) was kept
    # while every subsequent target enforced the rule — an inconsistent contract. Refuse the
    # unreachable anchor by name rather than emitting a chain that violates §6.5 at link 0.
    _za = zmap.get(anchor)
    if _za is not None and not tf_match(tf_source, _za.timeframe):
        return ShapeChain(current="", refusal=(
            f"E2_TF_UNREACHABLE: the anchor zone {anchor} ({_za.timeframe}) is more than 2 "
            f"dimensions from the source timeframe {tf_source} (§6.5)"))

    # STEP 3 — extend the chain, with the per-link audit trail and the two bounds.
    # DIRECTION OF TRAVEL: seeded from the classification momentum, then flipped by a
    # reversal shape. §6.4.1 conditions the NEXT shape on the TARGET zone's ZFP, and
    # the target is only reachable if the walk follows the direction the current shape
    # implies (a rejection goes the OTHER way). The earlier build walked upward only,
    # so every reversing shape lost its target and the chain died at link 1.
    direction = 1 if bars_momentum >= 0 else -1
    for _ in range(MAX_CHAIN_LENGTH - 1):
        if current in _REVERSALS:
            direction = -direction      # a rejection reverses the move that reached it
        # the TARGET zone is the next one the move will meet, in `direction`.
        # DEFECT FOUND AND FIXED 2026-10-03: this passed `zmap[anchor]` — a Zone
        # OBJECT — where _next_target expects a zone ID. The lookup compared
        # `z.id == <Zone>` and never matched, so the loop silently broke on
        # iteration 0 and every chain came back EMPTY while ST-13a still passed,
        # because "0 links <= 5" is vacuously true. A test that passes on an empty
        # result is not a test.
        # THE REACH: a violent directional move (WL/BS/RWL) reaches for the FAR zone (the
        # week's real extreme); a pause/range shape (R/SS) takes the NEAREST.
        _far = current in ("WL", "BS", "RWL", "PWL", "PRWL", "PBS")
        nxt = _next_target(zones, anchor, direction, far=_far)
        if nxt is None:
            break
        if not tf_match(tf_source, nxt.timeframe):
            break                       # §6.5 — a shape cannot reach that far

        tr = transition(current, nxt.zfp)
        if tr is None:
            # NO §6.4.1 ROW MATCHED. The canon forbids inventing a shape, and a
            # silent default would be an invented shape wearing a low confidence.
            # Terminating here is the honest outcome.
            break
        shape, cond, conf = tr
        if shape == current:
            # No self-loop. "SS continues" is a STATE, not a link; the §6.3 chains that
            # revisit a shape (SS→BS→SS→BS, WLS→BS→WLS) do so ACROSS other shapes —
            # which the old `seen` guard wrongly forbade. Only an immediate A→A stops.
            break

        link = Link(from_shape=current, to_shape=shape, trigger_zone_id=nxt.id,
                    trigger_zone_zfp=nxt.zfp, condition=cond, confidence=conf)
        chain.chain.append(link)
        chain.anchor_zone_ids.append(nxt.id)
        current = shape
        anchor = nxt.id
        if chain.cumulative() < MIN_CHAIN_CONFIDENCE:
            break                       # §6.6 — terminate, do not pad

    # §6.4.1 · TEMPORAL COMPLETION. The zone-walk extends the chain only when a NEW
    # zone is reachable. When it stalls, the canon still reclassifies the terminal
    # shape on TIME alone:
    #   "R | Persists > 1 full session | SS (reclassify, NOT continue R)"
    #   "WL | No opposite momentum    | SS"
    #   "RWL | any                    | SS"
    # None of those rows needs a new target zone, so the reclassification is anchored to
    # the SAME zone (Rule 1 holds) and is applied at the WEEK layer. Without it, a map
    # with no second zone ends on one shape and the day decomposition is necessarily
    # flat (an R — a <1-session shape — drawn five times), which §6.8 and §6.4.1 forbid.
    _TEMPORAL = {"R": "SS", "WL": "SS", "RWL": "SS"}
    if current in _TEMPORAL and chain.cumulative() >= MIN_CHAIN_CONFIDENCE:
        z_anchor = zmap.get(anchor)
        if z_anchor is not None:
            succ = _TEMPORAL[current]
            chain.chain.append(Link(
                from_shape=current, to_shape=succ, trigger_zone_id=anchor,
                trigger_zone_zfp=z_anchor.zfp,
                condition=(f"§6.4.1 temporal: {current} unresolved past its canon "
                           f"duration at {anchor} → reclassify to {succ}"),
                confidence=60.0))
            # audit 2026-10-06, e2_engine.py:360 — the temporal link must keep the chain's
            # own invariant (len(anchor_zone_ids) == len(chain) + 1) and advance the terminal,
            # which the earlier build left untouched.
            chain.anchor_zone_ids.append(anchor)
            current = succ

    chain.terminal_shape = current      # the shape price is in at the week's end (299)

    # STEP 4 — the alternative chain, ALWAYS
    chain.alternative = _alternative(zmap, chain)

    # STEPS 2 + 5 — consolidation phase, then the day decomposition with the speed rule
    anchor_id = chain.anchor_zone_ids[-1] if chain.anchor_zone_ids else None
    z = zmap.get(anchor_id) if anchor_id else None
    chain.consolidation_phase = consolidation_phase(z) if z else "EARLY"
    chain.days = day_decomposition(chain, zones, monday)
    return chain


_REVERSALS = ("WL", "RWL", "PWL", "PRWL")


def _next_target(zones: list[Zone], current_id: str, direction: int,
                 far: bool = False) -> Zone | None:
    """The next zone the price meets: the strongest one IN THE DIRECTION OF TRAVEL.

    §6.6 step 3 extends the chain "shape by shape through the trading week", and
    §6.4.1 conditions the next shape on the TARGET zone's ZFP — so the walk must be
    able to go DOWN as well as up. Deliberately simple and deterministic: NEAREST first,
    confluence breaking a tie (audit 2026-10-06: the doc claimed "confluence first" but the
    key has always been `(distance, -confluence)` — distance dominates, and a forecast whose
    next step depends on floating-point ties is not reproducible).

    THE REACH (fix 2026-10-06). The operator's play-forward exposed that a
    "violent directional move" (WL / BS / RWL — the canon's own words) was walking to
    the ADJACENT zone and reversing, so the whole week came back as a +/-1-zone
    oscillation that never reached the resistance the price actually rallied to
    (101.275). A directional move now targets the FARTHEST zone its direction can
    reach — the week's real extreme — while a range/pause shape (R, SS) still takes
    the nearest, which is what a pause means. `far` is set by the caller from the
    CURRENT shape, so the reach is a property of the move, not of the map."""
    cur = next((z for z in zones if z.id == current_id), None)
    if cur is None:
        return None
    pool = [z for z in zones if z.id != cur.id and z.degree != "MINIMAL"]
    # DIRECTION BY CENTRE (audit 2026-10-06). The old edge-strict test (`bottom >= cur.top`
    # up / `top <= cur.bottom` down) DROPPED every zone that overlapped the current one, so
    # an overlapping map returned an empty pool and the walk stalled. Centres are total: a
    # zone is "above" iff its mid is above the current's mid — no zone is ever both.
    cc = (cur.top + cur.bottom) / 2.0
    if direction > 0:
        pool = [z for z in pool if (z.top + z.bottom) / 2.0 > cc]
    elif direction < 0:
        pool = [z for z in pool if (z.top + z.bottom) / 2.0 < cc]
    if not pool:
        return None
    if far:
        # the FARTHEST reachable zone = the move's real target (the extreme)
        return max(pool, key=lambda z: (abs((z.bottom + z.top) - (cur.bottom + cur.top)),
                                        z.confluence))
    # "the NEXT zone the price meets" (§6.6 step 3 / §6.8's BS→"Next Resistance")
    # is the NEAREST one in the direction of travel; confluence breaks a tie.
    return min(pool, key=lambda z: (abs((z.bottom + z.top) - (cur.bottom + cur.top)),
                                    -z.confluence))


def _alternative(zmap: dict, chain: ShapeChain) -> list[Link]:
    """§6.6 step 4 — for EVERY primary chain, at least one alternative that activates
    if the DECISION ZONE behaves oppositely. The decision zone is the first link's
    target; the threshold is the §6.4.1 band boundary, and the shape is the canon's
    OTHER branch for that band. The report can then say "if X fails above 45%, the
    alternative applies" — an actionable branch, not a single path that must be
    believed or discarded whole.

    DEFECT FOUND AND FIXED 2026-10-05: the earlier build produced a single link from a
    contrived `min/max` band fudge (`min(hardwall+1, max(hardwall, zfp-25))`), which
    could return the SAME branch as the primary. The branch is now the canon's
    opposite outcome for the decision zone's own band."""
    if not chain.chain:
        # §6.6 step 4 promises the alternative ALWAYS (audit 2026-10-06, e2_engine.py:473).
        # A stalled / SS-start week has ZERO links, so the earlier build returned [] and the
        # "if the decision zone behaves oppositely" contract was unfulfilled. Fall back to the
        # ANCHOR zone (the classification's own zone) as the decision zone.
        aid = chain.anchor_zone_ids[0] if chain.anchor_zone_ids else None
        z = zmap.get(aid) if aid else None
        if z is None:
            return []
        first_from = chain.current
    else:
        first = chain.chain[0]
        z = zmap.get(first.trigger_zone_id)
        if z is None:
            return []
        first_from = first.from_shape
    if z.zfp < ZFP_HARDWALL:
        # primary called the zone a Hard Wall (rejection); alternative = it fails
        alt_shape, threshold, why, conf = "PBS", f"ZFP > {ZFP_BREAKOUT}", \
            "the wall FAILS (cascade) — it does not reject", 60.0
    elif z.zfp > ZFP_BREAKOUT:
        # primary called the zone a failing zone (continuation); alternative = rejection
        alt_shape, threshold, why, conf = "RWL", f"ZFP < {ZFP_HARDWALL}", \
            "the zone HOLDS (Hard Wall rejection) — it does not fail", 85.0
    else:
        # primary called the zone a mid-range pause; alternative = it breaks
        alt_shape, threshold, why, conf = "BS", f"ZFP > {ZFP_BREAKOUT}", \
            "the mid-range zone FAILS (breakout) — it does not pause", 70.0
    return [Link(from_shape=first_from, to_shape=alt_shape,
                 trigger_zone_id=z.id, trigger_zone_zfp=z.zfp,
                 condition=f"ALTERNATIVE: DECISION ZONE {z.id} {threshold} → {why}",
                 confidence=conf)]


def consolidation_phase(z: Zone) -> str:
    """§6.8 — which part of the accumulation the zone is in."""
    if z.zfp > ZFP_BREAKOUT:
        return "POST_BS_EARLY_BREAKOUT"
    if z.zfp < ZFP_HARDWALL:
        return "LATE"                       # the bound is firm
    if z.degree in ("EXTREME", "HEAVY"):
        return "EARLY"
    if z.reactions >= 3:
        return "LATE"
    return "MID"


# §6.8 — the canon's EXPECTED DURATION per shape, in sessions (the low end of each
# range, so the mapping never over-claims a short shape's persistence).
_DURATION = {"SS": 2, "BS": 1, "PBS": 1, "WLS": 2, "R": 1, "WL": 1, "RWL": 1,
             "RS": 1, "PWL": 1, "PRWL": 1}


def day_decomposition(chain: ShapeChain, zones: list[Zone],
                      monday: dt.date) -> list[dict]:
    """§6.6 step 5 — Mon-Fri, each with shape, bias, key zone, triggers, confidence.

    THE SHAPE OCCUPIES ITS SESSIONS (§6.8). The earlier build mapped one chain shape
    per day-index and then padded the tail with the LAST shape, so a 1-link chain drew
    "WL, WL, WL, WL" — a <1-session shape stretched across four sessions, which §6.8's
    own duration column forbids. The week is now built by giving each shape its canon
    duration; the TERMINAL shape carries any remaining tail (it is the state price is
    in at the week's end) and a longer chain truncates to the five sessions.

    THE TRADING SPEED RULE (§6.10): "+1 day to expected timing" and "assume price
    moves at 30-50% of the speed you think it will". Applied here as an EXPLICIT
    +1 day offset on the date so a reader can see it, not as a hidden adjustment."""
    days, names = [], ["Mon", "Tue", "Wed", "Thu", "Fri"]
    shapes = [chain.current] + [l.to_shape for l in chain.chain]
    seq: list[str] = []
    for s in shapes:
        seq.extend([s] * max(1, _DURATION.get(s, 1)))
    if not seq:
        seq = [""]
    while len(seq) < len(names):
        seq.append(seq[-1])
    seq = seq[:len(names)]
    # each day's zone + confidence come from the LINK that produced ITS shape (the
    # first link that reaches it, so a revisited shape names a real trigger zone).
    by_to: dict = {}
    for l in chain.chain:
        by_to.setdefault(l.to_shape, l)
    # THE MID-RANGE ZONE (accuracy fix 2026-10-06). The canon defines SS as "oscillates
    # within a defined range bounded by IP zones" — a RANGE around the spot, not a run to
    # the week's extreme. The operator's accuracy check exposed the drift: after a WL that
    # correctly reached the Upper Resistance (Tue, err -0.03), the terminal SS anchored at
    # the FAR Key Support (100.55) while the actual price consolidated at ~100.9-101.0 (the
    # Equilibrium) — a systematic +0.4 miss for the rest of the week. A range shape (SS/R)
    # now anchors at the zone nearest the MIDDLE of the map (the spot/equilibrium); a
    # directional shape (WL/BS/RWL) keeps the link's target (the extreme it ran to).
    _ordered = sorted([z for z in zones if z.degree != "MINIMAL"], key=lambda z: (z.top + z.bottom))
    _mid_zone = _ordered[len(_ordered) // 2].id if _ordered else ""
    _RANGE = ("SS", "R", "WLS", "RS")
    for i, name in enumerate(names):
        shape = seq[i]
        link = by_to.get(shape)
        key_zone = link.trigger_zone_id if link else (chain.anchor_zone_ids[0]
                                                      if chain.anchor_zone_ids else "")
        # §6.6 TRACEABILITY (audit 2026-10-06, OCR finding #2): a range shape renders at the
        # equilibrium (key_zone), but the Link's OWN trigger zone is preserved as `link_zone`
        # so the day can still be traced back through `chain.chain`.
        link_zone = key_zone
        if shape in _RANGE and _mid_zone:
            key_zone = _mid_zone
        conf = link.confidence if link else 60.0
        d = monday + dt.timedelta(days=i)
        days.append({
            "day": name,
            "date": (d + dt.timedelta(days=1)).isoformat(),   # the +1 day speed rule
            "shape": shape,
            "bias": "down" if shape in ("WL", "RWL") else "up" if shape in ("BS", "PBS") else "range",
            "key_zone": key_zone,
            "link_zone": link_zone,
            "confidence": conf,
            "triggers": ["auction", "expiry", "economic"] if i in (1, 3) else [],
        })
    return days


# ── §6.1 · THE INTRADAY LEG TEMPLATES (the FINE E2 path) ────────────────────
# WHY THIS EXISTS (measured defect 2026-10-05): the E2 payload carried ONE point per
# day (five points, Mon-Fri), so the render's polyline drew a FIVE-VERTEX TRIANGLE,
# not a price path. The operator's read of the live chart: "it does not resemble
# price action." The fix is DATA, not render: the day anchors stay, but each day now
# expands into a FINE, JAGGED leg that reads as price continuation.
#
# THE CANON BASIS: Trident_System_Prompt_v5.3.3 §6.1 defines every macro shape by the
# price↔zone RELATIONSHIP — SS "oscillates within a defined range bounded by IP zones
# above and below"; WL a "rapid, violent directional move that immediately reverses —
# spike-and-reject"; BS "breaks decisively through a zone, then surges directionally";
# R "temporary stabilisation or mild retracement" (its variant RS a "sharp directional
# move"); WLS "an extended sequence of rapid, explosive whiplash moves"; PBS/PWL/PRWL
# the piercing variants. §6.8 supplies each shape's expected DURATION, and §6.4/§6.4.1
# its transitions. The canon does NOT specify the intraday LEG GEOMETRY (how many
# points a day's line should bend through), so the templates below are a DERIVED
# canonical form — defined ONCE here, documented against the §6.1 definition each one
# renders, and applied uniformly. They are not invented silently: each comment names
# the canon sentence it draws.
#
# EACH TEMPLATE is a list of (u, w):
#   u ∈ [0,1]   the fraction of the day's session (the TIME axis)
#   w ∈ [-1,1]  the WIGGLE, a dimensionless price offset, normalised so max|w| = 1
# with w(0) = w(1) = 0 for EVERY template, so each day's leg STARTS and ENDS exactly
# on its day anchor and consecutive days CHAIN with no discontinuity. The day's net
# travel is carried separately (the anchor-to-anchor span, below); the template only
# adds the shape's CHARACTER on top of that trend. A flat span (two days anchored to
# the same zone) therefore still moves — the range-bound oscillation an SS/SWING day
# must show, instead of a dead straight line.
_SHAPE_LEGS: dict[str, tuple[tuple[float, float], ...]] = {
    # Each leg is 3 points: anchor -> mid-day extreme -> anchor. The 3-point form gives every
    # day its own direction + inflection (a jagged path, not a straight day-to-day line), keeps
    # the day's anchor x present (every tag sits on a real anchor), and makes a flat-span day
    # still oscillate (the mid-day extreme differs from the shared anchor). Measured 2026-10-05.
    # §6.1.3 R — "temporary stabilisation or mild retracement": an ADVANCE WITH PULLBACKS.
    "R": ((0.0, 0.0), (0.45, 0.85), (1.0, 0.0)),
    # §6.1.4 WL — "spike-and-reject ... the rejection at the IP zone": a W.
    "WL": ((0.0, 0.0), (0.5, -0.9), (1.0, 0.0)),
    # §6.1.4 RWL — a reverse whiplash: the W inverted (an M).
    "RWL": ((0.0, 0.0), (0.5, 0.9), (1.0, 0.0)),
    # §6.1.1 SS — "oscillates within a defined range": a stair-step / slide.
    "SS": ((0.0, 0.0), (0.5, 0.9), (1.0, 0.0)),
    # §6.1.2 BS — "breaks decisively ... then surges directionally".
    "BS": ((0.0, 0.0), (0.45, 1.0), (1.0, 0.0)),
    # §6.1.2 PBS — a BS that "pierces ... WITHOUT PAUSING".
    "PBS": ((0.0, 0.0), (0.5, 1.0), (1.0, 0.0)),
    # §6.1.3 RS — Recovery SURGE: a sharp move back toward pre-breakout level.
    "RS": ((0.0, 0.0), (0.5, 1.0), (1.0, 0.0)),
    # §6.1.5 WLS — "rapid, explosive whiplash moves": the violent oscillation.
    "WLS": ((0.0, 0.0), (0.5, 0.95), (1.0, 0.0)),
    # §6.1.4 PWL — one deep spike, then the rejection down.
    "PWL": ((0.0, 0.0), (0.5, 1.0), (1.0, 0.0)),
    # §6.1.4 PRWL — "the strongest reversal signal in the taxonomy".
    "PRWL": ((0.0, 0.0), (0.5, -1.0), (1.0, 0.0)),
}

# PER-SHAPE VOLATILITY — the amplitude multiplier on the day's wiggle, read from the
# canon's own language (§6.1.5 WLS "dramatically increased volatility"; §6.1.2 the
# piercing variants travel furthest; §6.1.3 R is the mildest, a "mild retracement").
_SHAPE_AMP = {"WLS": 1.40, "PWL": 1.20, "PRWL": 1.20, "BS": 1.10, "PBS": 1.10,
              "RS": 1.00, "WL": 1.00, "RWL": 1.00, "SS": 1.00, "R": 0.80}

DAY_MS = 86_400_000          # one trading day in ms — the intraday span of a day's leg
_MIN_AMP = 0.07              # the per-day travel FLOOR (price units). The operator's
#                              spec: "~0.10-0.25 per day" peak-to-peak; a template's
#                              p2p is 2·amp·max|w| = 2·amp (max|w|=1), so amp 0.07
#                              gives p2p ≈ 0.14 even on a flat (same-zone) day.
_SPAN_FRAC = 0.35            # the wiggle as a fraction of the day's anchor-to-anchor
#                              span, so a large travelling day bends proportionally more.
_PRICE_DP = 5                # price rounding — the zone-map precision (e.g. 101.01033).


def fine_path(days: list[tuple], day_ms: int = DAY_MS) -> tuple[list[int], list[float], list[str], list[float]]:
    """Expand the DAY anchors into a CONTINUOUS, JAGGED price path.

    INPUT  `days`: the day anchors the build already computed, one tuple per day —
                   (x_ms, y_price, shape, confidence). `y_price` is the day's key
                   zone level; `x_ms` is the day's +1-day (speed-rule) timestamp.
    OUTPUT (xs, ys, shapes, confs) — four equal-length lists. xs/ys are the fine path
                   (many points per day, x in epoch ms for `xloc=bar_time`). `shapes`
                   and `confs` are "" / 0 at every intraday point and carry the day's
                   shape + confidence ONLY at the five day-boundary points, so the
                   render's per-point tag loop draws exactly one tag per DAY and none
                   in between (Rule 1: a point with no shape is never tagged).

    THE CHAIN LAW: day i's leg runs over [x_i, x_i + day_ms] and its last point is the
    FIRST point of day i+1 (which is de-duplicated), so the polyline is one continuous
    stroke with no seam and no gap. Day i's PRICE is a straight trend from its own
    anchor to the NEXT day's anchor (so the day-level chain the engine emitted is
    preserved — the week still walks R → WL → SS by zone) PLUS the shape's template
    wiggle on top. The last day has no successor, so its span is 0 and its template
    draws the FORESIGHT TAIL the week ends on (§6.10's tail), one day past the last
    anchor.

    An unknown/empty shape falls back to the SS (range/oscillation) template — the
    canon's own default weekly storyline (§6.3 "SS → BS → R → WL"). Empty `days`
    returns four empty lists (an empty week draws nothing — never a fabricated point).
    """
    if not days:
        return [], [], [], []
    anchors = list(days)
    xs: list[int] = []
    ys: list[float] = []
    shapes: list[str] = []
    confs: list[float] = []

    for i, (x0, y0, shape, conf) in enumerate(anchors):
        leg = _SHAPE_LEGS.get(shape, _SHAPE_LEGS["SS"])
        span = (float(anchors[i + 1][1]) - float(y0)) if i + 1 < len(anchors) else 0.0
        amp = max(_MIN_AMP, _SPAN_FRAC * abs(span)) * _SHAPE_AMP.get(shape, 1.0)
        for k, (u, w) in enumerate(leg):
            if i > 0 and k == 0:
                # the previous day's final point is ALREADY at this x — never duplicate,
                # or the stroke carries a zero-length segment at every day boundary.
                continue
            xs.append(int(x0) + int(round(u * day_ms)))
            ys.append(round(float(y0) + span * u + amp * w, _PRICE_DP))
            shapes.append("")
            confs.append(0.0)

    # TAG THE DAY BOUNDARIES. The day's own x is on the path (it is the first point of
    # the day's leg, or the last point of the previous day's). Carry the day's shape +
    # confidence onto that one point; every other point stays tag-free. Assign ONLY to a
    # FREE slot and keep scanning (audit 2026-10-06, OCR finding #3): the previous form
    # `break`ed on the first `xv >= x0` even when the slot was already taken, so a
    # colliding day (duplicate x, rounding, a zero-length gap) silently LOST its tag.
    for (x0, y0, shape, conf) in anchors:
        for idx, xv in enumerate(xs):
            if xv >= int(x0) and shapes[idx] == "":
                shapes[idx] = shape or ""
                confs[idx] = float(conf or 0.0)
                break
    return xs, ys, shapes, confs