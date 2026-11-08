#!/usr/bin/env python3
import hashlib, sys
want = "0d20e8314ce992fc23e27f1b97fed76b981c84e78c647bbe6b3d6e1206517bd1"
got = hashlib.sha256(open("plutus-vision-v1.pine", "rb").read()).hexdigest()
print("V1_SEAL_" + ("OK" if got == want else "DRIFT"))
sys.exit(0 if got == want else 1)
