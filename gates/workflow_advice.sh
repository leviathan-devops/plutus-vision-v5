# WORKFLOW-ADVICE-GUARD — every prevention in a workflow must be a gate invocation, never advice.
# Refusal token: WORKFLOW_ADVICE (exit 1). A phase with prose-only prevention is refused.
check_workflow_advice() {
  local f="$1"
  local pat='(be sure to|don.t forget|should always|remember to|make sure to|it is important to|always check|never forget|pay attention|keep in mind)'
  if grep -nEi "$pat" "$f" >/dev/null 2>&1; then
    grep -nEi "$pat" "$f" | while IFS= read -r line; do
      echo "WORKFLOW_ADVICE: $f:$line"
    done
    return 1
  fi
  return 0
}
