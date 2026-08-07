# Content Completeness Audit — live site vs. /v2/

**Date:** 2026-08-07
**Scope:** every distinct section, named offering, named person, named practice, price, date, logistical fact and CTA on the live pages, checked against the v2 rebuild.
**Baseline for v2:** commit `850faac` ("Add v2 preview build").

**Design constraint applied while restoring:** content only. No collages, no new photo grids. Every item below was restored as text and typographic structure. **Zero new images were added to `/v2/workshop/`; exactly one was added to `/v2/teams/`** (a single portrait for the guide bio, which had no image at all).

---

## 1. `/workshop/` → `/v2/workshop/`

| # | Live section / item | Survived in v2? | Action taken |
|---|---|---|---|
| 1 | Hero — title, Aug 28–30 2026, 1440 Multiversity Scotts Valley CA, 18 seats, register CTA | ✅ Yes | — |
| 2 | Facts strip (dates / place / seats / from $1,100) | ✅ Yes (v2 addition) | — |
| 3 | The invitation — "down into the canyon, then up into the harvest" | ✅ Yes | — |
| 4 | **A change of frequency** — Mother Tree, three cultures (Diné / Baltic song-keepers / Japanese stillness), "Regulate first" | ⚠️ Partial — frequency pull-quote survived, the three-cultures braid and Mother Tree were dropped | **Restored** as an intro paragraph on *The practices* |
| 5 | **Who comes to the canyon** — five personas: the woman who gives everything · the one in a hard passage · the daughter finding her footing · the elder · the seeker | ❌ **Dropped entirely** | **Restored** as its own section, five text tiles + the "you don't need to be fit / intergenerational" note |
| 6 | **Three-day arc — Friday: Arrival & Threshold** (check-in, Ancestral Watch tee, the smooth stone, ~4pm creek, land acknowledgement, opening circle, dinner, fireside, **Stone Breath**, first meditation, stories) | ⚠️ Partial — v2 had a generic 3-sentence Friday and had renamed the day "The Descent" | **Rewritten** to the live day name *Arrival & Threshold*, with all beats restored as a detail list |
| 7 | **Saturday: The Descent & The Harvest** (early meditative hike, a signature class, **THE DESCENT — The Canyon Within, facilitated by Tony**, Ancestral Kitchen, **Harvest Table**, fireside songs/stories/dance) | ⚠️ Partial — the facilitated Descent, the Harvest Table and the early hike were all missing | **Restored** in full; day retitled to the live name |
| 8 | **Sunday: Carry It Home** (meditation by the creek, ~10am **Embody · Activate · Carry Home**, **boxed lunches**) | ⚠️ Partial — the named session and boxed lunches were missing | **Restored** |
| 9 | "Sample flow — times confirmed at check-in; signature classes from 1440's offerings" | ❌ Dropped | **Restored** as a footnote under the arc |
| 10 | Land acknowledgement to the **Amah Mutsun** — in the Friday opening | ✅ Yes | Also re-stated inside the Friday beats |
| 11 | Land acknowledgement — **standalone honoring near the close** | ❌ Dropped (only a footer one-liner remained) | **Restored** as an "In honoring" section before the final CTA, with the Mutsun and Awaswas-speaking peoples named |
| 12 | Signature classes: meditation, qigong, sound baths, forest walks, tai chi | ✅ Yes | — |
| 13 | **THE ANCESTRAL KITCHEN — Missy & Henry Webster, a Navajo family from Gray Mountain, Arizona; blue corn, juniper ash, frybread; "cooking is a lineage you can taste"; food as medicine** | ⚠️ **Badly under-weighted** — present only as a half-width sub-panel titled "Food is the oldest medicine on the mountain", with the Kitchen name demoted to an eyebrow and the "lineage you can taste" line missing | **Rebuilt as a full headline section** (`#ancestral-kitchen`): eyebrow "Food is medicine", H2 "The Ancestral Kitchen.", lead "Cooking is a lineage you can taste.", two-column body, plus a four-item detail row (Missy & Henry Webster · blue corn/juniper ash · frybread · the Harvest Table) |
| 14 | **Seasonal healing diet — every meal locally sourced, Friday dinner through Sunday lunch** | ⚠️ Partial — "a seasonal healing diet" survived; "locally sourced" and "Friday dinner through Sunday lunch" were both dropped | **Restored** verbatim, in both the Kitchen section and the package list |
| 15 | **What you carry home** — Stone Breath · The Canyon Within · gratitude & reflection · story & journal · belonging · the harvest table | ❌ **Dropped entirely** (Stone Breath appeared nowhere on the v2 page) | **Restored** as its own six-item section |
| 16 | Tony's guide bio + Masan | ✅ Yes | — |
| 17 | The video (`/assets/video/tony-invitation.mp4`) | ✅ Yes | — |
| 18 | **Praise — Carmella Kahn, DrPH, MPH (University of New Mexico)** | ❌ Dropped | **Restored** |
| 19 | **Praise — Emily Affolter, PhD** | ❌ Dropped | **Restored** |
| 20 | Price: **from $1,100 + tax ($430/night + $240 tuition)** | ⚠️ Partial — "$1,100 + tax" survived; the $430 + $240 breakdown was dropped | **Restored** in a price panel |
| 21 | Day passes — Friday evening / Saturday / Sunday morning | ✅ Yes | Pass copy updated to name the restored sessions (The Descent, Harvest Table, Embody · Activate · Carry Home) |
| 22 | **Included: digital copy of *Stone Breath*** | ❌ Dropped | **Restored** |
| 23 | **Included: a printed Ancestral Watch journal** | ❌ Dropped | **Restored** |
| 24 | **Included: all meals / accommodations / daily signature classes** | ❌ Dropped | **Restored** |
| 25 | **Included: campus amenities incl. four miles of trails** | ❌ Dropped | **Restored** |
| 26 | **Nonprofit campus — bookings fund scholarships and community programs** | ❌ Dropped | **Restored** |
| 27 | "Confirm current dates & rates on the 1440 registration page" | ❌ Dropped | **Restored** |
| 28 | **FAQ — six questions** (fit/hiker · coming alone · part of it · no experience needed · not religious · what to bring) | ❌ **Dropped entirely** | **Restored** — all six, as an accordion |
| 29 | Register link `https://www.1440.org/the-canyon-within-082826` | ✅ Yes (4 places) | — |
| 30 | Closing blessing — "Hózhó · Darna · Wa — walk in beauty." | ❌ Dropped | **Restored** under the final CTA |

**Net for /v2/workshop/:** 11 items were entirely absent and 6 more were materially incomplete. All 17 restored.

---

## 2. `/teams/` → `/v2/teams/`

| # | Live section / item | Survived in v2? | Action taken |
|---|---|---|---|
| 1 | Hero — The Far Messenger Program, 2.5–3 day immersive | ✅ Yes | — |
| 2 | The promise — "every person already carries a Far Messenger" | ✅ Yes | — |
| 3 | Harder terrain / Far Messenger resilience is trainable | ✅ Yes | — |
| 4 | **"The best teams don't run on pressure — they run on coherence"** | ❌ Dropped | **Restored** as a paragraph in *Why now* |
| 5 | **"For teams ready to rise" — three audiences** (leadership teams ready for more · organizations investing in their people · teams entering a big season) | ❌ **Dropped entirely** | **Restored** as its own "Who this is for" section, three text tiles |
| 6 | The arc — Day 1 Arrive / Day 2 Awaken / Day 3 Carry, incl. land acknowledgement on day one and the 30/60/90 plan | ✅ Yes | — |
| 7 | **The Far Messenger Path** (the signature journey) | ✅ Yes | — |
| 8 | **Proven in the field** — ten years of inter-tribal gatherings; Rancho La Puerta (three times) and Sedona; now organizing at 1440 | ✅ Yes | — |
| 9 | **Practitioner team** — meditation & breathwork · sound healing & chanting · somatic healing · yoga/tai chi/qigong · cooks & the ancestral kitchen · several leadership coaches | ✅ Yes, all six | — |
| 10 | **Land-based options** — equine & horseback · custom hikes · time with elders · ancestral kitchen workshops · running workshop led by a **professional running coach** · backcountry/UTV · journaling & writing | ✅ Yes, all seven | — |
| 11 | **Measurable pre/post diagnostic** (before + 30 days, aggregate report) | ✅ Yes | — |
| 12 | **Parallel cohorts for groups over 20** | ⚠️ Weak — survived only as a photo caption and one bullet inside Tier Two | **Restored** as a stated block under a new "Built to lift your whole leadership" section |
| 13 | **Delivered wherever your people are — across the U.S. and friendly countries; four continents** | ❌ Dropped | **Restored** in the same section |
| 14 | **Two tiers** — we bring the team / full turnkey production | ✅ Yes | — |
| 15 | **"Grounded for the frontier" — ancient tools for the age of AI** | ✅ Yes | — |
| 16 | **Tony's guide bio** — Lithuanian & Diné, hogan on Big Mountain, lamplight, walked away from college and finished top of his class, PhD candidate in Sustainable Development, hall-of-fame induction, three-time executive, **governance restructuring of a still-traditional nation**, **four continents**, a health-and-wellness development, a decade convening Indigenous elders, nonprofit board chair, retreat faculty, runner and aspiring silversmith, author of the *Ancestral Watch* series, "Tony assembles and leads the practitioner team" | ❌ **Dropped entirely** — the v2 page had no guide bio at all | **Restored in full** as a "Your guide" section with one portrait (`/assets/img/tony/portrait-standing.jpg`). **Institution names de-named** — see §5a |
| 17 | **Praise — Emily Alicia Affolter, PhD** | ❌ Dropped | **Restored** inside the guide section; affiliation given as "Associate Dean of Doctoral Studies" per §5a |
| 18 | Closing CTA — book an exploratory call | ✅ Yes | Reworked into a two-button row |
| 19 | **"Request the prospectus" CTA** | ❌ Dropped | **Restored** as the second button |
| 20 | Link to `/diagnostic/` | ✅ Yes | — |

**Net for /v2/teams/:** 6 items were entirely absent and 1 was materially weak. All 7 restored. The guide bio was the single largest loss on this page.

---

## 3. `/` (live homepage) → `/v2/index.html`

The v2 homepage is a deliberate ground-up rewrite, not a port, and it is **substantially richer** than the live homepage (22 journal essays vs. 9, a full listen/watch section, the four-capitals framework, worldwide/language surfacing, 65+ images). It is not the source of the client's complaint and **was not edited**. Two named live offerings do not appear anywhere in v2 and are flagged here rather than restored, because they belong to a page architecture v2 has replaced:

| Live homepage item | In v2? | Note |
|---|---|---|
| Three doors (calm / economy / circle) | ✅ Reframed as "Two bodies of work" + "Five ways in" | — |
| Human Performance — coaching, wellness & longevity, keynotes/teams/retreats | ✅ Yes | — |
| Nation-Building — selected work, method, track record | ✅ Yes, expanded into `/v2/nation/` | — |
| The Books / Ancestral Watch | ✅ Yes | — |
| Journal | ✅ Yes, expanded | — |
| Listen / Watch & meditate | ✅ Yes | — |
| About Tony · three fires · Hall of Fame · four continents | ✅ Yes | — |
| Free Stone Breath tool ("Start free") | ⚠️ Stone Breath is named 3× but the free-tool door is not surfaced | **Flagged, not restored** — needs a decision on where the free tool lives in v2 |
| **SANCTUARY — a Leadership Commons** | ❌ **Absent from v2** | **Flagged, not restored** — a named offering; needs the client to say whether it is still live before it is rebuilt |
| **Ancestral-Wisdom Academies** | ❌ **Absent from v2** | **Flagged, not restored** — same |
| $40M wellness development | ⚠️ On live homepage, absent from v2 homepage | Now present on `/v2/teams/` via the restored bio |

---

## 4. Pages with no v2 equivalent yet

| Live page | Status | What would need to be carried over |
|---|---|---|
| `/start-here/` | ❌ **No v2 page.** v2 has no `/v2/start-here/` and nothing links to one. | Four named doors: **Path 1 · The individual in alarm** (coaching + wellness, links to the diagnostic) · **Path 2 · The institution in transition** (nation-building) · **Path 3 · The seeker of experience** (The Canyon Within, Aug 28–30 at 1440) · **Path 4 · The reader** (the *Ancestral Watch* series, *Stone Breath* and *The Council Fire*). Framing line: "Four doors. One destination: a body that can carry what matters across hard ground." |
| `/diagnostic/` | ❌ **No v2 page** — but **both v2 pages link to it**, and they link to the *live* `/diagnostic/`, not a v2 path. | "The Far Messenger Diagnostic — Is your nervous system running the show?", a ~90-second quiz (16 radio inputs). Until a v2 version exists the cross-links resolve to the live page, so nothing is broken; it just means v2 is not self-contained. |

---

## 5a. Conflict found mid-audit: the bio de-naming policy

While this audit was running, work landed in the repo from another session:

- `8d6cccb` — *"Strip named institutions from bios (keep 1440 as retreat venue only)"*
- `ab9e9c9` — *"Commencement speaker: reflect that he has given several, most recently to a doctoral class"*
- `b5d8baf` — *"Remove photo collages: 92 images down to 35"*
- `a9582b0`, `9c57f34` — journal/stat-strip credential fixes

`8d6cccb` rewrote the homepage bio to remove every named institution. The approved v2 phrasing is now:

> PhD candidate in Sustainable Development Education. Retreat faculty. A repeat commencement speaker, most recently to a doctoral graduating class. The first person of Lithuanian and Diné descent inducted into a college of business hall of fame.

`/v2/index.html` now contains **zero** occurrences of Prescott, Franke, Northern Arizona, Red Road Journey or $40M.

The live `/teams/` bio I was asked to restore names all of them. Restoring it verbatim would have re-broken what had just been deliberately fixed, so **the bio was restored in substance and conformed to the newer policy**:

| Live wording | Restored as |
|---|---|
| PhD candidate in Sustainable Development **at Prescott College** | PhD candidate in Sustainable Development Education |
| inducted into **Northern Arizona University's W. A. Franke College of Business** Hall of Fame | inducted into a college of business hall of fame |
| development advisor to a **$40M** integrated health-and-wellness development | development advisor to a major integrated health-and-wellness development |
| board chair of **Red Road Journey** | board chair of a Native-led nonprofit |
| **faculty at 1440 Multiversity** | retreat faculty |
| *(new, from `ab9e9c9`)* | a repeat commencement speaker, most recently to a doctoral graduating class |

Everything substantive in the live bio survives: the hogan on Big Mountain, learning by lamplight, the Japanese philosophy, walking away from college and finishing top of his class, the doctoral research, the hall-of-fame first, three-time executive and systems architect, the governance restructuring of a still-traditional nation, four continents, the wellness development, the decade convening Indigenous elders, nonprofit board chair, runner and aspiring silversmith, the *Ancestral Watch* series, and "for each engagement, Tony assembles and leads the practitioner team."

Two consistency fixes were applied at the same time, because `8d6cccb` had not reached these two pages:

- "where he serves as faculty" → "where he leads retreats" / "retreat faculty" on both `/v2/workshop/` and `/v2/teams/` (keeps 1440 as a venue, drops the affiliation claim).
- The proof stat "Faculty at 1440 Multiversity" → "Retreats at 1440 Multiversity".

**One item needs the client's call.** Endorser affiliations are not Tony's bio, so the testimonial credentials from the live pages were kept: Carmella Kahn, DrPH, MPH · University of New Mexico, and Emily Affolter, PhD · Associate Dean of Doctoral Studies. Emily Affolter's live `/teams/` cite read "Prescott College"; because that is Tony's own school and reads as a self-referential endorsement, it was changed to her title. **If named endorser institutions are also meant to go, say so and they come out in one pass.**

---

## 5. Deliberately not done

- **No images were added to `/v2/workshop/`.** Every restored section there is text and typography only, per "take out the collages — we are overdoing the pics." The one image added anywhere was the single guide portrait on `/v2/teams/`, which previously had no bio and therefore no portrait at all.
- **No existing images were removed.** The full-bleed band photographs already on both pages are single images, not collages, so removing them was treated as a separate design decision for the client rather than part of a content-restoration pass.
- **The v2 homepage was not edited.** It is a rewrite rather than a port; SANCTUARY, the Ancestral-Wisdom Academies, and the free Stone Breath tool are flagged above for a decision instead of being dropped into a page whose architecture does not currently have a slot for them.
- **`/v2/start-here/` and `/v2/diagnostic/` were not created.** Building new pages is outside a completeness audit; their content is inventoried above so they can be built without re-deriving it.
- **Day-pass pricing is still not stated** on either the live page or v2 — the live page only says passes exist. Not a v2 regression; noted so it does not read as one.
- **Conflicting day names were resolved toward the live page.** v2 had renamed the three days ("The Descent" / "The Canyon Floor" / "The Harvest"), which collided with *The Descent* being the name of Saturday afternoon's facilitated session. The live names — *Arrival & Threshold*, *The Descent & The Harvest*, *Carry It Home* — were restored, so the named session and the day it happens on no longer contradict each other.

---

## 6. Verification

- Both edited pages parse with balanced tags.
- Rendered and visually reviewed at 1440px (full-page, in slices) across three passes each.
- Checked for horizontal overflow at 500px and 768px: `scrollWidth === clientWidth` on both pages, no overflowing elements.
- Two rendering bugs introduced during restoration were found on screen and fixed: the "what's included" list was splitting inline `<strong>`/`<em>` into separate grid cells, and the closing honoring's eyebrow was inheriting display-italic.
