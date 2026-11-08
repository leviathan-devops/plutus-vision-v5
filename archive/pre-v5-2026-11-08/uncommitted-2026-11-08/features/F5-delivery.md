# F5 · Delivery — the paste and the tab
## Surface
One TradingView input field holding the week card; the dashboard tab drawing the same card.
## Contract
The same card bytes produce the same drawing on both paths; an absent card prints `CARD: ABSENT` and draws face B only.
## Failure
Two different drawings from one card; a silent blank; a truncated card.
## Proof
G2: `sha(card)` identical on both paths · G1: the two frames are byte-identical after normalisation · G4: `CARD: ABSENT` present when the card is removed.
