# Email capture + "share your thoughts" — the decision

**The constraint:** static sites on GitHub Pages. No server, no Netlify Forms, no PHP.
**The other constraint, which matters more:** Tony is done with third-party accounts, dashboards,
double opt-in dances, and subscriber statuses. Whatever we pick has to be something he can set up
once and then never log into again.

**The working inbox:** wisdom@ancestralwatch.com (Hostinger).

---

## The comparison

| Option | Account to create? | Must log in later? | Emails wisdom@ directly? | Handles BOTH email capture + free-text thoughts? | Cost | Setup friction |
|---|---|---|---|---|---|---|
| **Web3Forms** ✅ | **No account.** Type your email on their homepage, they email you an access key. That's it. | **No.** Everything arrives in the inbox. (A dashboard exists; ignoring it costs nothing.) | **Yes** — submissions land in wisdom@ as a normal email, reply-to set to the reader. | **Yes** — one form, one endpoint. Email field + a big free-text field, same submission. | Free for **250 submissions/month**. Paid from ~$12/mo only if he ever blows past that. | ~3 minutes. Paste one key into one line of HTML. |
| Google Forms (embedded iframe) | None new — he has Google | Yes, to read responses (or turn on per-response email alerts) | Only if he enables "Get email notifications for new responses"; alerts go to his **Google** address, not wisdom@ | Yes | Free, unlimited | Low friction to *create*, high friction to *live with* — the iframe cannot be styled, ignores his fonts and canyon palette, and scrolls inside itself on phones. It will look like a Google form bolted onto his book. |
| Google Forms (custom HTML posting to `formResponse`) | None new | Yes, to read the Sheet | No, not without extra wiring | Yes | Free | Looks right, but depends on scraping `entry.XXXX` field IDs and an undocumented endpoint that Google can change without warning. Fragile. Not for a client who wants to stop thinking about this. |
| **Formspree** | Yes — account + password | Yes | Yes | Yes | Free tier is **50 submissions/month per form** — thin | Comparable to Web3Forms but with an account he doesn't want |
| **Tally** | Yes — account + password | Yes, to read responses | Only via notification settings | Yes, and it's genuinely nice | Free, **unlimited** submissions | The best *hosted* form product here. But it's another dashboard, and embedding it is another iframe. |
| **Typeform** | Yes | Yes | Notifications only | Yes | Free plan was cut to **10 responses/month** in Feb 2026 | Effectively a demo. Rule it out. |
| **Buttondown** | Yes | Yes — it's a newsletter tool, he writes in it | It sends *from* him, doesn't collect *to* him | Email capture only | Free to 100 subscribers | Lovely, minimal, markdown-first. Still a dashboard, still subscriber management. |
| **Kit (ConvertKit)** | Yes | Yes | No | Email capture only | Free to 10,000 subscribers | Generous, but it is MailerLite's cousin — the exact machine he just rejected |
| **Plain `mailto:`** | None | No | Yes, obviously | Yes, but the reader has to compose it themselves | Free | Zero setup, zero maintenance, **and a real drop-off**: mobile users with no mail app configured hit a dead end, and "write me a letter" is a bigger ask than "type in a box" |

---

## The recommendation

# Web3Forms — with `mailto:` shown right beside it.

It is the only option on the list that requires **no account, no password, and no dashboard**, and it
is the only one that puts a reader's reflection into **wisdom@ancestralwatch.com** as an ordinary
email he can just reply to. No subscriber statuses. No confirmation emails. No opt-in dance. A
reader types, hits send, and Tony gets a letter.

The email list, then, is not a list at all — it's a folder in his inbox. When he eventually wants to
write to those people, he exports the addresses from the folder and pastes them into BCC, or *then*
signs up for Buttondown having already earned the subscribers. He is not obligated to decide that
today, which is the whole point.

And because the form is plain HTML posting to an endpoint, **it looks like his site** — Fraunces
headings, canyon palette, his voice. Not a Google iframe.

### Why the `mailto:` stays on the page

Belt and braces. If Web3Forms ever hiccups, hits its 250/month, or a reader simply prefers writing a
real letter, wisdom@ancestralwatch.com is right there in gold type. It costs nothing and it never
breaks.

---

## The exact setup — three minutes, once

**1. Get the key.**
Go to **https://web3forms.com**. On the homepage there's a single box: *"Enter your email address."*
Type `wisdom@ancestralwatch.com` and press the button.

**2. Check that inbox.**
An email arrives with an **Access Key** — a long string like
`a1b2c3d4-e5f6-7890-abcd-ef1234567890`. That key *is* the account. There is no password to make and
nothing to remember. (The key is safe to put in public HTML — it's just an alias for his email
address, not a secret.)

**3. Paste it into one line.**
Open `/v2/circle/index.html`. At the very top of the file there is a clearly marked block:

```html
<!-- ============================================================
     ⚙️  THE ONE LINE YOU CHANGE
     Paste the Web3Forms access key between the quotes below.
     ============================================================ -->
```

Replace `PASTE-YOUR-WEB3FORMS-ACCESS-KEY-HERE` with the key. Save. Push. Done.

**4. Test it.**
Load the page, write yourself a note, hit send. It should arrive at wisdom@ancestralwatch.com within
a few seconds with the subject **"🔥 Someone added to the fire"**. Hitting Reply replies to the
reader, because the form sets reply-to automatically.

That's the whole thing. There is nothing to log into afterward, ever.

### If he wants the same form on ancestralwatch.com

Same key. Copy the page to `/v2/circle/` over there and change the header links. One key can serve
unlimited forms across both sites, and every submission lands in the same inbox.

### If it ever outgrows the free tier

250 submissions a month is a lot of letters. If that day comes, the honest upgrade path is either
$12/mo to Web3Forms, or — better — that's the moment the list is real enough to justify Buttondown,
and he'll be moving addresses he already earned.

---

## Sources

- [Web3Forms](https://web3forms.com/) · [Web3Forms pricing](https://web3forms.com/pricing) · [Web3Forms docs](https://docs.web3forms.com/getting-started/installation)
- [Formspree account limits](https://help.formspree.io/articles/account-management/account-limits) · [Formspree free plan limits 2026](https://splitforms.com/formspree-free-plan-limits)
- [Tally pricing](https://tally.so/pricing) · [Tally as a free Typeform alternative](https://tally.so/help/tally-a-free-typeform-alternative)
- [Typeform pricing 2026](https://formnx.com/typeform-pricing)
- [Kit free plan 2026](https://www.passivekit.com/kit-free-plan/) · [Buttondown pricing](https://mailtoolfinder.com/pricing/buttondown/)
- [Embedding Google Forms — styling limits](https://paperform.co/google-forms/embed-forms/) · [Custom HTML posting to Google Forms](https://pqvst.com/2021/12/28/custom-google-forms/)
- [Best free form backend services 2026](https://splitforms.com/blog/best-free-form-backend-services-2026)
