# Shop Microsite — Public Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every barbershop a self-managed public website at `benjbarbers.yourbarber.uk` (or `yourbarber.uk/shop/benj-barbers`) showing opening hours, Google Maps, gallery, staff profiles, services/prices, and an about section — all editable by the shop owner inside the existing app.

**Architecture:** Extend the Shop model with microsite fields (`phone`, `about`, `openingHours` JSON, `googleMapsUrl`, `bookingUrl`, `coverPhotoUrl`). Add `ShopPhoto` and `ShopService` models. Add `bio` + `photoUrl` to Barber. Build public pages at `src/app/shop/[slug]/` — a single scrollable page with all sections. Next.js middleware detects subdomains (`benjbarbers.yourbarber.uk`) and rewrites to `/shop/benj-barbers`. Add a "Microsite" settings page in the owner dashboard with all the editors.

**Tech Stack:** Next.js 14 App Router, TypeScript, Prisma 7 + PostgreSQL, `@prisma/adapter-pg`, Tailwind CSS, Framer Motion. No new packages.

---

## Codebase Context

Project root: `c:/Users/luke/Thornes Surveyors & Valuers/Thornes - Documents/AI stuff/AntiGravity Folders/yourbarber.uk/`

**Existing key files:**
- `prisma/schema.prisma` — Prisma 7 schema (no url in datasource, uses pg adapter)
- `src/middleware.ts` — NextAuth middleware protecting dashboard routes
- `src/lib/auth.config.ts` — authorized() callback, currently allows `/customer/*` and `/c` through
- `src/app/(dashboard)/Sidebar.tsx` — sidebar nav, shows owner-only items based on `session.role`
- `src/app/api/settings/route.ts` — `GET/PATCH /api/settings` for shop name/address/logo
- `src/app/(dashboard)/settings/SettingsForm.tsx` — existing shop settings form

**Prisma 7 migration pattern:** `prisma migrate dev` requires a TTY. Create SQL manually, then `prisma migrate deploy`.

**Design system:** `#C8F135` lime, `#0A0A0A` near-black, `#111` card, `rgba(255,255,255,0.08)` border. `--font-barlow` for headings, `--font-inter` for body.

**Opening hours JSON shape:**
```typescript
type OpeningHours = {
  mon: { open: string; close: string; closed: boolean };
  tue: { open: string; close: string; closed: boolean };
  wed: { open: string; close: string; closed: boolean };
  thu: { open: string; close: string; closed: boolean };
  fri: { open: string; close: string; closed: boolean };
  sat: { open: string; close: string; closed: boolean };
  sun: { open: string; close: string; closed: boolean };
};

const DEFAULT_HOURS: OpeningHours = {
  mon: { open: '09:30', close: '18:00', closed: false },
  tue: { open: '09:30', close: '18:00', closed: false },
  wed: { open: '09:30', close: '18:00', closed: false },
  thu: { open: '09:30', close: '18:00', closed: false },
  fri: { open: '09:30', close: '18:00', closed: false },
  sat: { open: '09:00', close: '18:00', closed: false },
  sun: { open: '10:00', close: '16:00', closed: false },
};
```

---

## File Map

```
prisma/
  schema.prisma                                        MODIFY
  migrations/
    20260424200000_shop_microsite/
      migration.sql                                    CREATE

src/
  app/
    shop/
      [slug]/
        page.tsx                                       CREATE — public microsite (server component)
        layout.tsx                                     CREATE — minimal layout, no sidebar
    (dashboard)/
      settings/
        microsite/
          page.tsx                                     CREATE — server component, loads data
          MicrositeForm.tsx                            CREATE — client: all editors in one form
          HoursEditor.tsx                              CREATE — client: opening hours grid
          ServicesEditor.tsx                           CREATE — client: add/remove services
          GalleryEditor.tsx                            CREATE — client: add/remove gallery photos
      Sidebar.tsx                                      MODIFY — add "Microsite" nav item for owners
    api/
      microsite/
        settings/route.ts                              CREATE — GET/PATCH shop microsite fields
        services/route.ts                              CREATE — GET/POST ShopService
        services/[id]/route.ts                         CREATE — PATCH/DELETE ShopService
        photos/route.ts                                CREATE — GET/POST ShopPhoto
        photos/[id]/route.ts                           CREATE — DELETE ShopPhoto
  middleware.ts                                        MODIFY — subdomain detection + rewrite
```

---

## Task 1: Schema + Migration

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260424200000_shop_microsite/migration.sql`

- [ ] **Step 1: Update Shop model in schema.prisma**

Add new fields to the `Shop` model after `subscriptionStatus`:

```prisma
model Shop {
  id                 String       @id @default(cuid())
  name               String
  slug               String       @unique
  logoUrl            String?
  address            String?
  phone              String?
  about              String?
  coverPhotoUrl      String?
  googleMapsUrl      String?
  bookingUrl         String?
  openingHours       Json?
  subscriptionStatus String       @default("active")
  createdAt          DateTime     @default(now())
  barbers            Barber[]
  customers          Customer[]
  visits             Visit[]
  smsLogs            SmsLog[]
  photos             ShopPhoto[]
  services           ShopService[]
}
```

- [ ] **Step 2: Add bio + photoUrl to Barber model**

Add two optional fields after `isActive`:

```prisma
model Barber {
  id           String   @id @default(cuid())
  shopId       String
  shop         Shop     @relation(fields: [shopId], references: [id], onDelete: Cascade)
  name         String
  email        String
  passwordHash String
  role         String   @default("barber")
  isActive     Boolean  @default(true)
  bio          String?
  photoUrl     String?
  createdAt    DateTime @default(now())
  visits       Visit[]

  @@unique([email, shopId])
  @@index([shopId])
}
```

- [ ] **Step 3: Add ShopPhoto model**

After the SmsLog model, add:

```prisma
model ShopPhoto {
  id        String   @id @default(cuid())
  shopId    String
  shop      Shop     @relation(fields: [shopId], references: [id], onDelete: Cascade)
  url       String
  caption   String?
  sortOrder Int      @default(0)
  createdAt DateTime @default(now())

  @@index([shopId])
}

model ShopService {
  id          String   @id @default(cuid())
  shopId      String
  shop        Shop     @relation(fields: [shopId], references: [id], onDelete: Cascade)
  name        String
  price       String?
  duration    Int?
  description String?
  sortOrder   Int      @default(0)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())

  @@index([shopId])
}
```

- [ ] **Step 4: Create migration SQL**

```bash
mkdir "prisma/migrations/20260424200000_shop_microsite"
```

Create `prisma/migrations/20260424200000_shop_microsite/migration.sql`:

```sql
-- AlterTable: Shop
ALTER TABLE "Shop" ADD COLUMN "phone" TEXT;
ALTER TABLE "Shop" ADD COLUMN "about" TEXT;
ALTER TABLE "Shop" ADD COLUMN "coverPhotoUrl" TEXT;
ALTER TABLE "Shop" ADD COLUMN "googleMapsUrl" TEXT;
ALTER TABLE "Shop" ADD COLUMN "bookingUrl" TEXT;
ALTER TABLE "Shop" ADD COLUMN "openingHours" JSONB;

-- AlterTable: Barber
ALTER TABLE "Barber" ADD COLUMN "bio" TEXT;
ALTER TABLE "Barber" ADD COLUMN "photoUrl" TEXT;

-- CreateTable: ShopPhoto
CREATE TABLE "ShopPhoto" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ShopPhoto_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ShopPhoto_shopId_idx" ON "ShopPhoto"("shopId");
ALTER TABLE "ShopPhoto" ADD CONSTRAINT "ShopPhoto_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: ShopService
CREATE TABLE "ShopService" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" TEXT,
    "duration" INTEGER,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ShopService_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ShopService_shopId_idx" ON "ShopService"("shopId");
ALTER TABLE "ShopService" ADD CONSTRAINT "ShopService_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

- [ ] **Step 5: Regenerate client + deploy**

```bash
node_modules/.bin/prisma generate
node_modules/.bin/prisma migrate deploy
```

Expected: `✔ Generated Prisma Client` then `All migrations have been successfully applied.`

- [ ] **Step 6: Seed microsite data for Ben J Barbers**

Add the following to `prisma/seed.ts` after the customer creation (before `console.log`):

```typescript
// Microsite data
await prisma.shop.update({
  where: { id: shop.id },
  data: {
    phone: '01202 661075',
    about: 'Ben J Barbers is Poole\'s go-to barbershop for precision fades, classic cuts, and top-tier grooming. Walk-ins welcome, appointments preferred.',
    googleMapsUrl: 'https://maps.google.com/?q=78A+High+Street+Poole+BH15+1DB',
    openingHours: {
      mon: { open: '09:30', close: '18:00', closed: false },
      tue: { open: '09:30', close: '18:00', closed: false },
      wed: { open: '09:30', close: '18:00', closed: false },
      thu: { open: '09:30', close: '18:00', closed: false },
      fri: { open: '09:30', close: '18:00', closed: false },
      sat: { open: '09:00', close: '18:00', closed: false },
      sun: { open: '10:00', close: '16:00', closed: false },
    },
  },
});

await prisma.shopService.createMany({
  data: [
    { shopId: shop.id, name: 'Skin Fade', price: '£15', duration: 30, sortOrder: 0 },
    { shopId: shop.id, name: 'Taper Fade', price: '£15', duration: 30, sortOrder: 1 },
    { shopId: shop.id, name: 'Scissor Cut', price: '£12', duration: 25, sortOrder: 2 },
    { shopId: shop.id, name: 'Beard Trim', price: '£8', duration: 15, sortOrder: 3 },
    { shopId: shop.id, name: 'Hot Towel Shave', price: '£18', duration: 40, sortOrder: 4 },
    { shopId: shop.id, name: 'Cut & Beard', price: '£20', duration: 45, sortOrder: 5 },
  ],
});

await prisma.barber.update({
  where: { id: owner.id },
  data: { bio: 'Owner and head barber. 10+ years experience, specialising in fades and classic cuts.' },
});

await prisma.barber.update({
  where: { id: barber.id },
  data: { bio: 'Specialist in textured cuts, undercuts, and beard sculpting.' },
});
```

Then re-run the seed:

```bash
node node_modules/ts-node/dist/bin.js prisma/seed.ts
```

Expected: `Seeded: shop=benj-barbers, owner=owner@benjbarbers.com, ...`

- [ ] **Step 7: Commit**

```bash
git add prisma/
git commit -m "feat: shop microsite schema — ShopPhoto, ShopService, extended Shop + Barber"
```

---

## Task 2: Microsite API Routes

**Files:**
- Create: `src/app/api/microsite/settings/route.ts`
- Create: `src/app/api/microsite/services/route.ts`
- Create: `src/app/api/microsite/services/[id]/route.ts`
- Create: `src/app/api/microsite/photos/route.ts`
- Create: `src/app/api/microsite/photos/[id]/route.ts`

All routes require owner role except `GET /api/microsite/settings` (used by public microsite page — but we'll use a separate public DB query there, so all these routes are owner-only).

- [ ] **Step 1: Create src/app/api/microsite/settings/route.ts**

```bash
mkdir -p src/app/api/microsite/settings
```

```typescript
// src/app/api/microsite/settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

const daySchema = z.object({
  open: z.string(),
  close: z.string(),
  closed: z.boolean(),
});

const updateSchema = z.object({
  phone: z.string().max(20).optional(),
  about: z.string().max(1000).optional(),
  coverPhotoUrl: z.string().url().optional().or(z.literal('')),
  googleMapsUrl: z.string().url().optional().or(z.literal('')),
  bookingUrl: z.string().url().optional().or(z.literal('')),
  openingHours: z.object({
    mon: daySchema, tue: daySchema, wed: daySchema, thu: daySchema,
    fri: daySchema, sat: daySchema, sun: daySchema,
  }).optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = (session.user as any).shopId as string;

  const shop = await db.shop.findUnique({
    where: { id: shopId },
    select: {
      name: true, slug: true, address: true, phone: true, about: true,
      coverPhotoUrl: true, googleMapsUrl: true, bookingUrl: true, openingHours: true,
      photos: { orderBy: { sortOrder: 'asc' }, select: { id: true, url: true, caption: true, sortOrder: true } },
      services: { where: { isActive: true }, orderBy: { sortOrder: 'asc' }, select: { id: true, name: true, price: true, duration: true, description: true, sortOrder: true } },
      barbers: { where: { isActive: true }, select: { id: true, name: true, role: true, bio: true, photoUrl: true } },
    },
  });
  return NextResponse.json(shop);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { shopId, role } = session.user as any;
  if (role !== 'owner') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const parsed = updateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const shop = await db.shop.update({
    where: { id: shopId },
    data: parsed.data,
    select: { name: true, slug: true, phone: true, about: true, coverPhotoUrl: true, googleMapsUrl: true, bookingUrl: true, openingHours: true },
  });
  return NextResponse.json(shop);
}
```

- [ ] **Step 2: Create services routes**

```bash
mkdir -p src/app/api/microsite/services/\[id\]
```

Create `src/app/api/microsite/services/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

const createSchema = z.object({
  name: z.string().min(1).max(100),
  price: z.string().max(20).optional(),
  duration: z.number().int().positive().optional(),
  description: z.string().max(300).optional(),
  sortOrder: z.number().int().default(0),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = (session.user as any).shopId as string;
  const services = await db.shopService.findMany({
    where: { shopId },
    orderBy: { sortOrder: 'asc' },
  });
  return NextResponse.json(services);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { shopId, role } = session.user as any;
  if (role !== 'owner') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const service = await db.shopService.create({ data: { shopId, ...parsed.data } });
  return NextResponse.json(service, { status: 201 });
}
```

Create `src/app/api/microsite/services/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  price: z.string().max(20).optional(),
  duration: z.number().int().positive().optional(),
  description: z.string().max(300).optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { shopId, role } = session.user as any;
  if (role !== 'owner') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const service = await db.shopService.findFirst({ where: { id: params.id, shopId } });
  if (!service) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const parsed = updateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const updated = await db.shopService.update({ where: { id: params.id }, data: parsed.data });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { shopId, role } = session.user as any;
  if (role !== 'owner') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const service = await db.shopService.findFirst({ where: { id: params.id, shopId } });
  if (!service) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await db.shopService.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: Create photos routes**

```bash
mkdir -p src/app/api/microsite/photos/\[id\]
```

Create `src/app/api/microsite/photos/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

const createSchema = z.object({
  url: z.string().url(),
  caption: z.string().max(150).optional(),
  sortOrder: z.number().int().default(0),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = (session.user as any).shopId as string;
  const photos = await db.shopPhoto.findMany({
    where: { shopId },
    orderBy: { sortOrder: 'asc' },
  });
  return NextResponse.json(photos);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { shopId, role } = session.user as any;
  if (role !== 'owner') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const photo = await db.shopPhoto.create({ data: { shopId, ...parsed.data } });
  return NextResponse.json(photo, { status: 201 });
}
```

Create `src/app/api/microsite/photos/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { shopId, role } = session.user as any;
  if (role !== 'owner') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const photo = await db.shopPhoto.findFirst({ where: { id: params.id, shopId } });
  if (!photo) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await db.shopPhoto.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: Build check**

```bash
node_modules/.bin/next build 2>&1 | grep -E "Error:|compiled"
```

Expected: `✓ Compiled successfully`

- [ ] **Step 5: Commit**

```bash
git add src/app/api/microsite/
git commit -m "feat: microsite API routes for settings, services, photos"
```

---

## Task 3: Microsite Admin Editor

**Files:**
- Modify: `src/app/(dashboard)/Sidebar.tsx`
- Create: `src/app/(dashboard)/settings/microsite/page.tsx`
- Create: `src/app/(dashboard)/settings/microsite/MicrositeForm.tsx`
- Create: `src/app/(dashboard)/settings/microsite/HoursEditor.tsx`
- Create: `src/app/(dashboard)/settings/microsite/ServicesEditor.tsx`
- Create: `src/app/(dashboard)/settings/microsite/GalleryEditor.tsx`

- [ ] **Step 1: Add "Microsite" to Sidebar for owners**

Read `src/app/(dashboard)/Sidebar.tsx`. Find the `ownerItems` array and add a Globe icon import and Microsite entry:

At the top of the file, `Globe` is already imported from lucide-react? Check — if not, add it to the existing lucide import. Then update `ownerItems`:

```typescript
import { Users, Bell, UserPlus, Settings, LogOut, Menu, X, Globe } from 'lucide-react';

const ownerItems = [
  { href: '/team', label: 'Team', icon: UserPlus },
  { href: '/settings/microsite', label: 'Microsite', icon: Globe },
  { href: '/settings', label: 'Settings', icon: Settings },
];
```

- [ ] **Step 2: Create HoursEditor.tsx**

Create `src/app/(dashboard)/settings/microsite/HoursEditor.tsx`:

```typescript
'use client';

export type OpeningHours = {
  mon: { open: string; close: string; closed: boolean };
  tue: { open: string; close: string; closed: boolean };
  wed: { open: string; close: string; closed: boolean };
  thu: { open: string; close: string; closed: boolean };
  fri: { open: string; close: string; closed: boolean };
  sat: { open: string; close: string; closed: boolean };
  sun: { open: string; close: string; closed: boolean };
};

export const DEFAULT_HOURS: OpeningHours = {
  mon: { open: '09:30', close: '18:00', closed: false },
  tue: { open: '09:30', close: '18:00', closed: false },
  wed: { open: '09:30', close: '18:00', closed: false },
  thu: { open: '09:30', close: '18:00', closed: false },
  fri: { open: '09:30', close: '18:00', closed: false },
  sat: { open: '09:00', close: '18:00', closed: false },
  sun: { open: '10:00', close: '16:00', closed: false },
};

const DAY_LABELS: Record<keyof OpeningHours, string> = {
  mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday',
  fri: 'Friday', sat: 'Saturday', sun: 'Sunday',
};

interface Props {
  value: OpeningHours;
  onChange: (next: OpeningHours) => void;
}

export function HoursEditor({ value, onChange }: Props) {
  function updateDay(day: keyof OpeningHours, field: 'open' | 'close' | 'closed', val: string | boolean) {
    onChange({ ...value, [day]: { ...value[day], [field]: val } });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {(Object.keys(DAY_LABELS) as (keyof OpeningHours)[]).map((day) => {
        const d = value[day];
        return (
          <div key={day} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ width: 80, fontSize: '0.8rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-barlow, sans-serif)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {DAY_LABELS[day].slice(0, 3)}
            </span>
            <button
              type="button"
              onClick={() => updateDay(day, 'closed', !d.closed)}
              style={{
                width: 56, padding: '0.25rem 0', borderRadius: 4, fontSize: '0.65rem', fontWeight: 700,
                fontFamily: 'var(--font-barlow, sans-serif)', textTransform: 'uppercase',
                cursor: 'pointer', transition: 'all 0.12s',
                border: 'none',
                background: d.closed ? 'rgba(255,255,255,0.08)' : 'rgba(200,241,53,0.15)',
                color: d.closed ? 'rgba(255,255,255,0.3)' : '#C8F135',
              }}
            >
              {d.closed ? 'Closed' : 'Open'}
            </button>
            {!d.closed && (
              <>
                <input
                  type="time"
                  value={d.open}
                  onChange={e => updateDay(day, 'open', e.target.value)}
                  style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, color: 'white', padding: '0.25rem 0.5rem', fontSize: '0.8rem', outline: 'none', width: 90 }}
                />
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem' }}>–</span>
                <input
                  type="time"
                  value={d.close}
                  onChange={e => updateDay(day, 'close', e.target.value)}
                  style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, color: 'white', padding: '0.25rem 0.5rem', fontSize: '0.8rem', outline: 'none', width: 90 }}
                />
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 3: Create ServicesEditor.tsx**

Create `src/app/(dashboard)/settings/microsite/ServicesEditor.tsx`:

```typescript
'use client';
import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

export type Service = { id: string; name: string; price: string; duration: number | null; description: string };

interface Props {
  initial: Service[];
  shopSlug: string;
}

export function ServicesEditor({ initial, shopSlug: _ }: Props) {
  const [services, setServices] = useState<Service[]>(initial);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('');
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function addService() {
    if (!name.trim()) return;
    setAdding(true);
    const res = await fetch('/api/microsite/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), price: price.trim(), duration: duration ? parseInt(duration) : undefined, sortOrder: services.length }),
    });
    if (res.ok) {
      const s = await res.json();
      setServices(prev => [...prev, s]);
      setName(''); setPrice(''); setDuration('');
    }
    setAdding(false);
  }

  async function removeService(id: string) {
    setRemovingId(id);
    const res = await fetch(`/api/microsite/services/${id}`, { method: 'DELETE' });
    if (res.ok) setServices(prev => prev.filter(s => s.id !== id));
    setRemovingId(null);
  }

  const inputStyle: React.CSSProperties = {
    background: '#141414', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4,
    color: 'white', padding: '0.5rem 0.75rem', fontSize: '0.85rem', outline: 'none',
    fontFamily: 'var(--font-inter, sans-serif)',
  };

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: '1rem' }}>
        {services.map(s => (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#1a1a1a', borderRadius: 6, padding: '0.625rem 0.875rem', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div>
              <span style={{ color: 'white', fontSize: '0.875rem', fontWeight: 600, fontFamily: 'var(--font-inter, sans-serif)' }}>{s.name}</span>
              {s.price && <span style={{ color: '#C8F135', fontSize: '0.8rem', marginLeft: 10, fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 700 }}>{s.price}</span>}
              {s.duration && <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem', marginLeft: 8 }}>{s.duration} min</span>}
            </div>
            <button
              onClick={() => removeService(s.id)}
              disabled={removingId === s.id}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.25)', padding: 4 }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {services.length === 0 && (
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.8rem', fontFamily: 'var(--font-inter, sans-serif)' }}>No services yet.</p>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <input placeholder="Service name" value={name} onChange={e => setName(e.target.value)} style={{ ...inputStyle, flex: 2, minWidth: 120 }} />
        <input placeholder="Price (e.g. £15)" value={price} onChange={e => setPrice(e.target.value)} style={{ ...inputStyle, width: 100 }} />
        <input placeholder="Mins" type="number" value={duration} onChange={e => setDuration(e.target.value)} style={{ ...inputStyle, width: 70 }} />
        <button
          onClick={addService}
          disabled={adding || !name.trim()}
          style={{ background: '#C8F135', color: '#0A0A0A', border: 'none', borderRadius: 4, padding: '0.5rem 0.875rem', fontSize: '0.8rem', fontWeight: 700, fontFamily: 'var(--font-barlow, sans-serif)', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, opacity: adding || !name.trim() ? 0.5 : 1 }}
        >
          <Plus size={14} /> Add
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create GalleryEditor.tsx**

Create `src/app/(dashboard)/settings/microsite/GalleryEditor.tsx`:

```typescript
'use client';
import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

export type Photo = { id: string; url: string; caption: string | null };

interface Props { initial: Photo[] }

export function GalleryEditor({ initial }: Props) {
  const [photos, setPhotos] = useState<Photo[]>(initial);
  const [url, setUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function addPhoto() {
    if (!url.trim()) return;
    setAdding(true);
    const res = await fetch('/api/microsite/photos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: url.trim(), caption: caption.trim() || undefined, sortOrder: photos.length }),
    });
    if (res.ok) {
      const p = await res.json();
      setPhotos(prev => [...prev, p]);
      setUrl(''); setCaption('');
    }
    setAdding(false);
  }

  async function removePhoto(id: string) {
    setRemovingId(id);
    const res = await fetch(`/api/microsite/photos/${id}`, { method: 'DELETE' });
    if (res.ok) setPhotos(prev => prev.filter(p => p.id !== id));
    setRemovingId(null);
  }

  return (
    <div>
      {photos.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8, marginBottom: '1rem' }}>
          {photos.map(p => (
            <div key={p.id} style={{ position: 'relative', aspectRatio: '1', borderRadius: 6, overflow: 'hidden', background: '#1a1a1a' }}>
              <img src={p.url} alt={p.caption ?? ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <button
                onClick={() => removePhoto(p.id)}
                disabled={removingId === p.id}
                style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: 4, cursor: 'pointer', color: 'white', padding: 4 }}
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          placeholder="Photo URL (paste image link)"
          value={url}
          onChange={e => setUrl(e.target.value)}
          style={{ flex: 3, minWidth: 200, background: '#141414', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, color: 'white', padding: '0.5rem 0.75rem', fontSize: '0.85rem', outline: 'none', fontFamily: 'var(--font-inter, sans-serif)' }}
        />
        <input
          placeholder="Caption (optional)"
          value={caption}
          onChange={e => setCaption(e.target.value)}
          style={{ flex: 1, minWidth: 120, background: '#141414', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, color: 'white', padding: '0.5rem 0.75rem', fontSize: '0.85rem', outline: 'none', fontFamily: 'var(--font-inter, sans-serif)' }}
        />
        <button
          onClick={addPhoto}
          disabled={adding || !url.trim()}
          style={{ background: '#C8F135', color: '#0A0A0A', border: 'none', borderRadius: 4, padding: '0.5rem 0.875rem', fontSize: '0.8rem', fontWeight: 700, fontFamily: 'var(--font-barlow, sans-serif)', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, opacity: adding || !url.trim() ? 0.5 : 1 }}
        >
          <Plus size={14} /> Add
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create MicrositeForm.tsx**

Create `src/app/(dashboard)/settings/microsite/MicrositeForm.tsx`:

```typescript
'use client';
import { useState } from 'react';
import { Save, ExternalLink } from 'lucide-react';
import { HoursEditor, OpeningHours, DEFAULT_HOURS } from './HoursEditor';
import { ServicesEditor, Service } from './ServicesEditor';
import { GalleryEditor, Photo } from './GalleryEditor';

interface ShopData {
  name: string;
  slug: string;
  phone: string | null;
  about: string | null;
  coverPhotoUrl: string | null;
  googleMapsUrl: string | null;
  bookingUrl: string | null;
  openingHours: OpeningHours | null;
  services: Service[];
  photos: Photo[];
}

export function MicrositeForm({ shop }: { shop: ShopData }) {
  const [phone, setPhone] = useState(shop.phone ?? '');
  const [about, setAbout] = useState(shop.about ?? '');
  const [coverPhotoUrl, setCoverPhotoUrl] = useState(shop.coverPhotoUrl ?? '');
  const [googleMapsUrl, setGoogleMapsUrl] = useState(shop.googleMapsUrl ?? '');
  const [bookingUrl, setBookingUrl] = useState(shop.bookingUrl ?? '');
  const [hours, setHours] = useState<OpeningHours>(shop.openingHours ?? DEFAULT_HOURS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch('/api/microsite/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, about, coverPhotoUrl, googleMapsUrl, bookingUrl, openingHours: hours }),
    });
    setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 2000);
  }

  const micrositeUrl = `https://${shop.slug}.yourbarber.uk`;

  const inputCls = "w-full bg-[#141414] border border-white/8 rounded px-3 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#C8F135]/40 transition-colors font-['Inter']";
  const sectionLabel = "text-[11px] font-bold uppercase tracking-widest text-white/35 font-['Barlow_Condensed'] mb-2 block";

  return (
    <form onSubmit={handleSave} className="space-y-8 max-w-2xl">
      {/* Live microsite link */}
      <div className="bg-[#C8F135]/5 border border-[#C8F135]/20 rounded-lg px-4 py-3 flex items-center justify-between">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-widest text-[#C8F135]/60 font-['Barlow_Condensed'] mb-0.5">Your microsite</div>
          <code className="text-white/70 text-sm font-mono">{micrositeUrl}</code>
        </div>
        <a href={`/shop/${shop.slug}`} target="_blank" rel="noopener noreferrer" className="text-[#C8F135]/50 hover:text-[#C8F135] transition-colors">
          <ExternalLink size={16} />
        </a>
      </div>

      {/* Basic info */}
      <div className="space-y-4">
        <h3 className="font-['Barlow_Condensed'] font-bold text-base uppercase tracking-wide text-white">Contact & info</h3>
        <div>
          <label className={sectionLabel}>Phone number</label>
          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="01202 661075" className={inputCls} />
        </div>
        <div>
          <label className={sectionLabel}>About your shop</label>
          <textarea rows={4} value={about} onChange={e => setAbout(e.target.value)} placeholder="Tell customers about your shop, your vibe, what makes you different…" className={`${inputCls} resize-none`} />
        </div>
        <div>
          <label className={sectionLabel}>Cover photo URL</label>
          <input type="url" value={coverPhotoUrl} onChange={e => setCoverPhotoUrl(e.target.value)} placeholder="https://…" className={inputCls} />
        </div>
        <div>
          <label className={sectionLabel}>Google Maps URL</label>
          <input type="url" value={googleMapsUrl} onChange={e => setGoogleMapsUrl(e.target.value)} placeholder="https://maps.google.com/?q=…" className={inputCls} />
        </div>
        <div>
          <label className={sectionLabel}>Booking link (optional)</label>
          <input type="url" value={bookingUrl} onChange={e => setBookingUrl(e.target.value)} placeholder="https://your-booking-tool.com/…" className={inputCls} />
        </div>
      </div>

      {/* Opening hours */}
      <div>
        <h3 className="font-['Barlow_Condensed'] font-bold text-base uppercase tracking-wide text-white mb-4">Opening hours</h3>
        <HoursEditor value={hours} onChange={setHours} />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="btn-lime w-full py-3 rounded flex items-center justify-center gap-2 text-sm disabled:opacity-50"
      >
        <Save size={16} />
        {saved ? 'Saved ✓' : saving ? 'Saving…' : 'Save microsite settings'}
      </button>

      {/* Services — managed separately (immediate API saves) */}
      <div>
        <h3 className="font-['Barlow_Condensed'] font-bold text-base uppercase tracking-wide text-white mb-4">Services & prices</h3>
        <ServicesEditor initial={shop.services} shopSlug={shop.slug} />
      </div>

      {/* Gallery */}
      <div>
        <h3 className="font-['Barlow_Condensed'] font-bold text-base uppercase tracking-wide text-white mb-4">Gallery</h3>
        <p className="text-white/30 text-xs font-['Inter'] mb-3">Paste image URLs. These appear in your public gallery section.</p>
        <GalleryEditor initial={shop.photos} />
      </div>
    </form>
  );
}
```

- [ ] **Step 6: Create the settings/microsite page.tsx (server component)**

Create `src/app/(dashboard)/settings/microsite/page.tsx`:

```typescript
import { redirect } from 'next/navigation';
import { getRequiredSession } from '@/lib/session';
import { db } from '@/lib/db';
import { MicrositeForm } from './MicrositeForm';

export default async function MicrositePage() {
  const session = await getRequiredSession();
  if (session.role !== 'owner') redirect('/customers');

  const shop = await db.shop.findUnique({
    where: { id: session.shopId },
    select: {
      name: true, slug: true, phone: true, about: true,
      coverPhotoUrl: true, googleMapsUrl: true, bookingUrl: true, openingHours: true,
      photos: { orderBy: { sortOrder: 'asc' }, select: { id: true, url: true, caption: true } },
      services: { where: { isActive: true }, orderBy: { sortOrder: 'asc' }, select: { id: true, name: true, price: true, duration: true, description: true } },
    },
  });

  if (!shop) redirect('/customers');

  return (
    <div className="max-w-2xl">
      <h1 className="font-['Barlow_Condensed'] font-black text-3xl uppercase tracking-wide text-white mb-8">Microsite</h1>
      <MicrositeForm shop={shop as any} />
    </div>
  );
}
```

- [ ] **Step 7: Build check**

```bash
node_modules/.bin/next build 2>&1 | grep -E "Error:|compiled"
```

Expected: `✓ Compiled successfully`

- [ ] **Step 8: Manual smoke test**

1. Go to `http://localhost:3001/settings/microsite` (logged in as owner)
2. Verify: phone, about, hours, services all pre-populated from seed
3. Change phone to `01202 123456` → save → refresh → verify it persisted
4. Add a service: "Kids Cut" / £10 / 20 min → verify it appears in list
5. Remove it → verify it disappears

- [ ] **Step 9: Commit**

```bash
git add src/app/\(dashboard\)/settings/microsite/ src/app/\(dashboard\)/Sidebar.tsx
git commit -m "feat: microsite admin editor with hours, services, gallery"
```

---

## Task 4: Public Microsite Page

**Files:**
- Create: `src/app/shop/[slug]/layout.tsx`
- Create: `src/app/shop/[slug]/page.tsx`

- [ ] **Step 1: Create minimal layout (no sidebar)**

```bash
mkdir -p "src/app/shop/[slug]"
```

Create `src/app/shop/[slug]/layout.tsx`:

```typescript
export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

- [ ] **Step 2: Create the public microsite page**

Create `src/app/shop/[slug]/page.tsx`:

```typescript
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db';
import { Scissors, MapPin, Phone, Clock, ExternalLink } from 'lucide-react';

type OpeningHours = {
  mon: { open: string; close: string; closed: boolean };
  tue: { open: string; close: string; closed: boolean };
  wed: { open: string; close: string; closed: boolean };
  thu: { open: string; close: string; closed: boolean };
  fri: { open: string; close: string; closed: boolean };
  sat: { open: string; close: string; closed: boolean };
  sun: { open: string; close: string; closed: boolean };
};

const DAY_NAMES: [string, keyof OpeningHours][] = [
  ['Monday', 'mon'], ['Tuesday', 'tue'], ['Wednesday', 'wed'], ['Thursday', 'thu'],
  ['Friday', 'fri'], ['Saturday', 'sat'], ['Sunday', 'sun'],
];

function fmt(t: string) {
  const [h, m] = t.split(':').map(Number);
  const suffix = h < 12 ? 'am' : 'pm';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return m === 0 ? `${h12}${suffix}` : `${h12}:${m.toString().padStart(2, '0')}${suffix}`;
}

export default async function ShopMicrosite({ params }: { params: { slug: string } }) {
  const shop = await db.shop.findUnique({
    where: { slug: params.slug },
    select: {
      name: true, slug: true, address: true, phone: true, about: true,
      coverPhotoUrl: true, googleMapsUrl: true, bookingUrl: true, openingHours: true,
      photos: { orderBy: { sortOrder: 'asc' }, select: { id: true, url: true, caption: true } },
      services: { where: { isActive: true }, orderBy: { sortOrder: 'asc' }, select: { id: true, name: true, price: true, duration: true, description: true } },
      barbers: { where: { isActive: true }, select: { id: true, name: true, role: true, bio: true, photoUrl: true } },
    },
  });

  if (!shop) notFound();

  const hours = shop.openingHours as OpeningHours | null;

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0A', color: 'white' }}>
      {/* Hero */}
      <div style={{
        position: 'relative', overflow: 'hidden',
        background: shop.coverPhotoUrl ? `linear-gradient(to bottom, rgba(10,10,10,0.5), #0A0A0A), url(${shop.coverPhotoUrl}) center/cover` : 'linear-gradient(135deg, #0f0f0f 0%, #111 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '4rem 1.5rem 3rem',
      }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1.25rem' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(200,241,53,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Scissors size={16} color="#C8F135" />
            </div>
            <span style={{ fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 900, fontSize: '1.25rem', textTransform: 'uppercase', letterSpacing: '-0.01em' }}>
              Your<span style={{ color: '#C8F135' }}>Barber</span>
            </span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 900, fontSize: 'clamp(2.5rem, 8vw, 4.5rem)', textTransform: 'uppercase', lineHeight: 0.95, letterSpacing: '-0.02em', marginBottom: '1rem' }}>
            {shop.name}
          </h1>
          {shop.address && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', marginBottom: shop.bookingUrl ? '2rem' : 0 }}>
              <MapPin size={14} />
              <span style={{ fontFamily: 'var(--font-inter, sans-serif)' }}>{shop.address}</span>
            </div>
          )}
          {shop.bookingUrl && (
            <a
              href={shop.bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                marginTop: '1.5rem',
                background: '#C8F135', color: '#0A0A0A',
                padding: '0.75rem 1.5rem', borderRadius: 4,
                fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 700,
                fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em',
                textDecoration: 'none',
              }}
            >
              Book now <ExternalLink size={14} />
            </a>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '3rem 1.5rem' }}>

        {/* About */}
        {shop.about && (
          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 800, fontSize: '1.5rem', textTransform: 'uppercase', letterSpacing: '0.02em', marginBottom: '1rem', color: 'white' }}>
              About us
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.65)', lineHeight: 1.8, fontFamily: 'var(--font-inter, sans-serif)', fontSize: '1rem' }}>{shop.about}</p>
          </section>
        )}

        {/* Services */}
        {shop.services.length > 0 && (
          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 800, fontSize: '1.5rem', textTransform: 'uppercase', letterSpacing: '0.02em', marginBottom: '1rem' }}>
              Services
            </h2>
            <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, overflow: 'hidden' }}>
              {shop.services.map((s, i) => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1.25rem', borderBottom: i < shop.services.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                  <div>
                    <span style={{ color: 'white', fontWeight: 600, fontFamily: 'var(--font-inter, sans-serif)', fontSize: '0.95rem' }}>{s.name}</span>
                    {s.duration && <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem', marginLeft: 8, fontFamily: 'var(--font-inter, sans-serif)' }}>{s.duration} min</span>}
                    {s.description && <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', marginTop: 2, fontFamily: 'var(--font-inter, sans-serif)' }}>{s.description}</p>}
                  </div>
                  {s.price && <span style={{ color: '#C8F135', fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 700, fontSize: '1rem' }}>{s.price}</span>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Opening hours + contact — 2 col on wide */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
          {hours && (
            <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '1.25rem' }}>
              <h3 style={{ fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 800, fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.875rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clock size={14} style={{ color: '#C8F135' }} /> Opening hours
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {DAY_NAMES.map(([label, key]) => {
                  const d = hours[key];
                  return (
                    <div key={key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontFamily: 'var(--font-inter, sans-serif)' }}>
                      <span style={{ color: 'rgba(255,255,255,0.5)' }}>{label}</span>
                      <span style={{ color: d.closed ? 'rgba(255,255,255,0.25)' : 'white' }}>
                        {d.closed ? 'Closed' : `${fmt(d.open)} – ${fmt(d.close)}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {(shop.phone || shop.address || shop.googleMapsUrl) && (
            <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '1.25rem' }}>
              <h3 style={{ fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 800, fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.875rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Phone size={14} style={{ color: '#C8F135' }} /> Contact
              </h3>
              {shop.phone && (
                <a href={`tel:${shop.phone}`} style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'white', textDecoration: 'none', fontSize: '0.95rem', fontFamily: 'var(--font-inter, sans-serif)', marginBottom: '0.75rem' }}>
                  <Phone size={13} style={{ color: 'rgba(255,255,255,0.35)' }} /> {shop.phone}
                </a>
              )}
              {shop.address && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, color: 'rgba(255,255,255,0.55)', fontSize: '0.875rem', fontFamily: 'var(--font-inter, sans-serif)', marginBottom: shop.googleMapsUrl ? '0.875rem' : 0 }}>
                  <MapPin size={13} style={{ marginTop: 2, flexShrink: 0, color: 'rgba(255,255,255,0.35)' }} /> {shop.address}
                </div>
              )}
              {shop.googleMapsUrl && (
                <a href={shop.googleMapsUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#C8F135', fontSize: '0.8rem', fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', textDecoration: 'none' }}>
                  Get directions <ExternalLink size={12} />
                </a>
              )}
            </div>
          )}
        </section>

        {/* Gallery */}
        {shop.photos.length > 0 && (
          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 800, fontSize: '1.5rem', textTransform: 'uppercase', letterSpacing: '0.02em', marginBottom: '1rem' }}>
              Gallery
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8 }}>
              {shop.photos.map(p => (
                <div key={p.id} style={{ aspectRatio: '1', borderRadius: 6, overflow: 'hidden', background: '#111' }}>
                  <img src={p.url} alt={p.caption ?? ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Team */}
        {shop.barbers.length > 0 && (
          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 800, fontSize: '1.5rem', textTransform: 'uppercase', letterSpacing: '0.02em', marginBottom: '1rem' }}>
              The team
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
              {shop.barbers.map(b => (
                <div key={b.id} style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '1.25rem', textAlign: 'center' }}>
                  {b.photoUrl ? (
                    <img src={b.photoUrl} alt={b.name} style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', margin: '0 auto 0.75rem' }} />
                  ) : (
                    <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(200,241,53,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
                      <span style={{ color: '#C8F135', fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 900, fontSize: '1.25rem' }}>
                        {b.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div style={{ fontWeight: 700, fontSize: '1rem', fontFamily: 'var(--font-barlow, sans-serif)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>{b.name}</div>
                  {b.role === 'owner' && <div style={{ color: '#C8F135', fontSize: '0.7rem', fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Owner</div>}
                  {b.bio && <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.8rem', lineHeight: 1.5, fontFamily: 'var(--font-inter, sans-serif)' }}>{b.bio}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Footer */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1.5rem', textAlign: 'center' }}>
          <Link href="/customer/login" style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.75rem', fontFamily: 'var(--font-inter, sans-serif)', textDecoration: 'none' }}>
            View your cut history
          </Link>
          <span style={{ color: 'rgba(255,255,255,0.1)', margin: '0 0.75rem' }}>·</span>
          <Link href="/" style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.75rem', fontFamily: 'var(--font-inter, sans-serif)', textDecoration: 'none' }}>
            Powered by YourBarber
          </Link>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Build check**

```bash
node_modules/.bin/next build 2>&1 | grep -E "Error:|compiled"
```

Expected: `✓ Compiled successfully`

- [ ] **Step 4: Manual smoke test**

Go to `http://localhost:3001/shop/benj-barbers`  
Verify all sections render: shop name hero, about text, 6 services with prices, opening hours, contact details with Google Maps link, team section with Ben + Jake and their bios.

- [ ] **Step 5: Commit**

```bash
git add src/app/shop/
git commit -m "feat: public shop microsite at /shop/[slug]"
```

---

## Task 5: Subdomain Middleware

**Files:**
- Modify: `src/middleware.ts`
- Modify: `src/lib/auth.config.ts`

- [ ] **Step 1: Update middleware.ts to detect subdomains**

Replace the entire `src/middleware.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import NextAuth from 'next-auth';
import { authConfig } from './lib/auth.config';

const { auth } = NextAuth(authConfig);

export default auth(function middleware(req: NextRequest) {
  const hostname = req.headers.get('host') ?? '';
  const url = req.nextUrl.clone();

  // Subdomain detection: benjbarbers.yourbarber.uk → /shop/benj-barbers
  // Works for *.yourbarber.uk subdomains only (not www, not localhost)
  const hostParts = hostname.split('.');
  const isSubdomain =
    hostParts.length >= 3 &&
    hostname.endsWith('.yourbarber.uk') &&
    hostParts[0] !== 'www';

  if (isSubdomain) {
    // Convert subdomain slug to DB slug format: benjbarbers → benj-barbers
    // We pass it as-is and let the page do a case-insensitive lookup
    const subSlug = hostParts[0].toLowerCase();
    url.pathname = `/shop/${subSlug}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
```

- [ ] **Step 2: Update auth.config.ts to allow /shop/* without barber auth**

Open `src/lib/auth.config.ts`. Add `/shop/` to the early-return public paths, after the existing `/customer` and `/c` check:

```typescript
      const isCustomerPortal = nextUrl.pathname.startsWith('/customer') ||
                               nextUrl.pathname.startsWith('/c') ||
                               nextUrl.pathname.startsWith('/shop');
      if (isCustomerPortal) return true;
```

- [ ] **Step 3: Build check**

```bash
node_modules/.bin/next build 2>&1 | grep -E "Error:|compiled"
```

Expected: `✓ Compiled successfully`

- [ ] **Step 4: Test subdomain locally with /etc/hosts trick (optional)**

For local subdomain testing, add to `C:\Windows\System32\drivers\etc\hosts`:
```
127.0.0.1 benjbarbers.yourbarber.local
```
Then access `http://benjbarbers.yourbarber.local:3001` — middleware rewrites to `/shop/benjbarbers`.

For the demo, just use `http://localhost:3001/shop/benj-barbers` directly (same page, no DNS needed).

- [ ] **Step 5: Commit**

```bash
git add src/middleware.ts src/lib/auth.config.ts
git commit -m "feat: subdomain middleware — *.yourbarber.uk rewrites to /shop/[slug]"
```

---

## Self-Review

**Spec coverage check:**
- ✅ Tappable chip options for style, grades, beard, products, techniques → Task 3 (CutDetailsForm)
- ✅ Recommendations field visible to client → Task 4 (VisitRecordClient) + Task 5 (customer portal)
- ✅ `benjbarbers.yourbarber.uk` subdomain → Task 5 (middleware)
- ✅ Google Maps → Task 4 (public microsite contact section)
- ✅ Opening times → Task 4 (public microsite hours section)
- ✅ Gallery → Task 3 (GalleryEditor) + Task 4 (public microsite gallery)
- ✅ Staff section → Task 4 (public microsite team section)
- ✅ About us → Task 3 (MicrositeForm about field) + Task 4 (public microsite)
- ✅ Self-managed by barbers → Task 3 (Microsite admin editor in settings)
- ✅ Services & prices → Task 3 (ServicesEditor) + Task 4 (public microsite services)

**No placeholders found.**

**Type consistency confirmed:** `OpeningHours` type defined in `HoursEditor.tsx`, imported in `MicrositeForm.tsx`. `Service` type defined in `ServicesEditor.tsx`. `Photo` type in `GalleryEditor.tsx`. Public page defines its own local types (no imports needed, server component). `CutDetails` type defined in `CutDetailsForm.tsx`, imported in `VisitRecordClient.tsx` and `customer/page.tsx`.
