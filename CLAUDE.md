# YourBarber — Continuous Build Program

This file is the source of truth for any AI assistant (Claude, Gemini, OpenAI, etc.) working on this codebase. Read this before making any decisions. Update it when the design evolves.

> **AI assistants: also read [`docs/MASTER_BUILD_LOG.md`](docs/MASTER_BUILD_LOG.md) before writing any code.** It has the complete list of what is built, what is not built, and a "Do Not Re-implement" table to prevent duplicate work.

---

## What This Product Is

YourBarber is a barbershop management platform. It is **not** a booking system — it is a walk-in workflow tool and customer record system built for independent barbers.

Core value props:
- Walk-in waitlist managed digitally with zero friction
- Per-client cut history with photos (a "cut passport" that travels across shops)
- Apple/Google Wallet pass as the client's loyalty card, identity, and reminder channel — free push notifications, no SMS cost
- Physical QR materials that make the product tangible in the shop

**No SMS. No Twilio. No Vonage.** SMS was removed entirely (2026-07-23) — it's an ongoing per-message cost the founder does not want, ever. All client-facing notifications (reminders, queue nudges, appointment confirmations, feedback follow-ups) go through the Wallet pass push channel (`src/lib/wallet/notify.ts`) instead. Do not reintroduce an SMS/text-messaging provider or dependency under any circumstance, even as a "fallback" — ask first if a use case seems to need it.

---

## The Core Check-in Model (READ THIS FIRST)

**The shop has a unique QR code on the wall. The client scans it on their own phone.**

```
Client scans shop QR (on wall/desk)
        ↓
yourbarber.uk/arrive/[shop-slug]   ← public page, no login
        ↓
"What's your mobile number?"
        ↓
Known client  → "Welcome back — you're on the list"
New client    → "What's your name?" → account created → added to waitlist
        ↓
Optional: "Anything specific today?" (free text)
        ↓
Client sits down. Barbers see the update in real time.
```

**Why this model and not barber-scans-client:**
- Works while barbers are cutting — no interruption
- Client does the work — zero barber effort
- Phone number is the universal identifier — profile travels across all YourBarber shops
- The wall QR is passive, permanent infrastructure

Barbers *can* still scan a client QR if they choose, but this is secondary.

---

## The Three Screens

### 1. Owner Dashboard (existing — `/dashboard`)
Full access. Runs in a browser on any device.

**Sees:**
- Live waitlist — all barbers, all current clients
- Full customer database
- All visit history and photos
- Analytics (visits, revenue, retention — future)
- Shop settings, barber management, QR code download

**Access:** 6-digit passcode (from the owner's Wallet business card). No email, no password, no Google OAuth, no beta-approval gate. Long session.

---

### 2. Barber Mode (`/barber`)
Simplified, scoped to their work only. Designed for a personal phone.

**Sees:**
- Their personal queue for today (clients who've been assigned to them)
- The shared walk-in waitlist — claim next client
- Quick client lookup (name or phone)
- Record cut button for current client

**Does NOT see:** Other barbers' cut history, shop settings, financials.

**Staying logged in:** 30-day session cookie. Barber adds the app to their phone home screen (PWA). One tap → straight to their queue. Re-login once a month at most.

**Access:** 6-digit passcode, same mechanism as the owner. Staff get their own passcode (shown once by the owner in Team) — no email, no password.

---

### 3. Arrival Screen (`/arrive/[shop-slug]`)
The public page the wall QR points to. No login. Designed for a client's own phone.

**Flow:**
1. Phone number entry
2. If known → greet by name, add to waitlist
3. If unknown → ask for name, create account, add to waitlist
4. Optional note ("just a trim today")
5. Done — confirmation screen

**Design:** Minimal, fast, no distractions. Shop branding (name, logo). Works on any browser, no app install.

---

## Physical Onboarding Materials

Every new shop gets a pack:
- Vinyl QR sticker (for mirror or front desk)
- A5 card (waiting area)
- A4 poster (wall)
- Optional: brushed metal/acrylic QR plaque (premium)

The QR encodes `yourbarber.uk/arrive/[shop-slug]`. It never changes. It can be reprinted at any size.

This makes YourBarber tangible. A plaque on the wall is a churn deterrent.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router) |
| Database | PostgreSQL via Prisma ORM |
| Auth | NextAuth v5, passcode-only (no email/password/Google) — see [Owner & Staff Passcode Login](#owner--staff-passcode-login) |
| Photo storage | AWS S3 (private bucket, presigned URLs) |
| Client notifications | Apple/Google Wallet push (`src/lib/wallet/notify.ts`) — no SMS provider |
| Hosting | Vercel (Hobby, main branch auto-deploys) |
| Domain | yourbarber.uk — Vercel nameservers |
| Subdomains | `*.yourbarber.uk` → `/shop/[slug]` via middleware |

---

## What's Built

- [x] **Owner/staff passcode auth** (2026-07-24) — no email, password, Google OAuth, or beta-approval gate. See [Owner & Staff Passcode Login](#owner--staff-passcode-login) below.
- [x] Customer database (create, search, view)
- [x] Visit recording with photos (multi-angle, S3 upload)
- [x] Customer detail page with visit history + photos
- [x] QR code per customer (for barber-scans-client flow)
- [x] Shop microsite at `[slug].yourbarber.uk`
- [x] Subdomain middleware routing
- [x] **Apple & Google Wallet Pass Generator Engine** (`src/lib/wallet/passGenerator.ts`)
- [x] **Shop Pass Design Studio & Live Previews** (`/settings/pass-studio`)
- [x] **1-Tap Wallet Pass Issuance on Arrive Page** (`/arrive/[slug]`)
- [x] **Wallet Pass QR Barcode Scanner & Auto Loyalty Stamp Awarding** (`/scan` & `/api/scan`)
- [x] **Apple Wallet push notifications** — PassKit web service (`/api/wallet/v1/*`), APNs sender (`src/lib/wallet/apnsPush.ts`), Google Wallet object PATCH (`src/lib/wallet/googlePush.ts`). Free at any volume, no SMS.
- [x] **Customer login via Wallet pass access code** — `/me/login`, no OTP/SMS step
- [x] **Owner Wallet business card** — `/api/wallet/owner/apple` + `/api/wallet/owner/google` (2026-07-24), carries the sign-in passcode as its QR/barcode. Sidebar "My Owner Card" offers both platforms.
- [x] Walk-in waitlist, `/arrive/[shop-slug]`, barber mode, customer portal (`/me`) — this section of the doc previously listed these as "next" long after they shipped; verified live 2026-07-24.
- [x] **QR code download** — `/api/qr/arrive/[slug]` generates real SVG previews and printable PDF posters/stickers (`src/app/(dashboard)/settings/QRSection.tsx`) — this doc previously said "not built," it was.
- [x] **Shop microsite: products, Google reviews link, social links, completeness gate** (2026-07-24) — every shop's `/shop/[slug]` now includes a display-only product catalogue, a "Read our reviews" link (`googleReviewUrl`), and real social links. A shop's microsite only goes fully public once address/phone/hours/cover photo/1+ service are set (`src/lib/microsite.ts`'s `isMicrositeComplete()`) — incomplete shops get a "coming soon" page instead of the fabricated placeholder content (fake address, stock photo, fake customer count) that used to show. Deliberately built as one reusable check so a future paywall can reuse it.
- [x] **Real logo file upload** (2026-07-24) — `POST /api/settings/logo`, presigned S3 upload with file picker + preview in Settings. Was URL-paste only.

## What's Next (priority order)

1. **Wallet push delivery in production is unconfirmed** — the code path is real (`src/lib/wallet/notify.ts`, `apnsPush.ts`, `googlePush.ts`), but without real `APPLE_PASS_CERT_PEM`/`APPLE_TEAM_ID`/`APPLE_WWDR_PEM` and `GOOGLE_WALLET_SERVICE_ACCOUNT_KEY` set in Vercel, passes generate unsigned/demo-only. Check these are actually set before relying on this for real shops.
2. **AWS S3 credentials are placeholders in `.env.local`** (`AWS_ACCESS_KEY_ID=your-access-key`) — every upload feature (visit photos, style images, shop logo) needs a real bucket + credentials to actually persist files; the code is correct and tested down to the presigned-URL request, but the actual `PUT` to S3 can't complete without real credentials.
3. **Analytics** — `/analytics` is still a "Soon" placeholder, no data behind it.
4. **Real logo reaching the Wallet pass artwork** — `src/lib/wallet/artwork.ts` still returns a placeholder; now that logo upload works, wire the real `shop.logoUrl` into pass artwork generation.
5. **Retail product checkout** — the new product catalogue is display-only by design (no payment/cart); revisit only if there's real demand.

---

## Key File Locations

| File | Purpose |
|---|---|
| `src/app/(dashboard)/` | Owner dashboard pages |
| `src/app/(dashboard)/customers/[id]/page.tsx` | Customer detail + visit history |
| `src/app/(dashboard)/customers/[id]/visit/new/` | Record a cut |
| `src/app/shop/[slug]/` | Public shop microsite |
| `src/app/checkin/[token]/` | Barber-scans-client check-in |
| `src/components/PhotoCapture.tsx` | Multi-angle photo capture |
| `src/components/dashboard/QRScanner.tsx` | Barber QR scanner |
| `src/lib/db.ts` | Prisma client |
| `src/lib/session.ts` | Iron session helpers |
| `src/lib/s3.ts` | S3 upload + presigned read URL |
| `src/middleware.ts` | Subdomain → `/shop/[slug]` rewrite |
| `prisma/schema.prisma` | Database schema |

---

## Design System

- **Palette:** Near-black background (`#0a0a0a`), Electric Lime (`#C8F135`) as accent, white text
- **Fonts:** Barlow Condensed (headings, labels, uppercase UI), Inter (body, data)
- **Style:** Dark, minimal, high contrast. No gradients, no rounded-everything. Sharp and functional.
- **Base font:** 17px — text must be readable on phone in a barbershop environment
- **Button class:** `.btn-lime` — lime background, dark text, glow on hover
- **Badge class:** `.badge-lime` — lime outlined badge for status

## Documentation
- **Sales & Demo Guide**: [docs/SALES_DEMO_GUIDE.md](docs/SALES_DEMO_GUIDE.md) — How to pitch and demo the 3-screen system.
- **Competitor Analysis**: [docs/YOUR_BARBER_COMPETITIVE_ANALYSIS.md](docs/YOUR_BARBER_COMPETITIVE_ANALYSIS.md)
- **Brand Identity**: [docs/BRAND_VOICE.md](docs/BRAND_VOICE.md)
- CSS variables in `src/app/globals.css`

---

## Conventions

- Server components by default — fetch data in page.tsx, pass props down
- `'use client'` only when you need interactivity (forms, camera, scanner)
- S3 photo URLs are stored as public URLs in the DB, converted to presigned GET URLs at render time
- Session gives `{ shopId, barberId, name, role }` — always scope DB queries to `shopId`
- Phone numbers are stored as-entered — normalise on input (strip spaces, ensure +44 etc.)
- All inline styles for layout/theming (Tailwind for utilities only)

---

## Owner & Staff Passcode Login

Barbers (owners and staff) sign in with a **6-digit numeric passcode** — no email, no password, no Google OAuth, no beta-approval waitlist. Signup is fully open: `/signup` just asks for shop name + owner's name.

**Why:** the founder wants zero login friction — the same principle behind the customer-side Wallet pass access code. A passcode on a Wallet card mirrors how customers already sign in (see below), and removes the entire "annoying" OAuth/password/beta-gate stack that previously blocked new shops from onboarding themselves.

### How it works

- `POST /api/signup` — creates the `Shop` + owner `Barber` row and calls `generateUniqueOwnerPasscode()` (`src/lib/ownerPasscode.ts`) in one step. Returns the passcode directly in the response so the signup page can show it immediately.
- Login is a NextAuth `Credentials` provider named `'passcode'` (`src/lib/auth.ts`) — looks up `Barber.ownerPasscode`, rate-limited via `checkRateLimit()` (`src/lib/rateLimit.ts`, DB-backed fixed-window, 5 attempts / 15 min per passcode value — in-memory limiters don't survive Vercel serverless cold starts).
- The **session shape is unchanged** (`{ shopId, barberId, name, role, shopName, shopSlug }`) — every existing `auth()`/`getSession()` call across the dashboard (45 files) works untouched. Only the credential-verification step changed.
- `/owner/login` is the sign-in page (`/login` redirects there for old links). `/setup`, `/api/setup`, and `/api/auth/register` (the old beta-gated password signup) are deleted.
- **Staff barbers** get the same mechanism — `POST /api/team` (owner-only) generates a passcode for a new staff member and returns it once in the response; the Team page shows it in a dismissable banner. Passcodes are never re-displayed on the persisted team list (security: don't leak every staff member's login credential to anyone who opens `/team`).

### The owner's Wallet business card

The owner also gets their own Wallet pass — `GET /api/wallet/owner/apple` (session-authenticated, linked from the dashboard sidebar as "My Owner Card"). It shows the shop name and owner name on the front, and the sign-in passcode on the back (as text and as the pass's QR barcode) — this doubles as the shop's physical/digital business card and closes the loop: install once, always have your login on you.

- `generateOwnerApplePass()` in `src/lib/wallet/passGenerator.ts` — reuses `signAndZipPass()`, the same PKCS7-signing helper the customer loyalty pass uses.
- Serial numbers are prefixed to disambiguate lookups in the shared PassKit web service routes: `yb-client-{accessCode}` for customers, `yb-owner-{passcode}` for barbers. `/api/wallet/v1/passes/...` and the device-registration routes branch on this prefix.
- Owner cards are intentionally **static** — no live push updates (unlike the customer pass, which refreshes on queue position/loyalty stamps). `WalletDevice.customerId` is a required FK to `Customer`, so wiring live push to barbers would need a schema change; not done since a passcode rarely changes. Device registration for owner passes returns success without persisting a row.
- **Not yet built:** Google Wallet equivalent for owners (only Apple exists), and the owner's card doesn't yet show the shop logo (see artwork placeholder note above).

---

## Apple Wallet & Google Wallet Passes

Digital loyalty cards are live for customers. Each customer gets a combined loyalty + record pass that lives in Apple Wallet or Google Wallet.

### How it works

The QR code on the pass = the customer's permanent `accessCode`. When staff scan it, it opens `yourbarber.uk/arrive/[shop-slug]?code=[accessCode]` — the same arrive flow, but pre-filled. No separate check-in QR needed.

The pass shows:
- Customer name + visit count (stamp progress toward free cut)
- Next upcoming appointment on the card face
- Preferred barber name
- Back: full appointment detail, shop phone, Google review link, booking URL

The loyalty milestone defaults to 10 visits = free cut. Change `loyaltyStamp: 10` in the route files to adjust per-shop.

### Files

| File | Purpose |
|---|---|
| `src/lib/walletGenerator.ts` | Core generation — `generateBarberApplePass()` and `generateBarberGooglePass()` |
| `src/app/api/customer/wallet/apple/route.ts` | `GET /api/customer/wallet/apple` → streams `.pkpass` file download |
| `src/app/api/customer/wallet/google/route.ts` | `GET /api/customer/wallet/google` → returns `{ saveUrl }` for Google Pay |

Both routes require a valid customer session cookie (`yb-customer-session`).

### UI wiring (add to customer-facing page)

```tsx
// Apple Wallet button
<a href="/api/customer/wallet/apple">
  <img src="/apple-wallet-badge.svg" alt="Add to Apple Wallet" />
</a>

// Google Wallet button
async function addToGoogle() {
  const { saveUrl } = await fetch("/api/customer/wallet/google").then(r => r.json());
  window.open(saveUrl, "_blank");
}
```

### Environment variables required

```
APPLE_PASS_TYPE_ID=pass.uk.yourbarber.loyalty
APPLE_TEAM_ID=<your Apple Developer Team ID>
APPLE_PASS_CERT_PEM=<PassKit certificate PEM>
APPLE_PASS_KEY_PEM=<private key PEM>
APPLE_WWDR_PEM=<Apple WWDR G4 PEM>
APPLE_PASS_WEB_SERVICE_URL=<optional — enables live pass updates>
GOOGLE_WALLET_ISSUER_ID=<from Google Pay & Wallet console>
GOOGLE_WALLET_SERVICE_ACCOUNT_KEY=<JSON string of service account key>
NEXT_PUBLIC_APP_URL=https://yourbarber.uk
```

Without the Apple certs, passes are generated but unsigned (valid structure, not installable). Without the Google service account, a demo JWT is returned. Both fall back gracefully — no crashes.

### Future: forking for other business types

The wallet generator is intentionally generic. `WalletPassInput` takes a shop, a customer, a visit count, and an optional next appointment — nothing barber-specific. When you fork yourbarber for other appointment-based businesses (nail salon, physio, PT), copy `walletGenerator.ts` unchanged and adjust:
- `loyaltyStamp` milestone value
- `APPLE_PASS_TYPE_ID` (needs its own PassKit cert per app)
- The QR value URL prefix (swap `yourbarber.uk` for the new domain)

---

## Environment Variables (set in Vercel + `.env.local`)

```
DATABASE_URL
SESSION_SECRET
AWS_REGION
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_S3_BUCKET
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
