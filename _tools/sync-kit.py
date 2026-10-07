#!/usr/bin/env python3
"""
sync-kit.py — put new signups into Kit, so the next letter reaches them.

The capture chain runs Netlify -> pull-subscribers.py -> Dropbox CSV. Kit was
never the end of it: the first 70 got there by a hand import, and anybody who
signed up afterwards would have sat in the CSV and missed the letter.

This closes it. It reads the master list, asks Kit who it already has, and
subscribes the difference to the Members tag. Idempotent — run it as often as
you like; it only ever adds what is missing, and never removes anyone.

    python3 _tools/sync-kit.py            # show what it would add, change nothing
    python3 _tools/sync-kit.py --add      # actually add them
"""

import argparse
import csv
import glob
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request

HOME = os.path.expanduser("~")
MEMBERS = os.path.join(HOME, "Library/CloudStorage/Dropbox/For-Claude/members")
FALLBACK = os.path.join(HOME, "Dropbox/For-Claude/members")
TAG_MEMBERS = 24346919          # the "Members" tag in his account
API = "https://api.convertkit.com/v3"


def creds():
    """Kit keys live beside the Netlify token, not in this file."""
    for name in (".kit_api_secret", ".convertkit_secret"):
        p = os.path.join(HOME, name)
        if os.path.exists(p):
            secret = open(p).read().strip()
            break
    else:
        secret = os.environ.get("KIT_API_SECRET", "")
    for name in (".kit_api_key", ".convertkit_key"):
        p = os.path.join(HOME, name)
        if os.path.exists(p):
            key = open(p).read().strip()
            break
    else:
        key = os.environ.get("KIT_API_KEY", "")
    if not (secret and key):
        sys.exit("Kit keys not found. Put the secret in ~/.kit_api_secret and the "
                 "key in ~/.kit_api_key, or set KIT_API_SECRET and KIT_API_KEY.")
    return key, secret


def get(url):
    with urllib.request.urlopen(url, timeout=30) as r:
        return json.load(r)


def post(url, payload):
    req = urllib.request.Request(url, data=json.dumps(payload).encode(),
                                 headers={"Content-Type": "application/json"},
                                 method="POST")
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)


def master_list():
    """The newest dated CSV that pull-subscribers.py wrote."""
    for d in (MEMBERS, FALLBACK):
        files = sorted(glob.glob(os.path.join(d, "members-*.csv")))
        if files:
            return files[-1]
    sys.exit("No members CSV found. Run _tools/pull-subscribers.py first.")


def read_people(path):
    people = {}
    with open(path, newline="", encoding="utf-8") as fh:
        for row in csv.DictReader(fh):
            email = (row.get("email") or "").strip().lower()
            if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email):
                continue
            # never re-add somebody who asked to leave
            if (row.get("consent") or "").strip().lower() in ("unsubscribed", "bounced", "complained"):
                continue
            people[email] = (row.get("first_name") or "").strip()
    return people


def kit_emails(secret):
    """Everyone Kit already knows about.

    Read the Members TAG, not /subscribers. /subscribers returns only
    confirmed people, so somebody added and not yet confirmed looks absent and
    gets added again on every run. The tag shows them immediately.
    Cancelled subscribers are included deliberately, so an unsubscribe is
    never resurrected.
    """
    have, page = set(), 1
    while True:
        d = get(f"{API}/tags/{TAG_MEMBERS}/subscriptions"
                f"?api_secret={secret}&per_page=1000&page={page}")
        rows = d.get("subscriptions", [])
        if not rows:
            break
        for row in rows:
            sub = row.get("subscriber") or {}
            e = (sub.get("email_address") or "").strip().lower()
            if e:
                have.add(e)
        if page >= d.get("total_pages", 1):
            break
        page += 1
    # and anyone confirmed but not tagged, so they are not added twice either
    page = 1
    while True:
        d = get(f"{API}/subscribers?api_secret={secret}&per_page=1000&page={page}")
        rows = d.get("subscribers", [])
        if not rows:
            break
        for s in rows:
            e = (s.get("email_address") or "").strip().lower()
            if e:
                have.add(e)
        if page >= d.get("total_pages", 1):
            break
        page += 1
    return have


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--add", action="store_true", help="actually subscribe them")
    args = ap.parse_args()
    key, secret = creds()

    path = master_list()
    people = read_people(path)
    have = kit_emails(secret)
    missing = {e: n for e, n in people.items() if e not in have}

    print(f"  master list : {os.path.basename(path)} — {len(people)} people")
    print(f"  already in Kit: {len(have)}")
    print(f"  to add      : {len(missing)}")
    for e in sorted(missing)[:12]:
        print("     ", e)
    if len(missing) > 12:
        print(f"      … and {len(missing)-12} more")

    if not missing:
        print("\n  Kit is up to date.")
        return 0
    if not args.add:
        print("\n  Nothing changed. Run again with --add to subscribe them.")
        return 0

    added = failed = 0
    for email, first in sorted(missing.items()):
        payload = {"api_key": key, "email": email}
        if first:
            payload["first_name"] = first
        try:
            post(f"{API}/tags/{TAG_MEMBERS}/subscribe", payload)
            added += 1
        except urllib.error.HTTPError as e:
            failed += 1
            print(f"     failed {email}: {e.code} {e.read()[:80].decode(errors='replace')}")
        time.sleep(0.4)          # their rate limit is not generous
    print(f"\n  added {added}" + (f", {failed} failed" if failed else ""))
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
