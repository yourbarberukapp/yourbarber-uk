# YourBarber — Continuous Build Program

This file is the source of truth for any AI assistant (Claude, Gemini, OpenAI, etc.) working on this codebase. Read this before making any decisions. Update it when the design evolves.

---

## What This Product Is

YourBarber is a barbershop management platform. It is **not** a booking system — it is a walk-in workflow tool and customer record system built for independent barbers.

Core value props:
- Walk-in waitlist managed digitally with zero friction
- Per-client cut history with photos (a "cut passport" that travels across shops)
- SMS reminders sent by the barber, not automated spam
- Physical QR materials that make the product tangible in the shop

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

**Access:** Email + password login. Long session.

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

**Access:** Email + password, or barber PIN (TBD).

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
| Auth | Iron Session (cookie-based) |
| Photo storage | AWS S3 (private bucket, presigned URLs) |
| SMS | Twilio (credentials set up, not yet live) |
| Hosting | Vercel (Hobby, main branch auto-deploys) |
| Domain | yourbarber.uk — Vercel nameservers |
| Subdomains | `*.yourbarber.uk` → `/shop/[slug]` via middleware |

---

## What's Built

- [x] Barber/shop auth (register, login, session)
- [x] Customer database (create, search, view)
- [x] Visit recording with photos (multi-angle, S3 upload)
- [x] Customer detail page with visit history + photos
- [x] QR code per customer (for barber-scans-client flow)
- [x] Shop microsite at `[slug].yourbarber.uk`
- [x] Subdomain middleware routing
- [x] SMS opt-in tracking (not sending yet)

## What's Next (priority order)

1. **Walk-in waitlist** — `WalkIn` table, live barber view, claim/complete flow
2. **`/arrive/[shop-slug]`** — client-facing arrival page (the wall QR destination)
3. **Barber mode** — `/barber` scoped view, 30-day session, PWA manifest
4. **Customer portal** — `/me` — client views their own cut history, photos, preferences
5. **SMS reminders** — Twilio integration, triggered manually by barber
6. **QR code download** — shop settings page, generate printable QR for `/arrive/[slug]`
7. **Analytics** — visits per week, retention, busiest days

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

## Environment Variables (set in Vercel + `.env.local`)

```
DATABASE_URL
SESSION_SECRET
AWS_REGION
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_S3_BUCKET
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_FROM_NUMBER
```
