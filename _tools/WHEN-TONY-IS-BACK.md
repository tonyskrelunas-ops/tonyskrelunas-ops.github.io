# Re-check before anything else — 6 October 2026

Tony asked for a double check when he logs on. Run these, do not assume.

## 1. The two checks, in this order

    python3 _tools/check-forms.py          # a real signup and enquiry must land
    python3 _tools/check-pages.py          # 19 key pages: contrast, overflow, footers
    python3 _tools/check-pages.py --width 390 --pages / /magazine/ /journal/

All three were green on 6 October. `check-pages.py` takes about five minutes
(one browser per page — /listen/ has YouTube embeds that hang a shared one).

## 2. Spot-check what changed today, live

    /es/                     exists, Spanish nav and footer, Lithuanian link present
    /magazine/               subscribe heading white on blue; a footer exists
    /magazine/india/         India and Tibet both in the edition switcher
    /teams/                  lawn council photo, not the restaurant one
    /healing/                hero is the fire circle
    /v2/ /v3/ /v4/           must be 404
    /speaking/               lands on /keynotes/, not the homepage

## 3. Still open, his call

- Rancho La Puerta email is on his Desktop, needs the contact name and address.
  Two asks: the Japanese wording ("apprenticed to", "Japanese by choice"), and a
  stray "and soon to be announced" left in a published sentence. The 45
  communities figure is CORRECT — he confirmed it; my note saying 100+ was wrong.
- The Kit letter (broadcast 26279948) is still an unsent draft, 70 recipients.
  The "A word about where I have been" paragraph was written but Kit's v3 API
  accepted it and silently dropped it; the v4 key is rejected. It needs pasting
  into Kit's own editor by hand.
- Deep pages at phone width were never checked beyond the three above.

## 4. What not to do again

Read `tribeawaken-css-trap` in memory first. A class-based CSS fix here loses
silently to v2.css's #id rules; `.ftr` is navy on the homepage and cream on
interiors; and a headless screenshot lies about clipping — measure with
getBoundingClientRect, never trust the picture.
