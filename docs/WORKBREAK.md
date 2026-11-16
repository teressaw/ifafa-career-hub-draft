# Workbreak: working guide

## 1. Maintaining the site

**Listings** (`/admin`, needs Supabase; see README section 2)
1. *Watched sources* → **Check now**. Changed pages are flagged; pages with structured job data create suggestions in the *Inbox*.
2. *Inbox* → **Review and create draft**, or *Add a listing* / *Import from a link*.
3. Check every field against the employer’s own page. Leave blank what the page doesn’t state. Tick the date and “checked today” boxes only if true.
4. **Publish.** Re-check when *Needs checking* shows it (120 days), or archive.

Budget: minutes a week. Nothing publishes itself.

**Employer builder content**: all wording and rules are in `src/lib/pathway.ts`. Change a rule, run `npm test`.

**Site copy**: homepage `src/app/page.tsx`; guide `src/app/returnships/page.tsx`; employers `src/app/employers/page.tsx`; about and privacy alongside. Labels for filters and kinds of opportunity: `src/lib/types.ts`, `src/lib/filters.ts`.

**Before any release**: `npm test && npm run lint && npm run build`. Work on a branch; Vercel builds a preview for each push.

**Environment variables** (Vercel): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SITE_URL` (set to `https://workbreak.ie` once the domain is live), optional `NEXT_PUBLIC_CONTACT_EMAIL`, optional `CRON_SECRET` + `SUPABASE_SECRET_KEY` for the daily source check.

## 2. Visual identity

| Token | Value | Use |
|---|---|---|
| cream | `#F6F0E7` | page background |
| paper | `#FFFCF7` | cards, fields |
| olive | `#3A4626` | wordmark, headings, primary buttons (8.9:1 on cream) |
| rust | `#A65B47` | the wordmark’s full stop, numerals, underlines (decorative / large text) |
| rust-deep | `#8E4431` | small accent text, focus ring (6.1:1) |
| mustard | `#D5A03C` / soft `#F6E7C4` | “worth a second look”, unverified; never as text |
| dusty blue | `#778AA0` / deep `#4C5E74` / soft `#E4E9EF` | “opening soon”, info |
| sage | `#8E9A72` / deep `#55613E` / soft `#E8EADB` | “open”, kind-of-opportunity tag |
| ink / muted | `#26291C` / `#5F5C4C` | body text / secondary text (13:1 / 5.9:1) |

Olive sits between the brief’s `#3E5147` and the artwork’s lettering (`#363C0D`). Tokens live in `src/app/globals.css`.

- **Type**: Newsreader (serif) for the wordmark, headings and the italic tagline; Source Sans 3 for everything else. Both self-hosted, open licence.
- **Wordmark**: lower-case `workbreak` in olive with a rust full stop, always real text.
- **Components**: pill buttons; 14px-radius cards on paper with a hairline border; small-caps rust “eyebrow” labels; status always icon + words.
- **Illustration**: homepage hero only. The directory, builder and team area carry the identity through colour and type, with no character art. No emoji or CSS stand-ins for artwork.
- **Motion**: none beyond hover states; reduced-motion is respected.

## 3. What works, and what doesn’t yet

| Feature | State |
|---|---|
| Homepage, guide, employers, about, privacy | Working |
| Directory: search, 7 filters, kind-of-opportunity tabs, sort, detail pages | Working. Tested on example data only; **no real listings exist yet** |
| Accuracy rules (verified dates, 120-day expiry, “Not confirmed”) | Working, unit-tested |
| Production never shows example listings or the open team-area demo | Working (examples appear on local and preview copies only) |
| Employer pathway builder: 7 steps, plan, flags, copy / download / print, saved in browser | Working, unit- and browser-tested |
| Team area, source monitor, inbox, import | Unchanged from the pilot; works in demo mode. **Not exercised against a live Supabase project in this work** |
| Events, career support, resources pages | Working but empty until items are added |
| Daily source check (cron) | Present, off until two secrets are set |
| Final hero artwork | **Interim.** Uses the character separated from the first artwork; the revised artwork has not been supplied as a file |
| Social sharing image | Not done (waits on final artwork) |
| AI features | None. The unmerged `ai-discovery-pilot` branch is untouched and not part of Workbreak |
| Contact route for visitors and employers | Email link only, shown when `NEXT_PUBLIC_CONTACT_EMAIL` is set |

## 4. AI: where it would and wouldn’t help

| Idea | Verdict |
|---|---|
| Employer plans | **No AI.** Rules are free, repeatable and can’t invent legal assurances. |
| Freshness and dead-link checks | **No AI.** The existing monitor does this deterministically. |
| Triage of inbox suggestions | Later, if volume justifies it. Paid API, needs approval; must fail closed and never publish. |
| Discovering new programmes | Manual for now. There are few Irish returnships; a person reading a dozen pages a month beats a pipeline. |
| Job matching or scoring | Not recommended. |

## 5. Backlog

**Before public launch**
1. Add the final artwork file; finish hero and sharing image.
2. Create the Supabase project; add and check the first real listings (aim for 10 or more).
3. Decide where Workbreak lives: recommended is a new private repository and Vercel project named `workbreak` (this repo is public and IFAFA-named).
4. Set a contact email; review the privacy page; connect `workbreak.ie`.
5. Have someone outside the project test with a screen reader and keyboard.

**Soon after**
6. A “suggest a programme” form for employers (needs spam protection and a review queue).
7. Email alerts for new listings (needs consent handling and an email service).
8. Rename internal “volunteer” wording in the team area.

**Optional**
9. Additional character illustrations for empty and completion states: commission them in the approved style; do not improvise.
10. Countries beyond Ireland: regions are a fixed list in `src/lib/types.ts` plus a database constraint, so this is a small migration when needed.
