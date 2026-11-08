# F3 · E2 — the shape chain, the boxes and the one line
## Surface
One box per chain link (rung to rung), one polyline from the anchor to the last rung, a day label per link.
## Contract
The chain is ≤5 links, strictly increasing in time, each link's shape ∈ its licensed set, and the line's vertices equal the links' box corners.
## Failure
A 2-vertex line; boxes not rung-to-rung; a link outside its licensed set; a day label on a forbidden day.
## Proof
G2: `len(chain) == len(boxes) == len(line.vertices)-1` · G1: line vertex count == links+1 · G4: `line_count == 1`.
