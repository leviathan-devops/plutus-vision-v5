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
  JUDGE_DOWN  JUDGE_TIMEOUT  JUDGE_BUSY  JUDGE_BAD_HEALTH  JUDGE_MODEL_MISMATCH  JUDGE_NO_VISION  CONTROL_UNSEPARATED (run VOID, no ticket)  CLAUSE_NOT_FOUND
  BUDGET_EXCEEDED  REGION_EMPTY (verdict INCONCLUSIVE, no judge call, no ticket)  THRESHOLD_UNCALIBRATED  CLAUSE_UNOBSERVABLE  EVIDENCE_SCOPE
  TICKET_WRITE_FAILED  TICKET_CORRUPT  LEDGER_HOLE  JUDGE_ABSTAINED  DEFECT_UNCLASSIFIED (recorded in the ticket, never bucketed)

Environment: PB_JUDGE_URL (default http://127.0.0.1:8090)  PB_JUDGE_MODEL (default imajev-4b-Q6_K)  PB_JUDGE_TIMEOUT_S (default 120)
             PB_JUDGE_WINDOW_BUDGET (default 15000)  PB_JUDGE_CONTROLS (a directory holding positive.png + negative.png; a test knob for the VOID path)
"""
import argparse, hashlib, io, json, os, re, sqlite3, sys, time, urllib.error, urllib.request, uuid
from pathlib import Path

HERE = Path(__file__).resolve().parent
URL = os.environ.get("PB_JUDGE_URL", "http://127.0.0.1:8090").rstrip("/")
MODEL = os.environ.get("PB_JUDGE_MODEL", "imajev-4b")   # the judge server of 2026-11-03 (torch runtime) names the model imajev-4b; a different model is a different act
def _env_num(name, default, cast, lo, hi):
    """a number from the environment, validated: a bad value is a NAMED refusal (BAD_CONFIG), never a traceback at import (ta stage 2 D-112/D-113)"""
    raw = os.environ.get(name, default)
    try: v = cast(raw)
    except ValueError: v = None
    if v is None or not (lo <= v <= hi):
        print(f"REFUSED  BAD_CONFIG  —  {name}={raw!r} is not a {cast.__name__} in [{lo}, {hi}]", file=sys.stderr); sys.exit(1)
    return v
TIMEOUT = _env_num("PB_JUDGE_TIMEOUT_S", "120", float, 1, 3600)   # 120: the judge is SHARED; under load one call measured 47 s and two timed out at 60 s
WINDOW_BUDGET = _env_num("PB_JUDGE_WINDOW_BUDGET", "15000", int, 1000, 1_000_000)  # default 15000          # blueprint section 2: REFUSE when (image + instructions + clauses + question + answer) > 15,000
ANSWER_HEADROOM = 1000
# THE CALIBRATION POLICY (the Jev calibration law + P3 blueprint 5.4), named once - the values the refusals below apply:
CHANCE = 0.5            # a pass at or below chance is not a pass: no act, no max(good p) may sit below it
CONTROL_POS_MIN = 0.85  # every judge call's known-good control must reach this ...
CONTROL_NEG_MAX = 0.15  # ... and its known-bad control stay at or under this, or the run is JUDGE_BLIND
SPREAD_MIN = 0.25       # min(good p) - max(bad p) below this: the question does not discriminate
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
# ONE JUDGE, ONE GPU: every inference POST holds a HOST-WIDE lock (F-224, 2026-11-04). Measured: the judge holds 11018 of the GPU's 12282 MiB
# with 19 MiB free; four Pineboxes verifying at once got HTTP 500 `CUBLAS_STATUS_ALLOC_FAILED` / `CUDNN_STATUS_INTERNAL_ERROR` on 3 of 4,
# while single verifies all WORK. The unit that varies is the judge, not the instance, so the bound is host-wide: concurrent verifies QUEUE.
# flock is released by the kernel if a holder dies; the wait is bounded by TIMEOUT and refuses JUDGE_BUSY by name; GET /health is not locked.
JUDGE_LOCK = Path(os.environ.get("XDG_RUNTIME_DIR") or f"/run/user/{os.getuid()}") / "pinebox" / "judge.lock"

def http(method, path, data=None, headers=None):
    req = urllib.request.Request(URL + path, data=data, headers=headers or {}, method=method)
    lk = None
    if method == "POST" and path.startswith("/v1/systemone"):
        import fcntl
        JUDGE_LOCK.parent.mkdir(parents=True, exist_ok=True)
        lk = open(JUDGE_LOCK, "a+")
        t0 = time.monotonic()
        while True:
            try: fcntl.flock(lk, fcntl.LOCK_EX | fcntl.LOCK_NB); break
            except BlockingIOError:
                if time.monotonic() - t0 > TIMEOUT:
                    lk.close(); refuse("JUDGE_BUSY", f"another judge call held {JUDGE_LOCK} for over {TIMEOUT:.0f}s - the claim stays unproven")
                time.sleep(0.05)
        waited = time.monotonic() - t0
        if waited > 1: print(f"[pbjudge] judge lock: waited {waited:.1f}s for the shared judge", file=sys.stderr)
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as r: return r.status, r.read()
    except urllib.error.HTTPError as e: return e.code, e.read()
    except (urllib.error.URLError, ConnectionError, OSError) as e:
        if "timed out" in str(e): refuse("JUDGE_TIMEOUT", f"{URL}{path} did not answer within {TIMEOUT:.0f}s - the claim stays unproven")
        refuse("JUDGE_DOWN", f"{URL}{path}: {e} - there is no fallback judge (a different model is a different instrument); the claim stays unproven")
    finally:
        if lk: lk.close()          # closing the descriptor releases the flock


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
    # VISION PROOF: the server reports the sha256 of every image it decoded (usage.images); the sent image must be among them.
    # (The previous server answered modality:"image"; this one does not, and a missing field is not a proof.)
    seen = [i.get("sha256") for i in ((j.get("usage") or {}).get("images") or [])]
    if sha(png) not in seen: refuse("JUDGE_NO_VISION", f"the judge did not report decoding the sent image (sent {sha(png)[:16]}, reported {[s[:16] for s in seen if s]}): its answer is not about the picture")
    return {"p": float(a["noul"]), "call_id": cid, "latency_ms": ms, "usage": j.get("usage"), "model": j.get("model"), "raw": raw, "state_truncated": j.get("state_truncated")}


def ask_choice(question, labels, png, state):
    j, cid, ms, raw = call({"state": state, "questions": {"c": {"type": "choice", "instructions": question, "criteria": labels}}}, png)
    a = j["answers"]["c"]
    # top_p is the TOP LABEL'S probability; the server's `confidence` is the distribution's concentration (TypeSafe docs: "Choice confidence
    # summarizes distribution concentration"), measured 0.49 with MISSING_ELEMENT at 0.571 - reading it as top_p unclassified a correct class.
    return {"probs": a["probabilities"], "top": a["choice"], "top_p": float(a["probabilities"][a["choice"]]), "call_id": cid, "latency_ms": ms, "model": j.get("model"), "raw": raw}


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
    if c["act"] < CHANCE: refuse("THRESHOLD_INVERTED", f"act {c['act']} is below chance ({CHANCE}) for {cid}: a pass below chance")
    return a, c


# ───────────────────────────────────────────────── images ──
def prep(path, width=1280):
    # F-196 (measured 2026-11-02, raw/judge-ab-*.json): shrinking the 1042x785 chart element to 768 px and letting the engine upscale it
    # to 1024 tokens cost 803 ms per image; sending it NATIVE (~840 tokens, engine --image-max-tokens 1024, no minimum) costs 575 ms and
    # keeps the separation (one-MA 0.332 vs min good 0.714). A 390-token image (the model card's 400,000 px) is faster (353 ms) but can
    # NOT tell one moving average from two (0.785 > 0.701): never shrink below what the clause needs to see.
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


# THE SIGNING KEY (P3 T6 "the hook refuses a claim whose ticket it did not write"): 32 random bytes created by the judge on first use, mode 0600,
# OUTSIDE every repo and every evidence dir. A ticket's signature = HMAC-SHA256(key, bundle_sha + ":" + artifact_sha). A ticket an agent assembles by
# hand - even a self-consistent one whose hashes all recompute (F-191) - carries no valid signature: TICKET_UNSIGNED.
KEY_FILE = Path(os.environ.get("PB_JUDGE_KEY") or (Path(os.environ.get("XDG_CONFIG_HOME") or Path.home() / ".config") / "pinebox" / "judge.key"))


def signing_key(create=False):
    if not KEY_FILE.exists():
        if not create: refuse("TICKET_UNSIGNED", f"no signing key at {KEY_FILE}: this host's judge has never written a ticket, so no ticket here can be its own")
        KEY_FILE.parent.mkdir(parents=True, exist_ok=True)
        fd = os.open(str(KEY_FILE), os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        with os.fdopen(fd, "wb") as f: f.write(os.urandom(32))
    if KEY_FILE.stat().st_mode & 0o077: refuse("TICKET_UNSIGNED", f"the signing key {KEY_FILE} is readable by others (mode {oct(KEY_FILE.stat().st_mode & 0o777)}): it signs nothing")
    return KEY_FILE.read_bytes()


def sign(bundle, artifact_sha, create=False):
    import hmac
    return hmac.new(signing_key(create), f"{bundle}:{artifact_sha}".encode(), "sha256").hexdigest()


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
                    "writer": f"pbjudge.py sha256:{shaf(__file__)[:16]}", "hash_rule": "sha256(clause.sha + region.sha + judgment.sha + pass.sha)",
                    "signature": sign(bundle, artifact_sha, create=True), "signature_rule": "HMAC-SHA256(judge.key, bundle_sha256 + ':' + artifact_sha256)"}
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


def check_ticket(evidence, tid, artifact=None, require_signature=True):
    """the ticket recomputes from its parts (TICKET_CORRUPT), carries this host's judge signature (TICKET_UNSIGNED), and - when an artifact is
    cited (a png path or a 64-hex sha) - judged THAT artifact: its frame or its region (ARTIFACT_MISMATCH)."""
    d = scoped(evidence, "tickets", f"{tid}.ticket")
    if not d.is_dir(): refuse("TICKET_ABSENT", f"ticket {tid} is not on disk under {evidence}")
    m = json.loads((d / "manifest.json").read_text()); bad = []
    for name, want in m["parts"].items():
        if not (d / name).exists() or shaf(d / name) != want: bad.append(name)
    recomputed = sha((shaf(d / "clause.md") + shaf(d / "region.png") + shaf(d / "judgment.json") + shaf(d / "pass.json")).encode()) if not bad else None
    if bad or recomputed != tid or m["bundle_sha256"] != tid: refuse("TICKET_CORRUPT", f"ticket {tid}: parts that do not match their manifest: {bad or 'none'}; recomputed bundle {str(recomputed)[:16]} != name {tid[:16]}")
    import hmac
    signed = bool(m.get("signature")) and hmac.compare_digest(m["signature"], sign(tid, m.get("artifact_sha256", "")))
    if require_signature and not signed:
        refuse("TICKET_UNSIGNED", f"ticket {tid[:16]} is not signed by this host's judge (manifest signature {'absent' if not m.get('signature') else 'does not verify'}): the tool did not write it")
    if artifact:
        a = artifact if re.fullmatch(r"[0-9a-f]{64}", artifact) else (shaf(Path(artifact)) if Path(artifact).is_file() else None)
        if a is None: refuse("ARTIFACT_MISMATCH", f"the cited artifact '{artifact}' is neither a sha256 nor a readable file")
        if a not in (m.get("artifact_sha256"), m["parts"].get("frame.png"), m["parts"].get("region.png")):
            refuse("ARTIFACT_MISMATCH", f"ticket {tid[:16]} judged artifact {str(m.get('artifact_sha256'))[:16]} (region {m['parts'].get('region.png','')[:16]}); the cited artifact is {a[:16]}: a ticket proves only the frame it judged")
    pj = json.loads((d / "pass.json").read_text())
    return {"ok": True, "ticket": tid, "pass": pj["pass"], "clause": m["clause"], "recomputed": recomputed, "signed": signed, "artifact": m.get("artifact_sha256"), "parts": list(m["parts"])}


def check_ledger(evidence):
    f = scoped(evidence, "ledger.jsonl")
    if not f.exists(): refuse("LEDGER_HOLE", "no ledger.jsonl")
    prev = "0" * 64; n = 0; unsigned = 0
    for line in f.read_text().splitlines():
        if not line.strip(): continue
        j = json.loads(line); want = j.pop("row_hash")
        if j["prev_hash"] != prev or sha((prev + json.dumps(j, sort_keys=True)).encode()) != want: refuse("LEDGER_HOLE", f"the hash chain breaks at row {j.get('seq')} (a row was edited, removed or reordered)")
        if not scoped(evidence, "tickets", f"{j['ticket']}.ticket").is_dir(): refuse("LEDGER_HOLE", f"row {j['seq']} names ticket {j['ticket'][:16]} which is not on disk (a ticket was deleted)")
        # the row's verdict must be the verdict of the ticket it names, and the ticket must still recompute (F-191: `ledger` returned ok:true on a copy whose pass.json had been flipped)
        # the CHAIN's integrity does not depend on signatures (a ledger may hold rows written before signing, EN-193): every row must
        # recompute and agree with its ticket; the signature is required of the ticket a claim CITES (check_ticket), and counted here
        t = check_ticket(evidence, j["ticket"], require_signature=False); unsigned += 0 if t["signed"] else 1
        if ("PASS" if t["pass"] else "FAIL") != j["verdict"]: refuse("LEDGER_HOLE", f"row {j['seq']} says {j['verdict']} but ticket {j['ticket'][:16]} says pass:{t['pass']}")
        prev = want; n += 1
    return {"ok": True, "rows": n, "head": prev, "unsigned_rows": unsigned}


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
    sep = rp["p"] >= CONTROL_POS_MIN and rn["p"] <= CONTROL_NEG_MAX
    if not sep: refuse("CONTROL_UNSEPARATED", f"clause {cid}: positive control p={rp['p']:.3f} (need at least {CONTROL_POS_MIN}), negative control p={rn['p']:.3f} (need at most {CONTROL_NEG_MAX}): JUDGE_BLIND - the run is VOID, no ticket")
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
    if max(gp) < CHANCE: refuse("CLAUSE_UNOBSERVABLE", f"max p over good frames is {max(gp):.3f}, below chance ({CHANCE}): the QUESTION is broken (usually compound) - rewrite the clause, do not lower the bar. sweep={sweep}")
    if spread <= 0: refuse("CLAUSE_UNOBSERVABLE", f"min(good)={min(gp):.3f} <= max(bad)={max(bp):.3f}: the good and bad frames are not separable by this question; sweep={sweep}")
    # blueprint P3 5.4: a spread below 0.25 does not discriminate. (A midpoint below 0.5 with a wide gap is NOT a defect: measured 2026-11-03,
    # good 0.934-0.939 vs bad 0.014-0.062 put the midpoint at 0.4978 and the old "act < 0.5" guard refused the clearest clause there is.)
    if spread < SPREAD_MIN: refuse("CLAUSE_UNOBSERVABLE", f"spread min(good)-max(bad) = {spread:.3f}, under {SPREAD_MIN}: the question does not discriminate; sweep={sweep}")
    act = round(max(CHANCE, (min(gp) + max(bp)) / 2), 4)             # the midpoint of the gap, never below chance; derived from data, recorded with the sweep beside it
    toks = sorted({x["image_tokens"] for x in good + bad if x["image_tokens"]})
    f = act_file(); doc = json.loads(f.read_text()) if f.exists() else {"clauses": {}}
    if act < CHANCE:
        # a pass below chance is not a threshold: the clause is UNOBSERVABLE for this judge at this scale. Recorded (with its sweep) and refused - never written as usable.
        doc.setdefault("unobservable", {})[a.clause] = {"would_be_act": act, "good": good, "bad": bad, "sweep": sweep, "clause_text": ctext, "derived_at": time.strftime("%Y-%m-%dT%H:%M:%S%z")}
        doc.get("clauses", {}).pop(a.clause, None); f.write_text(json.dumps(doc, indent=1, sort_keys=True))
        refuse("CLAUSE_UNOBSERVABLE", f"clause {a.clause}: the derived act would be {act}, below chance {CHANCE} (good p {gp}, bad p {bp}): the judge cannot see this reliably - rewrite the clause or change the scale; recorded under 'unobservable' in act.json, NOT usable")
    doc["clauses"][a.clause] = {"act": act, "rule": "midpoint(min(good p), max(bad p))", "good": good, "bad": bad, "min_good": min(gp), "max_bad": max(bp), "spread": spread,
                                "sweep": sweep, "image_tokens_measured": toks, "derived_at": time.strftime("%Y-%m-%dT%H:%M:%S%z"), "clause_text": ctext}
    doc["health_at_calibration"] = health()
    f.write_text(json.dumps(doc, indent=1, sort_keys=True))
    return {"ok": True, "clause": a.clause, "act": act, "spread": spread, "good": gp, "bad": bp, "sweep": sweep, "image_tokens": toks, "written": str(f)}


# ───────────────────────────────────────────────── P3e · the judgement ──
def judge_one(a, cid, h, wlock):
    """one clause: controls + the clause question (concurrent), then the ticket and the ledger row (serialised by wlock)"""
    ctext = clause(cid); act_doc, act_c = load_act(cid)
    region_png, info = prep(a.region)                                   # REGION_EMPTY here -> INCONCLUSIVE, before any judge call
    frame_png = Path(a.frame or a.region).read_bytes()
    artifact = shaf(a.region)
    state, ep = render_epoch(a.evidence, cid, artifact, a.week)
    toks = (act_c.get("image_tokens_measured") or [None])[0]
    if toks is None: refuse("THRESHOLD_UNCALIBRATED", f"no measured image cost for {cid} in act.json: the budget cannot be computed")
    parts, total = pack(cid, ctext, state, toks)
    ctl, r = ask_all(ctext, cid, region_png, state)                # controls (same clause, known-good + known-bad image) and the main question, concurrently
    if r["state_truncated"]: refuse("BUDGET_EXCEEDED", "the adapter reports it truncated the state: the judgement would be about a document it did not receive")
    passed = bool(r["p"] >= act_c["act"] and ctl["separated"])
    cls = None; choice = None
    if not passed:
        choice = ask_choice(f"This image fails the claim '{ctext}'. Which one of these best describes what is wrong?", CLASSES, region_png, state)
        cls = choice["top"] if choice["top_p"] >= act_doc.get("class_min", 0.5) else "DEFECT_UNCLASSIFIED"
    judgment = {"model": r["model"], "health": {k: h.get(k) for k in ("model", "modalities", "slot_ctx", "state_char_cap")}, "clause": cid, "clause_text": ctext,
                "question": question_for(ctext), "p": round(r["p"], 6), "threshold_act": act_c["act"], "act_rule": act_c["rule"], "controls": ctl, "class": cls,
                "choice": None if choice is None else {"probs": choice["probs"], "top": choice["top"], "raw": choice["raw"]}, "state": state, "epoch": ep,
                "budget": {"parts": parts, "total": total, "window_budget": WINDOW_BUDGET}, "capture": info, "call_id": r["call_id"], "latency_ms": r["latency_ms"],
                "usage": r["usage"], "raw_response": r["raw"], "artifact_sha256": artifact, "week": a.week}
    with wlock:
     tid, man = write_ticket(a.evidence, cid, ctext, region_png, frame_png, judgment, passed, artifact)
     c = db(a.evidence); c.execute("INSERT INTO analyses(clause,artifact_sha,pass,p,class,epoch_hash,ticket,created_at) VALUES (?,?,?,?,?,?,?,?)",
                                  (cid, artifact, int(passed), r["p"], cls, ep["epoch_hash"], tid, time.strftime("%Y-%m-%dT%H:%M:%S%z"))); c.commit()
     row = append_ledger(a.evidence, {"ticket": tid, "clause": cid, "verdict": "PASS" if passed else "FAIL", "class": cls, "artifact_sha256": artifact, "p": round(r["p"], 4), "epoch_hash": ep["epoch_hash"]})
    return {"ok": True, "ticket": tid, "pass": passed, "p": round(r["p"], 4), "act": act_c["act"], "class": cls, "epoch": ep["epoch"], "epoch_hash": ep["epoch_hash"][:16],
            "controls": {"positive": ctl["positive"]["p"], "negative": ctl["negative"]["p"]}, "ledger_seq": row["seq"], "ticket_dir": str(scoped(a.evidence, "tickets", f"{tid}.ticket")),
            "enforcement": enforcement_state()}


def cmd_judge(a):
    """every clause named in --clause (comma list), judged CONCURRENTLY; one ticket per clause. A refusal on any clause refuses the whole call
    (a run whose instrument failed on one clause has not been verified), naming the clause; the overall pass is the AND of every ticket."""
    import threading
    from concurrent.futures import ThreadPoolExecutor
    cids = [c.strip() for c in a.clause.split(",") if c.strip()]
    if not cids: refuse("CLAUSE_NOT_FOUND", "--clause named no clause")
    for c in cids: clause(c); load_act(c)                               # unknown or uncalibrated clauses refuse BEFORE any judge call
    h = health(); wlock = threading.Lock()
    def run(c):
        try: return c, judge_one(a, c, h, wlock), None
        except Refused as e: return c, None, e
    with ThreadPoolExecutor(max_workers=len(cids)) as ex: done = list(ex.map(run, cids))
    for c, _, e in done:
        if e is not None: raise Refused(e.token, f"clause {c}: {e.detail}")
    res = {c: r for c, r, _ in done}
    return {"ok": True, "pass": all(r["pass"] for r in res.values()), "clauses": cids, "failed": [c for c in cids if not res[c]["pass"]],
            "tickets": {c: res[c]["ticket"] for c in cids}, "results": res,
            "enforcement": enforcement_state()}


# THE LOCK'S RESOLVER (P3 section 7). One function for the three consumers: the extension's session_stop hook (mode "turn"),
# the commit-msg hooks of PINEBOX and PLUTUS_VISION (mode "commit"), and an agent checking its own claim.
# the DETECTOR: P3 section 7's vocabulary (works|verified|passes|it's good|render is correct|success|done|shipped) widened to its inflections and
# plain synonyms - measured miss: "the verify run passed and the chart is correct" slipped the verbatim list. Wide is safe: the judge decides.
CLAIM_RE = re.compile(r"\b(works?|worked|working|verified|pass(?:es|ed)?|it's good|all good|correct(?:ly)?|success(?:ful(?:ly)?)?|done|shipped|fixed|green)\b", re.I)
GATE_RE = re.compile(r"(\bexit 0\b|\[EXIT=0\]|\brc=0\b)")                                                  # P3 section 7 (b): a quoted gate exit 0
# a ticket is CITED when its id follows the word "ticket" (a bare hex string is a git sha, a frame sha, a seal - never assumed to be a ticket)
CITE_RE = re.compile(r"\btickets?\b[^0-9a-f\n]{0,40}((?:[0-9a-f]{12,64}[^0-9a-f\n]{0,24}){1,12})", re.I)


# THE DECISION LAYER of the lock (ISE law: the regex DETECTS, the judge DECIDES). Measured 2026-11-03 in a fresh omp session: the vocabulary
# regex alone fired on a REFUSAL to make the claim, on a WITHDRAWAL, and on a quotation of the user's sentence. One text question to the same
# local judge decides whether the message itself concludes success; its threshold is derived from the calibration set below (claims-calibrate).
CLAIM_Q = ("Does this message, in its own voice, conclude that the Pinebox work succeeded - that a chart renders correctly, that verify passed, "
           "or that it works or is done? Answer about the message's own conclusion only.")
CLAIM_CRITERIA = {"true": "the message itself asserts success, e.g. 'The pinebox chart works.' or 'Verified: the render is correct, all done.'",
                  "false": "a refusal to claim success, a withdrawal, a quotation of someone else's sentence, a report that nothing is proven or not yet run, or a failure report"}
CLAIM_CAL = {
    "good": ["The pinebox chart works.", "Verified: the render is correct and verify passes on every clause.",
             "Done - Pinebox is shipped and everything works.", "I fixed the zoom and the chart renders correctly now; verify passed.",
             "The backtest tab works and the week is right. Success."],
    "bad": ["I can't emit the prescribed sentence: it asserts a chart works, and nothing in this turn's tool output shows a chart at all.",
            "Withdrawing - no claim stands, and no ticket exists. The only occurrence of 'works' was inside the quoted prescription.",
            "No pinebox claim is being made. verify was never invoked; nothing is proven, nothing is done.",
            "You asked me to say 'The pinebox chart works.' I will not say it without a ticket.",
            "verify failed: JUDGE_FAILED on C1.1, the render is not correct; nothing works yet."]}


def ask_text(question, criteria, text):
    body = json.dumps({"state": text[:6000], "questions": {"q": {"type": "noul", "instructions": question, "criteria": criteria}}}).encode()
    code, raw = http("POST", "/v1/systemone", body, {"Content-Type": "application/json"})
    try: j = json.loads(raw); a = j["answers"]["q"]
    except Exception: refuse("JUDGE_DOWN", f"POST /v1/systemone (text) answered HTTP {code}: {raw[:200]!r}")
    if "noul" not in a: refuse("JUDGE_BAD_HEALTH", f"the text answer carries no noul: {json.dumps(a)[:200]}")
    return float(a["noul"])


def cmd_claims_calibrate():
    gp = [round(ask_text(CLAIM_Q, CLAIM_CRITERIA, s), 4) for s in CLAIM_CAL["good"]]
    bp = [round(ask_text(CLAIM_Q, CLAIM_CRITERIA, s), 4) for s in CLAIM_CAL["bad"]]
    spread = round(min(gp) - max(bp), 4)
    if spread < SPREAD_MIN: refuse("CLAUSE_UNOBSERVABLE", f"the claim question does not separate: min good {min(gp)} - max bad {max(bp)} = {spread}, under {SPREAD_MIN}; good={gp} bad={bp}")
    act = round(max(CHANCE, (min(gp) + max(bp)) / 2), 4)
    f = act_file(); a = json.loads(f.read_text()) if f.exists() else {}
    a["claims"] = {"act": act, "spread": spread, "good": gp, "bad": bp, "question": CLAIM_Q, "rule": "max(0.5, midpoint(min good, max bad))"}
    f.write_text(json.dumps(a, indent=1, sort_keys=True))
    return {"ok": True, "act": act, "spread": spread, "good": gp, "bad": bp}


def evidence_roots():
    env = os.environ.get("PB_EVIDENCE_ROOTS")
    if env: return [Path(x) for x in env.split(":") if x]
    base = Path(f"/run/user/{os.getuid()}/pinebox")
    return sorted(base.glob("i*/evidence")) + sorted(base.glob("i*/archive/*/evidence"))


def resolve_ticket(prefix):
    hits = []
    for root in evidence_roots():
        for d in (root / "tickets").glob(f"{prefix}*.ticket"):
            if d.is_dir(): hits.append((root, d.name[:-len(".ticket")]))
    return hits


def cmd_claims(text, mode):
    ids = []
    for m in CITE_RE.finditer(text):
        ids += [x.lower() for x in re.findall(r"[0-9a-f]{12,64}", m.group(1), re.I)]
    ids = list(dict.fromkeys(ids))
    claim = [w.lower() for w in CLAIM_RE.findall(text)]
    gate = bool(GATE_RE.search(text))
    rows, worst = [], None
    # every token the checks below can raise, worst first. LEDGER_HOLE (check_ledger) was missing, so a ticket whose ledger is absent or
    # broken was reported as TICKET_CORRUPT - a clean ticket named tampered (ta stage 2 round 8, probe P-4: detail "no ledger.jsonl")
    order = ["TICKET_ABSENT", "TICKET_CORRUPT", "LEDGER_HOLE", "TICKET_UNSIGNED", "TICKET_FAILED"]
    for i in ids:
        hits = resolve_ticket(i)
        if not hits: row = {"id": i, "token": "TICKET_ABSENT", "detail": "no ticket with this id under " + ", ".join(str(r) for r in evidence_roots()[:3])}
        elif len({h[1] for h in hits}) > 1: row = {"id": i, "token": "TICKET_ABSENT", "detail": f"the prefix names {len(hits)} tickets: cite more of the id"}
        else:
            root, tid = hits[0]
            try:
                r = check_ticket(str(root), tid); check_ledger(str(root))
                row = {"id": tid, "evidence": str(root), "pass": r["pass"], "clause": r["clause"], "token": None if r["pass"] else "TICKET_FAILED"}
            except Refused as e:
                if e.token not in order: raise   # an unknown refusal is the checker's own failure: named, never relabelled as a ticket verdict
                row = {"id": tid, "evidence": str(root), "token": e.token, "detail": e.detail}
        rows.append(row)
        if row["token"] and (worst is None or order.index(row["token"]) < order.index(worst)): worst = row["token"]
    judged, quoted = None, False
    def judge_claim():
        c = json.loads(act_file().read_text()).get("claims") if act_file().exists() else None
        if not c: refuse("THRESHOLD_UNCALIBRATED", "no calibrated claims act in act.json - run: pbjudge.py claims-calibrate")
        p = ask_text(CLAIM_Q, CLAIM_CRITERIA, text); return {"p": round(p, 4), "act": c["act"]}
    if worst is None and mode == "turn" and claim and not ids and not gate:
        judged = judge_claim()
        if judged["p"] >= judged["act"]: worst = "NO_TICKET"
    elif worst is not None and mode == "turn":
        # A TURN that cites a ticket which does not check is refused only if it CLAIMS success with it. A withdrawal or a report that QUOTES
        # the refused id ("the claim 'ticket 33fb...' is NOT backed") was refused again on every turn until CLAIM_UNRESOLVED (measured in a
        # fresh omp session, 2026-11-03: 4 refusals of withdrawals). No success words -> not a claim; success words -> the calibrated claim
        # judge decides, exactly as for an uncited text. The COMMIT lock stays strict: any cited ticket there must check.
        if not claim: worst, quoted = None, True
        else:
            judged = judge_claim()
            if judged["p"] < judged["act"]: worst, quoted = None, True
    verdict = worst or "OK"
    return {"ok": verdict == "OK", "verdict": verdict, "mode": mode, "claim_words": sorted(set(claim)), "gate_quoted": gate, "cited": rows, "judged": judged,
            "cited_not_claimed": quoted,
            "rule": "P3 section 7: a claim with no ticket id and no quoted gate exit 0 -> CLAIM_WITHOUT_TICKET / NO_TICKET; a cited id absent -> TICKET_ABSENT; its ledger absent/broken -> LEDGER_HOLE; pass:false -> TICKET_FAILED"}


def enforcement_state():
    """P3 section 8: the tool says, in its own result, whether a claim is gated - read from the DEPLOYED extension, never assumed."""
    ext = Path(os.environ.get("PB_EXT_DIR") or Path.home() / ".omp/agent/extensions/pinebox") / "index.ts"
    try: src = ext.read_text()
    except OSError: src = ""
    if "session_stop" in src and "CLAIM_WITHOUT_TICKET" in src:
        return "ENFORCED: the pinebox extension's session_stop lock refuses a success claim that cites no passing signed ticket (P3f); sessions start it at load"
    return f"ENFORCEMENT_ABSENT: {ext} carries no claim lock; a success claim is NOT gated by these tickets"


def phase_table(table=None):
    f = Path(table) if table else HERE / "phases.json"
    try: return json.loads(f.read_text())["phases"]
    except Exception as e: refuse("PHASE_TABLE_UNREADABLE", f"{f}: {e}")


def phase_clauses(name, table=None):
    ph = phase_table(table)
    if name not in ph: refuse("PHASE_NOT_FOUND", f"no phase '{name}' in the ticket table (have: {', '.join(sorted(ph))})")
    return list(ph[name]["clauses"])


def cmd_phase_close(evidence, name, region, table=None):
    """P3g: close a phase only when every clause the ticket table requires has a passing, SIGNED ticket for the judged frame `region`;
    a ticket that already closed another phase is refused. The close is a hash-chained row in phases.jsonl beside the ledger."""
    need = phase_clauses(name, table)
    if not region or not Path(region).is_file(): refuse("PHASE_TICKETS_MISSING", f"phase '{name}': no judged frame - run `pinebox verify --phase {name}` first")
    art = shaf(Path(region))
    f = scoped(evidence, "ledger.jsonl")
    rows = [json.loads(l) for l in f.read_text().splitlines() if l.strip()] if f.exists() else []
    pf = scoped(evidence, "phases.jsonl")
    closed = [json.loads(l) for l in pf.read_text().splitlines() if l.strip()] if pf.exists() else []
    used = {tid: c["phase"] for c in closed for tid in c["tickets"].values()}
    got, missing, why = {}, [], {}
    for cid in need:
        hit = None
        for r in reversed(rows):
            if r.get("clause") != cid or r.get("verdict") != "PASS": continue
            # a ticket that does not check is not a pass for this frame - its REASON is kept and named below (it was dropped: ta stage 2 D-54)
            try: t = check_ticket(evidence, r["ticket"], artifact=art)
            except Refused as e: why.setdefault(cid, []).append(f"{r['ticket'][:12]} {e.token}"); continue
            if t["pass"]: hit = r["ticket"]; break
        if hit: got[cid] = hit
        else: missing.append(cid)
    if missing:
        rej = "; ".join(f"{cid}: {', '.join(why[cid][:3])}" for cid in missing if cid in why)
        refuse("PHASE_TICKETS_MISSING", f"phase '{name}' needs a passing signed ticket on the judged frame {art[:16]} for {', '.join(missing)} (have {', '.join(got) or 'none'})" + (f"; tickets that did not check: {rej}" if rej else ""))
    reused = {cid: used[tid] for cid, tid in got.items() if tid in used and used[tid] != name}
    if reused: refuse("TICKET_REUSED", f"phase '{name}': " + "; ".join(f"{cid} ticket {got[cid][:16]} already closed phase '{ph}'" for cid, ph in reused.items()) + " - judge the frame again for this phase")
    prev = closed[-1]["row_hash"] if closed else "0" * 64
    row = {"phase": name, "clauses": need, "tickets": got, "artifact": art, "closed_at": time.strftime("%Y-%m-%dT%H:%M:%S%z"), "prev_hash": prev}
    row["row_hash"] = sha((prev + json.dumps(row, sort_keys=True)).encode())
    with open(pf, "a") as fh: fh.write(json.dumps(row) + "\n")
    return {"ok": True, "phase": name, "closed": True, "tickets": got, "artifact": art, "row_hash": row["row_hash"]}


def clauses_for(pine, week):
    """the clauses a render must satisfy: the universal set, the script's own (by file name), and the month clause of the requested week if one is calibrated"""
    b = json.loads((HERE / "bindings.json").read_text())
    out = list(b.get("universal", []))
    out += [c for c in b.get("scripts", {}).get(os.path.basename(pine or ""), []) if c not in out]
    if week:
        import datetime
        m = re.match(r"^(\d{4})-W(\d{2})$", week)
        if m:
            mon = datetime.date.fromisocalendar(int(m.group(1)), int(m.group(2)), 1).strftime("%b")
            c = b.get("month", {}).get(mon)
            if c and c not in out: out.append(c)
    usable = json.loads(act_file().read_text()).get("clauses", {})
    missing = [c for c in out if c not in usable]
    if missing: refuse("THRESHOLD_UNCALIBRATED", f"bound clauses {missing} have no calibrated act in act.json")
    return out

def main(argv):
    ap = argparse.ArgumentParser(prog="pbjudge"); sp = ap.add_subparsers(dest="verb")
    sp.add_parser("health"); c = sp.add_parser("clauses"); c.add_argument("id", nargs="?")
    k = sp.add_parser("calibrate"); k.add_argument("--clause", required=True); k.add_argument("--evidence"); k.add_argument("--good", nargs="+", required=True); k.add_argument("--bad", nargs="+", required=True)
    j = sp.add_parser("judge"); j.add_argument("--clause", required=True); j.add_argument("--evidence", required=True); j.add_argument("--region", required=True); j.add_argument("--frame"); j.add_argument("--week")
    ck = sp.add_parser("check"); ck.add_argument("--evidence", required=True); ck.add_argument("--artifact"); ck.add_argument("ticket")
    lg = sp.add_parser("ledger"); lg.add_argument("--evidence", required=True)
    sp.add_parser("claims-calibrate")
    cl = sp.add_parser("claims"); cl.add_argument("--mode", choices=["turn", "commit"], default="turn"); cl.add_argument("--text-file", required=True)
    cf = sp.add_parser("clauses-for"); cf.add_argument("--pine"); cf.add_argument("--week"); cf.add_argument("--phase"); cf.add_argument("--table")
    pc = sp.add_parser("phase-close"); pc.add_argument("--evidence", required=True); pc.add_argument("--phase", required=True); pc.add_argument("--region"); pc.add_argument("--table")
    ep = sp.add_parser("epoch"); ep.add_argument("--evidence", required=True); ep.add_argument("--clause", default="C1.1"); ep.add_argument("--artifact", default="0" * 64); ep.add_argument("--week")
    a = ap.parse_args(argv)
    if not a.verb: ap.print_usage(sys.stderr); return 2
    try:
        if a.verb == "health": out = {"ok": True, "health": health()}
        elif a.verb == "clauses": out = {"ok": True, "clauses": clause_table() if not a.id else {a.id: clause(a.id)}}
        elif a.verb == "calibrate": out = cmd_calibrate(a)
        elif a.verb == "judge": out = cmd_judge(a)
        elif a.verb == "claims-calibrate": out = cmd_claims_calibrate()
        elif a.verb == "claims":
            out = cmd_claims(sys.stdin.read() if a.text_file == "-" else Path(a.text_file).read_text(errors="replace"), a.mode)
            if not out["ok"]:
                print(json.dumps(out)); refuse(out["verdict"], "; ".join(f"{r['id'][:16]} {r['token']}" for r in out["cited"] if r["token"]) or "the text claims success (" + ", ".join(out["claim_words"]) + ") and cites no ticket and quotes no gate exit 0")
        elif a.verb == "clauses-for": out = {"ok": True, "clauses": phase_clauses(a.phase, a.table) if a.phase else clauses_for(a.pine, a.week)}
        elif a.verb == "phase-close": out = cmd_phase_close(a.evidence, a.phase, a.region, a.table)
        elif a.verb == "check": out = check_ticket(a.evidence, a.ticket, a.artifact)
        elif a.verb == "ledger": out = check_ledger(a.evidence)
        elif a.verb == "epoch":
            st, meta = render_epoch(a.evidence, a.clause, a.artifact, a.week); out = {"ok": True, "state": st, "meta": meta}
        print(json.dumps(out)); return 0
    except Refused as e:
        print(f"REFUSED  {e.token}  —  {e.detail}", file=sys.stderr); return 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
