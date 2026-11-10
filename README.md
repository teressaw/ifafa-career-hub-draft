# IFAFA Career Hub

A volunteer-curated directory of returnships, career re-entry programmes and employment pathways in Ireland, for accompanying partners of Irish diplomatic staff.

- **Public directory** with search and six filters (sector, location, working arrangement, programme type, career-break eligibility, application status), plus a detailed page for each opportunity.
- **Volunteer admin area** where authorised volunteers add, edit, verify, publish and archive listings.
- **Accuracy rules built in**: dates are only shown when a volunteer confirmed them at the source; unknown eligibility, duration and pay show as *Not confirmed*; listings not re-checked within 120 days are automatically shown as *Status unverified*.

Built with Next.js 16 (App Router), TypeScript, Tailwind CSS 4 and Supabase. Runtime dependencies are limited to Next.js, React and the two official Supabase packages.

---

## 1. Run it locally

Requirements: Node.js 20.9 or later.

```bash
npm install
npm run dev
```

Open http://localhost:3000. **With no Supabase settings, the directory shows eight fictional example listings** (all clearly labelled, using example.org links). This is stage one: search, filters and detail pages all work.

Other commands:

| Command | What it does |
| --- | --- |
| `npm run build` | Production build (also type-checks) |
| `npm test` | Unit tests for status rules, validation and filters |
| `npm run lint` | ESLint |

---

## 2. Set up Supabase (database and volunteer sign-in)

### 2.1 Create the project and tables
1. Create a project at https://supabase.com (an EU region such as Ireland/`eu-west-1` is a sensible choice).
2. Open **SQL Editor**, paste the whole of `supabase/migrations/20261110000000_init.sql`, and run it. This creates the tables, constraints and row-level security policies.
3. *Optional:* run `supabase/seed.sql` to load five fictional example listings. Remove them before launch:
   ```sql
   delete from public.opportunities where is_example;
   ```

### 2.2 Lock down sign-ups — **manual, required**
Authentication → **Sign In / Providers**:
- Turn **off** “Allow new users to sign up”. Volunteers are invited; nobody can create their own account.
- Keep **Email** enabled. Leave other providers off.

### 2.3 URLs and email templates — **manual, required**
Authentication → **URL Configuration**:
- **Site URL**: your production address, e.g. `https://careers.example.ie`
- **Redirect URLs**: add `http://localhost:3000/**` and your production address with `/**`.

Authentication → **Emails**, edit two templates so links go through the app’s secure confirmation route:
- **Invite user** — set the link to:
  `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite&next=/admin/account`
- **Reset password** — set the link to:
  `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/admin/account`

For real use, configure a custom SMTP sender (Authentication → Emails → SMTP). Supabase’s built-in sender is rate-limited and intended for testing.

### 2.4 Add a volunteer
1. Authentication → **Users** → **Invite user**, enter their email. They receive a link and choose a password on the *Your account* page.
2. Give them access in the SQL Editor (replace the email):
   ```sql
   insert into public.admin_users (user_id, role)
   select id, 'editor' from auth.users where email = 'volunteer@example.org';
   ```
   Use `'admin'` instead of `'editor'` for people who may also permanently delete listings.
3. To remove access: `delete from public.admin_users where user_id = (select id from auth.users where email = '…');` (or delete the user under Authentication → Users).

A signed-in account that is **not** in `admin_users` can see nothing beyond the public directory.

### 2.5 Connect the app
Copy `.env.example` to `.env.local` and fill in:
```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_…     # Project Settings → API Keys
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```
Restart `npm run dev`. The directory now reads from the database, and `/admin` shows the sign-in page.

> **Never** put the Supabase *secret* / *service_role* key in this app. It isn’t needed, and it bypasses row-level security.

---

## 3. Deploy to Vercel

1. Push this folder to a GitHub repository.
2. In Vercel: **Add New → Project**, import the repository. The defaults (Next.js) are correct.
3. Under **Environment Variables**, add the three variables from 2.5 for Production (and Preview if you use it). Set `NEXT_PUBLIC_SITE_URL` to the production address.
4. Deploy. Then make sure the production address is the **Site URL** and is in the **Redirect URLs** list in Supabase (2.3).
5. Optional: add a custom domain under Project → Settings → Domains.

---

## 4. How volunteers use it

- **Listings → Needs checking** shows drafts and published listings that were never verified or not checked for 120 days.
- **Add a listing** saves a draft. Nothing is public until **Publish**.
- Tick **“I confirmed these dates at the official source”** to store dates. Unconfirmed dates are refused by both the form and the database.
- Tick **“I checked every detail above against the source today”** (or use **Mark as verified today**) to update the last-verified date.
- **Archive** hides a listing but keeps it; only admins can delete permanently.

### How the public status is decided (`src/lib/status.ts`)
1. Never verified, or last verified more than 120 days ago → **Status unverified**
2. Verified dates → **Opening soon** (before the opening date), **Open now** (in the window), **Closed** (after the closing date)
3. No verified dates → whatever the volunteer recorded at the source (e.g. rolling applications → Open now)
4. Nothing recorded → **Status unverified**

All dates use Irish time.

---

## 5. Security model and review checklist

**What protects the data**
- **Row-level security** (in the migration): visitors can read only `published` rows and only public columns; they cannot write anything. Signed-in users without an `admin_users` row get nothing extra. Editors can create and update; only admins can delete. Volunteer membership cannot be changed through the API at all.
- **Database constraints** repeat the key rules: allowed values for every filter field, `https?://` links only, dates only when verified, closing date on or after opening date.
- **Audit fields** (`created_by`, `updated_by`, timestamps) are set by a database trigger, not by the browser.
- **Server-side checks**: every admin page and server action re-validates the session with Supabase (`getUser()`) and checks `admin_users`; every form is validated on the server (`src/lib/validation.ts`).
- **No HTML from the database** is ever rendered; descriptions are plain text. External links use `rel="noopener noreferrer"`.
- **Security headers** (nosniff, frame denial, referrer policy) are set in `next.config.ts`.

**Tested here**: the RLS policies and constraints were run against PostgreSQL 16 with Supabase-style roles (`supabase/tests/rls_test.sql`), covering visitors, signed-in non-volunteers, editors and admins.

**Please review before launch**
- [ ] Sign-ups disabled (2.2) and email templates updated (2.3).
- [ ] Custom SMTP configured, and Supabase Auth rate limits reviewed.
- [ ] Only the publishable/anon key is in Vercel — no secret key anywhere in the app.
- [ ] Supabase → **Advisors → Security** shows no warnings for this project.
- [ ] Volunteers use strong passwords. Consider enabling multi-factor authentication (Authentication → MFA) for admins.
- [ ] Example listings removed (`delete … where is_example;`).
- [ ] A privacy notice for volunteers’ accounts, and a contact route for reporting outdated listings, agreed with IFAFA.
- [ ] Someone independent runs through the RLS tests (`supabase/tests/`) against a staging project.

### Testing RLS yourself
`supabase/tests/supabase_stub.sql` recreates Supabase’s roles on a plain PostgreSQL database, so you can run:
```bash
createdb ifafa_test
psql ifafa_test -f supabase/tests/supabase_stub.sql
psql ifafa_test -f supabase/migrations/20261110000000_init.sql
psql ifafa_test -f supabase/seed.sql
psql ifafa_test -f supabase/tests/rls_test.sql
```
Lines marked *should fail* must print a permission or policy error.

---

## 6. Project structure

```
src/
  app/                    Pages (App Router)
    page.tsx              Home
    opportunities/        Directory and detail pages
    about/                How listings work
    admin/                Volunteer area (sign-in, listings, editor, account)
    auth/confirm/         Handles invitation and password-reset email links
  components/             UI components (no third-party UI libraries)
  lib/
    types.ts              Data types and the controlled vocabularies used in filters
    status.ts             The single source of truth for application status
    filters.ts            Search, filtering and sorting
    validation.ts         Server-side validation
    opportunities.ts      Data access (Supabase, or example listings when not configured)
    sample-data.ts        Fictional example listings
  proxy.ts                Refreshes volunteer sessions on /admin (Next.js 16 “proxy”, formerly middleware)
supabase/
  migrations/             Schema, constraints and row-level security
  seed.sql                Optional fictional examples
  tests/                  RLS tests for plain PostgreSQL
tests/unit.test.ts        Unit tests
```

## Not included in this version (by design)
Automated scraping, AI matching, member accounts and email notifications.
