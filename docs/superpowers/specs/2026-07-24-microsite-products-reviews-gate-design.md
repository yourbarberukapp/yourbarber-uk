# Shop Microsite — Products, Reviews, Socials, Completeness Gate — Design

## Problem

Every shop already gets a public microsite at `/shop/[slug]` (hero, services, gallery, team, hours, address, map). Gaps against what's wanted:

1. No retail product catalogue (only services exist as a data model).
2. `shop.googleReviewUrl` is captured in Settings but never shown on the microsite.
3. Footer social icons (Instagram/Facebook/X) are hardcoded `href="#"` — no real URLs stored anywhere.
4. A brand-new shop (created via the instant `/signup` flow, which only asks for shop name + owner name) currently shows **fabricated content to real visitors**: a stock Unsplash cover photo, placeholder address "123 Grooming Lane, Barber City", a made-up "500+ Happy Clients" claim. Decision: don't fake it — gate the whole microsite behind a completeness check instead. Framed by the business owner as something that "may be paywalled later," so the gate must be a single reusable check, not scattered inline conditions.

## Decisions

- **Completeness requirement**: address, phone, opening hours set, cover photo uploaded, and at least 1 active service. Gallery photos, team bios, products, Google review link, and social links are optional — they don't block going live.
- **Gate implementation**: a single exported function, `isMicrositeComplete(shop): boolean`, in `src/lib/microsite.ts`. Takes the same shop shape already fetched by the microsite page. Used by:
  - `/shop/[slug]/page.tsx` — renders the full microsite only if complete; otherwise renders a "Coming soon" state.
  - (Future) any paywall check reuses the same function rather than duplicating field logic.
- **Incomplete-shop experience**: a branded "Coming soon" page — shop name (+ logo if set), a simple "This shop is still being set up" message, no fabricated trust content, no services/gallery/team/map sections. Distinct from a bare 404 (the shop is real, just not ready) but shares the visual shell (Navbar-less minimal page, matches site dark theme).
- **Products are display-only** — no checkout, no payment, no stock tracking. New `ShopProduct` model mirrors `ShopService` exactly: `name`, `price` (String, same free-text-with-currency-symbol convention as services), `imageUrl` (String?, URL-paste — matches the existing photo/gallery convention, no new upload infra), `description` (String?), `sortOrder`, `isActive`.
- **Google reviews**: simple link/button using the existing `shop.googleReviewUrl` field — no Google Places API, no live rating fetch.
- **Social links**: 3 new nullable `Shop` fields (`instagramUrl`, `facebookUrl`, `xUrl`). Footer icons render only when the corresponding URL is set; link to the real URL instead of `#`.

## Changes

### Schema (`prisma/schema.prisma` + hand-written migration, per this repo's convention — never `prisma migrate dev`)
- New model `ShopProduct` (mirrors `ShopService` shape/relations)
- `Shop` gains: `instagramUrl String?`, `facebookUrl String?`, `xUrl String?`

### `src/lib/microsite.ts` (new)
- `isMicrositeComplete(shop: { address, phone, openingHours, coverPhotoUrl, services }): boolean`

### `src/app/shop/[slug]/page.tsx`
- Fetch gains `instagramUrl, facebookUrl, xUrl, products` (active only, ordered)
- Branch on `isMicrositeComplete(shop)`: incomplete → render new `IncompleteMicrosite` component (or inline minimal markup) instead of the full page
- Add Products section (grid, same visual language as Services), rendered only if `shop.products.length > 0`
- Add "Read our reviews" link near the hero trust row, rendered only if `shop.googleReviewUrl` set; remove/replace the current fabricated "500+ Happy Clients" static claim
- Footer social icons: conditional render + real `href`

### `src/app/(dashboard)/settings/microsite/`
- New `ProductsEditor.tsx` (copy of `ServicesEditor.tsx` pattern: name, price, image URL, description, add/remove)
- `MicrositeForm.tsx`: add Instagram/Facebook/X URL inputs to the existing Contact & Info section; render `<ProductsEditor>` in a new "Products" section
- New API routes: `src/app/api/microsite/products/route.ts` (GET list, POST create) and `src/app/api/microsite/products/[id]/route.ts` (DELETE) — mirror `src/app/api/microsite/services/*` exactly (owner-only, zod-validated, scoped to `session.shopId`)
- `src/app/api/microsite/settings/route.ts` PATCH: accept and persist `instagramUrl`, `facebookUrl`, `xUrl`

### Dashboard visibility (small addition, not in original scope but needed for the gate to be usable)
- Microsite settings page (`/settings/microsite`) shows a small completeness checklist / banner ("3 of 5 required fields set — your public microsite isn't live yet") so owners understand why `/shop/[slug]` isn't public without needing to guess. Uses the same `isMicrositeComplete` logic, itemized.

## Out of scope
- Payment/checkout for products
- Live Google Places rating fetch
- Actual paywall/subscription enforcement (the gate function is just structured so it can be reused for that later)
- File upload for product images (URL-paste only, matching existing gallery/service convention)

## Verification
- New shop via `/signup` → visit its `/shop/[slug]` → confirm "Coming soon" state, not fabricated content
- Fill in address/phone/hours/cover photo/1 service in settings → revisit `/shop/[slug]` → confirm full microsite now renders
- Add a product in settings → confirm it appears on the public page; delete it → confirm it disappears
- Set `googleReviewUrl` → confirm "Read our reviews" link appears and points to the right URL; unset → confirm it's hidden
- Set one social URL only → confirm only that icon is a real link, others hidden
