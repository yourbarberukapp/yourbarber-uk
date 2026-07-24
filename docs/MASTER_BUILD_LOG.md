# YourBarber — Master Build Log

**Last updated:** 2026-07-24  
**For:** Claude, Gemini, OpenAI, or any AI assistant working on this codebase.

> **Read this before touching anything, and read the root `CLAUDE.md` too — it is now the primary source of truth.** This document is a supplementary build log. If something is marked ✅ — it is done. Do not re-implement it, do not refactor it unless explicitly asked, do not create duplicate routes or components. Check here first.
>
> **This file was significantly out of date as of 2026-07-24** (last touched 2026-05-02, before the SMS-removal and passcode-auth pivot). Sections below have been corrected to match the codebase as it actually is today. If you find another stale claim, fix it in place rather than trusting it.

---

## Stack (actual — overrides any outdated info elsewhere)

| Layer | What's actually used |
|---|---|
| Framework | Next.js **14** App Router (not 15) |
| Database | PostgreSQL via **Prisma 7** + `@prisma/adapter-pg` + `pg.Pool` |
| Auth (owner/barber) | **NextAuth v5, 6-digit passcode `Credentials` provider** (`src/lib/auth.ts`) — no email/password, no Google/Facebook OAuth. Those were fully removed 2026-07-24; do not reintroduce. |
| Customer auth | Separate signed JWT via `jose`, stored in `yb-customer-session` httpOnly cookie. Login via Wallet-pass access code at `/me/login` (`/customer/login` is a legacy redirect shim to the same place — keep it, other pages still link to it) |
| SMS | **Removed entirely (2026-07-24).** No Vonage, no Twilio, no `src/lib/vonage.ts`/`src/lib/twilio.ts`. All client notifications go through the Wallet push channel (`src/lib/wallet/notify.ts`, `apnsPush.ts`, `googlePush.ts`). Do not reintroduce an SMS provider. |
| Email | Resend (`RESEND_API_KEY`) |
| Photo storage | AWS S3, private bucket, presigned GET URLs at render time |
| Hosting | Vercel, auto-deploys from `main` branch |
| Domain | `yourbarber.uk` — Vercel nameservers. Subdomains `*.yourbarber.uk` → `/shop/[slug]` via `src/middleware.ts` |

---

## Critical Architecture Notes

- **Never use `prisma migrate dev`** — requires TTY, breaks on Vercel. Always write raw SQL migration files manually under `prisma/migrations/TIMESTAMP_name/migration.sql`, then run `prisma migrate deploy`.
- **`prisma migrate deploy` runs automatically on every Vercel build** — added to `package.json` build script 2026-04-27.
- **All DB queries must be scoped to `shopId`** — multi-tenant, row-level isolation.
- **Session shape:** `{ shopId, barberId, name, role }` — role is `"owner"` or `"barber"`.
- **Role routing:** Barbers → `/barber` on login. Owners → `/dashboard`. Dashboard has a server-side barber redirect safety net.
- **Prisma 7 datasource:** No `url` field in `schema.prisma`. Uses `prisma.config.ts` instead.
- **After any schema change:** Run `prisma generate` locally to update TS types. VS Code may cache stale types — Ctrl+Shift+P → "TypeScript: Restart TS Server".

---

## What's Built ✅

### Authentication & Users
- ✅ Barber/owner login — **6-digit passcode**, `src/app/owner/login/` → NextAuth v5 `Credentials` provider (`src/lib/auth.ts`). `/login` redirects to `/owner/login` for old links.
- ❌ OAuth (Google/Facebook), password login, forgot/reset-password — **all removed 2026-07-24**. `/setup`, `/api/setup`, `/api/auth/register` deleted. Do not re-add.
- ✅ Signup is fully open — `POST /api/signup` creates Shop + owner Barber and returns a generated passcode in the response (`src/lib/ownerPasscode.ts`)
- ✅ Staff passcodes — `POST /api/team` (owner-only) generates a passcode for a new staff member, shown once
- ✅ DB-backed rate limiting on passcode login — `src/lib/rateLimit.ts`, 5 attempts / 15 min per passcode + per IP
- ✅ Role-based redirect on login — barbers → `/barber`, owners → `/dashboard`
- ✅ Customer auth — Wallet pass access code at `/me/login`, `yb-customer-session` JWT cookie. **No OTP, no SMS.**

### Owner Dashboard (`/dashboard`)
- ✅ Dashboard home — `src/app/(dashboard)/dashboard/page.tsx` (stats + recent activity)
- ✅ Sidebar — `src/app/(dashboard)/Sidebar.tsx` — separate nav arrays for owner vs barber roles
  - Owner nav: Dashboard, Walk-ins, Appointments, Customers, Reminders, Analytics (Soon), Team, Feedback, Settings
  - Barber nav: My View, Walk-ins, Clients
- ✅ Customer list — `src/app/(dashboard)/customers/page.tsx`
- ✅ Customer detail + visit history + photos — `src/app/(dashboard)/customers/[id]/page.tsx`
- ✅ Record a cut — `src/app/(dashboard)/customers/[id]/visit/new/` — chip selectors, photos, recommendations
- ✅ Team management — `src/app/(dashboard)/team/` — add/edit/deactivate barbers
- ✅ Appointments — `src/app/(dashboard)/appointments/` — grid view, create, cancel
- ✅ Feedback — `src/app/(dashboard)/feedback/page.tsx` — tickets, resolve, assign
- ✅ Reminders — `src/app/(dashboard)/reminders/page.tsx` — manual trigger per customer
- ✅ Settings — `src/app/(dashboard)/settings/page.tsx` + `SettingsForm.tsx`
  - Fields: name, address, logo, slug, shop type, allow barber reminders, **default cut time**, **google review URL**
- ✅ Microsite editor — `src/app/(dashboard)/settings/microsite/` — hours, services, gallery photos
- ✅ Style manager — `src/app/(dashboard)/settings/StylesManager.tsx`
- ✅ QR section in settings — `src/app/(dashboard)/settings/QRSection.tsx` (shows URL, not full download yet)
- ✅ Barber busy/free toggle — barbers set themselves busy; shown in waitlist panel

### Walk-in Waitlist
- ✅ `WalkIn` model — `shopId`, `customerId`, `familyMemberId`, `groupId`, `status`, `arrivedAt`, `note`, `preferredStyle`
- ✅ Waitlist page — `src/app/(dashboard)/waitlist/page.tsx` — server component, passes data to client
- ✅ `WaitlistClient.tsx` — live poll every 20s, barber availability panel, wait time estimates
- ✅ **Family group display** — entries with same `groupId` merged into one row: "Luke + Tommy + Jack" with ×N badge
- ✅ Status actions: "In chair" / "Done" / "No show" — update all group members simultaneously
- ✅ Waitlist API — `GET /api/waitlist`, `PATCH /api/waitlist/[id]`
- ✅ Barbers API — `GET /api/barbers` (for waitlist availability panel)

### Arrival Screen (Wall QR Destination)
- ✅ `/arrive/[slug]` — public, no login — `src/app/arrive/[slug]/page.tsx` + `ArriveClient.tsx`
- ✅ Phone entry → known customer: greet + add to waitlist; unknown: ask name → create account → add
- ✅ Family check-in — shows customer's own family members + shared members; select any combination
- ✅ **Family check-in grouping** — multiple WalkIns share a `groupId` (UUID) when family checks in together
- ✅ Preferred style selection (from ShopStyle catalogue)
- ✅ Note field ("just a trim today")
- ✅ Queue position + wait time shown after check-in
- ✅ Duplicate guard — won't add same customer twice if already on active list today
- ✅ `POST /api/arrive` — handles lookup (phone only) and final submit (with familyMemberIds)

### Barber Mode (`/barber`)
- ✅ Barber view — `src/app/(barber)/barber/page.tsx` + `BarberClient.tsx`
- ✅ Shows active waitlist, claim client, record cut shortcut
- ✅ Busy/free toggle — `PATCH /api/barber/status`
- ✅ Role-gated — only barbers land here

### Private Barber Notes (2026-05-02)
- ✅ `Visit.privateNotes` — barber's personal relationship notes (dog name, conversation details, personal touches)
- ✅ **Strictly scoped to the recording barber** — never returned to owner, other barbers, or customers
- ✅ API strips `privateNotes` from GET responses unless `session.barberId === visit.barberId`
- ✅ Recording form — Notes tab now has "Shared notes" (whole shop) + lime-bordered "Private notes — only you see this"
- ✅ Customer detail page — private notes render with lime left border only for the barber who wrote them
- **Why this matters:** A barber manager (first live pitch) specifically requested this. If the owner can read it, barbers stop writing honest notes. It's the personal relationship layer that makes regulars feel recognised — and it's the moat that no other shop has access to even if the client takes their Cut Passport elsewhere.

### Shop Window Signage (2026-05-02)
- ✅ `/window/[slug]` — public TV display for shop window, no auth required
- ✅ Two states: "Walk in now. No wait." (empty queue) vs "~X min wait / Scan to save your place"
- ✅ Live QR code → `/arrive/[slug]`, polls every 30s, opening hours, rotating portfolio photos
- ✅ Footer ticker scrollable from street, 16:9 landscape layout
- ✅ `GET /api/window/[slug]` — public API, returns queue state + presigned portfolio photos
- **Different from in-shop TV:** No client names shown (privacy), outward-facing message for passersby

### Demo Phone View (2026-05-02)
- ✅ `/demo/passport` — mobile-first Cut Passport demo, no login required
- ✅ Shows real data from benj-barbers demo shop (clients with visit photos)
- ✅ Queue-style list of 3–4 clients, tap to expand Cut Passport inline
- ✅ First client pre-expanded — hand phone to barber, say "this is the whole app"
- ✅ `GET /api/demo/passport` — public, scoped strictly to `benj-barbers` slug
- ✅ Linked from `/demo` page as "Quick passport demo" button on the Barber card
- **Purpose:** Replaces the "scrabbling" in live pitches. One URL, pre-loaded, no login, works in 30 seconds.

### Customer Portal
- ✅ `/me` — `src/app/(customer)/me/page.tsx` — visit history, photos, family management
- ✅ **5-star rating** — replaces old thumbs up/down. Stars 1–2 = negative (with feedback textarea), 3 = neutral, 4–5 = positive
- ✅ **Google Review CTA** — shown only after exactly 5-star rating, links to `shop.googleReviewUrl`
- ✅ `RateVisit.tsx` — star picker, hover highlights, submit flow
- ✅ `FamilyManager.tsx` (in me/) — add/remove family members, manage sharing
- ✅ Family sharing — co-parent can check in owner's family members; `FamilySharing` model
- ✅ `GET/PATCH /api/customer/me` — customer profile
- ✅ `POST /api/customer/visits/[id]/rate` — star rating + feedback, returns googleReviewUrl if 5 stars
- ✅ `GET/POST /api/customer/family`, `DELETE /api/customer/family/[id]`
- ✅ `POST /api/customer/family/share`
- ✅ Customer export — `GET /api/customer/export`
- ✅ Customer preferences — `GET/PATCH /api/customer/preferences`

### QR Check-in (Barber-Scans-Client, Secondary Flow)
- ✅ `CheckIn` model — `qrToken`, `expiresAt`, `familyMemberId`, `groupMemberIds`, `includeCustomer`
- ✅ `/checkin/[qrToken]` — `src/app/checkin/[qrToken]/page.tsx` + `StartCutButton.tsx`
- ✅ `POST /api/qr/checkin/start`, `POST /api/qr/checkin/finish`, `GET /api/qr/scan`

### Shop Microsite
- ✅ `[slug].yourbarber.uk` → `/shop/[slug]` via subdomain middleware rewrite
- ✅ Microsite page — `src/app/shop/[slug]/page.tsx` — branding, hours, services, gallery, booking link
- ✅ Styles gallery — `src/app/shop/[slug]/styles/`
- ✅ Booking page — `src/app/shop/[slug]/book/`
- ✅ Queue status component — `src/components/microsite/QueueStatus.tsx`
- ✅ `GET /api/shop/[slug]/queue` — public queue length for microsite
- ✅ **Product catalogue** (2026-07-24) — `ShopProduct` model, display-only (no checkout), settings editor at `/settings/microsite` (`ProductsEditor.tsx`), API at `/api/microsite/products`
- ✅ **Google reviews link + real social links** (2026-07-24) — public page now shows a "Read our reviews" link using `shop.googleReviewUrl`, and footer social icons (Instagram/Facebook/X) only render when a real URL is set (`Shop.instagramUrl/facebookUrl/xUrl`)
- ✅ **Completeness gate** (2026-07-24) — `src/lib/microsite.ts`'s `isMicrositeComplete()` (address, phone, hours, cover photo, 1+ service required) gates whether `/shop/[slug]` shows the real page or a "coming soon" placeholder. Settings page shows an itemized checklist of what's missing. Built as one reusable function specifically so a future paywall can reuse the same check instead of duplicating field logic.

### Ratings & Feedback
- ✅ `Feedback` model — `rating`, `stars`, `issue`, `sourceType`
- ✅ `FeedbackTicket` model — `status`, `resolution`, `assignedBarberId`, `preferredDate`
- ✅ Feedback dashboard — view tickets, resolve, assign to barber
- ✅ `POST /api/feedback/create`, `/api/feedback/[id]/complete`, `/api/feedback/[id]/resolve`

### Reminders & Wallet Push (SMS removed 2026-07-24)
- ❌ Vonage/Twilio SMS — **removed entirely**, no per-message cost, ever. `src/lib/vonage.ts` and `src/lib/twilio.ts` no longer exist. Do not reintroduce, even as a "fallback" — ask first.
- ✅ Client notifications now go through the Wallet pass push channel — `src/lib/wallet/notify.ts`, `src/lib/wallet/apnsPush.ts` (Apple), `src/lib/wallet/googlePush.ts` (Google object PATCH)
- ✅ Manual reminder trigger — owner/barber sends reminder from customer profile
- ✅ Scheduled reminder cron — `GET /api/cron/reminders` (CRON_SECRET protected)
- ✅ `POST /api/reminders/send`, `GET /api/reminders/scheduled`, `GET /api/reminders/preview`
- ✅ Appointment reminders — `POST /api/appointments/[id]/remind`

### Database Schema (prisma/schema.prisma) — current models
- `Shop` — name, slug, logoUrl, address, phone, about, coverPhotoUrl, googleMapsUrl, bookingUrl, openingHours, defaultReminderWeeks, shopType, allowBarberReminders, **defaultCutTime**, **googleReviewUrl**
- `Barber` — email, passwordHash, role, isActive, bio, photoUrl, resetToken, acceptsBookings, workingHours, **isBusy**
- `Customer` — phone, name, smsOptIn, lastVisitAt, accessCode, preferredReminderWeeks, primaryBarberId, otpCode, otpExpiry
- `FamilyMember` — customerId, name
- `FamilySharing` — ownerId, sharedWithPhone
- `Visit` — barberId, visitedAt, notes, **privateNotes**, cutDetails (JSON), recommendation, cutRating, **stars**, familyMemberId
- `VisitPhoto` — visitId, url, angle
- `WalkIn` — customerId, familyMemberId, **groupId**, status, arrivedAt, note, preferredStyle
- `CheckIn` — qrToken, expiresAt, familyMemberId, groupMemberIds, includeCustomer
- `Appointment` — barberId, serviceId, scheduledAt, duration, status
- `Feedback` — visitId, rating, **stars**, issue, sourceType
- `FeedbackTicket` — feedbackId, status, resolution, assignedBarberId
- `ShopStyle` — name, category, sortOrder, active, imageUrl
- `ShopService` — name, duration, description, price
- `ShopPhoto` — url, caption, sortOrder
- `DemoLead` — name, shopName, phone, email
- `Barber` also has `ownerPasscode`, `ownerPassAuthToken`, `ownerPassSerialNumber` (passcode auth + owner Wallet card)
- `Customer` also has `accessCode`, `applePassSerialNumber`, `googlePassId`, `passAuthToken`, `passMessage`, `loyaltyStamps`
- `RateLimitBucket` — bucketKey, count, windowStart, expiresAt (passcode login rate limiting)
- **`SmsLog` and `twilioSid`/`otpCode`/`otpExpiry`/`smsOptIn` fields no longer exist — removed with SMS**

### Migrations applied (in order)
1. `20260424000000_add_access_code`
2. `20260424094823_init`
3. `20260424094824_add_access_code`
4. `20260424100000_add_cut_details`
5. `20260424200000_shop_microsite`
6. `20260424300000_barber_reset_token`
7. `20260424400000_add_barber_photo`
8. `20260425133706_add_feedback_tables`
9. `20260425153425_add_shop_styles`
10. `20260425213542_add_shop_style_image_url`
11. `20260427000000_barber_busy_status`
12. `20260427100000_shop_default_cut_time`
13. `20260427200000_shop_google_review_url`
14. `20260427300000_family_and_stars` — FamilyMember, FamilySharing, stars on Feedback+Visit, familyMemberId on WalkIn+CheckIn, groupMemberIds+includeCustomer on CheckIn
15. `20260427400000_walkin_group_id` — groupId on WalkIn
16. `20260502000000_visit_private_notes` — privateNotes (TEXT, nullable) on Visit

---

## What's NOT Built Yet ❌

### 0. Digital Wallet Pass — Apple Wallet / Google Wallet — ✅ BUILT (2026-07-24), see CLAUDE.md

The vision described in earlier versions of this doc (replace SMS with Wallet push, pass = client identity, free push notifications) **is now implemented**, not a future plan. SMS has been removed entirely. See root `CLAUDE.md` "Apple Wallet & Google Wallet Passes" / "Owner & Staff Passcode Login" sections for the current architecture:

- `src/lib/wallet/passGenerator.ts` — canonical pass generator (`generateClientApplePass`, `generateClientGooglePass`, `generateOwnerApplePass`). **The old `src/lib/walletGenerator.ts` (appointment-oriented, pre-pivot) was deleted 2026-07-24** — if you find code importing it, that's a regression, not a valid reference.
- Live pass endpoints actually wired to the frontend: `GET /api/wallet/client/apple`, `GET /api/wallet/client/google` (called from `ArriveClient.tsx`'s "Save your loyalty card" buttons — **fixed 2026-07-24**, they previously pointed at a dead-end legacy route pair `/api/customer/wallet/apple|google` that produced passes with the wrong serial scheme and no push token, meaning arrive-page passes could never receive live push updates)
- Serial number scheme: `yb-client-{accessCode}` (customers), `yb-owner-{passcode}` (owner cards) — the PassKit web service (`/api/wallet/v1/passes/...`) and push senders depend on this prefix
- Owner Wallet business card — `GET /api/wallet/owner/apple`, static (no live push), carries the owner's sign-in passcode as its QR/barcode

The **modular multi-vertical vision** (YourStyle network, universal pass across barbershops/nail bars/etc.) described in earlier drafts of this doc is still just a vision, not started — gate that on "5+ shops paying," per the original plan.

---

### 1. Analytics (still open)
- `/analytics` in sidebar shows as "Soon" placeholder
- No page or data at that route yet
- Planned: visits per week, retention rate, busiest days, revenue

### 2. Wallet cert / S3 credentials — real values not confirmed in this environment (still open, but not a code gap)
- The code paths are real and tested: reminders call `src/lib/wallet/notify.ts`; uploads (visit photos, style images, shop logo as of 2026-07-24) all use `src/lib/s3.ts`'s presigned-URL flow
- But `.env.local`'s `AWS_ACCESS_KEY_ID` is literally the placeholder string `your-access-key`, and Apple/Google Wallet cert env vars are unconfirmed — until real credentials are set, uploads and signed/installable passes can't actually complete in this environment. Check Vercel's production env vars have real values; don't assume they match `.env.local`.

### ~~QR Code Download~~ — ✅ already built, this doc was wrong
- `/api/qr/arrive/[slug]` generates real SVG previews and printable PDF posters/stickers, wired up in `QRSection.tsx`. Verified live 2026-07-24 (200 OK, valid SVG + 37KB PDF returned). Don't re-build this.

### ~~PWA "Add to Home Screen"~~ — ✅ already built, this doc was wrong
- `public/manifest.json` + both icon files (`icon-192.png`, `icon-512.png`) all serve correctly. Verified live 2026-07-24. Don't re-build this.

### ~~Real logo on Wallet pass / logo upload~~ — logo upload is now built (2026-07-24)
- `POST /api/settings/logo` + file picker in Settings, mirrors the existing style-image upload pattern exactly
- Still open: `src/lib/wallet/artwork.ts` doesn't yet pull the real `shop.logoUrl` into the pass artwork — wire that up as a follow-on

### ~~Google Wallet owner card~~ — ✅ built (2026-07-24)
- `generateOwnerGooglePass` in `passGenerator.ts` + `/api/wallet/owner/google`. Sidebar "My Owner Card" now offers both Apple and Google.

---

## Do Not Re-implement — Already Done

| Thing | Why it might seem missing | Reality |
|---|---|---|
| Any SMS (Twilio or Vonage) | Old commits/docs reference SMS providers | **Removed entirely 2026-07-24.** No `vonage.ts`, no `twilio.ts`, no `SmsLog` model. All client notifications go through Wallet push. Do not reintroduce, even as a fallback. |
| Google/Facebook OAuth, password login | Old docs describe it as current | **Removed entirely 2026-07-24.** Owner/barber auth is passcode-only via NextAuth `Credentials` provider (`src/lib/auth.ts`). Do not reintroduce OAuth or password fields. |
| Iron Session | CLAUDE.md says "Iron Session" | Replaced by NextAuth v5. Do not install or use iron-session. |
| `src/lib/walletGenerator.ts` | Some old code/docs reference it | **Deleted 2026-07-24** (appointment-oriented, pre-pivot generator). Use `src/lib/wallet/passGenerator.ts` instead. |
| Walk-in waitlist | Might look incomplete | Fully built including family grouping. See `/waitlist` and `WalkIn` model. |
| Family check-in | Might not be obvious from schema | Done. `groupId` on WalkIn, `FamilyMember` + `FamilySharing` models, full UI. |
| 5-star ratings | Old code may reference `rating: 'positive'/'negative'` | Upgraded to `stars: 1-5`. Both fields exist on Feedback — `rating` (derived string) and `stars` (int). |
| `prisma migrate dev` | Standard Prisma workflow | Broken on this project — always write SQL manually + `migrate deploy`. |
| Customer portal at `/customer` | Old route | Moved to `/me` under `(customer)` route group. `/customer` redirects. |

---

## Environment Variables (Vercel + `.env.local`)

```
DATABASE_URL
NEXTAUTH_SECRET
NEXTAUTH_URL
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_S3_BUCKET
AWS_REGION
RESEND_API_KEY
CRON_SECRET
SESSION_SECRET
APPLE_PASS_TYPE_ID
APPLE_TEAM_ID
APPLE_PASS_CERT_PEM
APPLE_PASS_KEY_PEM
APPLE_WWDR_PEM
APPLE_PASS_WEB_SERVICE_URL
GOOGLE_WALLET_ISSUER_ID
GOOGLE_WALLET_SERVICE_ACCOUNT_KEY
NEXT_PUBLIC_APP_URL
```

`VONAGE_*` variables no longer apply — remove from Vercel if still set.

---

## Demo Credentials

- **Shop:** Ben J Barbers
- **Owner login:** 6-digit passcode (generated at signup / shown once in Team page — no email/password login exists anymore)
- **Arrival URL:** `yourbarber.uk/arrive/ben-j-barbers` (or whatever the shop slug is)

---

## Key File Map

| Purpose | File |
|---|---|
| DB client | `src/lib/db.ts` |
| Auth session helper | `src/lib/session.ts` |
| Customer auth helper | `src/lib/customerAuth.ts` |
| SMS (Vonage) | `src/lib/vonage.ts` |
| SMS (legacy shim) | `src/lib/twilio.ts` → re-exports vonage |
| S3 upload + presigned URL | `src/lib/s3.ts` |
| Subdomain → `/shop/[slug]` | `src/middleware.ts` |
| Prisma schema | `prisma/schema.prisma` |
| Prisma config (v7) | `prisma.config.ts` |
| Owner sidebar | `src/app/(dashboard)/Sidebar.tsx` |
| Waitlist (server) | `src/app/(dashboard)/waitlist/page.tsx` |
| Waitlist (client + grouping) | `src/app/(dashboard)/waitlist/WaitlistClient.tsx` |
| Arrival page | `src/app/arrive/[slug]/ArriveClient.tsx` |
| Arrive API | `src/app/api/arrive/route.ts` |
| Waitlist API | `src/app/api/waitlist/route.ts` + `src/app/api/waitlist/[id]/route.ts` |
| Barber mode | `src/app/(barber)/barber/BarberClient.tsx` |
| Customer portal | `src/app/(customer)/me/page.tsx` |
| Shop window signage | `src/app/window/[slug]/page.tsx` + `src/app/api/window/[slug]/route.ts` |
| Demo phone passport | `src/app/demo/passport/page.tsx` + `src/app/api/demo/passport/route.ts` |
| Star rating component | `src/app/(customer)/me/RateVisit.tsx` |
| Rate API | `src/app/api/customer/visits/[id]/rate/route.ts` |
| Settings API | `src/app/api/settings/route.ts` |
| Settings form | `src/app/(dashboard)/settings/SettingsForm.tsx` |

---

*Update this file whenever a feature is completed or the architecture changes. Do not let it go stale.*
