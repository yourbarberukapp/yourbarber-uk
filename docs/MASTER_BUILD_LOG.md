# YourBarber — Master Build Log

**Last updated:** 2026-05-02  
**For:** Claude, Gemini, OpenAI, or any AI assistant working on this codebase.

> **Read this before touching anything.** This document is the single source of truth for what has been built, what is in progress, and what is next. If something is marked ✅ — it is done. Do not re-implement it, do not refactor it unless explicitly asked, do not create duplicate routes or components. Check here first.

---

## Stack (actual — overrides any outdated info elsewhere)

| Layer | What's actually used |
|---|---|
| Framework | Next.js **14** App Router (not 15) |
| Database | PostgreSQL via **Prisma 7** + `@prisma/adapter-pg` + `pg.Pool` |
| Auth | **NextAuth.js v5** (CLAUDE.md incorrectly says Iron Session — ignore that) |
| Customer auth | Separate signed JWT via `jose`, stored in `yb-customer-session` httpOnly cookie |
| SMS | **Vonage** (NOT Twilio — `src/lib/vonage.ts`). `src/lib/twilio.ts` is a one-line re-export shim for legacy imports |
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
- ✅ Barber/owner login — `src/app/(auth)/login/page.tsx` → NextAuth v5
- ✅ OAuth (Google/Facebook) — gates on pre-registered `Barber` rows
- ✅ Password reset — Resend email, `resetToken`/`resetTokenExpiry` on Barber model
- ✅ Forgot password — `src/app/(auth)/forgot-password/`, `src/app/(auth)/reset-password/`
- ✅ Role-based redirect on login — barbers → `/barber`, owners → `/dashboard`
- ✅ Customer auth — OTP via Vonage SMS, `yb-customer-session` JWT cookie
  - Dev shortcut: OTP is always `12345` when `NODE_ENV !== 'production'` and no `VONAGE_API_KEY`

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

### Ratings & Feedback
- ✅ `Feedback` model — `rating`, `stars`, `issue`, `sourceType`
- ✅ `FeedbackTicket` model — `status`, `resolution`, `assignedBarberId`, `preferredDate`
- ✅ Feedback dashboard — view tickets, resolve, assign to barber
- ✅ `POST /api/feedback/create`, `/api/feedback/[id]/complete`, `/api/feedback/[id]/resolve`

### Reminders & SMS
- ✅ Vonage SMS wired — `src/lib/vonage.ts`
- ✅ `src/lib/twilio.ts` — shim that re-exports from vonage (do not remove, legacy imports depend on it)
- ✅ Manual reminder trigger — owner/barber sends reminder from customer profile
- ✅ Scheduled reminder cron — `GET /api/cron/reminders` (CRON_SECRET protected)
- ✅ `POST /api/reminders/send`, `GET /api/reminders/scheduled`, `GET /api/reminders/preview`
- ✅ Appointment reminders — `POST /api/appointments/[id]/remind`
- ⚠️ SMS is wired but **not confirmed live in production** — Vonage credentials must be set in Vercel env vars

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
- `SmsLog` — customerId, message, twilioSid, status
- `DemoLead` — name, shopName, phone, email

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

### 0. Digital Wallet Pass — Apple Wallet / Google Wallet (Priority 0 — Vision, Not Started)

**The idea (decided 2026-05-02):** Replace SMS as the primary client communication channel with a branded `.pkpass` / Google Wallet pass that lives permanently on the client's phone.

**Why it matters:**
- SMS (Vonage) costs ~5p per message. At scale this becomes a meaningful monthly cost that grows with success.
- A Wallet pass, once installed, allows **free push notifications** to the client's lock screen via Apple APNS / Google FCM.
- The pass QR code becomes the client's permanent identity — barber scans it, system looks up who it is, no phone number typing required for returning clients.
- It elevates YourBarber from "web utility" to "phone citizen" — sits in the wallet next to Lloyds, Tesco, and boarding passes.

**The architecture (agreed):**
- **Wallet pass = quick identity + free nudges.** Contains a QR with a unique client token. Barber scans it → auto check-in.
- **Browser = full passport.** Tapping "Details" on the back of the pass opens a secure browser page (token in URL, no login needed) showing full cut history, photos, grades.
- SMS stays as **fallback only** for clients who haven't installed the pass yet.

**What needs building:**
1. Apple Developer account ($99/yr) + Pass Type ID certificate + signing server that wraps pass JSON → `.pkpass`
2. Google Wallet service account + pass class definition
3. `WalletPass` model on Customer — `applePassSerial`, `googlePassId`, `passToken` (UUID, the QR payload)
4. `POST /api/customer/wallet/apple` — generates and returns `.pkpass` file
5. `POST /api/customer/wallet/google` — returns Google Wallet save link
6. `POST /api/customer/wallet/notify` — sends free push update to installed passes (e.g. "Your place is next")
7. Update `/arrive/[slug]` — after check-in, offer "Add to Apple/Google Wallet" button
8. Update barber QR scanner — recognise `passToken` as a valid scan payload (alongside existing `qrToken`)
9. Update `/me` customer portal — "Your pass" section with install buttons

**The modular vision (do not build all at once):**
- **Phase 1 — YourBarber:** Pass = client identity for barbershops. Replaces SMS for queue nudges.
- **Phase 2 — YourStyle network:** One master pass works across barbershops, nail bars, threading studios. The shop gets a branded entry point; the client gets one universal card. Each shop pays for only the modules they need (Loyalty stamps / Cut Passport / Queue).
- **Phase 3 — Consumer passport:** Clients register once at `yourstyle.uk`, get a free pass. Shops who aren't on the platform still see the client's passport when shown the phone — "Trojan Horse" acquisition.

**Do not start this until:** At least 5 barbershops are actively paying. The pass infrastructure is meaningless without a user base.

---

### 1. QR Code Download (Priority 1)
- Owner should be able to download a printable QR code for `/arrive/[slug]`
- Currently settings page shows the URL text only (`QRSection.tsx`) — no actual QR image download
- Needed for physical onboarding pack (sticker, card, poster)
- `qrcode` and `qrcode.react` packages are already installed

### 2. SMS Reminders — confirmed live sending (Priority 2)
- Vonage is wired and routes exist, but live sending in production is unconfirmed
- Barber should tap a button on the customer profile → SMS fires
- The "remind" button exists in reminders page but needs verification it actually sends

### 3. Analytics (Priority 3)
- `/analytics` in sidebar shows as "Soon" placeholder
- No page or data at that route yet
- Planned: visits per week, retention rate, busiest days, revenue

### 4. PWA "Add to Home Screen" (Priority 4)
- Barber mode designed for personal iPhone home screen
- PWA manifest exists but hasn't been fully tested/verified for install prompt

---

## Do Not Re-implement — Already Done

| Thing | Why it might seem missing | Reality |
|---|---|---|
| Twilio SMS | CLAUDE.md and some docs reference Twilio | Replaced by Vonage. `src/lib/twilio.ts` re-exports vonage. Do not add Twilio. |
| Iron Session | CLAUDE.md says "Iron Session" | Replaced by NextAuth v5. Do not install or use iron-session. |
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
VONAGE_API_KEY
VONAGE_API_SECRET
VONAGE_FROM_NUMBER
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_S3_BUCKET
AWS_REGION
RESEND_API_KEY
CRON_SECRET
SESSION_SECRET
```

---

## Demo Credentials

- **Shop:** Ben J Barbers
- **Owner login:** owner@benjbarbers.com / owner123
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
