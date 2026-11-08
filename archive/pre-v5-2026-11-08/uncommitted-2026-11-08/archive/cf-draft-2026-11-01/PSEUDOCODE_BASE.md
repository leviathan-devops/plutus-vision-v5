# PLUTUS VISION — THE PSEUDOCODE BASE
## Every module, every branch, every error. No fallback anywhere.

---

# §0 · THE LAW OF THIS DOCUMENT

```
EVERY INPUT IS REQUIRED.
EVERY FAILURE IS A NAMED, TYPED ERROR THAT STOPS THE RUN.
THERE IS NO DEFAULT VALUE, NO COERCION, NO PROXY, NO SUBSTITUTE ARTIFACT,
NO "IF MISSING THEN COMPUTE IT ANOTHER WAY", AND NO CATCH-ALL.

The ONLY non-fatal outcomes are:
  · a legitimate empty result (a week with zero valid setups) — reported as 0 with a token
  · a recorded WARNING that does not change a value (clamp fired, cross-check conflict)
Both are written into the card and the ledger. Neither substitutes for a missing input.
```

**The polarity table (which outcome is which):**

| outcome | polarity | who consumes it |
|---|---|---|
| input absent / malformed / non-finite | FATAL | the workflow stops; no card |
| an invariant violated | FATAL | the workflow stops; no card |
| the judge unreachable | FATAL | no chain; no card |
| the judge's answer malformed | FATAL | no chain; no card |
| clamp fired | WARNING | the card records `raw` and `clamped: true` |
| ZFP cross-check conflict | FINDING | the card prints both numbers; a human/adjudication resolves |
| zero valid setups | RESULT | the card records `count: 0`, token `E3_NO_SETUPS` |
| a setup killed by a kill clause | RESULT | the ledger records the clause; the setup is not emitted |

---

# §1 · THE WORKFLOW — `pv_week(pair, week)`

```
FUNCTION pv_week(pair, week):
    anchor ← monday_0900_london(week)
    freeze ← prior_friday_close(week)
    REQUIRE freeze < anchor                       ELSE RAISE W0_FREEZE_AFTER_ANCHOR
    run ← db.insert_run(pair, week, anchor, freeze)        # idempotency: run:{pair}:{week}
    IF run.exists THEN RETURN seal.read(pair, week)        # the seal is the exactly-once point

    bars   ← MAP tf IN [4H,1H,30m] → harvest(pair, tf, freeze)   # raises W1_*
    opts   ← capture_and_extract_options(pair, week)             # raises W2_*
    cal    ← capture_and_extract_calendar(week)                  # raises W3_*

    zone_map ← e1_build(pair, week, anchor, bars, opts, cal)     # raises E1_*
    chain    ← e2_chain(zone_map, bars[1H], cal, e1.DEFS, e2.CAL)# raises E2_*
    setups   ← e3_setups(chain, zone_map, bars, e3.CAL)          # raises E3_* or returns []

    card ← build_card(pair, week, anchor, bars, opts, cal, zone_map, chain, setups)
    l4_verify(card, setups)                                      # a GUARD: raises G_*, returns nothing
    REQUIRE sha(card) == card.sha                                ELSE RAISE CARD_SHA_MISMATCH
    seal.write_once(pair, week, card)                            # raises CARD_SEAL_CONFLICT
    r2.put(card_key(pair, week), card)
    db.insert_emit(pair, week, sha(card))
    RETURN card
```

**Step idempotency is not optional:** each step writes to a content-addressed key, so a retry
either reproduces the same bytes or stops on a mismatch (`W1_CONTENT_MISMATCH`).

---

# §2 · L0 — CAPTURE AND EXTRACTION

## §2.1 · Bars

```
FUNCTION harvest(pair, tf, freeze):
    rows ← source.fetch(pair, tf, lookback(tf), until=freeze)
    IF rows is empty                    THEN RAISE W1_BARS_ABSENT
    IF rows[-1].ts > freeze             THEN RAISE W1_LOOKAHEAD: rows[-1].ts > freeze
    IF NOT monotonic(rows.ts)           THEN RAISE W1_BARS_UNORDERED
    IF any(NOT finite(b.open/high/low/close) FOR b IN rows) THEN RAISE W1_BARS_INVALID
    IF any(b.high < max(b.open,b.close) OR b.low > min(b.open,b.close) FOR b IN rows)
                                        THEN RAISE W1_BARS_INVALID: OHLC
    IF run.step(S1).key EXISTS AND sha256(rows) != run.step(S1).key
                                        THEN RAISE W1_CONTENT_MISMATCH
    IF tf == "4H" AND len(rows) < 200   THEN RAISE W1_4H_SHORT: len
    IF tf == "1H" AND len(rows) < 300   THEN RAISE W1_1H_SHORT: len
    RETURN rows
```

**`W1_4H_SHORT` is fatal on purpose.** E1's confluence and POI tier are functions of 4H overlap;
a short 4H series produces a different, weaker zone map. It is not substituted; it stops the run.

## §2.2 · Options capture + Clairic + invariants

```
FUNCTION capture_and_extract_options(pair, week):
    png ← browser.render(INVESTING_LIVE_URL, week, viewport, wait_for_selector)
    IF png is empty                     THEN RAISE W2_CAPTURE_EMPTY
    IF png.sha IN known_bad_captures    THEN RAISE W2_CAPTURE_KNOWN_BAD
    r2.put(capture_key(week), png)

    ans ← clairic.run(@cf/cloudflare/clairic,
                      state=OPTIONS_STATE(pair, week),
                      images=[png], reference_date=week.start,
                      fields=OPTIONS_FIELDS)                  # §4.2 of the blueprint
    IF ans.truncated                    THEN RAISE W2_EXTRACT_TRUNCATED
    REQUIRE_ALL(ans.answers, OPTIONS_FIELDS.keys)             # raises W2_FIELD_ABSENT

    FOR f IN OPTIONS_FIELDS:
        IF ans.answers[f].p_null is None THEN RAISE W2_NO_PNULL: f
        IF ans.answers[f].p_null > 0.50  THEN RAISE W2_INCONCLUSIVE: f
    kept ← {strikes: [], notionals_b: [], open_interest: []}
    FOR i, strike IN ENUMERATE(ans.answers.strikes):
        IF strike.p_null > 0.05 THEN ledger.drop("strike", i, strike); CONTINUE
        kept.strikes.APPEND(strike.value)
        kept.notionals_b.APPEND(ans.answers.notionals_b[i].value)
        kept.open_interest.APPEND(ans.answers.open_interest[i].value)   # null allowed
    IF len(kept.strikes) == 0            THEN RAISE W2_NO_STRIKES
    ASSERT len(kept.strikes) == len(kept.notionals_b) == len(kept.open_interest)  # I1 still holds

    INVARIANTS:                                                # all fatal
      I1 len(strikes) == len(notionals_b) == len(open_interest) ELSE RAISE W2_I1_ALIGNMENT
      I2 all(0 < n < 500 FOR n IN notionals_b)                  ELSE RAISE W2_I2_UNITS
      I3 all(|s - spot| <= spot*0.15 FOR s IN strikes)           ELSE RAISE W2_I3_DOMAIN
      I4 week.start <= expiry <= week.end AND cut <= fri_1600_ny ELSE RAISE W2_I4_WINDOW
      I5 printed_total is None OR |total - sum(notionals_b)| <= 0.02*sum(notionals_b)
                                                                ELSE RAISE W2_I5_TOTAL
    RETURN walls{strikes: kept.strikes, notionals_b: kept.notionals_b,
                 oi: kept.open_interest, expiry, cut, capture_sha, field_provenance}
```

**`I5` has no "skip when the total is absent" branch** — the field is declared in the schema, so a
null total is `W2_INCONCLUSIVE:printed_total_b`, not a silent pass.

## §2.3 · Calendar — the same shape

```
FUNCTION capture_and_extract_calendar(week):
    png ← browser.render(CALENDAR_URL, week)  ELSE RAISE W3_CAPTURE_EMPTY
    ans ← clairic.run(..., fields=CALENDAR_FIELDS)
    REQUIRE_ALL; p_null <= 0.50 per field; I1 equal lengths; I2 dates parse; I3 currency known
    RETURN events[{ts, currency, impact, side}]      # side ∈ {up,down,unclear} — required
```

---

# §3 · E1 — THE ZONES

```
FUNCTION e1_build(pair, week, anchor, bars, opts, cal):
    spot ← bars["1H"][-1].close
    levels ← []
    FOR tf IN ["4H","1H","30m"]:
        levels += pivots(bars[tf])                  # confirmed swings (2-bar fractal)
        levels += round_numbers(range(bars[tf]), grid=round_grid(pair))
        levels += [ema(bars[tf].close, 200).last]
        levels += prior_day_levels(bars[tf])
        levels += session_extremes(bars[tf])
        levels += order_blocks(bars[tf])             # last opposite close before the impulse
        levels += equal_levels(bars[tf], tol=tol(pair))
    IF levels is empty THEN RAISE E1_NO_LEVELS

    clusters ← cluster(levels, tol(pair))            # tol = spot*4e-5 (~0.004 at 100)
    zones ← []
    FOR c IN clusters:
        pillars  ← distinct(level.type FOR level IN c.members)
        conf     ← confluence(c, pillars)            # §3.1
        degree   ← degree_of(conf)                   # the Pillar-9 table
        notional ← nearest_wall(opts, c.mid)         # the SAME week's ladder, or null
        opt      ← {notional_b: notional, expiry_ts: opts.expiry,
                    strike_range_pct: STRIKE_RANGE[pair]}
        z        ← {id, top, bottom, mid, width, pillars, confluence: conf, degree,
                    direction: sign(c.mid - spot), confluent: conf >= 8,
                    structural_memory: bool(c.pillars ∩ STRUCTURAL),
                    reaction_count: count_mitigations(c, bars),
                    bom_mom: classify_bom(c, bars)}
        z.receipt ← zfp.compute(z, e1_context(pair, spot, opt, cal, bars, c, zones_so_far), week)
        z.zfp       ← z.receipt.zfp          # THE INTEGER. Consumers never see the dict.
        z.poi_tier  ← poi_tier(z, bars["4H"])
        zones.APPEND(z)

    IF zones is empty THEN RAISE E1_NO_ZONES
    roles ← assign_ip_roles(zones, spot)             # exactly 5, by position; ELSE RAISE E1_ROLE_COUNT
    faceB ← face_b(bars, zones)                      # OB/FVG/BOS/LQZ + mitigation counters
    verify_zone_invariants(zones)                    # §3.2 — all fatal
    RETURN {zones, roles, faceB, ladder: build_ladder(zones), anchor, spot}
```

## §3.0 · `e1_context` — the ZFP caller's contract, every key explicit

```
FUNCTION e1_context(pair, spot, opt, cal, bars, cluster, zones_so_far) -> Ctx:
    # Every key below is REQUIRED by zfp.compute. A missing key is a named ZFP_INPUT_MISSING.
    m ← momentum(bars["1H"], cluster)      # {roc5, atr20, toward}
    IF m.roc5 is null OR m.atr20 is null OR m.toward is null THEN RAISE E1_MOMENTUM_UNBUILT
    xp ← cross_pair_zones(pairs, cluster)  # {zone_mids: {pair:[mids]}, tol}
    cs ← prior_failures(cluster, zones_so_far)   # {prior_failures:[{zfp,direction}]}
    rg ← regime_state(bars["1H"], week)    # {ema200_crossed_this_week: bool}
    RETURN {pair, spot,
            opt: {notional_b: nearest_wall(opt, cluster.mid),   # may be 0 (no wall) — not null
                  expiry_ts: opt.expiry, strike_range_pct: STRIKE_RANGE[pair]},
            calendar: {events: cal.events},                     # each with ts/currency/impact/side
            momentum: m, cross_pair: xp, cascade: cs, regime: rg}

FUNCTION nearest_wall(opts, mid):
    # The nearest printed strike to the zone mid. NO WALL -> notional_b = 0.0 (a real value:
    # the canon's "no option wall" tier), never null and never a guessed wall.
    IF opts.strikes is empty THEN RAISE W2_NO_STRIKES
    RETURN opts.notionals_b[argmin(|s - mid| FOR s IN opts.strikes)]
```

## §3.1 · Confluence, degree, roles — exact

```
FUNCTION confluence(cluster, pillars):
    score ← len(pillars)                            # 1 per distinct pillar
    score += min(1.0, 0.5 * (len(cluster.members) - len(pillars)))
    IF cluster.is_weekly_swing THEN score += 2
    ELIF cluster.is_daily_swing THEN score += 1
    IF cluster.mitigated THEN score -= 1
    IF score < 0 OR score > 14 THEN RAISE E1_CONFLUENCE_OUT_OF_RANGE: score
    RETURN score                       # may be fractional (x.0 or x.5). Not clamped.

FUNCTION degree_of(conf):
    # A TOTAL function over [0,14]. The canon's buckets are integers; the bucket of a
    # fractional score is its INTEGER PART (floor). This is a definition, not a coercion:
    # 3.5 and 3.0 are both LIGHT because the bucket is "0..3".
    i ← floor(conf)
    IF conf < 0 OR conf > 14 THEN RAISE E1_CONFLUENCE_OUT_OF_RANGE: conf
    12..14 → EXTREME | 10..11 → HEAVY | 8..9 → MODERATE-HEAVY
    6..7   → MODERATE | 4..5 → LIGHT | 0..3 → MINIMAL

FUNCTION assign_ip_roles(zones, spot):
    equilibrium ← zone with the highest confluence within +/-0.5*range of spot
    ceiling     ← highest-confluence zone above equilibrium
    ksb         ← highest-confluence zone below equilibrium
    upper       ← highest-confluence zone between equilibrium and ceiling
    mid_support ← highest-confluence zone between ksb and equilibrium
    IF any is null THEN RAISE E1_ROLE_MISSING
    RETURN the five, each with its zone id
```

## §3.2 · The zone invariants (E1's own gate)

```
INV-E1-1  every zone has a receipt (base + six modifiers + gate strings)   ELSE E1_NO_RECEIPT
INV-E1-2  every role resolves to a zone id present in `zones`              ELSE E1_ROLE_DANGLING
INV-E1-3  stdev(zone.zfp) >= 1.0 across the week's zones                   ELSE E1_ZFP_FLAT
INV-E1-4  no zone's ZFP changes when its width is perturbed +/-50%         ELSE E1_ZFP_GEOMETRY
INV-E1-5  every zone's ZFP lies in 0..99 and its raw is recorded           ELSE E1_ZFP_RANGE
INV-E1-6  |zfp_rank - degree_rank| <= 1, or the conflict is recorded       ELSE (finding only)
INV-E1-7  (REPLAY GATE — P5, not the week) the zone count is not constant across the
          10 held-out weeks                                              ELSE E1_CONSTANT_COUNT
          A per-week call cannot evaluate this. Running it here would be a check that
          cannot fail, which is the class INV-E1-7 exists to prevent.
```

---

# §3.3 · THE E1 SEMANTIC ATTESTATION — the one place a judge belongs

**The judge cannot validate arithmetic. It CAN attest the two semantic premises the arithmetic
rests on.** Two questions per zone, one request (8 zones x 2 = 16 <= 64).

```
state = {
  zones: [{id, top, bottom, pillars: [{type, price, tf}], confluence, degree,
           bom_mom, reaction_count}],
  evidence: {round: [prices], ema200: [...], weekly_swing: [...], ob_4h: [...],
             daily_liquidity: [...], cluster: [...], intraday_swing: [...],
             minor: [...], institutional: [...]},
  bars_summary: [{ts, o, h, l, c}]          # the prior week only, never the target week
}

Q1  noul  "Does every entry in `zone.pillars` name a type whose `evidence[type]` contains at
           least one level inside [zone.bottom, zone.top]?"
    true  = every claimed pillar is backed by an in-range level of that type
    false = at least one claimed pillar has no in-range level of its type

Q2  noul  "Is `zone.bom_mom` supported by the bars — did price leave this zone and return
           (MoM), or is price leaving it for the first time (BoM)?"
    true  = the bars show the stated history
    false = the bars show the other history, or neither
```

**The veto rules (no fallback, no guess):**

```
Q1 < 0.80  -> the zone is DROPPED (it is not emitted), token E1_PILLAR_ATTESTATION_FAILED.
              If fewer than 5 zones survive -> RAISE E1_TOO_FEW_ZONES (fatal).
              A dropped zone is a REFUSAL, never a fabricated replacement.
Q2 < 0.80  -> zone.bom_mom := "UNATTESTED". The ZFP does not use BoM, so the ZFP is unaffected.
              The confidence composite is computed WITHOUT the BoM term (0, never +/-10),
              the setup's max tier becomes HIGH, and the card records
              bom_mom: "UNATTESTED". This is a refusal to award a bonus, not a default.
```

**Why this is the only judge in E1:** every other E1 fact is arithmetic over declared inputs, and
a model asked to "check the maths" would return a plausible number with no relation to the
computation. Attestation is the one question the arithmetic cannot answer: *is this label backed
by the evidence it names?*

# §3.4 · WHO VALIDATES CLAIRIC — and why its own confidence is not the answer

```
Clairic's p_null and confidence are INPUTS TO A GATE, never the gate itself.
A model that says "0.99 confident" and is wrong passes its own test by construction.

The validators, in order:
  1  the five cross-field invariants (I1-I5)        — geometry, units, domain, window, total
  2  a PLANTED-NULL control                        — a field the image does not contain must
                                                     return value=null. If it returns a value,
                                                     the extractor is blind and the run is VOID.
  3  a PLANTED-VALUE control                      — a known strike/notional inserted into the
                                                     fixture image must be read back exactly.
  4  the span check                                — a text value with no span is not from the
                                                     input; it is a generation. FATAL.
  5  the bounds check                              — a number outside its declared [min,max] is
                                                     a decode error, not a data point. FATAL.
  6  the E1 attestation (S3.3)                     — the semantic premise, not the number.

The controls (2) and (3) run on EVERY capture, not once at build time. A capture that passes
them and then fails an invariant is a data problem; a capture that fails a control is a MODEL
problem, and the run is VOID rather than degraded.
```

# §4 · E2 — THE SHAPE CHAIN, IN PRODUCTION

## §4.1 · What E2 actually is

**E2 is a deterministic chain built by code, then falsified by a model.** The model does not
choose the chain. Code generates the candidate set from E1's zones, ranks it with the
ZFP-conditioned table, walks it with the transition table, and then asks Clef to *veto*
individual candidates. A veto removes a leg; the walk is then re-run over the survivors. The
model's only power is subtraction.

```
      E1 zone map ──► spans ──► anatomy ──► ZFP band ──► priority rank
                                                            │
                                               keep <= 8 ───┤
                                                            ▼
                                          ONE Clef request: 5 x N + 2 questions
                                                            │
                          ┌─────────────────────────────────┤
                          ▼                                 ▼
                 per-candidate vetoes               chain-level attestation
                 (A1,A3,A4,A5,A6)                   (B1 ordering, B2 energy)
                          │                                 │
                          └──────────► code re-walks ◄───────┘
                                          │
                                          ▼
                             chain + day skeleton + alternative
```

## §4.2 · The production function

```
FUNCTION e2_chain(zone_map, bars_1h, calendar, defs, cal) -> Chain:
    REQUIRE zone_map.anchor > bars_1h[-1].ts          ELSE RAISE E2_LOOKAHEAD
    ladder ← zone_map.ladder                          # tested rungs only
    spans  ← segment(bars_1h, ladder)                 # §4.3
    IF spans is empty                THEN RAISE E2_NO_SPANS

    cands ← []
    FOR s IN spans:
        a  ← anatomy(s, bars_1h)                       # §4.3
        tz ← target_zone(s, zone_map)                  # the zone the span approaches
        IF tz is null THEN CONTINUE                    # no zone -> not shapable; not an error
        prio ← priority_row(a, band_of(tz.zfp))        # §4.4, rows 1..6
        IF prio is null THEN CONTINUE                  # no matrix row -> not a candidate
        cands.APPEND({span: s, anatomy: a, target: tz, band: band_of(tz.zfp),
                      priority: prio, direction: sign(s.end_price - s.start_price)})
    IF cands is empty                THEN RAISE E2_NO_CANDIDATES

    cands ← SORT(cands, BY priority ASC, THEN target.zfp ASC, THEN span.start ASC)
    keep  ← cands[0:8]                                 # the 64-question budget
    state ← freeze_state(zone_map, keep, defs, calendar)   # §4.5 — evidence only
    IF tokens(state) > 20000 THEN RAISE E2_STATE_TOO_LARGE: tokens(state)
    q     ← Q_E2(keep)                                 # 5*N + 2 <= 42
    ans   ← TRY clef.ask(model="clef", state=state, questions=q)
            CATCH transport, timeout, http AS e → RAISE E2_JUDGE_DOWN: e
    validate_answers(ans, q)                           # §4.6 — all ids, all ranges

    FOR c IN keep:
        c.p       ← MIN(ans[c.id]["A1"], ans[c.id]["A3"], ans[c.id]["A4"],
                        ans[c.id]["A5"], ans[c.id]["A6"])
        c.vetoed  ← c.p < cal.act_candidate
    survivors ← [c FOR c IN keep IF NOT c.vetoed]
    IF survivors is empty            THEN RAISE E2_ALL_FALSIFIED

    IF ans.chain["B1_DECISION_ZONE"] < cal.act_decision_zone THEN
        chain.alt ← alternative(chain, zone_map, cal, exclude=chain.alt.decision_zone)
        IF chain.alt is null THEN RAISE E2_ALTERNATIVE_INVALID
        IF ans.chain["B1_DECISION_ZONE"] < cal.flag_decision_zone THEN
            RAISE E2_ALTERNATIVE_INVALID: both candidates below the flag
    chain ← walk(survivors, cal)                       # §4.7 — deterministic
    IF chain is empty                THEN RAISE E2_WALK_EMPTY
    IF ans.chain["B2"] <= 1:                           # energy: significant leak / broken
        chain ← chain[0:-1]
        IF chain is empty            THEN RAISE E2_ENERGY_VETO
    chain.days   ← assign_days(chain, calendar, cal)   # §4.8
    chain.alt    ← alternative(chain, zone_map, cal)   # §4.9
    chain.conf   ← MIN(link.confidence FOR link IN chain)
    RETURN chain
```

## §4.3 · Span segmentation and anatomy — deterministic

```
FUNCTION segment(bars, ladder):
    spans ← []
    i ← 0
    WHILE i < len(bars):
        dir ← None
        j ← i
        WHILE j+1 < len(bars) AND sign(bars[j+1].close - bars[j].close) == dir_if_set:
            ...
        # a span ends when price crosses a ladder rung AND the direction changes
        IF crosses_rung(bars, i, j) THEN spans.APPEND(span(i,j)) ; i ← j
        ELSE i ← i + 1
    RETURN merge_adjacent(spans)

FUNCTION anatomy(s, bars):
    body  ← [ABS(b.close-b.open) FOR b IN s.bars]
    rng   ← [b.high-b.low FOR b IN s.bars]
    RETURN {candles: len(s.bars),
            body_frac: mean(body)/max(mean(rng), EPS),
            range_ratio: mean(rng)/median_rng(bars, lookback=200),
            wick_up: mean(b.high-max(b.open,b.close)) / max(mean(rng),EPS),
            wick_dn: mean(min(b.open,b.close)-b.low) / max(mean(rng),EPS),
            colour: dominant_direction(s.bars)}
```

## §4.4 · The priority table — ZFP first, never momentum

```
FUNCTION priority_row(anatomy, band):
    IF band == ">45" AND confirms_15m(...)        THEN RETURN 1   # BS / PBS
    IF band == "<20" AND pierce_and_reject(...)   THEN RETURN 2   # WL / PWL
    IF band IN ("20-40") AND duration < 1 session THEN RETURN 3   # R / RS
    IF zones_in_band(0.30..0.50) >= 3 AND atr_ratio > 2.0 THEN RETURN 4  # WLS
    IF band == "<30" AND bodies < 0.30 AND range_ratio < 0.5  THEN RETURN 5  # SS
    IF after_BS AND reversal >= 1.2*bs_range AND hard_wall_above THEN RETURN 6  # RWL/PRWL
    RETURN null                                    # no row -> NOT a candidate
```

## §4.5 · The E2 state — every field is evidence, none is an instruction

```
state = {
  week, pair, anchor,
  zone_map: [{id, role, top, bottom, confluence, degree, zfp, band, reaction_count,
              bom_mom, poi_tier, tested}],
  candidates: [{id, claimed_shape, start_ts, end_ts, direction, target_zone,
                anatomy:{candles, body_frac, range_ratio, wick_up, wick_dn, colour},
                prev_shape}],
  shape_definitions: DEFS,          # the 10 anatomy definitions, verbatim from the canon
  zf_bands: BANDS,                  # <20 / 20-30 / 20-40 / 30-45 / >45 / >60 / >80
  generated_chain: [ids],
  energy_budget: {weekly_range, atr20, leg_budget},
  calendar_days: {Mon: continuation|new_shape, ...}
}
```

**Size bound:** 8 candidates × ~120 tok + zone map ~900 tok + definitions ~800 tok ≈ 2.6k tokens.
Far below clef-flash's 24,576. The bound is asserted before the call:
`IF tokens(state) > 20000 THEN RAISE E2_STATE_TOO_LARGE`.

## §4.6 · Answer validation — the judge cannot return garbage

```
FUNCTION validate_answers(ans, q):
    IF ans is null                            THEN RAISE E2_JUDGE_MALFORMED: null
    IF set(ans.answers) != set(q.ids)         THEN RAISE E2_JUDGE_MALFORMED: id set
    FOR id IN q.ids:
        a ← ans.answers[id]
        IF a.type != q[id].type               THEN RAISE E2_JUDGE_MALFORMED: type
        IF a.type == "noul":
            IF NOT (0.0 <= a.noul <= 1.0)     THEN RAISE E2_JUDGE_MALFORMED: range
        IF a.type == "score":
            IF a.score < 0 OR a.score > len(q[id].criteria)-1
                                              THEN RAISE E2_JUDGE_MALFORMED: score range
            IF abs(sum(a.probabilities.values()) - 1.0) > 1e-6
                                              THEN RAISE E2_JUDGE_MALFORMED: distribution
        IF a.type NOT IN ("noul","choice","score") THEN RAISE E2_JUDGE_MALFORMED: unknown type
```

## §4.7 · The walk — the transition table, exactly

```
FUNCTION walk(survivors, cal):
    chain ← [survivors[0]]
    WHILE len(chain) < 5:
        cur ← chain[-1]
        IF cur.target.zfp < 20 AND cur.target.role == "HARD_WALL" THEN BREAK   # a wall terminates
        IF MIN(l.confidence FOR l IN chain) < 0.25 THEN BREAK                 # cumulative floor
        nxt ← FIRST s IN survivors SUCH THAT s.start > cur.start
                  AND s NOT IN chain
                  AND transition(cur.shape, s.target.zfp) == s.shape
        IF nxt is null THEN BREAK
        chain.APPEND(nxt)
    verify_chain_order(chain)
    RETURN chain

FUNCTION verify_chain_order(chain):
    # E2-C8. The ORDERING invariant is code's, not a model's. A model asked to confirm an
    # order the code just produced can only say yes — that question cannot fail, so it is
    # not asked (it was B1 in v2.0 and the audit killed it).
    FOR i IN 1..len(chain)-1:
        IF chain[i].start <= chain[i-1].start THEN RAISE E2_CHAIN_ORDER: i
        IF chain[i] IN chain[0:i]              THEN RAISE E2_CHAIN_CYCLE: i
        IF chain[i].target.zfp < 20 AND chain[i-1].target.role == "HARD_WALL"
                                               THEN RAISE E2_CHAIN_PAST_WALL: i
    RETURN
```

`transition(current, zfp)` is the canon's §5.3 table, encoded as data:
`BS + <20 → RWL`, `BS + 20-40 → R`, `BS + >60 → PBS`, `BS + >80 → PBS(strong)`,
`SS + >45 → BS`, `SS + <30 → SS`, `WLS + any break → BS`, `R + >1 session → SS`,
`R + <1 session → WL/RWL`, `WL + opposite momentum → RWL`, `WL + none → SS`.

## §4.8 · Day assignment — deterministic, calendar-aware

```
FUNCTION assign_days(chain, calendar, cal):
    budget ← DAY_SHAPE_BUDGET[chain[0].shape]      # e.g. BS: [0,0,1,1,1]
    FOR link, i IN chain:
        day ← next day in Mon..Fri where budget[day] > 0
              AND calendar[day] is compatible with link.shape
              AND no red-folder event invalidates it
        IF day is null THEN RAISE E2_DAY_ASSIGNMENT_FAILED
        link.day ← day
    RETURN chain
```

## §4.9 · The alternative — a chain that can be wrong

```
FUNCTION alternative(chain, zone_map, cal):
    decision ← the zone in chain whose zfp sits nearest a band boundary
    flip     ← the boundary value
    alt      ← walk(chain.candidates, with decision.zfp forced to the other side of flip)
    IF alt == chain THEN RETURN null                # not an error: report "no alternative"
    RETURN {decision_zone: decision.id, flip_at: flip, chain: alt}
```

---

# §5 · E3 — THE TRADE SETUPS

```
FUNCTION e3_setups(chain, zone_map, bars, cal):
    setups ← []
    FOR day IN chain.days:
        universe ← UNIVERSE[day.shape]                       # the 12-row matrix
        FOR anchor IN anchors(day, universe, zone_map):      # 1H/30m/15m edges ONLY
            s ← geometry(anchor, day, zone_map)              # §5.1
            kill ← kill_clauses(s, zone_map, chain, cal)     # §5.2
            IF kill THEN ledger.refuse(s, kill) ; CONTINUE
            s.confidence ← composite(s, zone_map)            # §5.3
            s.tier       ← tier_of(s)                        # §5.3
            setups.APPEND(s)
    setups ← dedupe(setups)
    setups ← cap_daily(setups, 3)
    setups ← SORT(setups, BY confidence DESC)
    cands  ← setups[0:8]
    IF cands is empty THEN RETURN {setups: [], token: "E3_NO_SETUPS"}   # legitimate

    state ← freeze_e3(chain, zone_map, cands)
    q     ← Q_E3(cands)                                   # 7*N <= 56
    ans   ← TRY clef.ask(model="clef", state=state, questions=q)
            CATCH transport, timeout, http AS e → RAISE E3_JUDGE_DOWN: e
    validate_answers(ans, q)                              # same contract, E3_JUDGE_MALFORMED

    FOR s IN cands:
        s.p     ← MIN(ans[s.id][q] FOR q IN REQUIRED_NOUL)
        s.score ← ans[s.id]["S7"]
        IF ans[s.id]["E3-2"] < 0.8 THEN ledger.refuse(s, "SL_NOT_SURVIVABLE") ; CONTINUE
        IF ans[s.id]["E3-5"] > 0.8 THEN ledger.refuse(s, "DUPLICATE") ; CONTINUE
        IF s.score < 2            THEN ledger.refuse(s, "PROBABILITY_LOW") ; CONTINUE
        s.route ← ladder(s.p, cal.act_e3, cal.flag_e3)     # EMIT | HOLD | DISCARD
    emitted ← [s FOR s IN cands IF s.route == EMIT]
    emitted ← evict(emitted, weekly=8, daily=3)            # evict the weakest
    IF emitted is empty THEN RETURN {setups: [], token: "E3_NO_SETUPS"}
    RETURN {setups: emitted}
```

## §5.1 · Geometry — the only four numbers E3 owns

```
FUNCTION geometry(anchor, day, zone_map):
    z ← zone_map.zone(anchor.zone_id)
    IF anchor.tf NOT IN ("1H","30m","15m") THEN RAISE E3_ANCHOR_TF_INVALID
    entry ← anchor.tf_edge_price(z)                       # top for a short, bottom for a long
    sl    ← opposite_edge(z) -/+ buffer(pair)             # 2..5 pips
    tp    ← nearest_opposing_zone(zone_map, entry, day.direction, path=day.path)
    IF tp is null THEN RAISE E3_TP_NULL                   # no fabricated target
    rrr   ← ABS(tp-entry)/ABS(entry-sl)
    RETURN {entry, sl, tp, rrr, anchor_zone: z.id, direction, day, session}
```

## §5.2 · The nine kill clauses — code, before any model

```
K1  rrr < 2.5                                        → RRR_BELOW_FLOOR
K2  confidence < 65                                  → CONFIDENCE_BELOW_GATE
K3  tier not in {GOD_TIER, HIGH}                     → TIER_NOT_EMITTABLE
K4  day count already 3                              → DAILY_CAP
K5  week count already 8                             → WEEKLY_CAP
K6  setup.day != chain.day_of(anchor.shape_day)      → DAY_MISMATCH
K7  anchor edge type not valid for the category      → ANCHOR_TYPE_INVALID
K8  sl buffer outside 2..5 pips                      → SL_BUFFER_INVALID
K9  tp not an opposing zone on the path              → TP_NOT_ON_PATH
K10 identity already emitted                          → DUPLICATE
```

## §5.3 · Confidence and tier — the operator's composite

```
conf = (confluence/12)*40 + (notional_b/3.5)*20 + 20
     + (red_folder ? 10 : 0) + (1 - zfp/100)*10 + bom_mom_bonus   # +/-10
conf = min(110, conf); conf = min(100, conf)
IF conf > 110 THEN RAISE E3_CONFIDENCE_OUT_OF_RANGE

GOD_TIER  IF conf >= 90 AND rrr >= 3.0
HIGH      IF conf >= 80 AND rrr >= 2.5
STANDARD  IF conf >= 65 AND rrr >= 2.0     # calibration only; NEVER emitted
ELSE      REJECT
```

---

# §6 · L4 — THE GATES

```
FUNCTION l4_verify(card, setups):
    subject_sha ← sha(frame_png_in_this_turn)
    IF subject_sha != card.frame_sha THEN RAISE G_STALE_SUBJECT

    g1 ← chart_validator(frame_png)                       # 20 pixel checks
    g2 ← structural(card, pine_source)                    # receipts, ancestry, stubs, literals
    g3 ← clef.ask(state=card_digest, questions=Q_G3)      # mandate_met, claim_contradicted
    g4 ← clairic.run(state=frame_labels, images=[frame_png], fields=FRAME_FIELDS)
    ctl ← control_run(bad_frame_png)                      # MUST fail
    IF ctl.g4_bands > 0 THEN RAISE G_CONTROL_VOID
    IF ctl.g3_claim < act THEN RAISE G_CONTROL_VOID

    IF g1.critical OR g2.critical           THEN RAISE G_CRITICAL
    IF g3.claim_contradicted >= act         THEN RAISE G_CLAIM_CONTRADICTION
    IF g3.mandate_met < act                 THEN RAISE G_MANDATE_FAILED
    IF disagree(g1,v2,g3,g4)                THEN RAISE G_DISAGREE
    RETURN PASS
```

---

# §7 · THE CARD

```
FUNCTION build_card(...):
    card ← {schema, meta, nodes, edges, refusals, count, journal_seed}
    FOR z IN zone_map.zones:
        card.nodes.APPEND(node("zone.ip", spec=z, receipt=z.zfp_receipt))
    FOR link IN chain:  card.nodes.APPEND(node("shape.span", spec=link, clef=link.answers))
    FOR s IN setups:    card.nodes.APPEND(node("setup.trade", spec=s, clef=s.answers))
    FOR r IN refusals:  card.refusals.APPEND(r)
    assert_provenance(card)        # no shape/span/setup inside provenance -> CARD_BAKED_PAYLOAD
    IF tokens(card) > 3500 THEN RAISE CARD_OVERFLOW
    RETURN card
```

---

# §8 · THE PINE KERNEL

```
//@version=6
indicator("PLUTUS VISION", overlay=true, max_boxes_count=500, max_lines_count=500)

raw = input.string("", "Week Card")
card = parse(raw)
IF card == null
    draw_standalone_from_bars()                  // face B + bars-only chain
    label.new(bar_index, high, "CARD: ABSENT — FACE A OMITTED")
ELSE
    FOR node IN card.nodes
        verdict = cast(node)                     // resolves against card edges + computed chain
        IF verdict == FAIL
            CONTINUE                             // nothing renders for that node
        draw(node)
```

**The cast:** a setup node resolves iff `entry_zone` and `shape_from` exist in THIS card, the zone
carries a receipt, and the named shape exists in the kernel's computed chain. Unresolved → FAIL →
nothing renders for that node → the refusal is printed in the table.

---

# §9 · WHO AUDITS WHOM — the zero-trust map

| the thing | its auditor | the auditor's own control |
|---|---|---|
| bars | lookahead + monotonicity + length | a fixture with a planted future bar must fail |
| the options capture | sha + known-bad capture list | a stale PNG must be rejected |
| Clairic's read | I1–I5 + p_null + a planted-null field | the planted null must return null |
| the tier | the truth-table recompute | a mis-tiered zone must diverge |
| the ZFP arithmetic | the independent recompute | a tampered receipt must diverge |
| the ZFP *model* | calibration (Brier, skill, AUC, monotone, shuffled) | the shuffled run must collapse |
| the pillar set | a Clef attestation noul per zone | a zone with a fabricated pillar must fail |
| the E2 chain | Clef vetoes + the ordering noul | a momentum-ordered chain must fail B1 |
| the E3 setup | Clef clauses + 10 code kill clauses | an inverted SL/TP must invert the hit test |
| the render | G1 pixels + G4 label read | the slab must return zero bands |
| the claim | G3 + the control | a false "delivered" must score claim_contradicted high |
| the whole week | the 10-week replay | a hardcoded build must diverge |

**No component is trusted to audit itself.** The ledger row is written by the gate, not by the
component; the frame is opened by the verifier, not by the renderer.

---

# §10 · THE ERROR BUDGET — what is measured, what is not, and the honest bound

You do not get there by trusting components. You get there by making each defect class have a
detector and a hard stop. **The cells below are marked MEASURED only where an artifact exists in
`cf/`; everything else is UNMEASURED and is not a claim.**

**The composite is bounded by the WEAKEST detector, never by the product.** Seven detector pairs
share an input with their subject (listed at the end), so multiplying residuals is arithmetic
theatre. The honest headline is: *the arithmetic layers are fail-closed and mutation-proven; the
semantic layer is the residual, and its size is unknown until the calibration run exists.*

| defect class | detector | independent of? | residual if it works |
|---|---|---|---|
| a misread number (Clairic) | I1–I5 + p_null (planted-null control NOT built) | the reader | UNMEASURED |
| a wrong tier | the truth-table recompute (shares tier_inputs with the producer) | the tier code | MEASURED: 24/24 mutations caught; a wrong INPUT is not caught |
| a wrong modifier gate | 6 sign/enum guards + 24 mutations | the ZFP code | MEASURED for malformed input; the sensitivity matrix is NOT built |
| a wrong sum | the second literal table + independent rounding | the ZFP code | MEASURED: a drifted constant diverges |
| a model that does not predict | calibration: per-bucket ±15pp, permutation null, effect floor | the formula | MEASURED on 3 synthetic controls; **the market run has NOT been done** |
| a flat/dead ZFP | the variance invariant over the week's zones | the ZFP code | MEASURED to fire on a planted flat set |
| a hardcoded chart | the held-out replay | the build | UNMEASURED (the set is not drawn) |
| a wrong render | G1 + G4 + the slab control | the renderer | UNMEASURED (G4 not wired) |
| a false claim | G3 + the control | the agent | UNMEASURED (G3 not wired) |
| a wrong semantic clause | 7 clauses + state-completeness + constant-judge + false-allow=0 | the model | state/constant controls MEASURED; the clause accuracy is UNMEASURED |

**The honest composite:** no number is claimed. The arithmetic layers are fail-closed and
mutation-proven; the semantic layer's error rate is unknown until E2/E3 run against a labelled
set. **A component that cannot be calibrated is not allowed to emit.**

### The seven correlated pairs (from the zero-trust audit) — passing both proves less than it looks
```
1  tier recompute reads receipt.tier_inputs, which the producer wrote   -> catches typos, not bad inputs
2  the sum recompute reads receipt.modifiers                            -> catches tampering, not a wrong gate
3  variance and the ZFP values share the same receipts                  -> n<3 is now a FAIL, but the
                                                                           population is still one source
4  B1 and walk share the zone map                                       -> B1 is decision-zone adequacy,
                                                                           not an ordering check (ordering is code)
5  alternative and walk share the transition table                      -> the alternative cannot falsify the law
6  the confidence composite and the tier gate share confluence/notional -> one wrong zone clears both
7  E1 Q1 (pillar attestation) is satisfied by construction: top/bottom come from the same cluster
                                                                        -> only an un-added pillar can fail
```
**Each pair needs a control whose subject is an independent artifact** (hand-labelled zones, a
second notional source, a signed trade record). Until those exist, the row is UNMEASURED.

**What drives 99% → 0.9% is not any single check. It is:**
```
1  no value is emitted without a receipt          (every number auditable)
2  no input is assumed; absence is fatal          (no silent substitution)
3  every check is mutation-proven                  (a check never seen red is deleted)
4  the model can only subtract, never add          (no model-chosen content)
5  the control runs every time                     (a blind judge voids the run)
6  the replay is the only acceptance               (a hardcoded build cannot pass)
```

---

# §11 · WHAT IS RUNNABLE TODAY

```
cf/verify/zfp.py            the fail-closed ZFP (compute + validate)
cf/verify/zfp_verify.py     the 5-layer suite; exit 0 on this host:
    671/671 real fixture zones -> ZFP_INPUT_MISSING (no fallback path exists)
    13/13 mutations caught
    differential recompute MATCH
    invariants PASS
    calibration metric self-test PASS (skill 0.280, AUC 0.851, max inversion 7.6pp <= 10,
      shuffled skill -0.493 <= +0.05)

NOT RUNNABLE — and now fails loudly instead of pretending:
    the market calibration      needs the options feed (P1's first blocker)
    E2/E3                       need a Clef credential + the state builder's zone map
    the render                  needs the rig and a real card
```

---

# §12 · THE ERROR TAXONOMY

```
W0_*    workflow/anchoring        W0_FREEZE_AFTER_ANCHOR
W1_*    bars                      W1_BARS_ABSENT · W1_LOOKAHEAD · W1_BARS_UNORDERED
                                  W1_BARS_INVALID · W1_4H_SHORT · W1_1H_SHORT
                                  W1_CONTENT_MISMATCH
W2_*    options                   W2_CAPTURE_EMPTY · W2_CAPTURE_KNOWN_BAD · W2_EXTRACT_TRUNCATED
                                  W2_FIELD_ABSENT · W2_NO_PNULL · W2_INCONCLUSIVE
                                  W2_NO_STRIKES · W2_I1_ALIGNMENT · W2_I2_UNITS
                                  W2_I3_DOMAIN · W2_I4_WINDOW · W2_I5_TOTAL
W3_*    calendar                  W3_CAPTURE_EMPTY · W3_* (same shape as W2)
E1_*    zones                     E1_NO_LEVELS · E1_NO_ZONES · E1_CONFLUENCE_OUT_OF_RANGE
                                  E1_ROLE_MISSING · E1_ROLE_COUNT · E1_ROLE_DANGLING
                                  E1_NO_RECEIPT · E1_ZFP_FLAT · E1_ZFP_GEOMETRY
                                  E1_ZFP_RANGE · E1_CONSTANT_COUNT
ZFP_*   probability               ZFP_INPUT_MISSING · ZFP_INPUT_INVALID · ZFP_TIER_UNCLASSIFIED
                                  ZFP_TIER_UNKNOWN · ZFP_BAND_MISMATCH · ZFP_BASE_MISMATCH
                                  ZFP_MODIFIER_SET · ZFP_MODIFIER_UNKNOWN · ZFP_MODIFIER_INVALID
                                  ZFP_MODIFIER_VALUE · ZFP_MODIFIER_NO_GATE · ZFP_RAW_MISMATCH
                                  ZFP_VALUE_MISMATCH · ZFP_OUT_OF_RANGE · ZFP_IMPL_DIVERGENCE
                                  (warning) ZFP_CLAMPED   (finding) ZFP_CROSSCHECK_CONFLICT
E2_*    chain                     E2_LOOKAHEAD · E2_NO_SPANS · E2_NO_CANDIDATES
                                  E2_ALL_FALSIFIED · E2_ALTERNATIVE_INVALID · E2_CHAIN_ORDER · E2_CHAIN_CYCLE · E2_CHAIN_PAST_WALL · E2_WALK_EMPTY
                                  E2_ENERGY_VETO · E2_DAY_ASSIGNMENT_FAILED · E2_STATE_TOO_LARGE
                                  E2_JUDGE_DOWN · E2_JUDGE_MALFORMED
E3_*    setups                    E3_ANCHOR_TF_INVALID · E3_TP_NULL · E3_CONFIDENCE_OUT_OF_RANGE
                                  E3_JUDGE_DOWN · E3_JUDGE_MALFORMED
                                  (result) E3_NO_SETUPS
G_*     verification              G_STALE_SUBJECT · G_CONTROL_VOID · G_CRITICAL
                                  G_CLAIM_CONTRADICTION · G_MANDATE_FAILED · G_DISAGREE
CARD_*  the payload               CARD_SCHEMA · CARD_BAKED_PAYLOAD · CARD_OVERFLOW
                                  CARD_SEAL_CONFLICT
```
