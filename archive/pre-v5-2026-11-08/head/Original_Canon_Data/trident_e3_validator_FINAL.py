#!/usr/bin/env python3
"""
TRIDENT E3 VALIDATOR — v1.0.0
================================
Purpose: Programmatically grade and reject slop trades emitted by the
Trident Trading Engine v5.3.3 (CORRECTED) E3 engine.

Validates a TradeSetup[] (as JSON) against:
  - The R3 Law (every anchor traces to E1 zone + E2 shape day)
  - The 12-Phase canonical pipeline (Phase 0-12)
  - The 7 rejection gates
  - The 16 zero-tolerance rules (14 original + 2 new)
  - The 12 blind-execution checks (BE1-BE12)
  - The 6-check direction validation
  - The 3D audit (P1-P8 / C1-C6 / T1-T8)
  - The dedup identity (pair|direction|anchorBucket|day)
  - The cap rule (MAX_MIRRORS_PER_ANCHOR_PER_DAY = 1)
  - The RRR floor (>=3.0 emission, >=3.5 executed, >=4.0 norm)
  - The golden levels oracle (operator's levels)
  - The f(T) acceptance formula (|all_setups| >= 24 minimum)
  - The cascade law (DXY->EU inverse, EU->GU kept)
  - The 35% divergence rule (FLAG ONLY, never override)
  - The Trading Speed Rule (+1 day adjustment when confidence < 0.65)
  - The Avatar State construction (Phase 11)

Usage:
    python trident_e3_validator.py --input setups.json --week 2026-07-06
    python trident_e3_validator.py --input setups.json --golden-oracle
    python trident_e3_validator.py --input setups.json --strict

Output: structured JSON report to stdout + exit code:
    0 = ALL PASS
    1 = WARNINGS (>=1 setup has warnings, but no hard rejects)
    2 = REJECTIONS (>=1 setup hard-rejected)
    3 = CRITICAL (R3 law violation, f(T) < 24, golden oracle failed)

Author: Plutus / Trident Trading Engine
Date: 2026-09-24
"""

from __future__ import annotations

import argparse
import json
import math
import sys
from dataclasses import dataclass, field, asdict
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple, Union

# ============================================================================
# CONSTANTS (verbatim from the corrected v5.3.3 E3 spec)
# ============================================================================

# Per-pair pip sizes
PIP_SIZE: Dict[str, float] = {
    "DXY": 0.01,
    "EUR/USD": 0.0001,
    "GBP/USD": 0.0001,
    "AUD/USD": 0.0001,
}

# Per-pair SL buffer (Law 7)
SL_BUFFER_PIPS: Dict[str, int] = {
    "DXY": 5,  # idx points
    "EUR/USD": 2,
    "GBP/USD": 3,
    "AUD/USD": 3,
}

# Per-pair forward spreads
FORWARD_SPREAD_PIPS: Dict[str, float] = {
    "DXY": 0.02,
    "EUR/USD": 1.0,
    "GBP/USD": 2.0,
    "AUD/USD": 1.5,
}

# Per-pair gap-cancel thresholds
GAP_CANCEL_THRESHOLD: Dict[str, float] = {
    "DXY": 0.15,
    "EUR/USD": 20.0,
    "GBP/USD": 15.0,
    "AUD/USD": 30.0,
}

# Per-pair SL hard ceiling
SL_MAX_HARD_PIPS: Dict[str, int] = {
    "DXY": 50,  # idx points
    "EUR/USD": 150,
    "GBP/USD": 180,
    "AUD/USD": 150,
}

# Per-pair SL distance confidence penalty threshold
SL_MAX_PENALTY_PIPS: Dict[str, int] = {
    "DXY": 30,
    "EUR/USD": 100,
    "GBP/USD": 120,
    "AUD/USD": 100,
}

# RRR floors (2026-07-31 operator ruling)
RRR_FLOOR_EMISSION = 3.0  # MINIMUM 3 RRR NOTHING LESS IS ACCEPTABLE
RRR_FLOOR_EXECUTED = 3.5
RRR_FLOOR_NORM = 4.0
RRR_FLOOR_CONSOL_WEEK = 2.5
MAX_CHAIN_RRR_CEILING = 15.0  # Law-13

# Law-14 TP precondition
LAW_14_TP_TO_SL_RATIO_MIN = 1.2

# Golden SL max pips (D17 ceiling = 36 pips HARD; GOLDEN_SL_MAX_PIPS = 9.5)
GOLDEN_SL_MAX_PIPS = 9.5
D17_SL_CEILING_PIPS = 36

# Cap rule
MAX_MIRRORS_PER_ANCHOR_PER_DAY = 1  # the GU-x10 destroyer
MAX_ROCKETS_PER_TRADE = 3  # recommended 2

# Cascade constants
DXY_CASCADE_PAIRS = ["EUR/USD", "GBP/USD", "AUD/USD"]
DXY_CASCADE_CONFIDENCE_BONUS = 10
DIVERGENCE_THRESHOLD = 0.35  # FLAG ONLY, never override

# Consolidation-week range threshold
CONSOL_RANGE_THRESHOLD_PIPS: Dict[str, int] = {
    "DXY": 80,
    "EUR/USD": 150,
    "GBP/USD": 200,
    "AUD/USD": 120,
}

# Trading speed rule
TRADING_SPEED_CONFIDENCE_THRESHOLD = 0.65  # below -> +1 day adjustment

# Freshness gate
FRESHNESS_DEPLETED_REACTIONS = 3  # 3+ reactions = DEPLETED = TP target only
FRESHNESS_FORTRESS_REACTIONS = 4  # 4+ strong = FORTRESS = 95% direction flip

# The 7 rejection gates
REJECTION_GATES = [
    "G0_ZONE_ENTRY_STATUS",       # Virgin MoM / MoM+0 reactions = REJECT
    "G1_PROXIMITY",                # Entry beyond MAX_ENTRY_DISTANCE for category
    "G2_DEDUP",                    # Same zone+direction+category already seen
    "G3_SL_DISTANCE",              # sl_distance > SL_MAX_HARD for pair
    "G4_TP_EXISTENCE",             # No opposing zone found
    "G5_RRR_MINIMUM",              # rrr < RRR_FLOOR_EMISSION
    "G6_QUALITY_FLOOR",            # Quality = REJECTED (confidence < 50)
]

# The 12 Blind-Execution checks
BLIND_EXEC_CHECKS = [
    "BE1_DAY_LABEL",          # Every setup has DAY label
    "BE2_SESSION_WINDOW",     # Every setup has SESSION WINDOW
    "BE3_SHAPE_TRIGGER",      # Every setup has SHAPE TRIGGER
    "BE4_SETUP_CATEGORY",    # Every setup has SETUP CATEGORY
    "BE5_WEEKLY_CALENDAR",   # Weekly Execution Calendar populated
    "BE6_ANCHOR_WHEN_WHERE", # All anchor points have WHEN + WHERE
    "BE7_NO_REALTIME_CHART", # No setup requires real-time chart analysis
    "BE8_DAY_CATALYSTS",     # Day Catalysts listed
    "BE9_REINFORCEMENT_PARENT", # Reinforcement entries have parent trade ref
    "BE10_ALL_5_DAYS",       # All 5 trading days covered
    "BE11_PROFIT_TAKING_LAW", # Profit Taking Law documented
    "BE12_TRADING_SPEED",    # Trading Speed adjustment applied
]

# The 14+2 = 16 zero-tolerance rules
ZERO_TOLERANCE_RULES = [
    "ZT1_POI_TIER_REQUIRED",         # Tier 1 or 2 POI required
    "ZT2_DIRECTION_VALIDATION",       # 6-check; 4+ disagree -> REVERSE
    "ZT3_FIB_ANCHORING",              # Context 1/2/3 fib rules
    "ZT4_TEMPORAL_BOUNDARY",          # Forward data forbidden
    "ZT5_POST_PIERCE_CONSOL",         # No WLS after 2 strong piercing moves
    "ZT6_BOM_MOM_ENFORCEMENT",        # No entry at MoM unless 4 exceptions
    "ZT7_1_2_3_RETEST",               # No swing entry before 3rd retest
    "ZT8_SEQUENTIAL_ZONE_PATH",       # Every setup maps entry->TP path
    "ZT9_TIMEFRAME_STACK",            # Swing=4H/1H/30m; Scalp=30m/15m/5m
    "ZT10_RED_FOLDER_DEFERRAL",       # 30-min deferral
    "ZT11_CONFIDENCE_65",             # Confidence >= 65 required
    "ZT12_MOM_LADDER_STEPS_ONLY",    # MoM = ladder steps for trend-aligned only
    "ZT13_BLIND_EXEC_LABELS",         # 5 MANDATORY labels
    "ZT14_WEEKLY_CALENDAR",           # MANDATORY weekly execution calendar
    "ZT15_R3_LAW",                    # E3 never overrides E1/E2; never fabricates
    "ZT16_HONEST_ABSENCE",            # SL_INVALID/TP_NULL/etc -> NO EMISSION
]

# The 6-check direction validation
DIRECTION_VALIDATION_CHECKS = [
    "CHECK1_4H_TREND",
    "CHECK2_BOM_ALIGNMENT",
    "CHECK3_LIQUIDITY_SWEEP",
    "CHECK4_ZONE_FAILURE",
    "CHECK5_MACRO_SHAPE",
    "CHECK6_COUNTER_TREND",
]

# f(T) acceptance formula
F_T_ACCEPTANCE_MIN = 24  # 8 DXY + 8 EU + 8 GU minimum; MORE is fine, LESS is REJECT

# The 8 golden DXY trades (operator's July 6-10 2026 levels)
GOLDEN_DXY_TRADES = [
    {"day": "Monday",    "setup": "SS Long",   "entry": 100.945, "sl": 100.905, "tp": 101.115, "rrr": 4.25, "zone": "1H LQZ"},
    {"day": "Monday",    "setup": "BS Short",  "entry": 101.140, "sl": 101.200, "tp": 100.845, "rrr": 4.92, "zone": "1H LQZ"},
    {"day": "Tuesday",   "setup": "SS Long",   "entry": 100.845, "sl": 100.770, "tp": 101.190, "rrr": 4.60, "zone": "1H MoM"},
    {"day": "Wednesday", "setup": "SS Short",  "entry": 101.190, "sl": 101.250, "tp": 100.975, "rrr": 3.58, "zone": "1H LQZ"},
    {"day": "Wednesday", "setup": "RWL Long", "entry": 100.975, "sl": 100.905, "tp": 101.240, "rrr": 3.79, "zone": "1H LQZ"},
    {"day": "Wednesday", "setup": "BS Short",  "entry": 101.235, "sl": 101.330, "tp": 100.680, "rrr": 5.84, "zone": "4H BoM"},
    {"day": "Thursday",  "setup": "Ladder Short", "entry": None, "sl": None, "tp": None, "rrr": None, "zone": "1H LQZ"},
    {"day": "Friday",    "setup": "WL+RWL",   "entry": None, "sl": None, "tp": None, "rrr": None, "zone": "1H LQZ"},
]

# The 7 golden DXY LQZ levels (the LMV oracle)
GOLDEN_DXY_LQZ_LEVELS = [100.845, 100.945, 100.975, 101.140, 101.190, 101.235, 101.240]
GOLDEN_DXY_BOM_LEVELS = [100.680, 101.330]  # 1H demand / 4H supply
GOLDEN_DXY_MOM_LEVELS = [100.845]  # 1H

# The EU axis labels (Tier B — operator's drawn levels)
GOLDEN_EU_AXIS = [
    1.14649, 1.14578, 1.14544, 1.14505, 1.14442, 1.14441, 1.14408,
    1.14353, 1.14325, 1.14322, 1.14277, 1.14276, 1.14250, 1.14233,
    1.14205, 1.14183, 1.14150, 1.14106, 1.14103, 1.14039, 1.14012,
    1.14004, 1.13964, 1.13953, 1.13950, 1.13900, 1.13868, 1.13850,
]

# The GU axis labels (Tier B)
GOLDEN_GU_AXIS = [
    1.34587, 1.34485, 1.34481, 1.34360, 1.34246, 1.34244, 1.34100,
    1.34075, 1.34021, 1.33941, 1.33934, 1.33882, 1.33839, 1.33829,
    1.33750, 1.33629, 1.33600, 1.33522, 1.33347, 1.33331, 1.33330,
    1.33224, 1.33199,
]

# PIP tolerance for golden-level matching
GOLDEN_LEVEL_TOLERANCE_PIPS = 3  # 3-pip count; precision is the ONLY metric

# Direction validation consensus threshold
DIRECTION_DISAGREE_THRESHOLD = 4  # 4+ of 6 disagree -> REVERSE

# Phantom-BoM exception (virgin MoM that functions as BoM)
PHANTOM_BOM_EXCEPTION_SHAPES = ["BS"]  # ONLY BS, NOT WL

# Session-time mapping (ET, hours since midnight UTC)
SESSION_UTC_HOURS = {
    "TOKYO": (0, 7),
    "LONDON": (7, 13),
    "NY": (13, 21),
    "OFF": (21, 24),
}

# Stagger weights for blended RRR
STAGGER_WEIGHTS = [0.33, 0.33, 0.34]

# D11 doctrine: distance threshold for "one signal shares"
D11_SIGNAL_SHARE_PIPS = 15


# ============================================================================
# DATA TYPES (Python mirror of the TypeScript interfaces in Appendix F)
# ============================================================================

@dataclass
class ValidationIssue:
    """A single validation issue (warning or rejection)."""
    rule: str
    severity: str  # 'WARN' | 'REJECT' | 'CRITICAL'
    setup_id: Optional[str]
    field: Optional[str]
    detail: str
    remedy: str


@dataclass
class SetupValidationResult:
    """Per-setup validation result."""
    setup_id: str
    passed: bool
    issues: List[ValidationIssue] = field(default_factory=list)
    rejection_reason: Optional[str] = None
    audit_trail: List[str] = field(default_factory=list)


@dataclass
class AggregateReport:
    """Aggregate validation report."""
    total_setups: int = 0
    passed_setups: int = 0
    rejected_setups: int = 0
    warned_setups: int = 0
    issues: List[ValidationIssue] = field(default_factory=list)
    per_setup: List[SetupValidationResult] = field(default_factory=list)
    f_t_acceptance: Optional[Dict[str, int]] = None
    golden_oracle_match: Optional[Dict[str, Any]] = None
    r3_law_violations: int = 0
    cascade_drift: Optional[Dict[str, float]] = None
    avatar_state_setups: int = 0
    exit_code: int = 0


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def pips_to_price(pips: float, pair: str) -> float:
    """Convert pips to price units for the given pair."""
    return pips * PIP_SIZE.get(pair, 0.0001)


def price_to_pips(price_diff: float, pair: str) -> float:
    """Convert price difference to pips for the given pair."""
    pip = PIP_SIZE.get(pair, 0.0001)
    if pip == 0:
        return 0.0
    return abs(price_diff) / pip


def is_within_tolerance(price_a: float, price_b: float, tolerance_pips: float, pair: str) -> bool:
    """Check if two prices are within a pip tolerance."""
    return price_to_pips(price_a - price_b, pair) <= tolerance_pips


def safe_get(obj: Any, path: str, default: Any = None) -> Any:
    """Safely get a nested attribute by dot-path."""
    parts = path.split(".")
    cur = obj
    for p in parts:
        if cur is None:
            return default
        if isinstance(cur, dict):
            cur = cur.get(p, default)
        else:
            cur = getattr(cur, p, default) if hasattr(cur, p) else default
    return cur if cur is not None else default


def is_long(direction: str) -> bool:
    return direction.upper() == "LONG"


def is_short(direction: str) -> bool:
    return direction.upper() == "SHORT"


def invert_direction(direction: str) -> str:
    return "SHORT" if is_long(direction) else "LONG"


def is_dxy(pair: str) -> bool:
    return pair.upper() == "DXY"


def is_eu(pair: str) -> bool:
    return pair.upper() in ("EUR/USD", "EURUSD", "EU")


def is_gu(pair: str) -> bool:
    return pair.upper() in ("GBP/USD", "GBPUSD", "GU")


# ============================================================================
# VALIDATORS — Phase by Phase
# ============================================================================

class TridentE3Validator:
    """The main validator class."""

    def __init__(
        self,
        setups: List[Dict[str, Any]],
        zone_map: Optional[Dict[str, Any]] = None,
        shape_prediction: Optional[Dict[str, Any]] = None,
        week_start: Optional[str] = None,
        strict: bool = False,
    ):
        self.setups = setups or []
        self.zone_map = zone_map or {}
        self.shape_prediction = shape_prediction or {}
        self.week_start = week_start
        self.strict = strict
        self.all_zone_ids: Set[str] = set()
        self.e1_zone_map_ids: Set[str] = set()
        self.e2_projection_ids: Set[str] = set()
        self.working_day_map: List[Dict[str, Any]] = []
        self.economic_calendar: List[Dict[str, Any]] = []
        self.aggregate = AggregateReport()

        # Extract zone IDs from the ZoneMapSnapshot
        for zone_list_name in ("ipZones", "sdZones", "lqzZones"):
            for z in self.zone_map.get(zone_list_name, []):
                zid = z.get("zoneId") or z.get("id")
                if zid:
                    self.all_zone_ids.add(zid)
                    self.e1_zone_map_ids.add(zid)

        # Extract E2 projection IDs (from shape prediction)
        sp = self.shape_prediction
        if sp:
            chain = sp.get("shapeChain", {})
            for d in chain.get("days", []):
                pid = d.get("keyZoneId") or d.get("supplyZoneId") or d.get("demandZoneId")
                if pid:
                    self.e2_projection_ids.add(pid)
                if d.get("day"):
                    self.working_day_map.append(d)

    # ----------------------------------------------------------------------
    # PHASE 0: Setup Universe Classification
    # ----------------------------------------------------------------------

    def validate_setup_universe(self, setup: Dict[str, Any]) -> List[ValidationIssue]:
        """Validate that the setup's category matches the E2 day shape."""
        issues: List[ValidationIssue] = []
        category = setup.get("category") or setup.get("setupCategory")
        shape_trigger = setup.get("shapeTrigger") or ""
        day = setup.get("day", "").lower()

        # Extract shape from "BS @ Monday London Open" format
        shape = shape_trigger.split("@")[0].strip().upper() if shape_trigger else ""

        # Validate the shape-category mapping
        shape_cat_map = {
            "SS": ["Swing Scalp"],
            "SS(DWL)": ["Swing Scalp"],
            "BS": ["HTF Swing", "Breakout Search"],
            "PBS": ["HTF Swing", "Breakout Search"],
            "R": ["Swing Scalp", "Reinforcement"],
            "RS": ["HTF Swing"],
            "WL": ["HTF Swing"],
            "RWL": ["HTF Swing", "Breakout Search"],
            "PWL": ["HTF Swing"],
            "PRWL": ["HTF Swing", "Reinforcement"],
            "WLS": ["Swing Scalp"],
        }

        valid_categories = shape_cat_map.get(shape, [])
        if valid_categories and category not in valid_categories:
            issues.append(ValidationIssue(
                rule="PHASE0_SETUP_UNIVERSE",
                severity="WARN",
                setup_id=setup.get("setupId"),
                field="category",
                detail=f"Shape '{shape}' typically produces {valid_categories}, but setup is '{category}'",
                remedy=f"Change setup category to one of: {valid_categories}",
            ))

        # AUD/USD restriction: BS/WL only, NO NY session
        pair = setup.get("pair", "")
        if is_gu(pair) is False and pair == "AUD/USD":
            if shape not in ("BS", "WL", "PBS"):
                issues.append(ValidationIssue(
                    rule="PHASE0_AUD_RESTRICTION",
                    severity="REJECT",
                    setup_id=setup.get("setupId"),
                    field="shapeTrigger",
                    detail=f"AUD/USD supports BS/WL/PBS only, not '{shape}'",
                    remedy="Skip AUD/USD setup for non-BS/WL shapes",
                ))
            session = (setup.get("sessionWindow") or "").lower()
            if "ny" in session:
                issues.append(ValidationIssue(
                    rule="PHASE0_AUD_NO_NY",
                    severity="REJECT",
                    setup_id=setup.get("setupId"),
                    field="sessionWindow",
                    detail="AUD/USD is NO_NY — London/Tokyo only",
                    remedy="Reassign to London or Tokyo session",
                ))

        return issues

    # ----------------------------------------------------------------------
    # PHASE 1: Day-Level Bridge
    # ----------------------------------------------------------------------

    def validate_day_assignment(self, setup: Dict[str, Any]) -> List[ValidationIssue]:
        """Validate the assigned DAY per Phase 7 (12-step algorithm)."""
        issues: List[ValidationIssue] = []
        day = setup.get("day")
        if not day:
            issues.append(ValidationIssue(
                rule="BE1_DAY_LABEL",
                severity="REJECT",
                setup_id=setup.get("setupId"),
                field="day",
                detail="Setup missing DAY label",
                remedy="Assign day via Phase 7 algorithm",
            ))
            return issues

        if day not in ("Monday", "Tuesday", "Wednesday", "Thursday", "Friday"):
            issues.append(ValidationIssue(
                rule="BE1_DAY_LABEL",
                severity="REJECT",
                setup_id=setup.get("setupId"),
                field="day",
                detail=f"Invalid day: {day}",
                remedy="Day must be Monday-Friday",
            ))

        # Validate Trading Speed adjustment
        confidence = setup.get("confidenceScore", 0) / 100.0
        if confidence < TRADING_SPEED_CONFIDENCE_THRESHOLD and day != "Friday":
            # Should have +1 day adjustment applied
            day_catalysts = setup.get("dayCatalysts", [])
            has_speed_adjustment = any("Trading Speed" in c or "+1 day" in c for c in day_catalysts)
            if not has_speed_adjustment:
                issues.append(ValidationIssue(
                    rule="BE12_TRADING_SPEED",
                    severity="WARN",
                    setup_id=setup.get("setupId"),
                    field="day",
                    detail=f"Confidence {confidence:.2f} < {TRADING_SPEED_CONFIDENCE_THRESHOLD}, no +1 day Trading Speed adjustment applied",
                    remedy="Add '+1 day Trading Speed adjustment' to dayCatalysts",
                ))

        return issues

    # ----------------------------------------------------------------------
    # PHASE 2: Zone Selection + Direction-Appropriate Anchor
    # ----------------------------------------------------------------------

    def validate_r3_law(self, setup: Dict[str, Any]) -> List[ValidationIssue]:
        """Validate the R3 Law: every anchor traces to E1 zone + E2 shape day."""
        issues: List[ValidationIssue] = []
        setup_id = setup.get("setupId", "?")
        anchor_zone_id = setup.get("anchorZoneId")
        parent_setup_id = setup.get("parentSetupId")
        cascade_source = setup.get("cascadeSource", "native")

        # 1. Anchor zone ID must resolve to E1 ZoneMapSnapshot
        if not anchor_zone_id:
            issues.append(ValidationIssue(
                rule="ZT15_R3_LAW",
                severity="CRITICAL",
                setup_id=setup_id,
                field="anchorZoneId",
                detail="Setup has no anchorZoneId — R3 violation (E3 fabricating levels)",
                remedy="Anchor must reference a specific E1 zone ID",
            ))
        elif anchor_zone_id not in self.e1_zone_map_ids and self.e1_zone_map_ids:
            issues.append(ValidationIssue(
                rule="ZT15_R3_LAW",
                severity="CRITICAL",
                setup_id=setup_id,
                field="anchorZoneId",
                detail=f"anchorZoneId '{anchor_zone_id}' not in E1 ZoneMapSnapshot — R3 violation",
                remedy="Anchor must trace to a zone that exists in E1's zone map",
            ))

        # 2. Day must trace to E2 shape day (if not a reinforcement or cascade mirror)
        day = setup.get("day")
        if day and self.working_day_map:
            working_day_match = any(
                wd.get("day") == day for wd in self.working_day_map
            )
            if not working_day_match and cascade_source == "native":
                issues.append(ValidationIssue(
                    rule="ZT15_R3_LAW",
                    severity="WARN",
                    setup_id=setup_id,
                    field="day",
                    detail=f"Day '{day}' not in E2 WorkingDayMap — possible R3 violation",
                    remedy="Day must trace to E2's day-by-day decomposition",
                ))

        # 3. Never fabricate levels — entry/SL/TP must have audit trail
        for field in ("entryAudit", "slAudit", "tpAudit"):
            audit = setup.get(field, "")
            if not audit or len(audit) < 20:
                issues.append(ValidationIssue(
                    rule="ZT15_R3_LAW",
                    severity="WARN",
                    setup_id=setup_id,
                    field=field,
                    detail=f"{field} empty or too short — possible fabricated level",
                    remedy="Audit trail must document the E1 zone + E2 projection source of the anchor",
                ))

        return issues

    def validate_direction_appropriate_anchor(self, setup: Dict[str, Any]) -> List[ValidationIssue]:
        """Validate the direction-appropriate anchor (2026-08-05 decisive fix)."""
        issues: List[ValidationIssue] = []
        setup_id = setup.get("setupId", "?")
        direction = setup.get("direction", "").upper()
        anchor_zone_classification = (setup.get("anchorZoneClassification") or "").upper()

        if is_long(direction):
            # LONG -> demandZoneId (not supplyZoneId)
            if "SUPPLY" in anchor_zone_classification and anchor_zone_classification != "PHANTOM_BOM":
                issues.append(ValidationIssue(
                    rule="PHASE2_DIRECTION_APPROPRIATE_ANCHOR",
                    severity="CRITICAL",
                    setup_id=setup_id,
                    field="anchorZoneClassification",
                    detail=f"LONG setup anchored at SUPPLY — wrong side (should be DEMAND). 2026-08-05 fix violated.",
                    remedy="LONG setups MUST anchor at demand zones (demandZoneId); never supply",
                ))
        elif is_short(direction):
            # SHORT -> supplyZoneId (not demandZoneId)
            if "DEMAND" in anchor_zone_classification and anchor_zone_classification != "PHANTOM_BOM":
                issues.append(ValidationIssue(
                    rule="PHASE2_DIRECTION_APPROPRIATE_ANCHOR",
                    severity="CRITICAL",
                    setup_id=setup_id,
                    field="anchorZoneClassification",
                    detail=f"SHORT setup anchored at DEMAND — wrong side (should be SUPPLY). 2026-08-05 fix violated.",
                    remedy="SHORT setups MUST anchor at supply zones (supplyZoneId); never demand",
                ))

        return issues

    def validate_structural_entry_source(self, setup: Dict[str, Any]) -> List[ValidationIssue]:
        """Validate DECISION-1: IP NEVER entries."""
        issues: List[ValidationIssue] = []
        setup_id = setup.get("setupId", "?")
        anchor_zone_classification = (setup.get("anchorZoneClassification") or "").upper()

        # STRUCTURAL_ENTRY_SOURCES = ['ORDER_BLOCK', 'LQZ']
        # IP zones (classification 'IP' or source 'PILLAR') are NEVER entries
        if "PILLAR" in anchor_zone_classification or anchor_zone_classification == "IP":
            issues.append(ValidationIssue(
                rule="PHASE2_DECISION1_IP_NEVER_ENTRIES",
                severity="CRITICAL",
                setup_id=setup_id,
                field="anchorZoneClassification",
                detail="IP zone (institutional pressure) used as entry anchor — DECISION-1 violation",
                remedy="IP zones are confluence/ZFP/context + SL/TP rungs, NEVER entries. Anchor must be ORDER_BLOCK or LQZ.",
            ))

        return issues

    def validate_freshness_gate(self, setup: Dict[str, Any]) -> List[ValidationIssue]:
        """Validate the 4-stage freshness gate."""
        issues: List[ValidationIssue] = []
        setup_id = setup.get("setupId", "?")
        reaction_count = setup.get("anchorZoneReactionCount", 0)
        classification = (setup.get("anchorZoneClassification") or "").upper()
        direction = setup.get("direction", "").upper()
        category = setup.get("category", "")

        # Stage A: 4th+ battle = DEPLETED = TP target only
        if reaction_count >= FRESHNESS_DEPLETED_REACTIONS:
            # Should be TP target, not entry
            if category != "Reinforcement":  # reinforcements are exempt
                issues.append(ValidationIssue(
                    rule="ZT12_MOM_LADDER_STEPS_ONLY",
                    severity="REJECT",
                    setup_id=setup_id,
                    field="anchorZoneReactionCount",
                    detail=f"Zone reactionCount {reaction_count} >= {FRESHNESS_DEPLETED_REACTIONS} = DEPLETED — TP target only, not entry",
                    remedy="Reject this entry; the zone is depleted. Use only as TP target.",
                ))

        # Stage B: any prior pierced event = VIOLATED terminal
        if "BROKEN" in classification or "VIOLATED" in classification:
            issues.append(ValidationIssue(
                rule="PHASE2_FRESHNESS_VIOLATED",
                severity="CRITICAL",
                setup_id=setup_id,
                field="anchorZoneClassification",
                detail="Zone is BROKEN/VIOLATED — terminal state, never an entry again",
                remedy="Role reversal — broken support = new resistance. Reject.",
            ))

        # Stage C: Virgin MoM = DEATH ZONE for counter-trend
        if classification == "MOM" and reaction_count == 0:
            # Check the 4 exceptions:
            # 1. >= 1 prior strong reaction  -- FAILS (0 reactions)
            # So virgin MoM = automatic REJECT
            # EXCEPT: the Phantom-BoM exception (large OB + fakeout + pre-formation reaction + macro-origin continuation)
            # EXCEPT: LQZ anchored to virgin MoM for liquidity-ladder reinforcement of existing BS
            if "PHANTOM_BOM" not in classification:
                if category == "Reinforcement":
                    # Check if direction matches existing move
                    shape_trigger = setup.get("shapeTrigger", "")
                    if "BS" in shape_trigger.upper():
                        pass  # OK — BS has sustained energy
                    else:
                        issues.append(ValidationIssue(
                            rule="ZT6_BOM_MOM_ENFORCEMENT",
                            severity="REJECT",
                            setup_id=setup_id,
                            field="anchorZoneClassification",
                            detail="Virgin MoM = DEATH ZONE — reinforcement only valid for BS (sustained energy), not WL",
                            remedy="Reject reinforcement at virgin MoM for non-BS moves",
                        ))
                else:
                    issues.append(ValidationIssue(
                        rule="ZT6_BOM_MOM_ENFORCEMENT",
                        severity="REJECT",
                        setup_id=setup_id,
                        field="anchorZoneClassification",
                        detail="Virgin MoM = DEATH ZONE for counter-trend entries (0% win rate)",
                        remedy="Auto-reject. MoM with 0 reactions is a death zone.",
                    ))

        return issues

    # ----------------------------------------------------------------------
    # PHASE 3: Entry Identification (TS-1 — Sniper Entry)
    # ----------------------------------------------------------------------

    def validate_sniper_entry(self, setup: Dict[str, Any]) -> List[ValidationIssue]:
        """Validate the sniper entry (zone edge closest to approaching price)."""
        issues: List[ValidationIssue] = []
        setup_id = setup.get("setupId", "?")
        entry = setup.get("entry")
        sl = setup.get("sl")
        tp = setup.get("tp")
        direction = setup.get("direction", "").upper()
        pair = setup.get("pair", "EUR/USD")
        anchor_zone = setup.get("anchorZoneName", "")
        entry_edge = setup.get("entryEdge", "")

        if entry is None or sl is None or tp is None:
            issues.append(ValidationIssue(
                rule="PHASE3_SNIPER_ENTRY",
                severity="REJECT",
                setup_id=setup_id,
                field="entry/sl/tp",
                detail="Missing entry, SL, or TP",
                remedy="All three anchors required",
            ))
            return issues

        # Validate direction-order invariant: LONG sl<entry<tp; SHORT tp<entry<sl
        if is_long(direction):
            if not (sl < entry < tp):
                issues.append(ValidationIssue(
                    rule="PHASE3_DIRECTION_ORDER",
                    severity="CRITICAL",
                    setup_id=setup_id,
                    field="entry/sl/tp",
                    detail=f"LONG setup must have sl<entry<tp, got sl={sl} entry={entry} tp={tp}",
                    remedy="Fix direction order: LONG -> sl < entry < tp",
                ))
        elif is_short(direction):
            if not (tp < entry < sl):
                issues.append(ValidationIssue(
                    rule="PHASE3_DIRECTION_ORDER",
                    severity="CRITICAL",
                    setup_id=setup_id,
                    field="entry/sl/tp",
                    detail=f"SHORT setup must have tp<entry<sl, got sl={sl} entry={entry} tp={tp}",
                    remedy="Fix direction order: SHORT -> tp < entry < sl",
                ))

        # Validate entry edge
        if is_long(direction) and entry_edge and entry_edge != "top":
            issues.append(ValidationIssue(
                rule="PHASE3_SNIPER_ENTRY_EDGE",
                severity="WARN",
                setup_id=setup_id,
                field="entryEdge",
                detail=f"LONG sniper entry should be at zone TOP edge (closest to approaching price from above), got '{entry_edge}'",
                remedy="Use entryEdge='top' for LONG",
            ))
        elif is_short(direction) and entry_edge and entry_edge != "bottom":
            issues.append(ValidationIssue(
                rule="PHASE3_SNIPER_ENTRY_EDGE",
                severity="WARN",
                setup_id=setup_id,
                field="entryEdge",
                detail=f"SHORT sniper entry should be at zone BOTTOM edge (closest to approaching price from below), got '{entry_edge}'",
                remedy="Use entryEdge='bottom' for SHORT",
            ))

        return issues

    # ----------------------------------------------------------------------
    # PHASE 4: SL/TP + RRR
    # ----------------------------------------------------------------------

    def validate_sl_placement(self, setup: Dict[str, Any]) -> List[ValidationIssue]:
        """Validate the SL placement (ladder-steps + buffer + ceiling)."""
        issues: List[ValidationIssue] = []
        setup_id = setup.get("setupId", "?")
        entry = setup.get("entry")
        sl = setup.get("sl")
        direction = setup.get("direction", "").upper()
        pair = setup.get("pair", "EUR/USD")
        sl_method = setup.get("slMethod", "")

        if entry is None or sl is None:
            return issues  # already flagged in sniper entry

        sl_distance_pips = price_to_pips(abs(sl - entry), pair)

        # D17 SL ceiling = 36 pips HARD
        if sl_distance_pips > D17_SL_CEILING_PIPS:
            issues.append(ValidationIssue(
                rule="PHASE4_D17_SL_CEILING",
                severity="REJECT",
                setup_id=setup_id,
                field="sl",
                detail=f"SL distance {sl_distance_pips:.1f} pips > D17 ceiling {D17_SL_CEILING_PIPS} pips HARD",
                remedy="Use golden SL fallback (computeGoldenSL_V452); cap at 9.5 pips",
            ))

        # Per-pair SL hard cap
        pair_cap = SL_MAX_HARD_PIPS.get(pair, 150)
        if sl_distance_pips > pair_cap:
            issues.append(ValidationIssue(
                rule="G3_SL_DISTANCE",
                severity="REJECT",
                setup_id=setup_id,
                field="sl",
                detail=f"SL distance {sl_distance_pips:.1f} pips > pair cap {pair_cap} pips for {pair}",
                remedy=f"Tighten SL to within {pair_cap} pips",
            ))

        # Penalty threshold (confidence -10)
        penalty_threshold = SL_MAX_PENALTY_PIPS.get(pair, 100)
        if sl_distance_pips > penalty_threshold:
            # Should have applied -10 confidence penalty
            confidence = setup.get("confidenceScore", 0)
            expected_confidence = max(0, confidence - 10)  # the penalty should already be applied
            # If confidence is still high, warn
            if confidence > 70:
                issues.append(ValidationIssue(
                    rule="PHASE4_SL_DISTANCE_PENALTY",
                    severity="WARN",
                    setup_id=setup_id,
                    field="confidenceScore",
                    detail=f"SL distance {sl_distance_pips:.1f} > {penalty_threshold} threshold, confidence should be -10 (currently {confidence})",
                    remedy="Apply -10 confidence penalty for wide SL",
                ))

        # Validate SL method
        valid_methods = {"ZR-3.1-current-step", "ZR-3.1-next-step", "golden-fallback", "LQZ-shield", "SD-pressure"}
        if sl_method and sl_method not in valid_methods:
            issues.append(ValidationIssue(
                rule="PHASE4_SL_METHOD",
                severity="WARN",
                setup_id=setup_id,
                field="slMethod",
                detail=f"Unknown SL method '{sl_method}'",
                remedy=f"Use one of: {valid_methods}",
            ))

        return issues

    def validate_tp_placement(self, setup: Dict[str, Any]) -> List[ValidationIssue]:
        """Validate the TP placement (Law-14 walk + 1.2× SL precondition)."""
        issues: List[ValidationIssue] = []
        setup_id = setup.get("setupId", "?")
        entry = setup.get("entry")
        sl = setup.get("sl")
        tp = setup.get("tp")
        pair = setup.get("pair", "EUR/USD")
        direction = setup.get("direction", "").upper()

        if entry is None or sl is None or tp is None:
            return issues

        # Law-14 precondition: TP >= 1.2 × SL distance
        sl_distance = abs(entry - sl)
        tp_distance = abs(tp - entry)
        if tp_distance < LAW_14_TP_TO_SL_RATIO_MIN * sl_distance:
            issues.append(ValidationIssue(
                rule="PHASE4_LAW_14_TP_PRECONDITION",
                severity="REJECT",
                setup_id=setup_id,
                field="tp",
                detail=f"TP distance {tp_distance:.5f} < {LAW_14_TP_TO_SL_RATIO_MIN}x SL distance {sl_distance:.5f} (Law-14 precondition failed)",
                remedy="TP must be at least 1.2x SL distance (viable-RRR bar)",
            ))

        # Single TP rule (no TP1/TP2/TP3)
        if "tp1" in setup and "tp2" in setup:
            issues.append(ValidationIssue(
                rule="PHASE4_SINGLE_TP",
                severity="REJECT",
                setup_id=setup_id,
                field="tp",
                detail="Multiple TPs detected (tp1 + tp2) — ONE TP per trade rule violated",
                remedy="Use single TP field; blended RRR is across 3 staggered entries, not multiple TPs",
            ))

        return issues

    def validate_rrr(self, setup: Dict[str, Any]) -> List[ValidationIssue]:
        """Validate the RRR floor (>=3.0 emission, >=3.5 executed, >=4.0 norm)."""
        issues: List[ValidationIssue] = []
        setup_id = setup.get("setupId", "?")
        entry = setup.get("entry")
        sl = setup.get("sl")
        tp = setup.get("tp")
        pair = setup.get("pair", "EUR/USD")
        direction = setup.get("direction", "").upper()
        primary_rrr = setup.get("primaryRrr") or setup.get("rrr")
        blended_rrr = setup.get("blendedRrr")
        maximum_rrr = setup.get("maximumRrr")

        if entry is None or sl is None or tp is None:
            return issues

        # Compute RRR if not provided
        if primary_rrr is None:
            risk = abs(entry - sl)
            reward = abs(tp - entry)
            if risk > 0:
                primary_rrr = reward / risk
            else:
                primary_rrr = 0

        # RRR floor (2026-07-31 operator ruling — IRON LAW)
        if primary_rrr < RRR_FLOOR_EMISSION:
            # Check if 3-attempt refinement was performed
            audit = setup.get("auditResults", {}) or {}
            repaired = audit.get("repaired", []) if isinstance(audit, dict) else []
            if len(repaired) >= 3:
                issues.append(ValidationIssue(
                    rule="ZT11_CONFIDENCE_65_RRR_FLOOR",
                    severity="REJECT",
                    setup_id=setup_id,
                    field="primaryRrr",
                    detail=f"RRR {primary_rrr:.2f} < emission floor {RRR_FLOOR_EMISSION} after 3 refinement attempts — HARD REJECT",
                    remedy="Setup has exhausted 3 refinement attempts; hard reject per R2 doctrine",
                ))
            else:
                issues.append(ValidationIssue(
                    rule="ZT11_CONFIDENCE_65_RRR_FLOOR",
                    severity="REJECT",
                    setup_id=setup_id,
                    field="primaryRrr",
                    detail=f"RRR {primary_rrr:.2f} < emission floor {RRR_FLOOR_EMISSION} (only {len(repaired)} refinement attempts)",
                    remedy="Run 3-attempt refinement (R2 doctrine) before hard reject",
                ))

        # Law-13 ceiling
        if primary_rrr > MAX_CHAIN_RRR_CEILING:
            issues.append(ValidationIssue(
                rule="PHASE4_LAW_13_RRR_CEILING",
                severity="REJECT",
                setup_id=setup_id,
                field="primaryRrr",
                detail=f"RRR {primary_rrr:.2f} > Law-13 ceiling {MAX_CHAIN_RRR_CEILING} — chains beyond 15R fill-and-stop",
                remedy="Cap RRR at 15; GU 1.34957 measured case",
            ))

        # Executed standard check (warning, not reject)
        if primary_rrr < RRR_FLOOR_EXECUTED:
            issues.append(ValidationIssue(
                rule="PHASE4_RRR_EXECUTED_STANDARD",
                severity="WARN",
                setup_id=setup_id,
                field="primaryRrr",
                detail=f"RRR {primary_rrr:.2f} < executed standard {RRR_FLOOR_EXECUTED} (operator's minimum is 3.5)",
                remedy="Tighten SL or extend TP to reach 3.5+",
            ))

        # Norm check (warning)
        if primary_rrr < RRR_FLOOR_NORM:
            issues.append(ValidationIssue(
                rule="PHASE4_RRR_NORM",
                severity="WARN",
                setup_id=setup_id,
                field="primaryRrr",
                detail=f"RRR {primary_rrr:.2f} < norm {RRR_FLOOR_NORM} (operator's average is 4.0-6.4x)",
                remedy="Tighten SL or extend TP to reach 4.0+",
            ))

        return issues

    # ----------------------------------------------------------------------
    # PHASE 5: Confidence + Quality
    # ----------------------------------------------------------------------

    def validate_confidence_quality(self, setup: Dict[str, Any]) -> List[ValidationIssue]:
        """Validate the confidence score and quality classification."""
        issues: List[ValidationIssue] = []
        setup_id = setup.get("setupId", "?")
        confidence = setup.get("confidenceScore", 0)
        quality = (setup.get("quality") or "").upper().replace("-", "_")
        rrr = setup.get("primaryRrr") or setup.get("rrr", 0)
        vlm_sourced = setup.get("vlmSourced", False)

        # ZT11: Confidence >= 65 required for inclusion
        if confidence < 65:
            issues.append(ValidationIssue(
                rule="ZT11_CONFIDENCE_65",
                severity="REJECT",
                setup_id=setup_id,
                field="confidenceScore",
                detail=f"Confidence {confidence} < 65 required for inclusion",
                remedy="Reject setup or strengthen confluence to >=65",
            ))

        # Quality classification check
        expected_quality = "REJECTED"
        if confidence >= 90 and rrr >= 3.0 and vlm_sourced:
            expected_quality = "GOD_TIER"
        elif confidence >= 80 and rrr >= 2.0:
            expected_quality = "HIGH"
        elif confidence >= 60 and rrr >= 1.5:
            expected_quality = "STANDARD"
        elif confidence >= 50:
            expected_quality = "CONDITIONAL"

        if quality != expected_quality and quality != "REJECTED":
            issues.append(ValidationIssue(
                rule="PHASE5_QUALITY_MISMATCH",
                severity="WARN",
                setup_id=setup_id,
                field="quality",
                detail=f"Quality '{quality}' doesn't match expected '{expected_quality}' (confidence={confidence}, rrr={rrr})",
                remedy=f"Reclassify as '{expected_quality}'",
            ))

        return issues

    # ----------------------------------------------------------------------
    # PHASE 6: Multi-Setup Architecture + Dedup
    # ----------------------------------------------------------------------

    def validate_dedup_identity(self, setups: List[Dict[str, Any]]) -> List[ValidationIssue]:
        """Validate the dedup identity (pair|direction|anchorBucket|day — NO session)."""
        issues: List[ValidationIssue] = []
        seen_identities: Dict[str, List[str]] = {}

        for setup in setups:
            setup_id = setup.get("setupId", "?")
            pair = setup.get("pair", "?")
            direction = setup.get("direction", "?").upper()
            entry = setup.get("entry", 0)
            day = setup.get("day", "?")

            # anchorBucket = round(anchor / (tolPips * PIP[pair]))
            tol_pips = 3  # all pairs
            pip_size = PIP_SIZE.get(pair, 0.0001)
            anchor_bucket = round(entry / (tol_pips * pip_size)) if pip_size > 0 else 0

            identity = f"{pair}|{direction}|{anchor_bucket}|{day}"

            if identity in seen_identities:
                # Duplicate detected
                original_id = seen_identities[identity][0]
                # Check if this is a stagger-leg merge (entries within 15 pips = same trade)
                original_entry = next(
                    (s.get("entry", 0) for s in setups if s.get("setupId") == original_id),
                    0
                )
                entry_diff_pips = price_to_pips(abs(entry - original_entry), pair)
                if entry_diff_pips <= D11_SIGNAL_SHARE_PIPS:
                    # Stagger leg merge — OK but should be flagged
                    issues.append(ValidationIssue(
                        rule="PHASE6_STAGGER_LEG_MERGE",
                        severity="WARN",
                        setup_id=setup_id,
                        field="entry",
                        detail=f"Setup merges with {original_id} (entry diff {entry_diff_pips:.1f}p <= {D11_SIGNAL_SHARE_PIPS}p) — stagger leg",
                        remedy="Merge into one UniqueTrade with staggered entries",
                    ))
                else:
                    # True duplicate — reject
                    issues.append(ValidationIssue(
                        rule="G2_DEDUP",
                        severity="REJECT",
                        setup_id=setup_id,
                        field="anchorZoneId+day",
                        detail=f"Duplicate identity {identity} (already emitted as {original_id})",
                        remedy="Drop this setup — anchorBucket+day identity already exists",
                    ))
            else:
                seen_identities[identity] = [setup_id]

        return issues

    def validate_emission_cap(self, setups: List[Dict[str, Any]]) -> List[ValidationIssue]:
        """Validate MAX_MIRRORS_PER_ANCHOR_PER_DAY = 1 (the GU-x10 destroyer)."""
        issues: List[ValidationIssue] = []
        cap_map: Dict[str, List[str]] = {}

        for setup in setups:
            setup_id = setup.get("setupId", "?")
            pair = setup.get("pair", "?")
            entry = setup.get("entry", 0)
            day = setup.get("day", "?")

            tol_pips = 3
            pip_size = PIP_SIZE.get(pair, 0.0001)
            anchor_bucket = round(entry / (tol_pips * pip_size)) if pip_size > 0 else 0

            cap_key = f"{pair}|{anchor_bucket}|{day}"

            if cap_key not in cap_map:
                cap_map[cap_key] = []
            cap_map[cap_key].append(setup_id)

        for cap_key, setup_ids in cap_map.items():
            if len(setup_ids) > MAX_MIRRORS_PER_ANCHOR_PER_DAY:
                # The first one is kept; the rest are dropped
                for setup_id in setup_ids[1:]:
                    issues.append(ValidationIssue(
                        rule="PHASE6_EMISSION_CAPPED",
                        severity="REJECT",
                        setup_id=setup_id,
                        field="anchorZoneId+day",
                        detail=f"Cap exceeded: {len(setup_ids)} setups at {cap_key} (max {MAX_MIRRORS_PER_ANCHOR_PER_DAY})",
                        remedy="Drop duplicate; first one kept (input order = strongest provenance)",
                    ))

        return issues

    # ----------------------------------------------------------------------
    # PHASE 7: Blind-Execution Labels (BE1-BE12)
    # ----------------------------------------------------------------------

    def validate_blind_exec_labels(self, setup: Dict[str, Any]) -> List[ValidationIssue]:
        """Validate BE1-BE12 (the 5 mandatory labels + catalysts)."""
        issues: List[ValidationIssue] = []
        setup_id = setup.get("setupId", "?")

        # BE1: DAY label
        if not setup.get("day"):
            issues.append(ValidationIssue(
                rule="BE1_DAY_LABEL", severity="REJECT", setup_id=setup_id,
                field="day", detail="Missing DAY label", remedy="Assign day via Phase 7",
            ))

        # BE2: SESSION WINDOW
        if not setup.get("sessionWindow"):
            issues.append(ValidationIssue(
                rule="BE2_SESSION_WINDOW", severity="REJECT", setup_id=setup_id,
                field="sessionWindow", detail="Missing SESSION WINDOW", remedy="Assign session via Phase 7.2",
            ))

        # BE3: SHAPE TRIGGER
        if not setup.get("shapeTrigger"):
            issues.append(ValidationIssue(
                rule="BE3_SHAPE_TRIGGER", severity="REJECT", setup_id=setup_id,
                field="shapeTrigger", detail="Missing SHAPE TRIGGER", remedy="Assign shape via Phase 7",
            ))

        # BE4: SETUP CATEGORY
        if not setup.get("category") and not setup.get("setupCategory"):
            issues.append(ValidationIssue(
                rule="BE4_SETUP_CATEGORY", severity="REJECT", setup_id=setup_id,
                field="category", detail="Missing SETUP CATEGORY", remedy="Assign category",
            ))

        # BE6: ANCHOR HIT WINDOW
        if not setup.get("anchorHitWindow"):
            issues.append(ValidationIssue(
                rule="BE6_ANCHOR_WHEN_WHERE", severity="WARN", setup_id=setup_id,
                field="anchorHitWindow", detail="Missing ANCHOR HIT WINDOW", remedy="Compute anchor hit window via Phase 7.3",
            ))

        # BE8: DAY CATALYSTS
        if not setup.get("dayCatalysts"):
            issues.append(ValidationIssue(
                rule="BE8_DAY_CATALYSTS", severity="WARN", setup_id=setup_id,
                field="dayCatalysts", detail="Missing DAY CATALYSTS", remedy="List economic events, session catalysts",
            ))

        # BE9: Reinforcement parent ref
        category = (setup.get("category") or setup.get("setupCategory") or "").lower()
        if "reinforcement" in category and not setup.get("parentSetupId"):
            issues.append(ValidationIssue(
                rule="BE9_REINFORCEMENT_PARENT", severity="REJECT", setup_id=setup_id,
                field="parentSetupId", detail="Reinforcement entry missing PARENT TRADE REFERENCE", remedy="Link to parent setup",
            ))

        return issues

    # ----------------------------------------------------------------------
    # PHASE 8: Red Folder Deferral
    # ----------------------------------------------------------------------

    def validate_red_folder_deferral(self, setup: Dict[str, Any]) -> List[ValidationIssue]:
        """Validate 30-min Red Folder Deferral."""
        issues: List[ValidationIssue] = []
        setup_id = setup.get("setupId", "?")
        day_catalysts = setup.get("dayCatalysts", [])
        session_window = setup.get("sessionWindow", "")

        # If dayCatalysts mention "Red Folder" — verify session has 30-min deferral
        has_red_folder = any("Red Folder" in c or "red folder" in c.lower() for c in day_catalysts)
        if has_red_folder:
            if "30 min" not in session_window.lower() and "deferred" not in session_window.lower():
                issues.append(ValidationIssue(
                    rule="ZT10_RED_FOLDER_DEFERRAL", severity="WARN", setup_id=setup_id,
                    field="sessionWindow", detail="Red Folder event present but no 30-min deferral applied",
                    remedy="Defer session window by 30 minutes",
                ))

        return issues

    # ----------------------------------------------------------------------
    # PHASE 9: Reinforcement Architecture
    # ----------------------------------------------------------------------

    def validate_reinforcement_architecture(self, setups: List[Dict[str, Any]]) -> List[ValidationIssue]:
        """Validate Phase 9 — reinforcement entries per parent swing."""
        issues: List[ValidationIssue] = []
        parent_reinforcements: Dict[str, List[str]] = {}

        for setup in setups:
            category = (setup.get("category") or setup.get("setupCategory") or "").lower()
            if "reinforcement" in category:
                parent_id = setup.get("parentSetupId")
                if parent_id:
                    if parent_id not in parent_reinforcements:
                        parent_reinforcements[parent_id] = []
                    parent_reinforcements[parent_id].append(setup.get("setupId", "?"))

        # Max 3 rockets per trade
        for parent_id, rocket_ids in parent_reinforcements.items():
            if len(rocket_ids) > MAX_ROCKETS_PER_TRADE:
                issues.append(ValidationIssue(
                    rule="PHASE9_MAX_ROCKETS", severity="REJECT", setup_id=parent_id,
                    field="reinforcements",
                    detail=f"Parent {parent_id} has {len(rocket_ids)} rockets > max {MAX_ROCKETS_PER_TRADE}",
                    remedy="Cap reinforcements at 3 per parent trade (recommended 2)",
                ))

        return issues

    # ----------------------------------------------------------------------
    # PHASE 10: Cascade Mirror (DXY -> EU -> GU)
    # ----------------------------------------------------------------------

    def validate_cascade_mirror(self, setups: List[Dict[str, Any]]) -> List[ValidationIssue]:
        """Validate the cascade mirror — DXY->EU inverse, EU->GU kept."""
        issues: List[ValidationIssue] = []

        # Group by cascade source
        dxy_setups = [s for s in setups if is_dxy(s.get("pair", ""))]
        eu_setups = [s for s in setups if is_eu(s.get("pair", ""))]
        gu_setups = [s for s in setups if is_gu(s.get("pair", ""))]

        # f(T) acceptance: |all_setups| >= 24 minimum (8 DXY + 8 EU + 8 GU)
        # MORE is fine, LESS is REJECT
        if len(dxy_setups) < 8:
            issues.append(ValidationIssue(
                rule="PHASE10_F_T_ACCEPTANCE", severity="CRITICAL", setup_id=None,
                field="pair",
                detail=f"DXY setups count {len(dxy_setups)} < 8 minimum (f(T) acceptance)",
                remedy="Generate more DXY setups — minimum 8 per week",
            ))
        if len(eu_setups) < 8:
            issues.append(ValidationIssue(
                rule="PHASE10_F_T_ACCEPTANCE", severity="CRITICAL", setup_id=None,
                field="pair",
                detail=f"EU setups count {len(eu_setups)} < 8 minimum (f(T) acceptance — cascade mirror)",
                remedy="Generate EU mirror setups from DXY source — minimum 8 per week",
            ))
        if len(gu_setups) < 7:  # GU may have 7 (one trade did not materialize)
            issues.append(ValidationIssue(
                rule="PHASE10_F_T_ACCEPTANCE", severity="CRITICAL", setup_id=None,
                field="pair",
                detail=f"GU setups count {len(gu_setups)} < 7 minimum (f(T) acceptance — cascade mirror)",
                remedy="Generate GU mirror setups from EU source — minimum 7 per week",
            ))

        # Check cascade direction
        for eu in eu_setups:
            cascade_source = eu.get("cascadeSource", "native")
            if cascade_source == "DXY→EU":
                # Direction should be INVERTED from corresponding DXY setup
                dxy_setup_id = eu.get("parentSetupId")  # the DXY source
                if dxy_setup_id:
                    dxy_source = next((s for s in dxy_setups if s.get("setupId") == dxy_setup_id), None)
                    if dxy_source:
                        dxy_dir = dxy_source.get("direction", "").upper()
                        eu_dir = eu.get("direction", "").upper()
                        if dxy_dir == eu_dir:
                            issues.append(ValidationIssue(
                                rule="PHASE10_CASCADE_DIRECTION", severity="CRITICAL",
                                setup_id=eu.get("setupId"), field="direction",
                                detail=f"EU mirror direction '{eu_dir}' matches DXY source '{dxy_dir}' — should be INVERTED",
                                remedy="Invert EU mirror direction (DXY LONG -> EU SHORT)",
                            ))

        for gu in gu_setups:
            cascade_source = gu.get("cascadeSource", "native")
            if cascade_source == "EU→GU":
                # Direction should be KEPT from corresponding EU setup
                eu_setup_id = gu.get("parentSetupId")
                if eu_setup_id:
                    eu_source = next((s for s in eu_setups if s.get("setupId") == eu_setup_id), None)
                    if eu_source:
                        eu_dir = eu_source.get("direction", "").upper()
                        gu_dir = gu.get("direction", "").upper()
                        if eu_dir != gu_dir:
                            issues.append(ValidationIssue(
                                rule="PHASE10_CASCADE_DIRECTION", severity="CRITICAL",
                                setup_id=gu.get("setupId"), field="direction",
                                detail=f"GU mirror direction '{gu_dir}' differs from EU source '{eu_dir}' — should be KEPT",
                                remedy="Keep GU mirror direction (EU LONG -> GU LONG)",
                            ))

        # 35% divergence rule (FLAG ONLY)
        if self.shape_prediction:
            chain = self.shape_prediction.get("shapeChain", {})
            days = chain.get("days", [])
            if days:
                # Compute divergence (simplified)
                divergence = 0.0  # would be computed by computeChainDivergence
                # If translatedDays present:
                translated = self.shape_prediction.get("translatedDays", {})
                if translated:
                    divergence = translated.get("divergence", 0.0)
                    if divergence > DIVERGENCE_THRESHOLD:
                        issues.append(ValidationIssue(
                            rule="PHASE10_CASCADE_DRIFT", severity="WARN", setup_id=None,
                            field="divergence",
                            detail=f"Cascade divergence {divergence:.2f} > threshold {DIVERGENCE_THRESHOLD} — FLAGGED (pair E2 stands)",
                            remedy="Flag only — cascade VALIDATES, never designates",
                        ))

        return issues

    # ----------------------------------------------------------------------
    # PHASE 11: Avatar State Construction
    # ----------------------------------------------------------------------

    def validate_avatar_state(self, setup: Dict[str, Any]) -> List[ValidationIssue]:
        """Validate Phase 11 — Avatar State construction."""
        issues: List[ValidationIssue] = []
        setup_id = setup.get("setupId", "?")
        avatar_state = setup.get("avatarState", False)
        quality = (setup.get("quality") or "").upper()

        # If avatarState = true, all 4 elements must converge
        if avatar_state:
            # Earth: liquidity zone + IP zone
            anchor_zone = (setup.get("anchorZoneClassification") or "").upper()
            if "LQZ" not in anchor_zone and "IP" not in anchor_zone:
                issues.append(ValidationIssue(
                    rule="PHASE11_AVATAR_EARTH", severity="WARN", setup_id=setup_id,
                    field="anchorZoneClassification",
                    detail="Avatar State requires Earth (Liq/IP zone) but anchor is not LQZ/IP",
                    remedy="Avatar State requires Earth+Fire+Water+Air convergence",
                ))

            # Fire: S/D overlap
            if "BOM" not in anchor_zone and "MOM" not in anchor_zone:
                issues.append(ValidationIssue(
                    rule="PHASE11_AVATAR_FIRE", severity="WARN", setup_id=setup_id,
                    field="anchorZoneClassification",
                    detail="Avatar State requires Fire (S/D zone) but anchor is not BoM/MoM",
                    remedy="Avatar State requires Earth+Fire+Water+Air convergence",
                ))

            # Water: macro shape confirmation
            shape_trigger = setup.get("shapeTrigger", "")
            if not shape_trigger:
                issues.append(ValidationIssue(
                    rule="PHASE11_AVATAR_WATER", severity="WARN", setup_id=setup_id,
                    field="shapeTrigger",
                    detail="Avatar State requires Water (macro shape confirmation) but shape missing",
                    remedy="Avatar State requires Earth+Fire+Water+Air convergence",
                ))

            # Air: Fibonacci alignment
            audit = setup.get("tpAudit", "")
            if "fib" not in audit.lower() and "1.382" not in audit and "1.618" not in audit:
                issues.append(ValidationIssue(
                    rule="PHASE11_AVATAR_AIR", severity="WARN", setup_id=setup_id,
                    field="tpAudit",
                    detail="Avatar State requires Air (Fibonacci spiderweb) but no Fib reference in audit",
                    remedy="Avatar State requires Earth+Fire+Water+Air convergence",
                ))

        # Avatar State is only valid for GOD_TIER quality
        if avatar_state and quality != "GOD_TIER":
            issues.append(ValidationIssue(
                rule="PHASE11_AVATAR_QUALITY", severity="WARN", setup_id=setup_id,
                field="quality",
                detail=f"Avatar State marked but quality '{quality}' is not GOD_TIER",
                remedy="Avatar State requires GOD_TIER quality",
            ))

        return issues

    # ----------------------------------------------------------------------
    # PHASE 12: 3D Refinement Audit
    # ----------------------------------------------------------------------

    def validate_3d_audit(self, setup: Dict[str, Any]) -> List[ValidationIssue]:
        """Validate Phase 12 — 3D refinement audit results."""
        issues: List[ValidationIssue] = []
        setup_id = setup.get("setupId", "?")
        audit = setup.get("auditResults")

        if not audit:
            # 3D audit not performed — warn
            issues.append(ValidationIssue(
                rule="PHASE12_3D_AUDIT", severity="WARN", setup_id=setup_id,
                field="auditResults",
                detail="3D refinement audit (P1-P8/C1-C6/T1-T8) not performed",
                remedy="Run auditSetup3D before emitting",
            ))
            return issues

        if isinstance(audit, dict):
            passed = audit.get("passed", False)
            if not passed:
                # Check if repaired
                repaired = audit.get("repaired", [])
                if len(repaired) >= 3:
                    issues.append(ValidationIssue(
                        rule="PHASE12_3D_AUDIT_FAILED", severity="REJECT", setup_id=setup_id,
                        field="auditResults",
                        detail=f"3D audit failed after 3 repair attempts — HARD REJECT",
                        remedy="Setup has exhausted 3 refinement attempts; hard reject",
                    ))
                else:
                    issues.append(ValidationIssue(
                        rule="PHASE12_3D_AUDIT_REPAIR", severity="WARN", setup_id=setup_id,
                        field="auditResults",
                        detail=f"3D audit failed with {len(repaired)} repair attempts — run R2 refinement",
                        remedy="Run refineSetup on SAME anchors (entry fixed, re-anchor SL/TP)",
                    ))

        return issues

    # ----------------------------------------------------------------------
    # 6-Check Direction Validation
    # ----------------------------------------------------------------------

    def validate_6_check_direction(self, setup: Dict[str, Any]) -> List[ValidationIssue]:
        """Validate the 6-check direction validation."""
        issues: List[ValidationIssue] = []
        setup_id = setup.get("setupId", "?")
        dir_val = setup.get("directionValidation")

        if not dir_val:
            issues.append(ValidationIssue(
                rule="ZT2_DIRECTION_VALIDATION", severity="REJECT", setup_id=setup_id,
                field="directionValidation",
                detail="Missing 6-check direction validation",
                remedy="Run 6-check (4H trend / BoM alignment / liquidity sweep / zone failure / macro shape / counter-trend)",
            ))
            return issues

        if isinstance(dir_val, dict):
            checks_agree = dir_val.get("checksAgree", 0)
            consensus = (dir_val.get("consensus") or "").upper()
            direction = (setup.get("direction") or "").upper()

            # If 4+ of 6 disagree -> REVERSE
            disagree_count = 6 - checks_agree
            if disagree_count >= DIRECTION_DISAGREE_THRESHOLD:
                if consensus != invert_direction(direction):
                    issues.append(ValidationIssue(
                        rule="ZT2_DIRECTION_VALIDATION", severity="REJECT", setup_id=setup_id,
                        field="direction",
                        detail=f"4+ of 6 checks disagree (count={disagree_count}); consensus='{consensus}' should equal inverted direction",
                        remedy="REVERSE the setup direction OR reject if no reversal pattern",
                    ))

        return issues

    # ----------------------------------------------------------------------
    # Golden Oracle (the operator's July 6-10 2026 levels)
    # ----------------------------------------------------------------------

    def validate_golden_oracle(self, setups: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Validate against the operator's golden levels (July 6-10 2026)."""
        report = {
            "dxy_matches": [],
            "dxy_misses": [],
            "eu_matches": [],
            "eu_misses": [],
            "gu_matches": [],
            "gu_misses": [],
            "match_count": 0,
            "total_count": 0,
            "match_rate": 0.0,
        }

        # Check DXY setups against golden DXY trades
        golden_dxy_entries = [t["entry"] for t in GOLDEN_DXY_TRADES if t["entry"] is not None]
        dxy_setups = [s for s in setups if is_dxy(s.get("pair", ""))]

        for golden_entry in golden_dxy_entries:
            report["total_count"] += 1
            best_match = None
            best_diff_pips = float("inf")
            for setup in dxy_setups:
                setup_entry = setup.get("entry")
                if setup_entry is None:
                    continue
                diff_pips = price_to_pips(abs(setup_entry - golden_entry), "DXY")
                if diff_pips < best_diff_pips:
                    best_diff_pips = diff_pips
                    best_match = setup.get("setupId")

            if best_diff_pips <= GOLDEN_LEVEL_TOLERANCE_PIPS:
                report["dxy_matches"].append({
                    "golden_entry": golden_entry,
                    "matched_setup_id": best_match,
                    "diff_pips": best_diff_pips,
                })
                report["match_count"] += 1
            else:
                report["dxy_misses"].append({
                    "golden_entry": golden_entry,
                    "closest_setup_id": best_match,
                    "diff_pips": best_diff_pips,
                })

        # Check DXY LQZ levels
        lqz_match_count = 0
        for golden_lqz in GOLDEN_DXY_LQZ_LEVELS:
            for setup in dxy_setups:
                setup_entry = setup.get("entry")
                if setup_entry is None:
                    continue
                if is_within_tolerance(setup_entry, golden_lqz, GOLDEN_LEVEL_TOLERANCE_PIPS, "DXY"):
                    lqz_match_count += 1
                    break

        report["lqz_match_count"] = lqz_match_count
        report["lqz_total_count"] = len(GOLDEN_DXY_LQZ_LEVELS)
        report["lqz_match_rate"] = lqz_match_count / len(GOLDEN_DXY_LQZ_LEVELS) if GOLDEN_DXY_LQZ_LEVELS else 0

        # Match rate
        if report["total_count"] > 0:
            report["match_rate"] = report["match_count"] / report["total_count"]

        return report

    # ----------------------------------------------------------------------
    # MAIN VALIDATION PIPELINE
    # ----------------------------------------------------------------------

    def validate(self) -> AggregateReport:
        """Run all validators and produce the aggregate report."""
        report = AggregateReport()
        report.total_setups = len(self.setups)

        # Validate each setup
        for setup in self.setups:
            setup_result = SetupValidationResult(setup_id=setup.get("setupId", "?"), passed=True)
            setup_issues: List[ValidationIssue] = []

            # Phase 0
            setup_issues.extend(self.validate_setup_universe(setup))
            # Phase 1 — Day Assignment
            setup_issues.extend(self.validate_day_assignment(setup))
            # Phase 2 — R3 Law + direction-appropriate anchor + structural entry + freshness
            setup_issues.extend(self.validate_r3_law(setup))
            setup_issues.extend(self.validate_direction_appropriate_anchor(setup))
            setup_issues.extend(self.validate_structural_entry_source(setup))
            setup_issues.extend(self.validate_freshness_gate(setup))
            # Phase 3 — Sniper entry
            setup_issues.extend(self.validate_sniper_entry(setup))
            # Phase 4 — SL/TP/RRR
            setup_issues.extend(self.validate_sl_placement(setup))
            setup_issues.extend(self.validate_tp_placement(setup))
            setup_issues.extend(self.validate_rrr(setup))
            # Phase 5 — Confidence + Quality
            setup_issues.extend(self.validate_confidence_quality(setup))
            # Phase 7 — Blind-exec labels
            setup_issues.extend(self.validate_blind_exec_labels(setup))
            # Phase 8 — Red folder deferral
            setup_issues.extend(self.validate_red_folder_deferral(setup))
            # Phase 11 — Avatar State
            setup_issues.extend(self.validate_avatar_state(setup))
            # Phase 12 — 3D Audit
            setup_issues.extend(self.validate_3d_audit(setup))
            # 6-check direction validation
            setup_issues.extend(self.validate_6_check_direction(setup))

            # Aggregate
            setup_result.issues = setup_issues
            has_reject = any(i.severity in ("REJECT", "CRITICAL") for i in setup_issues)
            has_warn = any(i.severity == "WARN" for i in setup_issues)
            setup_result.passed = not has_reject
            if has_reject:
                setup_result.rejection_reason = next(
                    (i.detail for i in setup_issues if i.severity in ("REJECT", "CRITICAL")),
                    "Unknown rejection"
                )
                report.rejected_setups += 1
            elif has_warn:
                report.warned_setups += 1
            else:
                report.passed_setups += 1

            report.per_setup.append(setup_result)
            report.issues.extend(setup_issues)

            # Track R3 law violations
            if any(i.rule == "ZT15_R3_LAW" and i.severity == "CRITICAL" for i in setup_issues):
                report.r3_law_violations += 1

            # Track Avatar State setups
            if setup.get("avatarState"):
                report.avatar_state_setups += 1

        # Cross-setup validators
        cross_issues: List[ValidationIssue] = []
        cross_issues.extend(self.validate_dedup_identity(self.setups))
        cross_issues.extend(self.validate_emission_cap(self.setups))
        cross_issues.extend(self.validate_reinforcement_architecture(self.setups))
        cross_issues.extend(self.validate_cascade_mirror(self.setups))
        report.issues.extend(cross_issues)

        # f(T) acceptance
        dxy_count = sum(1 for s in self.setups if is_dxy(s.get("pair", "")))
        eu_count = sum(1 for s in self.setups if is_eu(s.get("pair", "")))
        gu_count = sum(1 for s in self.setups if is_gu(s.get("pair", "")))
        report.f_t_acceptance = {
            "dxy": dxy_count,
            "eu": eu_count,
            "gu": gu_count,
            "total": len(self.setups),
            "minimum": F_T_ACCEPTANCE_MIN,
            "passes": (dxy_count + eu_count + gu_count) >= F_T_ACCEPTANCE_MIN,
        }

        # Golden oracle
        report.golden_oracle_match = self.validate_golden_oracle(self.setups)

        # Determine exit code
        has_critical = any(i.severity == "CRITICAL" for i in report.issues)
        has_reject = any(i.severity == "REJECT" for i in report.issues)
        has_warn = any(i.severity == "WARN" for i in report.issues)

        if has_critical or (report.f_t_acceptance and not report.f_t_acceptance["passes"]):
            report.exit_code = 3
        elif has_reject:
            report.exit_code = 2
        elif has_warn:
            report.exit_code = 1
        else:
            report.exit_code = 0

        return report


# ============================================================================
# CLI ENTRY POINT
# ============================================================================

def load_input(path: str) -> Dict[str, Any]:
    """Load the input JSON file."""
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def format_report(report: AggregateReport) -> str:
    """Format the report for human-readable output."""
    lines = []
    lines.append("=" * 80)
    lines.append("TRIDENT E3 VALIDATOR — VALIDATION REPORT")
    lines.append("=" * 80)
    lines.append("")
    lines.append(f"Total setups:     {report.total_setups}")
    lines.append(f"Passed:           {report.passed_setups}")
    lines.append(f"Rejected:         {report.rejected_setups}")
    lines.append(f"Warned:          {report.warned_setups}")
    lines.append(f"R3 Law violations: {report.r3_law_violations}")
    lines.append(f"Avatar State setups: {report.avatar_state_setups}")
    lines.append("")

    if report.f_t_acceptance:
        lines.append("f(T) Acceptance:")
        lines.append(f"  DXY: {report.f_t_acceptance['dxy']} (min 8)")
        lines.append(f"  EU:  {report.f_t_acceptance['eu']} (min 8)")
        lines.append(f"  GU:  {report.f_t_acceptance['gu']} (min 7)")
        lines.append(f"  Total: {report.f_t_acceptance['total']} (min {report.f_t_acceptance['minimum']})")
        lines.append(f"  Passes: {'YES' if report.f_t_acceptance['passes'] else 'NO'}")
        lines.append("")

    if report.golden_oracle_match:
        go = report.golden_oracle_match
        lines.append("Golden Oracle (operator's July 6-10 2026 levels):")
        lines.append(f"  DXY trade matches: {go['match_count']}/{go['total_count']} ({go['match_rate']:.1%})")
        lines.append(f"  DXY LQZ matches:    {go.get('lqz_match_count', 0)}/{go.get('lqz_total_count', 0)} ({go.get('lqz_match_rate', 0):.1%})")
        if go["dxy_misses"]:
            lines.append(f"  DXY misses:")
            for miss in go["dxy_misses"]:
                lines.append(f"    Golden {miss['golden_entry']:.5f} -> closest {miss['closest_setup_id']} Δ{miss['diff_pips']:.1f}p")
        lines.append("")

    # Per-setup summary
    if report.per_setup:
        lines.append("Per-Setup Summary:")
        for psr in report.per_setup:
            status = "✓ PASS" if psr.passed else "✗ REJECT"
            lines.append(f"  {status}  {psr.setup_id}")
            if psr.rejection_reason:
                lines.append(f"           Reason: {psr.rejection_reason}")
            for issue in psr.issues:
                if issue.severity in ("REJECT", "CRITICAL"):
                    lines.append(f"           [{issue.severity}] {issue.rule}: {issue.detail}")
        lines.append("")

    # Cross-setup issues
    cross_issues = [i for i in report.issues if i.setup_id is None]
    if cross_issues:
        lines.append("Cross-Setup Issues:")
        for issue in cross_issues:
            lines.append(f"  [{issue.severity}] {issue.rule}: {issue.detail}")
        lines.append("")

    lines.append("=" * 80)
    exit_codes = {0: "ALL PASS", 1: "WARNINGS", 2: "REJECTIONS", 3: "CRITICAL"}
    lines.append(f"VERDICT: {exit_codes.get(report.exit_code, 'UNKNOWN')} (exit code {report.exit_code})")
    lines.append("=" * 80)

    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(
        description="Trident E3 Validator — grade and reject slop trades",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Exit codes:
  0 = ALL PASS
  1 = WARNINGS (>=1 setup has warnings, but no hard rejects)
  2 = REJECTIONS (>=1 setup hard-rejected)
  3 = CRITICAL (R3 law violation, f(T) < 24, golden oracle failed)

Examples:
  python trident_e3_validator.py --input setups.json --week 2026-07-06
  python trident_e3_validator.py --input setups.json --golden-oracle
  python trident_e3_validator.py --input setups.json --strict
        """,
    )
    parser.add_argument("--input", required=True, help="Path to the setups JSON file")
    parser.add_argument("--week", help="Week start date (YYYY-MM-DD)")
    parser.add_argument("--golden-oracle", action="store_true", help="Validate against the golden oracle")
    parser.add_argument("--strict", action="store_true", help="Strict mode (warnings become rejections)")
    parser.add_argument("--json-output", action="store_true", help="Output as JSON instead of human-readable")
    args = parser.parse_args()

    input_data = load_input(args.input)

    # Extract setups + optional zone map + shape prediction
    setups = input_data.get("setups") or input_data.get("tradeSetups") or []
    zone_map = input_data.get("zoneMap") or input_data.get("zoneMapSnapshot") or {}
    shape_prediction = input_data.get("shapePrediction") or {}

    validator = TridentE3Validator(
        setups=setups,
        zone_map=zone_map,
        shape_prediction=shape_prediction,
        week_start=args.week,
        strict=args.strict,
    )

    report = validator.validate()

    if args.strict:
        # Promote all WARN to REJECT
        for issue in report.issues:
            if issue.severity == "WARN":
                issue.severity = "REJECT"
        # Recompute exit code
        has_critical = any(i.severity == "CRITICAL" for i in report.issues)
        has_reject = any(i.severity == "REJECT" for i in report.issues)
        if has_critical:
            report.exit_code = 3
        elif has_reject:
            report.exit_code = 2

    if args.json_output:
        # Output as JSON
        output = {
            "total_setups": report.total_setups,
            "passed_setups": report.passed_setups,
            "rejected_setups": report.rejected_setups,
            "warned_setups": report.warned_setups,
            "r3_law_violations": report.r3_law_violations,
            "avatar_state_setups": report.avatar_state_setups,
            "f_t_acceptance": report.f_t_acceptance,
            "golden_oracle_match": report.golden_oracle_match,
            "exit_code": report.exit_code,
            "issues": [
                {
                    "rule": i.rule,
                    "severity": i.severity,
                    "setup_id": i.setup_id,
                    "field": i.field,
                    "detail": i.detail,
                    "remedy": i.remedy,
                }
                for i in report.issues
            ],
        }
        print(json.dumps(output, indent=2))
    else:
        print(format_report(report))

    sys.exit(report.exit_code)


if __name__ == "__main__":
    main()
