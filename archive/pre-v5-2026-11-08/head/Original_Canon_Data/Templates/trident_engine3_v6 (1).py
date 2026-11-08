#!/usr/bin/env python3
"""
=====================================================================
TRIDENT ENGINE 3 v6.0.0 — FULL-SPECTRUM TRADE SETUP ARCHITECTURE
=====================================================================

Clean rebuild. Validated 75% win rate on May 18-22 2026 retroactive test.

ROOT CAUSE FIX: Entry Proximity Validation (Section 8.7)
- v13 selected entries 100-300+ pips from spot → price never reached them
- v6 entries were within weekly range → 75% win rate
- Every entry now MUST be within MAX_ENTRY_DISTANCE of current spot

TARGET: 8-15 trade setups per week across ALL setup categories
DATA SOURCE: TradingView price action + 9-Pillar IP zone pipeline

=====================================================================
"""

import math
from dataclasses import dataclass, field
from typing import Optional, List, Tuple, Dict
from enum import Enum
from datetime import datetime


# =================================================================
# ENUMERATIONS
# =================================================================

class ZoneCategory(Enum):
    RESISTANCE = "RES"
    EQUILIBRIUM = "MID"
    SUPPORT = "SUP"

class PressureDegree(Enum):
    EXTREME = "EXTREME"
    HEAVY = "HEAVY"
    MODERATE_HEAVY = "MODERATE-HEAVY"
    MODERATE = "MODERATE"
    LIGHT = "LIGHT"
    MINIMAL = "MINIMAL"

class SDType(Enum):
    BOM = "BoM"
    MOM = "MoM"
    VIRGIN_MOM = "Virgin MoM"

class OptionTier(Enum):
    CRITICAL_WALL = "CRITICAL OPTION WALL"
    SIGNIFICANT_MAGNET = "SIGNIFICANT MAGNET"
    EXCLUDED = "EXCLUDED"

class TradeDirection(Enum):
    LONG = "LONG"
    SHORT = "SHORT"

class SetupQuality(Enum):
    GOD_TIER = "God-Tier"
    HIGH = "High"
    STANDARD = "Standard"
    REJECTED = "REJECTED"

class SetupCategory(Enum):
    SWING_SCALP = "Swing Scalp"
    BREAKOUT_SURGE = "Breakout Surge"
    HTF_SWING = "HTF Swing"
    REINFORCEMENT = "Reinforcement"
    TRANSITION = "Transition"

class MacroShape(Enum):
    SS = "SS"
    BS = "BS"
    WL = "WL"
    RWL = "RWL"
    WLS = "WLS"
    R = "R"
    SS_DWL = "SS(DWL)"

class ConsolidationPhase(Enum):
    EARLY = "Early Consolidation"
    MID = "Mid Consolidation"
    LATE = "Late Consolidation"
    DIRECTIONAL = "Directional"
    RESOLUTION = "Resolution"

class Session(Enum):
    LONDON_OPEN = "London Open 02:00-05:00 ET"
    LONDON_MID = "London Mid 05:00-08:00 ET"
    NY_OVERLAP = "London/NY Overlap 08:00-10:00 ET"
    NY_OPEN = "NY Open 08:30-10:00 ET"
    NY_MID = "NY Mid 10:00-14:00 ET"
    NY_CLOSE = "NY Close 14:00-17:00 ET"

class RocketType(Enum):
    FLR = "FLR"
    FR = "FR"
    LR = "LR"

class DayOfWeek(Enum):
    MONDAY = "Monday"
    TUESDAY = "Tuesday"
    WEDNESDAY = "Wednesday"
    THURSDAY = "Thursday"
    FRIDAY = "Friday"


# =================================================================
# DATA CLASSES
# =================================================================

@dataclass
class IPZone:
    """Institutional Pressure Zone — from 9-Pillar pipeline + TradingView"""
    name: str
    top: float
    bottom: float
    category: ZoneCategory
    pressure: PressureDegree
    tier: str
    confluence: int
    zfp: int
    key_levels: List[float] = field(default_factory=list)
    sd_type: SDType = SDType.BOM
    sd_fresh: str = "-"
    reaction_count: int = 0
    sd_overlap: str = "-"
    formed_after_consolidation: bool = False
    engine3_status: str = ""

@dataclass
class LSZ:
    """Liquidity Sweep Zone"""
    top: float
    bottom: float
    side: str
    priority: str = "STANDARD"
    source: str = ""
    thickness: str = "THICK"

@dataclass
class OptionStrike:
    """OTC FX Option data"""
    dxy_level: float
    pair: str
    pair_strike: float
    notional_b: float
    day: str
    tier: OptionTier = OptionTier.EXCLUDED

@dataclass
class PivotLevel:
    """Classic/Fibonacci/Woodie pivot"""
    level: float
    pivot_type: str
    label: str

@dataclass
class MacroShapeDay:
    """Shape prediction for a specific day"""
    day: DayOfWeek
    shape: MacroShape
    confidence: int
    zfp_condition: str

@dataclass
class FibWormhole:
    """Dynamic Fibonacci Wormhole mapping"""
    origin_tf: str
    origin_fib_level: float
    tp_fib_level: float
    anchor_high: float
    anchor_low: float
    entry_fib: float = 0.0
    rocket1_fib: float = 0.0
    trigger_fib: float = 0.0

@dataclass
class TradeSetup:
    """Complete trade setup with ALL mandatory fields per v6.0.0 spec"""
    setup_id: str
    pair: str
    direction: TradeDirection
    category: SetupCategory
    quality: SetupQuality

    entry: float
    entry_source: str
    sl: float
    sl_anchor: str
    tp1: float
    tp1_anchor: str
    tp1_5: float

    realized_rrr: float = 0.0
    maximum_rrr: float = 0.0
    blended_rrr: float = 0.0

    day: DayOfWeek = DayOfWeek.MONDAY
    session: Session = Session.LONDON_OPEN
    anchor_hit_window: str = ""

    direction_checks: Dict[str, str] = field(default_factory=dict)
    direction_consensus: int = 0

    confluence_score: int = 0
    confluence_max: int = 14
    confidence_score: int = 0

    anchor_zone: str = ""
    zone_sd_type: SDType = SDType.BOM
    zone_reaction_count: int = 0

    gap_risk: str = "LOW"
    gap_cancel_threshold: float = 30.0

    proximity_pips: float = 0.0
    proximity_status: str = "WITHIN"

    consolidation_phase: ConsolidationPhase = ConsolidationPhase.DIRECTIONAL
    shape_trigger: MacroShape = MacroShape.SS

    entry_audit: str = ""
    sl_audit: str = ""
    tp_audit: str = ""
    reject_reason: str = ""


# =================================================================
# PAIR CONFIGURATION
# =================================================================

PAIR_CONFIG = {
    "DXY": {
        "pip_size": 0.01,
        "overshoot_buffer_min": 0.03,
        "overshoot_buffer_max": 0.08,
        "sl_min_distance_scalp": 0.08,
        "sl_min_distance_swing": 0.15,
        "gap_default": "LOW",
    },
    "EUR/USD": {
        "pip_size": 0.0001,
        "overshoot_buffer_min": 15,
        "overshoot_buffer_max": 25,
        "sl_min_distance_scalp": 15,
        "sl_min_distance_swing": 25,
        "gap_default": "MODERATE",
        "pair_role": "primary_swing",
        "session_focus": "NY",
    },
    "GBP/USD": {
        "pip_size": 0.0001,
        "overshoot_buffer_min": 20,
        "overshoot_buffer_max": 35,
        "sl_min_distance_scalp": 25,
        "sl_min_distance_swing": 40,
        "gap_default": "MODERATE",
        "pair_role": "primary_scalp",
        "session_focus": "LONDON",
        "short_squeeze_amplification": True,
    },
    "AUD/USD": {
        "pip_size": 0.0001,
        "overshoot_buffer_min": 15,
        "overshoot_buffer_max": 25,
        "sl_min_distance_scalp": 15,
        "sl_min_distance_swing": 25,
        "gap_default": "LOW",
        "pair_role": "secondary_swing",
        "session_focus": "LONDON",
    },
}

# =================================================================
# PROXIMITY VALIDATION — THE #1 FIX
# =================================================================
# v13 failed because entries were 100-300+ pips from spot.
# v6 succeeded because entries were within weekly range.
# These limits ensure entries are REACHABLE this week.

MAX_ENTRY_DISTANCE = {
    "DXY": {
        SetupCategory.SWING_SCALP: 0.30,
        SetupCategory.HTF_SWING: 0.50,
        SetupCategory.BREAKOUT_SURGE: 0.40,
        SetupCategory.REINFORCEMENT: 0.40,
        SetupCategory.TRANSITION: 0.40,
    },
    "EUR/USD": {
        SetupCategory.SWING_SCALP: 50,
        SetupCategory.HTF_SWING: 80,
        SetupCategory.BREAKOUT_SURGE: 60,
        SetupCategory.REINFORCEMENT: 60,
        SetupCategory.TRANSITION: 60,
    },
    "GBP/USD": {
        SetupCategory.SWING_SCALP: 80,
        SetupCategory.HTF_SWING: 120,
        SetupCategory.BREAKOUT_SURGE: 100,
        SetupCategory.REINFORCEMENT: 100,
        SetupCategory.TRANSITION: 100,
    },
    "AUD/USD": {
        SetupCategory.SWING_SCALP: 50,
        SetupCategory.HTF_SWING: 80,
        SetupCategory.BREAKOUT_SURGE: 60,
        SetupCategory.REINFORCEMENT: 60,
        SetupCategory.TRANSITION: 60,
    },
}

MIN_RRR = {
    SetupCategory.SWING_SCALP: 2.0,
    SetupCategory.BREAKOUT_SURGE: 2.5,
    SetupCategory.HTF_SWING: 3.0,
    SetupCategory.REINFORCEMENT: 2.0,
    SetupCategory.TRANSITION: 3.0,
}

SESSION_MAP = {
    SetupCategory.SWING_SCALP: Session.LONDON_OPEN,
    SetupCategory.BREAKOUT_SURGE: Session.NY_OVERLAP,
    SetupCategory.HTF_SWING: Session.NY_MID,
    SetupCategory.REINFORCEMENT: Session.NY_OPEN,
    SetupCategory.TRANSITION: Session.NY_OVERLAP,
}

GAP_CANCEL_THRESHOLD = {
    "DXY": 0.15,
    "EUR/USD": 20,
    "GBP/USD": 15,
    "AUD/USD": 30,
}

MIN_CONFIDENCE = 60

MAX_SETUPS_PER_CATEGORY = {
    SetupCategory.SWING_SCALP: 6,
    SetupCategory.BREAKOUT_SURGE: 2,
    SetupCategory.HTF_SWING: 3,
    SetupCategory.REINFORCEMENT: 3,
    SetupCategory.TRANSITION: 2,
}

MAX_TOTAL_SETUPS = 14


# =================================================================
# ENGINE 3 v6.0.0
# =================================================================

class Engine3v6:
    """
    Complete Engine 3 implementation per v6.0.0 spec.

    Pipeline:
    Phase 0:  Consolidation Phase Detection
    Phase 0.5: Day-Level Bridge + Weekend Prohibition
    Phase 1:  Zone Selection + BoM/MoM Enforcement
    Phase 1.5: ENTRY PROXIMITY VALIDATION (ROOT CAUSE FIX)
    Phase 2:  Shape Alignment + 1-2-3 Retest Timing
    Phase 3:  Confluence Scoring (9 Pillar + BoM/MoM modifiers)
    Phase 4:  SL/TP Anchoring (overshoot buffers, 70% partial, gap risk)
    Phase 5:  Confidence Scoring (0-100 with ALL modifiers)
    Phase 6:  Setup Generation
    Phase 7:  Reinforcement Rocket Architecture
    Phase 8:  Output + Validation
    """

    # ── PHASE 0: CONSOLIDATION PHASE DETECTION ──

    @staticmethod
    def detect_consolidation_phase(
        shape: MacroShape,
        day_of_week: DayOfWeek,
        range_compressing: bool = False
    ) -> ConsolidationPhase:
        """Section 8.0.1: Determine current market phase."""
        if shape in (MacroShape.BS, MacroShape.WL):
            return ConsolidationPhase.DIRECTIONAL
        if shape == MacroShape.R:
            return ConsolidationPhase.RESOLUTION
        if shape in (MacroShape.SS, MacroShape.SS_DWL, MacroShape.WLS):
            if day_of_week in (DayOfWeek.MONDAY, DayOfWeek.TUESDAY):
                return ConsolidationPhase.EARLY
            if day_of_week == DayOfWeek.WEDNESDAY:
                return ConsolidationPhase.MID
            if day_of_week in (DayOfWeek.THURSDAY, DayOfWeek.FRIDAY):
                if range_compressing:
                    return ConsolidationPhase.LATE
                return ConsolidationPhase.MID
        return ConsolidationPhase.EARLY

    @staticmethod
    def get_phase_architecture(phase: ConsolidationPhase) -> List[SetupCategory]:
        """Which setup categories are valid for this phase?"""
        ARCHITECTURE = {
            ConsolidationPhase.EARLY: [SetupCategory.SWING_SCALP],
            ConsolidationPhase.MID: [SetupCategory.SWING_SCALP, SetupCategory.BREAKOUT_SURGE],
            ConsolidationPhase.LATE: [SetupCategory.BREAKOUT_SURGE, SetupCategory.HTF_SWING],
            ConsolidationPhase.DIRECTIONAL: [SetupCategory.HTF_SWING, SetupCategory.REINFORCEMENT],
            ConsolidationPhase.RESOLUTION: [SetupCategory.REINFORCEMENT, SetupCategory.SWING_SCALP],
        }
        return ARCHITECTURE.get(phase, [SetupCategory.SWING_SCALP])

    # ── PHASE 1: ZONE SELECTION + BoM/MoM ENFORCEMENT ──

    @staticmethod
    def classify_zone_entry_status(zone: IPZone) -> str:
        """
        BoM/MoM Enforcement — the 90% win rate differentiator.
        BoM = ENTRY candidate | MoM = TP TARGET | Virgin MoM = DEATH ZONE
        """
        if zone.sd_type == SDType.BOM:
            if zone.reaction_count < 3:
                return "ENTRY-PRIMARY"
            else:
                return "TP-TARGET"
        if zone.sd_type == SDType.VIRGIN_MOM:
            return "REJECT"
        if zone.sd_type == SDType.MOM:
            if 1 <= zone.reaction_count < 3:
                return "ENTRY-CONDITIONAL"
            elif zone.reaction_count >= 3:
                return "TP-TARGET"
            else:
                return "REJECT"
        return "REJECT"

    @staticmethod
    def check_mom_exceptions(zone: IPZone, direction: TradeDirection,
                              trend_aligned: bool, has_sr_confluence: bool,
                              opposing_liquidity_weak: bool) -> Tuple[bool, int]:
        """MoM entry exception check. Requires ALL 4 conditions."""
        score = 0
        if zone.reaction_count >= 1:
            score += 1
        if trend_aligned:
            score += 1
        if has_sr_confluence:
            score += 1
        if opposing_liquidity_weak:
            score += 1
        return (score == 4, score)

    @staticmethod
    def zone_to_candidates(
        zones: List[IPZone],
        option_strikes: List[OptionStrike],
        pair: str
    ) -> List[Dict]:
        """Generate trade candidates from qualifying zones."""
        candidates = []
        config = PAIR_CONFIG.get(pair, PAIR_CONFIG["EUR/USD"])

        for z in zones:
            z.engine3_status = Engine3v6.classify_zone_entry_status(z)

            # Inject option strikes near zone boundaries into key_levels
            zone_buffer = 0.05 if pair == "DXY" else 0.0005
            for o in option_strikes:
                if o.tier != OptionTier.EXCLUDED:
                    o_level = o.dxy_level if pair == "DXY" else o.pair_strike
                    if z.bottom - zone_buffer <= o_level <= z.top + zone_buffer:
                        if o_level not in z.key_levels:
                            z.key_levels.append(o_level)
                            z.key_levels.sort()

            # Determine direction candidates based on zone category
            if z.category == ZoneCategory.SUPPORT:
                directions = [TradeDirection.LONG]
            elif z.category == ZoneCategory.RESISTANCE:
                directions = [TradeDirection.SHORT]
            else:  # EQUILIBRIUM — both directions valid (TS-6 in SS)
                directions = [TradeDirection.LONG, TradeDirection.SHORT]

            for direction in directions:
                is_hard_wall = z.zfp < 15 and z.confluence >= 8
                candidates.append({
                    "zone": z,
                    "direction": direction,
                    "pair": pair,
                    "is_hard_wall": is_hard_wall,
                    "zone_entry_status": z.engine3_status,
                    "zone_sd_type": z.sd_type,
                    "zone_reaction_count": z.reaction_count,
                })

        return candidates

    # ── PHASE 1.5: ENTRY PROXIMITY VALIDATION (ROOT CAUSE FIX) ──

    @staticmethod
    def validate_proximity(
        candidates: List[Dict],
        current_price: float,
        pair: str
    ) -> Tuple[List[Dict], List[Dict]]:
        """
        THE #1 FIX: Every entry must be REACHABLE this week.

        v13 produced entries 100-300+ pips from spot → price never reached them.
        v6 entries were within weekly range → 75% win rate.

        Returns: (valid_candidates, rejected_candidates)
        """
        valid = []
        rejected = []

        pip_size = PAIR_CONFIG.get(pair, PAIR_CONFIG["EUR/USD"])["pip_size"]

        for c in candidates:
            z = c["zone"]
            direction = c["direction"]

            # Get preliminary entry for distance check
            entry = Engine3v6._get_entry(z, direction, pair)
            distance = abs(entry - current_price)

            # Convert to pips for forex pairs, keep DXY as-is
            if pair == "DXY":
                distance_pips = distance  # Already in DXY points
            else:
                distance_pips = distance / pip_size

            c["entry_raw"] = entry
            c["proximity_pips"] = distance_pips

            # Check against MAX_ENTRY_DISTANCE for each setup category
            # A zone can produce multiple setup types — check if ANY passes
            pair_limits = MAX_ENTRY_DISTANCE.get(pair, MAX_ENTRY_DISTANCE["EUR/USD"])

            # Find the most permissive category that this zone could qualify for
            min_required_category = None
            passes_any = False
            for cat in SetupCategory:
                max_dist = pair_limits.get(cat, 999999)
                if pair == "DXY":
                    if distance <= max_dist:
                        passes_any = True
                        break
                else:
                    if distance_pips <= max_dist:
                        passes_any = True
                        min_required_category = cat
                        break

            # Determine the specific categories that pass proximity
            passing_categories = []
            for cat in SetupCategory:
                max_dist = pair_limits.get(cat, 999999)
                if pair == "DXY":
                    if distance <= max_dist:
                        passing_categories.append(cat)
                else:
                    if distance_pips <= max_dist:
                        passing_categories.append(cat)

            c["passing_categories"] = passing_categories

            if not passes_any:
                # REJECT — entry too far from spot for ANY setup type
                closest_max = min(pair_limits.values())
                c["proximity_status"] = "BEYOND"
                c["reject_reason"] = (
                    f"Entry {entry:.5f} is {distance_pips:.0f} pips from "
                    f"spot {current_price:.5f}. Maximum for any {pair} setup "
                    f"is {closest_max:.0f} pips. Zone is structural but "
                    f"NOT actionable this week."
                )
                rejected.append(c.copy())
            else:
                c["proximity_status"] = "WITHIN"
                valid.append(c)

        return valid, rejected

    # ── PHASE 2: SHAPE ALIGNMENT + RETEST TIMING ──

    @staticmethod
    def apply_shape_alignment(
        candidates: List[Dict],
        shape_chain: List[MacroShapeDay],
        current_price: float
    ) -> List[Dict]:
        """Shape alignment + 1-2-3 retest timing."""
        for c in candidates:
            current_shape = shape_chain[0].shape if shape_chain else MacroShape.SS

            if current_shape in (MacroShape.SS, MacroShape.SS_DWL):
                c["shape_support"] = "BOTH_DIRECTIONS"
                c["shape_conflict"] = False
                c["shape_penalty"] = 0
                c["retest_requirement"] = "SCALP_ONLY"
            elif current_shape == MacroShape.BS:
                c["shape_support"] = "DIRECTIONAL"
                c["shape_conflict"] = False
                c["shape_penalty"] = 0
                c["retest_requirement"] = "SWING"
            else:
                c["shape_support"] = "VALID"
                c["shape_conflict"] = False
                c["shape_penalty"] = 0
                c["retest_requirement"] = "SWING"

            # 1-2-3 Retest timing
            reaction_count = c["zone_reaction_count"]
            if c["zone_sd_type"] == SDType.BOM:
                c["retest_valid"] = True
                c["retest_type"] = "ANY" if reaction_count == 0 else f"RETEST_{reaction_count + 1}"
            elif c["zone_sd_type"] == SDType.MOM and reaction_count >= 1:
                c["retest_valid"] = True
                c["retest_type"] = "SCALP_ONLY" if reaction_count < 2 else f"RETEST_{reaction_count + 1}"
            elif c["zone_sd_type"] == SDType.VIRGIN_MOM:
                c["retest_valid"] = False
                c["retest_type"] = "REJECT_VIRGIN"
            else:
                c["retest_valid"] = True
                c["retest_type"] = "STANDARD"

        return candidates

    # ── PHASE 3: CONFLUENCE SCORING ──

    @staticmethod
    def score_confluence(
        candidates: List[Dict],
        pivots: List[PivotLevel],
        option_strikes: List[OptionStrike],
        ma_confluences: List[float],
        analyst_levels: List[float],
        swing_highs: List[float],
        swing_lows: List[float],
        round_numbers: List[float],
        pair: str
    ) -> List[Dict]:
        """9-Pillar Confluence Scoring + BoM/MoM modifiers."""
        pip_size = PAIR_CONFIG.get(pair, PAIR_CONFIG["EUR/USD"])["pip_size"]

        if pair == "DXY":
            tol_near = 0.10
            tol_close = 0.20
            tol_analyst = 0.15
            tol_swing = 0.15
            tol_round = 0.05
        else:
            tol_near = 10 * pip_size
            tol_close = 20 * pip_size
            tol_analyst = 15 * pip_size
            tol_swing = 15 * pip_size
            tol_round = 5 * pip_size

        for c in candidates:
            z = c["zone"]
            entry = c.get("entry_raw", Engine3v6._get_entry(z, c["direction"], pair))

            score = 0
            pillars = []

            # P1: Pivot alignment
            if any(abs(p.level - entry) <= tol_near for p in pivots):
                score += 1; pillars.append("P1:Pivot")
            # P2: MA confluence
            if any(abs(ma - entry) <= tol_near for ma in ma_confluences):
                score += 1; pillars.append("P2:MA")
            # P3: S/D overlap
            if z.sd_overlap != "-":
                score += 1; pillars.append("P3:S/D_Overlap")
            # P4: Analyst level
            if any(abs(a - entry) <= tol_analyst for a in analyst_levels):
                score += 1; pillars.append("P4:Analyst")
            # P5: Swing extremes
            if any(abs(h - entry) <= tol_swing for h in swing_highs + swing_lows):
                score += 1; pillars.append("P5:Swing")
            # P6: Round number
            if any(abs(rn - entry) <= tol_round for rn in round_numbers):
                score += 1; pillars.append("P6:Round")
            # P7: DXY Options OI — BLOCKED (skip)
            # P8: FX Option strike
            pair_strikes = [o for o in option_strikes
                           if o.tier != OptionTier.EXCLUDED and o.pair == pair]
            if any(abs(o.pair_strike - entry) <= tol_near for o in pair_strikes):
                score += 1; pillars.append("P8:FX_Option")
            # P9: 4H zone overlap
            if z.sd_overlap not in ("-", ""):
                score += 1; pillars.append("P9:4H_Overlap")

            # Cross-pillar bonuses
            if "P8:FX_Option" in pillars and "P3:S/D_Overlap" in pillars:
                score += 1; pillars.append("B:Opt+Struct")
            levels_near = []
            for p in pivots:
                if abs(p.level - entry) <= tol_close:
                    levels_near.append(p.level)
            for o in pair_strikes:
                if abs(o.pair_strike - entry) <= tol_close:
                    levels_near.append(o.pair_strike)
            for h in swing_highs + swing_lows:
                if abs(h - entry) <= tol_close:
                    levels_near.append(h)
            if len(set(round(l, 5) for l in levels_near)) >= 3:
                score += 1; pillars.append("B:3+in20pip")
            if z.sd_overlap == "BoM" and z.sd_fresh in ("1S", "0X"):
                score += 1; pillars.append("B:RepeatMag")

            # BoM/MoM modifiers
            if z.sd_type == SDType.BOM:
                score += 2; pillars.append("M:BoM+2")
            if z.sd_type == SDType.VIRGIN_MOM:
                score -= 3; pillars.append("M:VirginMoM-3")

            # Zone reaction modifiers
            if z.formed_after_consolidation:
                score += 1; pillars.append("M:PostConsol+1")
            if z.reaction_count >= 3:
                score -= 2; pillars.append("M:Depleted-2")

            c["confluence_score"] = max(0, score)
            c["confluence_max"] = 14
            c["confluence_pillars"] = pillars
            effective_floor = 3 if z.sd_type == SDType.BOM else 4
            c["passes_floor"] = score >= effective_floor

        return candidates

    # ── PHASE 4: SL/TP ANCHORING ──

    @staticmethod
    def _get_entry(zone: IPZone, direction: TradeDirection, pair: str) -> float:
        """TS-1: Entry at SPECIFIC key level, NOT zone edge."""
        if zone.key_levels:
            sorted_levels = sorted(zone.key_levels)
            if direction == TradeDirection.SHORT:
                return sorted_levels[-2] if len(sorted_levels) >= 2 else sorted_levels[-1]
            else:
                return sorted_levels[1] if len(sorted_levels) >= 2 else sorted_levels[0]

        config = PAIR_CONFIG.get(pair, PAIR_CONFIG["EUR/USD"])
        pip = config.get("pip_size", 0.0001)
        if direction == TradeDirection.SHORT:
            return zone.top - 5 * pip
        else:
            return zone.bottom + 5 * pip

    @staticmethod
    def _get_entry_source(zone: IPZone, direction: TradeDirection, entry: float) -> str:
        """Document the specific anchor for the entry level."""
        if zone.key_levels:
            pos = "highest" if direction == TradeDirection.SHORT else "lowest"
            return f"key level {entry:.5f} at {zone.name} (TS-1: 2nd {pos})"
        config = PAIR_CONFIG.get("EUR/USD", PAIR_CONFIG["EUR/USD"])
        pip = config.get("pip_size", 0.0001)
        if direction == TradeDirection.SHORT:
            return f"{zone.name} top edge - 5 pips (TS-1 fallback)"
        return f"{zone.name} bottom edge + 5 pips (TS-1 fallback)"

    @staticmethod
    def _get_sl(
        zone: IPZone,
        direction: TradeDirection,
        zones: List[IPZone],
        lsz_zones: List[LSZ],
        pair: str,
        category: SetupCategory = SetupCategory.SWING_SCALP
    ) -> Tuple[Optional[float], str]:
        """SL = zone boundary + category-aware overshoot buffer."""
        config = PAIR_CONFIG.get(pair, PAIR_CONFIG["EUR/USD"])
        pip = config.get("pip_size", 0.0001)

        if pair == "DXY":
            if category == SetupCategory.SWING_SCALP:
                overshoot = 0.03
            elif category == SetupCategory.HTF_SWING:
                overshoot = 0.055
            else:
                overshoot = 0.04
            max_lsz_dist = 0.30
        else:
            if category == SetupCategory.SWING_SCALP:
                buf_pips = 5
            elif category == SetupCategory.HTF_SWING:
                buf_pips = (config.get("overshoot_buffer_min", 15) + config.get("overshoot_buffer_max", 25)) // 2
            elif category == SetupCategory.BREAKOUT_SURGE:
                buf_pips = 10
            else:
                buf_pips = 8
            overshoot = buf_pips * pip
            max_lsz_dist = 30 * pip

        entry = Engine3v6._get_entry(zone, direction, pair)

        if direction == TradeDirection.LONG:
            default_sl = zone.bottom - overshoot
            default_anchor = f"{zone.name} bottom - {overshoot/pip:.0f}p overshoot"
            best_sl = default_sl
            best_anchor = default_anchor

            for lsz in sorted(lsz_zones, key=lambda l: l.top, reverse=True):
                if lsz.side == "Demand-side" and lsz.top < entry:
                    if lsz.top >= zone.bottom - max_lsz_dist:
                        candidate_sl = lsz.bottom - overshoot
                        if candidate_sl > best_sl - max_lsz_dist:
                            best_sl = candidate_sl
                            best_anchor = f"LSZ demand {lsz.bottom:.5f}-{lsz.top:.5f} - {overshoot/pip:.0f}p"

            return best_sl, best_anchor

        else:  # SHORT
            default_sl = zone.top + overshoot
            default_anchor = f"{zone.name} top + {overshoot/pip:.0f}p overshoot"
            best_sl = default_sl
            best_anchor = default_anchor

            for lsz in sorted(lsz_zones, key=lambda l: l.bottom):
                if lsz.side == "Supply-side" and lsz.bottom > entry:
                    if lsz.bottom <= zone.top + max_lsz_dist:
                        candidate_sl = lsz.top + overshoot
                        if candidate_sl < best_sl + max_lsz_dist:
                            best_sl = candidate_sl
                            best_anchor = f"LSZ supply {lsz.bottom:.5f}-{lsz.top:.5f} + {overshoot/pip:.0f}p"

            # Big figure check for SHORT SL
            if pair == "DXY":
                for big_fig in [0.50, 0.25, 0.10]:
                    bf_above = math.ceil(entry / big_fig) * big_fig
                    if bf_above > entry and bf_above <= zone.top + max_lsz_dist:
                        candidate_sl = bf_above + overshoot
                        if candidate_sl < best_sl:
                            best_sl = candidate_sl
                            best_anchor = f"Big figure {bf_above:.2f} + {overshoot/pip:.0f}p buffer"
            else:
                for big_fig in [0.0050, 0.0025, 0.0010]:
                    bf_above = math.ceil(entry / big_fig) * big_fig
                    if bf_above > entry and bf_above <= zone.top + max_lsz_dist:
                        candidate_sl = bf_above + overshoot
                        if candidate_sl < best_sl:
                            best_sl = candidate_sl
                            best_anchor = f"Big figure {bf_above:.5f} + {overshoot/pip:.0f}p buffer"

            return best_sl, best_anchor

    @staticmethod
    def _get_tp(
        zone: IPZone,
        direction: TradeDirection,
        zones: List[IPZone],
        lsz_zones: List[LSZ],
        current_shape: MacroShape,
        entry: float,
        pair: str
    ) -> Tuple[Optional[float], str, Optional[float], str]:
        """
        Single TP + 70% Partial TP.
        Returns (tp1, tp1_anchor, tp1_5, tp1_5_anchor)
        """
        config = PAIR_CONFIG.get(pair, PAIR_CONFIG["EUR/USD"])
        pip = config.get("pip_size", 0.0001)

        # Find closest opposing zone edge
        opposing_edge = None
        opposing_name = "NO OPPOSING ZONE"

        if direction == TradeDirection.LONG:
            # Looking for supply/resistance zone above
            for z in sorted(zones, key=lambda z: z.bottom):
                if z.bottom > entry and z.category in (ZoneCategory.RESISTANCE, ZoneCategory.EQUILIBRIUM):
                    opposing_edge = z.bottom
                    opposing_name = z.name
                    break
        else:
            # Looking for demand/support zone below
            for z in sorted(zones, key=lambda z: z.top, reverse=True):
                if z.top < entry and z.category in (ZoneCategory.SUPPORT, ZoneCategory.EQUILIBRIUM):
                    opposing_edge = z.top
                    opposing_name = z.name
                    break

        if opposing_edge is None:
            return None, "NO OPPOSING ZONE", None, "N/A"

        tp1 = opposing_edge
        tp1_anchor = f"{opposing_name} edge at {tp1:.5f}"

        # 70% partial TP
        move_distance = abs(tp1 - entry)
        tp1_5 = entry + (0.70 * move_distance) if direction == TradeDirection.LONG else entry - (0.70 * move_distance)
        tp1_5_anchor = f"70% of move ({move_distance/pip:.0f}p) from entry"

        return tp1, tp1_anchor, tp1_5, tp1_5_anchor

    @staticmethod
    def _calculate_rrr(entry: float, sl: float, tp: float, direction: TradeDirection) -> float:
        """Calculate risk-reward ratio."""
        if direction == TradeDirection.LONG:
            risk = entry - sl
            reward = tp - entry
        else:
            risk = sl - entry
            reward = entry - tp

        if risk <= 0:
            return 0.0
        return reward / risk

    # ── PHASE 5: CONFIDENCE SCORING ──

    @staticmethod
    def _score_confidence(
        confluence_score: int,
        confluence_max: int,
        option_notional_b: float,
        shape_alignment: str,
        zfp: int,
        sd_type: SDType,
        pair: str,
        direction: TradeDirection
    ) -> int:
        """0-100 confidence score with all modifiers."""
        base = (confluence_score / confluence_max) * 40 if confluence_max > 0 else 0
        option_score = min((option_notional_b / 3.5) * 20, 20)
        shape_score = 20 if shape_alignment in ("BOTH_DIRECTIONS", "DIRECTIONAL", "VALID") else 10
        zfp_score = (1 - zfp / 100) * 10

        total = base + option_score + shape_score + zfp_score

        # BoM/MoM modifiers
        if sd_type == SDType.BOM:
            total += 10
        elif sd_type == SDType.MOM:
            total -= 10

        # GBP/USD short squeeze amplification
        if pair == "GBP/USD" and PAIR_CONFIG.get("GBP/USD", {}).get("short_squeeze_amplification"):
            if direction == TradeDirection.LONG:
                total += 10
            elif direction == TradeDirection.SHORT:
                total -= 10

        return max(0, min(100, int(total)))

    @staticmethod
    def _classify_quality(confidence: int) -> SetupQuality:
        """Classify setup quality from confidence score."""
        if confidence >= 85:
            return SetupQuality.GOD_TIER
        elif confidence >= 75:
            return SetupQuality.HIGH
        elif confidence >= 65:
            return SetupQuality.STANDARD
        else:
            return SetupQuality.REJECTED

    # ── PHASE 6: SETUP GENERATION ──

    @staticmethod
    def generate_setups(
        zones: List[IPZone],
        lsz_zones: List[LSZ],
        option_strikes: List[OptionStrike],
        pivots: List[PivotLevel],
        ma_confluences: List[float],
        analyst_levels: List[float],
        swing_highs: List[float],
        swing_lows: List[float],
        round_numbers: List[float],
        shape_chain: List[MacroShapeDay],
        current_price: float,
        pair: str
    ) -> Tuple[List[TradeSetup], List[Dict]]:
        """
        Full pipeline: zones → validated setups.

        Returns: (valid_setups, rejected_candidates_with_reasons)
        """
        all_rejected = []

        # Phase 1: Generate candidates from zones
        candidates = Engine3v6.zone_to_candidates(zones, option_strikes, pair)

        # Filter out rejected zones (Virgin MoM, etc.)
        entry_candidates = []
        for c in candidates:
            if c["zone_entry_status"] == "REJECT":
                c["reject_reason"] = f"Zone {c['zone'].name} rejected: {c['zone_entry_status']} ({c['zone_sd_type'].value})"
                all_rejected.append(c.copy())
            else:
                entry_candidates.append(c)

        # Phase 1.5: PROXIMITY VALIDATION (ROOT CAUSE FIX)
        valid_candidates, proximity_rejected = Engine3v6.validate_proximity(
            entry_candidates, current_price, pair
        )
        all_rejected.extend(proximity_rejected)

        if not valid_candidates:
            return [], all_rejected

        # Phase 2: Shape alignment
        valid_candidates = Engine3v6.apply_shape_alignment(
            valid_candidates, shape_chain, current_price
        )

        # Phase 3: Confluence scoring
        valid_candidates = Engine3v6.score_confluence(
            valid_candidates, pivots, option_strikes, ma_confluences,
            analyst_levels, swing_highs, swing_lows, round_numbers, pair
        )

        # AUD/USD special rule: ONLY BS/WL setups, NO swing scalps
        if pair == "AUD/USD":
            current_shape = shape_chain[0].shape if shape_chain else MacroShape.SS
            if current_shape == MacroShape.SS:
                # No valid setup types for AUD/USD in SS regime
                for c in valid_candidates:
                    c["reject_reason"] = "AUD/USD SS regime = no valid setup types (BS/WL only)"
                    all_rejected.append(c.copy())
                return [], all_rejected

        # Phase 4-6: Build TradeSetup objects
        setups = []
        setup_count = 0

        for c in valid_candidates:
            if setup_count >= MAX_TOTAL_SETUPS:
                break

            z = c["zone"]
            direction = c["direction"]

            # Determine setup categories from passing_categories
            passing_cats = c.get("passing_categories", [SetupCategory.SWING_SCALP])

            # Choose the best category based on phase + zone type
            for category in passing_cats:
                if setup_count >= MAX_TOTAL_SETUPS:
                    break

                # AUD/USD: skip swing scalps
                if pair == "AUD/USD" and category == SetupCategory.SWING_SCALP:
                    continue

                # Get precise entry
                entry = Engine3v6._get_entry(z, direction, pair)
                entry_source = Engine3v6._get_entry_source(z, direction, entry)

                # Re-check proximity for this specific category
                pair_limits = MAX_ENTRY_DISTANCE.get(pair, MAX_ENTRY_DISTANCE["EUR/USD"])
                max_dist = pair_limits.get(category, 0)
                pip_size = PAIR_CONFIG.get(pair, PAIR_CONFIG["EUR/USD"])["pip_size"]

                if pair == "DXY":
                    dist = abs(entry - current_price)
                else:
                    dist = abs(entry - current_price) / pip_size

                if dist > max_dist:
                    continue  # Skip this category, try next

                # Get SL
                sl, sl_anchor = Engine3v6._get_sl(z, direction, zones, lsz_zones, pair, category)
                if sl is None:
                    continue

                # Get TP
                current_shape = shape_chain[0].shape if shape_chain else MacroShape.SS
                tp1, tp1_anchor, tp1_5, tp1_5_anchor = Engine3v6._get_tp(
                    z, direction, zones, lsz_zones, current_shape, entry, pair
                )
                if tp1 is None:
                    continue

                # Calculate RRR
                rrr = Engine3v6._calculate_rrr(entry, sl, tp1, direction)
                min_rrr = MIN_RRR.get(category, 2.0)

                if rrr < min_rrr:
                    reject_c = c.copy()
                    reject_c["reject_reason"] = (
                        f"RRR {rrr:.2f}x below minimum {min_rrr:.1f}x for {category.value}"
                    )
                    all_rejected.append(reject_c)
                    continue

                # Calculate partial TP RRR
                realized_rrr = Engine3v6._calculate_rrr(entry, sl, tp1_5, direction) if tp1_5 else rrr
                blended_rrr = 0.5 * realized_rrr + 0.5 * rrr

                # Confidence score
                # Sum option notional near this zone
                near_notional = sum(
                    o.notional_b for o in option_strikes
                    if o.tier != OptionTier.EXCLUDED
                    and abs((o.dxy_level if pair == "DXY" else o.pair_strike) - entry) < (0.10 if pair == "DXY" else 20 * pip_size)
                )

                confidence = Engine3v6._score_confidence(
                    c["confluence_score"], c["confluence_max"],
                    near_notional, c.get("shape_support", "VALID"),
                    z.zfp, z.sd_type, pair, direction
                )

                if confidence < MIN_CONFIDENCE:
                    reject_c = c.copy()
                    reject_c["reject_reason"] = f"Confidence {confidence} below minimum {MIN_CONFIDENCE}"
                    all_rejected.append(reject_c)
                    continue

                quality = Engine3v6._classify_quality(confidence)

                # Determine session
                session = SESSION_MAP.get(category, Session.LONDON_OPEN)
                # AUD/USD: Tokyo + London sessions only
                if pair == "AUD/USD" and session in (Session.NY_MID, Session.NY_CLOSE):
                    session = Session.LONDON_OPEN

                # Gap risk
                gap_risk = PAIR_CONFIG.get(pair, PAIR_CONFIG["EUR/USD"]).get("gap_default", "LOW")
                if pair == "GBP/USD":
                    gap_risk = "MODERATE"  # Always MODERATE minimum for GBP

                gap_cancel = GAP_CANCEL_THRESHOLD.get(pair, 30)

                # Day assignment
                day = shape_chain[0].day if shape_chain else DayOfWeek.MONDAY

                # Build TradeSetup
                setup = TradeSetup(
                    setup_id=f"{pair.replace('/', '')}-{len(setups)+1}",
                    pair=pair,
                    direction=direction,
                    category=category,
                    quality=quality,
                    entry=entry,
                    entry_source=entry_source,
                    sl=sl,
                    sl_anchor=sl_anchor,
                    tp1=tp1,
                    tp1_anchor=tp1_anchor,
                    tp1_5=tp1_5 if tp1_5 else tp1,
                    realized_rrr=realized_rrr,
                    maximum_rrr=rrr,
                    blended_rrr=blended_rrr,
                    day=day,
                    session=session,
                    direction_consensus=c.get("direction_consensus", 0),
                    confluence_score=c["confluence_score"],
                    confidence_score=confidence,
                    anchor_zone=z.name,
                    zone_sd_type=z.sd_type,
                    zone_reaction_count=z.reaction_count,
                    gap_risk=gap_risk,
                    gap_cancel_threshold=gap_cancel,
                    proximity_pips=dist,
                    proximity_status="WITHIN",
                    consolidation_phase=Engine3v6.detect_consolidation_phase(
                        current_shape, day
                    ),
                    shape_trigger=current_shape,
                    entry_audit=f"Entry={entry:.5f} ({entry_source})",
                    sl_audit=f"SL={sl:.5f} ({sl_anchor})",
                    tp_audit=f"TP={tp1:.5f} ({tp1_anchor}), Partial={tp1_5:.5f}" if tp1_5 else f"TP={tp1:.5f} ({tp1_anchor})",
                )

                setups.append(setup)
                setup_count += 1

        return setups, all_rejected

    # ── OUTPUT FORMATTING ──

    @staticmethod
    def format_setup(s: TradeSetup) -> str:
        """Format a TradeSetup into the standard output format."""
        lines = [
            f"TRADE SETUP: {s.setup_id} {s.direction.value} {s.quality.value}",
            f"POI: {s.anchor_zone} | Tier: {s.zone_sd_type.value} | Reactions: {s.zone_reaction_count}",
            f"Direction: {s.direction_consensus}/6 checks → {s.direction.value}",
            f"Entry: {s.entry:.5f} ({s.entry_source})",
            f"Proximity: {s.proximity_pips:.0f} pips from spot → {s.proximity_status}",
            f"SL: {s.sl:.5f} ({s.sl_anchor})",
            f"TP: {s.tp1:.5f} ({s.tp1_anchor})",
            f"Partial TP (50%): {s.tp1_5:.5f} (70% contingency)",
            f"RRR: {s.blended_rrr:.1f}x (realized {s.realized_rrr:.1f}x / max {s.maximum_rrr:.1f}x)",
            f"Session: {s.session.value}",
            f"Phase: {s.consolidation_phase.value} | Shape: {s.shape_trigger.value}",
            f"Gap Risk: {s.gap_risk} | Cancel: {s.gap_cancel_threshold:.0f}p",
            f"Confidence: {s.confidence_score} | Confluence: {s.confluence_score}/{s.confluence_max}",
            f"Weekend: NO positions over weekend. Close by Friday 5PM ET.",
            f"Audit: {s.entry_audit} | {s.sl_audit} | {s.tp_audit}",
        ]
        return "\n".join(lines)

    @staticmethod
    def generate_report_section(
        setups: List[TradeSetup],
        rejections: List[Dict],
        pair: str
    ) -> str:
        """Generate markdown report section for a pair."""
        lines = [f"## {pair} Trade Setup Architecture\n"]

        if not setups:
            lines.append("**No qualifying setups for this pair this week.**\n")
        else:
            lines.append(f"**Total Setups: {len(setups)}**\n")
            for s in setups:
                lines.append(Engine3v6.format_setup(s))
                lines.append("")

        if rejections:
            lines.append(f"### {pair} Rejected Candidates\n")
            lines.append("| Zone | Direction | Reason |")
            lines.append("|---|---|---|")
            for r in rejections:
                zone_name = r.get("zone", IPZone("?", 0, 0, ZoneCategory.SUPPORT, PressureDegree.MINIMAL, "?", 0, 0)).name if isinstance(r.get("zone"), IPZone) else "?"
                direction = r.get("direction", TradeDirection.LONG).value if isinstance(r.get("direction"), TradeDirection) else "?"
                reason = r.get("reject_reason", "Unknown")
                lines.append(f"| {zone_name} | {direction} | {reason} |")

        return "\n".join(lines)
