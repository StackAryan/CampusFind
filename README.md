# CampusFind — Campus Lost & Found

A cloud-based smart lost & found management system for a university campus.

Students report lost or found belongings, search the campus board, see automatically
scored potential matches, and submit ownership claims. Administrators verify claims,
approve recoveries, monitor the board and oversee student accounts.

Student access is passwordless: a single-use sign-in link is sent to any email address the
student controls (emails can also carry a six-digit code when the template includes it).
Administrator access stays on a single email/password account.

Built as an interdisciplinary course project with **React + Vite + Tailwind CSS** on the
frontend and **Supabase Auth, PostgreSQL, Storage and Realtime** behind it. Deployable to
**Vercel**.

---

## Table of contents

- [Run it in demo mode](#run-it-in-demo-mode)
- [Demo accounts](#demo-accounts)
- [Features](#features)
- [Tech stack](#tech-stack)
- [How student authentication works](#how-student-authentication-works)
- [Connect Supabase](#connect-supabase)
- [Potential Match Engine](#potential-match-engine)
- [Database and security model](#database-and-security-model)
- [Project structure](#project-structure)
- [Available scripts](#available-scripts)
- [Testing](#testing)
- [Deploy to Vercel](#deploy-to-vercel)
- [Requirement mapping](#requirement-mapping)
- [Roadmap](#roadmap)
- [Troubleshooting](#troubleshooting)
- [Limitations](#limitations)

---

## Run it in demo mode

You do **not** need a Supabase account to try the app. When Supabase environment variables
are missing, CampusFind automatically runs on a local demo backend with seeded students,
reports, claims and notifications.

```bash
cd campus-lost-found
npm install
npm run dev
```

Open the printed URL (usually `http://localhost:5173`).

The navbar shows a **Demo mode** chip, and the footer has a **Reset demo data** button that
restores the original seed. Demo data is stored in `localStorage` under
`campusfind_demo_v2`, and photos are compressed and stored as data URLs.

In demo mode no email is sent. The student login displays and accepts the fixed verification
code **123456** for any valid email address. The administrator demo uses a normal
email/password account.

When you are ready for the real cloud backend, follow [Connect Supabase](#connect-supabase).
The UI, routes and features are identical — only the data layer swaps.

## Demo accounts

| Role | Credentials |
| --- | --- |
| Student (Avery Johnson) | `avery.johnson@example.com` + code `123456` |
| Administrator | `admin@campus.edu` / `admin123` |

The login page has two tabs:

- **Student** — enter any email address, then open the single-use sign-in link from the
  email (a six-digit code can also be entered if the email contains one).
- **Administrator** — email and password for the single admin account.

The seed contains 13 reports across campus, 3 pending claims, 1 approved recovery, and
notifications. The demo is intentionally small but covers every screen and workflow.

A good presentation flow:

1. Sign in through the **Student** tab with `avery.johnson@example.com` and
   demo code `123456`.
2. Open **Matches** — see scored lost/found pairs and their reason breakdown.
3. Search the board for “Hydro”, open the found bottle, and submit a claim.
4. Check the notification bell and dashboard.
5. Sign out, switch to the **Administrator** tab and use the admin demo account.
6. Approve or reject a claim with a review note; watch the item become recovered.
7. Point out that approving one claim automatically rejects competing claims and notifies
   everyone involved.

## Features

### Phase 1 — Core

- Passwordless student login using a single-use email link (plus optional 6-digit code)
  sent to any email address
- Separate email/password login for the single administrator account
- Student dashboard with reports, claims and live status
- Report lost items / report found items with photo uploads
- Browse listings with search and filters (keywords, type, category, location, date range,
  recovered toggle, sort)
- Item detail pages with claim workflow
- Admin claim queue with approve/reject decisions and review notes
- Automatic recovery: approving a claim marks the item recovered and removes it from active
  listings; competing claims are rejected
- Owners can mark a report recovered manually when no claims are pending

### Phase 2 — Highlights

- **Potential Match Engine** with a transparent weighted score and visible reason breakdown
- Live notifications (Supabase Realtime in production, event bus in demo)
- Admin statistics and analytics: open reports, pendings, recovery rate, categories, top
  locations and claim decisions
- Photo upload to Supabase Storage with client-side resizing/compression
- “Smart check” panel on the report form that shows potential matches while you type
- Realtime refreshes on listings, claims and notifications

Remaining ideas for extra credit are listed in [Roadmap](#roadmap).

## Tech stack

| Technology | Purpose in CampusFind |
| --- | --- |
| React 19 + Vite | SPA frontend, routing, lazy-loaded pages |
| Tailwind CSS 4 | Design system and responsive styling |
| Supabase Auth | Passwordless email link/OTP sign-in and administrator email/password |
| Supabase PostgreSQL | Items, claims, profiles, notifications |
| Supabase Storage | Item photos (`item-photos` bucket) |
| Supabase Realtime | Live item, claim and notification updates |
| Vercel | Static hosting with SPA rewrites |
| Vitest | Unit tests for the match engine and auth helpers |

No UI component library is required; the design system lives in `src/index.css` and shared
components.

---

## How student authentication works

1. The student enters any email address on the **Student** tab.
2. The browser checks that it looks like a valid email address.
3. Supabase sends a single-use sign-in link to that mailbox. The link lands back on the app
   (the **Site URL** configured in Supabase), where `supabase-js` picks up the session.
4. On first login the account and `student` profile are created automatically. If the email
   also contains a six-digit code (template includes `{{ .Token }}`), the student can expand
   **Have a 6-digit code?** and type it instead of clicking the link.
5. There is no domain restriction: any valid email address can sign up. The latest migration
   removes the old university-domain trigger from `auth.users`.
6. Administrator login is a separate tab using the one admin email/password account. The app
   checks the profile role and rejects non-administrator accounts.

Demo mode uses the fixed code `123456` and does not send email, so it keeps the code-entry
step.

---

## Connect Supabase

### 1. Create a Supabase project

Create a free project at [supabase.com](https://supabase.com). Wait for the database to
finish provisioning.

### 2. Run the database migrations

Open **SQL Editor** in the Supabase dashboard and run the files in
`supabase/migrations` **in order**:

1. `20260101000000_init.sql` — tables, indexes, claim triggers, RLS, storage bucket and
   realtime publication.
2. `20261122000000_student_email_verification.sql` — legacy Adamas domain restriction and
   signup allowlist (kept for migration history; superseded by the next file).
3. `20261124000000_allow_any_email.sql` — removes the domain restriction and allowlist so
   any valid email address can sign up.
4. `20261124000001_grant_table_privileges.sql` — grants `authenticated` access to the app
   tables so PostgREST does not return “permission denied for table …”.

With the Supabase CLI, all four run automatically:

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

> The first migration adds tables to the `supabase_realtime` publication. If you re-run it on
> a project where they are already published, remove those three `alter publication` lines
> before running.

### 3. Configure email delivery

CampusFind sends sign-in emails through Supabase Auth. A few dashboard settings are required:

1. Open **Authentication → Sign In / Providers → Email** and make sure the Email provider is
   enabled and **Allow new users to sign up** is on. This lets first-time students create an
   account through the sign-in link.
2. Open **Authentication → URL Configuration** and set **Site URL** to the app. Use
   `http://localhost:5173/login` while developing and the Vercel URL after deploying. Add the
   same origins under **Redirect URLs** (`http://localhost:5173/**` and
   `https://your-app.vercel.app/**`). This is where the sign-in link returns the student, so
   the flow does not work with the default `localhost:3000`.
3. The default Supabase auth email already contains a working **magic link**, so the primary
   flow works without editing templates. Keep the default **Magic link or OTP** template.
4. Optional: to also let students type a six-digit code, open **Authentication → Emails →
   Magic link or OTP** and add `{{ .Token }}` to the body. Example:

   ```html
   <h2>Your CampusFind verification code</h2>
   <p style="font-size: 28px; font-weight: 700; letter-spacing: 6px;">{{ .Token }}</p>
   <p>You can also use the link below. Both expire shortly.</p>
   ```

   Set the subject to something like **Your CampusFind sign-in code**.
5. Configure **custom SMTP** before real use. Supabase's built-in email service is heavily
   rate-limited (a few messages per hour) and is intended for testing, not a live campus app.
   Resend, SendGrid, Postmark or your own mail relay all work as SMTP providers. On new
   free-tier projects created after June 2026, custom SMTP is also required before auth email
   templates can be edited at all.
6. Ask users to check their spam/junk folder the first time, especially for Outlook or
   university mailboxes that filter external senders.

Sign-in links are single-use and expire; users can request a new link from the login page.

### 4. Add environment variables

Copy the example file and fill in values from **Project Settings → API**:

```bash
cp .env.example .env
```

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

Never put the `service_role` key in the frontend. Only the anon key is needed.

Restart the dev server. The **Demo mode** chip disappears and the app uses Supabase.

### 5. Create the administrator account

Signup is open to any valid email address, so no allowlist step is required. Create the
administrator user with a password in **Authentication → Users → Add user**, turn on
**Auto Confirm User** (or create it via the Supabase Admin API), then promote the profile:

```sql
update public.profiles
set role = 'admin'
where id = (
  select id from auth.users where email = 'admin@example.com'
);
```

Sign in through the **Administrator** tab at `/login?tab=admin`.

- Roles are protected by a separate trigger. Students cannot promote themselves through the
  API. SQL editor commands run without a user JWT, so the promotion above is allowed.
- Any email domain works for the administrator after the latest migration; the old
  `signup_allowlist` table is dropped.
- If you previously applied the Adamas domain migration, make sure
  `20261124000000_allow_any_email.sql` has run. It drops the `auth.users` triggers and the
  allowlist table.

### 6. Storage and realtime

The first migration creates the public `item-photos` bucket and per-user upload policies.
Nothing else is required.

- Photos are publicly readable by URL. Do **not** upload sensitive documents.
- Listing photos are compressed to a maximum of 1280 px and JPEG quality 0.82 before upload.
- Realtime is enabled for `items`, `claims` and `notifications` through the migration.

---

## Potential Match Engine

The engine lives in [`src/lib/matching.js`](src/lib/matching.js) and is pure, testable and
fully explainable. It does not use machine learning.

Every open **lost** report is compared with every open **found** report. Four signals
produce a score out of 100:

| Signal | Max points | How points are earned |
| --- | --- | --- |
| Category | 30 | Exact category match |
| Keywords | 35 | `35 × (shared keywords ÷ keywords in the smaller report)` |
| Location | 20 | Exact location = 20, similar/substring = 14, shared location word = 10 |
| Date | 15 | 0–1 day apart = 15, 2–3 = 12, 4–7 = 8, 8–14 = 4, older = 0 |

A pair is shown as a potential match only when:

1. The score is **40 or higher**, **and**
2. The reports share the **same category**, **or** at least **three meaningful keywords**.

Additional rules:

- Only opposite types are compared (lost ↔ found).
- Reports from the same student are never matched to each other.
- Resolved items and the report itself are excluded.
- Keywords are lowercased, split on non-alphanumeric characters, and filtered through a
  stop-word list (`lost`, `found`, `near`, `the`, `with`, etc.).
- Every match returns a `reasons` array so the UI can display “+30 same category”,
  “+20 same location”, and the shared keywords.
- Labels: **Strong match** (75+), **Possible match** (55–74), **Worth checking** (40–54).

Example: black wireless earbuds lost near the library on Tuesday vs. black wireless
earphones found outside the library on Wednesday.

```text
Same category (Electronics)          +30
6 shared keywords                     +22
Same location (CENTRAL LIBRARY)       +20
Reported 1 day apart                  +15
------------------------------------------
Total                                  87  → Strong match
```

Where matches appear:

- **Matches** page for the signed-in student's own reports
- **Item detail** page for any listing
- **Report form** “Smart check” panel while typing (opens matches in a new tab so the form
  is not lost)

The engine is computed in the browser from the listings the student can already read. For a
much larger campus, move the same function into a Postgres function or Edge Function and
store precomputed matches.

## Database and security model

### Tables

| Table | Purpose |
| --- | --- |
| `profiles` | User display name, role (`student`/`admin`), join date. Email stays in `auth.users`. |
| `items` | Lost/found reports with title, description, category, location, date, photo and status. |
| `claims` | Ownership claims with pending/approved/rejected status, review note and reviewer. |
| `notifications` | In-app notifications with read state and deep link. |

Item statuses: `open` → `in_review` (a claim exists) → `resolved` (recovered).
Claim statuses: `pending` → `approved` / `rejected`.

### Email signup policy

Any valid email address can create an account. The app only checks the address format for a
friendly error, and there is no domain restriction in the database after
`20261124000000_allow_any_email.sql`. Ownership is proven by receiving the single-use link
or code. The administrator is distinguished by `profiles.role`, not by email domain.

### Claim workflow (database triggers)

The workflow is enforced in SQL, not just in the UI:

1. Inserting a claim marks the item `in_review` and notifies the finder.
2. A partial unique index prevents the same student from having two pending claims for the
   same item.
3. When an admin approves a claim, the database:
   - marks the item `resolved`,
   - rejects every other pending claim for that item,
   - notifies the approved claimant, the rejected claimants and the finder.
4. When a claim is rejected and no other pending claims remain, the item reopens.
5. Owners cannot mark an item with pending claims as recovered; that decision belongs to an
   admin.

### Row-level security

RLS is enabled on every public table:

- **Profiles:** signed-in students can read display names and roles. Emails are only
  available to admins via the `admin_list_users()` security-definer RPC, which checks
  `is_admin()`.
- **Items:** all signed-in students can read; only the owner or an admin can update/delete;
  inserts must use the caller's own user id.
- **Claims:** visible only to the claimant and admins. Students can claim only found,
  unresolved items that they do not own. Only admins can review claims.
- **Notifications:** each user can read and mark only their own notifications.
- **Storage:** uploads/deletes must be inside a folder named after the caller's user id.
  The bucket is public-read for simple image URLs.
- **Roles:** a trigger blocks non-admin role changes even if someone calls the API
  directly.
- **Signup:** any valid email address may register. The older domain trigger and allowlist
  are removed by `20261124000000_allow_any_email.sql`.
- **Administrator login:** checked again in the app, which signs out any non-admin account
  that tries the administrator tab.

This is the “Cybersecurity” part of the project: identity, authorization, privacy and
separation of duties are enforced at the database boundary.

---

## Project structure

```text
campus-lost-found/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/        # Navbar, notifications, cards, modals, email sign-in form, uploads…
│   ├── context/           # AuthProvider + useAuth
│   ├── lib/
│   │   ├── api.js         # Single data layer: demo mode ↔ Supabase
│   │   ├── demo.js        # Seeded localStorage backend for demo mode
│   │   ├── auth-domain.js # Email normalization and validation helpers
│   │   ├── auth-domain.test.js
│   │   ├── matching.js    # Potential Match Engine (pure functions)
│   │   ├── matching.test.js
│   │   ├── categories.js  # Categories, locations, badges, icons
│   │   ├── images.js      # Client-side compression
│   │   ├── toast.js       # Tiny toast store
│   │   └── utils.js       # Dates, initials, class names
│   ├── pages/             # Landing, login, browse, report, detail, dashboard, matches, admin
│   ├── App.jsx            # Routes, lazy loading, route guards
│   ├── main.jsx
│   └── index.css          # Tailwind theme tokens + component classes
├── supabase/
│   └── migrations/
│       ├── 20260101000000_init.sql
│       └── 20261122000000_student_email_verification.sql
├── .env.example
├── eslint.config.js
├── vercel.json            # SPA rewrite
├── vite.config.js
└── package.json
```

## Available scripts

```bash
npm run dev       # Start Vite dev server
npm run build     # Production build into dist/
npm run preview   # Preview the production build
npm run lint      # ESLint (flat config, React hooks rules)
npm test          # Vitest match-engine and auth-domain suites
```

## Testing

The match engine and student-email helpers have unit tests covering:

- keyword filtering and stop words
- strong-match scoring and reason totals
- maximum possible score
- same-type / same-report exclusions
- resolved, same-owner and weak-match exclusion
- score thresholds
- tier labels
- acceptance of normal email addresses
- rejection of malformed addresses
- display-name derivation from email addresses

```bash
npm test
```

Manual smoke-test checklist:

- [ ] Request a sign-in link with a malformed email address and verify it is rejected
- [ ] Request a link with any normal email address, open it, and confirm you land signed in
- [ ] Sign in with an email and the demo code, then sign out and back in
- [ ] Sign in through the Administrator tab with the admin account
- [ ] Report a lost item with and without a photo
- [ ] Report a found item; verify it appears on Browse
- [ ] Search and filter by type, category, location and date
- [ ] Open a found item and submit a claim (20+ characters)
- [ ] Confirm the item shows “Claim pending” and the finder gets a notification
- [ ] Sign in as admin; approve the claim and verify the item becomes recovered
- [ ] Verify competing pending claims are rejected and notifications appear
- [ ] Mark an owner’s report recovered manually
- [ ] Delete a report from the dashboard and from the admin reports tab
- [ ] Check the Matches page and the report form’s Smart check panel
- [ ] Resize to mobile width and use the mobile navigation

## Deploy to Vercel

1. Push the project to GitHub.
2. Import the repository in Vercel.
3. Vercel detects Vite. Use:
   - Build command: `npm run build`
   - Output directory: `dist`
4. Add environment variables for Production, Preview and Development:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Deploy. `vercel.json` rewrites every path to `index.html` so React Router deep links work.
6. Set the deployed URL as **Site URL** in Supabase **Authentication → URL Configuration**.
7. Configure SMTP (and optionally the `{{ .Token }}` template) from step 3.
8. Allowlist your production administrator email, create the account and promote it using
   step 5.

## Requirement mapping

| Course area | Where it appears |
| --- | --- |
| Cloud computing | Supabase database/storage/realtime, Vercel deployment, environment configuration |
| Web development | React components, React Router, responsive Tailwind UI, photo uploads, search filters |
| Database management | Relational schema, foreign keys, indexes, partial unique index, SQL triggers, analytics queries |
| Cybersecurity | Passwordless email sign-in link/OTP, email format validation, RLS policies, protected admin route, role-change trigger, admin-only email RPC, per-user storage folders |
| Software engineering | Phased requirements, documented architecture, unit tests, validation, loading/error/empty states, migration-based setup |

## Roadmap

Already implemented beyond the core: matching, notifications, analytics, photo storage and
realtime updates.

Possible next steps:

- Campus map with markers instead of the location dropdown
- QR code attached to physical items that opens a recovery page
- Dedicated recovery history timeline per student
- Email or push notifications in addition to in-app notifications
- Server-side/precomputed matches for very large campuses
- Admin UI for changing roles (today it is intentionally a SQL-only operation)
- Private storage bucket with signed URLs for sensitive photos
- Duplicate-report detection and moderator flagging
- True SSO integration if the university provides an OAuth, SAML or signed-token endpoint
- Microsoft account sign-in restricted to the university tenant

## Troubleshooting

**The app still says “Demo mode” after adding `.env`.**
Restart the Vite dev server. Environment variables are read at startup. Make sure the file
is named `.env` at the project root and both values are set.

**The sign-in email never arrives.**
Check the spam/junk folder and confirm custom SMTP is configured. Supabase's built-in email
service is heavily rate-limited. The Student tab shows which address the link was sent to.
Some college mail systems also block external senders, so a normal personal email is the
most reliable option.

**The sign-in link says invalid or has expired.**
Links are single-use and time-limited. Request a new one from the login page. Also make sure
Supabase **Authentication → URL Configuration → Site URL** points at the app
(`http://localhost:5173/login` locally). Open the link on the device where you want the
session.

**The email contains a link but no six-digit code.**
That is the default Supabase template and the link flow works as-is. To also allow typed
codes, open **Authentication → Emails → Magic link or OTP** and add `{{ .Token }}` as shown
in step 3. On new free-tier projects created after June 2026, configure custom SMTP first;
templates cannot be edited with the built-in mailer.

**I requested too many links / email rate limit exceeded.**
Supabase is throttling requests. Wait a few minutes or configure custom SMTP for higher
limits.

**Signup rejects my email address.**
The app only accepts addresses that look like `name@domain.com`. If an older deployment
still enforces the Adamas domain, run
`supabase/migrations/20261124000000_allow_any_email.sql` in the Supabase SQL editor. It drops
the old `auth.users` triggers and the allowlist table.

**The administrator account cannot be created.**
Make sure **Allow new users to sign up** is enabled, or create the user directly in
**Authentication → Users → Add user** and promote the profile to `admin`.

**The administrator tab says “This account is not an administrator”.**
Promote the profile with the SQL from step 5, then sign in again. The app signs out accounts
that lack the admin role.

**I cannot access /admin after promoting myself.**
The route reads the profile role. Sign out and sign back in so the profile is fetched again.
Confirm the SQL update targeted the right `auth.users` email.

**“permission denied for table profiles” (or items/claims/notifications).**
The PostgREST roles are missing table grants. Run
`supabase/migrations/20261124000001_grant_table_privileges.sql` in the Supabase SQL Editor.
RLS policies still control which rows each user can access.

**Claim submit fails with a permission/42501 error.**
The item is no longer claimable (resolved or deleted), or you are trying to claim your own
item. Refresh the page.

**Realtime is not updating.**
Confirm the migration ran the three `alter publication supabase_realtime ...` statements and
that the project has realtime enabled. The app also refreshes on navigation and after
actions, so data will not be stale for long.

**Storage upload fails.**
Check that the migration created the `item-photos` bucket and its policies. The upload path
must start with the signed-in user's UUID folder; the app handles this automatically.

**The migration errors with “already member of publication”.**
That means the publication statements were already applied. Remove those three lines and
run the rest, or ignore the error if the tables are already published.

**Reset demo data.**
Use the footer button (demo mode only), or run
`localStorage.removeItem('campusfind_demo_v2')` in the browser console and reload.

## Limitations

This is a course project, not a hardened production system:

- Demo mode accepts a fixed OTP (`123456`) and stores the admin password in `localStorage` —
  it is local-only and never meant for real accounts.
- Student verification proves control of an email address; it does not check the Adamas
  portal, the university enrolment database, or that the address is a college account.
- True portal SSO is not possible until the university exposes an API/OAuth/SAML endpoint.
- Email delivery depends on Supabase SMTP. The built-in mailer is rate-limited and not
  suitable for a live campus rollout.
- Item photos are public by URL. Do not upload ID cards or other sensitive documents.
- Claim decisions rely on admin judgement; there is no automated identity verification.
- Matching runs client-side over accessible listings, not as a background service.
- There is no app-level rate limiting, abuse reporting or audit log beyond review notes.

Those are good discussion points for a project report — and clear next steps for anyone
continuing the work.

---

Built with React, Vite, Tailwind CSS, Supabase and Vercel. Reunite responsibly.
