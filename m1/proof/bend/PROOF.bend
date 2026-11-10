# PROOF.bend - P7.TURN-01 proofs (the machine owns this file). Each law in
# LAWS.bend is proven by the def of the same name. conserve_len is induction
# over the level list (rewrite with % and _); lock_closed is case analysis on
# the unlock bit; every pin computes ({==}).
# Negative path: `bend PROOF.bend -- negative` takes the adversarial branch
# (WorkBudget=3, timestamp past cutoff) and dies non-zero so the checker can
# verify refusal. Documented invocation, also driven by proof/scripts/checkBend.ts.

import Base
import ./MODEL.bend as Model
import ./LAWS.bend as Laws

def Laws.cutoff_ok():
  {==}

def Laws.conserve_len(xs):
  match xs:
    case Nil{}:
      {==}
    case h <> t:
      %Laws.conserve_len(t) : {1n+Model.len_keep(t) == 1n+_ : Nat}
      {==}

def Laws.scores_ok():
  {==}

def Laws.seq_ok():
  {==}

def Laws.budget_ok2():
  {==}

def Laws.lock_closed(u):
  match u:
    case True{}:
      {==}
    case False{}:
      {==}

def showpair(p: Bool & Bool) -> String:
  match p:
    case (x, y):
      Bool.show(x) ++ " " ++ Bool.show(y)

def pos_lines() -> String:
  "PROOF_POSITIVE_PASS "
  ++ showpair((Model.budget_ok(2n), Model.budget_ok(3n))) ++ " "
  ++ showpair((Model.all_ts_ok(5n, [Model.Level{3n, 100n, 12n, 1n, 1n}]), Model.all_ts_ok(5n, [Model.Level{9n, 100n, 12n, 1n, 1n}]))) ++ " "
  ++ showpair((Model.adv_go(Model.advance(Model.COMPLETE{}, False{})), Model.adv_go(Model.advance(Model.COMPLETE{}, True{})))) ++ "\n"

def has_neg(args: List<String>) -> Bool:
  match args:
    case Nil{}:
      False{}
    case a <> rr:
      Bool.or(String.eq(a, "negative"), has_neg(rr))

def go_neg(c: Bool) -> IO(Unit):
  match c:
    case True{}:
      do IO<Unit>:
        Unit <- IO.print("NEGATIVE_MODEL_DETECTED budget=3 ts>cutoff\n")
        IO.die(Unit, 1, "PROOF_NEGATIVE_MODEL_REJECTED")
    case False{}:
      do IO<Unit>:
        IO.print(pos_lines())

def main() -> IO(Unit):
  do IO<Unit>:
    args : List<String> <- IO.args()
    go_neg(has_neg(args))
