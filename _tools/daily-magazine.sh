#!/bin/bash
# The Abundance Mindset Magazine refreshes itself.
#
# Tony, 10/4/2026, on the magazine: "that's the global driver." So it cannot
# depend on anyone being at a keyboard. This runs the engine, rebuilds the
# journal's Latest Wisdom, writes the day's brief of best ideas, and pushes —
# only if something actually changed.
set -u
export PATH=/usr/bin:/bin:/usr/local/bin:/opt/homebrew/bin
cd ~/Documents/TribeAwaken || { echo "repo missing"; exit 1; }

echo "── $(date '+%Y-%m-%d %H:%M') ─────────────────────────────"
python3 _tools/refresh-magazine-daily.py
rc=$?

# keep the member list current — Tony should never harvest an address by hand
python3 _tools/pull-subscribers.py || echo "subscriber pull failed (list unchanged)"

[ $rc -ne 0 ] && { echo "engine failed (rc=$rc) — nothing pushed"; exit $rc; }

if [ -n "$(git status --porcelain js/magazine-feed.json journal/index.html)" ]; then
  git add js/magazine-feed.json journal/index.html _tools/digests 2>/dev/null
  git commit -q -m "Magazine: $(date '+%B %-d, %Y') edition" && git push -q origin main \
    && echo "pushed — tribeawaken.com has today's edition" \
    || echo "commit or push failed"
else
  echo "nothing changed — no push"
fi
