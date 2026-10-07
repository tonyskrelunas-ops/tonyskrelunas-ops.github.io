#!/bin/sh
# Has anything in the books changed since the canon was last read?
# The canon is Dropbox/For-Claude/THE-BOOKS-CANON.md — read it before writing
# anything about the books. This says whether it can still be trusted.
python3 - <<'PY'
import os, hashlib, datetime
B=os.path.expanduser("~/Library/CloudStorage/Dropbox/2027 Books ecosystme/0-THIS-WEEK")
# what to READ for each book. Council Fire's markdown is one build behind its
# shipped EPUB, so the EPUB is the authority there.
known={
 "Stone Breath":       (f"{B}/Stone-Breath/pandoc-source 2026-09-27 1803/stone-breath.md","3608d5157e34"),
 "The Council Fire":   (f"{B}/Council-Fire/The Council Fire - Tony Skrelunas.epub",None),
 "The Far Messengers": (f"{B}/NEWEST-FAR-MESSENGERS-MANUSCRIPT-v20 2026-10-06.md","bedfb398f6fc"),
}
stale=0
for n,(p,want) in known.items():
    if not os.path.exists(p):
        print("  MOVED    %-20s source is gone — find the new one before quoting" % n); stale+=1; continue
    got=hashlib.sha256(open(p,'rb').read()).hexdigest()[:12]
    when=datetime.datetime.fromtimestamp(os.path.getmtime(p)).strftime('%Y-%m-%d %H:%M')
    if want is None:
        print("  ok       %-20s %s  (read the EPUB, not the markdown)" % (n, when)); continue
    if got==want: print("  ok       %-20s unchanged since the canon was written (%s)" % (n, when))
    else: print("  CHANGED  %-20s %s now, sha %s — the canon is out of date for this book" % (n, when, got)); stale+=1
# a newer manuscript may exist that the canon does not know about
import glob
newer=[f for f in glob.glob(B+"/**/*.md", recursive=True)+glob.glob(B+"/**/*.epub", recursive=True)
       if os.path.getmtime(f) > max(os.path.getmtime(p) for p,_ in known.values())
       and 'versions' not in f and 'superseded' not in f]
if newer:
    print("\n  newer .md files exist in 0-THIS-WEEK than any book the canon knows:")
    for f in sorted(newer, key=os.path.getmtime, reverse=True)[:5]:
        print("    ", datetime.datetime.fromtimestamp(os.path.getmtime(f)).strftime('%m-%d %H:%M'), f.split('0-THIS-WEEK/')[-1][:70])
print()
print("  CANON OUT OF DATE — re-read before quoting" if stale else "  canon is current")
PY
