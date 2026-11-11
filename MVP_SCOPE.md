# IFAFA Career Hub — agreed pilot scope

**Audience:** Accompanying partners of Irish diplomatic staff.

## Include
- While abroad: professional development, online training, mentoring, networking, scholarships and relevant fellowships (subject to programme eligibility).
- Preparing to return / returned to Ireland: Ireland-based jobs, returnships, career re-entry programmes and career support.
- Human review of every listing before publication.

## Exclude from the initial pilot
- Overseas employment and international remote-work matching.
- Individualised tax, immigration or employment-law advice.
- Automatic publication of AI suggestions.

## Discovery pipeline: implementation checklist
1. Select 5–10 reliable official feeds/APIs or permitted sources; document access and update terms.
2. Fetch source items on a schedule, respecting rate limits and robots/terms.
3. Deduplicate by canonical source URL and stable external ID.
4. Extract source-grounded fields and score against the above scope. An AI model may classify relevance, but must mark missing eligibility or deadlines as **unverified**; it must not invent them.
5. Insert suggestions into the existing volunteer inbox; never publish directly.
6. Require a human to verify eligibility, deadlines and official application URL before publishing.
7. Recheck published listings and archive on verified closure; flag failures for review.
8. Log source, retrieval date, model decision and review outcome for auditability.

**Deployment:** No AI integration or secret keys are included in this first scope-focused update. The existing source-monitoring cron checks known pages; it is not a general discovery engine.

## AI-assisted source screening (first implementation)

The existing scheduled source monitor can now optionally screen extracted, structured job suggestions using the OpenAI API before they enter the volunteer inbox. Configure `OPENAI_API_KEY` as a **server-side** Vercel environment variable. Optionally set `OPENAI_TRIAGE_MODEL` (default `gpt-4.1-mini`). The AI evaluates up to five structured suggestions per watched page check, excludes overseas/cross-border remote jobs, and attaches its reasoning and uncertainties in `suggestions.provenance._ai_review`. A failed AI request queues nothing when screening is enabled. Volunteers still verify all details and explicitly publish listings. This does **not** automatically discover new sources or guarantee listing eligibility, freshness, or accuracy. Do not publish sample listings as real opportunities.

Next iteration: add approved provider feeds or APIs for discovering *new* listings, with rate limits, source attribution, and the same review workflow. Do not scrape sites against their terms or robots rules.
