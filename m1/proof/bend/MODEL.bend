# MODEL.bend — P7.TURN-01 finite E1 proof model (the kernel).
# The human owns the shape; PROOF.bend proves every law in LAWS.bend over it.
# Finite by construction: Nat seconds / price*1e5 / scores / seq / lids, levels
# list capped at 512 by the service normalizer (never silently: truncation is
# recorded in the job row audit field). Scores live in 0..14, the work budget
# in 0..2, checkpoint seqs strictly increase, COMPLETE advances only on unlock.
# Def order is callee-first and recursion is single-def only: Bend rejects a
# call to a def written below it and rejects mutual recursion outright.

import Base

# ----------------------------- run state ----------------------------

type RunState is Data:
  RESOLVED{}
  EVIDENCE{}
  PILLARS{}
  ORGANS{}
  DERIVED{}
  SEALED{}
  COMPOSED{}
  COMPLETE{}

# hold: the COMPLETE gate. Locked (False) there is no next state; the
# operator unlock (True) admits exactly COMPLETE again (re-review, no silent
# forward edge out of COMPLETE exists in this model).
def hold(u: Bool) -> Maybe<&2, RunState>:
  match u:
    case False{}:
      None{}
    case True{}:
      Some{COMPLETE{}}

def adv_go(r: Maybe<&2, RunState>) -> Bool:
  match r:
    case None{}:
      False{}
    case Some{v}:
      True{}

# advance: one pipeline step. Every non-COMPLETE state steps forward;
# COMPLETE steps only through the unlock gate.
def advance(s: RunState, u: Bool) -> Maybe<&2, RunState>:
  match s:
    case RESOLVED{}:
      Some{EVIDENCE{}}
    case EVIDENCE{}:
      Some{PILLARS{}}
    case PILLARS{}:
      Some{ORGANS{}}
    case ORGANS{}:
      Some{DERIVED{}}
    case DERIVED{}:
      Some{SEALED{}}
    case SEALED{}:
      Some{COMPOSED{}}
    case COMPOSED{}:
      Some{COMPLETE{}}
    case COMPLETE{}:
      hold(u)

# ------------------------------ levels ------------------------------

# Level: one finite E1 input level. ts/price are Nat seconds / price*1e5,
# score is 0..14 Nat, seqn the checkpoint order, lid the conserved identity.
type Level is Data:
  Level{ts: Nat, price: Nat, score: Nat, seqn: Nat, lid: Nat}

def score_of(l: Level) -> Nat:
  match l:
    case Level{t, p, s, q, i}:
      s

def ts_of(l: Level) -> Nat:
  match l:
    case Level{t, p, s, q, i}:
      t

def seq_of(l: Level) -> Nat:
  match l:
    case Level{t, p, s, q, i}:
      q

def lid_of(l: Level) -> Nat:
  match l:
    case Level{t, p, s, q, i}:
      i

# score_ok: one level bounded 0..14 (Nat has no negatives; the upper bound is the law).
def score_ok(l: Level) -> Bool:
  match l:
    case Level{t, p, s, q, i}:
      Nat.is_le(s, 14n)

def ts_le_cut(cut: Nat, h: Level) -> Bool:
  match h:
    case Level{t, p, s, q, i}:
      Nat.is_le(t, cut)

# all_ts_ok: every level timestamp at or before the cutoff.
def all_ts_ok(+cut: Nat, xs: List<&2, Level>) -> Bool:
  match xs:
    case Nil{}:
      True{}
    case h <> t:
      Bool.and(ts_le_cut(cut, h), all_ts_ok(cut, t))

# all_scores_ok: every level score bounded 0..14.
def all_scores_ok(xs: List<&2, Level>) -> Bool:
  match xs:
    case Nil{}:
      True{}
    case h <> t:
      Bool.and(score_ok(h), all_scores_ok(t))

# lid_mem: conserved-identity probe — is lid m still present? Single-def
# recursion (nested match on the head); the shrinking list stays first so
# the termination checker accepts it.
def lid_mem(+m: Nat, xs: List<&2, Level>) -> Bool:
  match xs:
    case Nil{}:
      False{}
    case h <> t:
      match h:
        case Level{tt, p, s, q, i}:
          Bool.or(Nat.is_eq(m, i), lid_mem(m, t))

# keep_ids/all_ids: the conservation witnesses. keep extracts every input
# lid (the derived card drops nothing); all_ids is the identity baseline the
# length law compares against.
def keep_ids(xs: List<&2, Level>) -> List<Nat>:
  match xs:
    case Nil{}:
      Nil{}
    case h <> t:
      lid_of(h) <> keep_ids(t)

def all_ids(xs: List<&2, Level>) -> List<Nat>:
  match xs:
    case Nil{}:
      Nil{}
    case h <> t:
      lid_of(h) <> all_ids(t)

def len_keep(xs: List<&2, Level>) -> Nat:
  List.length(&1, Nat, keep_ids(xs))

def len_all(xs: List<&2, Level>) -> Nat:
  List.length(&1, Nat, all_ids(xs))

# seq_pair: adjacent checkpoint order strictly increases.
def seq_pair(a: Level, b: Level) -> Bool:
  match a:
    case Level{t1, p1, s1, q1, i1}:
      match b:
        case Level{t2, p2, s2, q2, i2}:
          Nat.is_lt(q1, q2)

# seq_go: the whole checkpoint chain strictly increases from prev_q.
# Single-def recursion with the shrinking list first (termination), nested
# match on the head (no helper defs: Bend forbids mutual recursion).
def seq_go(xs: List<&2, Level>, prev_q: Nat) -> Bool:
  match xs:
    case Nil{}:
      True{}
    case h <> t:
      match h:
        case Level{tt, p, s, +q, i}:
          Bool.and(Nat.is_lt(prev_q, q), seq_go(t, q))

def seq_chain0(xs: List<&2, Level>) -> Bool:
  seq_go(xs, 0n)

# --------------------------- card + budget --------------------------

# Card: the sealed finite E1 card — sha identity, cutoff seconds, levels.
type Card is Data:
  Card{sha: Nat, cutoff: Nat, levels: List<&2, Level>}

def sha_of(c: Card) -> Nat:
  match c:
    case Card{s, co, ls}:
      s

def cut_of(c: Card) -> Nat:
  match c:
    case Card{s, co, ls}:
      co

def sha_ok(c: Card, good: Nat) -> Bool:
  match c:
    case Card{s, co, ls}:
      Nat.is_eq(s, good)

# budget_ok: the work counter never exceeds two.
def budget_ok(w: Nat) -> Bool:
  match w:
    case 0n:
      True{}
    case 1n+p:
      match p:
        case 0n:
          True{}
        case 1n+q:
          match q:
            case 0n:
              True{}
            case 1n+r:
              False{}
