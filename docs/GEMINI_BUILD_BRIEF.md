# YourBarber — Gemini Build Brief
## What to build to beat every competitor in the market

---

## Context

YourBarber is a barber shop management SaaS at yourbarber.uk. The stack is Next.js 14.2 App Router, TypeScript, Prisma + PostgreSQL (Neon), NextAuth v5, AWS S3, Twilio SMS.

Every competitor — Booksy, Fresha, Vagaro, Slick, Nearcut, Squire, Phorest — shares one fatal flaw: **they treat customers as shop assets, not people**. Customers can't see their own cut history. They have to describe their cut from scratch every visit. There's no visual reference. There's no continuity if their barber moves shops.

YourBarber's entire competitive strategy is built on flipping this. The three features that no competitor has are:

1. **Customer-Owned Portal** — customers own their own cut history
2. **QR + iPad Live Workflow** — customer picks a reference photo, barber scans and executes
3. **Multi-Shop Following** — one customer profile across multiple shops

What follows is the spec for each. Build them in order.

---

## FEATURE 1: Customer Portal
### The #1 differentiator. No competitor offers this.

**Entry point:** `/customer/login`

The customer authenticates with their 5-digit access code (stored as `accessCode` on the `Customer` model in the DB). No password, no email — just the code on a card or SMS.

**What the portal shows:**

### `/customer` — Dashboard
- Customer's name + initials avatar
- Their access code displayed (so they can share it with another shop)
- A summary: total visits, last cut date, primary barber name
- Quick link to Style Gallery (public shop microsite `/shop/[slug]/styles`)

### `/customer/history` — Cut History
The main event. Shows all visits across ALL shops, most recent first.

Each visit card:
- Date + shop name + barber name
- **4-angle photo grid** (front/back/left/right) — large, tappable to expand
- Style chips (what was recorded: "Skin Fade", "Grade 2 sides", "Full Beard")
- Recommendation the barber left ("Book in 4 weeks, try clay on top")
- A ❤️ / 👎 rating button — customer can rate the cut. This writes `cutRating` on the Visit model.

### `/customer/preferences` — My Preferences
- Preferred reminder interval: 6 / 8 / 10 weeks (radio buttons, saves to `preferredReminderWeeks` on Customer)
- SMS opt-in toggle
- "Request my photos" — generates a download link for all their S3 photos (GDPR)

**Auth flow:**
- `GET /api/customer/session` — returns customer data if session valid
- `POST /api/customer/login` — validates access code, sets a customer session cookie (separate from barber NextAuth session)
- Customer session: `{ customerId, shopId }` stored in a signed JWT cookie named `customer-session`

**API needed:**
- `GET /api/customer/visits` — returns all visits for this customer, include photos + barber + shop name
- `PATCH /api/customer/visits/[id]/rating` — sets `cutRating` ('positive'|'negative') on a visit
- `PATCH /api/customer/preferences` — updates `preferredReminderWeeks` and `smsOptIn`

**Design:** Dark theme matching the barber dashboard. Mobile-first — customers will use this on their phones. Use the same Barlow/Inter font stack, `#0A0A0A` background, `#C8F135` lime accent.

---

## FEATURE 2: QR + iPad Live Workflow
### The killer demo. Eliminates "describe your cut" forever.

This is a two-part system: the customer generates a QR code from their portal, the barber scans it on an iPad to instantly load the customer's profile and chosen style.

### Part A — Customer generates QR

In the customer portal, on the history page or a dedicated "Check In" page:

1. Customer sees their last 5 cuts as image cards (the 4-angle photos from history)
2. Customer taps "Use this style" on any past cut — OR taps a style from the shop's style gallery
3. App generates a QR code encoding: `{ customerId, styleRef (visitId or styleId), timestamp }`
4. QR is displayed fullscreen — "Show this to your barber"
5. QR expires after 2 hours

**API needed:**
- `POST /api/customer/checkin` — creates a `CheckIn` record: `{ id, customerId, referenceVisitId?, styleId?, qrToken (UUID), expiresAt, scannedAt? }`. Returns the qrToken.
- The QR code encodes a URL: `https://yourbarber.uk/checkin/[qrToken]`

**Schema needed (add to Prisma):**
```
model CheckIn {
  id               String    @id @default(cuid())
  customerId       String
  shopId           String?
  referenceVisitId String?
  styleId          String?
  qrToken          String    @unique @default(uuid())
  expiresAt        DateTime
  scannedAt        DateTime?
  createdAt        DateTime  @default(now())

  customer Customer @relation(...)
}
```

### Part B — Barber scans QR on iPad

**Route:** `/checkin/[qrToken]` — public page, no auth required

When the barber opens this URL (by scanning the QR):

1. Validate the token: find the CheckIn, check not expired, check not already scanned
2. Mark `scannedAt = now()`
3. Load: customer name, customer's last 5 visits with their photos (most recent first), the reference style they selected (if any)

**iPad display layout:**
- Top bar: Customer name (large, uppercase) + "Last visited [date]" + shop name
- If reference style selected: hero image of that style (full width, tall) with style name overlaid
- "Last 5 cuts" horizontal scroll strip: each is the front-angle photo from that visit, tappable to expand all 4 angles
- Barber notes from last visit (if any)
- Recommendation from last visit
- Bottom: "Start recording" button → navigates to `/customers/[customerId]/visit/new`

**Key UX requirement:** This page must load fast and look incredible on an iPad. It's the demo moment. Full bleed photos, large text, no clutter.

**API needed:**
- `GET /api/checkin/[token]` — validates token, returns customer + visits + style data
- `PATCH /api/checkin/[token]` — marks scanned (called on page load)

---

## FEATURE 3: Multi-Shop Customer Following
### The long-term moat. Nobody does this.

A customer has ONE profile. They can be seen and cut at multiple shops. Each shop adds cuts to the same history. Only the "primary shop" sends them SMS reminders.

**Schema changes needed:**
- `Customer` already has `primaryBarberId` — this becomes the primary relationship
- Add `CustomerShopLink` join table: `{ customerId, shopId, linkedAt, canViewHistory: Boolean }`
- When a customer visits a new shop for the first time, that shop is offered to link (owner approves)

**Customer portal:**
- Shows cuts from ALL linked shops in one timeline
- Shows "primary shop" badge on the shop that will send reminders
- Customer can change primary shop

**Barber dashboard:**
- When a barber searches for a customer by phone number who already exists at another shop, they see a "Link customer?" prompt
- Owner approves the link
- Once linked, barber can see the customer's FULL history (all shops), add new visits

**API needed:**
- `POST /api/customer/link-shop` — customer requests to link a new shop by shop slug
- `POST /api/shop/customers/[id]/approve-link` — owner approves
- `PATCH /api/customer/preferences/primary-shop` — customer changes primary

---

## Design Principles for All Three Features

**1. Mobile-first for customer portal.** Customers use phones. Every screen must work perfectly at 375px width.

**2. iPad-optimised for the QR scan page.** This is a demo moment and a daily workflow. Make it feel like a premium product — full bleed images, large Barlow typography, no mobile-squashed layout.

**3. Speed.** The QR scan page must load in under 1 second. Pre-load the customer data. Use Next.js server components where possible.

**4. Dark theme throughout.** `#0A0A0A` background, `#111` cards, `rgba(255,255,255,0.08)` borders, `#C8F135` lime accent, Barlow Condensed font for headings (weight 900, uppercase), Inter for body text.

**5. Trust signals.** The customer portal should feel like it belongs to the customer, not the shop. No shop branding on the history page — it's their history, across all shops. Show the shop name per visit but keep it neutral.

---

## Priority Order

| # | Feature | Why first |
|---|---|---|
| 1 | Customer portal (login + history + rating) | The #1 differentiator, needed for the demo |
| 2 | QR generation (customer side) | Part of the portal, natural next step |
| 3 | iPad scan page (`/checkin/[token]`) | Completes the loop, most visual payoff |
| 4 | Multi-shop following | Longer-term, needs more schema work |

Build 1, 2, and 3 as a connected flow. They form one complete product experience: *Customer logs in → sees history → picks a style → generates QR → barber scans → executes.*

That complete loop is what beats every competitor in a single demo.
