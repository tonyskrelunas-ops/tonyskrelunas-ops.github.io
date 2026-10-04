#!/usr/bin/env python3
"""Builds js/magazine-feed.json for the Abundance Mindset Magazine.

  mine[]   — every one of Tony's journal articles, newest first, with date,
             pillar, dek and artwork. The front page features the newest four.
  found[]  — good news gathered from the world. Left untouched by this script
             so a daily job can refill it without disturbing the rest.

Run:  python3 _tools/build-magazine-feed.py
"""
import os, re, html, json, datetime, sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
ROOT = os.path.normpath(ROOT)
OUT  = os.path.join(ROOT, "js", "magazine-feed.json")
ART  = ["/assets/art/four-capitals.svg","/assets/art/baltic-oak.svg","/assets/art/japan-bridge.svg",
        "/assets/art/dine-mountains.svg","/assets/art/baltic-juosta.svg","/assets/art/dine-dawn.svg",
        "/assets/art/japan-enso.svg","/assets/art/baltic-sun.svg","/assets/art/dine-hogan.svg"]

def text(m):
    return html.unescape(re.sub(r"<[^>]+>", "", m)).strip() if m else None

def read(slug):
    p = os.path.join(ROOT, "journal", slug, "index.html")
    s = open(p, encoding="utf-8", errors="ignore").read()
    def g(pat, grp=1):
        m = re.search(pat, s, re.S | re.I)
        return text(m.group(grp)) if m else None
    title = g(r"<h1[^>]*>(.*?)</h1>") or g(r"<title>(.*?)</title>")
    m = re.search(r'<time[^>]*datetime="([^"]+)"', s)
    date = m.group(1)[:10] if m else None
    if not date:
        m = re.search(r'"datePublished"\s*:\s*"([^"]+)"', s)
        date = m.group(1)[:10] if m else None
    dek = g(r'<meta name="description" content="([^"]*)"') or ""
    m = re.search(r'<meta property="og:image" content="([^"]+)"', s)
    img = m.group(1) if m else None
    if img: img = re.sub(r"^https?://[^/]+", "", img)
    pillar = g(r'class="chip"[^>]*>(.*?)<') or g(r'class="eyebrow[^"]*"[^>]*>(.*?)<') or "From the journal"
    return {"slug": slug, "href": "/journal/%s/" % slug, "title": title or slug,
            "date": date, "pillar": pillar[:46], "dek": dek[:190], "img": img}

def main():
    J = os.path.join(ROOT, "journal")
    mine = []
    for d in sorted(os.listdir(J)):
        if d == "all" or not os.path.isdir(os.path.join(J, d)): continue
        if not os.path.exists(os.path.join(J, d, "index.html")): continue
        try: mine.append(read(d))
        except Exception as e: print("  skipped %s (%s)" % (d, e), file=sys.stderr)
    mine.sort(key=lambda a: (a["date"] or "0000-00-00"), reverse=True)
    for i, a in enumerate(mine):
        a["art"] = ART[i % len(ART)]
    prev = {}
    if os.path.exists(OUT):
        try: prev = json.load(open(OUT))
        except Exception: prev = {}
    # the translation map lives in its own file so a rebuild can never lose it
    TR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "translations.json")
    tr = json.load(open(TR, encoding="utf-8")) if os.path.exists(TR) else {}
    for a in mine:
        if a["slug"] in tr:
            a["tr"] = tr[a["slug"]]
    feed = {"generated": datetime.datetime.now().isoformat(timespec="seconds"),
            "mine": mine,
            "found": prev.get("found", [])}
    # each edition's own gathered news survives a rebuild of his articles
    for k in list(prev):
        if k.startswith("found_"):
            feed[k] = prev[k]
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    json.dump(feed, open(OUT, "w"), ensure_ascii=False, indent=1)
    print("  magazine-feed.json — %d of his articles, %d found items kept"
          % (len(mine), len(feed["found"])))
    print("  translated   : %d of his articles carry other-language versions"
          % sum(1 for a in mine if a.get("tr")))
    print("  newest four on the front page:")
    for a in mine[:4]:
        print("    %s  %s" % (a["date"], a["title"][:60]))

if __name__ == "__main__":
    main()
