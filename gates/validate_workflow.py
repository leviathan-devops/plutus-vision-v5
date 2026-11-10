#!/usr/bin/env python3
"""Validate a PLUTUS VISION execution workflow as a compiler-grade build input.

A workflow is valid only when it contains the complete execution law: phases, turns,
targets/actions, pseudocode, gates, evidence, commits, target file manifest, dependency
graph, pre-written script suite, runtime suite, ASCII contract, refusal vocabulary,
protected-path law, and model-based-compiler boundaries. A checklist is rejected.

Exit:
  0  valid compiler-grade workflow
  1  REJECT(WORKFLOW_INVALIDATOR): <reason>
"""
from __future__ import annotations

import re
import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MIN_LINES = 1500
MIN_H2 = 40
MIN_TURNS = 30
MIN_FENCES = 100
MIN_UNIQUE_TOKENS = 100
REQUIRED_PHASES = [f"P{i}" for i in range(9)]
REQUIRED_TERMS = {
    "MISSION": 1,
    "SCOPE": 1,
    "ACCEPTANCE CRITERIA": 1,
    "TARGET FILE MANIFEST": 1,
    "PHASE DEPENDENCY GRAPH": 1,
    "WORKFLOW INVALIDATOR MACHINE": 1,
    "THE SCRIPT TESTING SUITE": 1,
    "THE DEEP CONTAINER / RUNTIME TESTING SUITE": 1,
    "THE SPEC ILLUSTRATED": 1,
    "FINAL EXECUTION LAW": 1,
    "R36": 1,
    "room budget": 1,
    "derived card": 1,
    "CLOUD_LOCAL_PARITY_OK": 1,
    "Bend": 1,
    "operator unlock": 1,
}
FORBIDDEN = [
    r"\[FILL\]",
    r"\bTODO\b",
    r"\bTBD\b",
    r"\byfinance\b",
    r"\bYahoo\b",
    r"Date\.now\(",
    r"synthetic (?:supply|demand|zone)",
    r"modify Pinebox",
    r"edit Pinebox",
    r"fork Pinebox",
    r"fallback source",
]
REQUIRED_FORBIDDEN_PATHS = [
    "archive/",
    "Checkpoints/v1-ship-approved-working-baseline/",
    "Original_Canon_Data/",
    "MASTER_CONTEXT/OPERATOR_RULINGS_PV.md",
]


def reject(reason: str) -> None:
    print(f"REJECT(WORKFLOW_INVALIDATOR): {reason}", file=sys.stderr)
    raise SystemExit(1)


def display_width(line: str) -> int:
    return sum(2 if unicodedata.east_asian_width(c) in "WF" else 1 for c in line)


def fenced_regions(text: str) -> list[tuple[int, int]]:
    regions: list[tuple[int, int]] = []
    start: int | None = None
    for n, line in enumerate(text.splitlines(), 1):
        if line.startswith("```"):
            if start is None:
                start = n
            else:
                regions.append((start, n))
                start = None
    if start is not None:
        reject("unclosed markdown fence")
    return regions


def in_fence(line_no: int, regions: list[tuple[int, int]]) -> bool:
    return any(a <= line_no <= b for a, b in regions)


def main() -> None:
    if len(sys.argv) != 2:
        reject("usage: validate_workflow.py <workflow.md>")
    path = Path(sys.argv[1])
    if not path.is_file():
        reject(f"workflow absent: {path}")
    text = path.read_text(encoding="utf-8", errors="replace")
    lines = text.splitlines()

    if len(lines) < MIN_LINES:
        reject(f"line count {len(lines)} < {MIN_LINES}")
    h2 = [line for line in lines if line.startswith("## ")]
    if len(h2) < MIN_H2:
        reject(f"H2 section count {len(h2)} < {MIN_H2}")
    headings = [line[3:].strip() for line in h2]
    duplicates = sorted({h for h in headings if headings.count(h) > 1})
    if duplicates:
        reject(f"duplicate headings: {duplicates[:5]}")

    turn_heads = [(n, line[3:].strip()) for n, line in enumerate(lines, 1) if re.match(r"^## P[0-8]\.TURN-[0-9]+", line)]
    if len(turn_heads) < MIN_TURNS:
        reject(f"turn count {len(turn_heads)} < {MIN_TURNS}")
    if len(re.findall(r"^```", text, re.M)) < MIN_FENCES:
        reject("code fence count below floor")

    for phase in REQUIRED_PHASES:
        if not re.search(rf"^# {re.escape(phase)} —", text, re.M):
            reject(f"phase absent: {phase}")

    # Each turn must carry executable content and a gate.
    for i, (start, _name) in enumerate(turn_heads):
        end = turn_heads[i + 1][0] if i + 1 < len(turn_heads) else len(lines) + 1
        body = "\n".join(lines[start:end])
        has_work = any(
            marker in body
            for marker in ("**ACTION**", "**TARGET**", "**PSEUDOCODE**")
        )
        if not has_work:
            reject(f"turn has no ACTION/TARGET/PSEUDOCODE: {_name}")
        if "**GATE**" not in body:
            reject(f"turn has no GATE: {_name}")

    # Gate blocks must carry a command or fenced artifact.
    for match in re.finditer(r"\*\*GATE\*\*", text):
        line_no = text[: match.start()].count("\n") + 1
        window = "\n".join(lines[line_no - 1 : line_no + 25])
        if not ("```" in window or "bun " in window or "python3 " in window or "test " in window):
            reject(f"GATE without command near line {line_no}")

    # Required authority terms.
    for term, minimum in REQUIRED_TERMS.items():
        if len(re.findall(re.escape(term), text, re.I)) < minimum:
            reject(f"required term absent: {term}")

    # Forbidden material.
    for pattern in FORBIDDEN:
        if re.search(pattern, text, re.I):
            reject(f"forbidden material present: {pattern}")

    for protected in REQUIRED_FORBIDDEN_PATHS:
        if protected not in text:
            reject(f"protected path not named: {protected}")

    # E2/E3 may be named only as deferred/out of scope.
    for stage in ("E2", "E3"):
        occurrences = [lines[n - 1] for n, line in enumerate(lines, 1) if stage in line]
        if occurrences and not any(re.search(r"(defer|out of scope|not start|only after|prepare E2 contracts|locked)", line, re.I) for line in occurrences):
            reject(f"{stage} appears without deferral boundary")

    # Random weeks must be locked.
    random_rows = [line for line in lines if re.search(r"random[- ]week", line, re.I)]
    if not random_rows or not any(re.search(r"(unlock|locked|out of scope|not start)", line, re.I) for line in random_rows):
        reject("random-week work is not locked behind operator unlock")

    # Bend must not be the E1 runtime.
    if not re.search(r"Bend is not the E1 runtime|not the E1 runtime", text, re.I):
        reject("Bend runtime boundary absent")

    # Unique pass tokens.
    tokens = sorted(set(re.findall(r"\b[A-Z][A-Z0-9]+(?:_[A-Z0-9]+)+\b", text)))
    if len(tokens) < MIN_UNIQUE_TOKENS:
        reject(f"unique named tokens {len(tokens)} < {MIN_UNIQUE_TOKENS}")

    # Turn/commit mapping: a turn must either declare a commit or explicitly say no commit/stop.
    for i, (start, _name) in enumerate(turn_heads):
        end = turn_heads[i + 1][0] if i + 1 < len(turn_heads) else len(lines) + 1
        body = "\n".join(lines[start:end])
        if "**COMMIT**" not in body and not re.search(r"No commit|no commit|STOP|operator unlock|When ordered", body, re.I):
            reject(f"turn has no commit disposition: {_name}")

    # Manifest paths: every declared new target must be project-relative and non-protected.
    manifest_rows = re.findall(r"\|\s*`([^`]+)`\s*\|\s*(?:new|edit)\s*\|", text, re.I)
    if len(manifest_rows) < 20:
        reject(f"target manifest rows {len(manifest_rows)} < 20")
    for rel in manifest_rows:
        if rel.startswith("/") or ".." in rel:
            reject(f"non-project target path: {rel}")
        if rel.startswith(tuple(REQUIRED_FORBIDDEN_PATHS)):
            reject(f"protected target path: {rel}")

    # ASCII diagrams: every box-drawing line inside fences must be <= 76 columns.
    regions = fenced_regions(text)
    for n, line in enumerate(lines, 1):
        if in_fence(n, regions) and any(c in line for c in "┌┐└┘├┤┬┴┼"):
            if display_width(line) > 76:
                reject(f"ASCII diagram line {n} wider than 76 columns")

    # Required test-suite table and runtime results artifact.
    if ".trident/container-test-results.json" not in text:
        reject("runtime results artifact absent")
    if "passTokenMatch" not in text or "failTokenAbsent" not in text:
        reject("runtime token fields absent")
    if "toolResultContext" not in text:
        reject("anti-circular tool-result context absent")

    print(
        "WORKFLOW_VALID: "
        f"lines={len(lines)} sections={len(h2)} turns={len(turn_heads)} "
        f"fences={len(re.findall(r'^```', text, re.M))} tokens={len(tokens)}"
    )


if __name__ == "__main__":
    main()
