#!/bin/bash
# set-fuel-passphrase.sh — change the passphrase on the private research page.
#
# Run it, type the new passphrase twice. It never appears on screen, never goes
# into a command you can scroll back to, and never reaches anybody but you.
# The page is rebuilt and pushed with the new passphrase; the old one stops
# working the moment the rebuild goes live.
#
#   bash _tools/set-fuel-passphrase.sh

set -euo pipefail
cd "$(dirname "$0")/.."

PF="$HOME/.fuel_passphrase"
PAGE="watch/1bfd4820d8804bb3/index.html"
BODY="_private/fuel-body.html"

if [ ! -f "$BODY" ]; then
  echo "  The page body is missing: $BODY"
  echo "  Nothing changed."
  exit 1
fi

echo
echo "  Changing the passphrase for your private research page."
echo "  Nothing you type is shown."
echo

read -r -s -p "  New passphrase: " P1; echo
read -r -s -p "  Again:          " P2; echo
echo

if [ "$P1" != "$P2" ]; then
  echo "  Those did not match. Nothing changed."
  exit 1
fi
if [ "${#P1}" -lt 10 ]; then
  echo "  That is under ten characters. This file is served publicly, so the"
  echo "  passphrase is the only thing protecting it. Nothing changed."
  exit 1
fi

# keep the outgoing one until the rebuild succeeds
[ -f "$PF" ] && cp "$PF" "$PF.previous"

printf '%s\n' "$P1" > "$PF"
chmod 600 "$PF"
unset P1 P2

if ! python3 _tools/build-private-page.py "$BODY" --out "$PAGE"; then
  echo
  echo "  The rebuild failed. Putting the old passphrase back."
  [ -f "$PF.previous" ] && mv "$PF.previous" "$PF"
  exit 1
fi

echo
echo "  Checking that nothing readable survived in the published file..."
LEAK=0
for probe in "vagal brake" "far messenger" "Wa Keh Yazh" "dry well" "the Cargo"; do
  n=$(grep -c "$probe" "$PAGE" || true)
  [ "$n" != "0" ] && { echo "  LEAK: '$probe' appears $n times. Not pushing."; LEAK=1; }
done
if [ "$LEAK" != "0" ]; then
  [ -f "$PF.previous" ] && mv "$PF.previous" "$PF"
  exit 1
fi
echo "  Clean."

git add "$PAGE"
git commit -q -m "Rebuild the private page under a new passphrase" || true
git pull -q --rebase origin main || true
git push -q origin main

rm -f "$PF.previous"
rm -f "$HOME/Desktop/FUEL-PAGE-PASSPHRASE.txt"

echo
echo "  Done. The page is rebuilt and pushed, and takes a minute or two to go live."
echo "  Your new passphrase is in $PF and nowhere else."
echo "  The old note on your Desktop has been deleted, since it is now wrong."
echo
echo "  https://tribeawaken.com/watch/1bfd4820d8804bb3/"
echo
