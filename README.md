# Skill Set Go Course Portal

One connected Next.js + TypeScript app for learning, examinations, optional paid credentials and administration. The brand uses the authentic Skill Set Go logo with navy, white and restrained gold accents.

**Exactly two account types: User and Admin.** The portal selector changes navigation; it never grants administrative privileges. Live authorization is based on the protected `public.profiles.role` column.

## Run

```sh
npm ci
npm run dev
```

Open <http://127.0.0.1:3000>. Local preview defaults to explicitly labelled test accounts. Choose **User** or **Admin** on the sign-in page. The local Python assessment is available for testing; other domains require reviewed question banks.

## Real database

The database has been created and the twelve-domain catalogue seeded in:

- Organization: **AgentTrap AI**
- Project: **SKILLSETGOCOURCES**
- Project ID: `smdgqmmnqbhqqhkyqxok`
- [Supabase dashboard](https://supabase.com/dashboard/project/smdgqmmnqbhqqhkyqxok)

The normalized schema includes profiles, domains, resources, enrollments, lesson progress, exam attempts, question snapshots, responses, confirmed violations, orders, issued documents, support tickets, audit logs, webhook receipts, settings and a repository version. All seventeen app tables have RLS enabled. Answer keys and internal records are in an unexposed private schema. Anonymous clients can read published domains; signed-in users can read only owned records. Roles, scores, payments and credentials cannot be modified directly by browser clients.

Migrations in `supabase/migrations/` and `supabase/seed.sql` reproduce the schema and catalogue. The seed never creates fake live users, payments, results, credentials, or unreviewed question banks.

## Connect the protected backend

The API URL and publishable key are already configured locally. A **publishable** key is for public/authenticated access and cannot read answer keys, grade examinations or confirm payments.

Copy `.env.example` to a private `.env.local` when setting up another checkout. Configure:

```dotenv
APP_MODE=live
NEXT_PUBLIC_APP_URL=http://127.0.0.1:3000
NEXT_PUBLIC_SUPABASE_URL=https://smdgqmmnqbhqqhkyqxok.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable key>
SUPABASE_SERVICE_ROLE_KEY=<private sb_secret_ key or legacy service_role key>
CREDENTIAL_SECRET=<random stable secret of at least 32 characters>
GOOGLE_AUTH_ENABLED=false
```

Alternatively use `DATABASE_URL` for Supabase's transaction pooler instead of the server API key. The direct PostgreSQL adapter holds a transaction lock; the REST adapter uses server-only RPCs with version checks to reject conflicting writes safely. Refresh/retry if another request finishes simultaneously. Private Storage can use the signed-in user's permissions, or the configured server key.

**Never commit `.env.local`, server keys, database passwords or payment secrets.** `.gitignore` excludes them. Restart the app after editing environment variables. Local test state remains separate from live Supabase records.

The private backend credential is still required to switch this checkout from preview to live operation. The database itself and public catalogue were independently verified in Supabase.

## Google login

OAuth initiation, PKCE callback, cookie refresh and account creation are implemented. Email magic-link sign-in is also implemented. Google was checked in the target project and is still **disabled** until the owner configures its OAuth client ID and secret.

Google Cloud's authorized redirect URI must be:

```text
https://smdgqmmnqbhqqhkyqxok.supabase.co/auth/v1/callback
```

Configure the credentials in Supabase Authentication, then enable `GOOGLE_AUTH_ENABLED=true`. Follow [the Google setup guide](docs/GOOGLE-LOGIN.md). Google credentials do not belong in browser code. New sign-ins always get a User profile; the project owner assigns Admin to a specific verified account in the database.

## Application features

- Separate responsive User and Admin navigation, mobile menu, searchable domain catalogue, category filters and a searchable user directory.
- Dedicated admin views for users, courses/resources, exams, payments, documents, support, settings and audit history.
- Enrollment deduplication; video/reading links; authorized private PDFs; persisted self-reported learning acknowledgements; optional direct-exam consent.
- Thirty single-choice questions, shuffled options, immutable question snapshots, server deadlines and scoring, 23/30 passing mark, maximum five attempts.
- Three distinct confirmed tab/fullscreen exits auto-submit. Overlapping/replayed events do not count. Accessibility mode disables exit penalties and fullscreen requirements. Browser monitoring is imperfect and is not proof of cheating.
- ₹350 individual documents, ₹400 bundle before the first attempt, ₹500 bundle after starting. Razorpay order/capture/signature/webhook handling is implemented; real provider payments require keys and verification.
- Automatic issuance after passing and verified payment, free performance PDF, Certificate of Completion PDF/4K PNG/SVG, appreciation letter, HMAC QR verification and revocation.
- Signature upload with a placeholder until the original signature is supplied. Issued recipient/domain/signature references are snapshotted.

## Checks

```sh
npm run typecheck
npm test
npm run build
# With the local preview running:
npm run test:workflow
# Read-only verification of the configured live project:
node scripts/verify-supabase.mjs
```

The PostgreSQL test executes the real relational migration, checks foreign keys and uniqueness, tests RLS ownership, rejects role escalation and answer-key access, verifies the repository round trip, and rejects stale REST writes. The HTTP workflow test uses isolated local fixtures and removes its own records. It must not be run against a live environment.

## Remaining launch work

Supply the private backend credential, configure Google OAuth and the intended Admin account, publish reviewed content and question banks across all twelve domains, verify Razorpay in test mode, finalize legal/refund policies, and complete operational hardening. Transactional email beyond Auth, automatic refunds, AI question drafting, account deletion, malware scanning and shared rate limiting remain out of scope for this MVP. Expired attempts are finalized on the next server request; there is no scheduled sweeper yet.

The repository is Vercel-ready, but no deployment is claimed. The backend still reads a full application snapshot for business operations; normalize access into targeted queries and load test before scaling. Test records and server secrets are excluded from GitHub.
