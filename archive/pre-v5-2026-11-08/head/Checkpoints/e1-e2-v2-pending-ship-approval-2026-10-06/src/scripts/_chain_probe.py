import sys, os, datetime as dt
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import e2_engine as E

zones = [E.Zone(id=f"Z{i}", top=1.1000 + i * 0.01, bottom=1.0990 + i * 0.01,
                confluence=14 - i, zfp=55 - i * 5) for i in range(12)]
ch = E.forward_map(zones, 1.0, dt.date(2026, 10, 6))
print(f"  chain links: {len(ch.chain)}  cumulative {ch.cumulative():.1f}%")
for l in ch.chain:
    print(f"    {l.from_shape:4s} -> {l.to_shape:4s}  @ {l.trigger_zone_id} zfp={l.trigger_zone_zfp}  conf={l.confidence}")
    print(f"        {l.condition[:74]}")
print(f"  alternative: {len(ch.alternative)}")
for l in ch.alternative:
    print(f"    {l.from_shape} -> {l.to_shape} @ {l.trigger_zone_id}")
print(f"  phase: {ch.consolidation_phase}")
print(f"  anchors: {ch.anchor_zone_ids}")
print("  days:")
for d in ch.days:
    print(f"    {d['day']} {d['date']} {d['shape']:4s} bias={d['bias']:5s} zone={d['key_zone']:4s} conf={d['confidence']:.0f}%")