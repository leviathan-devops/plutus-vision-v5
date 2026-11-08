# G1 ARITHMETIC — the artifact must declare >=5 zones, each ZFP in 0..99 with a receipt.
# Enforcement: gates/gate.sh G1 (exit 1 on any out-of-range value or a missing receipt).
check_G1() {
  local f="$1"
  grep -q '^ZONES' "$f" || return 1
  awk '/^ZONES/{z=1;next} /^END/{z=0} z&&NF{if($2<0||$2>99)bad=1; if($3!="receipt")bad=1; n++} END{exit (bad||n<5)?1:0}' "$f"
}
