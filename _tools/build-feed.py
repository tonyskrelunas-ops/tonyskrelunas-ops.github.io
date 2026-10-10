#!/usr/bin/env python3
"""
build-feed.py — publish an RSS feed of the journal.

Why this exists. The site moved off Wix onto GitHub Pages, and the thing that
quietly went with it was the feed. On Wix, writing an article mailed the
subscribers and posted it out; here, writing an article notified nobody,
because there was nothing for anything to read. No feed means no
publish-to-email, no auto-share, no reader apps, no Substack mirror, no
Mailchimp RSS campaign. Every one of those starts here.

It walks journal/*/index.html, reads the title, the description and the
<time datetime> each page already carries, and writes a valid RSS 2.0 file.
No new metadata to maintain: the pages are the source.

    python3 _tools/build-feed.py            # write feed.xml
    python3 _tools/build-feed.py --check    # report, write nothing
"""

import argparse
import datetime
import glob
import html
import os
import re
import sys
from email.utils import format_datetime
from xml.sax.saxutils import escape

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SITE = "https://tribeawaken.com"
OUT = os.path.join(ROOT, "feed.xml")

TITLE = "TribeAwaken — Tony Skrelūnas"
DESC = ("Human resilience to cross hard ground. Ancient tools for "
        "future-proofing generations.")


def text_of(pattern, s, group=1):
    m = re.search(pattern, s, re.S | re.I)
    return m.group(group).strip() if m else ""


def clean(t):
    """Page titles carry a site suffix and HTML entities; strip both."""
    t = html.unescape(re.sub(r"<[^>]+>", "", t or ""))
    t = re.sub(r"\s*(&mdash;|—|\|)\s*TribeAwaken\s*$", "", t)
    return re.sub(r"\s+", " ", t).strip()


def read_article(path):
    s = open(path, encoding="utf-8", errors="replace").read()
    slug = os.path.basename(os.path.dirname(path))
    title = clean(text_of(r"<title>(.*?)</title>", s))
    desc = clean(text_of(r'<meta\s+name="description"\s+content="(.*?)"', s))
    date = text_of(r'<time[^>]*datetime="(\d{4}-\d{2}-\d{2})"', s)
    if not (title and date):
        return None, slug, ("no title" if not title else "no date")
    try:
        d = datetime.date.fromisoformat(date)
    except ValueError:
        return None, slug, "bad date %r" % date
    return {"slug": slug, "title": title, "desc": desc, "date": d}, slug, None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true",
                    help="report what would be written, change nothing")
    args = ap.parse_args()

    items, skipped = [], []
    for path in sorted(glob.glob(os.path.join(ROOT, "journal", "*", "index.html"))):
        art, slug, why = read_article(path)
        (items.append(art) if art else skipped.append((slug, why)))

    items.sort(key=lambda a: a["date"], reverse=True)

    print("  articles found : %d" % (len(items) + len(skipped)))
    print("  in the feed    : %d" % len(items))
    if skipped:
        print("  left out       : %d" % len(skipped))
        for slug, why in skipped[:8]:
            print("     %-46s %s" % (slug, why))
    if items:
        print("  newest         : %s  %s" % (items[0]["date"], items[0]["title"][:54]))
        print("  oldest         : %s" % items[-1]["date"])
    if not items:
        sys.exit("No articles could be read. Feed not written.")

    now = datetime.datetime.now(datetime.timezone.utc)
    L = ['<?xml version="1.0" encoding="UTF-8"?>',
         '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
         "<channel>",
         "<title>%s</title>" % escape(TITLE),
         "<link>%s/journal/</link>" % SITE,
         "<description>%s</description>" % escape(DESC),
         "<language>en-us</language>",
         "<lastBuildDate>%s</lastBuildDate>" % format_datetime(now),
         '<atom:link href="%s/feed.xml" rel="self" type="application/rss+xml"/>' % SITE]

    for a in items:
        # noon UTC so the date is the same day in every timezone a reader is in
        when = datetime.datetime(a["date"].year, a["date"].month, a["date"].day,
                                 12, 0, tzinfo=datetime.timezone.utc)
        url = "%s/journal/%s/" % (SITE, a["slug"])
        L += ["<item>",
              "<title>%s</title>" % escape(a["title"]),
              "<link>%s</link>" % url,
              '<guid isPermaLink="true">%s</guid>' % url,
              "<pubDate>%s</pubDate>" % format_datetime(when),
              "<description>%s</description>" % escape(a["desc"]),
              "</item>"]
    L += ["</channel>", "</rss>"]
    xml = "\n".join(L) + "\n"

    if args.check:
        print("\n  --check: nothing written. %d bytes would go to feed.xml" % len(xml))
        return 0

    open(OUT, "w", encoding="utf-8").write(xml)
    print("\n  wrote %s  (%d bytes)" % (os.path.relpath(OUT, ROOT), len(xml)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
