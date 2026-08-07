# The Mail System

**What this is:** how words typed on tonyskrelunas.com / ancestralwatch.com get into
`wisdom@ancestralwatch.com`, and why it is built the way it is.

**Verified:** August 2026. Every limit below was checked against the provider this month, not
remembered.

---

## The constraints, in order of how much they matter

1. **No accounts.** No password to invent, no dashboard to log into, no subscriber statuses, no
   double opt-in. This is the constraint that kills most of the field.
2. **Static hosting.** The site is HTML on GitHub Pages. No server, no PHP, no Netlify Forms.
3. **It must land in `wisdom@ancestralwatch.com`** — the Hostinger inbox that actually gets read.
4. **Never `mailto:` on submit.** A third-party app on Tony's Mac hijacks every `mailto:` and throws
   a paywall popup. A form that fires a `mailto:` when you press Send is broken on his own machine
   and on every phone without a configured mail app. This is a hard rule, not a preference.
5. **It has to look like his site.** Dark canyon palette, Fraunces, Hanken Grotesk. No white iframe.

---

## The comparison

| | Account? | Ever log in? | Straight to wisdom@? | Free tier | Spam | Looks like his site? |
|---|---|---|---|---|---|---|
| **Web3Forms** | **No account.** Type an email on their homepage, they mail you an access key. That key *is* the credential. | **No.** Everything arrives as email. | **Yes.** The key is bound to the address you entered. Reply-To is set to the reader automatically. | **250 submissions/month** | Server-side spam filter included free; `botcheck` honeypot field supported; hCaptcha/Turnstile optional | **Yes** — plain HTML, our CSS |
| Formspree | Yes, account + password | Yes | Yes | **50/month per form** — thin | Built-in filtering + reCAPTCHA | Yes |
| Getform → **Forminit** | Yes | Yes | Yes | **100/month, 1 form** (Getform rebranded to Forminit in mid-2026 — getform.io now redirects) | Included | Yes |
| Tally | Yes | Yes, to read responses properly | Notification emails only, and custom-domain sending is Pro | **Unlimited** submissions, genuinely | Good | No — it's an iframe embed |
| Google Forms (iframe) | None new | Yes, to read the Sheet | Only via notifications, and natively **only to his Google address** — sending to wisdom@ needs the Email Notifications add-on | Free, unlimited | Google's | **No.** The iframe can't be styled, ignores his fonts, and scrolls inside itself on phones |
| Google Forms (custom HTML → `formResponse`) | None new | Yes | No | Free | None | Yes, but it depends on scraped `entry.XXXXX` IDs and an undocumented endpoint. Fragile |

**Ruled out and why:**
Typeform — free plan is 10 responses/month. MailerLite, Kit, Buttondown — newsletter tools with
subscriber management, which is the exact machine that already got rejected. Plain `mailto:` as the
*submit action* — see constraint 4.

---

## The recommendation

# Web3Forms.

It is the only option in the table that clears constraint 1 outright. There is no account, no
password, and nothing to log into — the access key that arrives by email *is* the whole
relationship. Submissions land in `wisdom@ancestralwatch.com` as ordinary email, and hitting Reply
replies to the reader, because Web3Forms sets Reply-To from the email field automatically.

250 submissions a month is a lot of letters from readers. Tally's unlimited tier is the only
materially better number, and it costs an account plus an iframe that will never look like his site.
That trade isn't worth it.

**The email list is therefore not a list. It's a folder in his inbox.** When there are enough names
in it to be worth writing to, he exports them then — having already earned them — and that is the
right moment to decide about a newsletter tool, not today.

`wisdom@ancestralwatch.com` also appears large and in gold on both pages as a permanent alternative.
It is a link a reader can choose to click, never something the Send button does.

---

## Setup — three minutes, on a phone, once

**1.** Open **web3forms.com**. There is one box on the homepage: *Enter your email address*.
Type `wisdom@ancestralwatch.com`. Press the button.

**2.** Open that inbox. An email arrives with an **Access Key** — a long string like
`a1b2c3d4-e5f6-7890-abcd-ef1234567890`. There is no password to make. Nothing to remember.
The key is safe to publish in HTML: it is an alias for the email address, not a secret.

**3.** Open `/v2/assets/forms.js`. Line 14 or so, at the very top, clearly marked:

```js
ACCESS_KEY: "PASTE-YOUR-WEB3FORMS-ACCESS-KEY-HERE",
```

Paste the key between the quotes. Save. Push.

**4.** Load `/v2/circle/`, write yourself a note, press Send. It arrives at
`wisdom@ancestralwatch.com` within seconds, subject **"Someone added to the fire"**.

That is the entire system. Nothing to log into afterward, ever.

---

## Notes for later

**Swapping providers is one line.** The endpoint and key live in a single `MAIL` object at the top
of `/v2/assets/forms.js`. Change `ENDPOINT` and `ACCESS_KEY` and every form on the site follows.

**Both sites, one key.** The same access key can serve unlimited forms across
tonyskrelunas.com and ancestralwatch.com. Everything lands in the same inbox.

**Before the key is pasted in,** the forms don't pretend to work and they don't fire a `mailto:`.
They show an honest inline message pointing at the address. No popups, no hijack.

**If 250/month is ever exceeded** — a good problem — it's $18/mo to Web3Forms Pro, or that's the
month the list became real enough to justify a proper newsletter tool.

---

## Sources

- [Web3Forms installation docs](https://docs.web3forms.com/getting-started/installation) · [Web3Forms docs index](https://docs.web3forms.com/llms.txt) · [Web3Forms free plan / 250 per month](https://formtorch.com/compare/web3forms) · [Formspree vs Web3Forms](https://splitforms.com/blog/web3forms-vs-formspree-vs-splitforms)
- [Formspree account limits](https://help.formspree.io/articles/account-management/account-limits) · [Formspree free plan 2026](https://splitforms.com/formspree-free-plan-limits)
- [Getform → Forminit rebrand and free plan](https://www.formbackend.com/alternatives/getform) · [Getform alternatives 2026](https://formgrid.dev/blog/getform-alternatives-in-2026-cheaper-open-source-and-self-hostable)
- [Tally pricing](https://tally.so/pricing) · [Tally free vs Pro email notifications](https://tally.so/help/tally-a-free-typeform-alternative)
- [Google Forms response notifications](https://support.google.com/docs/answer/139706) · [Email Notifications add-on — sending to other addresses](https://digitalinspiration.com/docs/form-notifications/email-multiple-people)
