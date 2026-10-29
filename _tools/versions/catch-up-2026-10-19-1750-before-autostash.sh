#!/bin/bash
# The safety net under the safety net.
#
# 6 October 2026: GitHub's scheduler did not fire at 05:11. It is best effort —
# scheduled runs are routinely delayed and sometimes dropped, which is fine for
# a chore and not fine for something that is supposed to turn every morning.
# The laptop is not reliable either; it sleeps.
#
# So neither is trusted alone. This runs on the Mac whenever it is awake, does
# nothing at all if the edition is already today's, and gathers only if GitHub
# missed. Two independent chances every morning, and no double work.
set -u
export PATH=/usr/bin:/bin:/usr/local/bin:/opt/homebrew/bin
cd ~/Documents/TribeAwaken || exit 1

git pull --quiet --rebase origin main 2>/dev/null

LIVE=$(python3 -c "import json;print(json.load(open('js/magazine-feed.json'))['generated'][:10])" 2>/dev/null)
TODAY=$(date +%F)

if [ "$LIVE" = "$TODAY" ]; then
  echo "today's edition is already in place ($LIVE) — nothing to do"
  exit 0
fi

echo "the edition is from $LIVE and today is $TODAY — GitHub missed it, gathering now"
python3 _tools/refresh-magazine-daily.py || exit 1
if [ -n "$(git status --porcelain js/magazine-feed.json journal/index.html)" ]; then
  git add js/magazine-feed.json journal/index.html _tools/digests journal/versions 2>/dev/null
  git commit -q -m "Magazine: $(date '+%B %-d, %Y') edition (caught up from the Mac)"
  git push -q origin main && echo "pushed — the site has today's edition"
fi
