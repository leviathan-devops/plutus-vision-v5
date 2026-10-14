#!/usr/bin/env python3
"""pv_crossval.py — THE 5-WEEK CROSS-VALIDATION (the operator's litmus test, 2026-10-06).

For each of N random trading weeks in the last 6 months:
  1. REWIND: slice the local real 1H bars to the week's Monday (the input window).
  2. E1: build_levels(bars) + assemble(...) -> the institutional-pressure zones (the REAL
     deterministic derivation: prior-week pivots + MAs + round numbers, clustered).
  3. E2: momentum from the 20 bars before Monday -> forward_map(zones, mom, monday) -> the path.
  4. GROUND TRUTH: the week's OWN bars (the actual action, held back from the derivation).
  5. MEASURE: the E2 path's MAE vs the actual daily closes + the E1 zone relevance to the week.

NO fabrication: drives the real e1_extract.build_levels / e1_extract.assemble /
e2_engine.forward_map. The bars are the operator's real DXY 1H series (5000 bars).
"""
import json, sys, datetime as dt, pathlib, statistics, random

ROOT = pathlib.Path('/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION')
sys.path.insert(0, str(ROOT / 'scripts'))
import e1_extract
import e2_engine

DAY_MS = 86400000
BAR_SRC = json.load(open('/tmp/dxy-tv.json'))
BARS = BAR_SRC['bars'] if isinstance(BAR_SRC, dict) else BAR_SRC
BAR_A = [{'t': b['time'], 'o': b['open'], 'h': b['high'], 'l': b['low'], 'c': b['close']} for b in BARS]
BAR_A.sort(key=lambda b: b['t'])


def mon_ms(iso: str) -> int:
    d = dt.date.fromisoformat(iso)
    return int(dt.datetime(d.year, d.month, d.day, tzinfo=dt.timezone.utc).timestamp() * 1000)


def slice_upto(ms: int) -> list:
    return [b for b in BAR_A if b['t'] < ms]


def week_bars(iso: str) -> list:
    m = mon_ms(iso)
    f = m + 5 * DAY_MS
    return [b for b in BAR_A if m <= b['t'] < f]


def momentum(bars_before: list) -> float:
    recent = bars_before[-20:]
    if len(recent) < 20:
        return 0.0
    net = recent[-1]['c'] - recent[0]['o']
    tr = [b['h'] - b['l'] for b in recent]
    atr = sum(tr) / len(tr) if tr else 0.0
    if atr <= 0:
        return 0.0
    return max(-1.0, min(1.0, net / (atr * 2.0)))


def measure_week(iso: str) -> dict:
    m = mon_ms(iso)
    before = slice_upto(m)
    actual = week_bars(iso)
    rec = {'week': iso, 'bars_before': len(before), 'bars_actual': len(actual)}

    if len(before) < 210 or len(actual) < 5:
        rec['verdict'] = 'INSUFFICIENT_DATA'
        return rec

    spot = before[-1]['c']
    rec['spot_prev_close'] = round(spot, 5)

    # ── E1: the REAL deterministic derivation ──
    levels, notes = e1_extract.build_levels(before, 'DXY', iso)
    zones = e1_extract.assemble(levels, e1_extract.atr(before) or 0.0005, spot, "DXY", before)
    rec['levels'] = len(levels)
    rec['zones'] = len(zones)
    rec['zone_list'] = [{'name': z['name'], 'cat': z['zCat'], 'top': z['top'],
                         'bottom': z['bottom'], 'conf': z['confluence'], 'tf': z['timeframe']}
                        for z in zones]

    if not zones:
        rec['verdict'] = 'NO_ZONES'
        return rec

    # ── E2: the REAL engine ──
    mom = momentum(before)
    rec['momentum'] = round(mom, 4)
    zobjs = [e2_engine.Zone(id=z['name'], top=z['top'], bottom=z['bottom'],
                            confluence=z['confluence'], zfp=z['zfp'],
                            timeframe=z.get('timeframe', '1H'), bom='', reactions=0)
             for z in zones]
    monday = dt.date.fromisoformat(iso)
    chain = e2_engine.forward_map(zobjs, monday, spot=spot)
    if not chain.refusal:
        chain.days = e2_engine.day_decomposition(chain, zobjs, monday)
    rec['e2_refusal'] = chain.refusal or ''
    rec['e2_current'] = chain.current
    rec['e2_links'] = len(chain.chain)
    rec['e2_days'] = [{'day': d.get('day'), 'shape': d.get('shape'),
                       'conf': d.get('confidence', d.get('conf')),
                       'zone': d.get('key_zone', d.get('zone'))} for d in chain.days]

    # ── GROUND TRUTH: the actual daily closes of the target week ──
    daily = {}
    order = []
    for b in actual:
        dd = dt.datetime.fromtimestamp(b['t'] / 1000, dt.timezone.utc).date().isoformat()
        if dd not in daily:
            daily[dd] = {'o': b['o'], 'h': b['h'], 'l': b['l'], 'c': b['c']}
            order.append(dd)
        else:
            daily[dd]['h'] = max(daily[dd]['h'], b['h'])
            daily[dd]['l'] = min(daily[dd]['l'], b['l'])
            daily[dd]['c'] = b['c']
    actual_closes = [daily[d]['c'] for d in order]
    rec['actual_days'] = order
    rec['actual_closes'] = [round(c, 5) for c in actual_closes]
    rec['actual_hl'] = [round(daily[d]['l'], 5) for d in order] + [round(daily[d]['h'], 5) for d in order]
    rec['week_hi'] = round(max(b['h'] for b in actual), 5)
    rec['week_lo'] = round(min(b['l'] for b in actual), 5)

    # ── MEASURE 1: the E2 path MAE vs the actual closes ──
    zmap = {z['name']: z for z in zones}
    paired = []
    for i, d in enumerate(chain.days):
        z = zmap.get(d.get('key_zone', d.get('zone')))
        if z is None or i >= len(actual_closes):
            continue
        y = (z['top'] + z['bottom']) / 2.0
        paired.append((y, actual_closes[i]))
    if paired:
        mae = sum(abs(y - a) for y, a in paired) / len(paired)
        # the naive baseline: predict the prior close every day
        naive = sum(abs(spot - a) for _, a in paired) / len(paired)
        rec['e2_mae'] = round(mae, 5)
        rec['naive_mae'] = round(naive, 5)
        rec['beat_naive'] = mae <= naive
        rec['paired_days'] = len(paired)
    else:
        rec['e2_mae'] = None
        rec['note'] = 'no day anchored to a zone (Rule 1) — the path was not drawable'

    # ── MEASURE 2: the E1 zone relevance — did the week's action TOUCH the zones? ──
    touched = set()
    for b in actual:
        for z in zones:
            if b['l'] <= z['top'] and b['h'] >= z['bottom']:
                touched.add(z['name'])
    rec['zones_touched'] = sorted(touched)
    rec['zones_touched_n'] = len(touched)
    rec['zone_relevance'] = round(len(touched) / len(zones), 3) if zones else 0.0

    # ── MEASURE 3: the DIRECTION — the E2's own call (its CLASSIFICATION shape, zone-metric
    # per §6.4.1) vs the week's net move. The engine no longer reads momentum, so the
    # direction is the chain's opening shape: BS → up, WL → down, R/SS/WLS → range.
    net_actual = actual_closes[-1] - actual_closes[0]
    rec['net_actual'] = round(net_actual, 5)
    _cur = chain.current
    rec['e2_direction'] = ('up' if _cur in ('BS', 'PBS') else
                           'down' if _cur in ('WL', 'RWL', 'PWL', 'PRWL') else 'range')
    rec['actual_direction'] = 'up' if net_actual > 0.02 else 'down' if net_actual < -0.02 else 'flat'
    rec['direction_match'] = rec['e2_direction'] == rec['actual_direction']

    rec['verdict'] = 'MEASURED'
    return rec


def main():
    weeks = sys.argv[1:]
    if not weeks:
        # 5 random trading weeks in the last 6 months (Apr–Sep 2026)
        random.seed(7)
        pool = []
        d = dt.date(2026, 4, 6)          # a Monday
        while d <= dt.date(2026, 9, 28):
            pool.append(d.isoformat())
            d += dt.timedelta(days=7)
        weeks = sorted(random.sample(pool, 5))
    print(f"THE 5-WEEK CROSS-VALIDATION — {len(weeks)} weeks: {', '.join(weeks)}\n")
    results = []
    for w in weeks:
        r = measure_week(w)
        results.append(r)
        if r['verdict'] == 'MEASURED':
            print(f"  {w}  spot={r['spot_prev_close']}  zones={r['zones']} (touched "
                  f"{r['zones_touched_n']}={r['zone_relevance']:.0%})  E2 {r['e2_current']} "
                  f"links={r['e2_links']}  mom={r['momentum']}  MAE={r.get('e2_mae')} "
                  f"(naive {r.get('naive_mae')})  dir {r['e2_direction']}/{r['actual_direction']} "
                  f"{'✓' if r.get('direction_match') else '✗'}")
        else:
            print(f"  {w}  {r['verdict']}")
    out = ROOT / 'evidence' / 'crossval-5week.json'
    out.parent.mkdir(exist_ok=True)
    out.write_text(json.dumps({'weeks': weeks, 'results': results}, indent=1))
    print(f"\nwrote {out}")


if __name__ == '__main__':
    main()
