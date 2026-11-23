# Verification record

## Update — 24 November 2026

The AgentTrap AI project's SKILLSETGOCOURCES database (`smdgqmmnqbhqqhkyqxok`) now has the relational migrations and twelve-domain catalogue applied. Seventeen application tables have RLS enabled. Public REST returned twelve published domains, the publishable key was rejected by the privileged repository RPC, email Auth was enabled, and Google Auth was disabled.

The app now supports only User and Admin. The revised Admin workspace has dedicated views and a searchable account directory; the User catalogue has working keyword/category filters; compact layouts use a keyboard-accessible navigation dialog. Google OAuth is wired with PKCE/session refresh and protected database profile authorization, pending the owner's provider credentials.

The current checks pass ten tests, including a PostgreSQL migration/ownership/role/serialization test, and twenty-three HTTP workflow checks. The production build passes. Private server credentials are still needed to switch the local checkout to live operation. No Google login, real payment or deployment is represented as verified.

The earlier notes below describe the initial sandbox release; the relational schema and real-project work above supersede its database limitations.

Verified locally on Windows with Node 24 and the local sandbox adapter. This records actual results; it does not certify a live deployment.

## Passed

- TypeScript check: `npm run typecheck`.
- Next.js production build: `npm run build`.
- Nine unit tests: 22/30 vs 23/30, paid/pass issuance idempotency, pricing boundary, deadline finalization, answer-key stripping, role/signature checks, confirmed-exit debounce and threshold, accessibility exemption, late early-bundle capture held for review.
- Twenty-three HTTP workflow checks against the running application: enrollment deduplication; ₹400 quote; repeated and concurrent start idempotency; early quote invalidation; thirty questions without keys; cross-user isolation; passing without premature issuance; free report before payment; paid issuance idempotency; two valid document PDFs; sample watermark/signature/QR; actual PNG IHDR of 3840 × 2160; report download; student permission denial; origin checks; fifth-attempt cap; late-answer rejection; three-exit autosubmission; private admin PDF upload; enrollment-gated download; persisted learning acknowledgement; genuine/tampered verification tokens; and revocation blocking verification/downloads.
- Certificate and appreciation PDFs were reopened and rendered to inspect layout, margins, logo, text and QR.
- The exported 4K certificate template was visually inspected.
- Public homepage, local sign-in, student dashboard and documents page were rendered and inspected in the app browser at narrow and desktop panel widths.

## Issues found and fixed

- Localhost and 127.0.0.1 origin normalization initially rejected legitimate local sign-in. Writes now check an explicit configured-origin allowlist, with loopback aliases restricted to sandbox.
- Concurrent route bundles and Windows file locks could interrupt a local atomic save. The sandbox now shares its queue across route bundles, avoids writes for unchanged reads, uses unique temporary filenames and retries transient Windows rename locks.
- An unpaid early quote could otherwise cross the first-attempt boundary. Sandbox revalidates it; verified provider captures outside quote conditions are retained for finance review and do not create credentials.
- Answer-save failures now remain tracked per question, so a later successful save cannot hide another failed response.
- Credential name, domain name and signature-file reference are snapshotted at issuance.
- The browser-based PNG download path was replaced with a server-generated PNG endpoint. Its actual 4K dimensions were confirmed by the HTTP test.
- Profile, support and admin links remain available in compact layouts; exam confirmation uses a native modal dialog for keyboard focus containment.

## Not verified / not complete

- Live Supabase Auth, OAuth/email delivery, PostgreSQL adapter/migration, Supabase Storage and Razorpay requests/webhooks need staging credentials and an active project. The linked Skill Set Go account contained an inactive project; no hosted data was changed.
- No Vercel project was linked, build uploaded, domain changed or deployment created.
- Native browser download automation timed out in the app browser. The replacement server PNG endpoint is verified over HTTP, but its final native save-dialog interaction has not been certified.
- A dedicated 390px device run and exhaustive keyboard/screen-reader audit have not been completed. The layout was visually checked at the available narrow and desktop panel widths.
- There is no claim of complete coverage for all six master prompts. The remaining production and content scope is listed in the README phase table.

The test fixture's generated learner records are removed after testing. No test score is represented as a real learner achievement.
