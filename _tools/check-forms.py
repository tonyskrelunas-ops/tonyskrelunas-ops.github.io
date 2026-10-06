#!/usr/bin/env python3
"""Monday morning: do the forms still work?

Tony, 6 October, after a week in which every submission was silently thrown
away: "lets make it a rule to chekc these on monday mornnigns too."

The failure that prompted this was invisible from the outside. Netlify returned
200, the reader was thanked, and the submission went in the bin, because
capture.js was copying an unchecked checkbox's value ("on") into the spam
honeypot. Every curl test I ran passed, because curl never sent that field.

So this checks three things, in the order they can break:

  1  THE CONTRACT. Reads the live capture.js and asserts it still refuses to
     send a honeypot value for an unchecked box. A static read, because this
     is the exact regression that cost a week.
  2  THE ENDPOINT. Posts a real signup and a real enquiry, confirms each lands
     in its own pile with its fields intact, then deletes them.
  3  THE TRAP. Posts one with the honeypot filled and confirms it is REJECTED.
     A honeypot that no longer catches anything is as broken as one that
     catches everything.

Exits non-zero if anything fails, so the workflow goes red.

Run:  python3 _tools/check-forms.py
"""
import os, re, sys, json, time, urllib.request, urllib.parse

HOME  = os.path.expanduser("~")
TOKEN = (os.environ.get("NETLIFY_TOKEN")
         or open(os.path.join(HOME, ".aw_netlify_token")).read()).strip()
SITE  = "f41ce288-9755-4f2e-ad20-13e099810be6"
ENDPOINT = "https://tribeawaken-capture.netlify.app/"
CAPTURE  = "https://tribeawaken.com/js/capture.js"
STAMP = str(int(time.time()))
fails = []

def api(path, method="GET"):
    r = urllib.request.Request("https://api.netlify.com/api/v1" + path,
                               headers={"Authorization": "Bearer " + TOKEN}, method=method)
    with urllib.request.urlopen(r, timeout=30) as u:
        return json.load(u) if method == "GET" else None

# Netlify quietly drops anything whose user agent looks like a script — a
# Python-urllib post answers 200 and is never recorded, which cost this check
# two false alarms before I spotted it. The check has to arrive looking like
# the reader it is standing in for.
BROWSER_UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
              "(KHTML, like Gecko) Chrome/140.0 Safari/537.36")

def post(fields):
    data = urllib.parse.urlencode(fields).encode()
    r = urllib.request.Request(ENDPOINT, data=data, headers={
        "Content-Type": "application/x-www-form-urlencoded",
        "Origin": "https://tribeawaken.com",
        "Referer": "https://tribeawaken.com/magazine/",
        "User-Agent": BROWSER_UA})
    with urllib.request.urlopen(r, timeout=30) as u:
        return u.status

def submissions():
    return api(f"/sites/{SITE}/submissions?per_page=100")

def cleanup(mark):
    for s in submissions():
        if mark in (s.get("email") or ""):
            api("/submissions/" + s["id"], method="DELETE")

print("1 — the contract")
js = urllib.request.urlopen(urllib.request.Request(CAPTURE + "?t=" + STAMP,
        headers={"User-Agent": "TribeAwaken-check/1.0"}), timeout=30).read().decode()
if "bot.checked" not in js:
    fails.append("capture.js no longer guards the honeypot against an unchecked box "
                 "— the bug that threw a week of submissions away can recur")
    print("   FAIL  the unchecked-checkbox guard is gone")
else:
    print("   ok    capture.js still refuses to fill the honeypot")

print("2 — the endpoint")
cleanup("formcheck-")
post({"form-name":"tribe-capture","email":f"formcheck-signup-{STAMP}@tribeawaken.com",
      "bot-field":"","source":"monday-check","edition":"en","page":"/magazine/"})
post({"form-name":"tribe-enquiry","email":f"formcheck-enquiry-{STAMP}@tribeawaken.com",
      "bot-field":"","name":"Monday Check","subject":"Press",
      "message":"Weekly check that an enquiry still arrives whole.",
      "source":"monday-check","page":"/contact/"})
# Netlify records a submission a good while after it answers 200, so this
# waits on the result instead of guessing at it. Twelve seconds was not
# enough and produced a false alarm on the first run.
got = {}
for _ in range(12):
    time.sleep(6)
    got = {s.get("form_name"): s for s in submissions() if "formcheck-" in (s.get("email") or "")}
    if len(got) >= 2: break
for form, want in (("tribe-capture","a magazine signup"), ("tribe-enquiry","an enquiry")):
    if form not in got:
        fails.append(f"{want} did not arrive in {form}")
        print(f"   FAIL  {want} never landed")
    else:
        print(f"   ok    {want} landed in {form}")
if "tribe-enquiry" in got:
    d = got["tribe-enquiry"].get("data") or {}
    missing = [f for f in ("name","subject","message") if not d.get(f)]
    if missing:
        fails.append("an enquiry arrived without " + ", ".join(missing))
        print("   FAIL  enquiry lost:", ", ".join(missing))
    else:
        print("   ok    the enquiry kept its name, subject and message")

print("3 — the trap")
post({"form-name":"tribe-capture","email":f"formcheck-bot-{STAMP}@tribeawaken.com",
      "bot-field":"i am a robot","source":"monday-check"})
for _ in range(5):
    time.sleep(6)
    if any(f"formcheck-bot-{STAMP}" in (s.get("email") or "") for s in submissions()): break
if any(f"formcheck-bot-{STAMP}" in (s.get("email") or "") for s in submissions()):
    fails.append("the honeypot let a filled submission through — spam is no longer caught")
    print("   FAIL  a filled honeypot was accepted")
else:
    print("   ok    a filled honeypot is still rejected")

cleanup("formcheck-")
print()
if fails:
    print("FORMS ARE BROKEN:")
    for f in fails: print("  -", f)
    sys.exit(1)
print("All three pass. Signups and enquiries both arrive, and the trap still works.")
