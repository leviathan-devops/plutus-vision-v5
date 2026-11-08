# PLUTUS VISION — the E1 AUTOMATIC pipeline
#
#   make e1          the acceptance suites, THEN extract → build → deploy (deploy is GATED)
#   make e1-test     the acceptance suites (all, aggregated — never stops at the first)
#   make e1-visual   the served-vs-built comparison (FAILS on a stale deploy)
#
# The week is DERIVED from the chart's own bars — the anchor law (e1_week.py) is the chart's
# LAST BAR, never a literal (measured 2026-10-05: a hard-coded WEEK made the zones stale for
# every week but one). Override per run only when you mean it:
#   make e1 PAIR=EUR/USD                 # week auto-derived from the fixture the chart serves
#   make e1 WEEK=2026-07-06 PAIR=DXY     # an explicit week (the extractor overrides it to the
#                                        # chart's week if they disagree, with a loud line)

PAIR ?= DXY
WEEK ?= auto
PY   ?= python3
RENDERER := pine-ide/ide/renderer

.PHONY: e1 e1-test e1-visual help

help:
	@echo "make e1        suites + extract -> build -> deploy (gated)"
	@echo "make e1-test   the acceptance suites (ST-18/19/20/21/26/22)"
	@echo "make e1-visual served-vs-built comparison (fails on drift)"

# THE AUTO-RUN. Deploy is GATED on the suites (e1-test is a prerequisite): a failing suite
# stops the chain before anything deploys. The build refuses on v1 drift (HARD STOP H1) too.
e1: e1-test
	@mkdir -p data/e1
	$(PY) scripts/e1_sources.py --json > data/e1/sources.json
	$(PY) scripts/e1_extract.py --pair "$(PAIR)" $(if $(filter-out auto,$(WEEK)),--week "$(WEEK)")
	PV2_WEEK="$(if $(filter-out auto,$(WEEK)),$(WEEK))" PV2_PAIR="$(PAIR)" $(PY) scripts/lqz_vision_v2_build.py
	mkdir -p "$(RENDERER)"
	cp plutus-vision-v2.pine "$(RENDERER)/plutus-vision-v2.pine"
	@echo "── deployed ──"
	@sha256sum "$(RENDERER)/plutus-vision-v2.pine"

# THE ACCEPTANCE SUITES — run ALL (aggregate), never stop at the first failure, NAME the failed
# ones, and exit non-zero if ANY failed.
e1-test:
	@fail=""; \
	for t in e1_st_18 e1_st_19 e1_st_20 e1_st_21 e1_st_26 e1_st_22; do \
	  $(PY) scripts/$$t.py || fail="$$fail $$t"; \
	done; \
	if [ -n "$$fail" ]; then echo "SUITES: FAIL —$$fail"; exit 1; fi; \
	echo "SUITES: PASS (6)"

# THE VISUAL PROOF (the operator's metric) + a REAL drift check. A missing artifact FAILS (two
# empty command substitutions would otherwise compare equal); a stale deploy FAILS.
e1-visual:
	@test -f plutus-vision-v2.pine || { echo "MISSING built artifact"; exit 1; }; \
	test -f "$(RENDERER)/plutus-vision-v2.pine" || { echo "MISSING served artifact"; exit 1; }; \
	built=$$(sha256sum plutus-vision-v2.pine | cut -d' ' -f1); \
	served=$$(sha256sum "$(RENDERER)/plutus-vision-v2.pine" | cut -d' ' -f1); \
	echo "built:  $$built"; echo "served: $$served"; \
	if [ "$$built" != "$$served" ]; then echo "SERVED_PINE_DRIFT — the served copy is stale"; exit 1; fi; \
	echo "IN SYNC"; \
	n=$$(ls packages/plutus-vision-e1-automatic/evidence/*.png 2>/dev/null | wc -l); \
	echo "evidence: $$n capture(s) (the visual proof is the operator/hotseat captures; a fresh tree has none until the rig runs)"
