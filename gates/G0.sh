# G0 DEPLOY EQUALITY — the live Worker must carry this build and every binding.
# Fixtures: fixtures/G0.good (live response) and fixtures/G0.bad (stale build).
check_G0() {
  local f="$1"
  jq -e '
    (.build_sha // .buildSha // .sha // .version // empty) as $sha
    | (($sha | type) == "string" and ($sha | length) >= 7)
    and (((.bindings // {}) | type) == "object")
    and (((.bindings // {}) | to_entries | map(.value) | all(. == "ok" or . == true)))
  ' "$f" >/dev/null 2>&1
}
