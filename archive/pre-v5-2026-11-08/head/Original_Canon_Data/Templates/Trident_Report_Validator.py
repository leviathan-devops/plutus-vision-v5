#!/usr/bin/env python3
"""
TRIDENT REPORT VALIDATOR — ALGORITHMIC FIREWALL v1.0
=====================================================
This script validates a Trident trading report HTML file against mandatory
structural and content requirements. It catches omissions that the system
prompt alone fails to prevent.

RUN THIS BEFORE DELIVERING ANY REPORT. ZERO TOLERANCE.

Usage:
    python3 Trident_Report_Validator.py <report.html>

Exit codes:
    0 = ALL CHECKS PASSED
    1 = CRITICAL FAILURES (report is UNDELIVERABLE)
    2 = WARNINGS ONLY (report is deliverable but imperfect)
"""

import sys
import re
import os
from html.parser import HTMLParser
from dataclasses import dataclass, field
from typing import List, Tuple, Optional, Dict


# ════════════════════════════════════════════════════════════
# DATA STRUCTURES
# ════════════════════════════════════════════════════════════

@dataclass
class ValidationResult:
    check_id: str
    category: str
    description: str
    severity: str  # "CRITICAL", "HIGH", "MEDIUM", "LOW"
    passed: bool
    details: str = ""
    fix_hint: str = ""


@dataclass
class TradeSetup:
    """Parsed trade setup from HTML"""
    raw_text: str
    title: str = ""
    fields: Dict[str, str] = field(default_factory=dict)
    section: str = ""
    
    @property
    def has_entry(self) -> bool:
        return "Entry" in self.fields and self.fields["Entry"].strip() not in ("—", "", "N/A")
    
    @property
    def has_sl(self) -> bool:
        return "SL" in self.fields and self.fields["SL"].strip() not in ("—", "", "N/A")
    
    @property
    def has_tp(self) -> bool:
        # Check for TP, TP1, TP2, TP3 — any TP field counts
        for key in self.fields:
            if key.startswith("TP") and self.fields[key].strip() not in ("—", "", "N/A"):
                return True
        return False
    
    @property
    def has_rrr(self) -> bool:
        for key in self.fields:
            if "RRR" in key and self.fields[key].strip() not in ("—", "", "N/A"):
                return True
        return False
    
    @property
    def has_direction(self) -> bool:
        return "Direction" in self.fields and self.fields["Direction"].strip() in ("LONG", "SHORT")
    
    @property
    def has_day(self) -> bool:
        """Check if title or fields contain a day-of-week reference"""
        days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday",
                "Mon", "Tue", "Wed", "Thu", "Fri"]
        text = self.title + " " + " ".join(self.fields.values())
        return any(d in text for d in days)
    
    @property
    def has_session(self) -> bool:
        return "Session" in self.fields and self.fields["Session"].strip() not in ("—", "", "N/A")
    
    @property
    def has_confidence(self) -> bool:
        return "Confidence" in self.fields and self.fields["Confidence"].strip() not in ("—", "", "N/A")


# ════════════════════════════════════════════════════════════
# HTML PARSER
# ════════════════════════════════════════════════════════════

class TridentReportParser(HTMLParser):
    """Parse the Trident report HTML to extract trade setups and tables"""
    
    def __init__(self):
        super().__init__()
        self.trade_setups: List[TradeSetup] = []
        self.current_setup: Optional[TradeSetup] = None
        self.tables: List[Dict] = []
        self.current_table: Optional[Dict] = None
        self.current_row: List[str] = []
        self.current_cell: str = ""
        self.in_setup_label = False
        self.in_setup_value = False
        self.in_setup_hdr = False
        self.in_th = False
        self.in_td = False
        self.current_label = ""
        self.current_section = ""
        self.all_text = ""
        self.execution_calendar_headers: List[str] = []
        self.execution_calendar_rows: List[List[str]] = []
        self.found_calendar = False
        self.notes_text: List[str] = []
        self.in_note = False
        
    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        
        if tag == "table":
            self.current_table = {"headers": [], "rows": []}
        elif tag == "h2":
            self.in_setup_hdr = False  # reset
        elif tag == "h4" and "setup-hdr" in attrs_dict.get("class", ""):
            self.in_setup_hdr = True
            self.current_setup = TradeSetup(raw_text="", section=self.current_section)
        elif tag == "td" and "setup-label" in attrs_dict.get("class", ""):
            self.in_setup_label = True
            self.current_label = ""
        elif tag == "td" and "setup-value" in attrs_dict.get("class", ""):
            self.in_setup_value = True
        elif tag == "th":
            self.in_th = True
            self.current_cell = ""
        elif tag == "td" and not "setup-" in attrs_dict.get("class", ""):
            self.in_td = True
            self.current_cell = ""
        elif tag == "div" and "note" in attrs_dict.get("class", ""):
            self.in_note = True
            self.notes_text.append("")
            
    def handle_endtag(self, tag):
        if tag == "h4" and self.in_setup_hdr:
            self.in_setup_hdr = False
            if self.current_setup:
                self.current_setup.title = self.current_setup.raw_text.strip()
                
        elif tag == "td" and self.in_setup_label:
            self.in_setup_label = False
            self.current_label = self.current_cell.strip()
            
        elif tag == "td" and self.in_setup_value:
            self.in_setup_value = False
            if self.current_setup and self.current_label:
                self.current_setup.fields[self.current_label] = self.current_cell.strip()
            self.current_cell = ""
            
        elif tag == "th":
            self.in_th = False
            if self.current_table is not None:
                self.current_table.get("headers", []).append(self.current_cell.strip())
            self.current_cell = ""
            
        elif tag == "td" and self.in_td:
            self.in_td = False
            self.current_row.append(self.current_cell.strip())
            self.current_cell = ""
            
        elif tag == "tr":
            if self.current_row:
                if self.current_table is not None:
                    self.current_table["rows"].append(self.current_row)
                    # Check if this is the execution calendar
                    if self.found_calendar and self.current_table.get("headers"):
                        self.execution_calendar_rows.append(self.current_row)
                self.current_row = []
                
        elif tag == "table":
            if self.current_table and self.current_table.get("headers"):
                self.tables.append(self.current_table)
                # Check if this is the execution calendar
                headers = self.current_table.get("headers", [])
                if any("Entry" in h for h in headers) and any("Day" in h for h in headers) and any("Shape" in h for h in headers):
                    self.found_calendar = True
                    self.execution_calendar_headers = headers
                    self.execution_calendar_rows = self.current_table.get("rows", [])
            self.current_table = None
            
        elif tag == "div":
            self.in_note = False
            
        # Finalize setup block on closing
        elif tag == "div" and self.current_setup and self.current_setup.fields:
            self.trade_setups.append(self.current_setup)
            self.current_setup = None
            
    def handle_data(self, data):
        self.all_text += data
        
        if self.in_setup_hdr and self.current_setup:
            self.current_setup.raw_text += data
            
        if self.in_setup_label or self.in_setup_value:
            self.current_cell += data
            
        if self.in_th or self.in_td:
            self.current_cell += data
            
        if self.in_note and self.notes_text:
            self.notes_text[-1] += data


# ════════════════════════════════════════════════════════════
# VALIDATION ENGINE
# ════════════════════════════════════════════════════════════

class TridentValidator:
    """Main validation engine"""
    
    def __init__(self, html_path: str):
        self.html_path = html_path
        self.html_content = ""
        self.parser = TridentReportParser()
        self.results: List[ValidationResult] = []
        self.trade_setups: List[TradeSetup] = []
        
    def load(self):
        with open(self.html_path, 'r', encoding='utf-8') as f:
            self.html_content = f.read()
        self.parser.feed(self.html_content)
        self.trade_setups = self.parser.trade_setups
        
    def validate(self) -> List[ValidationResult]:
        """Run all validation checks"""
        self._check_trade_setup_completeness()
        self._check_execution_calendar_has_sl_tp()
        self._check_no_data_not_published_for_past_days()
        self._check_ssideways_squeeze_forbidden()
        self._check_shape_setup_pipeline()
        self._check_both_directions_ss_days()
        self._check_boM_mom_labels()
        self._check_rrr_values()
        self._check_direction_validation()
        self._check_forbidden_phrases()
        self._check_table_page_break_css()
        self._check_monday_tuesday_data_populated()
        self._check_setup_categories()
        return self.results
    
    def _add_result(self, check_id, category, description, severity, passed, details="", fix_hint=""):
        self.results.append(ValidationResult(
            check_id=check_id, category=category, description=description,
            severity=severity, passed=passed, details=details, fix_hint=fix_hint
        ))
    
    # ── CHECK 1: Every trade setup must have Entry + SL + TP ──
    def _check_trade_setup_completeness(self):
        """CRITICAL: Every trade setup must have Direction, Entry, SL, TP, RRR, Day, Session, Confidence"""
        required_fields = {
            "Direction": lambda s: s.has_direction,
            "Entry": lambda s: s.has_entry,
            "SL": lambda s: s.has_sl,
            "TP": lambda s: s.has_tp,
            "RRR": lambda s: s.has_rrr,
            "Day": lambda s: s.has_day,
            "Session": lambda s: s.has_session,
            "Confidence": lambda s: s.has_confidence,
        }
        
        missing_setups = []
        for setup in self.trade_setups:
            missing = []
            for field_name, check_fn in required_fields.items():
                if not check_fn(setup):
                    missing.append(field_name)
            if missing:
                missing_setups.append((setup.title, missing))
        
        if missing_setups:
            details = "; ".join([f"'{title}' missing: {', '.join(missing)}" for title, missing in missing_setups])
            self._add_result(
                "V01", "Trade Setup Completeness",
                "Every trade setup must have Direction + Entry + SL + TP + RRR + Day + Session + Confidence",
                "CRITICAL", False, details,
                "Add missing fields to each setup block. A trade setup without SL/TP is NOT a setup — it's a guess."
            )
        else:
            self._add_result(
                "V01", "Trade Setup Completeness",
                "All trade setups have complete required fields",
                "CRITICAL", True, f"Checked {len(self.trade_setups)} setups"
            )
    
    # ── CHECK 2: Weekly Execution Calendar must have SL and TP columns ──
    def _check_execution_calendar_has_sl_tp(self):
        """CRITICAL: The blind-execution calendar must show SL and TP, not just Entry"""
        headers = self.parser.execution_calendar_headers
        has_sl = any("SL" in h for h in headers)
        has_tp = any("TP" in h for h in headers)
        
        if not has_sl or not has_tp:
            self._add_result(
                "V02", "Execution Calendar SL/TP",
                "Weekly Execution Calendar must have SL and TP columns (blindly executable)",
                "CRITICAL", False,
                f"Calendar headers: {headers}. Missing: {'SL' if not has_sl else ''} {'TP' if not has_tp else ''}",
                "Add SL and TP columns to the Weekly Execution Calendar table headers and data rows"
            )
        else:
            self._add_result(
                "V02", "Execution Calendar SL/TP",
                "Execution Calendar has SL and TP columns",
                "CRITICAL", True
            )
    
    # ── CHECK 3: No "data not yet published" for past days ──
    def _check_no_data_not_published_for_past_days(self):
        """CRITICAL: If it's Wednesday, Mon/Tue data EXISTS. Claiming it doesn't is a logic error."""
        forbidden_patterns = [
            r"Monday/Tuesday option data not yet fully published",
            r"Mon/Tue data not yet",
            r"not yet published at time of report",
            r"data not yet available for (Monday|Tuesday|Mon|Tue)",
        ]
        
        violations = []
        for pattern in forbidden_patterns:
            matches = re.finditer(pattern, self.html_content, re.IGNORECASE)
            for match in matches:
                # Get surrounding context
                start = max(0, match.start() - 50)
                end = min(len(self.html_content), match.end() + 50)
                context = self.html_content[start:end].replace('\n', ' ')
                violations.append(context)
        
        if violations:
            self._add_result(
                "V03", "Past Data Availability",
                "Cannot claim past-day data is 'not yet published' — if today is Wed, Mon/Tue data exists",
                "CRITICAL", False,
                f"Found {len(violations)} violation(s): {violations[0][:200]}",
                "Replace with actual Mon/Tue data. If data couldn't be fetched, say 'fetch failed' not 'not yet published'"
            )
        else:
            self._add_result(
                "V03", "Past Data Availability",
                "No false 'data not yet published' claims for past days",
                "CRITICAL", True
            )
    
    # ── CHECK 4: SS = Swing Scalps, never "Sideways Squeeze" ──
    def _check_ssideways_squeeze_forbidden(self):
        """CRITICAL: SS means Swing Scalps. 'Sideways Squeeze' or 'Sideways Scalps' is FORBIDDEN"""
        forbidden = ["Sideways Squeeze", "sideways squeeze", "Sideways Scalps", "sideways scalps"]
        violations = []
        for term in forbidden:
            count = self.html_content.count(term)
            if count > 0:
                violations.append(f"'{term}' found {count} time(s)")
        
        if violations:
            self._add_result(
                "V04", "SS Terminology",
                "SS must mean 'Swing Scalps' — 'Sideways Squeeze' is FORBIDDEN",
                "CRITICAL", False, "; ".join(violations),
                "Replace all instances of 'Sideways Squeeze' or 'Sideways Scalps' with 'Swing Scalps'"
            )
        else:
            self._add_result(
                "V04", "SS Terminology",
                "SS correctly means Swing Scalps throughout",
                "CRITICAL", True
            )
    
    # ── CHECK 5: Shape→Setup Pipeline — every identified shape must have setups ──
    def _check_shape_setup_pipeline(self):
        """CRITICAL: If Engine 2 identifies a shape for a day, Engine 3 must have setups for that day"""
        # Extract shapes from the chain extension table
        shape_days = {}
        # Look for pattern like "Mon May 25" + "SS" in tables
        day_shape_pattern = re.compile(
            r'(Mon|Tue|Wed|Thu|Fri)[^\n]*?(SS|BS|WL|R|SS/WL|R/SS|SS/DWL)\b',
            re.IGNORECASE
        )
        for match in day_shape_pattern.finditer(self.parser.all_text):
            day = match.group(1)
            shape = match.group(2)
            shape_days[day] = shape
        
        # Check that each day with an SS shape has swing scalp setups
        setup_days = set()
        for setup in self.trade_setups:
            title = setup.title
            for day in ["Mon", "Tue", "Wed", "Thu", "Fri"]:
                full_days = {"Mon": "Monday", "Tue": "Tuesday", "Wed": "Wednesday", "Thu": "Thursday", "Fri": "Friday"}
                if day in title or full_days[day] in title:
                    setup_days.add(day)
        
        # Days with SS shape that have NO setups
        missing_days = []
        for day, shape in shape_days.items():
            if "SS" in shape and day not in setup_days:
                # Check if there's a valid reason (e.g., range too narrow)
                missing_days.append(f"{day} ({shape})")
        
        if missing_days:
            self._add_result(
                "V05", "Shape→Setup Pipeline",
                "Every identified shape must produce setups — SS days MUST have swing scalps",
                "HIGH", False,
                f"Days with SS shape but no setups: {', '.join(missing_days)}",
                "SS means price oscillates between boundaries → setups at BOTH boundaries. Add setups or document valid exclusion (range < 15 pips)"
            )
        else:
            self._add_result(
                "V05", "Shape→Setup Pipeline",
                "All identified shapes have corresponding setups",
                "HIGH", True
            )
    
    # ── CHECK 6: SS days must have both directions ──
    def _check_both_directions_ss_days(self):
        """HIGH: SS days have setups in BOTH directions — long at floor, short at ceiling"""
        ss_setups = {}
        for setup in self.trade_setups:
            title = setup.title
            if "Swing Scalp" in title or "scalp" in title.lower():
                direction = setup.fields.get("Direction", "")
                for day in ["Mon", "Tue", "Wed", "Thu", "Fri"]:
                    full_days = {"Mon": "Monday", "Tue": "Tuesday", "Wed": "Wednesday", "Thu": "Thursday", "Fri": "Friday"}
                    if day in title or full_days[day] in title:
                        if day not in ss_setups:
                            ss_setups[day] = set()
                        if direction in ("LONG", "SHORT"):
                            ss_setups[day].add(direction)
        
        missing_direction_days = []
        for day, directions in ss_setups.items():
            if directions != {"LONG", "SHORT"}:
                missing_direction_days.append(f"{day}: only {directions}")
        
        if missing_direction_days:
            self._add_result(
                "V06", "Both Directions SS",
                "SS days must have setups in BOTH directions (LONG at floor + SHORT at ceiling)",
                "HIGH", False,
                "; ".join(missing_direction_days),
                "Add the missing direction setup for each SS day"
            )
        else:
            self._add_result(
                "V06", "Both Directions SS",
                "All SS days have both LONG and SHORT setups",
                "HIGH", True
            )
    
    # ── CHECK 7: BoM/MoM labels present in zone tables ──
    def _check_boM_mom_labels(self):
        """HIGH: Zone tables must classify zones as BoM or MoM"""
        has_bom = "BoM" in self.html_content
        has_mom = "MoM" in self.html_content
        
        if not has_bom or not has_mom:
            self._add_result(
                "V07", "BoM/MoM Classification",
                "Zone tables must classify each zone as BoM or MoM",
                "HIGH", False,
                f"BoM found: {has_bom}, MoM found: {has_mom}",
                "Add BoM/MoM classification to every zone in the zone map"
            )
        else:
            self._add_result(
                "V07", "BoM/MoM Classification",
                "BoM/MoM classifications present",
                "HIGH", True
            )
    
    # ── CHECK 8: RRR values are present and valid ──
    def _check_rrr_values(self):
        """MEDIUM: RRR values should be numeric and reasonable (1.0x - 25.0x)"""
        rrr_pattern = re.compile(r'(\d+\.?\d*)x')
        rrr_values = []
        for setup in self.trade_setups:
            for key, val in setup.fields.items():
                if "RRR" in key:
                    match = rrr_pattern.search(val)
                    if match:
                        rrr = float(match.group(1))
                        rrr_values.append((setup.title, key, rrr))
        
        bad_rrr = [(t, k, r) for t, k, r in rrr_values if r < 1.0 or r > 25.0]
        
        if bad_rrr:
            self._add_result(
                "V08", "RRR Values",
                "RRR values must be reasonable (1.0x - 25.0x)",
                "MEDIUM", False,
                f"Bad RRR: {bad_rrr[:5]}",
                "Verify RRR calculation: Entry-SL distance vs TP-Entry distance"
            )
        elif not rrr_values:
            self._add_result(
                "V08", "RRR Values",
                "No RRR values found in any setup",
                "HIGH", False,
                "Zero RRR values parsed from trade setups",
                "Every trade setup must have at least one RRR value"
            )
        else:
            self._add_result(
                "V08", "RRR Values",
                f"RRR values valid (checked {len(rrr_values)} values)",
                "MEDIUM", True
            )
    
    # ── CHECK 9: Direction Validation 6-check tables present ──
    def _check_direction_validation(self):
        """MEDIUM: HTF swing setups must have Direction Validation 6-check tables"""
        has_dv = "Direction Validation" in self.html_content or "4H Trend" in self.html_content
        
        if not has_dv:
            self._add_result(
                "V09", "Direction Validation",
                "HTF Swing setups must include Direction Validation 6-check tables",
                "MEDIUM", False,
                "No Direction Validation tables found",
                "Add 6-check Direction Validation table for each HTF Swing setup"
            )
        else:
            self._add_result(
                "V09", "Direction Validation",
                "Direction Validation tables present",
                "MEDIUM", True
            )
    
    # ── CHECK 10: Forbidden phrases ──
    def _check_forbidden_phrases(self):
        """HIGH: Check for known derailment phrases"""
        forbidden = {
            "unchanged from v4.5.2": "Placeholders are FORBIDDEN — document must be self-contained",
            "TBD": "TBD is lazy — either populate the data or explain what's missing",
            "TBA": "TBA is lazy — either populate the data or explain what's missing",
            "placeholder": "Placeholders are FORBIDDEN — every section must have actual content",
        }
        
        violations = []
        for phrase, reason in forbidden.items():
            count = self.html_content.lower().count(phrase.lower())
            if count > 0:
                violations.append(f"'{phrase}' found {count}x — {reason}")
        
        if violations:
            self._add_result(
                "V10", "Forbidden Phrases",
                "Report contains forbidden placeholder/delay phrases",
                "HIGH", False,
                "; ".join(violations),
                "Replace all placeholders with actual content"
            )
        else:
            self._add_result(
                "V10", "Forbidden Phrases",
                "No forbidden placeholder phrases found",
                "HIGH", True
            )
    
    # ── CHECK 11: Table page-break CSS ──
    def _check_table_page_break_css(self):
        """HIGH: Tables must have page-break-inside: avoid CSS"""
        has_avoid = "page-break-inside: avoid" in self.html_content or "break-inside: avoid" in self.html_content
        
        if not has_avoid:
            self._add_result(
                "V11", "Table Page Break CSS",
                "Tables must have 'page-break-inside: avoid' or 'break-inside: avoid' CSS",
                "HIGH", False,
                "No page-break-inside: avoid found in CSS",
                "Add 'page-break-inside: avoid; break-inside: avoid;' to .data-table, .setup-table, .zone-table CSS rules"
            )
        else:
            self._add_result(
                "V11", "Table Page Break CSS",
                "Table page-break CSS present",
                "HIGH", True
            )
    
    # ── CHECK 12: Monday/Tuesday data actually populated ──
    def _check_monday_tuesday_data_populated(self):
        """CRITICAL: If report is mid-week, Mon/Tue sections must have REAL data, not placeholders"""
        # Check that Mon/Tue option expiry sections have actual data (not just "no data")
        mon_tue_sections = re.findall(
            r'(Monday|Tuesday|Mon May|Tue May)[^<]*</h3>(.*?)(?=<h[23]|$)',
            self.html_content, re.DOTALL | re.IGNORECASE
        )
        
        empty_days = []
        for section in mon_tue_sections:
            day = section[0]
            content = section[1].strip()
            # Check if content is essentially empty or just says "no data"
            if len(content) < 50 or "no data" in content.lower() or "not available" in content.lower():
                empty_days.append(day)
        
        if empty_days:
            self._add_result(
                "V12", "Mon/Tue Data Population",
                "Monday/Tuesday data sections must have actual data (past days have complete data)",
                "CRITICAL", False,
                f"Empty/placeholder sections: {', '.join(empty_days)}",
                "Fetch and populate actual Mon/Tue option data. These are PAST days — data exists."
            )
        else:
            self._add_result(
                "V12", "Mon/Tue Data Population",
                "Monday/Tuesday data sections populated",
                "CRITICAL", True
            )
    
    # ── CHECK 13: Setup categories labeled correctly ──
    def _check_setup_categories(self):
        """MEDIUM: Each setup must have a category (Swing Scalp / BS / HTF / Reinforcement / Transition)"""
        valid_categories = ["Swing Scalp", "Breakout Search", "HTF Swing", "Reinforcement", "Transition"]
        
        uncategorized = []
        for setup in self.trade_setups:
            title = setup.title
            has_category = any(cat in title for cat in valid_categories)
            if not has_category:
                # Check fields
                setup_type = setup.fields.get("Type", "") + setup.fields.get("Entry Type", "")
                has_category = any(cat in setup_type for cat in valid_categories)
                if not has_category:
                    uncategorized.append(setup.title)
        
        if uncategorized:
            self._add_result(
                "V13", "Setup Categories",
                "Every trade setup must have a category (Swing Scalp / Breakout Search / HTF Swing / Reinforcement / Transition)",
                "MEDIUM", False,
                f"Uncategorized: {uncategorized[:5]}",
                "Add category to setup title or fields"
            )
        else:
            self._add_result(
                "V13", "Setup Categories",
                "All setups have categories",
                "MEDIUM", True
            )


# ════════════════════════════════════════════════════════════
# REPORT GENERATOR
# ════════════════════════════════════════════════════════════

def generate_validation_report(results: List[ValidationResult]) -> str:
    """Generate a formatted validation report"""
    
    passed = [r for r in results if r.passed]
    failed = [r for r in results if not r.passed]
    critical_failures = [r for r in failed if r.severity == "CRITICAL"]
    high_failures = [r for r in failed if r.severity == "HIGH"]
    medium_failures = [r for r in failed if r.severity == "MEDIUM"]
    
    report = []
    report.append("=" * 70)
    report.append("TRIDENT REPORT VALIDATOR — ALGORITHMIC FIREWALL v1.0")
    report.append("=" * 70)
    report.append("")
    
    # Summary
    total = len(results)
    report.append(f"TOTAL CHECKS: {total} | PASSED: {len(passed)} | FAILED: {len(failed)}")
    report.append(f"  CRITICAL FAILURES: {len(critical_failures)}")
    report.append(f"  HIGH FAILURES: {len(high_failures)}")
    report.append(f"  MEDIUM FAILURES: {len(medium_failures)}")
    report.append("")
    
    if critical_failures:
        report.append("🚫" + " CRITICAL FAILURES — REPORT IS UNDELIVERABLE " + "🚫")
        report.append("-" * 70)
        for r in critical_failures:
            report.append(f"  [{r.check_id}] {r.description}")
            report.append(f"         DETAILS: {r.details[:200]}")
            report.append(f"         FIX: {r.fix_hint}")
            report.append("")
    
    if high_failures:
        report.append("⚠️  HIGH FAILURES — MUST FIX BEFORE DELIVERY")
        report.append("-" * 70)
        for r in high_failures:
            report.append(f"  [{r.check_id}] {r.description}")
            report.append(f"         DETAILS: {r.details[:200]}")
            report.append(f"         FIX: {r.fix_hint}")
            report.append("")
    
    if medium_failures:
        report.append("⚡ MEDIUM FAILURES — SHOULD FIX")
        report.append("-" * 70)
        for r in medium_failures:
            report.append(f"  [{r.check_id}] {r.description}")
            report.append(f"         DETAILS: {r.details[:200]}")
            report.append(f"         FIX: {r.fix_hint}")
            report.append("")
    
    if passed:
        report.append("✅ PASSED CHECKS")
        report.append("-" * 70)
        for r in passed:
            report.append(f"  [{r.check_id}] {r.description} — {r.details[:100] if r.details else 'OK'}")
        report.append("")
    
    # Verdict
    report.append("=" * 70)
    if critical_failures:
        report.append("VERDICT: 🚫 UNDELIVERABLE — Fix CRITICAL failures before delivering")
    elif high_failures:
        report.append("VERDICT: ⚠️  CONDITIONAL — Fix HIGH failures for production quality")
    elif medium_failures:
        report.append("VERDICT: ⚡ DELIVERABLE WITH WARNINGS — Medium issues noted")
    else:
        report.append("VERDICT: ✅ ALL CHECKS PASSED — Report is deliverable")
    report.append("=" * 70)
    
    return "\n".join(report)


# ════════════════════════════════════════════════════════════
# MAIN
# ════════════════════════════════════════════════════════════

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 Trident_Report_Validator.py <report.html>")
        print("\nRun this script against the generated report HTML BEFORE converting to PDF.")
        print("If any CRITICAL check fails, the report is UNDELIVERABLE.")
        sys.exit(1)
    
    html_path = sys.argv[1]
    
    if not os.path.exists(html_path):
        print(f"ERROR: File not found: {html_path}")
        sys.exit(1)
    
    print(f"Validating: {html_path}")
    print()
    
    validator = TridentValidator(html_path)
    validator.load()
    results = validator.validate()
    
    report = generate_validation_report(results)
    print(report)
    
    # Save validation report
    report_path = html_path.replace('.html', '_validation.txt')
    with open(report_path, 'w') as f:
        f.write(report)
    print(f"\nValidation report saved to: {report_path}")
    
    # Exit code
    critical = any(r.severity == "CRITICAL" and not r.passed for r in results)
    high = any(r.severity == "HIGH" and not r.passed for r in results)
    
    if critical:
        sys.exit(1)
    elif high:
        sys.exit(2)
    else:
        sys.exit(0)


if __name__ == "__main__":
    main()
