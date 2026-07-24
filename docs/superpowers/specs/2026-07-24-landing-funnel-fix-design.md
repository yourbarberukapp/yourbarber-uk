# Landing Page Funnel Fix — Design

## Problem

The marketing site's entire conversion funnel (homepage hero, navbar CTA, pricing page CTA, and the `/demo` "Early Access" page) was built around a manual beta-vetting flow that predates the 2026-07-24 auth pivot:

- Homepage CTA → `WaitlistForm` → `POST /api/leads` → "Application received, we'll review within 24 hours" → success copy tells the applicant to **"Sign in with Google using this exact email address."**
- Google OAuth was removed entirely in the passcode-auth pivot. Every applicant who reaches that message is being told to do something the product can no longer do.
- Meanwhile `src/app/(auth)/signup/page.tsx` already exists and already works correctly: 2 fields (shop name, your name) → `POST /api/signup` → shop created instantly → 6-digit passcode + QR code shown → link to `/owner/login`. It just isn't linked from anywhere on the marketing site.
- `src/app/demo/page.tsx` (linked from the navbar as "Early Access") shows barber-mode demo credentials `james@thebarbershop.com / barber123` — email/password login no longer exists either.

## Decision

Retire the "apply and wait" framing from the homepage funnel. Point every homepage/navbar/pricing CTA at the existing `/signup` page instead of `#waitlist`. Fix the stale demo credentials on `/demo`.

`WaitlistForm.tsx` and `/api/leads` are **not deleted** — just unhooked from the homepage. They may still serve other purposes (admin lead panel at `/admin`, `/770621`); leaving them in place avoids scope creep into unrelated admin tooling.

## Changes

### 1. `src/app/page.tsx`
- Hero badge: "Free beta — first 50 barbershops" → "Free while we're building" (or similar; drop "apply" framing)
- Hero CTA area: replace `<WaitlistForm />` with a direct link/button to `/signup` ("Set up my shop — 30 seconds")
- Remove the "No credit card / No contracts / Your feedback shapes the product" trio tied to the application promise — replace with copy matching instant signup (e.g. "No credit card. No waiting. Live in 30 seconds.")
- Wallet section badge: "Coming with the beta" → "Included free" (it's shipped, not a promise)
- Bottom CTA section: same treatment as hero — "Apply for free beta access" → "Set up my shop", copy no longer promises a callback/review

### 2. `src/components/Navbar.tsx`
- Desktop + mobile "Get beta access" button: `/#waitlist` → `/signup`

### 3. `src/app/pricing/page.tsx`
- Highlighted plan CTA: `/#waitlist` → `/signup`

### 4. `src/app/demo/page.tsx`
- Barber-mode demo card: remove/replace `james@thebarbershop.com\nbarber123` credential display with whatever the demo shop's actual current passcode-based access is (check `benj-barbers` demo shop's real passcode, or adjust the card to not display login creds that no longer apply — e.g. link straight to `/login?callbackUrl=%2Fbarber` and describe passcode entry instead of showing a fake credential pair)

## Out of scope
- `WaitlistForm.tsx` / `/api/leads` / admin lead review panel — untouched, still functional for whatever admin process consumes it
- `/demo-hub` — not touched unless it also references stale creds (to be checked during implementation; if it does, same fix applies)

## Verification
- Load `/`, `/pricing`, `/demo` in the browser preview; confirm all "Get beta access" / "Apply" CTAs land on `/signup` and complete the instant-signup flow
- Confirm `/demo` barber card no longer shows a dead email/password credential
