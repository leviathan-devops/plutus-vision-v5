live = [l for l in levels if abs(l["price"] - spot) <= CONFLUENCE_WINDOW]   # ±0.70
