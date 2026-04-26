# Your Barber Microsite Design Playbook

## Design Philosophy

Your Barber's microsite for each shop (`shop.yourbarber.uk/[shopname]`) must achieve three things simultaneously:

1. **Conversion focus:** Get customers to check in via QR or portal within 3 clicks
2. **Cultural authenticity:** Reflect the specific barbershop culture (Turkish, Afro-Caribbean, Korean, etc.)
3. **Visual hierarchy:** Hero → Services → Gallery → Booking → Contact

The industry standard for barbershop sites is dark backgrounds + bold typography + gold/warm accent colors. We'll follow this pattern but add a **unique feature: photo reference gallery for each cut style**, which no competitor has.

---

## Core Design Pattern (All Microsites)

### 1. Navigation Bar (Always Visible)
- **Left:** Shop logo (1:1 square, 60px)
- **Center:** Menu (Home, Services, Team, Gallery, Contact)
- **Right:** Primary CTA button: "Check In Now" (Lime accent `#C8F135`)
- **Behavior:** Fixed, sticky on scroll. Transparent over hero, solid on scroll.
- **Mobile:** Hamburger menu, CTA button always visible below fold
- **Font:** Barlow Condensed (`font-barlow`) uppercase for links, Inter (`font-inter`) for subtext

### 2. Hero Section (Above the Fold)

**Layout Option A: Video Hero**
- Full-width video background (loop, muted, 3–5 sec clip of barbers cutting)
- Dark overlay (40% opacity) for text legibility
- Headline: "[Shop Name] — [Tagline]" (e.g., "Turkish Fade Specialists")
- Subheadline: "Fresh cuts. Your history. Always yours."
- Large CTA button: "Check In Now" (animated, gold)
- Optional: Animated scroll-down arrow

**Layout Option B: Image Hero + Parallax**
- High-quality image of shop interior or barber at work
- Parallax scroll effect (subtle, 0.5x speed)
- Same text overlay and CTA

**Design Specs:**
- Height: 100vh (full viewport)
- Font size: Hero headline 48–64px (desktop), 32–40px (mobile), `font-barlow font-black uppercase`
- Subheadline: 20–24px, `font-inter`
- Background: Dark (`#0A0A0A` or `#111`)
- Accent color: Lime `#C8F135` for CTAs and highlights
- Video compression: <3MB, 1080p
- Image optimization: WebP format, <200KB

---

### 3. Services Section

**Layout: Service Cards Grid (3 columns desktop, 1 mobile)**

Each card displays:
```
[Service Icon] — optional
─────────────────────────
High Fade
────────────────────────
15 mins | £25
"Skin fade, hard part, line work"
[View Cuts] [Book] buttons
```

**Service categories to include (standard + culture-specific):**

**Universal (All Shops):**
- Haircut (classic/fade/textured)
- Beard trim / Shape-up
- Hot towel shave

**Culture-Specific (Examples):**

**Turkish Barbershop:**
- Hot towel + Cologne (Ottoman ritual)
- Beard sculpting + Oil
- Hard part + Fade combo
- *Yakma* (ear singe) — with disclaimer

**Afro-Caribbean:**
- 360 Waves + Shape-up
- Skin fade + Pattern design
- Dread maintenance/retwist
- Beard fade + Line-up

**Korean:**
- Two-Block Cut
- Korean Perm (C-curl or Down)
- Textured crop + styling

**Design Specs:**
- Card background: Dark (`#141414` or `#111`) with subtle border `border-white/10`
- Text color: Off-white (`text-white` and `text-white/60`)
- Accent: Lime highlight on hover
- Font: `font-barlow font-bold uppercase` for service name, `font-inter` for details
- Button styling: Outline Lime on dark background, filled on hover (`bg-[#C8F135]/10 text-[#C8F135] hover:bg-[#C8F135]/20`)
- Grid gap: 24px (desktop), 16px (mobile)
- Card padding: 24px

---

### 4. Cut Gallery Section (YOUR COMPETITIVE ADVANTAGE)

**Headline:** "Our Latest Cuts" or "[Style Name] Examples"

**Layout: Masonry or Grid Gallery (4 columns desktop, 2 mobile)**

Each cut shows:
```
[4-angle photos in lightbox]
│ [Front] [Back] [Left] [Right]
│
├─ Style: "High Fade + Slick Back"
├─ Barber: "Malik"
├─ Culture: "Turkish"
├─ Maintenance: "3 weeks"
├─ ★ 5.0 rating
└─ [Select This Cut]
```

**Key Features:**
1. **Tap/click to expand** → Shows all 4 angles (front, back, left, right, detail if available)
2. **Style tag** → Links to that style's booking page
3. **Barber name** → Links to barber's profile (if multi-barber)
4. **Maintenance info** → "Keeps fresh 3–4 weeks"
5. **Rating** → Customer feedback (heart emoji ❤️ / thumbs down 👎)
6. **"Select This Cut" button** → Initiates QR check-in with this photo as reference

**Photo Standards:**
- All photos in natural light or consistent shop lighting
- Consistent white/neutral background for cut focus
- 4:5 aspect ratio (portrait)
- High resolution: 1080p minimum
- File format: WebP (compressed), <150KB per image
- Update gallery monthly with new cuts

**Design Specs:**
- Gallery background: Dark (`#0A0A0A`)
- Card border: Subtle Lime accent on hover or selection
- Hover effect: Slight zoom (1.05x) + shadow
- Lightbox overlay: Dark (`bg-black/90`)
- Grid gap: 20px (desktop), 12px (mobile)

---

### 5. Testimonials Section

**Layout: Carousel/Marquee + Text Quotes**

```
⭐⭐⭐⭐⭐ "Best fade in [City]. Malik knows my style."
         — David, 2 years loyal
         
⭐⭐⭐⭐⭐ "First time here, left feeling like a regular."
         — Omar
```

**Design Specs:**
- Auto-scroll carousel (5-second pause between testimonials)
- Show 3 testimonials (desktop), 1 (mobile)
- Include: name, quote, rating, date (optional)
- Typography: `font-inter italic` for quotes
- Background: Lighter dark (`#111`)
- Star rating: Lime color (`text-[#C8F135]`)
- Testimonial count badge: "47 reviews" in corner

---

### 6. Team/Barber Profiles Section

**Layout: Team cards (2–3 columns depending on team size)**

```
[Barber Photo - 1:1 square]
────────────────────────
Malik
Master Barber · 15 years
────────────────────────
Specialties:
• High Fade
• Beard sculpting
• Turkish traditional

⭐ 4.9 (24 reviews)

Availability:
Mon–Fri: 10am–7pm
Sat: 9am–6pm

[Book with Malik] [View Portfolio]
```

**Design Specs:**
- Photo: 300x300px, circular or square with rounded corners
- Name: `font-barlow font-bold uppercase`, 24px
- Experience: Secondary text, `font-inter`, 14px
- Specialty badges: Small pill-shaped tags, Lime accent
- Rating: Star icon + number
- Button styling: Outline Lime, full-width on card

---

### 7. Booking Widget (Sticky on Mobile)

**Mobile Sticky Bar:**
```
┌────────────────────────┐
│ [Cut Photo Thumbnail]  │
│ "High Fade + Slick Back"  │
│ [Book Now →]           │
└────────────────────────┘
```

**Desktop Inline Section:**
Full booking form embedded above fold (or link to portal):

```
✓ Select a barber
✓ Choose date/time
✓ Confirm
→ Opens portal with QR checkout
```

**Integration:**
- Links to Your Barber app (`yourbarber.uk/shop/[shopname]/booking`)
- Shows: barber availability, service duration, price
- Mobile optimized: 1-tap to book
- Sync with shop's actual calendar (real-time availability)

---

### 8. Contact Section (Footer)

**Layout: 3-column (desktop), stacked (mobile)**

```
📍 Address                  📞 Phone                ⏰ Hours
123 High St               020 XXXX XXXX         Mon–Fri: 10–7
London, E1 6AN           Tap to call            Sat: 9–6
[Google Maps embed]       [WhatsApp link]        Sun: Closed
```

**Additional:**
- Social media links (Instagram, TikTok, Facebook)
- Email link
- Directions link (to Google Maps)
- Walk-in vs. appointment info

**Design Specs:**
- Background: Black (`#000000`)
- Border: Lime line above or subtle `border-white/10`
- Text: Off-white (`text-white/80`)
- Links: Lime on hover
- Icons: Lucide React (24px, Lime)

---

## Color Palettes by Culture
While our core palette is `#0A0A0A` and `#C8F135` with `font-barlow` and `font-inter`, microsites can subtly tint these to reflect culture while staying within brand:

### Turkish Barbershop
- Accent Variation: Slightly warmer lime or gold
- Typography: Keep Barlow but use slightly heavier weights

### Afro-Caribbean Barbershop
- Accent Variation: Bright neon Lime or green
- Typography: Barlow Black for maximum impact

### Korean Barbershop
- Accent Variation: Softer Lime/Mint
- Typography: Clean Inter, lighter weights on Barlow

---

## Mobile Optimization

**Critical for barbershop sites — 70% of traffic from mobile:**

1. **Sticky booking button at bottom** (always visible)
2. **One-tap calling** (phone number hyperlinked)
3. **Map integration** (tap to navigate)
4. **Gallery swipe** (left/right to browse cuts)
5. **Fast load:** <3 seconds on 4G
6. **Touch-friendly buttons:** 48px minimum height

---

## Microsite URL Structure

```
yourbarber.uk/shop/[shopname]              → Main microsite
yourbarber.uk/shop/[shopname]/gallery      → Cut gallery filtered by style
yourbarber.uk/shop/[shopname]/team         → Team profiles
yourbarber.uk/shop/[shopname]/booking      → Booking flow
yourbarber.uk/shop/[shopname]/portal       → Customer portal (5-digit code)
```

---

## Content Calendar for Microsites

**Weekly (Barber responsibility):**
- 2–3 new cut photos added to gallery (all 4 angles)
- Update "Latest Cuts" section

**Monthly:**
- Refresh testimonials (prompt for new reviews)
- Update team availability
- Feature a "Style of the Month"

**Quarterly:**
- Full hero image/video refresh
- Seasonal promotions

---

## Conversion Metrics to Track

On-page events to log:
- Click "Check In Now" (hero CTA)
- Click "Select This Cut" (gallery)
- Click "Book Now" (sticky mobile button)
- Click "View Portfolio" (team card)
- Map/directions click
- Phone call click

**Goal:** Drive all visitors to either:
1. Check-in portal (for existing customers)
2. Booking flow (for new customers)

---

## Design Tools & Tech Stack

**For designing and building these microsites:**
- **Codebase**: Built directly within our Next.js App Router monolithic repository.
- **Styling**: Tailwind CSS leveraging our existing `tailwind.config.ts`.
- **Components**: Shared React components inside `src/components/microsite/`.
- **Design Tools**: We do not use Figma or Webflow. Instead, we generate mockups via code or tools like Google Stitch directly into React components.

**Template approach:**
Build ONE dynamic Next.js page template under `src/app/shop/[shopname]/` that:
- Reads shop config from the database (color tints, photos, team).
- Reuses our existing UI components (`Button`, `Input`, `Dialog`).
- Is fully responsive and optimized automatically by Next.js.

---

## Example: Master Template Architecture

```
MICROSITE SYSTEM
├─ Typography (Tailwind Config)
│  ├─ Headers: font-barlow, uppercase, font-black/font-bold
│  └─ Body: font-inter
│
├─ Color Tokens
│  ├─ Background: #0A0A0A
│  ├─ Card: #111 or #141414
│  ├─ Accent: #C8F135
│  └─ Borders: border-white/10
│
├─ Components (src/components/microsite/)
│  ├─ ShopNavbar.tsx
│  ├─ HeroVideo.tsx
│  ├─ ServiceGrid.tsx
│  ├─ StyleGallery.tsx
│  ├─ BarberTeam.tsx
│  └─ BookingWidget.tsx
│
└─ Next.js Routes
   ├─ /shop/[shopname]/page.tsx
   └─ /shop/[shopname]/booking/page.tsx
```

---

## Quick Wins: Design Elements That Convert

1. **Hero video** (if available) — converts 20% better than static image
2. **Real barber photos** — NOT stock images (converts 30% better)
3. **Before/after gallery** — Customers spend 2x longer on page
4. **Team availability widget** — "Malik: Free at 3pm today" drives bookings
5. **Sticky booking button on mobile** — Visible on every scroll
6. **Social proof** (reviews + ratings) — Near booking button
7. **Testimonial carousel** — Auto-scrolling, not static
8. **Cultural style tags** — "Turkish popular" / "Afro-Caribbean specialty"

---

## Next Steps for Claude Code

1. **Build shared components** in Next.js (`src/components/microsite/`).
2. **Implement dynamic routing** (`src/app/shop/[shopname]/page.tsx`).
3. **Connect to database** to pull shop-specific data.
4. **Integrate Check-in** so "Check In Now" routes to `/customer/login`.

---

## Design Inspiration Sources

**Top benchmark barbershop sites:**
- Scissors & Scotch (video hero + lifestyle vibe)
- Wayward Barbershop (clean, modern, booking seamless)
- Steven Tabach (dark + bold typography)
- Abel's on Queen (heritage storytelling)
- Maverick Studio for Men (split-screen innovation)
- Gentlemen Barber Clubs (parallax + gallery)

**Key takeaway from industry:** Dark background + vibrant accents (like Lime) + authentic photography + seamless booking = converts.

Your Barber's unique angle: **"Your cut history + photo reference in the booking flow" = conversion lever that competitors don't have.**

Lean into it. Make the gallery the hero of the microsite.