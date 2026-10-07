#!/usr/bin/env python3
"""Send the letter. No copying, no pasting, no Mail.app.

Tony, 6 October, after twenty minutes of macOS: "there is no space.. and this
should be automatic."

He is right. This sends the members' letter over SMTP from
tony.tribeawaken@gmail.com, everyone in Bcc, HTML with a plain-text fallback,
straight from his own machine. It needs one credential, once: a Google app
password at ~/.aw_gmail_app_password. Nothing else, ever again — the Sunday
letter can call this and be done.

  python3 _tools/send-letter.py <letter.html> [--subject "..."] [--to me]

--to me sends only to him, so he can see it land in a real inbox before the
seventy do. That is the default. Add --to all to send it for real; it prints
the count and waits for a typed yes first, because this cannot be undone.
"""
import os, sys, csv, glob, ssl, smtplib, argparse, re, html as H
from email.message import EmailMessage

HOME   = os.path.expanduser("~")
SENDER = "tony.tribeawaken@gmail.com"
NAME   = "Tony Skrelūnas"
PWFILE = os.path.join(HOME, ".aw_gmail_app_password")

def members():
    pats = [os.path.join(HOME, "Desktop", "MEMBERS-LIST-CURRENT.csv"),
            os.path.join(HOME, "Desktop", "IMPORT-THIS-LIST-70-subscribers-*.csv")]
    for pat in pats:
        for f in sorted(glob.glob(pat)):
            out = []
            for row in csv.DictReader(open(f, encoding="utf-8-sig", errors="ignore")):
                e = (row.get("email") or "").strip().lower()
                if "@" in e: out.append(e)
            if out: return sorted(set(out)), f
    raise SystemExit("  no member list found")

def plain(html):
    t = re.sub(r"<(script|style)[^>]*>.*?</\1>", "", html, flags=re.S | re.I)
    t = re.sub(r"<br\s*/?>|</p>|</div>|</tr>", "\n", t, flags=re.I)
    t = H.unescape(re.sub(r"<[^>]+>", "", t))
    return re.sub(r"\n{3,}", "\n\n", re.sub(r"[ \t]+", " ", t)).strip()

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("letter")
    ap.add_argument("--subject", default="The horse is back")
    ap.add_argument("--to", choices=["me", "all"], default="me")
    a = ap.parse_args()

    if not os.path.exists(PWFILE):
        raise SystemExit(
            "  No app password yet.\n"
            "  Google Account > Security > 2-Step Verification > App passwords,\n"
            "  signed in as %s. Save the 16 characters to:\n"
            "    %s\n" % (SENDER, PWFILE))
    pw = open(PWFILE).read().strip().replace(" ", "")
    body = open(a.letter, encoding="utf-8").read()

    if a.to == "me":
        rcpts = [SENDER]
        print("  REHEARSAL — sending only to %s" % SENDER)
    else:
        rcpts, src = members()
        print("  %d members, from %s" % (len(rcpts), os.path.basename(src)))
        print("  This cannot be undone.")
        if input("  Type yes to send: ").strip().lower() != "yes":
            raise SystemExit("  nothing sent")

    m = EmailMessage()
    m["Subject"] = a.subject
    m["From"] = "%s <%s>" % (NAME, SENDER)
    m["To"] = "%s <%s>" % (NAME, SENDER)      # Bcc carries the rest
    m["Reply-To"] = SENDER
    m.set_content(plain(body))
    m.add_alternative(body, subtype="html")

    ctx = ssl.create_default_context()
    with smtplib.SMTP("smtp.gmail.com", 587, timeout=40) as s:
        s.starttls(context=ctx)
        s.login(SENDER, pw)
        s.send_message(m, from_addr=SENDER, to_addrs=rcpts)
    print("  sent to %d address(es) as %s" % (len(rcpts), SENDER))

if __name__ == "__main__":
    main()
