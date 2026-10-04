#!/usr/bin/env python3
"""Keeps "Latest Wisdom" on /journal/ honest.

The three cards were hand-written, so they went stale the moment Tony published
anything: on 10/4/2026 the section promising "the newest three" was showing
pieces from September and July, and his three most recent articles were not
linked from the journal index at all. This rebuilds the block from the feed, so
it can never drift again. Run after refresh-magazine-daily.py.
"""
import os, re, json, html, datetime

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, ".."))
PAGE = os.path.join(ROOT, "journal", "index.html")
FEED = os.path.join(ROOT, "js", "magazine-feed.json")

def pretty(d):
    M = ['January','February','March','April','May','June','July',
         'August','September','October','November','December']
    y, m, dd = d.split("-")
    return "%s&nbsp;%d,&nbsp;%s" % (M[int(m)-1], int(dd), y)

def main():
    feed = json.load(open(FEED, encoding="utf-8"))
    newest = [a for a in feed["mine"] if a.get("date")][:3]

    cards = []
    for a in newest:
        img = a.get("img") or a.get("art") or ""
        cards.append(
          '      <a class="lw__c" href="%s">\n'
          '        <span class="lw__im"><img src="%s" alt="" loading="lazy"></span>\n'
          '        <time class="lw__d" datetime="%s">%s</time>\n'
          '        <b>%s</b>\n'
          '        <span class="lw__k">%s</span>\n'
          '        <em class="arrow">Read it <span>&rarr;</span></em>\n'
          '      </a>' % (a["href"], img, a["date"], pretty(a["date"]),
                          html.escape(a["title"]), html.escape(a.get("dek", "")[:185])))

    s = open(PAGE, encoding="utf-8").read()
    new = '<div class="lw">\n' + "\n".join(cards) + "\n    </div>"
    s2, n = re.subn(r'<div class="lw">.*?</div>(?=\s*</div>\s*</section>)', new, s, 1, re.S)
    if not n:
        raise SystemExit("  Latest Wisdom block not found — /journal/ untouched")
    if s2 != s:
        stamp = datetime.datetime.now().strftime("%Y-%m-%d-%H%M")
        v = os.path.join(ROOT, "journal", "versions")
        os.makedirs(v, exist_ok=True)
        open(os.path.join(v, "index-%s-pre-latest.html" % stamp), "w", encoding="utf-8").write(s)
        open(PAGE, "w", encoding="utf-8").write(s2)
    print("  latest wisdom: " + ", ".join(a["slug"][:34] for a in newest))

if __name__ == "__main__":
    main()
