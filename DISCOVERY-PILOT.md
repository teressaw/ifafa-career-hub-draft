# IFAFA opportunity discovery — controlled pilot

The existing daily Vercel cron now optionally reads job postings from explicitly configured employers using the official Greenhouse public board API. It retains the existing watched-page monitor. No automatic publishing occurs.

## Setup
1. Verify candidate Irish employers actually use Greenhouse, their public board identifiers, and the permitted use of their public listings. Do not assume that a company with an Irish office has Irish vacancies.
2. In Vercel, set `IFAFA_GREENHOUSE_BOARDS` to at most three verified board IDs separated by commas. Leave blank to disable discovery.
3. Set `OPENAI_API_KEY`, `CRON_SECRET`, and Supabase server variables as documented in README. Never put secrets in `NEXT_PUBLIC_` variables.
4. Deploy, then inspect the existing volunteer suggestion inbox and the cron response/logs. Review a small sample manually before adding sources.

## Safeguards and limitations
- Only job postings explicitly mentioning an Irish location are candidates; remote-only and ambiguous locations are excluded.
- AI assesses relevance and fails closed on errors. It does not determine work permission, tax treatment, or eligibility.
- A maximum of three boards, 15 candidate jobs per board, and five AI-screened suggestions per board per cron execution; a 48-second runtime budget limits work.
- Suggestions are deduplicated and await human approval. No public listing is created by discovery.
- The Greenhouse board identifier is **not** a verified employer name; volunteers must check this and the application URL.
- Publicjobs.ie and Research Ireland are useful editorial watch sources, but this pilot does **not** claim they provide compatible APIs. Existing page monitoring can track approved pages, subject to robots rules.
- The daily cron rechecks feeds but does not yet automatically remove already approved listings when an employer closes a vacancy. Volunteers must verify closing dates.

## Next evaluation
After two weeks, record how many suggestions were genuinely suitable, rejected, duplicates, or already closed. Expand only if useful.
