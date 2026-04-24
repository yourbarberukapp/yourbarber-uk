# Enhanced Visit Recording — Tappable Options Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the freeform notes-only visit recording screen with tappable chip selectors for haircut style, clipper grades, beard work, products, and techniques — plus a visible "recommendation to client" field — all surfaced on the customer's personal portal.

**Architecture:** Add `cutDetails Json?` and `recommendation String?` to the Visit Prisma model. The visit recording UI becomes a multi-section form of tappable chips (one tap = selected, tap again = deselected) with freeform notes still available for anything the chips don't cover. The customer portal's `Visit` type and `/api/customer/me` response are updated to include the new fields and display them as styled tags + a recommendation card.

**Tech Stack:** Next.js 14 App Router, TypeScript, Prisma 7 + PostgreSQL (Neon), `@prisma/adapter-pg`, Tailwind CSS, Framer Motion. No new packages required.

---

## Codebase Context

The project root is:
```
c:/Users/luke/Thornes Surveyors & Valuers/Thornes - Documents/AI stuff/AntiGravity Folders/yourbarber.uk/
```

**Key existing files:**
- `prisma/schema.prisma` — Prisma schema (Prisma 7, no `url` in datasource, uses adapter)
- `prisma/migrations/` — migrations applied via `prisma migrate deploy`
- `src/app/(dashboard)/customers/[id]/visit/new/VisitRecordClient.tsx` — current visit form (notes + SMS opt-in only)
- `src/app/api/customers/[id]/visits/route.ts` — `POST` creates visit, `GET` returns visit history
- `src/app/customer/page.tsx` — customer portal showing visit cards with notes + photos
- `src/app/api/customer/me/route.ts` — returns customer data including visits with `notes` and `photos`

**Design tokens:** `#C8F135` lime, `#0A0A0A` near-black, `#111` card bg, `rgba(255,255,255,0.08)` border. Font vars: `var(--font-barlow, sans-serif)` for labels/headings, `var(--font-inter, sans-serif)` for body.

**Prisma 7 migration pattern:** Because `prisma migrate dev` requires a TTY, create the SQL file manually then run `prisma migrate deploy`. See Task 1 for exact steps.

**Chip data model — `cutDetails` JSON shape:**
```typescript
type CutDetails = {
  style: string[];       // e.g. ["Skin Fade", "Textured Crop"]
  sidesGrade: string;    // e.g. "1.5" — single value
  topLength: string;     // e.g. "Scissors" — single value
  beard: string;         // e.g. "Shape up" — single value
  products: string[];    // e.g. ["Pomade"]
  techniques: string[];  // e.g. ["Line up", "Hot towel"]
}
```

---

## File Map

```
prisma/
  schema.prisma                                    MODIFY — add cutDetails + recommendation to Visit
  migrations/
    20260424100000_add_cut_details/
      migration.sql                                CREATE — manual SQL for new columns

src/
  components/
    CutDetailsForm.tsx                             CREATE — tappable chip sections
  app/
    (dashboard)/
      customers/[id]/visit/new/
        VisitRecordClient.tsx                      MODIFY — integrate CutDetailsForm
    api/
      customers/[id]/visits/
        route.ts                                   MODIFY — accept cutDetails + recommendation
      customer/
        me/
          route.ts                                 MODIFY — return cutDetails + recommendation in visits
    customer/
      page.tsx                                     MODIFY — display chip tags + recommendation card
```

---

## Task 1: Schema + Migration

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260424100000_add_cut_details/migration.sql`

- [ ] **Step 1: Update schema.prisma — add fields to Visit model**

Open `prisma/schema.prisma`. Find the `Visit` model. Add two fields after `notes`:

```prisma
model Visit {
  id         String       @id @default(cuid())
  shopId     String
  shop       Shop         @relation(fields: [shopId], references: [id], onDelete: Cascade)
  customerId String
  customer   Customer     @relation(fields: [customerId], references: [id])
  barberId   String
  barber     Barber       @relation(fields: [barberId], references: [id])
  visitedAt  DateTime     @default(now())
  notes      String?
  cutDetails Json?
  recommendation String?
  photos     VisitPhoto[]
  createdAt  DateTime     @default(now())

  @@index([customerId])
  @@index([shopId, visitedAt])
}
```

- [ ] **Step 2: Create migration directory and SQL file**

```bash
mkdir "prisma/migrations/20260424100000_add_cut_details"
```

Create `prisma/migrations/20260424100000_add_cut_details/migration.sql` with this exact content:

```sql
-- AlterTable
ALTER TABLE "Visit" ADD COLUMN "cutDetails" JSONB;
ALTER TABLE "Visit" ADD COLUMN "recommendation" TEXT;
```

- [ ] **Step 3: Regenerate Prisma client**

```bash
node_modules/.bin/prisma generate
```

Expected output:
```
✔ Generated Prisma Client (v7.8.0) to .\node_modules\@prisma\client in ~300ms
```

- [ ] **Step 4: Deploy migration to the database**

```bash
node_modules/.bin/prisma migrate deploy
```

Expected output includes:
```
Applying migration `20260424100000_add_cut_details`
All migrations have been successfully applied.
```

- [ ] **Step 5: Verify columns exist**

```bash
node -e "
const pg = require('./node_modules/pg');
require('dotenv/config');
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT column_name FROM information_schema.columns WHERE table_name = \'Visit\' AND column_name IN (\'cutDetails\', \'recommendation\')')
  .then(r => { console.log(r.rows); pool.end(); });
"
```

Expected: prints two rows with `cutDetails` and `recommendation`.

- [ ] **Step 6: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add cutDetails + recommendation fields to Visit"
```

---

## Task 2: Update the Visits API

**Files:**
- Modify: `src/app/api/customers/[id]/visits/route.ts`

- [ ] **Step 1: Update the Zod schema to accept new fields**

Replace the entire file content of `src/app/api/customers/[id]/visits/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

const cutDetailsSchema = z.object({
  style: z.array(z.string()).default([]),
  sidesGrade: z.string().default(''),
  topLength: z.string().default(''),
  beard: z.string().default(''),
  products: z.array(z.string()).default([]),
  techniques: z.array(z.string()).default([]),
}).optional();

const createVisitSchema = z.object({
  notes: z.string().max(2000).optional(),
  smsOptIn: z.enum(['yes', 'no', 'not_asked']),
  visitedAt: z.string().datetime().optional(),
  cutDetails: cutDetailsSchema,
  recommendation: z.string().max(500).optional(),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { shopId } = session.user as any;
  const barberId = (session.user as any).id;

  const customer = await db.customer.findFirst({ where: { id: params.id, shopId } });
  if (!customer) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  const parsed = createVisitSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const visitedAt = parsed.data.visitedAt ? new Date(parsed.data.visitedAt) : new Date();

  const [visit] = await db.$transaction([
    db.visit.create({
      data: {
        shopId,
        customerId: params.id,
        barberId,
        notes: parsed.data.notes,
        cutDetails: parsed.data.cutDetails ?? undefined,
        recommendation: parsed.data.recommendation,
        visitedAt,
      },
    }),
    db.customer.update({
      where: { id: params.id },
      data: { lastVisitAt: visitedAt, smsOptIn: parsed.data.smsOptIn },
    }),
  ]);

  return NextResponse.json(visit, { status: 201 });
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = (session.user as any).shopId as string;

  const visits = await db.visit.findMany({
    where: { customerId: params.id, shopId },
    orderBy: { visitedAt: 'desc' },
    include: { photos: true, barber: { select: { name: true } } },
  });
  return NextResponse.json(visits);
}
```

- [ ] **Step 2: Verify build passes**

```bash
node_modules/.bin/next build 2>&1 | grep -E "Error:|compiled"
```

Expected: `✓ Compiled successfully` with no `Error:` lines.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/customers/
git commit -m "feat: visits API accepts cutDetails and recommendation"
```

---

## Task 3: CutDetailsForm Component

**Files:**
- Create: `src/components/CutDetailsForm.tsx`

This is a pure UI component — no API calls. It receives the current state and a change handler from the parent.

- [ ] **Step 1: Create the component**

Create `src/components/CutDetailsForm.tsx`:

```typescript
'use client';

export type CutDetails = {
  style: string[];
  sidesGrade: string;
  topLength: string;
  beard: string;
  products: string[];
  techniques: string[];
};

export const EMPTY_CUT_DETAILS: CutDetails = {
  style: [],
  sidesGrade: '',
  topLength: '',
  beard: '',
  products: [],
  techniques: [],
};

const STYLES = [
  'Skin Fade', 'Low Fade', 'Mid Fade', 'High Fade', 'Taper Fade', 'Drop Fade',
  'Scissor Cut', 'Crop', 'Textured Crop', 'Slick Back', 'Pompadour', 'Quiff',
  'Buzz Cut', 'Crew Cut', 'Classic Cut', 'Undercut',
  'Shape Up', 'Waves', 'Curls', 'Afro', 'Head Shave',
];

const SIDES_GRADES = ['0 (Bald)', '0.5', '1', '1.5', '2', '2.5', '3', '3.5', '4', 'Scissors', 'Razor'];

const TOP_LENGTHS = ['Scissors', '3', '4', '5', '6', '7', '8', 'Left long', 'Very short'];

const BEARD_OPTIONS = ['Not done', 'Shape up', 'Fade into beard', 'Trim', 'Full shave', 'Hot towel shave'];

const PRODUCTS = ['None', 'Pomade', 'Clay', 'Wax', 'Sea Salt Spray', 'Mousse', 'Fibre', 'Gel', 'Oil', 'Conditioner'];

const TECHNIQUES = ['Line up', 'Hot towel', 'Razor fade', 'Blending', 'Texturising', 'Thinning shears', 'Skin fade', 'Scissor over comb'];

interface Props {
  value: CutDetails;
  onChange: (next: CutDetails) => void;
}

const label: React.CSSProperties = {
  display: 'block', fontSize: '0.7rem', fontWeight: 700,
  textTransform: 'uppercase', letterSpacing: '0.1em',
  color: 'rgba(255,255,255,0.4)', marginBottom: '0.5rem',
  fontFamily: 'var(--font-barlow, sans-serif)',
};

function ChipGroup({
  title, options, selected, multi, onToggle,
}: {
  title: string;
  options: string[];
  selected: string | string[];
  multi: boolean;
  onToggle: (val: string) => void;
}) {
  const isSelected = (v: string) =>
    multi ? (selected as string[]).includes(v) : selected === v;

  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <span style={label}>{title}</span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {options.map((opt) => {
          const active = isSelected(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onToggle(opt)}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: 4,
                fontSize: '0.78rem',
                fontWeight: 600,
                fontFamily: 'var(--font-barlow, sans-serif)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                cursor: 'pointer',
                transition: 'all 0.12s',
                border: active ? 'none' : '1px solid rgba(255,255,255,0.12)',
                background: active ? '#C8F135' : '#1a1a1a',
                color: active ? '#0A0A0A' : 'rgba(255,255,255,0.55)',
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function CutDetailsForm({ value, onChange }: Props) {
  function toggleMulti(field: 'style' | 'products' | 'techniques', val: string) {
    const current = value[field];
    const next = current.includes(val)
      ? current.filter((v) => v !== val)
      : [...current, val];
    onChange({ ...value, [field]: next });
  }

  function setSingle(field: 'sidesGrade' | 'topLength' | 'beard', val: string) {
    onChange({ ...value, [field]: value[field] === val ? '' : val });
  }

  return (
    <div>
      <ChipGroup
        title="Style"
        options={STYLES}
        selected={value.style}
        multi={true}
        onToggle={(v) => toggleMulti('style', v)}
      />
      <ChipGroup
        title="Sides & back grade"
        options={SIDES_GRADES}
        selected={value.sidesGrade}
        multi={false}
        onToggle={(v) => setSingle('sidesGrade', v)}
      />
      <ChipGroup
        title="Top length"
        options={TOP_LENGTHS}
        selected={value.topLength}
        multi={false}
        onToggle={(v) => setSingle('topLength', v)}
      />
      <ChipGroup
        title="Beard"
        options={BEARD_OPTIONS}
        selected={value.beard}
        multi={false}
        onToggle={(v) => setSingle('beard', v)}
      />
      <ChipGroup
        title="Products used"
        options={PRODUCTS}
        selected={value.products}
        multi={true}
        onToggle={(v) => toggleMulti('products', v)}
      />
      <ChipGroup
        title="Techniques"
        options={TECHNIQUES}
        selected={value.techniques}
        multi={true}
        onToggle={(v) => toggleMulti('techniques', v)}
      />
    </div>
  );
}
```

- [ ] **Step 2: Verify it type-checks (no build errors)**

```bash
node_modules/.bin/next build 2>&1 | grep -E "Error:|compiled"
```

Expected: `✓ Compiled successfully`

- [ ] **Step 3: Commit**

```bash
git add src/components/CutDetailsForm.tsx
git commit -m "feat: CutDetailsForm component with tappable chip selectors"
```

---

## Task 4: Update VisitRecordClient

**Files:**
- Modify: `src/app/(dashboard)/customers/[id]/visit/new/VisitRecordClient.tsx`

- [ ] **Step 1: Replace the entire file**

```typescript
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PhotoCapture } from '@/components/PhotoCapture';
import { CutDetailsForm, CutDetails, EMPTY_CUT_DETAILS } from '@/components/CutDetailsForm';

interface Props {
  customer: { id: string; name: string | null; phone: string; smsOptIn: string };
}

type OptIn = 'yes' | 'no' | 'not_asked';

const optInOptions: { value: OptIn; label: string }[] = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'not_asked', label: "Didn't ask" },
];

const sectionLabel: React.CSSProperties = {
  display: 'block', fontSize: '0.7rem', fontWeight: 700,
  textTransform: 'uppercase', letterSpacing: '0.1em',
  color: 'rgba(255,255,255,0.4)', marginBottom: '0.625rem',
  fontFamily: 'var(--font-barlow, sans-serif)',
};

const card: React.CSSProperties = {
  background: '#111', border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 8, padding: '1.25rem', marginBottom: '1rem',
};

export function VisitRecordClient({ customer }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<'details' | 'photos'>('details');
  const [visitId, setVisitId] = useState<string | null>(null);
  const [cutDetails, setCutDetails] = useState<CutDetails>(EMPTY_CUT_DETAILS);
  const [recommendation, setRecommendation] = useState('');
  const [notes, setNotes] = useState('');
  const [smsOptIn, setSmsOptIn] = useState<OptIn>(customer.smsOptIn as OptIn);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    setSaving(true);
    setError('');
    const res = await fetch(`/api/customers/${customer.id}/visits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes, smsOptIn, cutDetails, recommendation }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError('Failed to save. Try again.');
      setSaving(false);
      return;
    }
    setVisitId(data.id);
    setStep('photos');
    setSaving(false);
  }

  if (step === 'photos') {
    return <PhotoCapture visitId={visitId!} onDone={() => router.push(`/customers/${customer.id}`)} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {/* Cut Details */}
      <div style={card}>
        <span style={{ ...sectionLabel, color: '#C8F135', opacity: 0.8 }}>The cut</span>
        <CutDetailsForm value={cutDetails} onChange={setCutDetails} />
      </div>

      {/* Recommendation to client */}
      <div style={card}>
        <label style={sectionLabel}>Recommendation to client</label>
        <textarea
          rows={2}
          placeholder="e.g. Book in 4 weeks, try using clay on top…"
          value={recommendation}
          onChange={e => setRecommendation(e.target.value)}
          style={{
            width: '100%', background: '#0A0A0A',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4,
            padding: '0.625rem 0.875rem', color: 'white', fontSize: '0.875rem',
            resize: 'vertical', outline: 'none', lineHeight: 1.6,
            fontFamily: 'var(--font-inter, sans-serif)',
          }}
        />
      </div>

      {/* Barber notes (freeform) */}
      <div style={card}>
        <label style={sectionLabel}>Internal notes (barber only)</label>
        <textarea
          rows={3}
          placeholder="Anything else to remember about this cut…"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          style={{
            width: '100%', background: '#0A0A0A',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4,
            padding: '0.625rem 0.875rem', color: 'white', fontSize: '0.875rem',
            resize: 'vertical', outline: 'none', lineHeight: 1.6,
            fontFamily: 'var(--font-inter, sans-serif)',
          }}
        />
      </div>

      {/* SMS opt-in */}
      <div style={card}>
        <label style={sectionLabel}>Send SMS reminder in 6 weeks?</label>
        <div style={{ display: 'flex', gap: 8 }}>
          {optInOptions.map(opt => {
            const active = smsOptIn === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSmsOptIn(opt.value)}
                style={{
                  flex: 1, padding: '0.625rem 0.5rem',
                  borderRadius: 4, fontSize: '0.8rem', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  cursor: 'pointer', transition: 'all 0.15s',
                  fontFamily: 'var(--font-barlow, sans-serif)',
                  border: active ? 'none' : '1px solid rgba(255,255,255,0.12)',
                  background: active ? '#C8F135' : '#141414',
                  color: active ? '#0A0A0A' : 'rgba(255,255,255,0.45)',
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {error && <p style={{ color: '#f87171', fontSize: '0.875rem' }}>{error}</p>}

      <button
        onClick={handleSave}
        disabled={saving}
        className="btn-lime"
        style={{ padding: '0.875rem', borderRadius: 4, fontSize: '1rem', border: 'none', width: '100%' }}
      >
        {saving ? 'Saving…' : 'Save & add photos'}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Build check**

```bash
node_modules/.bin/next build 2>&1 | grep -E "Error:|compiled"
```

Expected: `✓ Compiled successfully`

- [ ] **Step 3: Manual smoke test**

Start dev server: `node_modules/.bin/next dev`  
Go to `http://localhost:3001/login` → login as `owner@benjbarbers.com` / `owner123`  
Go to Customers → Test Customer → Record visit  
Verify: chip sections appear for Style, Sides grade, Top length, Beard, Products, Techniques  
Select "Skin Fade" + "1.5" sides + "Pomade" → click "Save & add photos"  
Check in Neon DB or via API: `GET /api/customers/[id]/visits` should return visit with `cutDetails` populated.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(dashboard\)/customers/
git commit -m "feat: visit recording with tappable cut detail chips"
```

---

## Task 5: Update Customer Portal API + Display

**Files:**
- Modify: `src/app/api/customer/me/route.ts`
- Modify: `src/app/customer/page.tsx`

- [ ] **Step 1: Update /api/customer/me to include cutDetails + recommendation**

Replace the `visits` select in `src/app/api/customer/me/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCustomerSession } from '@/lib/customerAuth';

export async function GET() {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const customer = await db.customer.findUnique({
    where: { id: session.customerId },
    select: {
      id: true,
      name: true,
      phone: true,
      accessCode: true,
      lastVisitAt: true,
      shop: { select: { name: true, address: true } },
      visits: {
        orderBy: { visitedAt: 'desc' },
        take: 10,
        select: {
          id: true,
          visitedAt: true,
          notes: true,
          cutDetails: true,
          recommendation: true,
          barber: { select: { name: true } },
          photos: { select: { id: true, url: true, angle: true } },
        },
      },
    },
  });

  if (!customer) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(customer);
}
```

- [ ] **Step 2: Update customer/page.tsx — extend types and VisitCard**

Replace the full contents of `src/app/customer/page.tsx`:

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Scissors, Clock, MapPin, ChevronDown, ChevronUp, Star } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.4, delay: i * 0.08, ease: 'easeOut' as const },
  }),
};

type CutDetails = {
  style: string[];
  sidesGrade: string;
  topLength: string;
  beard: string;
  products: string[];
  techniques: string[];
};

type Visit = {
  id: string;
  visitedAt: string;
  notes: string | null;
  cutDetails: CutDetails | null;
  recommendation: string | null;
  barber: { name: string };
  photos: { id: string; url: string; angle: string }[];
};

type CustomerData = {
  id: string;
  name: string | null;
  accessCode: string | null;
  lastVisitAt: string | null;
  shop: { name: string; address: string | null };
  visits: Visit[];
};

function timeAgo(date: string) {
  const days = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 14) return '1 week ago';
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 60) return '1 month ago';
  return `${Math.floor(days / 30)} months ago`;
}

function Chip({ label }: { label: string }) {
  return (
    <span style={{
      display: 'inline-block',
      background: 'rgba(200,241,53,0.12)',
      color: '#C8F135',
      border: '1px solid rgba(200,241,53,0.25)',
      borderRadius: 4,
      padding: '0.2rem 0.55rem',
      fontSize: '0.7rem',
      fontWeight: 700,
      fontFamily: 'var(--font-barlow, sans-serif)',
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      marginRight: 4,
      marginBottom: 4,
    }}>
      {label}
    </span>
  );
}

function CutSummary({ cut }: { cut: CutDetails }) {
  const allChips = [
    ...cut.style,
    cut.sidesGrade ? `Sides: ${cut.sidesGrade}` : null,
    cut.topLength ? `Top: ${cut.topLength}` : null,
    cut.beard && cut.beard !== 'Not done' ? `Beard: ${cut.beard}` : null,
    ...cut.products.filter(p => p !== 'None').map(p => p),
    ...cut.techniques,
  ].filter(Boolean) as string[];

  if (allChips.length === 0) return null;
  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <div style={{ marginBottom: '0.35rem', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-barlow, sans-serif)' }}>Your cut</div>
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        {allChips.map(chip => <Chip key={chip} label={chip} />)}
      </div>
    </div>
  );
}

function VisitCard({ visit, index }: { visit: Visit; index: number }) {
  const [expanded, setExpanded] = useState(index === 0);
  const angleLabel: Record<string, string> = {
    front: 'Front', back: 'Back', left: 'Left side', right: 'Right side',
  };

  return (
    <motion.div
      initial="hidden" animate="visible" custom={index + 2} variants={fadeUp}
      className="bg-[#111] border border-white/8 rounded-lg overflow-hidden"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/3 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#C8F135]/10 flex items-center justify-center flex-shrink-0">
            <Scissors size={13} className="text-[#C8F135]" />
          </div>
          <div className="text-left">
            <div className="text-white text-sm font-['Inter'] font-medium">
              Cut by {visit.barber.name}
            </div>
            <div className="text-white/35 text-xs font-['Inter']">
              {timeAgo(visit.visitedAt)} · {new Date(visit.visitedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          </div>
        </div>
        {expanded
          ? <ChevronUp size={16} className="text-white/30" />
          : <ChevronDown size={16} className="text-white/30" />}
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-white/5">
          {/* Recommendation */}
          {visit.recommendation && (
            <div style={{
              background: 'rgba(200,241,53,0.07)',
              border: '1px solid rgba(200,241,53,0.2)',
              borderRadius: 6,
              padding: '0.75rem 1rem',
              marginTop: '1rem',
              marginBottom: '0.875rem',
              display: 'flex',
              gap: '0.625rem',
              alignItems: 'flex-start',
            }}>
              <Star size={13} style={{ color: '#C8F135', marginTop: 2, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(200,241,53,0.7)', marginBottom: 3, fontFamily: 'var(--font-barlow, sans-serif)' }}>Barber says</div>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem', fontFamily: 'var(--font-inter, sans-serif)', lineHeight: 1.5 }}>{visit.recommendation}</p>
              </div>
            </div>
          )}

          {/* Cut chips */}
          {visit.cutDetails && <CutSummary cut={visit.cutDetails} />}

          {/* Photos */}
          {visit.photos.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mt-3 mb-3">
              {visit.photos.map((photo) => (
                <div key={photo.id} className="relative aspect-square rounded overflow-hidden bg-[#0A0A0A]">
                  <img src={photo.url} alt={angleLabel[photo.angle] ?? photo.angle} className="w-full h-full object-cover" />
                  <span className="absolute bottom-1.5 left-1.5 text-[10px] font-['Barlow_Condensed'] font-bold uppercase tracking-wide bg-black/60 text-white/80 px-1.5 py-0.5 rounded-sm">
                    {angleLabel[photo.angle] ?? photo.angle}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Internal notes (barber-facing text) */}
          {visit.notes && (
            <div className="bg-[#0A0A0A] rounded px-4 py-3 mt-2">
              <div className="text-white/30 text-[10px] font-['Barlow_Condensed'] font-bold uppercase tracking-widest mb-1.5">Notes</div>
              <p className="text-white/60 text-sm font-['Inter'] leading-relaxed">{visit.notes}</p>
            </div>
          )}

          {!visit.recommendation && !visit.cutDetails && !visit.photos.length && !visit.notes && (
            <p className="text-white/25 text-sm font-['Inter'] mt-4">No details recorded for this visit.</p>
          )}
        </div>
      )}
    </motion.div>
  );
}

export default function CustomerPortal() {
  const router = useRouter();
  const [data, setData] = useState<CustomerData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/customer/me')
      .then((r) => {
        if (r.status === 401) { router.push('/customer/login'); return null; }
        return r.json();
      })
      .then((d) => { if (d) setData(d); })
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-white/30 font-['Inter'] text-sm">Loading…</div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <div className="border-b border-white/8 bg-[#0f0f0f]">
        <div className="max-w-lg mx-auto px-5 py-4 flex items-center justify-between">
          <span className="font-['Barlow_Condensed'] font-black text-xl uppercase tracking-tight text-white">
            Your<span className="text-[#C8F135]">Barber</span>
          </span>
          {data.accessCode && (
            <span className="badge-lime">Code: {data.accessCode}</span>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 py-6 space-y-4">
        {/* Welcome card */}
        <motion.div
          initial="hidden" animate="visible" custom={0} variants={fadeUp}
          className="bg-[#111] border border-white/8 rounded-lg p-5"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-[#C8F135]/10 flex items-center justify-center flex-shrink-0">
              <span className="text-[#C8F135] font-['Barlow_Condensed'] font-black text-lg">
                {data.name ? data.name.split(' ').map((n) => n[0]).join('').slice(0, 2) : '?'}
              </span>
            </div>
            <div>
              <h2 className="font-['Barlow_Condensed'] font-black text-2xl uppercase text-white leading-none">
                {data.name ?? 'Hey there'}
              </h2>
              <div className="flex items-center gap-1.5 mt-1.5">
                <Scissors size={11} className="text-[#C8F135]/60" />
                <span className="text-white/50 text-xs font-['Inter']">{data.shop.name}</span>
              </div>
              {data.shop.address && (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <MapPin size={11} className="text-white/25" />
                  <span className="text-white/30 text-xs font-['Inter']">{data.shop.address}</span>
                </div>
              )}
            </div>
          </div>
          {data.lastVisitAt && (
            <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2">
              <Clock size={12} className="text-white/25" />
              <span className="text-white/40 text-xs font-['Inter']">Last cut: {timeAgo(data.lastVisitAt)}</span>
            </div>
          )}
        </motion.div>

        <motion.div initial="hidden" animate="visible" custom={1} variants={fadeUp}>
          <h3 className="font-['Barlow_Condensed'] font-bold text-sm uppercase tracking-widest text-white/35 mb-3">
            Your cuts
          </h3>
        </motion.div>

        {data.visits.length === 0 ? (
          <motion.div
            initial="hidden" animate="visible" custom={2} variants={fadeUp}
            className="bg-[#111] border border-white/8 rounded-lg px-5 py-10 text-center"
          >
            <p className="text-white/25 font-['Inter'] text-sm">No visits recorded yet.</p>
          </motion.div>
        ) : (
          data.visits.map((visit, i) => (
            <VisitCard key={visit.id} visit={visit} index={i} />
          ))
        )}
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

- [ ] **Step 4: End-to-end smoke test**

1. Dev server running on port 3001
2. Login as owner, go to Test Customer → Record visit
3. Select chips: "Skin Fade", sides "1.5", products "Pomade", recommendation "Book in 4 weeks!"
4. Save & skip photos
5. Go to `http://localhost:3001/customer/login`, enter `TEST1`
6. Verify: recommendation appears in lime card labelled "Barber says"
7. Verify: cut chips appear (Skin Fade, Sides: 1.5, Pomade)

- [ ] **Step 5: Commit**

```bash
git add src/app/api/customer/ src/app/customer/
git commit -m "feat: customer portal shows cut chips and barber recommendation"
```
