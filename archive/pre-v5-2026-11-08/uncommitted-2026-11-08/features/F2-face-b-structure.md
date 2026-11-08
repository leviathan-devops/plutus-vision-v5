# F2 · Face B — order blocks, FVG, BOS, LQZ rails
## Surface
The structural layer drawn from bars alone: OB boxes, FVG double boxes, BOS lines, LQZ rails with a mitigation counter.
## Contract
Every shape traces to a bar index and a level id; rails are `#3E8A46` demand below and `#7F3613` supply above; the counter is Unmitigated→1x→2x→3x.
## Failure
A shape with no bar anchor; a rail on the wrong side; a counter that increments without a touch.
## Proof
G2: every face-B node carries `bar_index` and `level_id` · G1: the two rail hues are present in the frame.
