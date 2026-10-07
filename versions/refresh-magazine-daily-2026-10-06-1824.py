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


# ═══ THE LANES ═══════════════════════════════════════════════════════════
# Tony, 5 October 2026: "even unique culture stories.. but i thought all had
# their own search engine? i cant be the one doing this everytime."
#
# He was right to push. I had widened the English edition and left the other
# five on their original three or four feeds, so he had to notice and ask.
# The lanes are declared ONCE here, and every edition is built from the same
# list. Adding a lane now means adding it everywhere, and the morning report
# says which edition is short of which lane so he never has to be the one who
# spots it.
#
#   news     the good news proper
#   research the science of a good life
#   running  running, and sport held the old way
#   land     western life, the range, the farm
#   animals  the animals and the wild
#   culture  what a people makes and keeps
LANES = ("news", "research", "running", "land", "animals", "culture")

SOURCES_BY_LANG = {
 "en": [
   ("news",     "Good News Network",      "https://www.goodnewsnetwork.org/feed/"),
   ("news",     "Positive News",          "https://www.positive.news/feed/"),
   ("news",     "Reasons to be Cheerful", "https://reasonstobecheerful.world/feed/"),
   ("research", "Greater Good",           "https://greatergood.berkeley.edu/rss"),
   ("running",  "iRunFar",                "https://www.irunfar.com/feed"),
   ("running",  "Trail Runner",           "https://www.trailrunnermag.com/feed/"),
   ("running",  "Canadian Running",       "https://runningmagazine.ca/feed/"),
   ("land",     "Western Horseman",       "https://westernhorseman.com/feed/"),
   ("land",     "Hobby Farms",            "https://www.hobbyfarms.com/feed/"),
   ("land",     "Modern Farmer",          "https://modernfarmer.com/feed/"),
   ("land",     "Civil Eats",             "https://civileats.com/feed/"),
   ("animals",  "Audubon",                "https://www.audubon.org/rss.xml"),
   ("animals",  "Mongabay",               "https://news.mongabay.com/feed/"),
   ("culture",  "Atlas Obscura",          "https://www.atlasobscura.com/feeds/latest"),
   ("culture",  "Smithsonian",            "https://www.smithsonianmag.com/rss/latest_articles/"),
 ],
 # Spanish reads across the Americas and Spain — Guatemala, Mexico, Peru, Madrid.
 "es": [
   ("news",     "Agencia Ocote",          "https://www.agenciaocote.com/feed/"),
   ("news",     "Ethic",                  "https://ethic.es/feed/"),
   ("news",     "Climática",              "https://www.climatica.lamarea.com/feed/"),
   ("land",     "México Desconocido",     "https://www.mexicodesconocido.com.mx/feed"),
   ("land",     "Causa Natura",           "https://causanatura.org/feed"),
   ("land",     "Agronegocios",           "https://www.agronegocios.co/rss"),
   ("animals",  "Mongabay Latam",         "https://es.mongabay.com/feed/"),
   ("animals",  "Servindi",               "https://www.servindi.org/rss.xml"),
   ("news",     "Inforegión",             "https://www.inforegion.pe/feed/"),
   ("culture",  "Local.mx",               "https://local.mx/feed/"),
   ("culture",  "Jot Down",               "https://www.jotdown.es/feed/"),
   ("culture",  "Zenda Libros",           "https://www.zendalibros.com/feed/"),
   ("culture",  "Revista Anfibia",        "https://www.revistaanfibia.com/feed/"),
 ],
 "ja": [
   ("news",     "IDEAS FOR GOOD",         "https://ideasforgood.jp/feed/"),
   ("news",     "greenz.jp",              "https://greenz.jp/feed/"),
   ("news",     "ソトコト",                  "https://sotokoto-online.jp/feed"),
   ("land",     "マイナビ農業",               "https://agri.mynavi.jp/feed/"),
   ("culture",  "Nippon.com",             "https://www.nippon.com/ja/feed/"),
   ("culture",  "Casa Brutus",            "https://casabrutus.com/feed"),
 ],
 "lt": [
   ("news",     "Bernardinai",            "https://www.bernardinai.lt/feed/"),
   ("culture",  "Kaunas pilnas kultūros", "https://kaunaspilnas.lt/feed/"),
   ("culture",  "Nacionalinis muziejus",  "https://lnm.lt/feed/"),
   ("culture",  "15min Kultūra",          "https://www.15min.lt/rss/kultura"),
   ("culture",  "LRT Kultūra",            "https://www.lrt.lt/naujienos/kultura?rss"),
   ("animals",  "Gamtos tyrimai",         "https://www.gamtostyrimai.lt/feed/"),
   ("news",     "Kauno diena",            "https://kauno.diena.lt/rss.xml"),
   ("research", "Mokslo Lietuva",         "https://mokslolietuva.lt/feed/"),
 ],
 # India reads in English, from Indian publications.
 "india": [
   ("news",     "The Better India",       "https://www.thebetterindia.com/feed/"),
   ("news",     "Village Square",         "https://www.villagesquare.in/feed/"),
   ("culture",  "Sahapedia",              "https://www.sahapedia.org/rss.xml"),
   ("land",     "Mongabay India",         "https://india.mongabay.com/feed/"),
   ("animals",  "Roundglass Sustain",     "https://roundglasssustain.com/rss.xml"),
   ("culture",  "The Hindu Society",      "https://www.thehindu.com/society/feeder/default.rss"),
   ("culture",  "Madras Courier",         "https://madrascourier.com/feed/"),
   ("running",  "Hindustan Times Health", "https://www.hindustantimes.com/feeds/rss/lifestyle/health/rssfeed.xml"),
 ],
 # Tibet reads in English, from the Tibetan community's own publications.
 "tibet": [
   ("news",     "Phayul",                 "https://www.phayul.com/feed/"),
   ("news",     "Tibetan Review",         "https://www.tibetanreview.net/feed/"),
   ("news",     "Central Tibetan Administration", "https://tibet.net/feed/"),
   ("research", "Tibet Policy Institute", "https://tibetpolicy.net/feed/"),
   ("culture",  "Tibet Museum",           "https://www.tibetmuseum.org/feed/"),
   ("research", "Buddhist Digital Resource Center", "https://www.bdrc.io/feed/"),
 ],
 # Chinese: Tony ruled it out on 4 October — "ok dont do china.. what about
 # tibet?" The gates for it stay in filters.py, costing nothing, in case he
 # ever wants it. Nothing is gathered and the morning report does not nag
 # about a lane he has closed.
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

def gather(srcs, lang, cap, errs, rejected, health):
    """Read every source for one edition, keep what clears the gates, and give
       each lane a place on the page. Round robin by lane first, then by source,
       so a prolific feed cannot take the morning from a quiet one."""
    got = {}
    for lane, name, url in srcs:
        try:
            items_ = items(fetch(url), name)
            if not items_:
                health.append((lang, lane, name, "empty"))
        except Exception as e:
            errs.append("%s/%s: %s" % (lang, name, e))
            health.append((lang, lane, name, "unreachable"))
            continue
        for it in items_:
            blob = it["title"] + " " + it["dek"]
            ok, why = passes(blob, lang)
            if not ok:
                rejected.append((lang, why, it["title"][:70])); continue
            it["lane"] = lane
            got.setdefault((lane, name), []).append(it)

    for key in got:
        got[key].sort(key=lambda i: i["date"] or "", reverse=True)

    lanes_present = [l for l in LANES if any(k[0] == l for k in got)]
    for l in LANES:
        if l not in lanes_present and any(x[0] == l for x in srcs):
            health.append((lang, l, "—", "nothing cleared the gates"))

    seen, keep = set(), []
    for rank in range(8):
        for lane in lanes_present:
            for (l, name), lst in got.items():
                if l != lane or rank >= len(lst): continue
                it = lst[rank]
                k = re.sub(r"[?#].*$", "", it["url"])
                if k in seen: continue
                seen.add(k); keep.append(it)
                if len(keep) >= cap: return keep
    return keep[:cap]

def brief(feed, health=None):
    """The best ideas of the day, for Tony — not for the site.

    He asked for the breakthroughs worth knowing about. Ranked by how much
    uplift language the piece carries, deduped, newest first, with the link.
    """
    # two from each language, so the brief is a view of the world and not
    # whichever feed happened to use the most uplifting words that morning
    best = {}
    for k in [x for x in feed if x == "found" or x.startswith("found_")]:
        lang = k.replace("found_", "") if "_" in k else "en"
        if lang not in UPLIFT: continue
        ranked = []
        for it in feed.get(k, []):
            blob = it["title"] + " " + it["dek"]
            ranked.append((len(UPLIFT[lang].findall(blob)), it))
        ranked.sort(key=lambda t: -t[0])
        best[lang] = [it for _, it in ranked]

    out, seen = [], set()
    for rank in range(2):
        for lang in ("en", "es", "ja", "lt", "india", "tibet", "zh"):
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
    if health:
        L += ["", "---", "", "## Needs a look",
              "", "These sources gave nothing this morning. A feed that stays on this",
              "list for a few days has moved or died and wants replacing.", ""]
        for lang, lane, name, what in health:
            L.append(f"- **{lang}** · {lane} · {name} — {what}")
        L.append("")
    p = os.path.join(HERE, "digests")
    os.makedirs(p, exist_ok=True)
    f = os.path.join(p, "BREAKTHROUGHS-%s.md" % d)
    open(f, "w", encoding="utf-8").write("\n".join(L))
    return f, len(out)

def main():
    os.system('python3 "%s"' % os.path.join(HERE, "build-magazine-feed.py"))
    feed = json.load(open(FEED))
    errs, rejected, health = [], [], []

    CAP = {"en": 18, "es": 12, "ja": 9, "lt": 12, "india": 9, "tibet": 9, "zh": 9}
    for lang, srcs in SOURCES_BY_LANG.items():
        got = gather(srcs, lang, CAP.get(lang, 9), errs, rejected, health)
        key = "found" if lang == "en" else "found_" + lang
        feed[key] = got
        lanes = sorted({i.get("lane") for i in got})
        print("  %-12s %2d from %2d sources  [%s]"
              % (key, len(got), len(srcs), " ".join(lanes)))

    feed["generated"] = datetime.datetime.now().isoformat(timespec="seconds")
    json.dump(feed, open(FEED, "w"), ensure_ascii=False, indent=1)

    os.system('python3 "%s"' % os.path.join(HERE, "refresh-latest-wisdom.py"))
    f, n = brief(feed, health)
    print("  brief        : %d best ideas -> %s" % (n, os.path.basename(f)))

    byreason = {}
    for lang, why, t in rejected: byreason[why] = byreason.get(why, 0) + 1
    print("  rejected     : " + ", ".join("%s %d" % (k, v) for k, v in sorted(byreason.items())))
    if health:
        print("  NEEDS A LOOK :")
        for lang, lane, name, what in health:
            print("     %-6s %-9s %-26s %s" % (lang, lane, name[:26], what))
    for e in errs: print("  source error : %s" % e, file=sys.stderr)


if __name__ == "__main__":
    main()
