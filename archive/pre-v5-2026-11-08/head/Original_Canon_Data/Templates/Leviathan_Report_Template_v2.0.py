#!/usr/bin/env python3
"""
Leviathan Consolidated IP Report — TEMPLATE v2.0
DXY Master + EUR/USD, GBP/USD, AUD/USD Pair Translations + Cross-Pair Matrix

THIS IS THE DEFINITIVE BULLETPROOF TEMPLATE. DO NOT DEVIATE FROM THIS STRUCTURE.

=============================================================================
FORMATTING RULES — 52 IRONCLAD RULES (v1.3 + v1.4 + BULLETPROOF merged)
=============================================================================

--- NOTATION & CONVENTION (Rules 1-8) ---

1.  NOTATION: All option strikes use EUR/USD convention with DXY equivalent
    in adjacent column. K Factor audit trail is MANDATORY in Section 1.
2.  NOTATION: Zone ranges use format "LOW-HIGH" (e.g., "99.45-99.52").
3.  NOTATION: Pressure levels: EXTREME > HEAVY > MODERATE-HEAVY > MODERATE >
    LOW-MODERATE > LOW. Only MODERATE and above appear in Synthesis tables.
4.  NOTATION: Scores displayed as "X/14" (out of 14 possible pillar points).
5.  NOTATION: ZFP = Zone Failure Probability, displayed as percentage.
6.  NOTATION: POI Tiers: A+ > A > A- > B+ > B > B- > C.
7.  NOTATION: LSZ types are "Supply-side" or "Demand-side" with Priority
    being "ACTIVE SL TRIGGER" or "STANDARD".
8.  NOTATION: All price levels use appropriate decimal precision for the pair:
    DXY=2dp, EUR/USD=4dp, GBP/USD=4dp, AUD/USD=4dp.

--- TABLE FORMATTING (Rules 9-18) ---

9.  CENTER ALIGNMENT: ALL cell styles use TA_CENTER alignment. NO exceptions.
    Every cell, every header, every value — CENTER. This is NON-NEGOTIABLE.
10. COLUMN WIDTHS: Use inch-based col_widths on every table. Total width
    MUST NOT exceed 6.55 inches (letter - 2*0.50" margin = 7.5" - ~0.95" for
    borders/padding). Target ~6.55" total column width per table.
11. HEADER ROWS: All corporate tables use navy background (#0f172a) with
    white text. This is applied by make_corporate_table() automatically.
12. ALTERNATING ROWS: Even data rows get #f1f5f9 (C_ALT_ROW) background.
    Applied by make_corporate_table() automatically.
13. KV TABLES: Label column gets #eef2ff background. Grid uses 0.3pt border
    (thinner than corporate table 0.4pt). Applied by make_kv_table().
14. COVER SUMMARY TABLES: Label column gets #eef2ff background, value column
    gets white background. Applied by make_cover_summary_table().
15. CELL PADDING: TOPPADDING=3, BOTTOMPADDING=3, LEFTPADDING=4, RIGHTPADDING=4.
    This is LOCKED across ALL table types. See Rule 38.
16. GRID LINES: Corporate tables use 0.4pt C_BORDER grid. KV tables use
    0.3pt C_BORDER grid. Cover summary uses 0.4pt C_BORDER grid.
17. VALIGN: ALL cells in ALL tables use VALIGN='MIDDLE'. NO exceptions.
18. REPEATROWS: Corporate tables use repeatRows=1 (header repeats on page break).

--- PAGE LAYOUT (Rules 19-24) ---

19. PAGE SIZE: US Letter (8.5" x 11").
20. MARGINS: 0.50" all sides — TOP, BOTTOM, LEFT, RIGHT. LOCKED. See Rule 36.
21. SECTION NUMBERING: DXY sections 1-8, EUR/USD sections 9-13, GBP/USD
    sections 14-18, AUD/USD sections 19-23, Cross-Pair sections 24-25.
    Section numbers are CONTIGUOUS across the entire document. See Rule 49.
22. COVER PAGE: Title, subtitle, spot prices, engine summary table, then
    PageBreak(). Cover is NOT numbered.
23. PAIR PAGES: Each pair starts with PageBreak() + 0.3*inch spacer +
    pair title (36pt, pair accent color, centered). See Rules 43, 48.
24. DOCUMENT METADATA: title and author set in SimpleDocTemplate constructor.

--- STYLE PARAMETERS (Rules 25-31) ---

25. COVER TITLE: 28pt, Helvetica-Bold, C_NAVY, TA_CENTER, spaceAfter=12.
26. COVER SUBTITLE: 14pt, Helvetica, #4a4a6a, TA_CENTER, spaceAfter=6.
27. SECTION HEADING: 15pt, Helvetica-Bold, pair-appropriate color,
    spaceBefore=6, spaceAfter=4. See Rule 51 for spaceBefore/spaceAfter values.
28. SUB HEADING: 11pt, Helvetica-Bold, C_DARK, spaceBefore=6, spaceAfter=3.
29. SUB2 HEADING: 9.5pt, Helvetica-Bold, C_ACCENT, spaceBefore=4, spaceAfter=2.
30. BODY TEXT: 9pt, Helvetica, #1e293b, spaceBefore=1, spaceAfter=1.
31. BODY BOLD: 9pt, Helvetica-Bold, C_NAVY, spaceBefore=1, spaceAfter=1.

--- ZERO WHITESPACE RULES — SUPERSEDED BY BULLETPROOF (Rules 32-38) ---

32. PAGEBREAK USAGE: PageBreak() ONLY before cover-to-section1 transition
    AND before each new pair section. NOWHERE ELSE. Using PageBreak() between
    regular sections is FORBIDDEN — use CondPageBreak(140) instead.
33. CONDPAGEBREAK THRESHOLD: CondPageBreak(140) between ALL independent
    sections. This value is LOCKED. 140pt = ~2 inches, enough room for
    heading + medium table. Do NOT use 60, 80, 100, 200, or any other value.
34. KEEPTOGETHER MANDATE: KeepTogether() on EVERY section heading + its
    primary content. This is the #1 anti-break rule. NO standalone tables
    ever. A table must NEVER be appended directly to the story without being
    wrapped in a KeepTogether with its heading.
35. SPACER VALUES: spacer(2) between zone details, spacer(3) between section
    blocks, spacer(8) between cover tables on pair pages. NO other values
    are authorized without explicit BULLETPROOF override.
36. MARGINS: 0.50" — LOCKED. All four sides. Do NOT change.
37. COVER COMPRESSION: Cover + Section 1 flow with PageBreak() between them.
    Cover does NOT get its own forced blank page.
38. CELL PADDING: TOPPADDING=3, BOTTOMPADDING=3 — LOCKED. Do NOT change.

--- BULLETPROOF RULES (Rules 39-52) ---

39. KEEPTOGETHER ON EVERY SECTION: Every section heading + hr + primary
    content MUST be wrapped in KeepTogether(). This prevents orphan headings
    at page bottom and mid-table page breaks. NO EXCEPTIONS.
40. KEEPTOGETHER ON EVERY ZONE DETAIL: Each zone detail block (zone heading
    + kv_table) MUST be KeepTogether(). This prevents "Zone #2: Upper
    Resistance" appearing alone at the bottom of a page with its detail
    table on the next page.
41. KEEPTOGETHER ON EVERY STEP BLOCK: Each Step in the Macro Shape Chain
    (heading + table/kv) MUST be KeepTogether(). This prevents "Step 4:
    Decision Zone" appearing alone.
42. KEEPTOGETHER ON EVERY DAY TABLE: Each day-by-day option expiry table
    MUST be KeepTogether with its day heading.
43. PAGEBREAK BEFORE EACH PAIR: EUR/USD, GBP/USD, AUD/USD MUST each start
    on a fresh page with PageBreak() before the pair title. This is
    NON-NEGOTIABLE. No soft breaks — always PageBreak().
44. CONDPAGEBREAK(140) BETWEEN SECTIONS: The ONLY acceptable value for
    CondPageBreak between independent sections is 140. Do NOT use 60, 80,
    100, 200, or any other value. Using smaller values causes mid-section
    breaks; using larger values creates whitespace.
45. NO STANDALONE TABLES: A table must NEVER be appended directly to the
    story without being wrapped in a KeepTogether with its heading. The ONLY
    exception is when the table is part of a larger KeepTogether block that
    already includes the heading.
46. SPACER(8) BETWEEN PAIR COVER TABLES: The two cover summary tables on
    pair pages (Translation Rules + Key Levels) must have spacer(8) between
    them, NOT spacer(2). This provides visual separation.
47. PAIR-SPECIFIC ACCENT COLORS: EUR/USD uses C_EU_ACCENT (#1e40af),
    GBP/USD uses C_GU_ACCENT (#7e22ce), AUD/USD uses C_AU_ACCENT (#b45309).
    Section headers and zone headers use pair-specific styles.
48. PAIR TITLE FORMAT: Each pair title is a 36pt bold heading in the pair's
    accent color, centered, with Spacer(1, 0.3*inch) before it. This is NOT
    the same as a section heading — it's a cover-style title.
49. SECTION NUMBERING: DXY sections 1-8, EUR/USD sections 9-13, GBP/USD
    sections 14-18, AUD/USD sections 19-23, Cross-Pair sections 24-25.
    Section numbers are CONTIGUOUS across the entire document.
50. CROSS-PAIR MATRIX FORMAT: Section 25 uses a corporate table with columns:
    DXY Zone, DXY Range, Pressure, EU Zone, EU Range, GU Zone, GU Range,
    AU Zone, AU Range. KeepTogether heading + table.
51. REDUCED SPACEBEFORE/SPACEAFTER: All section styles use spaceBefore=6
    (not 14), spaceAfter=4 (not 6). Sub styles use spaceBefore=6 (not 10).
    This was the BULLETPROOF setting that eliminated excessive vertical gaps.
52. HR SPACEAFTER/SPACEBEFORE: HRFlowable uses spaceAfter=2, spaceBefore=2
    (not 4/4). This was the BULLETPROOF setting.

=============================================================================
SECTION NUMBERING SCHEME
=============================================================================

COVER PAGE (unnumbered)
  - Title, subtitle, spot prices, engine summary, PageBreak()

DXY MASTER (Sections 1-8):
  1. DXY OTC FX Option Expiry Summary (Protocol A)
  2. DXY IP Zone Map — 9-Pillar 6D Hybrid System
     (Pillar 1: Pivots, Pillar 2: MA Grid, Pillar 8: Strike-to-DXY,
      Pillar 4: Institutional Commentary, Pillar 5: Structural Extremes,
      Magnets + Reversals)
  3. DXY IP Zone Synthesis (main table + zone details + LSZ Summary)
  4. DXY 4H Zone Classification
  5. Economic Calendar + Red Folder Time-Locks
  6. Missing Data Log
  7. DXY Macro Shape Chain Map (Engine 2)
     (Steps 1-4 + Weekly Shape Chain Visualization)
  8. DXY Volatility Trigger Summary

EUR/USD (Sections 9-13) — PageBreak() BEFORE:
  9.  EUR/USD IP Zone Map Synthesis (main table + zone details + LSZ Summary)
  10. EUR/USD 4H Zone Classification
  11. EUR/USD Institutional Commentary
  12. EUR/USD Weekly Shape Chain Visualization
  13. EUR/USD Volatility Trigger Summary

GBP/USD (Sections 14-18) — PageBreak() BEFORE:
  14. GBP/USD IP Zone Map Synthesis (main table + zone details + LSZ Summary)
  15. GBP/USD 4H Zone Classification
  16. GBP/USD Institutional Commentary
  17. GBP/USD Weekly Shape Chain Visualization
  18. GBP/USD Volatility Trigger Summary

AUD/USD (Sections 19-23) — PageBreak() BEFORE:
  19. AUD/USD IP Zone Map Synthesis (main table + zone details + LSZ Summary)
  20. AUD/USD 4H Zone Classification
  21. AUD/USD Institutional Commentary
  22. AUD/USD Weekly Shape Chain Visualization
  23. AUD/USD Volatility Trigger Summary

CROSS-PAIR (Sections 24-25):
  24. Data Quality & Verification Summary
  25. Cross-Pair Comparison Matrix

=============================================================================
USAGE
=============================================================================

1. Replace ALL [FILL IN] placeholders with actual data.
2. Replace TEMPLATE_WEEK with the target week (e.g., "May 25-29, 2026").
3. Replace TEMPLATE_DATE with the data-as-of date (e.g., "May 25, 2026").
4. Replace TEMPLATE_SPOT_DXY, TEMPLATE_SPOT_EU, etc. with actual spot prices.
5. Run: python3 Leviathan_Report_Template_v2.0.py
6. Output PDF will be generated at OUTPUT_PATH.

=============================================================================
"""

import math
import os
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor, black, white, grey, Color
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, KeepTogether, CondPageBreak, HRFlowable
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT

# ============================================================
# COLOR PALETTE — Corporate hedge fund aesthetic (LOCKED)
# ============================================================
C_NAVY       = HexColor('#0f172a')
C_DARK       = HexColor('#1a1a2e')
C_ACCENT     = HexColor('#2563eb')
C_ACCENT_LT  = HexColor('#3b82f6')
C_RED        = HexColor('#dc2626')
C_AMBER      = HexColor('#d97706')
C_GREEN      = HexColor('#16a34a')
C_PURPLE     = HexColor('#7c3aed')
C_GRAY       = HexColor('#64748b')
C_LIGHT_BG   = HexColor('#f8fafc')
C_ALT_ROW    = HexColor('#f1f5f9')
C_BORDER     = HexColor('#cbd5e1')
C_WHITE      = white
C_LINK       = HexColor('#1d4ed8')
C_EU_ACCENT  = HexColor('#1e40af')
C_GU_ACCENT  = HexColor('#7e22ce')
C_AU_ACCENT  = HexColor('#b45309')

# ============================================================
# DOCUMENT STYLES (LOCKED — BULLETPROOF VALUES)
# ============================================================
_bs = getSampleStyleSheet()

style_cover_title = ParagraphStyle('CoverTitle', fontSize=28, leading=34,
    fontName='Helvetica-Bold', textColor=C_NAVY, alignment=TA_CENTER, spaceAfter=12)
style_cover_sub = ParagraphStyle('CoverSub', fontSize=14, leading=18,
    fontName='Helvetica', textColor=HexColor('#4a4a6a'), alignment=TA_CENTER, spaceAfter=6)
style_cover_red = ParagraphStyle('CoverRed', fontSize=10, leading=14,
    fontName='Helvetica-Bold', textColor=C_RED, alignment=TA_CENTER, spaceAfter=4)
style_cover_center = ParagraphStyle('CoverCenter', fontSize=10, leading=14,
    fontName='Helvetica', textColor=HexColor('#334155'), alignment=TA_CENTER, spaceAfter=4)

# Section styles — spaceBefore=6, spaceAfter=4 (Rule 51)
style_section = ParagraphStyle('Section', fontSize=15, leading=19,
    fontName='Helvetica-Bold', textColor=C_NAVY, spaceBefore=6, spaceAfter=4)
style_sub = ParagraphStyle('Sub', fontSize=11, leading=14,
    fontName='Helvetica-Bold', textColor=C_DARK, spaceBefore=6, spaceAfter=3)
style_sub2 = ParagraphStyle('Sub2', fontSize=9.5, leading=12,
    fontName='Helvetica-Bold', textColor=C_ACCENT, spaceBefore=4, spaceAfter=2)

# Pair-specific section styles (Rule 47)
style_section_eu = ParagraphStyle('SectionEU', fontSize=15, leading=19,
    fontName='Helvetica-Bold', textColor=C_EU_ACCENT, spaceBefore=6, spaceAfter=4)
style_section_gu = ParagraphStyle('SectionGU', fontSize=15, leading=19,
    fontName='Helvetica-Bold', textColor=C_GU_ACCENT, spaceBefore=6, spaceAfter=4)
style_section_au = ParagraphStyle('SectionAU', fontSize=15, leading=19,
    fontName='Helvetica-Bold', textColor=C_AU_ACCENT, spaceBefore=6, spaceAfter=4)

style_body = ParagraphStyle('Body', fontSize=9, leading=12.5,
    fontName='Helvetica', textColor=HexColor('#1e293b'), spaceBefore=1, spaceAfter=1)
style_body_bold = ParagraphStyle('BodyBold', fontSize=9, leading=12.5,
    fontName='Helvetica-Bold', textColor=C_NAVY, spaceBefore=1, spaceAfter=1)
style_small = ParagraphStyle('Small', fontSize=8, leading=10.5,
    fontName='Helvetica', textColor=C_GRAY, spaceBefore=1, spaceAfter=1)
style_mono = ParagraphStyle('Mono', fontSize=7.5, leading=9.5,
    fontName='Courier', textColor=HexColor('#475569'), spaceBefore=1, spaceAfter=1)

style_alert = ParagraphStyle('Alert', fontSize=9, leading=12.5,
    fontName='Helvetica-Bold', textColor=C_RED, spaceBefore=1, spaceAfter=1)
style_warn = ParagraphStyle('Warn', fontSize=9, leading=12.5,
    fontName='Helvetica-Bold', textColor=C_AMBER, spaceBefore=1, spaceAfter=1)

# Zone styles — pair-specific (Rule 47)
style_zone = ParagraphStyle('Zone', fontSize=10, leading=13,
    fontName='Helvetica-Bold', textColor=C_ACCENT, spaceBefore=4, spaceAfter=2)
style_zone_eu = ParagraphStyle('ZoneEU', fontSize=10, leading=13,
    fontName='Helvetica-Bold', textColor=C_EU_ACCENT, spaceBefore=4, spaceAfter=2)
style_zone_gu = ParagraphStyle('ZoneGU', fontSize=10, leading=13,
    fontName='Helvetica-Bold', textColor=C_GU_ACCENT, spaceBefore=4, spaceAfter=2)
style_zone_au = ParagraphStyle('ZoneAU', fontSize=10, leading=13,
    fontName='Helvetica-Bold', textColor=C_AU_ACCENT, spaceBefore=4, spaceAfter=2)

# ============================================================
# TABLE CELL STYLES (LOCKED — ALL CENTER-ALIGNED, Rule 9)
# ============================================================
style_cell = ParagraphStyle('Cell', fontSize=8, leading=10,
    fontName='Helvetica', textColor=HexColor('#1e293b'),
    alignment=TA_CENTER, spaceBefore=0, spaceAfter=0)
style_cell_center = ParagraphStyle('CellCenter', fontSize=8, leading=10,
    fontName='Helvetica', textColor=HexColor('#1e293b'),
    alignment=TA_CENTER, spaceBefore=0, spaceAfter=0)
style_cell_header = ParagraphStyle('CellHeader', fontSize=8, leading=10,
    fontName='Helvetica-Bold', textColor=C_WHITE,
    alignment=TA_CENTER, spaceBefore=0, spaceAfter=0)
style_cell_bold = ParagraphStyle('CellBold', fontSize=8, leading=10,
    fontName='Helvetica-Bold', textColor=C_NAVY,
    alignment=TA_CENTER, spaceBefore=0, spaceAfter=0)
style_cell_value = ParagraphStyle('CellValue', fontSize=8.5, leading=11,
    fontName='Helvetica', textColor=HexColor('#334155'),
    alignment=TA_CENTER, spaceBefore=0, spaceAfter=0)
style_cell_value_center = ParagraphStyle('CellValueCenter', fontSize=8.5, leading=11,
    fontName='Helvetica', textColor=HexColor('#334155'),
    alignment=TA_CENTER, spaceBefore=0, spaceAfter=0)
style_summary_label = ParagraphStyle('SummaryLabel', fontSize=9, leading=12,
    fontName='Helvetica-Bold', textColor=C_NAVY, alignment=TA_CENTER)
style_summary_value = ParagraphStyle('SummaryValue', fontSize=9, leading=12,
    fontName='Helvetica', textColor=HexColor('#334155'), alignment=TA_CENTER)
style_kv_label = ParagraphStyle('KVLabel', fontSize=8.5, leading=11,
    fontName='Helvetica-Bold', textColor=C_NAVY, alignment=TA_CENTER)
style_kv_value = ParagraphStyle('KVValue', fontSize=8.5, leading=11,
    fontName='Helvetica', textColor=HexColor('#334155'), alignment=TA_CENTER)

# ============================================================
# HELPER FUNCTIONS (LOCKED)
# ============================================================
def p(text, style=style_body):
    return Paragraph(text, style)

def hr(color=C_BORDER, thickness=0.5):
    """HR with spaceAfter=2, spaceBefore=2 (Rule 52)."""
    return HRFlowable(width="100%", thickness=thickness, color=color,
                       spaceAfter=2, spaceBefore=2)

def spacer(h=2):
    return Spacer(1, h)

def _esc(text):
    if not isinstance(text, str):
        text = str(text)
    return text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')

def cell(text, style=style_cell):
    return Paragraph(_esc(text), style)
def cellc(text, style=style_cell_center):
    return Paragraph(_esc(text), style)
def cellh(text):
    return Paragraph(_esc(text), style_cell_header)
def cellb(text):
    return Paragraph(_esc(text), style_cell_bold)
def cellv(text, center=True):
    return Paragraph(_esc(text), style_cell_value_center if center else style_cell_value)

CENTER_COLS_SHORT = {'#', 'Score', 'ZFP', 'Tier', 'RRR', 'Count', 'Step',
    'Net RRR', 'Entries', 'SL / TP', 'Range', 'Pressure', 'Type',
    'POI Tier', 'Mitigation', 'Overlap', 'Next Candle', 'Ladder Step',
    'BoM Fresh', 'Priority', 'Classification', 'Confidence', 'Impact',
    'Currency', 'Notional', 'DXY Equiv.', 'Variant', 'Day', 'Function',
    'Source', 'Context', 'Strike Time', 'Analysis',
    'Predicted Shape', 'Shape Context', 'Key Transition Time'}

def make_corporate_table(data, col_widths, header_rows=1, center_all=True):
    """Corporate table: navy headers, alt-row shading, center alignment.
    Cell padding: 3/4 (Rules 15, 38). Grid: 0.4pt (Rule 16)."""
    center_col_flags = []
    if data and len(data) > 0:
        for col_idx, header_text in enumerate(data[0]):
            header_str = str(header_text).strip()
            is_center = center_all or header_str in CENTER_COLS_SHORT
            center_col_flags.append(is_center)
    wrapped_data = []
    for row_idx, row in enumerate(data):
        wrapped_row = []
        for col_idx, cell_content in enumerate(row):
            if isinstance(cell_content, Paragraph):
                wrapped_row.append(cell_content)
            elif row_idx < header_rows:
                wrapped_row.append(cellh(str(cell_content)))
            else:
                is_center = col_idx < len(center_col_flags) and center_col_flags[col_idx]
                if is_center:
                    wrapped_row.append(cellc(str(cell_content)))
                else:
                    wrapped_row.append(cell(str(cell_content)))
        wrapped_data.append(wrapped_row)
    t = Table(wrapped_data, colWidths=col_widths, repeatRows=header_rows)
    style_cmds = [
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),      # Rule 17
        ('GRID', (0, 0), (-1, -1), 0.4, C_BORDER),    # Rule 16
        ('TOPPADDING', (0, 0), (-1, -1), 3),           # Rule 15/38
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),        # Rule 15/38
        ('LEFTPADDING', (0, 0), (-1, -1), 4),          # Rule 15
        ('RIGHTPADDING', (0, 0), (-1, -1), 4),         # Rule 15
    ]
    for hr_idx in range(header_rows):
        style_cmds += [
            ('BACKGROUND', (0, hr_idx), (-1, hr_idx), C_NAVY),   # Rule 11
            ('TEXTCOLOR', (0, hr_idx), (-1, hr_idx), C_WHITE),    # Rule 11
        ]
    for i in range(header_rows, len(data)):
        if i % 2 == 0:
            style_cmds.append(('BACKGROUND', (0, i), (-1, i), C_ALT_ROW))  # Rule 12
    t.setStyle(TableStyle(style_cmds))
    return t

def make_kv_table(data, col_widths):
    """KV table: label column highlighted, thinner grid. Grid: 0.3pt (Rule 13)."""
    wrapped = []
    for row in data:
        val = row[1] if isinstance(row[1], Paragraph) else cellv(row[1])
        wrapped.append([cellb(row[0]), val])
    t = Table(wrapped, colWidths=col_widths)
    t.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.3, C_BORDER),          # Rule 13
        ('BACKGROUND', (0, 0), (0, -1), HexColor('#eef2ff')), # Rule 13
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 4),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4),
    ]))
    return t

def make_cover_summary_table(data, col_widths):
    """Cover summary table: label=#eef2ff, value=white (Rule 14)."""
    wrapped = []
    for row in data:
        wrapped.append([
            Paragraph(row[0], style_summary_label),
            Paragraph(row[1], style_summary_value)
        ])
    t = Table(wrapped, colWidths=col_widths)
    t.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.4, C_BORDER),
        ('BACKGROUND', (0, 0), (0, -1), HexColor('#eef2ff')),  # Rule 14
        ('BACKGROUND', (1, 0), (1, -1), C_WHITE),              # Rule 14
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 4),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4),
    ]))
    return t

# ============================================================
# BULLETPROOF SECTION HELPERS (Rules 39-41)
# ============================================================
# Every section is KeepTogether(heading + hr + content)
# This GUARANTEES no orphan heading at page bottom and no mid-table break

def section_block(heading_text, heading_style, hr_color, hr_thickness, content_items):
    """Build a KeepTogether block: heading + hr + all content items.
    content_items is a list of flowables. (Rules 39, 34)"""
    items = [p(heading_text, heading_style), hr(hr_color, hr_thickness)]
    items.extend(content_items)
    return KeepTogether(items)

def section_with_table(heading_text, heading_style, hr_color, hr_thickness, pre_items, table):
    """Build: heading + hr + pre_items + table, all in KeepTogether. (Rule 39)"""
    items = [p(heading_text, heading_style), hr(hr_color, hr_thickness)]
    items.extend(pre_items)
    items.append(table)
    return KeepTogether(items)

# ============================================================
# TEMPLATE PLACEHOLDERS — Replace these with actual data
# ============================================================
TEMPLATE_WEEK     = "[FILL IN: e.g., May 25-29, 2026]"
TEMPLATE_DATE     = "[FILL IN: e.g., May 25, 2026]"
TEMPLATE_SPOT_DXY = "[FILL IN: e.g., 99.24]"
TEMPLATE_SPOT_EU  = "[FILL IN: e.g., 1.1639]"
TEMPLATE_SPOT_GU  = "[FILL IN: e.g., 1.3505]"
TEMPLATE_SPOT_AU  = "[FILL IN: e.g., 0.7155]"
TEMPLATE_VERSION  = "[FILL IN: e.g., Leviathan Ultra-Quant v4.5.2]"
TEMPLATE_METHOD   = "[FILL IN: e.g., Structural Equivalence (Approach B)]"

# ============================================================
# OUTPUT CONFIG
# ============================================================
OUTPUT_PATH = '/home/z/my-project/download/Leviathan_Consolidated_IP_Report_TEMPLATE.pdf'

# ============================================================
# BUILD STORY
# ============================================================
story = []

# ============================================================
# COVER PAGE (unnumbered)
# ============================================================
story.append(Spacer(1, 0.5*inch))
story.append(p('LEVIATHAN CONSOLIDATED<br/>INSTITUTIONAL PRESSURE REPORT', style_cover_title))
story.append(spacer(3))
story.append(p('DXY Master + EUR/USD | GBP/USD | AUD/USD Pair Translations', style_cover_sub))
story.append(spacer(2))
story.append(p(f'{TEMPLATE_VERSION} | Multi-Pair Architecture', style_cover_sub))
story.append(spacer(2))
story.append(p(f'Target Week: {TEMPLATE_WEEK}', style_cover_sub))
story.append(spacer(3))

story.append(p(f'<b>Data As-Of: {TEMPLATE_DATE}</b> \u2014 Temporal boundary is current time. All data currently published is included.', style_cover_red))
story.append(spacer(2))
story.append(p(f'DXY Spot: {TEMPLATE_SPOT_DXY} | EUR/USD: {TEMPLATE_SPOT_EU} | GBP/USD: {TEMPLATE_SPOT_GU} | AUD/USD: {TEMPLATE_SPOT_AU}', style_cover_center))
story.append(spacer(2))
story.append(p(f'Generated: {datetime.now().strftime("%Y-%m-%d %H:%M UTC")}', style_small))
story.append(spacer(2))
story.append(p(f'DXY \u2192 PAIR TRANSLATION: {TEMPLATE_METHOD}', style_cover_red))

story.append(spacer(6))

# Engine summary table — replace values
summary_data = [
    ['ENGINE 1', '[FILL IN: 9-Pillar 6D Hybrid IP Zone Map + POI Tier Classification (DXY + 3 Pairs)]'],
    ['ENGINE 2', '[FILL IN: Macro Shape Chain Map \u2014 Forward Mapping Active (DXY + Inverse Pair Translation)]'],
    ['ENGINE 3', '[FILL IN: DISABLED \u2014 No trade setups in this report]'],
    ['MACRO CONTEXT', '[FILL IN: DXY regime description]'],
    ['DXY REGIME', '[FILL IN: e.g., MOMENTUM (bullish) \u2014 Higher lows sequence; spot above SMA 50/200]'],
    ['TRANSLATION', f'[FILL IN: {TEMPLATE_METHOD}]'],
    ['VERIFICATION', '[FILL IN: Layer 2 verified via pair-specific MAs, swing structure, institutional commentary]'],
]
story.append(make_cover_summary_table(summary_data, col_widths=[1.2*inch, 5.2*inch]))

# PageBreak after cover — Section 1 starts fresh page (Rule 32)
story.append(PageBreak())

# ============================================================
# SECTION 1: DXY OTC FX Option Expiry Summary (Protocol A)
# Rule 42: Each day-by-day table KeepTogether with day heading
# ============================================================
story.append(KeepTogether([
    p('1. DXY OTC FX Option Expiry Summary (Protocol A)', style_section),
    hr(C_NAVY, 1.5),
    p('[FILL IN: Source attribution, e.g., investinglive.com \u2014 VLM 3-Pass Extraction]', style_small),
    p(f'[FILL IN: Temporal Boundary note for {TEMPLATE_DATE}]', style_small),
    spacer(2),
    p('<b>[FILL IN: Day 1, e.g., Monday, May 25] \u2014 10:00 AM NY Cut</b>', style_sub),
    make_corporate_table([
        ['Currency', 'Strike', 'Notional', 'DXY Equiv.', 'Tier', 'Classification'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
    ], col_widths=[0.85*inch, 0.7*inch, 0.85*inch, 0.85*inch, 0.45*inch, 2.1*inch]),
]))
story.append(spacer(3))

story.append(KeepTogether([
    p('<b>[FILL IN: Day 2, e.g., Tuesday, May 26] \u2014 10:00 AM NY Cut</b>', style_sub),
    make_corporate_table([
        ['Currency', 'Strike', 'Notional', 'DXY Equiv.', 'Tier', 'Classification'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
    ], col_widths=[0.85*inch, 0.7*inch, 0.85*inch, 0.85*inch, 0.45*inch, 2.1*inch]),
]))
story.append(spacer(3))

# Additional days as needed
story.append(KeepTogether([
    p('[FILL IN: Remaining days note, e.g., Wednesday-Friday: [NO DATA]. IP levels derived from structural pillars only.]', style_small),
    p('[FILL IN: K Factor Audit Trail: K=... | USDJPY=... GBPUSD=... USDCAD=... USDSEK=... USDCHF=... | Confidence band: \u00b1X.XX DXY]', style_mono),
]))

# ============================================================
# SECTION 2: DXY IP Zone Map — 9-Pillar 6D Hybrid System
# ============================================================
story.append(CondPageBreak(140))  # Rule 44

# Pillar 1: Pivots — KeepTogether(section heading + hr + subheading + table)
story.append(KeepTogether([
    p('2. DXY Institutional Pressure Zone Map \u2014 9-Pillar 6D Hybrid System', style_section),
    hr(C_NAVY, 1.5),
    p('Pillar 1: Multi-Timeframe Pivot Engine', style_sub),
    p('[FILL IN: Weekly H/L/C, e.g., Weekly (May 18-22): H=99.52 L=98.95 C=99.32]', style_small),
    make_corporate_table([
        ['Variant', 'R3', 'R2', 'R1', 'PP', 'S1', 'S2', 'S3'],
        ['[FILL IN: Classic W]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN: Fibonacci W]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN: Camarilla W]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN: Classic D (date)]', '\u2014', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '\u2014'],
        ['[FILL IN: Classic D (date)]', '\u2014', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '\u2014'],
    ], col_widths=[1.15*inch, 0.65*inch, 0.65*inch, 0.65*inch, 0.65*inch, 0.65*inch, 0.65*inch, 0.65*inch]),
]))
story.append(spacer(2))
story.append(KeepTogether([
    p('[FILL IN: Pivot audit trail]', style_mono),
]))

# Pillar 2: MA Grid — CondPageBreak(140) + KeepTogether(subheading + table + cluster text)
story.append(CondPageBreak(140))
story.append(KeepTogether([
    p('Pillar 2: Moving Average Confluence Grid', style_sub),
    make_corporate_table([
        ['MA', 'Value', 'Position vs Spot', 'Weight', 'Confluence'],
        ['[FILL IN: e.g., SMA 200]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN: e.g., SMA 100]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN: e.g., EMA 200]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN: e.g., SMA 50]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN: e.g., EMA 50]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN: e.g., SMA 20]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN: e.g., EMA 20]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN: e.g., SMA 10]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN: e.g., EMA 10]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN: e.g., SMA 9]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN: e.g., EMA 9]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
    ], col_widths=[0.7*inch, 0.65*inch, 1.35*inch, 0.6*inch, 1.0*inch]),
    spacer(2),
    p('[FILL IN: CLUSTER 1: X.XX-X.XX (N MAs) \u2014 description]', style_body_bold),
    p('[FILL IN: CLUSTER 2: X.XX-X.XX (N MAs) \u2014 description]', style_body_bold),
]))

# Pillar 8: EUR/USD Strike-to-DXY — CondPageBreak(140) + KeepTogether
story.append(CondPageBreak(140))
story.append(KeepTogether([
    p('Pillar 8: EUR/USD Strike-to-DXY Primary Conversion', style_sub),
    make_corporate_table([
        ['Day', 'EUR/USD Strike', 'Notional', 'DXY Equiv.', 'Tier', 'Conf. Band'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
    ], col_widths=[0.85*inch, 0.95*inch, 0.8*inch, 0.85*inch, 0.45*inch, 0.85*inch]),
]))

# Pillar 4: Institutional Commentary — CondPageBreak(140) + KeepTogether
story.append(CondPageBreak(140))
story.append(KeepTogether([
    p('Pillar 4: Institutional Commentary', style_sub),
    make_corporate_table([
        ['Source', 'Level', 'Type', 'Tier'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
    ], col_widths=[0.85*inch, 1.25*inch, 1.9*inch, 1.1*inch]),
]))

# Pillar 5: Structural Extremes — CondPageBreak(140) + KeepTogether for each sub-table
story.append(CondPageBreak(140))
story.append(KeepTogether([
    p('Pillar 5: Structural Extreme Scan + Liquidity Sweep Zones', style_sub),
    p('Key Swing Lows (Liquidity Sweep Targets):', style_sub2),
    make_corporate_table([
        ['Date', 'Exact Low', 'Wick Size', 'Close %', 'Subsequent Rally'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
    ], col_widths=[0.7*inch, 0.8*inch, 0.7*inch, 0.65*inch, 1.85*inch]),
]))
story.append(spacer(3))

story.append(KeepTogether([
    p('Key Swing Highs (Supply Ceiling Targets):', style_sub2),
    make_corporate_table([
        ['Date', 'Exact High', 'Wick Size', 'Close %', 'Subsequent Decline'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
    ], col_widths=[0.7*inch, 0.8*inch, 0.7*inch, 0.65*inch, 1.85*inch]),
]))
story.append(spacer(3))

# Magnets + Reversals — KeepTogether(all bullets)
story.append(KeepTogether([
    p('Repeated Extreme Magnets:', style_sub2),
    p('\u2022 [FILL IN: magnet range (N occurrences) \u2014 MAGNET TYPE. Bonus: +X.X]', style_body_bold),
    p('\u2022 [FILL IN: magnet range (N occurrences) \u2014 MAGNET TYPE. Bonus: +X.X]', style_body_bold),
    p('\u2022 [FILL IN: magnet range (N occurrences) \u2014 MAGNET TYPE. Bonus: +X.X]', style_body_bold),
    p('Role Reversals:', style_sub2),
    p('\u2022 [FILL IN: date Low (X.XX) \u2248 date High (X.XX)]', style_body),
    p('\u2022 [FILL IN: date Low (X.XX) \u2248 date High (X.XX)]', style_body),
    p('\u2022 [FILL IN: date Low (X.XX) \u2248 date High (X.XX)]', style_body),
]))

# ============================================================
# SECTION 3: DXY IP Zone Synthesis
# ============================================================
story.append(CondPageBreak(140))
story.append(KeepTogether([
    p('3. DXY Institutional Pressure Zone Map \u2014 Synthesis', style_section),
    hr(C_NAVY, 1.5),
    p('MODERATE AND ABOVE PRESSURE ZONES ONLY', style_small),
    spacer(2),
    make_corporate_table([
        ['Zone', 'Range', 'Pressure', 'Score', 'ZFP', 'POI Tier', 'Key Drivers'],
        ['[FILL IN: #1 Zone Name]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN: driver summary]'],
        ['[FILL IN: #2 Zone Name]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN: driver summary]'],
        ['[FILL IN: #3 Zone Name]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN: driver summary]'],
        ['[FILL IN: #4 Zone Name]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN: driver summary]'],
        ['[FILL IN: #5 Zone Name]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN: driver summary]'],
        ['[FILL IN: #6 Zone Name]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN: driver summary]'],
    ], col_widths=[1.1*inch, 0.9*inch, 1.2*inch, 0.45*inch, 0.4*inch, 0.65*inch, 2.15*inch]),
]))
story.append(spacer(3))

# Zone details — each zone block is KeepTogether (Rule 40)
for zn, zname, zrange, zkv in [
    ('#1', '[FILL IN: Zone Name]', '[FILL IN: Range]', [
        ['4H Overlay', '[FILL IN]'],
        ['Liquidity Sweep', '[FILL IN]'],
        ['[FILL IN: Key Driver]', '[FILL IN]'],
    ]),
    ('#2', '[FILL IN: Zone Name]', '[FILL IN: Range]', [
        ['4H Overlay', '[FILL IN]'],
        ['Liquidity Sweep', '[FILL IN]'],
        ['[FILL IN: Key Driver]', '[FILL IN]'],
    ]),
    ('#3', '[FILL IN: Zone Name]', '[FILL IN: Range]', [
        ['4H Overlay', '[FILL IN]'],
        ['Liquidity Sweep', '[FILL IN]'],
        ['[FILL IN: Key Driver]', '[FILL IN]'],
    ]),
    ('#4', '[FILL IN: Zone Name]', '[FILL IN: Range]', [
        ['4H Overlay', '[FILL IN]'],
        ['Liquidity Sweep', '[FILL IN]'],
        ['[FILL IN: Key Driver]', '[FILL IN]'],
    ]),
    ('#5', '[FILL IN: Zone Name]', '[FILL IN: Range]', [
        ['4H Overlay', '[FILL IN]'],
        ['Liquidity Sweep', '[FILL IN]'],
        ['[FILL IN: Key Driver]', '[FILL IN]'],
    ]),
    ('#6', '[FILL IN: Zone Name]', '[FILL IN: Range]', [
        ['4H Overlay', '[FILL IN]'],
        ['Liquidity Sweep', '[FILL IN]'],
        ['[FILL IN: Key Driver]', '[FILL IN]'],
    ]),
]:
    story.append(KeepTogether([
        p(f'Zone {zn}: {zname} ({zrange})', style_zone),
        make_kv_table(zkv, col_widths=[1.4*inch, 5.15*inch]),
    ]))
    story.append(spacer(2))  # Rule 35

# LSZ Summary — CondPageBreak(140) + KeepTogether
story.append(CondPageBreak(140))
story.append(KeepTogether([
    p('Liquidity Sweep Zone Summary:', style_sub),
    make_corporate_table([
        ['LSZ Range', 'Type', 'Source', 'Priority', 'Function'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
    ], col_widths=[0.85*inch, 0.8*inch, 1.65*inch, 1.15*inch, 1.65*inch]),
    spacer(2),
    p(f'<b>CURRENT SPOT:</b> {TEMPLATE_SPOT_DXY} | <b>SPOT POSITION:</b> [FILL IN: Between Zone #X and Zone #Y \u2014 description]', style_body_bold),
]))

# ============================================================
# SECTION 4: DXY 4H Zone Classification
# ============================================================
story.append(CondPageBreak(140))
story.append(KeepTogether([
    p('4. DXY 4H Zone Classification Overlay Summary', style_section),
    hr(C_NAVY, 1.5),
    make_corporate_table([
        ['Classification', 'Type', 'Range', 'Origin Date', 'Mitigation', 'Directional Move', 'Next Candle', 'Overlap'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
    ], col_widths=[0.9*inch, 0.75*inch, 0.9*inch, 0.85*inch, 0.65*inch, 1.1*inch, 0.7*inch, 0.75*inch]),
]))

# ============================================================
# SECTION 5: Economic Calendar + Red Folder Time-Locks
# ============================================================
story.append(CondPageBreak(140))
story.append(KeepTogether([
    p('5. Economic Calendar and Red Folder Time-Locks (Protocol F)', style_section),
    hr(C_NAVY, 1.5),
    make_corporate_table([
        ['Day', 'Time (ET)', 'Event', 'Currency', 'Impact'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
    ], col_widths=[1.1*inch, 0.8*inch, 1.9*inch, 0.75*inch, 1.75*inch]),
    spacer(3),
    p('Red Folder Time-Locks:', style_sub2),
    p('\u2022 [FILL IN: Time: Event \u2014 Lock X:XX AM, resume X:XX AM]', style_body),
    p('\u2022 [FILL IN: Time: Event \u2014 Lock X:XX AM, resume X:XX AM]', style_body),
    p('\u2022 [FILL IN: Time: Event \u2014 Lock X:XX AM, resume X:XX AM]', style_body),
]))

# ============================================================
# SECTION 6: Missing Data Log
# ============================================================
story.append(CondPageBreak(140))
story.append(KeepTogether([
    p('6. Missing Data Log', style_section),
    hr(C_NAVY, 1.5),
    make_corporate_table([
        ['Protocol / Data', 'Status', 'Reason'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]'],
    ], col_widths=[1.7*inch, 0.8*inch, 4.1*inch]),
]))

# ============================================================
# SECTION 7: DXY Macro Shape Chain Map (Engine 2)
# Note: Section heading is NOT in KeepTogether — Steps are individually KT'd
# ============================================================
story.append(CondPageBreak(140))
story.append(p('7. DXY Macro Shape Chain Map (Engine 2)', style_section))
story.append(hr(C_NAVY, 1.5))

# Step 1: KeepTogether(subheading + kv_table) — Rule 41
story.append(KeepTogether([
    p('Step 1: Current Shape Identification', style_sub),
    make_kv_table([
        ['Current Shape', '[FILL IN: e.g., SWING SCALP (SS)]'],
        ['Anchor Zone', '[FILL IN: Zone #N Name (Range)]'],
        ['Pressure', '[FILL IN: e.g., MODERATE-HEAVY (8/14)]'],
        ['ZFP', '[FILL IN: e.g., 20%]'],
        ['Price Position', '[FILL IN: Description of price position relative to zones]'],
        ['Regime', '[FILL IN: e.g., MOMENTUM \u2014 description]'],
    ], col_widths=[1.4*inch, 5.15*inch]),
]))
story.append(spacer(3))

# Step 2: KeepTogether(subheading + corporate_table)
story.append(KeepTogether([
    p('Step 2: Transition Probability Assessment', style_sub),
    make_corporate_table([
        ['Transition', 'Trigger Zone', 'ZFP', 'Condition', 'Probability'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
    ], col_widths=[0.95*inch, 1.2*inch, 0.45*inch, 2.2*inch, 1.4*inch]),
]))
story.append(spacer(3))

# Step 3: KeepTogether(subheading + kv_table) + KeepTogether(chain corporate_table)
story.append(KeepTogether([
    p('Step 3: Primary Chain Extension', style_sub),
    make_kv_table([
        ['Chain Summary', '[FILL IN: Shape transition summary]'],
        ['Primary Path', '[FILL IN: Primary path description]'],
        ['Upside Trigger', '[FILL IN: Break above X.XX \u2192 BS to range]'],
        ['Downside Trigger', '[FILL IN: Break below X.XX \u2192 BS to range]'],
        ['Whiplash Risk', '[FILL IN: Risk level \u2014 description]'],
    ], col_widths=[1.4*inch, 5.15*inch]),
]))
story.append(spacer(3))

story.append(KeepTogether([
    make_corporate_table([
        ['Step', 'Current Shape', 'Zone/Condition', 'Prediction', 'Trigger/Rationale', 'Confidence'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
    ], col_widths=[0.4*inch, 0.9*inch, 1.3*inch, 1.2*inch, 1.6*inch, 0.9*inch]),
]))
story.append(spacer(3))

# Step 4: KeepTogether(subheading + kv_table)
story.append(KeepTogether([
    p('Step 4: Decision Zone', style_sub),
    make_kv_table([
        ['Decision Zone', '[FILL IN: Zone #N Name (Range)]'],
        ['If Zone FAILS', '[FILL IN: BS direction and target]'],
        ['If Zone HOLDS', '[FILL IN: SS continues, price pinned in range]'],
    ], col_widths=[1.4*inch, 5.15*inch]),
]))
story.append(spacer(3))

# Weekly Shape Chain Visualization: KeepTogether(subheading + corporate_table)
story.append(KeepTogether([
    p('Weekly Shape Chain Visualization:', style_sub),
    make_corporate_table([
        ['Day', 'Predicted Shape', 'Shape Context', 'Key Transition Time', 'Confidence'],
        ['[FILL IN: Day 1]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN: Day 2]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN: Day 3]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN: Day 4]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN: Day 5]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
    ], col_widths=[1.0*inch, 1.0*inch, 2.3*inch, 1.15*inch, 1.0*inch]),
]))

# ============================================================
# SECTION 8: DXY Volatility Trigger Summary
# ============================================================
story.append(CondPageBreak(140))
story.append(KeepTogether([
    p('8. DXY Volatility Trigger Summary', style_section),
    hr(C_NAVY, 1.5),
    make_corporate_table([
        ['Trigger', 'Strike Time', 'Context', 'Analysis'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
    ], col_widths=[1.15*inch, 1.15*inch, 2.2*inch, 2.3*inch]),
]))

# ================================================================
# EUR/USD PAIR TRANSLATION — HARD PAGE BREAK (Rule 43)
# ================================================================
story.append(PageBreak())

# Pair cover (Rule 48): Spacer(1, 0.3*inch) + pair title (36pt, pair accent color)
story.append(Spacer(1, 0.3*inch))
story.append(p('EUR/USD', ParagraphStyle('EUCoverTitle', fontSize=36, leading=42,
    fontName='Helvetica-Bold', textColor=C_EU_ACCENT, alignment=TA_CENTER, spaceAfter=12)))
story.append(p('Institutional Pressure Zone Translation', style_cover_sub))
story.append(spacer(2))
story.append(p(f'<b>Spot: {TEMPLATE_SPOT_EU}</b> [FILL IN: Web consensus details]', style_cover_red))
story.append(spacer(2))
story.append(p(f'Approach B: Structural Equivalence \u2014 Pair ACTUAL levels + DXY directional conviction', style_cover_center))
story.append(spacer(2))

# Translation rule table (Rule 46: spacer(8) between cover tables)
story.append(make_cover_summary_table([
    ['Translation Rule', 'Description'],
    ['DXY Resistance \u2192 Pair Support', 'When DXY can\'t go higher, pair stops falling'],
    ['DXY Support \u2192 Pair Resistance', 'When DXY bounces, pair reverses from highs'],
    ['Price Levels', 'From pair\'s OWN price action (MA, swing structure, options)'],
    ['Zone Pressure', 'Inherited from DXY directional conviction (inverted)'],
    ['LSZ Direction', 'DXY supply LSZ \u2192 pair demand LSZ; DXY demand LSZ \u2192 pair supply LSZ'],
], col_widths=[1.8*inch, 4.6*inch]))
story.append(spacer(8))  # Rule 46: spacer(8) between cover tables

# Key levels table
story.append(make_cover_summary_table([
    ['[FILL IN: Key Level Type]', '[FILL IN: Level value + source]'],
    ['[FILL IN: Key Level Type]', '[FILL IN: Level value + source]'],
    ['[FILL IN: Key Level Type]', '[FILL IN: Level value + source]'],
    ['[FILL IN: Key Level Type]', '[FILL IN: Level value + source]'],
    ['[FILL IN: Key Level Type]', '[FILL IN: Level value + source]'],
    ['[FILL IN: Key Level Type]', '[FILL IN: Level value + source]'],
], col_widths=[1.4*inch, 5.0*inch]))

# ============================================================
# SECTION 9: EUR/USD IP Zone Map Synthesis
# ============================================================
story.append(CondPageBreak(140))
story.append(KeepTogether([
    p('9. EUR/USD IP Zone Map Synthesis (Structural Equivalence)', style_section_eu),
    hr(C_EU_ACCENT, 1.5),
    p('[FILL IN: Description of translation method for this pair]', style_small),
    spacer(2),
    make_corporate_table([
        ['Zone', 'Range', 'Pressure', 'Score', 'ZFP', 'POI Tier', 'Key Drivers'],
        ['[FILL IN: #1 Zone Name]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN: #2 Zone Name]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN: #3 Zone Name]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN: #4 Zone Name]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN: #5 Zone Name]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN: #6 Zone Name]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
    ], col_widths=[1.1*inch, 0.9*inch, 1.2*inch, 0.45*inch, 0.4*inch, 0.65*inch, 2.15*inch]),
]))
story.append(spacer(3))

# EUR/USD Zone details — KeepTogether for each zone (Rule 40)
for zn, zname, zrange, zkv in [
    ('#1', '[FILL IN: Zone Name]', '[FILL IN: Range]', [
        ['4H Overlay', '[FILL IN]'],
        ['Liquidity Sweep', '[FILL IN]'],
        ['[FILL IN: Key Driver]', '[FILL IN]'],
    ]),
    ('#2', '[FILL IN: Zone Name]', '[FILL IN: Range]', [
        ['4H Overlay', '[FILL IN]'],
        ['Liquidity Sweep', '[FILL IN]'],
        ['[FILL IN: Key Driver]', '[FILL IN]'],
    ]),
    ('#3', '[FILL IN: Zone Name]', '[FILL IN: Range]', [
        ['4H Overlay', '[FILL IN]'],
        ['Liquidity Sweep', '[FILL IN]'],
        ['[FILL IN: Key Driver]', '[FILL IN]'],
    ]),
    ('#4', '[FILL IN: Zone Name]', '[FILL IN: Range]', [
        ['4H Overlay', '[FILL IN]'],
        ['Liquidity Sweep', '[FILL IN]'],
        ['[FILL IN: Key Driver]', '[FILL IN]'],
    ]),
    ('#5', '[FILL IN: Zone Name]', '[FILL IN: Range]', [
        ['4H Overlay', '[FILL IN]'],
        ['Liquidity Sweep', '[FILL IN]'],
        ['[FILL IN: Key Driver]', '[FILL IN]'],
    ]),
    ('#6', '[FILL IN: Zone Name]', '[FILL IN: Range]', [
        ['4H Overlay', '[FILL IN]'],
        ['Liquidity Sweep', '[FILL IN]'],
        ['[FILL IN: Key Driver]', '[FILL IN]'],
    ]),
]:
    story.append(KeepTogether([
        p(f'Zone {zn}: {zname} ({zrange})', style_zone_eu),
        make_kv_table(zkv, col_widths=[1.4*inch, 5.15*inch]),
    ]))
    story.append(spacer(2))

# EUR/USD LSZ Summary — CondPageBreak(140) + KeepTogether
story.append(CondPageBreak(140))
story.append(KeepTogether([
    p('EUR/USD Liquidity Sweep Zone Summary:', style_sub),
    make_corporate_table([
        ['LSZ Range', 'Type', 'Source (Inverted from DXY)', 'Priority', 'Function'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
    ], col_widths=[0.85*inch, 0.8*inch, 1.65*inch, 1.15*inch, 1.65*inch]),
    spacer(2),
    p(f'<b>CURRENT SPOT:</b> {TEMPLATE_SPOT_EU} | <b>SPOT POSITION:</b> [FILL IN: Zone position description]', style_body_bold),
]))

# ============================================================
# SECTION 10: EUR/USD 4H Zone Classification
# ============================================================
story.append(CondPageBreak(140))
story.append(KeepTogether([
    p('10. EUR/USD 4H Zone Classification Overlay Summary', style_section_eu),
    hr(C_EU_ACCENT, 1.5),
    make_corporate_table([
        ['Classification', 'Type', 'Range', 'Origin Date', 'Mitigation', 'Directional Move', 'Next Candle', 'Overlap'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
    ], col_widths=[0.9*inch, 0.75*inch, 0.9*inch, 0.85*inch, 0.65*inch, 1.1*inch, 0.7*inch, 0.75*inch]),
]))

# ============================================================
# SECTION 11: EUR/USD Institutional Commentary
# ============================================================
story.append(CondPageBreak(140))
story.append(KeepTogether([
    p('11. EUR/USD Institutional Commentary (Layer 2 Verified)', style_section_eu),
    hr(C_EU_ACCENT, 1.5),
    make_corporate_table([
        ['Source', 'Level', 'Type', 'Tier'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
    ], col_widths=[1.1*inch, 1.35*inch, 1.6*inch, 1.05*inch]),
    spacer(2),
    p('[FILL IN: MA signal summary, e.g., Investing.com MA Signals: N Buy, N Sell \u2192 outlook]', style_body_bold),
]))

# ============================================================
# SECTION 12: EUR/USD Weekly Shape Chain Visualization
# ============================================================
story.append(CondPageBreak(140))
story.append(KeepTogether([
    p('12. EUR/USD Weekly Shape Chain Visualization', style_section_eu),
    hr(C_EU_ACCENT, 1.5),
    p('Inverted from DXY Shape Chain. EUR/USD direction is inverse of DXY.', style_small),
    spacer(2),
    make_corporate_table([
        ['Day', 'Predicted Shape', 'Shape Context', 'Key Transition Time', 'Confidence'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
    ], col_widths=[1.0*inch, 1.3*inch, 2.0*inch, 1.15*inch, 1.0*inch]),
]))

# ============================================================
# SECTION 13: EUR/USD Volatility Trigger Summary
# ============================================================
story.append(CondPageBreak(140))
story.append(KeepTogether([
    p('13. EUR/USD Volatility Trigger Summary', style_section_eu),
    hr(C_EU_ACCENT, 1.5),
    make_corporate_table([
        ['Trigger', 'Strike Time', 'Context', 'Analysis'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
    ], col_widths=[1.15*inch, 1.15*inch, 2.2*inch, 2.3*inch]),
]))

# ================================================================
# GBP/USD PAIR TRANSLATION — HARD PAGE BREAK (Rule 43)
# ================================================================
story.append(PageBreak())

# Pair cover (Rule 48)
story.append(Spacer(1, 0.3*inch))
story.append(p('GBP/USD', ParagraphStyle('GUCoverTitle', fontSize=36, leading=42,
    fontName='Helvetica-Bold', textColor=C_GU_ACCENT, alignment=TA_CENTER, spaceAfter=12)))
story.append(p('Institutional Pressure Zone Translation', style_cover_sub))
story.append(spacer(2))
story.append(p(f'<b>Spot: {TEMPLATE_SPOT_GU}</b> [FILL IN: Web consensus details]', style_cover_red))
story.append(spacer(2))
story.append(p('Approach B: Structural Equivalence \u2014 Pair ACTUAL levels + DXY directional conviction', style_cover_center))
story.append(spacer(2))

# Translation rule table
story.append(make_cover_summary_table([
    ['Translation Rule', 'Description'],
    ['DXY Resistance \u2192 Pair Support', 'When DXY can\'t go higher, pair stops falling'],
    ['DXY Support \u2192 Pair Resistance', 'When DXY bounces, pair reverses from highs'],
    ['Price Levels', 'From pair\'s OWN price action (MA, swing structure)'],
    ['Zone Pressure', 'Inherited from DXY directional conviction (inverted)'],
    ['LSZ Direction', 'DXY supply LSZ \u2192 pair demand LSZ; DXY demand LSZ \u2192 pair supply LSZ'],
], col_widths=[1.8*inch, 4.6*inch]))
story.append(spacer(8))  # Rule 46

# Key levels table
story.append(make_cover_summary_table([
    ['[FILL IN: Key Level Type]', '[FILL IN: Level value + source]'],
    ['[FILL IN: Key Level Type]', '[FILL IN: Level value + source]'],
    ['[FILL IN: Key Level Type]', '[FILL IN: Level value + source]'],
    ['[FILL IN: Key Level Type]', '[FILL IN: Level value + source]'],
    ['[FILL IN: Key Level Type]', '[FILL IN: Level value + source]'],
], col_widths=[1.4*inch, 5.0*inch]))

# ============================================================
# SECTION 14: GBP/USD IP Zone Map Synthesis
# ============================================================
story.append(CondPageBreak(140))
story.append(KeepTogether([
    p('14. GBP/USD IP Zone Map Synthesis (Structural Equivalence)', style_section_gu),
    hr(C_GU_ACCENT, 1.5),
    p('[FILL IN: Description of translation method for this pair]', style_small),
    spacer(2),
    make_corporate_table([
        ['Zone', 'Range', 'Pressure', 'Score', 'ZFP', 'POI Tier', 'Key Drivers'],
        ['[FILL IN: #1 Zone Name]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN: #2 Zone Name]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN: #3 Zone Name]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN: #4 Zone Name]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN: #5 Zone Name]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN: #6 Zone Name]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
    ], col_widths=[1.1*inch, 0.9*inch, 1.2*inch, 0.45*inch, 0.4*inch, 0.65*inch, 2.15*inch]),
]))
story.append(spacer(3))

# GBP/USD Zone details — KeepTogether for each zone (Rule 40)
for zn, zname, zrange, zkv in [
    ('#1', '[FILL IN: Zone Name]', '[FILL IN: Range]', [
        ['4H Overlay', '[FILL IN]'],
        ['Liquidity Sweep', '[FILL IN]'],
        ['[FILL IN: Key Driver]', '[FILL IN]'],
    ]),
    ('#2', '[FILL IN: Zone Name]', '[FILL IN: Range]', [
        ['4H Overlay', '[FILL IN]'],
        ['Liquidity Sweep', '[FILL IN]'],
        ['[FILL IN: Key Driver]', '[FILL IN]'],
    ]),
    ('#3', '[FILL IN: Zone Name]', '[FILL IN: Range]', [
        ['4H Overlay', '[FILL IN]'],
        ['Liquidity Sweep', '[FILL IN]'],
        ['[FILL IN: Key Driver]', '[FILL IN]'],
    ]),
    ('#4', '[FILL IN: Zone Name]', '[FILL IN: Range]', [
        ['4H Overlay', '[FILL IN]'],
        ['Liquidity Sweep', '[FILL IN]'],
        ['[FILL IN: Key Driver]', '[FILL IN]'],
    ]),
    ('#5', '[FILL IN: Zone Name]', '[FILL IN: Range]', [
        ['4H Overlay', '[FILL IN]'],
        ['Liquidity Sweep', '[FILL IN]'],
        ['[FILL IN: Key Driver]', '[FILL IN]'],
    ]),
    ('#6', '[FILL IN: Zone Name]', '[FILL IN: Range]', [
        ['4H Overlay', '[FILL IN]'],
        ['Liquidity Sweep', '[FILL IN]'],
        ['[FILL IN: Key Driver]', '[FILL IN]'],
    ]),
]:
    story.append(KeepTogether([
        p(f'Zone {zn}: {zname} ({zrange})', style_zone_gu),
        make_kv_table(zkv, col_widths=[1.4*inch, 5.15*inch]),
    ]))
    story.append(spacer(2))

# GBP/USD LSZ Summary
story.append(CondPageBreak(140))
story.append(KeepTogether([
    p('GBP/USD Liquidity Sweep Zone Summary:', style_sub),
    make_corporate_table([
        ['LSZ Range', 'Type', 'Source (Inverted from DXY)', 'Priority', 'Function'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
    ], col_widths=[0.85*inch, 0.8*inch, 1.65*inch, 1.15*inch, 1.65*inch]),
    spacer(2),
    p(f'<b>CURRENT SPOT:</b> {TEMPLATE_SPOT_GU} | <b>SPOT POSITION:</b> [FILL IN: Zone position description]', style_body_bold),
]))

# ============================================================
# SECTION 15: GBP/USD 4H Zone Classification
# ============================================================
story.append(CondPageBreak(140))
story.append(KeepTogether([
    p('15. GBP/USD 4H Zone Classification Overlay Summary', style_section_gu),
    hr(C_GU_ACCENT, 1.5),
    make_corporate_table([
        ['Classification', 'Type', 'Range', 'Origin Date', 'Mitigation', 'Directional Move', 'Next Candle', 'Overlap'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
    ], col_widths=[0.9*inch, 0.75*inch, 0.9*inch, 0.85*inch, 0.65*inch, 1.1*inch, 0.7*inch, 0.75*inch]),
]))

# ============================================================
# SECTION 16: GBP/USD Institutional Commentary
# ============================================================
story.append(CondPageBreak(140))
story.append(KeepTogether([
    p('16. GBP/USD Institutional Commentary (Layer 2 Verified)', style_section_gu),
    hr(C_GU_ACCENT, 1.5),
    make_corporate_table([
        ['Source', 'Level', 'Type', 'Tier'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
    ], col_widths=[1.1*inch, 1.35*inch, 1.6*inch, 1.05*inch]),
    spacer(2),
    p('[FILL IN: MA signal summary]', style_body_bold),
]))

# ============================================================
# SECTION 17: GBP/USD Weekly Shape Chain Visualization
# ============================================================
story.append(CondPageBreak(140))
story.append(KeepTogether([
    p('17. GBP/USD Weekly Shape Chain Visualization', style_section_gu),
    hr(C_GU_ACCENT, 1.5),
    p('Inverted from DXY Shape Chain. GBP/USD direction is inverse of DXY.', style_small),
    spacer(2),
    make_corporate_table([
        ['Day', 'Predicted Shape', 'Shape Context', 'Key Transition Time', 'Confidence'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
    ], col_widths=[1.0*inch, 1.3*inch, 2.0*inch, 1.15*inch, 1.0*inch]),
]))

# ============================================================
# SECTION 18: GBP/USD Volatility Trigger Summary
# ============================================================
story.append(CondPageBreak(140))
story.append(KeepTogether([
    p('18. GBP/USD Volatility Trigger Summary', style_section_gu),
    hr(C_GU_ACCENT, 1.5),
    make_corporate_table([
        ['Trigger', 'Strike Time', 'Context', 'Analysis'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
    ], col_widths=[1.15*inch, 1.15*inch, 2.2*inch, 2.3*inch]),
]))

# ================================================================
# AUD/USD PAIR TRANSLATION — HARD PAGE BREAK (Rule 43)
# ================================================================
story.append(PageBreak())

# Pair cover (Rule 48)
story.append(Spacer(1, 0.3*inch))
story.append(p('AUD/USD', ParagraphStyle('AUCoverTitle', fontSize=36, leading=42,
    fontName='Helvetica-Bold', textColor=C_AU_ACCENT, alignment=TA_CENTER, spaceAfter=12)))
story.append(p('Institutional Pressure Zone Translation', style_cover_sub))
story.append(spacer(2))
story.append(p(f'<b>Spot: {TEMPLATE_SPOT_AU}</b> [FILL IN: Web consensus details]', style_cover_red))
story.append(spacer(2))
story.append(p('Approach B: Structural Equivalence \u2014 Pair ACTUAL levels + DXY directional conviction', style_cover_center))
story.append(spacer(2))

# Translation rule table
story.append(make_cover_summary_table([
    ['Translation Rule', 'Description'],
    ['DXY Resistance \u2192 Pair Support', 'When DXY can\'t go higher, pair stops falling'],
    ['DXY Support \u2192 Pair Resistance', 'When DXY bounces, pair reverses from highs'],
    ['Price Levels', 'From pair\'s OWN price action (pivot, EMA, swing structure)'],
    ['Zone Pressure', 'Inherited from DXY directional conviction (inverted)'],
    ['LSZ Direction', 'DXY supply LSZ \u2192 pair demand LSZ; DXY demand LSZ \u2192 pair supply LSZ'],
], col_widths=[1.8*inch, 4.6*inch]))
story.append(spacer(8))  # Rule 46

# Key levels table
story.append(make_cover_summary_table([
    ['[FILL IN: Key Level Type]', '[FILL IN: Level value + source]'],
    ['[FILL IN: Key Level Type]', '[FILL IN: Level value + source]'],
    ['[FILL IN: Key Level Type]', '[FILL IN: Level value + source]'],
    ['[FILL IN: Key Level Type]', '[FILL IN: Level value + source]'],
    ['[FILL IN: Key Level Type]', '[FILL IN: Level value + source]'],
    ['[FILL IN: Key Level Type]', '[FILL IN: Level value + source]'],
    ['[FILL IN: Key Level Type]', '[FILL IN: Level value + source]'],
], col_widths=[1.4*inch, 5.0*inch]))

# ============================================================
# SECTION 19: AUD/USD IP Zone Map Synthesis
# ============================================================
story.append(CondPageBreak(140))
story.append(KeepTogether([
    p('19. AUD/USD IP Zone Map Synthesis (Structural Equivalence)', style_section_au),
    hr(C_AU_ACCENT, 1.5),
    p('[FILL IN: Description of translation method for this pair]', style_small),
    spacer(2),
    make_corporate_table([
        ['Zone', 'Range', 'Pressure', 'Score', 'ZFP', 'POI Tier', 'Key Drivers'],
        ['[FILL IN: #1 Zone Name]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN: #2 Zone Name]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN: #3 Zone Name]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN: #4 Zone Name]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN: #5 Zone Name]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN: #6 Zone Name]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
    ], col_widths=[1.1*inch, 0.9*inch, 1.2*inch, 0.45*inch, 0.4*inch, 0.65*inch, 2.15*inch]),
]))
story.append(spacer(3))

# AUD/USD Zone details — KeepTogether for each zone (Rule 40)
for zn, zname, zrange, zkv in [
    ('#1', '[FILL IN: Zone Name]', '[FILL IN: Range]', [
        ['4H Overlay', '[FILL IN]'],
        ['Liquidity Sweep', '[FILL IN]'],
        ['[FILL IN: Key Driver]', '[FILL IN]'],
    ]),
    ('#2', '[FILL IN: Zone Name]', '[FILL IN: Range]', [
        ['4H Overlay', '[FILL IN]'],
        ['Liquidity Sweep', '[FILL IN]'],
        ['[FILL IN: Key Driver]', '[FILL IN]'],
    ]),
    ('#3', '[FILL IN: Zone Name]', '[FILL IN: Range]', [
        ['4H Overlay', '[FILL IN]'],
        ['Liquidity Sweep', '[FILL IN]'],
        ['[FILL IN: Key Driver]', '[FILL IN]'],
    ]),
    ('#4', '[FILL IN: Zone Name]', '[FILL IN: Range]', [
        ['4H Overlay', '[FILL IN]'],
        ['Liquidity Sweep', '[FILL IN]'],
        ['[FILL IN: Key Driver]', '[FILL IN]'],
    ]),
    ('#5', '[FILL IN: Zone Name]', '[FILL IN: Range]', [
        ['4H Overlay', '[FILL IN]'],
        ['Liquidity Sweep', '[FILL IN]'],
        ['[FILL IN: Key Driver]', '[FILL IN]'],
    ]),
    ('#6', '[FILL IN: Zone Name]', '[FILL IN: Range]', [
        ['4H Overlay', '[FILL IN]'],
        ['Liquidity Sweep', '[FILL IN]'],
        ['[FILL IN: Key Driver]', '[FILL IN]'],
    ]),
]:
    story.append(KeepTogether([
        p(f'Zone {zn}: {zname} ({zrange})', style_zone_au),
        make_kv_table(zkv, col_widths=[1.4*inch, 5.15*inch]),
    ]))
    story.append(spacer(2))

# AUD/USD LSZ Summary
story.append(CondPageBreak(140))
story.append(KeepTogether([
    p('AUD/USD Liquidity Sweep Zone Summary:', style_sub),
    make_corporate_table([
        ['LSZ Range', 'Type', 'Source (Inverted from DXY)', 'Priority', 'Function'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
    ], col_widths=[0.85*inch, 0.8*inch, 1.65*inch, 1.15*inch, 1.65*inch]),
    spacer(2),
    p(f'<b>CURRENT SPOT:</b> {TEMPLATE_SPOT_AU} | <b>SPOT POSITION:</b> [FILL IN: Zone position description]', style_body_bold),
]))

# ============================================================
# SECTION 20: AUD/USD 4H Zone Classification
# ============================================================
story.append(CondPageBreak(140))
story.append(KeepTogether([
    p('20. AUD/USD 4H Zone Classification Overlay Summary', style_section_au),
    hr(C_AU_ACCENT, 1.5),
    make_corporate_table([
        ['Classification', 'Type', 'Range', 'Origin Date', 'Mitigation', 'Directional Move', 'Next Candle', 'Overlap'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
    ], col_widths=[0.9*inch, 0.75*inch, 0.9*inch, 0.85*inch, 0.65*inch, 1.1*inch, 0.7*inch, 0.75*inch]),
]))

# ============================================================
# SECTION 21: AUD/USD Institutional Commentary
# ============================================================
story.append(CondPageBreak(140))
story.append(KeepTogether([
    p('21. AUD/USD Institutional Commentary (Layer 2 Verified)', style_section_au),
    hr(C_AU_ACCENT, 1.5),
    make_corporate_table([
        ['Source', 'Level', 'Type', 'Tier'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
    ], col_widths=[1.1*inch, 1.35*inch, 1.6*inch, 1.05*inch]),
    spacer(2),
    p('[FILL IN: Additional context, e.g., weekly range, pivot info]', style_body_bold),
]))

# ============================================================
# SECTION 22: AUD/USD Weekly Shape Chain Visualization
# ============================================================
story.append(CondPageBreak(140))
story.append(KeepTogether([
    p('22. AUD/USD Weekly Shape Chain Visualization', style_section_au),
    hr(C_AU_ACCENT, 1.5),
    p('Inverted from DXY Shape Chain. AUD/USD direction is inverse of DXY.', style_small),
    spacer(2),
    make_corporate_table([
        ['Day', 'Predicted Shape', 'Shape Context', 'Key Transition Time', 'Confidence'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
    ], col_widths=[1.0*inch, 1.3*inch, 2.0*inch, 1.15*inch, 1.0*inch]),
]))

# ============================================================
# SECTION 23: AUD/USD Volatility Trigger Summary
# ============================================================
story.append(CondPageBreak(140))
story.append(KeepTogether([
    p('23. AUD/USD Volatility Trigger Summary', style_section_au),
    hr(C_AU_ACCENT, 1.5),
    make_corporate_table([
        ['Trigger', 'Strike Time', 'Context', 'Analysis'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
    ], col_widths=[1.15*inch, 1.15*inch, 2.2*inch, 2.3*inch]),
]))

# ================================================================
# SECTION 24: Data Quality & Verification Summary
# ================================================================
story.append(CondPageBreak(140))
story.append(KeepTogether([
    p('24. Data Quality & Verification Summary', style_section),
    hr(C_NAVY, 1.5),
    p('[FILL IN: Verification statement, e.g., Every data point verified against independent web sources.]', style_alert),
    spacer(2),
    p('EUR/USD Verification', style_sub),
    make_corporate_table([
        ['Data Point', 'Layer 1 Value', 'Layer 2 Web Source', 'Result'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
    ], col_widths=[1.2*inch, 1.5*inch, 1.8*inch, 0.65*inch]),
]))
story.append(spacer(3))

story.append(KeepTogether([
    p('GBP/USD Verification', style_sub),
    make_corporate_table([
        ['Data Point', 'Layer 1 Value', 'Layer 2 Web Source', 'Result'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
    ], col_widths=[1.2*inch, 1.5*inch, 1.8*inch, 0.65*inch]),
]))
story.append(spacer(3))

story.append(KeepTogether([
    p('AUD/USD Verification', style_sub),
    make_corporate_table([
        ['Data Point', 'Layer 1 Value', 'Layer 2 Web Source', 'Result'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
    ], col_widths=[1.2*inch, 1.5*inch, 1.8*inch, 0.65*inch]),
]))
story.append(spacer(3))

story.append(KeepTogether([
    p('[FILL IN: Correction audit statement, e.g., v1 used mathematical DXY\u2192pair conversion. v2 uses pair\'s ACTUAL structural levels. ALL levels verified.]', style_alert),
]))

# ================================================================
# SECTION 25: Cross-Pair Comparison Matrix (Rule 50)
# ================================================================
story.append(CondPageBreak(140))
story.append(KeepTogether([
    p('25. Cross-Pair Comparison Matrix', style_section),
    hr(C_NAVY, 1.5),
    p('[FILL IN: Description, e.g., DXY zones inverted across all three pairs. Price levels from each pair\'s own structure.]', style_small),
    spacer(2),
    make_corporate_table([
        ['DXY Zone', 'DXY Range', 'Pressure', 'EU Zone', 'EU Range', 'GU Zone', 'GU Range', 'AU Zone', 'AU Range'],
        ['[FILL IN: #1]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN: #2]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN: #3]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN: #4]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN: #5]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['[FILL IN: #6]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
    ], col_widths=[0.85*inch, 0.7*inch, 0.7*inch, 0.7*inch, 0.75*inch, 0.7*inch, 0.75*inch, 0.7*inch, 0.75*inch]),
]))
story.append(spacer(3))

# Spot Position Summary
story.append(KeepTogether([
    p('Spot Position Summary:', style_sub),
    make_corporate_table([
        ['Pair', 'Spot', 'Current Zone', 'Zone Name', 'Position', 'Nearest Support', 'Nearest Resistance'],
        ['DXY', f'{TEMPLATE_SPOT_DXY}', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['EUR/USD', f'{TEMPLATE_SPOT_EU}', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['GBP/USD', f'{TEMPLATE_SPOT_GU}', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['AUD/USD', f'{TEMPLATE_SPOT_AU}', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
    ], col_widths=[0.65*inch, 0.65*inch, 0.5*inch, 0.85*inch, 0.85*inch, 1.0*inch, 1.0*inch]),
]))
story.append(spacer(3))

# Directional Bias Summary
story.append(KeepTogether([
    p('Directional Bias Summary (Inverted from DXY):', style_sub),
    make_corporate_table([
        ['Pair', 'DXY Bias', 'Pair Bias', 'Confidence', 'Key Catalyst'],
        ['EUR/USD', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['GBP/USD', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
        ['AUD/USD', '[FILL IN]', '[FILL IN]', '[FILL IN]', '[FILL IN]'],
    ], col_widths=[0.65*inch, 0.85*inch, 2.35*inch, 0.85*inch, 0.85*inch]),
]))
story.append(spacer(3))

story.append(KeepTogether([
    p('[FILL IN: KEY INSIGHT summary paragraph about cross-pair dynamics and key catalysts]', style_alert),
]))

# ================================================================
# BUILD AND SAVE PDF
# ================================================================

print("All 25 sections built. Generating template PDF...")

doc = SimpleDocTemplate(
    OUTPUT_PATH,
    pagesize=letter,                              # Rule 19
    topMargin=0.50*inch,                           # Rule 20/36
    bottomMargin=0.50*inch,                         # Rule 20/36
    leftMargin=0.50*inch,                           # Rule 20/36
    rightMargin=0.50*inch,                          # Rule 20/36
    title='Leviathan Consolidated IP Report \u2014 TEMPLATE v2.0',
    author='Leviathan Ultra-Quant',
)

doc.build(story)
print(f"Template PDF generated successfully: {OUTPUT_PATH}")
print(f"File size: {os.path.getsize(OUTPUT_PATH):,} bytes")
