#!/usr/bin/env python3
"""
publish-articles.py — put finished articles live on tribeawaken.com in one step, with nobody waiting.

Tony, 14 November 2026: "this is all supposed to be automatic.. why are you waiting on me since nov 2..
i dont have time to look at things.. find a way to put things right in front of me if you need review."
So articles publish themselves; the email that tells him about it comes after they are live.

    python3 _tools/publish-articles.py draft1.md [draft2.md ...] [--dry-run]

Each draft is markdown with the frontmatter new-article.py reads, plus two keys of its own:

    ---
    title: The Year I Failed Out of College
    eyebrow: Human Resilience
    dek: One sentence for the index, the feed and the share card.
    photo: /assets/home-v5/turtle-island/flock-going-out-1600.jpg   # a REAL photograph already in the repo
    hero_alt: What the photograph actually shows.
    stream: healing          # healing | economics | body | carried | ride | doctorate | novels
    date: 2026-11-14
    ---

The script makes the hero, thumbnail and share images from that photograph (assets/img/journal-<MMDD>/),
builds each page with new-article.py, puts the newest at the top of Latest Wisdom (keeping three),
adds each to its stream with the counts corrected, rebuilds feed.xml, commits, rebases on origin/main,
pushes, and waits until every page answers 200 on tribeawaken.com (retriggering a GitHub Pages build
that failed to start). It prints one JSON line at the end: {"live": [{"title","url","first"}...]}.
Run it from a clean worktree of the site (git status shows nothing staged).
"""
import json, os, re, subprocess, sys, time, datetime, html, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPO = "tonyskrelunas-ops/tonyskrelunas-ops.github.io"
STREAMS = {"healing", "economics", "body", "carried", "ride", "doctorate", "novels"}
MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August",
          "September", "October", "November", "December"]


def sh(*cmd, check=True):
    r = subprocess.run(list(cmd), cwd=ROOT, capture_output=True, text=True)
    if check and r.returncode:
        sys.exit("FAILED: %s\n%s%s" % (" ".join(cmd), r.stdout[-800:], r.stderr[-800:]))
    return r.stdout


def read(path):
    s = open(path, encoding="utf-8").read()
    m = re.match(r"\s*---\s*\n(.*?)\n---\s*\n(.*)$", s, re.S)
    if not m:
        sys.exit("no frontmatter in %s" % path)
    meta = {}
    for line in m.group(1).split("\n"):
        if ":" in line:
            k, v = line.split(":", 1)
            meta[k.strip()] = v.split("  #")[0].strip()
    for need in ("title", "dek", "photo", "hero_alt", "stream", "date"):
        if not meta.get(need):
            sys.exit("%s: frontmatter is missing %r" % (path, need))
    if meta["stream"] not in STREAMS:
        sys.exit("%s: stream must be one of %s" % (path, sorted(STREAMS)))
    if not meta["photo"].startswith("/assets/") or not os.path.exists(os.path.join(ROOT, meta["photo"].lstrip("/"))):
        sys.exit("%s: photo must be a real photograph already in the repo under /assets/" % path)
    return meta, m.group(2).strip()


def slugify(t):
    t = re.sub(r"[^\w\s-]", "", t.lower())
    return re.sub(r"[\s_]+", "-", t).strip("-")


def pretty(d):
    d = datetime.date.fromisoformat(d)
    return "%s&nbsp;%d,&nbsp;%d" % (MONTHS[d.month - 1], d.day, d.year)


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    dry = "--dry-run" in sys.argv
    if not args:
        sys.exit(__doc__)
    sh("git", "fetch", "-q", "origin")
    sh("git", "checkout", "-q", "--detach", "origin/main")
    items = []
    for path in args:
        meta, body = read(path)
        slug = slugify(meta["title"])
        if os.path.exists(os.path.join(ROOT, "journal", slug)):
            sys.exit("journal/%s/ already exists" % slug)
        folder = "assets/img/journal-%s" % meta["date"][5:].replace("-", "")
        os.makedirs(os.path.join(ROOT, folder), exist_ok=True)
        src = os.path.join(ROOT, meta["photo"].lstrip("/"))
        hero = "/%s/%s-1600.jpg" % (folder, slug)
        sh("magick", src, "-resize", "1600x", "-strip", "-quality", "84", "-interlace", "Plane", os.path.join(ROOT, hero.lstrip("/")))
        sh("magick", src, "-resize", "480x480^", "-gravity", "center", "-extent", "480x480", "-strip", "-quality", "82",
           os.path.join(ROOT, folder, slug + "-480x480.jpg"))
        sh("magick", src, "-resize", "1200x630^", "-gravity", "center", "-extent", "1200x630", "-strip", "-quality", "84",
           os.path.join(ROOT, folder, slug + "-og-1200x630.jpg"))
        draft = os.path.join("/tmp", "publish-%s.md" % slug)
        fm = "---\ntitle: %s\neyebrow: %s\ndek: %s\nhero: %s\nhero_alt: %s\ndate: %s\n---\n\n" % (
            meta["title"], meta.get("eyebrow", "Human Resilience"), meta["dek"], hero, meta["hero_alt"], meta["date"])
        open(draft, "w", encoding="utf-8").write(fm + body + "\n")
        sh("python3", "_tools/new-article.py", draft, "--index", "--slug", slug)
        first = re.split(r"(?<=[.!?])\s", re.sub(r"[*_]", "", body.split("\n\n")[0]).strip())[0]
        items.append(dict(meta=meta, slug=slug, folder=folder, first=first))

    # the journal index: Latest Wisdom keeps the newest three; each piece joins its stream; counts follow
    p = os.path.join(ROOT, "journal", "index.html")
    s = open(p, encoding="utf-8").read()
    a = s.index('<div class="lw">'); b = s.index("</div>", a)
    cards = re.findall(r'      <a class="lw__c".*?</a>\n', s[a:b], re.S)
    cards = [re.sub(r'-1600\.jpg"', '-og-1200x630.jpg"', c) for c in cards][:3]
    s = s[:a] + '<div class="lw">\n' + "".join(cards) + "    " + s[b:]
    for it in reversed(items):
        m, slug = it["meta"], it["slug"]
        li = ('<li><a href="/journal/%s/"><img class="th" src="/%s/%s-480x480.jpg" alt="" loading="lazy" decoding="async" '
              'width="480" height="480"><span class="t"><em class="dt"><time datetime="%s">%s</time></em><b>%s</b></span></a></li> '
              % (slug, it["folder"], slug, m["date"], pretty(m["date"]), html.escape(m["title"], quote=False)))
        i = s.index('id="%s"' % m["stream"]); j = s.index('<ul class="jlist">', i) + len('<ul class="jlist">')
        s = s[:j] + li + s[j:]
        # stream count: in the directory and in the stream head
        def bump(mo):
            return mo.group(1) + str(int(mo.group(2)) + 1) + mo.group(3)
        i = s.index('id="%s"' % m["stream"])
        head = re.compile(r"(Stream &middot; [^<]*?&middot; )(\d+)( pieces)")
        mo = head.search(s, i)
        s = s[:mo.start()] + bump(mo) + s[mo.end():]
        d = re.compile(r'(<a href="#%s">.*?<span class="m">)(\d+)( pieces)' % m["stream"])
        mo = d.search(s)
        if mo:
            s = s[:mo.start()] + bump(mo) + s[mo.end():]
    mo = re.search(r"(What is inside &middot; )(\d+)( pieces)", s)
    if mo:
        s = s[:mo.start()] + mo.group(1) + str(int(mo.group(2)) + len(items)) + mo.group(3) + s[mo.end():]
    open(p, "w", encoding="utf-8").write(s)
    sh("python3", "_tools/build-feed.py")

    titles = " and ".join(it["meta"]["title"] for it in items)
    if dry:
        print("DRY RUN: built", titles, "— nothing committed"); return
    sh("git", "add", "journal", "assets/img", "feed.xml")
    sh("git", "commit", "-q", "-m", "Journal: %s, published automatically with their photographs (Tony 11/14: articles publish themselves)\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" % titles)
    for attempt in range(4):
        if subprocess.run(["git", "push", "-q", "origin", "HEAD:main"], cwd=ROOT).returncode == 0:
            break
        sh("git", "fetch", "-q", "origin"); sh("git", "rebase", "-q", "origin/main")
    else:
        sys.exit("FAILED: could not push")

    urls = ["https://tribeawaken.com/journal/%s/" % it["slug"] for it in items]
    for t in range(60):                                   # up to 15 minutes
        ok = 0
        for u in urls:
            try:
                ok += urllib.request.urlopen(u + "?nc=%d" % time.time(), timeout=20).status == 200
            except Exception:
                pass
        if ok == len(urls):
            break
        if t % 6 == 5:                                     # a Pages build that failed to start: ask for another
            st = subprocess.run(["gh", "api", "repos/%s/actions/runs?per_page=1" % REPO, "--jq",
                                 '.workflow_runs[0] | .status+" "+(.conclusion//"")'], capture_output=True, text=True).stdout
            if "startup_failure" in st or st.strip().endswith("failure"):
                subprocess.run(["gh", "api", "-X", "POST", "repos/%s/pages/builds" % REPO], capture_output=True)
        time.sleep(15)
    else:
        sys.exit("PUSHED BUT NOT LIVE YET: " + " ".join(urls))
    print(json.dumps({"live": [{"title": it["meta"]["title"], "url": u, "first": it["first"]} for it, u in zip(items, urls)]},
                     ensure_ascii=False))


if __name__ == "__main__":
    main()
