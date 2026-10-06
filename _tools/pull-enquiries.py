#!/usr/bin/env python3
"""The week's enquiries, in one place, for one sitting.

Tony, 6 October: "we can give a public place for people to submit too .. i
would like that to go to one area .. where i can focus on once a week... or
one of our agents."

So the public form posts to its own pile — tribe-enquiry, separate from the
magazine signups, which need no reply — and this writes that pile out as one
readable page: who wrote, what about, what they said, and the page they were
on when they asked. Nothing is marked answered automatically; that is his to
do, and the file says plainly which ones are still open.

Writes ~/Desktop/ENQUIRIES-THIS-WEEK.md and archives a dated copy.

Run:  python3 _tools/pull-enquiries.py
"""
import os, json, datetime, urllib.request

HOME  = os.path.expanduser("~")
TOKEN = open(os.path.join(HOME, ".aw_netlify_token")).read().strip()
SITE  = "f41ce288-9755-4f2e-ad20-13e099810be6"
DESK  = os.path.join(HOME, "Desktop", "ENQUIRIES-THIS-WEEK.md")
ARCH  = os.path.join(HOME, "Library/CloudStorage/Dropbox/For-Claude/enquiries")

def api(path):
    r = urllib.request.Request("https://api.netlify.com/api/v1" + path,
                               headers={"Authorization": "Bearer " + TOKEN})
    with urllib.request.urlopen(r, timeout=30) as u:
        return json.load(u)

def main():
    forms = {f["name"]: f["id"] for f in api(f"/sites/{SITE}/forms")}
    fid = forms.get("tribe-enquiry")
    if not fid:
        print("  no enquiry form on the endpoint yet"); return
    subs = api(f"/forms/{fid}/submissions?per_page=100")
    week = (datetime.date.today() - datetime.timedelta(days=7)).isoformat()
    recent = [s for s in subs if (s.get("created_at") or "")[:10] >= week]

    L = ["# Enquiries — week to %s" % datetime.date.today().isoformat(), ""]
    if not recent:
        L += ["Nothing came in this week.", ""]
    else:
        L += ["%d to answer. Oldest first." % len(recent), ""]
        for s in sorted(recent, key=lambda x: x.get("created_at") or ""):
            d = s.get("data") or {}
            L += ["---", "",
                  "**%s** &lt;%s&gt;" % (d.get("name") or "no name", s.get("email") or d.get("email") or "no address"),
                  "",
                  "*%s* · %s · from %s" % (d.get("subject") or "no subject",
                                           (s.get("created_at") or "")[:16].replace("T", " "),
                                           d.get("page") or "—"),
                  "", (d.get("message") or "").strip() or "_no message_", ""]
    older = len(subs) - len(recent)
    if older:
        L += ["---", "", "_%d older enquiries are still in the dashboard._" % older, ""]
    L += ["", "The full record, with everything before this week:",
          "<https://app.netlify.com/projects/tribeawaken-capture/forms>", ""]

    txt = "\n".join(L)
    open(DESK, "w", encoding="utf-8").write(txt)
    os.makedirs(ARCH, exist_ok=True)
    open(os.path.join(ARCH, "enquiries-%s.md" % datetime.date.today().isoformat()),
         "w", encoding="utf-8").write(txt)
    print("  enquiries this week : %d   (%d older in the dashboard)" % (len(recent), older))
    print("  written to          : %s" % DESK)

if __name__ == "__main__":
    main()
