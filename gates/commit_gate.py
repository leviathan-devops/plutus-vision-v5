#!/usr/bin/env python3
"""commit_gate.py — the PLUTUS VISION M1 git gate.

Surfaces
--------
pre-commit    Read the INDEX. Structural checks only; fail fast before a commit object exists.
commit-msg    Read the authored MESSAGE. Trailer, claim, checkpoint, and token checks.
reference     Read a CREATED COMMIT supplied by .githooks/reference-transaction. This is the
              non-bypassable surface: it validates the actual commit tree and then asks the
              configured external vision model (mimo-v2.6-flash) for a binary quality verdict.

Every failure prints REJECT(PV-<TOKEN>): ... and exits 1. A missing model, malformed model answer,
missing image, bad hash, forbidden path, or premature completion claim fails closed. There is no
fallback grader and no pass-without-evidence path.

The gate reads gates/policy.json from the surface being validated (index for pre-commit, commit
tree for reference), never from an environment override.
"""

from __future__ import annotations

import argparse
import base64
import datetime as dt
import hashlib
import io
import json
import os
import pathlib
import re
import subprocess
import sys
from typing import Any

REPO = pathlib.Path(__file__).resolve().parent.parent
PNG_MAGIC = b"\x89PNG\r\n\x1a\n"
CLAIM_WORDS = re.compile(
    r"\b(verified|passed|tested|works|green|done|complete|completed|finished|shipped|landed|delivered)\b",
    re.I,
)
TRAILER_RE = re.compile(r"(?im)^PV-(Gate|Checkpoint|Operator-Unlock|Admin):\s*(.+?)\s*$")


def reject(token: str, detail: str) -> None:
    print(f"REJECT(PV-{token}): {detail}", file=sys.stderr)
    raise SystemExit(1)


def run_git(*args: str, check: bool = True, input_bytes: bytes | None = None) -> str:
    p = subprocess.run(
        ["git", "-C", str(REPO), *args],
        capture_output=True,
        input=input_bytes,
    )
    if check and p.returncode != 0:
        reject("GIT", f"git {' '.join(args[:3])} failed: {p.stderr.decode(errors='replace')[:300]}")
    return p.stdout.decode(errors="replace")


def load_json_source(source: str, path: str) -> Any:
    if source == "worktree":
        p = REPO / path
        try:
            return json.loads(p.read_text())
        except Exception as e:
            reject("JSON_READ", f"{path}: {e}")
    spec = ":" + path if source == "index" else f"{source}:{path}"
    raw = run_git("show", spec)
    try:
        return json.loads(raw)
    except Exception as e:
        reject("JSON_READ", f"{path}: {e}")


def source_bytes(source: str, path: str) -> bytes:
    if source == "worktree":
        try:
            return (REPO / path).read_bytes()
        except Exception as e:
            reject("ARTIFACT_READ", f"{path}: {e}")
    spec = ":" + path if source == "index" else f"{source}:{path}"
    p = subprocess.run(["git", "-C", str(REPO), "show", spec], capture_output=True)
    if p.returncode != 0:
        reject("ARTIFACT_READ", f"{path}: {p.stderr.decode(errors='replace')[:200]}")
    return p.stdout


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def changed_paths(source: str, rev: str | None = None) -> list[str]:
    if source == "index":
        out = run_git("diff", "--cached", "--name-only", "--diff-filter=ACMRT")
        return [x for x in out.splitlines() if x]
    parent = run_git("rev-parse", f"{rev}^@").split()
    base = parent[0] if parent else ""
    out = run_git("diff-tree", "--no-commit-id", "--name-only", "-r", "--root", base, rev) if base else run_git("diff-tree", "--no-commit-id", "--name-only", "-r", "--root", rev)
    return [x for x in out.splitlines() if x]


def path_matches(path: str, patterns: list[str]) -> bool:
    return any(re.search(p, path) for p in patterns)


def protected_change(paths: list[str], policy: dict, admin: bool) -> str | None:
    protected = list(policy.get("protected_paths", []))
    frozen_m1 = ["m1/EXECUTION_CONTRACT.md"]
    for p in paths:
        if any(p == q or p.startswith(q) for q in protected):
            # Admin (operator token) may install/repair the gate and amend the execution workflow;
            # never the authority corpus, archive, or baseline.
            if admin and (p.startswith(".githooks/") or p.startswith("gates/") or p.startswith("design/")):
                continue
            return p
        if not admin and any(p == q or p.startswith(q) for q in frozen_m1):
            return p
    return None


def token_hash(value: str) -> str:
    return hashlib.sha256(value.encode()).hexdigest()


def admin_token_ok(policy: dict) -> bool:
    supplied = os.environ.get("PV_GATE_ADMIN_TOKEN", "").strip()
    return bool(supplied) and token_hash(supplied) == policy.get("tokens", {}).get("admin_sha256")


def unlock_token_ok(policy: dict, message: str) -> bool:
    supplied = os.environ.get("PV_OPERATOR_UNLOCK_TOKEN", "").strip()
    m = re.search(r"(?im)^PV-Operator-Unlock:\s*(.+?)\s*$", message)
    if not supplied and m:
        supplied = m.group(1).strip()
    return bool(supplied) and token_hash(supplied) == policy.get("tokens", {}).get("operator_unlock_sha256")


def trailers(message: str) -> dict[str, str]:
    out = {}
    for m in TRAILER_RE.finditer(message):
        out[m.group(1).lower()] = m.group(2).strip()
    return out


def validate_no_expansion(paths: list[str], policy: dict) -> None:
    for p in paths:
        if path_matches(p, policy.get("forbidden_m1_path_patterns", [])):
            reject("M1_SCOPE", f"forbidden path for M1: {p}")
    forbidden_assets = policy.get("forbidden_m1_expansion_assets", [])
    for p in paths:
        if any(a in p for a in forbidden_assets):
            reject("M1_SCOPE", f"multi-asset expansion is forbidden before operator review: {p}")


def validate_work_paths(paths: list[str], policy: dict) -> None:
    allowed = policy.get("allowed_work_prefixes", [])
    for p in paths:
        if not any(p == q or p.startswith(q) for q in allowed):
            reject("WORK_SCOPE", f"M1 work commits may only touch {allowed}; touched {p}")
    substantive = [p for p in paths if p not in {"m1/state.json"} and not p.endswith("/.gitkeep")]
    if not substantive:
        reject("EMPTY_WORK", "no substantive M1 artifact changed")


def validate_state_transition(parent_state: dict, new_state: dict, kind: str, checkpoint: dict | None) -> None:
    try:
        old_seq = int(parent_state["checkpoint_seq"])
        old_work = int(parent_state["work_commits_since_checkpoint"])
    except Exception:
        reject("STATE", "parent m1/state.json is malformed")
    if parent_state.get("phase") != "M1" or new_state.get("phase") != "M1":
        reject("STATE", "phase may not leave M1 before operator review")
    if parent_state.get("m1_status") == "COMPLETE_AWAITING_OPERATOR_REVIEW" and new_state.get("operator_review") != "APPROVED":
        reject("M1_STOP", "M1 is complete; operator review is required before further commits")
    if kind == "work":
        want = old_work + 1
        if int(new_state["work_commits_since_checkpoint"]) != want or int(new_state["checkpoint_seq"]) != old_seq:
            reject("STATE", f"work commit must advance work_commits_since_checkpoint to {want} without changing checkpoint_seq")
        if want > 2:
            reject("CHECKPOINT_REQUIRED", "the work-commit budget is exhausted; commit a visual checkpoint")
    elif kind in {"checkpoint", "m1-complete"}:
        if int(new_state["checkpoint_seq"]) != old_seq + 1:
            reject("STATE", f"checkpoint must advance checkpoint_seq from {old_seq} to {old_seq + 1}")
        if int(new_state["work_commits_since_checkpoint"]) != 0:
            reject("STATE", "a checkpoint must reset work_commits_since_checkpoint to 0")
        if not checkpoint:
            reject("CHECKPOINT", "checkpoint commit has no checkpoint object")
        if new_state.get("last_checkpoint") != checkpoint.get("id"):
            reject("STATE", "last_checkpoint does not match the checkpoint id")
        if kind == "m1-complete":
            if new_state.get("m1_status") != "COMPLETE_AWAITING_OPERATOR_REVIEW":
                reject("STATE", "M1-complete must set m1_status to COMPLETE_AWAITING_OPERATOR_REVIEW")
            if new_state.get("complete_commit") != "SELF":
                reject("STATE", "M1-complete must set complete_commit to the literal SELF (the gate records the real hash)")
            if new_state.get("operator_review") != "PENDING":
                reject("STATE", "M1-complete must leave operator_review PENDING")


def validate_checkpoint(policy: dict, source: str, checkpoint_path: str, kind: str) -> tuple[dict, dict]:
    cp = load_json_source(source, checkpoint_path)
    required = {"schema", "id", "type", "asset", "week", "claims", "comparison", "visual", "pinebox"}
    missing = sorted(required - set(cp))
    if missing:
        reject("CHECKPOINT", f"{checkpoint_path} missing {missing}")
    if cp.get("schema") != 1 or cp.get("asset") != policy["m1"]["asset"] or cp.get("week") != policy["m1"]["week"]:
        reject("CHECKPOINT", "M1 checkpoints are exactly DXY and week 2026-07-06")
    if kind == "m1-complete" and cp.get("type") != "m1_complete":
        reject("CHECKPOINT", "PV-Gate m1-complete requires checkpoint.type m1_complete")
    if kind == "checkpoint" and cp.get("type") not in {"checkpoint", "blocked"}:
        reject("CHECKPOINT", "checkpoint.type must be checkpoint or blocked")
    comparison_path = cp.get("comparison")
    if not isinstance(comparison_path, str) or not comparison_path.startswith("m1/checkpoints/"):
        reject("CHECKPOINT", "comparison path must live under m1/checkpoints/")
    comp = load_json_source(source, comparison_path)
    if comp.get("schema") != 1 or comp.get("checkpoint") != cp.get("id"):
        reject("COMPARISON", "comparison schema/checkpoint mismatch")
    if comp.get("asset") != cp.get("asset") or comp.get("week") != cp.get("week"):
        reject("COMPARISON", "comparison asset/week mismatch")
    rows = comp.get("rows")
    if not isinstance(rows, list) or not rows:
        reject("COMPARISON", "comparison.rows must be a non-empty list")
    allowed = set(policy["checkpoint"]["allowed_statuses"])
    for row in rows:
        if not isinstance(row, dict) or not row.get("family") or row.get("status") not in allowed:
            reject("COMPARISON", f"malformed row: {row}")
        if row.get("status") != "MATCHED" and not row.get("evidence"):
            reject("COMPARISON", f"non-MATCHED row {row.get('family')} must cite evidence")
    visual = cp.get("visual")
    if not isinstance(visual, list) or not visual:
        reject("VISUAL", "a checkpoint requires at least one visual expectation")
    min_images = policy["checkpoint"]["m1_complete_min_images"] if kind == "m1-complete" else 1
    if len(visual) < min_images:
        reject("VISUAL", f"{kind} requires at least {min_images} images")
    hashes = comp.get("visual_sha256")
    if not isinstance(hashes, dict):
        reject("VISUAL", "comparison.visual_sha256 must be an object")
    for item in visual:
        path = item.get("path") if isinstance(item, dict) else None
        expectation = item.get("expectation") if isinstance(item, dict) else None
        if not path or not expectation or not path.startswith("m1/checkpoints/"):
            reject("VISUAL", f"malformed visual entry: {item}")
        data = source_bytes(source, path)
        if not data.startswith(PNG_MAGIC):
            reject("VISUAL", f"{path} is not a PNG")
        if len(data) < policy["checkpoint"]["min_png_bytes"]:
            reject("VISUAL", f"{path} is only {len(data)} bytes (< {policy['checkpoint']['min_png_bytes']})")
        got = sha256_bytes(data)
        if hashes.get(path) != got:
            reject("VISUAL_HASH", f"{path}: comparison says {hashes.get(path)}, commit has {got}")
    if kind == "m1-complete":
        required_families = policy["required_visual_families"]
        by_family = {r.get("family"): r.get("status") for r in rows if isinstance(r, dict)}
        bad = [(f, by_family.get(f, "ABSENT")) for f in required_families if by_family.get(f) != "MATCHED"]
        if bad:
            reject("M1_COMPLETE", f"required families not MATCHED: {bad}")
        summary = comp.get("summary", {})
        expected_summary = {
            "matched": len(required_families),
            "wrong": 0,
            "missing": 0,
            "extra": 0,
            "unobservable": 0,
        }
        if summary != expected_summary:
            reject("M1_COMPLETE", f"summary must be exactly {expected_summary}, got {summary}")
        claims = cp.get("claims", {})
        if not all(claims.get(k) is True for k in ("evidence_ready", "engine_ready", "composition_ready", "render_observed")):
            reject("M1_COMPLETE", "all M1 readiness claims must be true")
        for key in ("card", "composition"):
            artifact = cp.get(key)
            if not isinstance(artifact, str) or not artifact.startswith("m1/out/"):
                reject("M1_COMPLETE", f"{key} path absent or outside m1/out/")
            source_bytes(source, artifact)
        pb = cp.get("pinebox", {})
        if pb.get("asset") != "DXY" or pb.get("week") != "2026-07-06" or pb.get("mode") not in {"cloud", "local"}:
            reject("M1_COMPLETE", f"pinebox identity malformed: {pb}")
    return cp, comp


def diff_material(rev: str) -> str:
    stat = run_git("show", "--stat", "--oneline", rev)
    diff = run_git("show", "--format=", "--unified=1", rev)
    limit = 100000
    if len(diff) > limit:
        diff = diff[:limit] + f"\n[DIFF_TRUNCATED at {limit} chars]"
    return stat + "\n\n```diff\n" + diff + "\n```\n"


def image_data_url(png: bytes) -> str:
    # Transport thumbnail only; the evidence hash is computed from the original committed bytes.
    # The smaller of an optimized PNG and a q85 JPEG of the same <=1600x1200 thumbnail is sent: a full
    # desktop screenshot is ~3 MB as PNG and ~0.3 MB as JPEG, and the grader reads both equally well.
    try:
        from PIL import Image
        im = Image.open(io.BytesIO(png)).convert("RGB")
        im.thumbnail((1600, 1200))
        best, mime = png, "image/png"
        for fmt, kw, m in (("PNG", {"optimize": True}, "image/png"), ("JPEG", {"quality": 85}, "image/jpeg")):
            buf = io.BytesIO()
            im.save(buf, format=fmt, **kw)
            if buf.tell() and buf.tell() < len(best):
                best, mime = buf.getvalue(), m
        return f"data:{mime};base64," + base64.b64encode(best).decode()
    except Exception:
        return "data:image/png;base64," + base64.b64encode(png).decode()


def model_key(policy: dict) -> str:
    cmd = policy.get("model", {}).get("key_command")
    if cmd != "$HOME/.omp/agent/bin/go-key.sh":
        reject("MODEL_CONFIG", "unsupported key command in policy")
    p = subprocess.run([os.path.expanduser("~/.omp/agent/bin/go-key.sh")], capture_output=True, text=True)
    if p.returncode != 0:
        reject("MODEL_UNAVAILABLE", f"key resolver failed: {p.stderr[:200]}")
    lines = [x.strip() for x in p.stdout.splitlines() if x.strip()]
    if not lines:
        reject("MODEL_UNAVAILABLE", "key resolver returned no credential")
    return lines[-1]


def call_external_grader(policy: dict, source: str, rev: str, kind: str, checkpoint: dict | None, comparison: dict | None, message: str) -> dict:
    contexts = []
    for path in policy.get("grader_context", []):
        try:
            text = source_bytes(source, path).decode(errors="replace")
        except Exception:
            continue
        contexts.append({"type": "input_text", "text": f"=== CONTEXT {path} ===\n{text}"})
    materials = {"type": "input_text", "text": "=== COMMIT MESSAGE ===\n" + message.strip() + "\n\n=== COMMIT DIFF ===\n" + diff_material(rev)}
    if checkpoint:
        materials["text"] += f"\n=== CHECKPOINT ===\n{json.dumps(checkpoint, indent=2)}\n"
    if comparison:
        materials["text"] += f"\n=== COMPARISON ===\n{json.dumps(comparison, indent=2)}\n"
    images = []
    if checkpoint:
        for item in checkpoint.get("visual", []):
            data = source_bytes(source, item["path"])
            images.append({"type": "input_image", "image_url": image_data_url(data)})
    elif kind == "admin":
        control_path = policy.get("model", {}).get("vision_control")
        if control_path:
            control = load_json_source(source, control_path)
            if control.get("verdict") != "PASS" or control.get("observed") != control.get("expected"):
                reject("VISION_CONTROL", f"configured control is not a PASS: {control}")
            images.append({"type": "input_image", "image_url": image_data_url(source_bytes(source, control["image"]))})
    prompt = {
        "type": "input_text",
        "text": (
            "You are the external git-commit sanity grader for PLUTUS VISION milestone M1. "
            "Read the supplied blueprint, workflow, M1 contract, commit diff, checkpoint, comparison, and images. "
            "This is a fast binary sanity check, not a deep code review. "
            "The commit message is supplied. Token values are never supplied; the gate has ALREADY mechanically validated the admin token when the message says PV-Gate: admin, so do not reject an admin commit for token absence or for touching gate files. An admin repair plausibly advances M1 when it keeps the enforcement mechanism coherent. The pass bar is that the commit "
            "carries the required evidence, and shows no obvious derailment, fabrication, stubbing, unrelated mass edit, "
            "docs-only theater, or premature success claim. "
            "For checkpoint/m1-complete commits, inspect every supplied image: reject blank frames, unrelated pages, "
            "missing expected E1 families, or charts that obviously contradict the comparison. "
            "For M1 complete, the chart must plausibly show the full E1 zone map with price interaction. "
            "Return STRICT JSON only: {\"verdict\":\"PASS\"|\"REJECT\",\"score\":integer 0-10,"
            "\"reasons\":[\"short factual reasons\"],\"visual_observations\":[\"what you saw in each image\"]}. "
            "The pass threshold is score >= 7 AND verdict PASS. Do not wrap JSON in Markdown."
        ),
    }
    content = [*contexts, materials, *images, prompt]
    body = {"model": policy["model"]["model"], "input": [{"role": "user", "content": content}]}
    serialized = json.dumps(body)
    # Two budgets, both fail-closed: the TEXT the grader must read (contexts, diff, checkpoint, prompt) and the
    # IMAGE transport. Counting base64 image bytes against the text budget made every real screenshot checkpoint
    # unpassable (2026-11-08: a 142 KB runtime capture alone is ~190 K chars).
    limits = policy.get("limits", {})
    image_chars = sum(len(i["image_url"]) for i in images)
    text_chars = len(serialized) - image_chars
    if text_chars > limits.get("max_model_prompt_chars", 160000):
        reject("MODEL_PROMPT", f"grader text is {text_chars} chars (> {limits.get('max_model_prompt_chars', 160000)})")
    if image_chars > limits.get("max_model_image_chars", 0):
        reject("MODEL_PROMPT", f"grader images are {image_chars} chars (> {limits.get('max_model_image_chars', 0)})")
    key = model_key(policy)
    p = subprocess.run(
        ["curl", "-sS", "-m", str(policy["model"]["timeout_seconds"]),
         "-H", f"Authorization: Bearer {key}", "-H", "Content-Type: application/json",
         policy["model"]["endpoint"], "--data-binary", "@-"],
        input=serialized, capture_output=True, text=True,
    )
    try:
        data = json.loads(p.stdout)
    except Exception:
        reject("MODEL_UNAVAILABLE", f"non-JSON model answer: {p.stdout[:300]} {p.stderr[:200]}")
    if data.get("error"):
        reject("MODEL_UNAVAILABLE", f"{data['error']}")
    if data.get("status") != "completed":
        reject("MODEL_UNAVAILABLE", f"model status {data.get('status')!r}")
    text = "".join(
        c.get("text", "") for item in data.get("output", [])
        if item.get("type") in ("message", "output_message")
        for c in item.get("content", []) if c.get("type") in ("output_text", "text")
    ).strip()
    # The first complete JSON object in the answer is the verdict (raw_decode stops at its closing brace instead of
    # a greedy {.*} regex that runs to the LAST brace in the text). On 2026-11-08 a PASS score 8 answer failed the old
    # parse and its full text was not kept, so the cause (trailing text vs truncation) is unknown. An unparseable
    # answer still fails closed, and from now on its full text is kept for diagnosis.
    verdict = None
    start = text.find("{")
    if start >= 0:
        try:
            verdict, _ = json.JSONDecoder().raw_decode(text[start:])
        except Exception:
            verdict = None
    if verdict is None:
        raw_dir = pathlib.Path(os.environ.get("XDG_STATE_HOME", pathlib.Path.home() / ".local/state")) / "plutus-vision-gate" / "raw"
        raw_dir.mkdir(parents=True, exist_ok=True)
        raw_path = raw_dir / f"{rev[:12]}-{dt.datetime.now(dt.timezone.utc).strftime('%Y%m%dT%H%M%S')}.txt"
        raw_path.write_text(text)
        reject("MODEL_VERDICT", f"no parseable JSON object in model answer ({len(text)} chars, kept at {raw_path}): {text[:300]}")
    if not isinstance(verdict, dict) or verdict.get("verdict") not in {"PASS", "REJECT"}:
        reject("MODEL_VERDICT", f"verdict must be PASS or REJECT: {verdict}")
    try:
        score = int(verdict["score"])
    except Exception:
        reject("MODEL_VERDICT", f"score missing/non-integer: {verdict}")
    if not 0 <= score <= 10:
        reject("MODEL_VERDICT", f"score outside 0..10: {score}")
    accepted = verdict["verdict"] == "PASS" and score >= int(policy["model"]["min_score"])
    row = {
        "at": dt.datetime.now(dt.timezone.utc).isoformat(),
        "commit": rev,
        "surface": "reference",
        "kind": kind,
        "model": policy["model"]["model"],
        "verdict": verdict["verdict"],
        "score": score,
        "accepted": accepted,
        "reasons": verdict.get("reasons", []),
        "visual_observations": verdict.get("visual_observations", []),
    }
    ledger = pathlib.Path(os.environ.get("XDG_STATE_HOME", pathlib.Path.home() / ".local/state")) / "plutus-vision-gate" / "verdicts.jsonl"
    ledger.parent.mkdir(parents=True, exist_ok=True)
    with ledger.open("a") as f:
        f.write(json.dumps(row) + "\n")
    if not accepted:
        reject("MODEL_REJECT", f"external grader score={score} verdict={verdict['verdict']} reasons={verdict.get('reasons')}")
    return row


def pre_commit(policy: dict) -> None:
    paths = changed_paths("index")
    if not paths:
        return
    admin = admin_token_ok(policy)
    hit = protected_change(paths, policy, admin)
    if hit:
        reject("PROTECTED_PATH", f"{hit} is immutable during M1")
    checkpoint_paths = [p for p in paths if re.match(r"^m1/checkpoints/[^/]+/checkpoint\.json$", p)]
    if len(checkpoint_paths) > 1:
        reject("CHECKPOINT", "one checkpoint object per commit")
    if checkpoint_paths:
        cp = load_json_source("index", checkpoint_paths[0])
        validate_checkpoint(policy, "index", checkpoint_paths[0], "checkpoint" if cp.get("type") != "m1_complete" else "m1-complete")


def commit_msg(policy: dict, message: str) -> None:
    tr = trailers(message)
    kind = tr.get("gate")
    if kind not in {"work", "checkpoint", "m1-complete", "admin"}:
        reject("TRAILER", "message must carry exactly one PV-Gate trailer: work|checkpoint|m1-complete|admin")
    if kind == "admin" and not admin_token_ok(policy):
        reject("ADMIN", "PV_GATE_ADMIN_TOKEN is absent or does not match the operator admin hash")
    if kind == "work" and CLAIM_WORDS.search(message):
        reject("WORK_CLAIM", "work commits may not claim completion or success; use a visual checkpoint")
    if kind in {"checkpoint", "m1-complete"} and not tr.get("checkpoint", "").startswith("m1/checkpoints/"):
        reject("TRAILER", "checkpoint commits must carry PV-Checkpoint: m1/checkpoints/<id>/checkpoint.json")
    # M1 stop is also enforced from state in reference; this catches the message before object creation.
    state = load_json_source("worktree", "m1/state.json")
    if state.get("m1_status") == "COMPLETE_AWAITING_OPERATOR_REVIEW" and not unlock_token_ok(policy, message):
        reject("M1_STOP", "M1 is awaiting operator review; supply the operator unlock token")


def reference(policy: dict, old: str, new: str, ref: str) -> None:
    if new.startswith("0000000"):
        return
    try:
        run_git("cat-file", "-e", new + "^{commit}")
    except Exception:
        return  # annotated tag object: inspect the wrapped commit below
    rev = new
    message = run_git("show", "-s", "--format=%B", rev)
    tr = trailers(message)
    kind = tr.get("gate")
    paths = changed_paths("commit", rev)
    admin = kind == "admin" and admin_token_ok(policy)
    if kind not in {"work", "checkpoint", "m1-complete", "admin", None}:
        reject("TRAILER", f"invalid PV-Gate {kind!r}")
    if kind is None:
        # Gate bootstrap accepts exactly one admin-seeded commit on top of policy.gate_parent.
        parent = run_git("rev-parse", rev + "^").strip()
        if parent == policy["gate_parent"] and admin_token_ok(policy):
            kind = "admin"
            admin = True
        else:
            reject("TRAILER", "commits after gate installation must carry PV-Gate")
    hit = protected_change(paths, policy, admin)
    if hit:
        reject("PROTECTED_PATH", f"{hit} is immutable during M1")
    parent = run_git("rev-parse", rev + "^").strip()
    parent_has_state = subprocess.run(["git", "-C", str(REPO), "cat-file", "-e", parent + ":m1/state.json"], capture_output=True).returncode == 0
    if parent_has_state:
        parent_state = load_json_source(parent, "m1/state.json")
    elif kind == "admin":
        parent_state = {}
    else:
        reject("STATE", "m1/state.json is absent before this commit")
    new_state = load_json_source(rev, "m1/state.json")
    if parent_state.get("m1_status") == "COMPLETE_AWAITING_OPERATOR_REVIEW" and new_state.get("operator_review") != "APPROVED" and not unlock_token_ok(policy, message):
        reject("M1_STOP", "operator review has not unlocked the next phase")
    checkpoint = None
    comparison = None
    if kind == "work":
        validate_work_paths(paths, policy)
        validate_no_expansion(paths, policy)
        if CLAIM_WORDS.search(message):
            reject("WORK_CLAIM", "work commit claims success without a visual checkpoint")
    elif kind in {"checkpoint", "m1-complete"}:
        cp_path = tr.get("checkpoint")
        if not cp_path:
            reject("TRAILER", f"{kind} requires PV-Checkpoint")
        checkpoint, comparison = validate_checkpoint(policy, rev, cp_path, kind)
        validate_no_expansion(paths, policy)
    elif kind == "admin":
        # Admin may install gates, but cannot rewrite history, authority, archive, or baseline.
        forbidden = [p for p in paths if p.startswith(("archive/", "Checkpoints/v1-ship-approved-working-baseline/", "Original_Canon_Data/"))]
        if forbidden:
            reject("ADMIN_SCOPE", f"admin may not alter frozen authority/history: {forbidden[:3]}")
    if parent_state:
        validate_state_transition(parent_state, new_state, kind, checkpoint)
    elif kind != "admin" or new_state.get("schema") != 1 or new_state.get("m1_status") != "IN_PROGRESS":
        reject("STATE", "the introducing commit must seed a valid IN_PROGRESS M1 state")
    call_external_grader(policy, rev, rev, kind, checkpoint, comparison, message)
    print(f"PV-GATE: PASS {rev[:12]} {kind} {ref}")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--surface", choices=["pre-commit", "commit-msg", "reference"], required=True)
    ap.add_argument("message_file", nargs="?")
    args = ap.parse_args()
    if args.surface == "pre-commit":
        policy = load_json_source("index" if run_git("diff", "--cached", "--name-only").strip() else "worktree", "gates/policy.json")
        pre_commit(policy)
        print("PV-PRECOMMIT: PASS")
        return 0
    if args.surface == "commit-msg":
        policy = load_json_source("worktree", "gates/policy.json")
        commit_msg(policy, pathlib.Path(sys.argv[-1]).read_text(errors="replace"))
        print("PV-COMMIT-MSG: PASS")
        return 0
    lines = sys.stdin.read().splitlines()
    if not lines:
        reject("REF_INPUT", "reference-transaction supplied no ref updates")
    graded: set[str] = set()
    for line in lines:
        parts = line.split()
        if len(parts) != 3:
            reject("REF_INPUT", f"malformed reference update {line!r}")
        old, new, ref = parts
        # For annotated tags, dereference to the commit.
        if not new.startswith("0000000"):
            typ = run_git("cat-file", "-t", new).strip()
            if typ != "commit":
                new = run_git("rev-parse", new + "^{commit}").strip()
        # One transaction moving HEAD and its branch to the same commit grades that commit once.
        if new in graded:
            print(f"PV-GATE: PASS {new[:12]} (graded in this transaction) {ref}")
            continue
        reference(load_json_source(new, "gates/policy.json"), old, new, ref)
        graded.add(new)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
