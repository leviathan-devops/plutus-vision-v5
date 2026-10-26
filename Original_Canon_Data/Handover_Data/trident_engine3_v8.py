#!/usr/bin/env python3
"""
=====================================================================
TRIDENT ENGINE 3 v8.0.0 — SNIPER ENTRY ARCHITECTURE
=====================================================================

v8.0.0 THE #1 FIX: SNIPER ENTRIES + TIGHT SLs

PROBLEM: v6-v7 entries were at "2nd key level" (mid-zone or far edge)
with 20-50 pip buffers, creating 150-300+ pip SLs and destroying RRR.

User's actual trading: 95% SL < 150 pips, 60-70% SL < 100 pips, RRR 3-6x.

FIX 1: SNIPER ENTRY = zone edge CLOSEST to approaching price
  - SHORT from supply: Enter at BOTTOM edge of supply zone
  - LONG from demand: Enter at TOP edge of demand zone
  - This minimizes SL distance while maintaining structural safety

FIX 2: TIGHT SL = opposing zone edge + small buffer
  - For SHORT: SL = supply zone TOP + tight buffer
  - For LONG: SL = demand zone BOTTOM - tight buffer
  - Buffers: 10-15 pips (was 20-50 pips)

FIX 3: SL DISTANCE VALIDATION
  - SL > 150 pips (non-GBP) or > 180 pips (GBP): REJECT or DOWNGRADE
  - SL > 100 pips: -10 confidence penalty
  - Target: most setups should have SL < 100 pips

FIX 4: DXY→PAIR CASCADE (from v7, retained)
  - Each DXY setup generates corresponding pair setups
  - +10 confidence bonus for DXY-aligned direction
  - Uses PAIR's own price levels

FIX 5: CONTEXT-AWARE RRR (from v7, retained)
  - Consolidation weeks get lower RRR floors

TARGET: 4-8 setups per pair per week, 90%+ win rate
DATA SOURCE: TradingView price action + 9-Pillar IP zone pipeline

=====================================================================
"""

import math
from dataclasses import dataclass, field
from typing import Optional, List, Tuple, Dict
from enum import Enum


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
    CONDITIONAL = "Conditional"
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
    top: float
    bottom: float
    side: str
    priority: str = "STANDARD"
    source: str = ""
    thickness: str = "THICK"

@dataclass
class OptionStrike:
    dxy_level: float
    pair: str
    pair_strike: float
    notional_b: float
    day: str
    tier: OptionTier = OptionTier.EXCLUDED

@dataclass
class PivotLevel:
    level: float
    pivot_type: str
    label: str

@dataclass
class MacroShapeDay:
    day: DayOfWeek
    shape: MacroShape
    confidence: int
    zfp_condition: str

@dataclass
class TradeSetup:
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
    tp1_5: float  # 70% partial TP
    tp2: float = 0.0
    tp2_anchor: str = ""
    realized_rrr: float = 0.0
    maximum_rrr: float = 0.0
    blended_rrr: float = 0.0
    day: DayOfWeek = DayOfWeek.MONDAY
    session: Session = Session.LONDON_OPEN
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
    parent_setup_id: str = ""
    rocket_type: str = ""
    cascade_source: str = ""  # "native" or "dxy-cascade"
    sl_distance_pips: float = 0.0  # v8: total SL distance
    entry_edge: str = ""  # v8: "top" or "bottom" of zone


# =================================================================
# CONFIGURATION (v8: SNIPER BUFFERS + SL VALIDATION)
# =================================================================

PAIR_CONFIG = {
    "DXY": {"pip_size": 0.01, "gap_default": "LOW"},
    "EUR/USD": {"pip_size": 0.0001, "gap_default": "MODERATE", "pair_role": "primary_swing", "session_focus": "NY"},
    "GBP/USD": {"pip_size": 0.0001, "gap_default": "MODERATE", "pair_role": "primary_scalp", "session_focus": "LONDON", "short_squeeze_amplification": True},
    "AUD/USD": {"pip_size": 0.0001, "gap_default": "LOW", "pair_role": "secondary_swing", "session_focus": "LONDON"},
}

MAX_ENTRY_DISTANCE = {
    "DXY": {SetupCategory.SWING_SCALP: 0.30, SetupCategory.HTF_SWING: 0.50, SetupCategory.BREAKOUT_SURGE: 0.40, SetupCategory.REINFORCEMENT: 0.40, SetupCategory.TRANSITION: 0.40},
    "EUR/USD": {SetupCategory.SWING_SCALP: 50, SetupCategory.HTF_SWING: 80, SetupCategory.BREAKOUT_SURGE: 60, SetupCategory.REINFORCEMENT: 60, SetupCategory.TRANSITION: 60},
    "GBP/USD": {SetupCategory.SWING_SCALP: 80, SetupCategory.HTF_SWING: 120, SetupCategory.BREAKOUT_SURGE: 100, SetupCategory.REINFORCEMENT: 100, SetupCategory.TRANSITION: 100},
    "AUD/USD": {SetupCategory.SWING_SCALP: 50, SetupCategory.HTF_SWING: 80, SetupCategory.BREAKOUT_SURGE: 60, SetupCategory.REINFORCEMENT: 60, SetupCategory.TRANSITION: 60},
}

SS_PROXIMITY_FACTOR = 0.60

# v8: TIGHT SNIPER BUFFERS (was 20-50 pips, now 8-20 pips)
SNIPER_BUFFER = {
    "DXY": {
        SetupCategory.SWING_SCALP: 0.03,    # ~3 pips
        SetupCategory.BREAKOUT_SURGE: 0.04,  # ~4 pips
        SetupCategory.HTF_SWING: 0.05,       # ~5 pips
        SetupCategory.REINFORCEMENT: 0.025,  # ~2.5 pips
        SetupCategory.TRANSITION: 0.04,
    },
    "EUR/USD": {
        SetupCategory.SWING_SCALP: 10,       # 10 pips (was 20)
        SetupCategory.BREAKOUT_SURGE: 12,     # 12 pips (was 32)
        SetupCategory.HTF_SWING: 15,          # 15 pips (was 40)
        SetupCategory.REINFORCEMENT: 8,       # 8 pips (was 20)
        SetupCategory.TRANSITION: 12,
    },
    "GBP/USD": {
        SetupCategory.SWING_SCALP: 15,        # 15 pips (was 25)
        SetupCategory.BREAKOUT_SURGE: 18,     # 18 pips (was 40)
        SetupCategory.HTF_SWING: 20,           # 20 pips (was 50)
        SetupCategory.REINFORCEMENT: 12,       # 12 pips (was 35)
        SetupCategory.TRANSITION: 18,
    },
    "AUD/USD": {
        SetupCategory.SWING_SCALP: 10,
        SetupCategory.BREAKOUT_SURGE: 12,
        SetupCategory.HTF_SWING: 15,
        SetupCategory.REINFORCEMENT: 8,
        SetupCategory.TRANSITION: 12,
    },
}

# v8: SL DISTANCE VALIDATION THRESHOLDS (in pips)
SL_MAX_HARD = {"DXY": 50, "EUR/USD": 150, "GBP/USD": 180, "AUD/USD": 150}
SL_MAX_PENALTY = {"DXY": 30, "EUR/USD": 100, "GBP/USD": 120, "AUD/USD": 100}

# Normal RRR floors
MIN_RRR_TP1 = {
    SetupCategory.SWING_SCALP: 1.5,
    SetupCategory.BREAKOUT_SURGE: 2.0,
    SetupCategory.HTF_SWING: 2.0,
    SetupCategory.REINFORCEMENT: 1.5,
    SetupCategory.TRANSITION: 2.0,
}

MIN_RRR_BLENDED = {
    SetupCategory.SWING_SCALP: 2.0,
    SetupCategory.BREAKOUT_SURGE: 2.5,
    SetupCategory.HTF_SWING: 3.0,
    SetupCategory.REINFORCEMENT: 2.0,
    SetupCategory.TRANSITION: 3.0,
}

# Consolidation RRR floors
CONSOL_RRR_TP1 = {
    SetupCategory.SWING_SCALP: 1.2,
    SetupCategory.BREAKOUT_SURGE: 1.5,
    SetupCategory.HTF_SWING: 1.5,
    SetupCategory.REINFORCEMENT: 1.2,
    SetupCategory.TRANSITION: 1.5,
}

CONSOL_RRR_BLENDED = {
    SetupCategory.SWING_SCALP: 1.5,
    SetupCategory.BREAKOUT_SURGE: 2.0,
    SetupCategory.HTF_SWING: 2.0,
    SetupCategory.REINFORCEMENT: 1.5,
    SetupCategory.TRANSITION: 2.0,
}

CONSOL_RANGE_THRESHOLD = {"DXY": 80, "EUR/USD": 150, "GBP/USD": 200, "AUD/USD": 120}

SESSION_MAP = {
    SetupCategory.SWING_SCALP: Session.LONDON_OPEN,
    SetupCategory.BREAKOUT_SURGE: Session.NY_OVERLAP,
    SetupCategory.HTF_SWING: Session.NY_MID,
    SetupCategory.REINFORCEMENT: Session.NY_OPEN,
    SetupCategory.TRANSITION: Session.NY_OVERLAP,
}

GAP_CANCEL_THRESHOLD = {"DXY": 0.15, "EUR/USD": 20, "GBP/USD": 15, "AUD/USD": 30}

MIN_CONFIDENCE_PRIMARY = 60
MIN_CONFIDENCE_CONDITIONAL = 50

MAX_SETUPS_PER_PAIR = 10
MAX_TOTAL_SETUPS = 40
MAX_REINFORCEMENTS_PER_SWING = 2

DXY_CASCADE_PAIRS = ["EUR/USD", "GBP/USD", "AUD/USD"]
DXY_CASCADE_CONFIDENCE_BONUS = 10

# v8.1: GU cascade tuning — MoM + short squeeze combo override
# When DXY aligns with GU direction, the short squeeze risk is mitigated
# because DXY is the primary directional signal
GU_CASCADE_SHORT_SQUEEZE_OVERRIDE = True  # Remove SHORT penalty for cascade setups
GU_MOM_SHORT_DOUBLE_PENALTY_FIX = True    # Don't double-penalize MoM + SHORT on GU

SHAPE_CATEGORIES = {
    MacroShape.SS: [SetupCategory.SWING_SCALP],
    MacroShape.SS_DWL: [SetupCategory.SWING_SCALP],
    MacroShape.BS: [SetupCategory.HTF_SWING, SetupCategory.BREAKOUT_SURGE],
    MacroShape.WL: [SetupCategory.HTF_SWING],
    MacroShape.RWL: [SetupCategory.HTF_SWING, SetupCategory.BREAKOUT_SURGE],
    MacroShape.WLS: [SetupCategory.SWING_SCALP, SetupCategory.HTF_SWING],
    MacroShape.R: [SetupCategory.REINFORCEMENT, SetupCategory.SWING_SCALP],
}


# =================================================================
# DXY→PAIR CASCADE MAPPER
# =================================================================

class DXYCascadeMapper:
    INVERSE_CORRELATION = {"EUR/USD": True, "GBP/USD": True, "AUD/USD": True}

    @staticmethod
    def get_pair_direction(dxy_direction, pair):
        if DXYCascadeMapper.INVERSE_CORRELATION.get(pair, True):
            return TradeDirection.LONG if dxy_direction == TradeDirection.SHORT else TradeDirection.SHORT
        return dxy_direction

    @staticmethod
    def cascade_dxy_setup(dxy_setup, pair_data, categories=None):
        """
        v8.1: CASCADE GENERATES MULTIPLE SETUPS per DXY setup per pair.
        Instead of picking only the best zone, try ALL valid zones.
        Allow multiple categories per cascade (not just dxy_setup.category).

        Returns a LIST of TradeSetup objects (was single setup or None).
        """
        pair = pair_data["pair"]
        pair_zones = pair_data["zones"]
        pair_lsz = pair_data["lsz_zones"]
        pair_options = pair_data["option_strikes"]
        pair_price = pair_data["current_price"]
        pip_size = PAIR_CONFIG.get(pair, PAIR_CONFIG["EUR/USD"])["pip_size"]

        # v8.1: Allow multiple categories per cascade
        if categories is None:
            categories = [dxy_setup.category]
            # Also add compatible categories for this shape
            shape_cats = SHAPE_CATEGORIES.get(dxy_setup.shape_trigger, [])
            for cat in shape_cats:
                if cat not in categories:
                    categories.append(cat)

        # AUD/USD: filter out swing scalps
        if pair == "AUD/USD":
            categories = [c for c in categories if c in (SetupCategory.HTF_SWING, SetupCategory.BREAKOUT_SURGE)]
            if not categories:
                return []

        pair_direction = DXYCascadeMapper.get_pair_direction(dxy_setup.direction, pair)

        if pair_direction == TradeDirection.LONG:
            matching_zones = [z for z in pair_zones if z.category in (ZoneCategory.SUPPORT, ZoneCategory.EQUILIBRIUM)]
        else:
            matching_zones = [z for z in pair_zones if z.category in (ZoneCategory.RESISTANCE, ZoneCategory.EQUILIBRIUM)]

        if not matching_zones:
            return []

        # v8.1: Process ALL valid zones, not just the best one
        results = []
        for z in matching_zones:
            zone_status = Engine3v8.classify_zone_entry_status(z)
            if zone_status == "REJECT":
                continue

            for category in categories:
                max_dist = MAX_ENTRY_DISTANCE.get(pair, MAX_ENTRY_DISTANCE["EUR/USD"]).get(category, 999999)
                if dxy_setup.shape_trigger in (MacroShape.SS, MacroShape.SS_DWL):
                    max_dist *= SS_PROXIMITY_FACTOR

                entry = Engine3v8._get_sniper_entry(z, pair_direction, pair)
                dist = abs(entry - pair_price)
                if pair != "DXY":
                    dist = dist / pip_size
                if dist > max_dist:
                    continue

                sl, sl_anchor = Engine3v8._get_sniper_sl(z, pair_direction, pair_zones, pair_lsz, pair, category)
                tp1, tp1_anchor, tp1_5, tp1_5_anchor, tp2, tp2_anchor = Engine3v8._get_tp(
                    z, pair_direction, pair_zones, entry, pair, category)

                if tp1 is None or sl is None:
                    continue

                # SL distance validation
                sl_distance = abs(entry - sl) / pip_size if pair != "DXY" else abs(entry - sl) / PAIR_CONFIG["DXY"]["pip_size"]
                sl_max = SL_MAX_HARD.get(pair, 150)
                if sl_distance > sl_max:
                    continue

                rrr_tp1 = Engine3v8._calculate_rrr(entry, sl, tp1, pair_direction)
                is_consolidation = pair_data.get("weekly_range_pips", 999) < CONSOL_RANGE_THRESHOLD.get(pair, 150)
                min_rrr_tp1 = (CONSOL_RRR_TP1 if is_consolidation else MIN_RRR_TP1).get(category, 1.5)

                if rrr_tp1 < min_rrr_tp1:
                    continue

                if tp2 and tp2 > 0:
                    rrr_tp2 = Engine3v8._calculate_rrr(entry, sl, tp2, pair_direction)
                    blended_rrr = 0.5 * rrr_tp1 + 0.5 * rrr_tp2
                    max_rrr = rrr_tp2
                else:
                    rrr_tp2 = 0
                    blended_rrr = rrr_tp1
                    max_rrr = rrr_tp1

                min_rrr_blended = (CONSOL_RRR_BLENDED if is_consolidation else MIN_RRR_BLENDED).get(category, 2.0)
                if blended_rrr < min_rrr_blended:
                    continue

                realized_rrr = Engine3v8._calculate_rrr(entry, sl, tp1_5, pair_direction) if tp1_5 else rrr_tp1

                near_notional = sum(
                    o.notional_b for o in pair_options
                    if o.tier != OptionTier.EXCLUDED and o.pair == pair
                    and abs(o.pair_strike - entry) < 20 * pip_size)

                shape_support = Engine3v8.get_shape_support(dxy_setup.shape_trigger)
                confidence = Engine3v8._score_confidence(
                    z.confluence, 14, near_notional,
                    shape_support, z.zfp, z.sd_type, pair, pair_direction)

                # SL distance penalty / sniper bonus
                sl_penalty_threshold = SL_MAX_PENALTY.get(pair, 100)
                if sl_distance > sl_penalty_threshold:
                    confidence -= 10
                elif sl_distance < 30:
                    confidence += 10  # Sniper bonus
                elif sl_distance < 60:
                    confidence += 5  # Good precision

                # DXY cascade confidence bonus
                confidence += DXY_CASCADE_CONFIDENCE_BONUS

                # v8.1: GU cascade short squeeze override
                # When DXY aligns with GU direction, short squeeze risk is mitigated
                # because DXY provides strong directional conviction
                if pair == "GBP/USD" and pair_direction == TradeDirection.SHORT and GU_CASCADE_SHORT_SQUEEZE_OVERRIDE:
                    confidence += 5  # Offset the short squeeze penalty for cascade setups

                confidence = min(100, max(0, confidence))

                quality = Engine3v8._classify_quality(confidence, zone_status)
                if quality == SetupQuality.REJECTED:
                    continue

                # Downgrade if SL too large
                if sl_distance > sl_max * 0.85:
                    quality = SetupQuality.CONDITIONAL

                pair_prefix = pair.split("/")[0] if "/" in pair else pair
                entry_edge = "top" if pair_direction == TradeDirection.LONG else "bottom"

                results.append(TradeSetup(
                    setup_id=f"{pair_prefix}-C{dxy_setup.setup_id}-{z.name[:3]}-{category.value[:3]}",
                    pair=pair, direction=pair_direction, category=category,
                    quality=quality,
                    entry=round(entry, 5),
                    entry_source=f"DXY cascade ({dxy_setup.direction.value} → {pair_direction.value} {pair}) sniper at {z.name}",
                    sl=round(sl, 5), sl_anchor=sl_anchor,
                    tp1=round(tp1, 5), tp1_anchor=tp1_anchor,
                    tp1_5=round(tp1_5, 5) if tp1_5 else 0.0,
                    tp2=round(tp2, 5) if tp2 else 0.0, tp2_anchor=tp2_anchor,
                    realized_rrr=round(realized_rrr, 2),
                    maximum_rrr=round(max_rrr, 2),
                    blended_rrr=round(blended_rrr, 2),
                    day=dxy_setup.day,
                    session=SESSION_MAP.get(category, Session.LONDON_OPEN),
                    confluence_score=z.confluence, confluence_max=14,
                    confidence_score=confidence,
                    anchor_zone=z.name,
                    zone_sd_type=z.sd_type,
                    zone_reaction_count=z.reaction_count,
                    gap_risk=PAIR_CONFIG.get(pair, PAIR_CONFIG["EUR/USD"]).get("gap_default", "LOW"),
                    gap_cancel_threshold=GAP_CANCEL_THRESHOLD.get(pair, 30),
                    proximity_pips=round(dist, 1),
                    proximity_status="WITHIN",
                    consolidation_phase=dxy_setup.consolidation_phase,
                    shape_trigger=dxy_setup.shape_trigger,
                    entry_audit=f"Sniper cascade: {entry_edge} edge of {z.name}",
                    sl_audit=f"SL={sl:.5f} ({sl_anchor}) | {sl_distance:.0f}p from entry",
                    tp_audit=f"TP1={tp1:.5f} ({tp1_anchor})" + (f" | TP2={tp2:.5f}" if tp2 else ""),
                    cascade_source="dxy-cascade",
                    sl_distance_pips=round(sl_distance, 1),
                    entry_edge=edge_name(pair_direction),
                ))

        return results


def edge_name(direction):
    """Return which zone edge the sniper entry is at."""
    return "top" if direction == TradeDirection.LONG else "bottom"


# =================================================================
# ENGINE 3 v8.0.0 — SNIPER ENTRY ARCHITECTURE
# =================================================================

class Engine3v8:
    """
    v8.0: Sniper Entry Architecture + Tight SLs + DXY Cascade.

    THE KEY CHANGE: Entry at zone edge closest to approaching price.
    - SHORT from supply: Enter at BOTTOM of supply zone
    - LONG from demand: Enter at TOP of demand zone
    This minimizes SL distance while maintaining structural safety.
    """

    @staticmethod
    def is_consolidation_week(weekly_range_pips, pair):
        return weekly_range_pips < CONSOL_RANGE_THRESHOLD.get(pair, 150)

    @staticmethod
    def detect_consolidation_phase(shape, day_of_week, range_compressing=False):
        if shape in (MacroShape.BS, MacroShape.WL, MacroShape.RWL):
            return ConsolidationPhase.DIRECTIONAL
        if shape == MacroShape.R:
            return ConsolidationPhase.RESOLUTION
        if shape in (MacroShape.SS, MacroShape.SS_DWL, MacroShape.WLS):
            if day_of_week in (DayOfWeek.MONDAY, DayOfWeek.TUESDAY):
                return ConsolidationPhase.EARLY
            if day_of_week == DayOfWeek.WEDNESDAY:
                return ConsolidationPhase.MID
            if day_of_week in (DayOfWeek.THURSDAY, DayOfWeek.FRIDAY):
                return ConsolidationPhase.LATE if range_compressing else ConsolidationPhase.MID
        return ConsolidationPhase.EARLY

    @staticmethod
    def classify_zone_entry_status(zone):
        if zone.sd_type == SDType.BOM:
            return "ENTRY-PRIMARY" if zone.reaction_count < 3 else "TP-TARGET"
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
    def zone_to_candidates(zones, option_strikes, pair):
        candidates = []
        for z in zones:
            z.engine3_status = Engine3v8.classify_zone_entry_status(z)
            zone_buffer = 0.05 if pair == "DXY" else 0.0005
            for o in option_strikes:
                if o.tier != OptionTier.EXCLUDED:
                    o_level = o.dxy_level if pair == "DXY" else o.pair_strike
                    if z.bottom - zone_buffer <= o_level <= z.top + zone_buffer:
                        if o_level not in z.key_levels:
                            z.key_levels.append(o_level)
                            z.key_levels.sort()
            if z.category == ZoneCategory.SUPPORT:
                directions = [TradeDirection.LONG]
            elif z.category == ZoneCategory.RESISTANCE:
                directions = [TradeDirection.SHORT]
            else:
                directions = [TradeDirection.LONG, TradeDirection.SHORT]
            for direction in directions:
                candidates.append({
                    "zone": z, "direction": direction, "pair": pair,
                    "is_hard_wall": z.zfp < 15 and z.confluence >= 8,
                    "zone_entry_status": z.engine3_status,
                    "zone_sd_type": z.sd_type,
                    "zone_reaction_count": z.reaction_count,
                })
        return candidates

    @staticmethod
    def validate_proximity(candidates, current_price, pair):
        valid, rejected = [], []
        pip_size = PAIR_CONFIG.get(pair, PAIR_CONFIG["EUR/USD"])["pip_size"]
        for c in candidates:
            z = c["zone"]
            direction = c["direction"]
            entry = Engine3v8._get_sniper_entry(z, direction, pair)
            distance = abs(entry - current_price)
            distance_pips = distance if pair == "DXY" else distance / pip_size
            c["entry_raw"] = entry
            c["proximity_pips"] = distance_pips
            pair_limits = MAX_ENTRY_DISTANCE.get(pair, MAX_ENTRY_DISTANCE["EUR/USD"])
            passing_categories = []
            for cat in SetupCategory:
                max_dist = pair_limits.get(cat, 999999)
                if (pair == "DXY" and distance <= max_dist) or (pair != "DXY" and distance_pips <= max_dist):
                    passing_categories.append(cat)
            c["passing_categories"] = passing_categories
            if not passing_categories:
                c["proximity_status"] = "BEYOND"
                c["reject_reason"] = f"Entry {entry:.5f} is {distance_pips:.0f}p from spot {current_price:.5f}. NOT actionable."
                rejected.append(c.copy())
            else:
                c["proximity_status"] = "WITHIN"
                valid.append(c)
        return valid, rejected

    @staticmethod
    def get_shape_support(shape):
        if shape in (MacroShape.SS, MacroShape.SS_DWL):
            return "BOTH_DIRECTIONS"
        elif shape == MacroShape.BS:
            return "DIRECTIONAL"
        else:
            return "VALID"

    @staticmethod
    def score_confluence(candidates, pivots, option_strikes, ma_confluences, analyst_levels, swing_highs, swing_lows, round_numbers, pair):
        """
        v8: Confluence scoring checks THE ENTIRE ZONE, not just the entry point.
        The zone is confluent if confluences exist anywhere within it.
        Entry-level proximity adds bonus but zone-level is the floor check.
        """
        pip_size = PAIR_CONFIG.get(pair, PAIR_CONFIG["EUR/USD"])["pip_size"]
        if pair == "DXY":
            tol_near, tol_close, tol_analyst, tol_swing, tol_round = 0.10, 0.20, 0.15, 0.15, 0.05
        else:
            tol_near, tol_close = 10*pip_size, 20*pip_size
            tol_analyst, tol_swing, tol_round = 15*pip_size, 15*pip_size, 5*pip_size

        for c in candidates:
            z = c["zone"]
            # v8: Check confluence at BOTH entry AND zone center + key levels
            # This ensures sniper entries at zone edges get credit for zone-level confluence
            entry = c.get("entry_raw", Engine3v8._get_sniper_entry(z, c["direction"], pair))
            zone_center = (z.top + z.bottom) / 2
            check_points = [entry, zone_center] + z.key_levels
            # Remove duplicates
            check_points = list(set(round(p, 6) for p in check_points))

            score, pillars = 0, []
            # Check if ANY point in the zone hits each confluence
            for cp in check_points:
                if any(abs(p.level - cp) <= tol_near for p in pivots):
                    if "P1:Pivot" not in pillars: score += 1; pillars.append("P1:Pivot")
                if any(abs(ma - cp) <= tol_near for ma in ma_confluences):
                    if "P2:MA" not in pillars: score += 1; pillars.append("P2:MA")
                if any(abs(a - cp) <= tol_analyst for a in analyst_levels):
                    if "P4:Analyst" not in pillars: score += 1; pillars.append("P4:Analyst")
                if any(abs(h - cp) <= tol_swing for h in swing_highs + swing_lows):
                    if "P5:Swing" not in pillars: score += 1; pillars.append("P5:Swing")
                if any(abs(rn - cp) <= tol_round for rn in round_numbers):
                    if "P6:Round" not in pillars: score += 1; pillars.append("P6:Round")
                pair_strikes = [o for o in option_strikes if o.tier != OptionTier.EXCLUDED and o.pair == pair]
                if any(abs(o.pair_strike - cp) <= tol_near for o in pair_strikes):
                    if "P8:FX_Option" not in pillars: score += 1; pillars.append("P8:FX_Option")

            if z.sd_overlap != "-": score += 1; pillars.append("P3:S/D_Overlap")
            if z.sd_overlap not in ("-", ""): score += 1; pillars.append("P9:4H_Overlap")
            if "P8:FX_Option" in pillars and "P3:S/D_Overlap" in pillars: score += 1; pillars.append("B:Opt+Struct")
            # 3+ levels in close proximity (using entry point for this)
            levels_near = [p.level for p in pivots if abs(p.level - entry) <= tol_close] + \
                          [o.pair_strike for o in option_strikes if o.tier != OptionTier.EXCLUDED and o.pair == pair and abs(o.pair_strike - entry) <= tol_close] + \
                          [h for h in swing_highs + swing_lows if abs(h - entry) <= tol_swing]
            if len(set(round(l, 5) for l in levels_near)) >= 3: score += 1; pillars.append("B:3+in20pip")
            if z.sd_overlap == "BoM" and z.sd_fresh in ("1S", "0X"): score += 1; pillars.append("B:RepeatMag")
            if z.sd_type == SDType.BOM: score += 2; pillars.append("M:BoM+2")
            if z.sd_type == SDType.VIRGIN_MOM: score -= 3; pillars.append("M:VirginMoM-3")
            if z.formed_after_consolidation: score += 1; pillars.append("M:PostConsol+1")
            if z.reaction_count >= 3: score -= 2; pillars.append("M:Depleted-2")
            c["confluence_score"] = max(0, score)
            c["confluence_max"] = 14
            c["confluence_pillars"] = pillars
            c["passes_floor"] = score >= (3 if z.sd_type == SDType.BOM else 4)
        return candidates

    # ── v8 SNIPER ENTRY: zone edge closest to approaching price ──

    @staticmethod
    def _get_sniper_entry(zone, direction, pair):
        """
        SNIPER ENTRY: Enter at the zone edge closest to approaching price.

        - SHORT from supply: Enter at BOTTOM edge (price rises into it)
        - LONG from demand: Enter at TOP edge (price falls into it)

        If key_levels exist, use the one closest to the approaching edge.
        """
        pip = PAIR_CONFIG.get(pair, PAIR_CONFIG["EUR/USD"])["pip_size"]

        if direction == TradeDirection.SHORT:
            # Approaching from below → enter at bottom of supply zone
            target_edge = zone.bottom
            if zone.key_levels:
                # Pick key level closest to zone bottom
                closest = min(zone.key_levels, key=lambda l: abs(l - zone.bottom))
                # Only use if within the zone
                if zone.bottom <= closest <= zone.top:
                    return closest
            return target_edge
        else:
            # Approaching from above → enter at top of demand zone
            target_edge = zone.top
            if zone.key_levels:
                # Pick key level closest to zone top
                closest = min(zone.key_levels, key=lambda l: abs(l - zone.top))
                if zone.bottom <= closest <= zone.top:
                    return closest
            return target_edge

    @staticmethod
    def _get_sniper_sl(zone, direction, zones, lsz_zones, pair, category=SetupCategory.SWING_SCALP):
        """
        SNIPER SL: Opposing zone edge + TIGHT buffer.

        - SHORT: SL = zone.top + tight buffer
        - LONG: SL = zone.bottom - tight buffer

        Also checks LSZ for structural anchors, but with TIGHT buffers.
        """
        pip = PAIR_CONFIG.get(pair, PAIR_CONFIG["EUR/USD"])["pip_size"]

        # Get tight buffer for this pair + category
        pair_buffers = SNIPER_BUFFER.get(pair, SNIPER_BUFFER["EUR/USD"])
        buf_pips = pair_buffers.get(category, 12)
        if pair == "DXY":
            overshoot = buf_pips  # Already in DXY points
        else:
            overshoot = buf_pips * pip

        entry = Engine3v8._get_sniper_entry(zone, direction, pair)

        if direction == TradeDirection.LONG:
            # SL below demand zone bottom
            default_sl = zone.bottom - overshoot
            best_sl = default_sl
            best_anchor = f"{zone.name} bottom - {buf_pips}p sniper buffer"

            # Check LSZ for tighter anchor
            for lsz in sorted(lsz_zones, key=lambda l: l.top, reverse=True):
                if lsz.side == "Demand-side" and lsz.top < entry and lsz.top >= zone.bottom - 50 * pip:
                    candidate_sl = lsz.bottom - overshoot
                    # Only use LSZ if it gives a TIGHTER SL (closer to entry)
                    if candidate_sl > best_sl:
                        best_sl = candidate_sl
                        best_anchor = f"LSZ demand {lsz.bottom:.5f}-{lsz.top:.5f} - {buf_pips}p sniper"

            return best_sl, best_anchor

        else:
            # SL above supply zone top
            default_sl = zone.top + overshoot
            best_sl = default_sl
            best_anchor = f"{zone.name} top + {buf_pips}p sniper buffer"

            # Check LSZ for tighter anchor
            for lsz in sorted(lsz_zones, key=lambda l: l.bottom):
                if lsz.side == "Supply-side" and lsz.bottom > entry and lsz.bottom <= zone.top + 50 * pip:
                    candidate_sl = lsz.top + overshoot
                    if candidate_sl < best_sl:
                        best_sl = candidate_sl
                        best_anchor = f"LSZ supply {lsz.bottom:.5f}-{lsz.top:.5f} + {buf_pips}p sniper"

            # Big figure check (only if it gives a TIGHTER SL)
            if pair == "DXY":
                for big_fig in [0.50, 0.25]:
                    bf_above = math.ceil(entry / big_fig) * big_fig
                    if bf_above > entry and bf_above <= zone.top + 50 * pip:
                        candidate_sl = bf_above + overshoot
                        if candidate_sl < best_sl:
                            best_sl = candidate_sl
                            best_anchor = f"Big fig {bf_above:.2f} + {buf_pips}p sniper"
            else:
                for big_fig in [0.0050, 0.0025]:
                    bf_above = math.ceil(entry / big_fig) * big_fig
                    if bf_above > entry and bf_above <= zone.top + 50 * pip:
                        candidate_sl = bf_above + overshoot
                        min_sl_dist = buf_pips * pip
                        if candidate_sl >= entry + min_sl_dist and candidate_sl < best_sl:
                            best_sl = candidate_sl
                            best_anchor = f"Big fig {bf_above:.5f} + {buf_pips}p sniper"

            return best_sl, best_anchor

    @staticmethod
    def _get_tp(zone, direction, zones, entry, pair, category=SetupCategory.SWING_SCALP):
        """
        TP: Opposing zone in the direction of the trade.
        - LONG: Find RESISTANCE zones ABOVE the entry → TP at their bottom edge (price hits from below)
        - SHORT: Find SUPPORT zones BELOW the entry → TP at their top edge (price hits from above)

        HTF Swing uses FAR edge of opposing zone for better RRR.
        Swing Scalp uses NEAR edge (closest target).
        """
        pip = PAIR_CONFIG.get(pair, PAIR_CONFIG["EUR/USD"])["pip_size"]

        if direction == TradeDirection.LONG:
            # For LONG: opposing = resistance zones ABOVE entry
            opposing = sorted([z for z in zones if z.bottom > entry and z.category in (ZoneCategory.RESISTANCE, ZoneCategory.EQUILIBRIUM)], key=lambda z: z.bottom)
        else:
            # For SHORT: opposing = support zones BELOW entry
            opposing = sorted([z for z in zones if z.top < entry and z.category in (ZoneCategory.SUPPORT, ZoneCategory.EQUILIBRIUM)], key=lambda z: z.top, reverse=True)

        if not opposing:
            return None, "NO OPPOSING ZONE", None, "", None, ""

        # TP1: For LONG, price hits the BOTTOM of the resistance zone from below
        # For SHORT, price hits the TOP of the support zone from above
        # HTF Swing targets the FAR edge of the opposing zone for bigger moves
        if direction == TradeDirection.LONG:
            # Near edge = bottom of resistance (first level price reaches)
            # Far edge = top of resistance (full zone traversal)
            tp1 = opposing[0].top if category == SetupCategory.HTF_SWING else opposing[0].bottom
        else:
            # Near edge = top of support (first level price reaches)
            # Far edge = bottom of support (full zone traversal)
            tp1 = opposing[0].bottom if category == SetupCategory.HTF_SWING else opposing[0].top

        tp1_anchor = f"{opposing[0].name} {'far' if category == SetupCategory.HTF_SWING else 'near'} edge at {tp1:.5f}"

        tp2 = None
        tp2_anchor = ""
        if len(opposing) >= 2:
            if direction == TradeDirection.LONG:
                tp2 = opposing[1].bottom
            else:
                tp2 = opposing[1].top
            tp2_anchor = f"{opposing[1].name} edge at {tp2:.5f}"

        move_distance = abs(tp1 - entry)
        tp1_5 = entry + (0.70 * move_distance) if direction == TradeDirection.LONG else entry - (0.70 * move_distance)
        tp1_5_anchor = f"70% of move ({move_distance/pip:.0f}p) from entry"

        return tp1, tp1_anchor, tp1_5, tp1_5_anchor, tp2, tp2_anchor

    @staticmethod
    def _calculate_rrr(entry, sl, tp, direction):
        if direction == TradeDirection.LONG:
            risk, reward = entry - sl, tp - entry
        else:
            risk, reward = sl - entry, entry - tp
        return reward / risk if risk > 0 else 0.0

    @staticmethod
    def _score_confidence(confluence_score, confluence_max, option_notional_b, shape_alignment, zfp, sd_type, pair, direction):
        base = (confluence_score / confluence_max) * 40 if confluence_max > 0 else 0
        option_score = min((option_notional_b / 3.5) * 20, 20)
        shape_score = 20 if shape_alignment in ("BOTH_DIRECTIONS", "DIRECTIONAL", "VALID") else 10
        zfp_score = (1 - zfp / 100) * 10
        total = base + option_score + shape_score + zfp_score
        if sd_type == SDType.BOM: total += 10
        elif sd_type == SDType.MOM: total -= 5  # v8: reduced from -10 to -5 (sniper entries make MoM viable)
        if pair == "GBP/USD" and PAIR_CONFIG.get("GBP/USD", {}).get("short_squeeze_amplification"):
            if direction == TradeDirection.LONG: total += 10
            elif direction == TradeDirection.SHORT:
                # v8.1 FIX: MoM + SHORT double penalty was killing GU setups
                # MoM already penalized -5 above; don't add ANOTHER -5 for short squeeze
                # Short squeeze risk is real but sniper entries + DXY alignment mitigate it
                if sd_type != SDType.MOM:  # Only penalize if NOT already MoM-penalized
                    total -= 5
        return max(0, min(100, int(total)))

    @staticmethod
    def _classify_quality(confidence, zone_entry_status):
        if zone_entry_status == "ENTRY-CONDITIONAL":
            if confidence >= 75: return SetupQuality.HIGH
            if confidence >= 50: return SetupQuality.CONDITIONAL
            return SetupQuality.REJECTED
        else:
            if confidence >= 85: return SetupQuality.GOD_TIER
            if confidence >= 75: return SetupQuality.HIGH
            if confidence >= 60: return SetupQuality.STANDARD
            return SetupQuality.REJECTED

    @staticmethod
    def generate_pair_setups(zones, lsz_zones, option_strikes, pivots, ma_confluences,
                              analyst_levels, swing_highs, swing_lows, round_numbers,
                              shape_chain, current_price, pair, weekly_range_pips=999):
        all_rejected = []
        all_setups = []
        is_consolidation = weekly_range_pips < CONSOL_RANGE_THRESHOLD.get(pair, 150)
        pip_size = PAIR_CONFIG.get(pair, PAIR_CONFIG["EUR/USD"])["pip_size"]

        candidates = Engine3v8.zone_to_candidates(zones, option_strikes, pair)
        entry_candidates = []
        for c in candidates:
            if c["zone_entry_status"] == "REJECT":
                c["reject_reason"] = f"Zone {c['zone'].name} rejected: {c['zone_entry_status']}"
                all_rejected.append(c.copy())
            else:
                entry_candidates.append(c)

        valid_candidates, proximity_rejected = Engine3v8.validate_proximity(entry_candidates, current_price, pair)
        all_rejected.extend(proximity_rejected)
        if not valid_candidates:
            return [], all_rejected

        valid_candidates = Engine3v8.score_confluence(
            valid_candidates, pivots, option_strikes, ma_confluences,
            analyst_levels, swing_highs, swing_lows, round_numbers, pair)

        setup_counter = 0
        pair_prefix = pair.split("/")[0] if "/" in pair else pair
        seen_keys = set()

        for day_idx, day_shape in enumerate(shape_chain):
            day = day_shape.day
            shape = day_shape.shape
            day_categories = SHAPE_CATEGORIES.get(shape, [SetupCategory.SWING_SCALP])

            # AUD/USD: BS/WL only, no swing scalps
            if pair == "AUD/USD":
                if shape in (MacroShape.SS, MacroShape.SS_DWL):
                    continue
                day_categories = [c for c in day_categories if c in (SetupCategory.HTF_SWING, SetupCategory.BREAKOUT_SURGE)]
                if not day_categories:
                    continue

            phase = Engine3v8.detect_consolidation_phase(shape, day)
            shape_support = Engine3v8.get_shape_support(shape)

            for c in valid_candidates:
                z = c["zone"]
                direction = c["direction"]

                for category in day_categories:
                    pair_limits = MAX_ENTRY_DISTANCE.get(pair, MAX_ENTRY_DISTANCE["EUR/USD"])
                    max_dist = pair_limits.get(category, 999999)
                    if shape in (MacroShape.SS, MacroShape.SS_DWL):
                        max_dist *= SS_PROXIMITY_FACTOR

                    # SNIPER ENTRY
                    entry = Engine3v8._get_sniper_entry(z, direction, pair)
                    dist = abs(entry - current_price)
                    if pair != "DXY":
                        dist = dist / pip_size
                    if dist > max_dist:
                        continue

                    dedup_key = f"{z.name}_{direction.value}_{category.value}"
                    if dedup_key in seen_keys and category != SetupCategory.SWING_SCALP:
                        continue

                    # SNIPER SL
                    sl, sl_anchor = Engine3v8._get_sniper_sl(z, direction, zones, lsz_zones, pair, category)
                    if sl is None:
                        continue

                    # SL DISTANCE VALIDATION (v8 CRITICAL)
                    sl_distance = abs(entry - sl) / pip_size if pair != "DXY" else abs(entry - sl) / PAIR_CONFIG["DXY"]["pip_size"]
                    sl_max = SL_MAX_HARD.get(pair, 150)
                    if sl_distance > sl_max:
                        rej = c.copy()
                        rej["reject_reason"] = f"SL distance {sl_distance:.0f}p exceeds hard max {sl_max}p"
                        all_rejected.append(rej)
                        continue

                    # TP
                    tp1, tp1_anchor, tp1_5, tp1_5_anchor, tp2, tp2_anchor = Engine3v8._get_tp(z, direction, zones, entry, pair, category)
                    if tp1 is None:
                        continue

                    # Context-aware RRR
                    min_rrr_tp1 = (CONSOL_RRR_TP1 if is_consolidation else MIN_RRR_TP1).get(category, 1.5)
                    min_rrr_blended = (CONSOL_RRR_BLENDED if is_consolidation else MIN_RRR_BLENDED).get(category, 2.0)

                    rrr_tp1 = Engine3v8._calculate_rrr(entry, sl, tp1, direction)
                    if tp2 and tp2 > 0:
                        rrr_tp2 = Engine3v8._calculate_rrr(entry, sl, tp2, direction)
                        blended_rrr = 0.5 * rrr_tp1 + 0.5 * rrr_tp2
                        max_rrr = rrr_tp2
                    else:
                        rrr_tp2 = 0
                        blended_rrr = rrr_tp1
                        max_rrr = rrr_tp1

                    if rrr_tp1 < min_rrr_tp1:
                        continue
                    if blended_rrr < min_rrr_blended:
                        continue

                    realized_rrr = Engine3v8._calculate_rrr(entry, sl, tp1_5, direction) if tp1_5 else rrr_tp1

                    # Confidence with SL distance penalty
                    near_notional = sum(
                        o.notional_b for o in option_strikes
                        if o.tier != OptionTier.EXCLUDED
                        and abs((o.dxy_level if pair == "DXY" else o.pair_strike) - entry) < (0.10 if pair == "DXY" else 20 * pip_size))
                    confidence = Engine3v8._score_confidence(
                        c["confluence_score"], c["confluence_max"], near_notional,
                        shape_support, z.zfp, z.sd_type, pair, direction)

                    # SL distance penalty / sniper bonus
                    sl_penalty_threshold = SL_MAX_PENALTY.get(pair, 100)
                    if sl_distance > sl_penalty_threshold:
                        confidence -= 10
                    elif sl_distance < 30:
                        # Sniper bonus: very tight SL = higher confidence
                        confidence += 10
                    elif sl_distance < 60:
                        # Good precision bonus
                        confidence += 5

                    quality = Engine3v8._classify_quality(confidence, c["zone_entry_status"])

                    # Downgrade if SL is near hard max
                    if sl_distance > sl_max * 0.85 and quality in (SetupQuality.HIGH, SetupQuality.GOD_TIER):
                        quality = SetupQuality.STANDARD

                    if quality == SetupQuality.REJECTED:
                        continue

                    setup_counter += 1
                    seen_keys.add(dedup_key)

                    e_edge = edge_name(direction)
                    entry_source = f"Sniper {e_edge} edge of {z.name}"

                    setup = TradeSetup(
                        setup_id=f"{pair_prefix}-{setup_counter}",
                        pair=pair, direction=direction, category=category,
                        quality=quality,
                        entry=round(entry, 5),
                        entry_source=entry_source,
                        sl=round(sl, 5), sl_anchor=sl_anchor,
                        tp1=round(tp1, 5), tp1_anchor=tp1_anchor,
                        tp1_5=round(tp1_5, 5) if tp1_5 else 0.0,
                        tp2=round(tp2, 5) if tp2 else 0.0, tp2_anchor=tp2_anchor,
                        realized_rrr=round(realized_rrr, 2),
                        maximum_rrr=round(max_rrr, 2),
                        blended_rrr=round(blended_rrr, 2),
                        day=day,
                        session=SESSION_MAP.get(category, Session.LONDON_OPEN),
                        confluence_score=c["confluence_score"],
                        confluence_max=14,
                        confidence_score=max(0, confidence),
                        anchor_zone=z.name,
                        zone_sd_type=z.sd_type,
                        zone_reaction_count=z.reaction_count,
                        gap_risk=PAIR_CONFIG.get(pair, PAIR_CONFIG["EUR/USD"]).get("gap_default", "LOW"),
                        gap_cancel_threshold=GAP_CANCEL_THRESHOLD.get(pair, 30),
                        proximity_pips=round(dist, 1),
                        proximity_status="WITHIN",
                        consolidation_phase=phase,
                        shape_trigger=shape,
                        entry_audit=f"Sniper: {e_edge} edge of {z.name} at {entry:.5f}",
                        sl_audit=f"SL={sl:.5f} ({sl_anchor}) | {sl_distance:.0f}p from entry",
                        tp_audit=f"TP1={tp1:.5f} ({tp1_anchor})" + (f" | TP2={tp2:.5f}" if tp2 else ""),
                        cascade_source="native",
                        sl_distance_pips=round(sl_distance, 1),
                        entry_edge=e_edge,
                    )
                    all_setups.append(setup)

                    # Generate reinforcements for HTF Swing
                    if category == SetupCategory.HTF_SWING and quality in (SetupQuality.HIGH, SetupQuality.GOD_TIER, SetupQuality.STANDARD):
                        reinforcements = Engine3v8._generate_reinforcements(
                            setup, zones, lsz_zones, option_strikes, pair, current_price, pip_size, setup_counter)
                        all_setups.extend(reinforcements)
                        setup_counter += len(reinforcements)

        return all_setups, all_rejected

    @staticmethod
    def _generate_reinforcements(parent_setup, zones, lsz_zones, option_strikes, pair, current_price, pip_size, counter_start):
        reinforcements = []
        z_name = parent_setup.anchor_zone
        z = next((z for z in zones if z.name == z_name), None)
        if not z:
            return reinforcements

        direction = parent_setup.direction
        tp1 = parent_setup.tp1
        pair_prefix = pair.split("/")[0] if "/" in pair else pair

        # R1: Far edge of zone (opposite to sniper entry)
        if direction == TradeDirection.LONG:
            r1_entry = z.bottom  # Far edge for LONG = bottom of demand zone
        else:
            r1_entry = z.top  # Far edge for SHORT = top of supply zone

        r1_dist = abs(r1_entry - current_price)
        r1_dist_pips = r1_dist if pair == "DXY" else r1_dist / pip_size
        max_reinforce = MAX_ENTRY_DISTANCE.get(pair, MAX_ENTRY_DISTANCE["EUR/USD"]).get(SetupCategory.REINFORCEMENT, 999999)

        if r1_dist_pips <= max_reinforce and r1_entry != parent_setup.entry:
            r1_sl, r1_sl_anchor = Engine3v8._get_sniper_sl(z, direction, zones, lsz_zones, pair, SetupCategory.REINFORCEMENT)
            r1_rrr = Engine3v8._calculate_rrr(r1_entry, r1_sl if r1_sl else parent_setup.sl, tp1, direction)
            if r1_rrr >= 1.5:
                r1_sl_dist = abs(r1_entry - r1_sl) / pip_size if pair != "DXY" else abs(r1_entry - r1_sl) / PAIR_CONFIG["DXY"]["pip_size"]
                counter_start += 1
                reinforcements.append(TradeSetup(
                    setup_id=f"{pair_prefix}-R{counter_start}",
                    pair=pair, direction=direction, category=SetupCategory.REINFORCEMENT,
                    quality=SetupQuality.STANDARD,
                    entry=round(r1_entry, 5),
                    entry_source=f"Far edge of {z.name} (Liquidity Ladder)",
                    sl=round(r1_sl, 5), sl_anchor=r1_sl_anchor,
                    tp1=round(tp1, 5), tp1_anchor=parent_setup.tp1_anchor,
                    tp1_5=0.0,
                    realized_rrr=round(r1_rrr, 2), maximum_rrr=round(r1_rrr, 2), blended_rrr=round(r1_rrr, 2),
                    day=parent_setup.day, session=Session.NY_OPEN,
                    confluence_score=parent_setup.confluence_score - 2,
                    confluence_max=14, confidence_score=parent_setup.confidence_score - 5,
                    anchor_zone=z.name, zone_sd_type=parent_setup.zone_sd_type,
                    zone_reaction_count=parent_setup.zone_reaction_count,
                    proximity_pips=round(r1_dist_pips, 1), proximity_status="WITHIN",
                    consolidation_phase=parent_setup.consolidation_phase,
                    shape_trigger=parent_setup.shape_trigger,
                    entry_audit=f"Reinforcement: far edge of {z.name} at {r1_entry:.5f}",
                    sl_audit=f"SL={r1_sl:.5f} ({r1_sl_anchor}) | {r1_sl_dist:.0f}p",
                    tp_audit=parent_setup.tp_audit,
                    parent_setup_id=parent_setup.setup_id,
                    rocket_type="Liquidity Ladder",
                    cascade_source="native",
                    sl_distance_pips=round(r1_sl_dist, 1),
                    entry_edge="bottom" if direction == TradeDirection.SHORT else "top",
                ))

        return reinforcements

    @staticmethod
    def run_full_pipeline(dxy_data, eurusd_data, gbpusd_data, audusd_data):
        """
        Full pipeline: DXY → per-pair native → DXY cascade → deduplicate → return.
        Each data dict must have: zones, lsz_zones, option_strikes, pivots, ma_confluences,
        analyst_levels, swing_highs, swing_lows, round_numbers, current_price, pair, shape_chain, weekly_range_pips
        """
        results = {}
        all_rejected = {}

        # 1. Generate DXY setups
        dxy_setups, dxy_rejected = Engine3v8.generate_pair_setups(**dxy_data)
        results["DXY"] = dxy_setups
        all_rejected["DXY"] = dxy_rejected

        # 2. Generate per-pair native setups
        for pair_data in [eurusd_data, gbpusd_data, audusd_data]:
            pair = pair_data["pair"]
            pair_setups, pair_rejected = Engine3v8.generate_pair_setups(**pair_data)
            results[pair] = pair_setups
            all_rejected[pair] = pair_rejected

        # 3. DXY cascade for each pair (v8.1: generates MULTIPLE setups per pair per DXY setup)
        for dxy_setup in dxy_setups:
            for pair_data in [eurusd_data, gbpusd_data, audusd_data]:
                pair = pair_data["pair"]
                cascade_setups = DXYCascadeMapper.cascade_dxy_setup(dxy_setup, pair_data)
                if cascade_setups:
                    # v8.1: Relaxed dedup — unique key = zone+direction+category+day
                    # Each DXY setup is on a specific day, so cascade setups on different days
                    # are DIFFERENT trade opportunities and should not be deduped
                    existing_keys = {
                        f"{s.anchor_zone}_{s.direction.value}_{s.category.value}_{s.day.value}"
                        for s in results.get(pair, [])
                    }
                    for cs in cascade_setups:
                        cascade_key = f"{cs.anchor_zone}_{cs.direction.value}_{cs.category.value}_{cs.day.value}"
                        if cascade_key not in existing_keys:
                            results.setdefault(pair, []).append(cs)
                            existing_keys.add(cascade_key)

        return results, all_rejected


# =================================================================
# TEST / DEMO
# =================================================================

if __name__ == "__main__":
    # Create sample data to verify engine runs
    dxy_zones = [
        IPZone("Z1-SUP", 99.55, 99.45, ZoneCategory.RESISTANCE, PressureDegree.EXTREME, "A+", 12, 8,
               key_levels=[99.45, 99.50, 99.55], sd_type=SDType.BOM, reaction_count=0),
        IPZone("Z2-SUP", 99.35, 99.21, ZoneCategory.RESISTANCE, PressureDegree.HEAVY, "A", 10, 15,
               key_levels=[99.21, 99.35], sd_type=SDType.MOM, reaction_count=2),
        IPZone("Z3-DEM", 99.08, 98.82, ZoneCategory.SUPPORT, PressureDegree.MODERATE_HEAVY, "A-", 8, 25,
               key_levels=[98.82, 99.00, 99.08], sd_type=SDType.BOM, reaction_count=1),
        IPZone("Z4-DEM", 98.50, 98.23, ZoneCategory.SUPPORT, PressureDegree.MODERATE, "B+", 6, 35,
               key_levels=[98.23, 98.50], sd_type=SDType.MOM, reaction_count=2),
    ]

    shape_chain = [
        MacroShapeDay(DayOfWeek.MONDAY, MacroShape.SS, 70, "moderate"),
        MacroShapeDay(DayOfWeek.TUESDAY, MacroShape.SS, 65, "moderate"),
        MacroShapeDay(DayOfWeek.WEDNESDAY, MacroShape.SS, 60, "moderate"),
        MacroShapeDay(DayOfWeek.THURSDAY, MacroShape.BS, 55, "rising"),
        MacroShapeDay(DayOfWeek.FRIDAY, MacroShape.WL, 50, "falling"),
    ]

    dxy_data = {
        "zones": dxy_zones, "lsz_zones": [], "option_strikes": [],
        "pivots": [PivotLevel(99.08, "PP", "Weekly PP")],
        "ma_confluences": [99.08], "analyst_levels": [],
        "swing_highs": [99.32], "swing_lows": [98.42],
        "round_numbers": [99.00, 99.50],
        "shape_chain": shape_chain,
        "current_price": 99.07,
        "pair": "DXY",
        "weekly_range_pips": 57,
    }

    setups, rejected = Engine3v8.generate_pair_setups(**dxy_data)

    print("=" * 80)
    print("TRIDENT ENGINE 3 v8.0.0 — SNIPER ENTRY ARCHITECTURE")
    print("DXY Test Run — Spot: 99.07")
    print("=" * 80)

    if not setups:
        print("\nNO SETUPS GENERATED — checking rejected candidates:")
        for r in rejected[:5]:
            print(f"  REJECTED: {r.get('reject_reason', 'unknown')}")

    for s in setups:
        print(f"\n{'='*60}")
        print(f"  {s.setup_id} {s.direction.value} {s.category.value} [{s.quality.value}]")
        print(f"  Zone: {s.anchor_zone} ({s.zone_sd_type.value}, {s.zone_reaction_count} reactions)")
        print(f"  Entry: {s.entry:.5f} ({s.entry_source})")
        print(f"  SL:    {s.sl:.5f} ({s.sl_anchor})")
        print(f"  SL Distance: {s.sl_distance_pips:.1f} pips")
        print(f"  TP1:   {s.tp1:.5f} ({s.tp1_anchor})")
        print(f"  RRR:   {s.blended_rrr:.1f}x (TP1: {s.realized_rrr:.1f}x, Max: {s.maximum_rrr:.1f}x)")
        print(f"  Day:   {s.day.value} | Session: {s.session.value}")
        print(f"  Proximity: {s.proximity_pips:.0f}p from spot | Confidence: {s.confidence_score}")
        print(f"  Entry Edge: {s.entry_edge} | Phase: {s.consolidation_phase.value}")
        print(f"  Cascade: {s.cascade_source}")

    print(f"\n{'='*80}")
    print(f"TOTAL: {len(setups)} setups generated, {len(rejected)} rejected")
    print(f"SL DISTANCES: {[s.sl_distance_pips for s in setups]}")
    print(f"RRR VALUES: {[s.blended_rrr for s in setups]}")

    # Validate sniper entry logic
    print(f"\n--- SNIPER VALIDATION ---")
    for s in setups:
        if s.cascade_source == "native":
            zone = next(z for z in dxy_zones if z.name == s.anchor_zone)
            if s.direction == TradeDirection.SHORT:
                expected_entry = zone.bottom  # Sniper: bottom of supply
                print(f"  {s.setup_id} SHORT: entry={s.entry:.2f}, zone bottom={zone.bottom:.2f} {'MATCH' if abs(s.entry - zone.bottom) < 0.01 else 'MISMATCH'}")
            else:
                expected_entry = zone.top  # Sniper: top of demand
                print(f"  {s.setup_id} LONG: entry={s.entry:.2f}, zone top={zone.top:.2f} {'MATCH' if abs(s.entry - zone.top) < 0.01 else 'MISMATCH'}")
