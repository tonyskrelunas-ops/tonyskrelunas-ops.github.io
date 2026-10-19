#!/usr/bin/env python3
"""
new-article.py — put an approved article on the site.

Why this exists. Tony, 19 October 2026: "all this work.. we have not added one
new article?" He was right, and the reason was that nothing here could publish
one. All 67 journal articles were assembled by hand, so every finished draft —
from the Tue/Fri engine, from Wix, from anywhere — died in an inbox.

It works the way build-translation.py does: clone a known-good article so the
greeting bar, the globe bar, the header, the nav, the share block, the footer
and every script stay byte-identical, then swap in the new content. Nothing is
generated from scratch, so nothing drifts from the house.

    python3 _tools/new-article.py draft.md            # build it, report, change nothing else
    python3 _tools/new-article.py draft.md --index    # also add it to the journal index

The draft is markdown with a frontmatter block:

    ---
    title: What Waking Up Early Did For Me
    eyebrow: Human Resilience
    dek: One sentence that shows in the index, the feed and the share card.
    hero: /assets/img/land/aspen-grove.jpg
    hero_alt: What the photograph actually shows.
    date: 2026-10-19
    ---

    Body paragraphs, blank line between them.

    ## A subhead if it needs one

    *Italic* and [links](https://example.com) work.

On images: the hero must be a real photograph already in the repo, or one of the
hand-drawn symbols in assets/art. Never a generated photoreal image — that is
Tony's standing rule and this script will not accept a path outside assets/.
"""

import argparse
import datetime
import html
import io
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
TEMPLATE = os.path.join(ROOT, "journal", "wanting-narrows-the-eye", "index.html")
SITE = "https://tribeawaken.com"

MONTHS = ("January February March April May June July August September "
          "October November December").split()


def die(msg):
    sys.exit("  STOPPED: %s" % msg)


def read_draft(path):
    s = io.open(path, encoding="utf-8").read()
    m = re.match(r"\s*---\s*\n(.*?)\n---\s*\n(.*)$", s, re.S)
    if not m:
        die("no frontmatter block. The draft must open with --- ... --- .")
    meta = {}
    for line in m.group(1).split("\n"):
        if ":" in line:
            k, v = line.split(":", 1)
            meta[k.strip()] = v.strip()
    for need in ("title", "dek", "hero", "hero_alt", "date"):
        if not meta.get(need):
            die("frontmatter is missing %r" % need)
    return meta, m.group(2).strip()


def slugify(t):
    t = re.sub(r"[^\w\s-]", "", t.lower())
    return re.sub(r"[\s_]+", "-", t).strip("-")


def md_to_html(body):
    """Deliberately small: paragraphs, h2, em, strong, links. Nothing clever."""
    out = []
    for block in re.split(r"\n\s*\n", body):
        b = block.strip()
        if not b:
            continue
        if b.startswith("<"):          # raw HTML block: a video, a figure, a pull-quote
            out.append(b)
            continue
        b = html.escape(b, quote=False)
        # absolute URLs and site-relative paths both; nothing else
        b = re.sub(r"\[([^\]]+)\]\(((?:https?://|/)[^)]+)\)", r'<a href="\2">\1</a>', b)
        b = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", b)
        b = re.sub(r"(?<!\*)\*([^*\n]+)\*(?!\*)", r"<em>\1</em>", b)
        if b.startswith("## "):
            out.append("<h2>%s</h2>" % b[3:].strip())
        else:
            out.append("<p>%s</p>" % b.replace("\n", " "))
    return "\n\n".join(out)


def build(meta, body_html, slug):
    s = io.open(TEMPLATE, encoding="utf-8").read()
    d = datetime.date.fromisoformat(meta["date"])
    pretty = "%s&nbsp;%d,&nbsp;%d" % (MONTHS[d.month - 1], d.day, d.year)
    url = "%s/journal/%s/" % (SITE, slug)
    title = meta["title"]
    dek = meta["dek"]
    eyebrow = meta.get("eyebrow", "Human Resilience")

    # ---- head
    s = re.sub(r"<title>.*?</title>",
               "<title>%s &mdash; TribeAwaken</title>" % html.escape(title, quote=False), s, 1, re.S)
    s = re.sub(r'<meta name="description" content="[^"]*"',
               '<meta name="description" content="%s"' % html.escape(dek), s, 1)
    s = re.sub(r'<link rel="canonical" href="[^"]*"',
               '<link rel="canonical" href="%s"' % url, s, 1)
    s = re.sub(r'<meta property="og:title" content="[^"]*"',
               '<meta property="og:title" content="%s"' % html.escape(title), s, 1)
    s = re.sub(r'<meta property="og:description" content="[^"]*"',
               '<meta property="og:description" content="%s"' % html.escape(dek), s, 1)
    s = re.sub(r'<meta property="og:url" content="[^"]*"',
               '<meta property="og:url" content="%s"' % url, s, 1)
    s = re.sub(r'<meta property="og:image" content="[^"]*"',
               '<meta property="og:image" content="%s%s"' % (SITE, meta["hero"]), s, 1)

    # ---- the template carries its own translations; a new piece has none yet.
    # Drop both the in-page link and the hreflang alternate, or the new article
    # claims a Spanish version that does not exist.
    s = re.sub(r'<p class="art__alt".*?</p>', "", s, 1, re.S)
    s = re.sub(r'\s*<link rel="alternate" hreflang="(?:es|ja|lt)" href="[^"]*/(?:es|ja|lt)/[^"]*">', "", s)

    # ---- the header block, swapped whole
    head_re = re.compile(r'(<div class="wrap"><p class="eyebrow").*?(</p>\s*(?=<div class="article__body">))', re.S)
    new_head = (
        '<div class="wrap"><p class="eyebrow" style="color:var(--clay-lt)">%s</p>'
        '<h1 style="font-family:var(--font-display);font-size:var(--step-4);line-height:1.08;">%s</h1>'
        '<p class="lead">%s</p>'
        '<figure class="article__hero" style="margin:0 0 var(--space-4);border-radius:var(--radius-lg);overflow:hidden;">'
        '<img src="%s" alt="%s" loading="eager" style="width:100%%;height:auto;display:block;"></figure>'
        '<p class="artdate"><time datetime="%s">%s</time></p>'
        % (html.escape(eyebrow, quote=False), html.escape(title, quote=False),
           html.escape(dek, quote=False), meta["hero"], html.escape(meta["hero_alt"]),
           meta["date"], pretty)
    )
    if not head_re.search(s):
        die("could not find the article header block in the template.")
    s = head_re.sub(lambda _: new_head, s, 1)

    # ---- the share block and the subscribe form carry the TEMPLATE's slug and title.
    # Left alone, every new article tells readers to share a different article.
    import urllib.parse as _up
    t_slug = os.path.basename(os.path.dirname(TEMPLATE))
    _tm = re.search(r"<title>(.*?)</title>", io.open(TEMPLATE, encoding="utf-8").read(), re.S)
    t_title = html.unescape(re.sub(r"<[^>]+>", "", _tm.group(1))) if _tm else ""
    t_title = re.sub(r"\s*(&mdash;|\u2014|\|)\s*TribeAwaken\s*$", "", t_title).strip()
    for enc in (lambda x: _up.quote(x, safe=""), lambda x: x):
        s = s.replace(enc("https://tribeawaken.com/journal/%s/" % t_slug),
                      enc("%s/journal/%s/" % (SITE, slug)))
        s = s.replace(enc("%s \u2014 Tony Skrel\u016bnas" % t_title),
                      enc("%s \u2014 Tony Skrel\u016bnas" % title))
    s = s.replace("sub-%s" % t_slug, "sub-%s" % slug)

    # ---- the body
    body_re = re.compile(r'(<div class="article__body">\s*).*?(\s*<div class="share">)', re.S)
    if not body_re.search(s):
        die("could not find the article body block in the template.")
    s = body_re.sub(lambda m: m.group(1) + body_html + m.group(2), s, 1)
    return s


def index_entry(meta, slug):
    d = datetime.date.fromisoformat(meta["date"])
    pretty = "%s&nbsp;%d,&nbsp;%d" % (MONTHS[d.month - 1], d.day, d.year)
    return ('      <a class="lw__c" href="/journal/%s/">\n'
            '        <span class="lw__im"><img src="%s" alt="" loading="lazy"></span>\n'
            '        <time class="lw__d" datetime="%s">%s</time>\n'
            '        <b>%s</b>\n'
            '        <span class="lw__k">%s</span>\n'
            '        <em class="arrow">Read it <span>&rarr;</span></em>\n'
            '      </a>\n'
            % (slug, meta["hero"], meta["date"], pretty,
               html.escape(meta["title"], quote=False), html.escape(meta["dek"], quote=False)))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("draft")
    ap.add_argument("--index", action="store_true",
                    help="also add the article to the journal index page")
    ap.add_argument("--slug", help="override the slug derived from the title")
    args = ap.parse_args()

    if not os.path.exists(TEMPLATE):
        die("the template article is missing: %s" % TEMPLATE)
    meta, body = read_draft(args.draft)
    slug = args.slug or slugify(meta["title"])

    out_dir = os.path.join(ROOT, "journal", slug)
    if os.path.exists(out_dir):
        die("journal/%s/ already exists. Nothing is ever overwritten here — "
            "pass --slug with a different one, or publish it as a new piece." % slug)

    hero = meta["hero"]
    if not hero.startswith("/assets/"):
        die("the hero must be a file already in the repo under /assets/. "
            "Real photographs or the hand-drawn symbols in assets/art — never a generated image.")
    hero_path = os.path.join(ROOT, hero.lstrip("/"))
    if not os.path.exists(hero_path):
        die("hero image not found on disk: %s" % hero_path)

    page = build(meta, md_to_html(body), slug)
    words = len(re.sub(r"<[^>]+>", " ", body).split())

    os.makedirs(out_dir)
    io.open(os.path.join(out_dir, "index.html"), "w", encoding="utf-8").write(page)

    print("  built   journal/%s/index.html  (%d bytes, about %d words)" % (slug, len(page), words))
    print("  title   %s" % meta["title"])
    print("  hero    %s" % hero)
    print("  live at %s/journal/%s/" % (SITE, slug))

    if args.index:
        p = os.path.join(ROOT, "journal", "index.html")
        s = io.open(p, encoding="utf-8").read()
        anchor = '      <a class="lw__c" href="/journal/'
        i = s.find(anchor)
        if i < 0:
            print("  NOTE  could not find the index list; add the entry by hand.")
        else:
            s = s[:i] + index_entry(meta, slug) + s[i:]
            io.open(p, "w", encoding="utf-8").write(s)
            print("  added   to journal/index.html, at the top of the list")

    print()
    print("  Next: python3 _tools/build-feed.py   (adds it to the RSS feed)")
    print("        python3 _tools/check-pages.py --pages /journal/%s/" % slug)
    print("        The magazine picks it up on its next morning run.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
