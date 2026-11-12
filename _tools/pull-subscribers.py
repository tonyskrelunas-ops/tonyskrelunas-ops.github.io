#!/usr/bin/env python3
"""ONE list, always current. Nobody tracks anything by hand.

Tony, 10/4/2026: "How the heck am I gonna keep track of this?"

He was keeping track by hand, out of notification emails, into a CSV someone
exported on 12 September. This pulls every signup from the capture endpoint on
his own Netlify account, merges it with that export, dedupes on the address,
and writes one master list. It runs with the daily magazine job, so the list is
never more than a morning old.

Writes:
  ~/Desktop/MEMBERS-LIST-CURRENT.csv            the one to send to
  Dropbox/For-Claude/members/members-<date>.csv an archive, never overwritten

Run:  python3 _tools/pull-subscribers.py
"""
import os, csv, json, glob, datetime, urllib.request

HERE  = os.path.dirname(os.path.abspath(__file__))
HOME  = os.path.expanduser("~")
SITE  = "f41ce288-9755-4f2e-ad20-13e099810be6"      # tribeawaken-capture
DESK  = os.path.join(HOME, "Desktop", "MEMBERS-LIST-CURRENT.csv")
ARCH  = os.path.join(HOME, "Library/CloudStorage/Dropbox/For-Claude/members")

# the hand-made exports this replaces; whichever is newest seeds the list
SEEDS = [os.path.join(HOME, "Desktop", "IMPORT-THIS-LIST-70-subscribers-*.csv"),
         os.path.join(HOME, "Library/CloudStorage/Dropbox/For-Claude/tribeawaken-list-CLEAN-*.csv")]

FIELDS = ["email", "first_name", "last_name", "signup_date", "site", "source", "edition", "page", "consent"]

def api(path):
    """Netlify API through the signed-in Netlify CLI on this Mac (the old personal token expired in Oct 2026)."""
    import subprocess, urllib.parse
    u = urllib.parse.urlparse(path); q = dict(urllib.parse.parse_qsl(u.query))
    parts = u.path.strip("/").split("/")          # sites/<id>/submissions
    data = {"site_id": parts[1], **q}
    raw = subprocess.run(["npx", "--yes", "netlify-cli", "api", "listSiteSubmissions", "--data", json.dumps(data)],
                         capture_output=True, text=True, cwd="/tmp").stdout
    return json.loads(raw[raw.find("["):]) if "[" in raw else []

def site_of(d):
    s = ((d.get("source") or "") + " " + (d.get("page") or "")).lower()
    if "peaks" in s: return "ancestralpeaks"
    if "ancestralwatch" in s or s.startswith("aw-") or " aw-" in s: return "ancestralwatch"
    return "tribeawaken"

def main():
    people = {}

    # 1 — the lists made by hand, so nobody who already said yes is dropped
    for pat in SEEDS:
        for f in sorted(glob.glob(pat)):
            for row in csv.DictReader(open(f, encoding="utf-8-sig", errors="ignore")):
                e = (row.get("email") or row.get("Email 1") or "").strip().lower()
                if "@" not in e: continue
                people[e] = {"email": e,
                             "first_name": (row.get("first_name") or "").strip(),
                             "last_name":  (row.get("last_name") or "").strip(),
                             "signup_date": (row.get("signup_date") or "")[:10],
                             "source": row.get("source") or "imported",
                             "edition": "en", "page": "",
                             "consent": row.get("consent") or "subscribed", "site": "tribeawaken"}
    seeded = len(people)

    # 2 — everything the site has captured since
    new = 0
    page = 1
    while True:
        subs = api(f"/sites/{SITE}/submissions?per_page=100&page={page}")
        if not subs: break
        for s in subs:
            d = s.get("data") or {}
            e = (s.get("email") or d.get("email") or "").strip().lower()
            if "@" not in e: continue
            if e.endswith("@tribeawaken.com") and ("verify-" in e or "cors-probe" in e or "capture-test" in e):
                continue                                  # my own endpoint tests
            if e not in people: new += 1
            people[e] = {"email": e,
                         "first_name": (d.get("first_name") or "").strip(),
                         "last_name":  (d.get("last_name") or "").strip(),
                         "signup_date": (s.get("created_at") or "")[:10],
                         "source": d.get("source") or "site",
                         "edition": d.get("edition") or "en",
                         "page": d.get("page") or "",
                         "consent": "subscribed",
                         "site": site_of(d)}
        page += 1
        if page > 20: break

    rows = sorted(people.values(), key=lambda r: (r["signup_date"] or "", r["email"]))
    os.makedirs(ARCH, exist_ok=True)
    stamp = datetime.date.today().isoformat()
    for path in (DESK, os.path.join(ARCH, f"members-{stamp}.csv")):
        with open(path, "w", newline="", encoding="utf-8") as fh:
            w = csv.DictWriter(fh, fieldnames=FIELDS); w.writeheader(); w.writerows(rows)

    print(f"  members      : {len(rows)}  ({seeded} from the old exports, {new} captured by the site)")
    recent = [r for r in rows if r["signup_date"] >= (datetime.date.today()
                                 - datetime.timedelta(days=7)).isoformat()]
    if recent:
        print(f"  this week    : {len(recent)}")
        for r in recent[-5:]:
            print(f"     {r['signup_date']}  {r['email']}  ({r['source']}, {r['edition']})")
    print(f"  list         : {DESK}")

if __name__ == "__main__":
    main()
