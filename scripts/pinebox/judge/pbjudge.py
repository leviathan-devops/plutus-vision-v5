#!/usr/bin/env python3
"""pbjudge.py - the PINEBOX evidence-ticket judge (design/DESIGN_BLUEPRINT_P3_EVIDENCE_TICKET_JUDGE.md, phases P3a-P3e).

An INDEPENDENT local System One judge (:8090, imajev-4b, image-capable) answers ONE typed question about ONE image, and the TOOL - never the agent - writes a
content-addressed ticket whose four parts are the clause, the pixels, the judge's verbatim judgment and a boolean the tool computes.

  pbjudge.py health                                   assert the judge is up, is the expected model and can see
  pbjudge.py clauses [ID]                             the clause table (judge/clauses.txt), or one clause
  pbjudge.py calibrate --clause ID --evidence DIR --good F... --bad F...    sweep thresholds on labelled frames; write judge/act.json WITH the sweep
  pbjudge.py judge  --clause ID --evidence DIR --region F.png [--frame FULL.png] [--week W]    controls -> judge -> (class) -> ticket
  pbjudge.py check  --evidence DIR TICKET             recompute the ticket hash from its four parts (TICKET_CORRUPT on a mismatch)
  pbjudge.py ledger --evidence DIR                    recompute the hash chain of the ledger (LEDGER_HOLE on a break)
  pbjudge.py epoch  --evidence DIR [--clause ID]      print the narrative epoch exactly as it is passed to the judge as `state`

Exit: 0 one JSON object on stdout | 1 REFUSED <TOKEN> on stderr | 2 usage.

THE REFUSALS (blueprint section 8; there is NO fallback judge - a different model is a different instrument):
  JUDGE_DOWN  JUDGE_TIMEOUT  JUDGE_BAD_HEALTH  JUDGE_MODEL_MISMATCH  JUDGE_NO_VISION  CONTROL_UNSEPARATED (run VOID, no ticket)  CLAUSE_NOT_FOUND
  BUDGET_EXCEEDED  REGION_EMPTY (verdict INCONCLUSIVE, no judge call, no ticket)  THRESHOLD_UNCALIBRATED  CLAUSE_UNOBSERVABLE  EVIDENCE_SCOPE
  TICKET_WRITE_FAILED  TICKET_CORRUPT  LEDGER_HOLE  JUDGE_ABSTAINED  DEFECT_UNCLASSIFIED (recorded in the ticket, never bucketed)

Environment: PB_JUDGE_URL (default http://127.0.0.1:8090)  PB_JUDGE_MODEL (default imajev-4b-Q6_K)  PB_JUDGE_TIMEOUT_S (default 120)
             PB_JUDGE_WINDOW_BUDGET (default 15000)  PB_JUDGE_CONTROLS (a directory holding positive.png + negative.png; a test knob for the VOID path)
"""
import argparse, hashlib, io, json, os, re, sqlite3, sys, time, urllib.error, urllib.request, uuid
from pathlib import Path

HERE = Path(__file__).resolve().parent
URL = os.environ.get("PB_JUDGE_URL", "http://127.0.0.1:8090").rstrip("/")
MODEL = os.environ.get("PB_JUDGE_MODEL", "imajev-4b-Q6_K")
TIMEOUT = float(os.environ.get("PB_JUDGE_TIMEOUT_S", "120"))   # 120: the judge is SHARED; under load one call measured 47 s and two timed out at 60 s
WINDOW_BUDGET = int(os.environ.get("PB_JUDGE_WINDOW_BUDGET", "15000"))  # default 15000          # blueprint section 2: REFUSE when (image + instructions + clauses + question + answer) > 15,000
ANSWER_HEADROOM = 1000
CHARS_PER_TOKEN = 3.0          # a deliberately CONSERVATIVE text estimate (over-counts, so the packer refuses earlier, never later)
K_LAST = 5                     # the last K verdicts carried in the epoch
ROLLUP = 20                    # verdicts per epoch; older ones collapse to a count
CLASSES = {                    # the CLOSED defect list (blueprint section 5.2) - the routing table; one label per owner
    "FAT_BLOCK": "a band fills the range instead of sitting at its level",
    "PERMUTED_TICK": "an axis label sits where another should be",
    "WRONG_WEEK": "the week label differs from the loaded bars' week",
    "EMPTY_CHART": "the chart pane is blank, or shows an error message, or shows axes and grid but no candlestick bars at all",
    "CANDLES_CRUSHED": "an overlay forces the price axis so the bars collapse into a thin line",
    "LABEL_OVERLAP": "text collides with text or with the plot",
    "WRONG_COLOURS": "an element's colour violates the colour law",
    "MISSING_ELEMENT": "bars are present but a required element such as an indicator line or marker is absent",
}


class Refused(Exception):
    def __init__(self, token, detail):
        super().__init__(f"{token}: {detail}"); self.token, self.detail = token, detail


def refuse(token, detail): raise Refused(token, detail)
def sha(b): return hashlib.sha256(b).hexdigest()
def shaf(p): return sha(Path(p).read_bytes())


# ───────────────────────────────────────────────── P3a · the adapter ──
def http(method, path, data=None, headers=None):
    req = urllib.request.Request(URL + path, data=data, headers=headers or {}, method=method)
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as r: return r.status, r.read()
    except urllib.error.HTTPError as e: return e.code, e.read()
    except (urllib.error.URLError, ConnectionError, OSError) as e:
        if "timed out" in str(e): refuse("JUDGE_TIMEOUT", f"{URL}{path} did not answer within {TIMEOUT:.0f}s - the claim stays unproven")
        refuse("JUDGE_DOWN", f"{URL}{path}: {e} - there is no fallback judge (a different model is a different instrument); the claim stays unproven")


def health():
    code, body = http("GET", "/health")
    try: h = json.loads(body)
    except Exception: refuse("JUDGE_BAD_HEALTH", f"GET /health answered HTTP {code} with a body that is not JSON: {body[:120]!r}")
    if code != 200 or not h.get("ok"): refuse("JUDGE_BAD_HEALTH", f"GET /health answered HTTP {code}, ok={h.get('ok')}")
    if h.get("model") != MODEL: refuse("JUDGE_MODEL_MISMATCH", f"the judge on {URL} is '{h.get('model')}', this tool is calibrated for '{MODEL}' - its act is not this act")
    if "image" not in (h.get("modalities") or []): refuse("JUDGE_NO_VISION", f"the judge reports modalities {h.get('modalities')}: a text-only verdict about a render is worthless")
    return h


def call(request, png):
    """one multipart POST; returns (parsed response, call id, latency ms). The raw bytes are kept for the ticket (VERBATIM)."""
    b = uuid.uuid4().hex
    body = (f'--{b}\r\nContent-Disposition: form-data; name="request"\r\nContent-Type: application/json\r\n\r\n'.encode() + json.dumps(request).encode() +
            f'\r\n--{b}\r\nContent-Disposition: form-data; name="image"; filename="f.png"\r\nContent-Type: image/png\r\n\r\n'.encode() + png + f'\r\n--{b}--\r\n'.encode())
    t0 = time.time()
    code, raw = http("POST", "/v1/systemone", body, {"Content-Type": f"multipart/form-data; boundary={b}"})
    ms = round((time.time() - t0) * 1000)
    try: j = json.loads(raw)
    except Exception: refuse("JUDGE_BAD_HEALTH", f"POST /v1/systemone answered HTTP {code} with non-JSON: {raw[:160]!r}")
    if code != 200 or "answers" not in j: refuse("JUDGE_BAD_HEALTH", f"POST /v1/systemone answered HTTP {code}: {raw[:240]!r}")
    return j, uuid.uuid4().hex[:12], ms, raw.decode("utf-8", "replace")


def ask_noul(question, criteria, png, state):
    j, cid, ms, raw = call({"state": state, "questions": {"q": {"type": "noul", "instructions": question, "criteria": criteria}}}, png)
    a = j["answers"]["q"]
    if a.get("abstained"): refuse("JUDGE_ABSTAINED", "the judge abstained: the question is unanswerable as asked - rewrite the clause, not the threshold")
    if a.get("modality") != "image": refuse("JUDGE_NO_VISION", f"the answer's modality is '{a.get('modality')}', not 'image': the projector is not seeing the picture")
    return {"p": float(a["noul"]), "call_id": cid, "latency_ms": ms, "usage": j.get("usage"), "model": j.get("model"), "raw": raw, "state_truncated": j.get("state_truncated")}


def ask_choice(question, labels, png, state):
    j, cid, ms, raw = call({"state": state, "questions": {"c": {"type": "choice", "instructions": question, "criteria": labels}}}, png)
    a = j["answers"]["c"]
    return {"probs": a["probabilities"], "top": a["choice"], "top_p": float(a["confidence"]), "call_id": cid, "latency_ms": ms, "model": j.get("model"), "raw": raw}


# ───────────────────────────────────────────────── P3b · clauses and the packer ──
CLAUSE_RE = re.compile(r"^- (.+?) \(([A-Z][0-9]+\.[0-9]+)\)\s*$")


def clause_table():
    f = HERE / "clauses.txt"
    if not f.exists(): refuse("CLAUSE_NOT_FOUND", f"{f} does not exist - nothing can be judged")
    t = {}
    for line in f.read_text().splitlines():
        m = CLAUSE_RE.match(line)
        if m: t[m.group(2)] = m.group(1)
    return t


def clause(cid):
    t = clause_table()
    if cid not in t: refuse("CLAUSE_NOT_FOUND", f"clause '{cid}' has no id in {HERE / 'clauses.txt'} (ids: {', '.join(sorted(t))}) - a clause without an id cannot be judged")
    return t[cid]


def question_for(text): return f"Does this image show {text}? Answer about this single claim only."
def criteria_for(text): return {"true": f"the image shows {text}", "false": f"the image does not show {text}"}
def est_tokens(s): return int(len(s) / CHARS_PER_TOKEN) + 1


def pack(clause_id, text, state, image_tokens):
    """the budget arithmetic. The state is the only compressible part (the epoch already compresses by rule); everything else is fixed.
    Refuses with the numbers - a silently truncated prompt would make the answer about a document the judge did not receive."""
    q = question_for(text); cr = json.dumps(criteria_for(text))
    parts = {"image": image_tokens, "question": est_tokens(q) + est_tokens(cr), "clauses": est_tokens(text), "state": est_tokens(state), "answer_headroom": ANSWER_HEADROOM}
    total = sum(parts.values())
    if total > WINDOW_BUDGET:
        refuse("BUDGET_EXCEEDED", f"{total} tokens > {WINDOW_BUDGET}: {parts}; nothing was dropped silently - shorten the clause set or the epoch")
    return parts, total


# ───────────────────────────────────────────────── the derived threshold ──
def act_file(): return HERE / "act.json"


def load_act(cid):
    f = act_file()
    if not f.exists(): refuse("THRESHOLD_UNCALIBRATED", f"{f} does not exist - run: pbjudge.py calibrate (a threshold set by taste is not a threshold)")
    a = json.loads(f.read_text()); c = a.get("clauses", {}).get(cid)
    if not c or not c.get("sweep"): refuse("THRESHOLD_UNCALIBRATED", f"no calibrated act with its sweep for clause {cid} in {f}")
    if c["act"] < 0.5: refuse("THRESHOLD_INVERTED", f"act {c['act']} < 0.5 for {cid}: a pass below chance")
    return a, c


# ───────────────────────────────────────────────── images ──
def prep(path, width=768):
    """capture form: the chart ELEMENT is already what `pinebox shot --section chart` returns (nothing cropped); it is only COMPRESSED to a judge-sized width,
    and the factor is recorded in the ticket - never part of the chart dropped (blueprint C1)."""
    from PIL import Image
    im = Image.open(path).convert("RGB")
    cols = im.getcolors(maxcolors=2)
    if cols is not None and len(cols) <= 1:
        refuse("REGION_EMPTY", f"{path} is one colour {cols[0][1] if cols else ''}: verdict INCONCLUSIVE - the frame cannot be judged; no judge call was made and no ticket was written")
    scale = 1.0 if im.width <= width else width / im.width
    out = im if scale == 1.0 else im.resize((width, round(im.height * scale)), Image.LANCZOS)
    b = io.BytesIO(); out.save(b, "PNG")
    return b.getvalue(), {"orig": [im.width, im.height], "sent": [out.width, out.height], "scale": round(scale, 4)}


# ───────────────────────────────────────────────── P3c · evidence dir, narrative epoch, tickets ──
def scoped(evidence, *parts):
    """assertScopedWrite: every write resolves INSIDE the evidence dir, or it is a loud error."""
    root = Path(evidence).resolve(); p = root.joinpath(*parts).resolve()
    if root != p and root not in p.parents: refuse("EVIDENCE_SCOPE", f"{p} is outside the evidence dir {root}")
    return p


def db(evidence):
    scoped(evidence).mkdir(parents=True, exist_ok=True)
    c = sqlite3.connect(str(scoped(evidence, "vision.sqlite")))
    c.executescript("""CREATE TABLE IF NOT EXISTS analyses(seq INTEGER PRIMARY KEY, clause TEXT, artifact_sha TEXT, pass INTEGER, p REAL, class TEXT, epoch_hash TEXT, ticket TEXT, created_at TEXT);
                       CREATE TABLE IF NOT EXISTS epochs(epoch INTEGER PRIMARY KEY, summary TEXT, created_at TEXT);""")
    return c


def render_epoch(evidence, cid, artifact_sha, week):
    """the narrative epoch, assembled from the ledger by RULE (blueprint C3): head + last K verdicts + the repeat alarm + the delta. Older verdicts collapse to a count."""
    c = db(evidence); rows = c.execute("SELECT seq,clause,artifact_sha,pass,p,class FROM analyses ORDER BY seq DESC").fetchall(); n = len(rows)
    epoch = 1 + n // ROLLUP
    lines = [f"EPOCH {epoch}: PINEBOX chart-pane verification; judging clause {cid} on artifact {artifact_sha[:8]}{', requested week ' + week if week else ''}."]
    if rows:
        last = rows[:K_LAST]
        lines.append("LAST: " + " | ".join(f"#{r[0]} {r[1]} {'PASS' if r[3] else 'FAIL ' + (r[5] or '?')} p={r[4]:.2f}" for r in last))
        if n > K_LAST:
            old = rows[K_LAST:]; lines.append(f"OLDER: {len(old)} verdicts collapsed ({sum(1 for r in old if r[3])} pass, {sum(1 for r in old if not r[3])} fail)")
        streak = 0
        for r in rows:
            if r[1] == cid and not r[3]: streak += 1
            else: break
        if streak >= 2: lines.append(f"REPEAT ALARM: clause {cid} has failed {streak} consecutive times ({rows[0][5] or 'unclassified'}); a previously rejected defect must not be re-approved without a changed artifact.")
        prev = rows[0][2]
        lines.append("DELTA: artifact UNCHANGED since the last call (same sha)." if prev == artifact_sha else f"DELTA: artifact CHANGED since the last call (was {prev[:8]}, now {artifact_sha[:8]}).")
    else:
        lines.append("LAST: none. This is the first judgement of this build.")
    state = "\n".join(lines)
    return state, {"epoch": epoch, "verdicts_before": n, "epoch_hash": sha(state.encode())}


def write_ticket(evidence, cid, ctext, region_png, frame_png, judgment, passed, artifact_sha):
    try:
        tmp = scoped(evidence, "tickets", f".tmp-{uuid.uuid4().hex[:8]}"); tmp.mkdir(parents=True, exist_ok=True)
        cl = f"# clause {cid}\n\n{ctext}\n\nQuestion put to the judge: {question_for(ctext)}\n".encode()
        parts = {"clause.md": cl, "region.png": region_png, "frame.png": frame_png,
                 "judgment.json": json.dumps(judgment, indent=1, sort_keys=True).encode(), "pass.json": json.dumps({"pass": bool(passed)}).encode()}
        for name, b in parts.items(): (tmp / name).write_bytes(b)
        shas = {k: sha(v) for k, v in parts.items()}
        bundle = sha((shas["clause.md"] + shas["region.png"] + shas["judgment.json"] + shas["pass.json"]).encode())
        manifest = {"bundle_sha256": bundle, "parts": shas, "created_at": time.strftime("%Y-%m-%dT%H:%M:%S%z"), "clause": cid, "artifact_sha256": artifact_sha,
                    "writer": f"pbjudge.py sha256:{shaf(__file__)[:16]}", "hash_rule": "sha256(clause.sha + region.sha + judgment.sha + pass.sha)"}
        (tmp / "manifest.json").write_text(json.dumps(manifest, indent=1, sort_keys=True))
        final = scoped(evidence, "tickets", f"{bundle}.ticket")
        if final.exists():
            import shutil; shutil.rmtree(tmp)
        else: tmp.rename(final)
        import tarfile
        with tarfile.open(str(scoped(evidence, "tickets", f"{bundle}.tar.gz")), "w:gz") as t: t.add(str(final), arcname=f"{bundle}.ticket")
        return bundle, manifest
    except Refused: raise
    except Exception as e: refuse("TICKET_WRITE_FAILED", f"could not write the ticket under {evidence}: {e} - the verdict is not lost, it is not produced")


def append_ledger(evidence, row):
    f = scoped(evidence, "ledger.jsonl"); prev = "0" * 64; seq = 1
    if f.exists():
        last = [l for l in f.read_text().splitlines() if l.strip()]
        if last: j = json.loads(last[-1]); prev = j["row_hash"]; seq = j["seq"] + 1
    row = dict(row, seq=seq, prev_hash=prev); row["row_hash"] = sha((prev + json.dumps(row, sort_keys=True)).encode())
    with open(f, "a") as fh: fh.write(json.dumps(row, sort_keys=True) + "\n")
    return row


def check_ticket(evidence, tid):
    d = scoped(evidence, "tickets", f"{tid}.ticket")
    if not d.is_dir(): refuse("TICKET_ABSENT", f"ticket {tid} is not on disk under {evidence}")
    m = json.loads((d / "manifest.json").read_text()); bad = []
    for name, want in m["parts"].items():
        if not (d / name).exists() or shaf(d / name) != want: bad.append(name)
    recomputed = sha((shaf(d / "clause.md") + shaf(d / "region.png") + shaf(d / "judgment.json") + shaf(d / "pass.json")).encode()) if not bad else None
    if bad or recomputed != tid or m["bundle_sha256"] != tid: refuse("TICKET_CORRUPT", f"ticket {tid}: parts that do not match their manifest: {bad or 'none'}; recomputed bundle {str(recomputed)[:16]} != name {tid[:16]}")
    pj = json.loads((d / "pass.json").read_text())
    return {"ok": True, "ticket": tid, "pass": pj["pass"], "clause": m["clause"], "recomputed": recomputed, "parts": list(m["parts"])}


def check_ledger(evidence):
    f = scoped(evidence, "ledger.jsonl")
    if not f.exists(): refuse("LEDGER_HOLE", "no ledger.jsonl")
    prev = "0" * 64; n = 0
    for line in f.read_text().splitlines():
        if not line.strip(): continue
        j = json.loads(line); want = j.pop("row_hash")
        if j["prev_hash"] != prev or sha((prev + json.dumps(j, sort_keys=True)).encode()) != want: refuse("LEDGER_HOLE", f"the hash chain breaks at row {j.get('seq')} (a row was edited, removed or reordered)")
        if not scoped(evidence, "tickets", f"{j['ticket']}.ticket").is_dir(): refuse("LEDGER_HOLE", f"row {j['seq']} names ticket {j['ticket'][:16]} which is not on disk (a ticket was deleted)")
        # the row's verdict must be the verdict of the ticket it names, and the ticket must still recompute (F-191: `ledger` returned ok:true on a copy whose pass.json had been flipped)
        t = check_ticket(evidence, j["ticket"])
        if ("PASS" if t["pass"] else "FAIL") != j["verdict"]: refuse("LEDGER_HOLE", f"row {j['seq']} says {j['verdict']} but ticket {j['ticket'][:16]} says pass:{t['pass']}")
        prev = want; n += 1
    return {"ok": True, "rows": n, "head": prev}


# ───────────────────────────────────────────────── P3d · controls and calibration ──
def controls(cid=None):
    cdir = Path(os.environ.get("PB_JUDGE_CONTROLS", str(HERE / "controls")))      # an override exists only so the VOID path can be driven on the real judge
    if cid and (cdir / cid).is_dir(): cdir = cdir / cid                            # a clause may carry its OWN obvious-pass / obvious-fail pair
    pos, neg = cdir / "positive.png", cdir / "negative.png"
    for f in (pos, neg):
        if not f.exists(): refuse("CONTROL_UNSEPARATED", f"control frame {f} is absent: without a good/bad pair the judge is unproven and the run is VOID")
    return pos.read_bytes(), neg.read_bytes()


NEUTRAL = "CONTROL RUN: no history. The only evidence is the image."


def judge_controls(rp, rn, cid):
    """the verdict on the two control answers: the SAME clause, a known-good and a known-bad image, EVERY call"""
    sep = rp["p"] >= 0.85 and rn["p"] <= 0.15
    if not sep: refuse("CONTROL_UNSEPARATED", f"clause {cid}: positive control p={rp['p']:.3f} (need >= 0.85), negative control p={rn['p']:.3f} (need <= 0.15): JUDGE_BLIND - the run is VOID, no ticket")
    return {"positive": {k: rp[k] for k in ("p", "call_id", "latency_ms")}, "negative": {k: rn[k] for k in ("p", "call_id", "latency_ms")}, "separation": round(rp["p"] - rn["p"], 4), "separated": True}


def ask_all(ctext, cid, region_png, state):
    """positive control, negative control and the main question concurrently: wall time ~ the slowest ONE call instead of the sum of three (a shared judge
    measured 22-47 s per call under load). Results are read in a fixed order so the refusal named is deterministic: a judge refusal first, then the controls."""
    from concurrent.futures import ThreadPoolExecutor
    pos, neg = controls(cid); q, cr = question_for(ctext), criteria_for(ctext)
    with ThreadPoolExecutor(max_workers=3) as ex:
        fp = ex.submit(ask_noul, q, cr, pos, NEUTRAL); fn = ex.submit(ask_noul, q, cr, neg, NEUTRAL); fm = ex.submit(ask_noul, q, cr, region_png, state)
        rp, rn, r = fp.result(), fn.result(), fm.result()
    return judge_controls(rp, rn, cid), r


def cmd_calibrate(a):
    ctext = clause(a.clause); q, cr = question_for(ctext), criteria_for(ctext)
    good, bad = [], []
    for kind, files, out in (("good", a.good, good), ("bad", a.bad, bad)):
        for f in files:
            png, info = prep(f); r = ask_noul(q, cr, png, NEUTRAL); out.append({"file": os.path.basename(f), "sha256": shaf(f)[:16], "p": round(r["p"], 4), "image_tokens": (r["usage"] or {}).get("input_tokens")})
    gp, bp = [x["p"] for x in good], [x["p"] for x in bad]
    if not gp or not bp: refuse("CLAUSE_UNOBSERVABLE", "calibration needs at least one labelled good and one labelled bad frame")
    spread = round(min(gp) - max(bp), 4)
    sweep = []
    for th in (0.5, 0.6, 0.7, 0.8, 0.9):
        tp = sum(1 for p in gp if p >= th); fp = sum(1 for p in bp if p >= th)
        sweep.append({"threshold": th, "precision": round(tp / (tp + fp), 3) if tp + fp else None, "recall": round(tp / len(gp), 3)})
    if max(gp) < 0.5: refuse("CLAUSE_UNOBSERVABLE", f"max p over good frames is {max(gp):.3f} < 0.5: the QUESTION is broken (usually compound) - rewrite the clause, do not lower the bar. sweep={sweep}")
    if spread <= 0: refuse("CLAUSE_UNOBSERVABLE", f"min(good)={min(gp):.3f} <= max(bad)={max(bp):.3f}: the good and bad frames are not separable by this question; sweep={sweep}")
    act = round((min(gp) + max(bp)) / 2, 4)                       # the midpoint of the gap: derived from data, recorded with the sweep beside it
    toks = sorted({x["image_tokens"] for x in good + bad if x["image_tokens"]})
    f = act_file(); doc = json.loads(f.read_text()) if f.exists() else {"clauses": {}}
    if act < 0.5:
        # a pass below chance is not a threshold: the clause is UNOBSERVABLE for this judge at this scale. Recorded (with its sweep) and refused - never written as usable.
        doc.setdefault("unobservable", {})[a.clause] = {"would_be_act": act, "good": good, "bad": bad, "sweep": sweep, "clause_text": ctext, "derived_at": time.strftime("%Y-%m-%dT%H:%M:%S%z")}
        doc.get("clauses", {}).pop(a.clause, None); f.write_text(json.dumps(doc, indent=1, sort_keys=True))
        refuse("CLAUSE_UNOBSERVABLE", f"clause {a.clause}: the derived act would be {act} < 0.5 (good p {gp}, bad p {bp}): the judge cannot see this reliably - rewrite the clause or change the scale; recorded under 'unobservable' in act.json, NOT usable")
    doc["clauses"][a.clause] = {"act": act, "rule": "midpoint(min(good p), max(bad p))", "good": good, "bad": bad, "min_good": min(gp), "max_bad": max(bp), "spread": spread,
                                "sweep": sweep, "image_tokens_measured": toks, "derived_at": time.strftime("%Y-%m-%dT%H:%M:%S%z"), "clause_text": ctext}
    doc["health_at_calibration"] = health()
    f.write_text(json.dumps(doc, indent=1, sort_keys=True))
    return {"ok": True, "clause": a.clause, "act": act, "spread": spread, "good": gp, "bad": bp, "sweep": sweep, "image_tokens": toks, "written": str(f)}


# ───────────────────────────────────────────────── P3e · the judgement ──
def cmd_judge(a):
    h = health(); ctext = clause(a.clause); act_doc, act_c = load_act(a.clause)
    region_png, info = prep(a.region)                                   # REGION_EMPTY here -> INCONCLUSIVE, before any judge call
    frame_png = Path(a.frame or a.region).read_bytes()
    artifact = shaf(a.region)
    state, ep = render_epoch(a.evidence, a.clause, artifact, a.week)
    toks = (act_c.get("image_tokens_measured") or [None])[0]
    if toks is None: refuse("THRESHOLD_UNCALIBRATED", f"no measured image cost for {a.clause} in act.json: the budget cannot be computed")
    parts, total = pack(a.clause, ctext, state, toks)
    ctl, r = ask_all(ctext, a.clause, region_png, state)                # controls (same clause, known-good + known-bad image) and the main question, concurrently
    if r["state_truncated"]: refuse("BUDGET_EXCEEDED", "the adapter reports it truncated the state: the judgement would be about a document it did not receive")
    passed = bool(r["p"] >= act_c["act"] and ctl["separated"])
    cls = None; choice = None
    if not passed:
        choice = ask_choice(f"This image fails the claim '{ctext}'. Which one of these best describes what is wrong?", CLASSES, region_png, state)
        cls = choice["top"] if choice["top_p"] >= act_doc.get("class_min", 0.5) else "DEFECT_UNCLASSIFIED"
    judgment = {"model": r["model"], "health": {k: h.get(k) for k in ("model", "modalities", "slot_ctx", "state_char_cap")}, "clause": a.clause, "clause_text": ctext,
                "question": question_for(ctext), "p": round(r["p"], 6), "threshold_act": act_c["act"], "act_rule": act_c["rule"], "controls": ctl, "class": cls,
                "choice": None if choice is None else {"probs": choice["probs"], "top": choice["top"], "raw": choice["raw"]}, "state": state, "epoch": ep,
                "budget": {"parts": parts, "total": total, "window_budget": WINDOW_BUDGET}, "capture": info, "call_id": r["call_id"], "latency_ms": r["latency_ms"],
                "usage": r["usage"], "raw_response": r["raw"], "artifact_sha256": artifact, "week": a.week}
    tid, man = write_ticket(a.evidence, a.clause, ctext, region_png, frame_png, judgment, passed, artifact)
    c = db(a.evidence); c.execute("INSERT INTO analyses(clause,artifact_sha,pass,p,class,epoch_hash,ticket,created_at) VALUES (?,?,?,?,?,?,?,?)",
                                  (a.clause, artifact, int(passed), r["p"], cls, ep["epoch_hash"], tid, time.strftime("%Y-%m-%dT%H:%M:%S%z"))); c.commit()
    row = append_ledger(a.evidence, {"ticket": tid, "clause": a.clause, "verdict": "PASS" if passed else "FAIL", "class": cls, "artifact_sha256": artifact, "p": round(r["p"], 4), "epoch_hash": ep["epoch_hash"]})
    return {"ok": True, "ticket": tid, "pass": passed, "p": round(r["p"], 4), "act": act_c["act"], "class": cls, "epoch": ep["epoch"], "epoch_hash": ep["epoch_hash"][:16],
            "controls": {"positive": ctl["positive"]["p"], "negative": ctl["negative"]["p"]}, "ledger_seq": row["seq"], "ticket_dir": str(scoped(a.evidence, "tickets", f"{tid}.ticket")),
            "enforcement": "ENFORCEMENT_ABSENT: no hook reads this ticket yet (blueprint P3f is not built); a success claim is NOT gated by it"}


def main(argv):
    ap = argparse.ArgumentParser(prog="pbjudge"); sp = ap.add_subparsers(dest="verb")
    sp.add_parser("health"); c = sp.add_parser("clauses"); c.add_argument("id", nargs="?")
    k = sp.add_parser("calibrate"); k.add_argument("--clause", required=True); k.add_argument("--evidence"); k.add_argument("--good", nargs="+", required=True); k.add_argument("--bad", nargs="+", required=True)
    j = sp.add_parser("judge"); j.add_argument("--clause", required=True); j.add_argument("--evidence", required=True); j.add_argument("--region", required=True); j.add_argument("--frame"); j.add_argument("--week")
    ck = sp.add_parser("check"); ck.add_argument("--evidence", required=True); ck.add_argument("ticket")
    lg = sp.add_parser("ledger"); lg.add_argument("--evidence", required=True)
    ep = sp.add_parser("epoch"); ep.add_argument("--evidence", required=True); ep.add_argument("--clause", default="C1.1"); ep.add_argument("--artifact", default="0" * 64); ep.add_argument("--week")
    a = ap.parse_args(argv)
    if not a.verb: ap.print_usage(sys.stderr); return 2
    try:
        if a.verb == "health": out = {"ok": True, "health": health()}
        elif a.verb == "clauses": out = {"ok": True, "clauses": clause_table() if not a.id else {a.id: clause(a.id)}}
        elif a.verb == "calibrate": out = cmd_calibrate(a)
        elif a.verb == "judge": out = cmd_judge(a)
        elif a.verb == "check": out = check_ticket(a.evidence, a.ticket)
        elif a.verb == "ledger": out = check_ledger(a.evidence)
        elif a.verb == "epoch":
            st, meta = render_epoch(a.evidence, a.clause, a.artifact, a.week); out = {"ok": True, "state": st, "meta": meta}
        print(json.dumps(out)); return 0
    except Refused as e:
        print(f"REFUSED  {e.token}  —  {e.detail}", file=sys.stderr); return 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
