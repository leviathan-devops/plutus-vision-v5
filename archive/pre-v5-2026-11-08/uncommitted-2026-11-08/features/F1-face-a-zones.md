# F1 · Face A — the nine zones, their bands and labels
## Surface
The chart's zone layer: one box per pillar cluster, a colour by IP role, a ZFP band label.
## Contract
Every box carries a `zoneId`; every label renders `ZFP <n>` and the role name; no box without a receipt.
## Failure
A box with no receipt, a label reading a value the card does not contain, a role assigned by price order.
## Proof
`bash gates/gate.sh G1 <frame> <sha> <card>` rc=0 · G4 reads `zone_count` == len(card.zones) · G2 finds every receipt re-adding.
