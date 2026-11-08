#!/usr/bin/env bash
# Fails LOUD when the file the IDE serves is not the file under test.
S=plutus-vision-v0.pine; R=pine-ide/ide/renderer/$S
A=$(sha256sum "$S" | cut -d' ' -f1); B=$(sha256sum "$R" | cut -d' ' -f1)
C=$(curl -s -m 5 "http://127.0.0.1:9851/$S" | sha256sum | cut -d' ' -f1)
echo "source ${A:0:16}  renderer ${B:0:16}  served ${C:0:16}"
[ "$A" = "$B" ] && [ "$A" = "$C" ] || { echo "SERVED_PINE_DRIFT: the IDE is not serving the file under test"; exit 1; }
echo "SERVED_PINE_OK"
