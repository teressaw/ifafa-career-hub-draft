# IFAFA discovery pilot: source selection and verification

## Scope
- **Ireland-based employment and returnships:** Only explicitly Ireland-located jobs; do not treat a remote-only label as work-from-Ireland permission.
- **While overseas:** Learning, mentoring, scholarships and non-employment fellowships only. Check programme eligibility individually.
- No overseas employment recommendations, no automatic publication, no legal or tax advice.

## Phase A — official editorial watchlist (not automated vacancy feeds)
1. [publicjobs.ie job alerts](https://www.publicjobs.ie/en/new-recruitment-platform/job-alerts): use the official alert mechanism; do not claim an API exists.
2. [Research Ireland funding](https://www.researchireland.ie/funding/): review for research fellowship eligibility; many programmes have restrictive conditions.

Add only specific publicly accessible announcement pages to the existing Sources admin area after checking site terms and robots rules. A page change is **not** a confirmed new opportunity; volunteers must check the actual listing.

## Phase B — structured Greenhouse pilot
1. Identify up to three **real employers** with Irish vacancies and a live Greenhouse job board.
2. Verify each board token against the employer's official careers page and confirm the JSON endpoint works.
3. Add only those tokens to server-side `IFAFA_GREENHOUSE_BOARDS`, comma separated. Do not add guessed tokens.
4. Configure Supabase, `CRON_SECRET`, and `OPENAI_API_KEY` in Vercel; never expose secrets in client variables.
5. Run a supervised cron test, inspect the suggestions inbox, and manually check links and geographic eligibility.

## Pilot success measures (after 14 days)
Record: candidates found, suggestions queued, genuinely useful after review, duplicates, closed listings, and volunteer minutes spent. Stop or narrow sources if review noise is high.

## Deployment caveat
This repository change prioritises returnships and junior/re-entry titles before the AI screening budget is spent. It does **not** configure actual employer board tokens or activate live monitoring. No API key, database or production settings were changed.
