#!/usr/bin/env python3
"""The positive search engine — Tribe Achieve's original idea, rebuilt.

Once a day it:
  1. rebuilds `mine[]` from Tony's journal, so the newest article always leads
     the magazine and four of his pieces hold the front page;
  2. gathers uplifting news from public feeds — in FOUR languages, each edition
     reading its own sources, so a reader in Guatemala gets Spanish journalism
     and not a translated English headline;
  3. writes a short brief of the best ideas it saw, for Tony.

Every item clears three gates (see filters.py): the hard veto, the topic, and —
added 10/4/2026 at Tony's instruction — proof that something good is actually
happening. Uplifting, not merely non-violent.

It only ever stores a headline, a one-line summary, the source and the link —
the reader goes to the publisher to read it. Nothing is rewritten or claimed.

Run:  python3 _tools/refresh-magazine-daily.py
"""
import os, re, json, html, datetime, urllib.request, urllib.error, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from filters import passes, UPLIFT

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, ".."))
FEED = os.path.join(ROOT, "js", "magazine-feed.json")

SOURCES = [
    ("Good News Network",   "https://www.goodnewsnetwork.org/feed/"),
    ("Positive News",       "https://www.positive.news/feed/"),
    ("Reasons to be Cheerful", "https://reasonstobecheerful.world/feed/"),
]

# Each edition gathers in its OWN language.
SOURCES_BY_LANG = {
    # Spanish reads across the Americas and Spain — Guatemala, Mexico, Madrid —
    # so the edition is not one country's view of the language.
    "es": [("Agencia Ocote",      "https://www.agenciaocote.com/feed/"),
           ("México Desconocido", "https://www.mexicodesconocido.com.mx/feed"),
           ("Causa Natura",       "https://causanatura.org/feed"),
           ("Local.mx",           "https://local.mx/feed/"),
           ("Climática",          "https://www.climatica.lamarea.com/feed/"),
           ("Ethic",              "https://ethic.es/feed/")],
    "ja": [("IDEAS FOR GOOD", "https://ideasforgood.jp/feed/"),
           ("greenz.jp",      "https://greenz.jp/feed/"),
           ("ソトコト",          "https://sotokoto-online.jp/feed")],
    "lt": [("Bernardinai",       "https://www.bernardinai.lt/feed/"),
           ("Kaunas pilnas kultūros", "https://kaunaspilnas.lt/feed/"),
           ("Nacionalinis muziejus",  "https://lnm.lt/feed/")],
}

def fetch(url, timeout=25):
    req = urllib.request.Request(url, headers={"User-Agent": "TribeAwaken-magazine/1.0"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read().decode("utf-8", "replace")

def items(xml, source):
    out = []
    for blk in re.findall(r"<item\b.*?</item>", xml, re.S | re.I):
        def tag(t):
            m = re.search(r"<%s[^>]*>(.*?)</%s>" % (t, t), blk, re.S | re.I)
            if not m: return ""
            v = m.group(1)
            v = re.sub(r"<!\[CDATA\[(.*?)\]\]>", r"\1", v, flags=re.S)
            return html.unescape(re.sub(r"<[^>]+>", "", v)).strip()
        title, link, desc, date = tag("title"), tag("link"), tag("description"), tag("pubDate")
        if not title or not link: continue
        iso = ""
        m = re.search(r"(\d{1,2})\s+(\w{3})\w*\s+(\d{4})", date)
        if m:
            M = dict(zip("Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(), range(1, 13)))
            if m.group(2)[:3] in M:
                iso = "%s-%02d-%02d" % (m.group(3), M[m.group(2)[:3]], int(m.group(1)))
        out.append({"title": title[:150], "url": link, "dek": re.sub(r"\s+", " ", desc)[:190],
                    "source": source, "date": iso})
    return out

def gather(srcs, lang, cap, errs, rejected):
    got = []
    for name, url in srcs:
        try:
            for it in items(fetch(url), name):
                blob = it["title"] + " " + it["dek"]
                ok, why = passes(blob, lang)
                if not ok:
                    rejected.append((lang, why, it["title"][:70])); continue
                got.append(it)
        except Exception as e:
            errs.append("%s/%s: %s" % (lang, name, e))
    # round-robin by source so one prolific feed cannot crowd out the rest
    bysrc = {}
    for it in sorted(got, key=lambda i: i["date"], reverse=True):
        bysrc.setdefault(it["source"], []).append(it)
    seen, keep = set(), []
    for rank in range(8):
        for name, _ in srcs:
            lst = bysrc.get(name, [])
            if rank >= len(lst): continue
            it = lst[rank]
            k = re.sub(r"[?#].*$", "", it["url"])
            if k in seen: continue
            seen.add(k); keep.append(it)
    return keep[:cap]

def brief(feed):
    """The best ideas of the day, for Tony — not for the site.

    He asked for the breakthroughs worth knowing about. Ranked by how much
    uplift language the piece carries, deduped, newest first, with the link.
    """
    # two from each language, so the brief is a view of the world and not
    # whichever feed happened to use the most uplifting words that morning
    best = {}
    for k in ("found", "found_es", "found_ja", "found_lt"):
        lang = k.replace("found_", "") if "_" in k else "en"
        ranked = []
        for it in feed.get(k, []):
            blob = it["title"] + " " + it["dek"]
            ranked.append((len(UPLIFT[lang].findall(blob)), it))
        ranked.sort(key=lambda t: -t[0])
        best[lang] = [it for _, it in ranked]

    out, seen = [], set()
    for rank in range(2):
        for lang in ("en", "es", "ja", "lt"):
            lst = best.get(lang, [])
            if rank >= len(lst): continue
            it = lst[rank]
            if it["url"] in seen: continue
            seen.add(it["url"]); out.append((lang, it))

    d = datetime.date.today().isoformat()
    L = ["# Best ideas today — %s" % d, "",
         "From the magazine's own engine. Every one is live and shareable.", ""]
    for lang, it in out:
        L.append("**%s** — %s  \n%s  \n<%s>" %
                 (it["title"], it["source"] + (" · " + lang.upper() if lang != "en" else ""),
                  it["dek"][:170], it["url"]))
        L.append("")
    p = os.path.join(HERE, "digests")
    os.makedirs(p, exist_ok=True)
    f = os.path.join(p, "BREAKTHROUGHS-%s.md" % d)
    open(f, "w", encoding="utf-8").write("\n".join(L))
    return f, len(out)

def main():
    os.system('python3 "%s"' % os.path.join(HERE, "build-magazine-feed.py"))
    feed = json.load(open(FEED))
    errs, rejected = [], []

    feed["found"] = gather(SOURCES, "en", 12, errs, rejected)
    print("  found        : %d kept from %d sources" % (len(feed["found"]), len(SOURCES)))
    for lang, srcs in SOURCES_BY_LANG.items():
        feed["found_" + lang] = gather(srcs, lang, 9, errs, rejected)
        print("  found_%s     : %d from %d sources" % (lang, len(feed["found_" + lang]), len(srcs)))

    feed["generated"] = datetime.datetime.now().isoformat(timespec="seconds")
    json.dump(feed, open(FEED, "w"), ensure_ascii=False, indent=1)

    os.system('python3 "%s"' % os.path.join(HERE, "refresh-latest-wisdom.py"))

    f, n = brief(feed)
    print("  brief        : %d best ideas -> %s" % (n, os.path.basename(f)))

    byreason = {}
    for lang, why, t in rejected: byreason[why] = byreason.get(why, 0) + 1
    print("  rejected     : " + ", ".join("%s %d" % (k, v) for k, v in sorted(byreason.items())))
    for e in errs: print("  source error : %s" % e, file=sys.stderr)

if __name__ == "__main__":
    main()
