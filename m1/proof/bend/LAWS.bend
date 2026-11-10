# LAWS.bend - P7.TURN-01 E1 conservation laws (the human owns this file).
# PROOF.bend proves each one; `bend PROOF.bend` refuses while any is open/false.
# Finite model: Nat seconds / price*1e5 / scores 0..14 / seq order / lids,
# levels list capped at 512 by the service normalizer (truncation audited).

import Base
import ./MODEL.bend as Model

# LAW 1 cutoff conservation: no evidence timestamp exceeds the cutoff.
law cutoff_ok:
  {(Model.all_ts_ok(5n, [Model.Level{3n, 100n, 12n, 1n, 1n}, Model.Level{5n, 101n, 10n, 2n, 2n}]), Model.all_ts_ok(5n, [Model.Level{9n, 100n, 12n, 1n, 1n}])) == (True{}, False{}) : Bool & Bool}

# LAW 2 level conservation: every input level survives (keep drops nothing).
law conserve_len:
  for xs: List<&2, Model.Level>
  {Model.len_keep(xs) == Model.len_all(xs) : Nat}

# LAW 3 score bounds: 12 holds, 15 is out of 0..14.
law scores_ok:
  {(Model.all_scores_ok([Model.Level{1n, 100n, 12n, 1n, 1n}]), Model.all_scores_ok([Model.Level{1n, 100n, 15n, 1n, 1n}])) == (True{}, False{}) : Bool & Bool}

# LAW 4 checkpoint order strictly increases: 1->2 holds, 2->1 does not.
law seq_ok:
  {(Model.seq_pair(Model.Level{1n, 100n, 12n, 1n, 1n}, Model.Level{1n, 100n, 12n, 2n, 1n}), Model.seq_pair(Model.Level{1n, 100n, 12n, 2n, 1n}, Model.Level{1n, 100n, 12n, 1n, 1n})) == (True{}, False{}) : Bool & Bool}

# LAW 5 work budget never exceeds two: 2 holds, 3 does not.
law budget_ok2:
  {(Model.budget_ok(2n), Model.budget_ok(3n)) == (True{}, False{}) : Bool & Bool}

# LAW 6 complete lock: COMPLETE advances only on operator unlock.
law lock_closed:
  for +u: Bool
  {Model.adv_go(Model.advance(Model.COMPLETE{}, u)) == u : Bool}
