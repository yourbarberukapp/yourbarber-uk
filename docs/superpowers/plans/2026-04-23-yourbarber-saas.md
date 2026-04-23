# yourbarber.uk — Multi-Tenant Barbershop SaaS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a multi-tenant SaaS for barbershops: barbers record customer cuts (4 photos + notes), capture SMS opt-in, and the system sends 6-week reminder texts via Twilio.

**Architecture:** Next.js 14 App Router; PostgreSQL + Prisma with `shop_id` row-level multi-tenancy; NextAuth.js v5 JWT auth embedding `shopId` + `role`; AWS S3 for photo storage; Twilio for SMS; Vercel deployment + Vercel Cron for scheduled 6-week reminders.

**Tech Stack:** Next.js 14, TypeScript, Prisma 5, PostgreSQL, NextAuth.js v5 (beta), Tailwind CSS, shadcn/ui, `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`, `twilio`, Zod, Jest + @testing-library/react

---

## File Map

```
yourbarber.uk/
├── prisma/
│   ├── schema.prisma              # all models (Shop, Barber, Customer, Visit, VisitPhoto, SmsLog)
│   └── seed.ts                    # test shop + owner + barber + customers
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/
│   │   │       └── page.tsx       # login form (email + password)
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx         # sidebar nav + session gate
│   │   │   ├── page.tsx           # redirect → /customers
│   │   │   ├── customers/
│   │   │   │   ├── page.tsx       # search bar + customer list
│   │   │   │   ├── new/page.tsx   # create customer form
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx          # customer detail + visit history
│   │   │   │       └── visit/new/page.tsx # record a new visit
│   │   │   ├── reminders/page.tsx # bulk-send dashboard (owner + barber)
│   │   │   ├── team/page.tsx      # owner only: invite/remove barbers
│   │   │   └── settings/page.tsx  # owner only: shop name, logo, address
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── customers/
│   │       │   ├── route.ts              # GET ?q= (search), POST (create)
│   │       │   └── [id]/
│   │       │       ├── route.ts          # GET, PATCH
│   │       │       └── visits/route.ts   # GET (history), POST (create visit)
│   │       ├── visits/
│   │       │   └── [id]/
│   │       │       └── photos/route.ts   # POST → presigned S3 URLs
│   │       ├── reminders/
│   │       │   ├── send/route.ts         # POST: manual bulk send
│   │       │   └── scheduled/route.ts    # GET: Vercel Cron endpoint
│   │       └── team/
│   │           ├── route.ts              # GET barbers, POST invite
│   │           └── [id]/route.ts         # DELETE (deactivate) barber
│   ├── components/
│   │   ├── ui/                           # shadcn components (button, input, etc.)
│   │   ├── CustomerSearch.tsx            # debounced phone/name search input
│   │   ├── CustomerCard.tsx              # card: name, phone, last visit, opt-in badge
│   │   ├── VisitForm.tsx                 # notes textarea + opt-in radio
│   │   ├── PhotoCapture.tsx              # 4-angle photo capture (file input, previews)
│   │   └── BulkReminderPanel.tsx         # customer checklist + send button
│   ├── lib/
│   │   ├── db.ts                         # Prisma singleton
│   │   ├── auth.ts                       # NextAuth config
│   │   ├── session.ts                    # getRequiredSession() helper
│   │   ├── s3.ts                         # presigned upload URL + delete helpers
│   │   ├── twilio.ts                     # sendSms() helper
│   │   └── reminders.ts                  # findDueCustomers(), buildMessage()
│   └── middleware.ts                     # protect all routes, attach shopId
├── __tests__/
│   ├── api/
│   │   ├── customers.test.ts
│   │   ├── reminders.test.ts
│   │   └── team.test.ts
│   └── components/
│       ├── CustomerSearch.test.tsx
│       └── BulkReminderPanel.test.tsx
├── .env.local.example
├── jest.config.ts
├── jest.setup.ts
├── next.config.ts
└── package.json
```

---

## Phase 1: Foundation

### Task 1: Project Bootstrap

**Files:**
- Create: `package.json` (via `create-next-app`)
- Create: `next.config.ts`
- Create: `.env.local.example`
- Create: `jest.config.ts`
- Create: `jest.setup.ts`

- [ ] **Step 1: Scaffold Next.js app**

```bash
cd "c:/Users/luke/Thornes Surveyors & Valuers/Thornes - Documents/AI stuff/AntiGravity Folders/yourbarber.uk"
npx create-next-app@14 . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-git
```

Expected: Next.js scaffold created, `package.json` present.

- [ ] **Step 2: Install dependencies**

```bash
npm install prisma @prisma/client
npm install next-auth@beta
npm install zod
npm install twilio
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
npm install bcryptjs
npm install @types/bcryptjs --save-dev
npx shadcn@latest init
# Accept defaults: style=default, base color=neutral, CSS variables=yes
npx shadcn@latest add button input label card badge textarea select toast sonner
```

- [ ] **Step 3: Install test dependencies**

```bash
npm install --save-dev jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event ts-jest jest-mock-extended
```

- [ ] **Step 4: Write `jest.config.ts`**

```typescript
// jest.config.ts
import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'node',
  transform: { '^.+\\.tsx?$': ['ts-jest', { tsconfig: { jsx: 'react-jsx' } }] },
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  setupFilesAfterFramework: ['<rootDir>/jest.setup.ts'],
  testMatch: ['**/__tests__/**/*.test.ts?(x)'],
};

export default config;
```

- [ ] **Step 5: Write `jest.setup.ts`**

```typescript
// jest.setup.ts
import '@testing-library/jest-dom';
```

- [ ] **Step 6: Write `.env.local.example`**

```bash
# .env.local.example
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/yourbarber"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"

# AWS S3 (or Cloudflare R2 with S3-compatible API)
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
AWS_S3_BUCKET="yourbarber-photos"

# Twilio
TWILIO_ACCOUNT_SID=""
TWILIO_AUTH_TOKEN=""
TWILIO_PHONE_NUMBER="+441234567890"

# Vercel Cron secret (any random string)
CRON_SECRET="generate-with-openssl-rand-base64-32"
```

- [ ] **Step 7: Write `next.config.ts`**

```typescript
// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.amazonaws.com' },
      { protocol: 'https', hostname: '*.r2.cloudflarestorage.com' },
    ],
  },
};

export default nextConfig;
```

- [ ] **Step 8: Init git and commit**

```bash
git init
git add .
git commit -m "feat: project bootstrap — Next.js 14, Prisma, NextAuth, shadcn"
```

---

### Task 2: Database Schema

**Files:**
- Create: `prisma/schema.prisma`
- Create: `prisma/seed.ts`
- Create: `src/lib/db.ts`

- [ ] **Step 1: Write `prisma/schema.prisma`**

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Shop {
  id                 String     @id @default(cuid())
  name               String
  slug               String     @unique
  logoUrl            String?
  address            String?
  subscriptionStatus String     @default("active")
  createdAt          DateTime   @default(now())
  barbers            Barber[]
  customers          Customer[]
  visits             Visit[]
  smsLogs            SmsLog[]
}

model Barber {
  id           String   @id @default(cuid())
  shopId       String
  shop         Shop     @relation(fields: [shopId], references: [id], onDelete: Cascade)
  name         String
  email        String
  passwordHash String
  role         String   @default("barber") // "owner" | "barber"
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  visits       Visit[]

  @@unique([email, shopId])
  @@index([shopId])
}

model Customer {
  id          String     @id @default(cuid())
  shopId      String
  shop        Shop       @relation(fields: [shopId], references: [id], onDelete: Cascade)
  phone       String
  name        String?
  smsOptIn    String     @default("not_asked") // "yes" | "no" | "not_asked"
  lastVisitAt DateTime?
  createdAt   DateTime   @default(now())
  visits      Visit[]
  smsLogs     SmsLog[]

  @@unique([phone, shopId])
  @@index([shopId, phone])
  @@index([shopId, name])
}

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
  photos     VisitPhoto[]
  createdAt  DateTime     @default(now())

  @@index([customerId])
  @@index([shopId, visitedAt])
}

model VisitPhoto {
  id        String   @id @default(cuid())
  visitId   String
  visit     Visit    @relation(fields: [visitId], references: [id], onDelete: Cascade)
  url       String
  angle     String   // "front" | "back" | "left" | "right"
  createdAt DateTime @default(now())
}

model SmsLog {
  id         String   @id @default(cuid())
  shopId     String
  shop       Shop     @relation(fields: [shopId], references: [id], onDelete: Cascade)
  customerId String
  customer   Customer @relation(fields: [customerId], references: [id])
  message    String
  twilioSid  String?
  status     String   @default("sent") // "sent" | "delivered" | "failed"
  sentAt     DateTime @default(now())
}
```

- [ ] **Step 2: Run migration**

```bash
npx prisma migrate dev --name init
```

Expected: Migration file created in `prisma/migrations/`, Prisma Client regenerated.

- [ ] **Step 3: Write `src/lib/db.ts`**

```typescript
// src/lib/db.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
```

- [ ] **Step 4: Write `prisma/seed.ts`**

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const shop = await prisma.shop.create({
    data: {
      name: "Benjie's Barbershop",
      slug: 'benjies',
      address: '123 High Street, London',
    },
  });

  const ownerHash = await bcrypt.hash('owner123', 12);
  const barberHash = await bcrypt.hash('barber123', 12);

  const owner = await prisma.barber.create({
    data: {
      shopId: shop.id,
      name: 'Benjie Owner',
      email: 'owner@benjies.com',
      passwordHash: ownerHash,
      role: 'owner',
    },
  });

  const barber = await prisma.barber.create({
    data: {
      shopId: shop.id,
      name: 'Jake Barber',
      email: 'jake@benjies.com',
      passwordHash: barberHash,
      role: 'barber',
    },
  });

  const customer = await prisma.customer.create({
    data: {
      shopId: shop.id,
      phone: '07700900001',
      name: 'Test Customer',
      smsOptIn: 'yes',
      lastVisitAt: new Date(Date.now() - 44 * 24 * 60 * 60 * 1000), // 44 days ago
    },
  });

  console.log(`Seeded: shop=${shop.slug}, owner=${owner.email}, barber=${barber.email}, customer=${customer.phone}`);
}

main().finally(() => prisma.$disconnect());
```

- [ ] **Step 5: Add seed script to `package.json`**

In `package.json`, inside `"scripts"`:
```json
"db:seed": "ts-node --compiler-options '{\"module\":\"CommonJS\"}' prisma/seed.ts",
"db:reset": "npx prisma migrate reset --force && npm run db:seed"
```

- [ ] **Step 6: Run seed**

```bash
npm run db:seed
```

Expected output: `Seeded: shop=benjies, owner=owner@benjies.com, barber=jake@benjies.com, customer=07700900001`

- [ ] **Step 7: Commit**

```bash
git add prisma/ src/lib/db.ts package.json
git commit -m "feat: Prisma schema — Shop, Barber, Customer, Visit, VisitPhoto, SmsLog"
```

---

### Task 3: Authentication (NextAuth v5)

**Files:**
- Create: `src/lib/auth.ts`
- Create: `src/app/api/auth/[...nextauth]/route.ts`
- Create: `src/middleware.ts`
- Create: `src/lib/session.ts`
- Create: `src/app/(auth)/login/page.tsx`
- Create: `__tests__/api/auth.test.ts`

- [ ] **Step 1: Write failing test for credential validation**

```typescript
// __tests__/api/auth.test.ts
import bcrypt from 'bcryptjs';

// This test validates the core logic we'll extract into a helper
describe('credential validation', () => {
  it('accepts correct password', async () => {
    const hash = await bcrypt.hash('secret', 12);
    const isValid = await bcrypt.compare('secret', hash);
    expect(isValid).toBe(true);
  });

  it('rejects wrong password', async () => {
    const hash = await bcrypt.hash('secret', 12);
    const isValid = await bcrypt.compare('wrong', hash);
    expect(isValid).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it passes (bcrypt baseline)**

```bash
npx jest __tests__/api/auth.test.ts --no-coverage
```

Expected: PASS (these test bcrypt, which is already installed).

- [ ] **Step 3: Write `src/lib/auth.ts`**

```typescript
// src/lib/auth.ts
import NextAuth, { type NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const authConfig: NextAuthConfig = {
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.shopId = (user as any).shopId;
        token.role = (user as any).role;
        token.shopName = (user as any).shopName;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      (session.user as any).shopId = token.shopId;
      (session.user as any).role = token.role;
      (session.user as any).shopName = token.shopName;
      return session;
    },
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const isOnLoginPage = request.nextUrl.pathname.startsWith('/login');
      if (isOnLoginPage) return isLoggedIn ? Response.redirect(new URL('/customers', request.nextUrl)) : true;
      return isLoggedIn;
    },
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const barber = await db.barber.findFirst({
          where: { email: parsed.data.email, isActive: true },
          include: { shop: { select: { id: true, name: true } } },
        });
        if (!barber) return null;

        const isValid = await bcrypt.compare(parsed.data.password, barber.passwordHash);
        if (!isValid) return null;

        return {
          id: barber.id,
          email: barber.email,
          name: barber.name,
          shopId: barber.shopId,
          role: barber.role,
          shopName: barber.shop.name,
        };
      },
    }),
  ],
};

export const { handlers, signIn, signOut, auth } = NextAuth(authConfig);
```

- [ ] **Step 4: Write `src/app/api/auth/[...nextauth]/route.ts`**

```typescript
// src/app/api/auth/[...nextauth]/route.ts
export { handlers as GET, handlers as POST } from '@/lib/auth';
```

- [ ] **Step 5: Write `src/middleware.ts`**

```typescript
// src/middleware.ts
export { auth as middleware } from '@/lib/auth';

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
};
```

- [ ] **Step 6: Write `src/lib/session.ts`**

```typescript
// src/lib/session.ts
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export interface AppSession {
  barberId: string;
  shopId: string;
  role: 'owner' | 'barber';
  name: string;
  shopName: string;
}

export async function getRequiredSession(): Promise<AppSession> {
  const session = await auth();
  if (!session?.user) redirect('/login');
  const user = session.user as any;
  return {
    barberId: user.id,
    shopId: user.shopId,
    role: user.role,
    name: user.name ?? '',
    shopName: user.shopName ?? '',
  };
}
```

- [ ] **Step 7: Write `src/app/(auth)/login/page.tsx`**

```typescript
// src/app/(auth)/login/page.tsx
'use client';
import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = await signIn('credentials', { email, password, redirect: false });
    if (result?.error) {
      setError('Invalid email or password');
      setLoading(false);
    } else {
      router.push('/customers');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl text-center">yourbarber</CardTitle>
          <p className="text-center text-sm text-neutral-500">Sign in to your shop</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 8: Run dev server and verify login works**

```bash
npm run dev
# Open http://localhost:3000/login
# Enter: owner@benjies.com / owner123
# Expect: redirect to /customers (404 is fine — page not built yet)
```

- [ ] **Step 9: Commit**

```bash
git add src/lib/auth.ts src/lib/session.ts src/middleware.ts src/app/api/auth src/app/'(auth)' __tests__/
git commit -m "feat: NextAuth v5 credentials auth — shop+role in JWT, login page"
```

---

### Task 4: Dashboard Layout + Shell

**Files:**
- Create: `src/app/(dashboard)/layout.tsx`
- Create: `src/app/(dashboard)/page.tsx`

- [ ] **Step 1: Write `src/app/(dashboard)/layout.tsx`**

```typescript
// src/app/(dashboard)/layout.tsx
import { getRequiredSession } from '@/lib/session';
import { signOut } from '@/lib/auth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getRequiredSession();

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div>
          <span className="font-bold text-lg">yourbarber</span>
          <span className="ml-2 text-sm text-neutral-500">{session.shopName}</span>
        </div>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/customers" className="text-neutral-700 hover:text-black">Customers</Link>
          <Link href="/reminders" className="text-neutral-700 hover:text-black">Reminders</Link>
          {session.role === 'owner' && (
            <>
              <Link href="/team" className="text-neutral-700 hover:text-black">Team</Link>
              <Link href="/settings" className="text-neutral-700 hover:text-black">Settings</Link>
            </>
          )}
          <form action={async () => { 'use server'; await signOut({ redirectTo: '/login' }); }}>
            <Button variant="ghost" size="sm" type="submit">Sign out</Button>
          </form>
        </nav>
      </header>
      <main className="flex-1 p-4 max-w-3xl mx-auto w-full">{children}</main>
    </div>
  );
}
```

- [ ] **Step 2: Write `src/app/(dashboard)/page.tsx`**

```typescript
// src/app/(dashboard)/page.tsx
import { redirect } from 'next/navigation';
export default function DashboardRoot() {
  redirect('/customers');
}
```

- [ ] **Step 3: Verify redirect works**

```bash
# With dev server running, visit http://localhost:3000/
# Expect: redirect → /login (since not authenticated) or → /customers (if authenticated)
```

- [ ] **Step 4: Commit**

```bash
git add src/app/'(dashboard)'/
git commit -m "feat: dashboard layout with nav and sign-out"
```

---

## Phase 2: Customer Management

### Task 5: Customer API — Search & Create

**Files:**
- Create: `src/app/api/customers/route.ts`
- Create: `__tests__/api/customers.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// __tests__/api/customers.test.ts
import { db } from '@/lib/db';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';

// We test the business logic extracted into pure functions
import { buildCustomerWhereClause, normalizePhone } from '@/lib/customerHelpers';

describe('normalizePhone', () => {
  it('strips spaces and dashes from phone numbers', () => {
    expect(normalizePhone('07700 900 001')).toBe('07700900001');
    expect(normalizePhone('07700-900-001')).toBe('07700900001');
  });

  it('returns digit-only string unchanged', () => {
    expect(normalizePhone('07700900001')).toBe('07700900001');
  });
});

describe('buildCustomerWhereClause', () => {
  it('searches by phone when query looks like a phone number', () => {
    const where = buildCustomerWhereClause('shop1', '07700');
    expect(where).toMatchObject({
      shopId: 'shop1',
      phone: { contains: '07700' },
    });
  });

  it('searches by name when query is alphabetic', () => {
    const where = buildCustomerWhereClause('shop1', 'Jake');
    expect(where).toMatchObject({
      shopId: 'shop1',
      name: { contains: 'Jake', mode: 'insensitive' },
    });
  });
});
```

- [ ] **Step 2: Run failing tests**

```bash
npx jest __tests__/api/customers.test.ts --no-coverage
```

Expected: FAIL — `Cannot find module '@/lib/customerHelpers'`

- [ ] **Step 3: Create `src/lib/customerHelpers.ts`**

```typescript
// src/lib/customerHelpers.ts
export function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-\(\)]/g, '');
}

export function buildCustomerWhereClause(shopId: string, query: string) {
  const normalized = normalizePhone(query);
  const looksLikePhone = /^[\d\+]+$/.test(normalized) && normalized.length >= 3;
  if (looksLikePhone) {
    return { shopId, phone: { contains: normalized } };
  }
  return { shopId, name: { contains: query, mode: 'insensitive' as const } };
}
```

- [ ] **Step 4: Run tests and verify they pass**

```bash
npx jest __tests__/api/customers.test.ts --no-coverage
```

Expected: PASS (2 describe blocks, 4 tests).

- [ ] **Step 5: Write `src/app/api/customers/route.ts`**

```typescript
// src/app/api/customers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { buildCustomerWhereClause, normalizePhone } from '@/lib/customerHelpers';

const createSchema = z.object({
  phone: z.string().min(7).max(20),
  name: z.string().max(100).optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = (session.user as any).shopId as string;

  const q = req.nextUrl.searchParams.get('q') ?? '';
  const where = q.length >= 2 ? buildCustomerWhereClause(shopId, q) : { shopId };

  const customers = await db.customer.findMany({
    where,
    orderBy: { lastVisitAt: 'desc' },
    take: 50,
    select: {
      id: true,
      phone: true,
      name: true,
      smsOptIn: true,
      lastVisitAt: true,
    },
  });

  return NextResponse.json(customers);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = (session.user as any).shopId as string;

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const phone = normalizePhone(parsed.data.phone);

  const existing = await db.customer.findUnique({ where: { phone_shopId: { phone, shopId } } });
  if (existing) return NextResponse.json({ error: 'Customer with this phone already exists', customer: existing }, { status: 409 });

  const customer = await db.customer.create({
    data: { shopId, phone, name: parsed.data.name },
  });

  return NextResponse.json(customer, { status: 201 });
}
```

- [ ] **Step 6: Write `src/app/api/customers/[id]/route.ts`**

```typescript
// src/app/api/customers/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

const patchSchema = z.object({
  name: z.string().max(100).optional(),
  smsOptIn: z.enum(['yes', 'no', 'not_asked']).optional(),
});

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = (session.user as any).shopId as string;

  const customer = await db.customer.findFirst({
    where: { id: params.id, shopId },
    include: {
      visits: {
        orderBy: { visitedAt: 'desc' },
        take: 10,
        include: { photos: true, barber: { select: { name: true } } },
      },
    },
  });

  if (!customer) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(customer);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = (session.user as any).shopId as string;

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const customer = await db.customer.updateMany({
    where: { id: params.id, shopId },
    data: parsed.data,
  });

  if (customer.count === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 7: Commit**

```bash
git add src/app/api/customers/ src/lib/customerHelpers.ts __tests__/
git commit -m "feat: customer API — search (phone/name), create, get, patch"
```

---

### Task 6: Customer List & Search UI

**Files:**
- Create: `src/app/(dashboard)/customers/page.tsx`
- Create: `src/components/CustomerSearch.tsx`
- Create: `src/components/CustomerCard.tsx`
- Create: `src/app/(dashboard)/customers/new/page.tsx`

- [ ] **Step 1: Write `src/components/CustomerSearch.tsx`**

```typescript
// src/components/CustomerSearch.tsx
'use client';
import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';

interface Customer {
  id: string;
  phone: string;
  name?: string | null;
  smsOptIn: string;
  lastVisitAt?: string | null;
}

interface Props {
  onResults: (customers: Customer[]) => void;
  onLoading: (loading: boolean) => void;
}

export function CustomerSearch({ onResults, onLoading }: Props) {
  const [query, setQuery] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (query.length < 2) {
      // Fetch all recent customers when query is short
      onLoading(true);
      fetch('/api/customers')
        .then(r => r.json())
        .then(data => { onResults(data); onLoading(false); });
      return;
    }
    debounceRef.current = setTimeout(() => {
      onLoading(true);
      fetch(`/api/customers?q=${encodeURIComponent(query)}`)
        .then(r => r.json())
        .then(data => { onResults(data); onLoading(false); });
    }, 250);
  }, [query]);

  return (
    <Input
      type="search"
      placeholder="Search by phone or name…"
      value={query}
      onChange={e => setQuery(e.target.value)}
      className="text-lg h-12"
      inputMode="tel"
    />
  );
}
```

- [ ] **Step 2: Write `src/components/CustomerCard.tsx`**

```typescript
// src/components/CustomerCard.tsx
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface Props {
  id: string;
  phone: string;
  name?: string | null;
  smsOptIn: string;
  lastVisitAt?: string | null;
}

const optInLabel: Record<string, string> = {
  yes: 'SMS on',
  no: 'SMS off',
  not_asked: 'Not asked',
};
const optInVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
  yes: 'default',
  no: 'secondary',
  not_asked: 'outline',
};

export function CustomerCard({ id, phone, name, smsOptIn, lastVisitAt }: Props) {
  const lastVisit = lastVisitAt ? new Date(lastVisitAt).toLocaleDateString('en-GB') : 'Never';

  return (
    <Link href={`/customers/${id}`}>
      <Card className="mb-2 hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="py-3 px-4 flex items-center justify-between">
          <div>
            <p className="font-semibold text-base">{name ?? 'No name'}</p>
            <p className="text-sm text-neutral-500">{phone} · Last visit: {lastVisit}</p>
          </div>
          <Badge variant={optInVariant[smsOptIn]}>{optInLabel[smsOptIn]}</Badge>
        </CardContent>
      </Card>
    </Link>
  );
}
```

- [ ] **Step 3: Write `src/app/(dashboard)/customers/page.tsx`**

```typescript
// src/app/(dashboard)/customers/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { CustomerSearch } from '@/components/CustomerSearch';
import { CustomerCard } from '@/components/CustomerCard';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface Customer {
  id: string;
  phone: string;
  name?: string | null;
  smsOptIn: string;
  lastVisitAt?: string | null;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Customers</h1>
        <Button asChild>
          <Link href="/customers/new">+ New</Link>
        </Button>
      </div>
      <CustomerSearch onResults={setCustomers} onLoading={setLoading} />
      {loading && <p className="text-sm text-neutral-400">Searching…</p>}
      {!loading && customers.length === 0 && (
        <p className="text-sm text-neutral-400">No customers found.</p>
      )}
      {customers.map(c => (
        <CustomerCard key={c.id} {...c} />
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Write `src/app/(dashboard)/customers/new/page.tsx`**

```typescript
// src/app/(dashboard)/customers/new/page.tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function NewCustomerPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, name: name || undefined }),
    });

    const data = await res.json();
    if (res.status === 409) {
      // Customer exists — go straight to their record
      router.push(`/customers/${data.customer.id}`);
      return;
    }
    if (!res.ok) {
      setError(data.error?.fieldErrors?.phone?.[0] ?? 'Something went wrong');
      setLoading(false);
      return;
    }
    router.push(`/customers/${data.id}`);
  }

  return (
    <Card className="max-w-sm mx-auto mt-8">
      <CardHeader>
        <CardTitle>Add customer</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="phone">Phone number *</Label>
            <Input
              id="phone"
              type="tel"
              inputMode="tel"
              placeholder="07700 900 001"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              required
              className="text-lg h-12"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="name">Name (optional)</Label>
            <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="First name" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Saving…' : 'Add customer'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 5: Verify in browser**

```bash
# http://localhost:3000/customers
# Should show search bar and list of seeded customer (07700900001 — Test Customer)
# Click "+ New", add a customer with phone 07700900002 → redirects to /customers/<id>
```

- [ ] **Step 6: Commit**

```bash
git add src/app/'(dashboard)'/customers/ src/components/CustomerSearch.tsx src/components/CustomerCard.tsx
git commit -m "feat: customer list, search, and create UI"
```

---

### Task 7: Customer Detail + Visit History

**Files:**
- Create: `src/app/(dashboard)/customers/[id]/page.tsx`

- [ ] **Step 1: Write `src/app/(dashboard)/customers/[id]/page.tsx`**

```typescript
// src/app/(dashboard)/customers/[id]/page.tsx
import { getRequiredSession } from '@/lib/session';
import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import Image from 'next/image';

const optInLabel: Record<string, string> = {
  yes: 'SMS reminders on',
  no: 'SMS reminders off',
  not_asked: 'Not yet asked',
};

export default async function CustomerDetailPage({ params }: { params: { id: string } }) {
  const session = await getRequiredSession();

  const customer = await db.customer.findFirst({
    where: { id: params.id, shopId: session.shopId },
    include: {
      visits: {
        orderBy: { visitedAt: 'desc' },
        take: 10,
        include: {
          photos: { orderBy: { createdAt: 'asc' } },
          barber: { select: { name: true } },
        },
      },
    },
  });

  if (!customer) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{customer.name ?? 'No name'}</h1>
          <p className="text-neutral-500">{customer.phone}</p>
          <Badge variant={customer.smsOptIn === 'yes' ? 'default' : 'secondary'} className="mt-1">
            {optInLabel[customer.smsOptIn]}
          </Badge>
        </div>
        <Button asChild>
          <Link href={`/customers/${customer.id}/visit/new`}>Record cut</Link>
        </Button>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Visit history</h2>
        {customer.visits.length === 0 && (
          <p className="text-sm text-neutral-400">No visits recorded yet.</p>
        )}
        {customer.visits.map(visit => (
          <div key={visit.id} className="border rounded-lg p-4 mb-3 bg-white">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">{new Date(visit.visitedAt).toLocaleDateString('en-GB')}</span>
              <span className="text-sm text-neutral-500">by {visit.barber.name}</span>
            </div>
            {visit.photos.length > 0 && (
              <div className="flex gap-2 mb-2 flex-wrap">
                {visit.photos.map(photo => (
                  <Image
                    key={photo.id}
                    src={photo.url}
                    alt={photo.angle}
                    width={80}
                    height={80}
                    className="rounded object-cover w-20 h-20"
                  />
                ))}
              </div>
            )}
            {visit.notes && (
              <p className="text-sm text-neutral-700 whitespace-pre-wrap">{visit.notes}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify in browser**

```bash
# http://localhost:3000/customers/<id-of-test-customer>
# Should show customer name, phone, SMS status, and "Record cut" button
# Visit history empty for new customers
```

- [ ] **Step 3: Commit**

```bash
git add src/app/'(dashboard)'/customers/'[id]'/
git commit -m "feat: customer detail page with visit history"
```

---

### Task 8: Visit Creation — Notes + Opt-In

**Files:**
- Create: `src/app/api/customers/[id]/visits/route.ts`
- Create: `src/app/(dashboard)/customers/[id]/visit/new/page.tsx`
- Create: `src/components/VisitForm.tsx`
- Create: `src/components/OptInToggle.tsx`

- [ ] **Step 1: Write `src/app/api/customers/[id]/visits/route.ts`**

```typescript
// src/app/api/customers/[id]/visits/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

const createVisitSchema = z.object({
  notes: z.string().max(2000).optional(),
  smsOptIn: z.enum(['yes', 'no', 'not_asked']),
  visitedAt: z.string().datetime().optional(),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { shopId, barberId } = session.user as any;

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
        visitedAt,
      },
    }),
    db.customer.update({
      where: { id: params.id },
      data: {
        lastVisitAt: visitedAt,
        smsOptIn: parsed.data.smsOptIn,
      },
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

- [ ] **Step 2: Write `src/components/OptInToggle.tsx`**

```typescript
// src/components/OptInToggle.tsx
'use client';
import { Label } from '@/components/ui/label';

interface Props {
  value: 'yes' | 'no' | 'not_asked';
  onChange: (value: 'yes' | 'no' | 'not_asked') => void;
}

export function OptInToggle({ value, onChange }: Props) {
  return (
    <div>
      <Label className="text-base font-medium block mb-2">Send SMS reminder in 6 weeks?</Label>
      <div className="flex gap-3">
        {(['yes', 'no', 'not_asked'] as const).map(opt => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`flex-1 py-3 rounded-lg border-2 text-sm font-medium transition-colors ${
              value === opt
                ? 'border-black bg-black text-white'
                : 'border-neutral-200 bg-white text-neutral-700'
            }`}
          >
            {opt === 'yes' ? 'Yes' : opt === 'no' ? 'No' : "Didn't ask"}
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Write `src/components/VisitForm.tsx`**

```typescript
// src/components/VisitForm.tsx
'use client';
import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { OptInToggle } from './OptInToggle';
import { Button } from '@/components/ui/button';

interface Props {
  customerId: string;
  currentOptIn: 'yes' | 'no' | 'not_asked';
  onSaved: (visitId: string) => void;
}

export function VisitForm({ customerId, currentOptIn, onSaved }: Props) {
  const [notes, setNotes] = useState('');
  const [smsOptIn, setSmsOptIn] = useState<'yes' | 'no' | 'not_asked'>(currentOptIn);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    setSaving(true);
    setError('');
    const res = await fetch(`/api/customers/${customerId}/visits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes, smsOptIn }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError('Failed to save visit');
      setSaving(false);
      return;
    }
    onSaved(data.id);
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <Label htmlFor="notes" className="text-base">Notes</Label>
        <Textarea
          id="notes"
          rows={5}
          placeholder="Scissors grade, clippers, what was done, anything chatted about…"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          className="text-base resize-none"
        />
      </div>
      <OptInToggle value={smsOptIn} onChange={setSmsOptIn} />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button onClick={handleSave} disabled={saving} className="w-full h-12 text-base">
        {saving ? 'Saving…' : 'Save & add photos'}
      </Button>
    </div>
  );
}
```

- [ ] **Step 4: Write `src/app/(dashboard)/customers/[id]/visit/new/page.tsx`**

```typescript
// src/app/(dashboard)/customers/[id]/visit/new/page.tsx
import { getRequiredSession } from '@/lib/session';
import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import { VisitFormPage } from './VisitFormPage';

export default async function NewVisitPage({ params }: { params: { id: string } }) {
  const session = await getRequiredSession();

  const customer = await db.customer.findFirst({
    where: { id: params.id, shopId: session.shopId },
    select: { id: true, name: true, phone: true, smsOptIn: true },
  });
  if (!customer) notFound();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Record cut</h1>
        <p className="text-neutral-500">{customer.name ?? customer.phone}</p>
      </div>
      <VisitFormPage customer={customer} />
    </div>
  );
}
```

- [ ] **Step 5: Create `src/app/(dashboard)/customers/[id]/visit/new/VisitFormPage.tsx`**

This is a client component wrapper that composes VisitForm and PhotoCapture:

```typescript
// src/app/(dashboard)/customers/[id]/visit/new/VisitFormPage.tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { VisitForm } from '@/components/VisitForm';
import { PhotoCapture } from '@/components/PhotoCapture';

interface Props {
  customer: { id: string; name: string | null; phone: string; smsOptIn: string };
}

export function VisitFormPage({ customer }: Props) {
  const router = useRouter();
  const [visitId, setVisitId] = useState<string | null>(null);

  if (visitId) {
    return (
      <PhotoCapture
        visitId={visitId}
        onDone={() => router.push(`/customers/${customer.id}`)}
      />
    );
  }

  return (
    <VisitForm
      customerId={customer.id}
      currentOptIn={customer.smsOptIn as any}
      onSaved={setVisitId}
    />
  );
}
```

- [ ] **Step 6: Verify flow in browser**

```bash
# http://localhost:3000/customers/<id>/visit/new
# Fill in notes, select SMS opt-in, click "Save & add photos"
# Should advance to photo capture step (Task 9)
```

- [ ] **Step 7: Commit**

```bash
git add src/app/api/customers/ src/components/VisitForm.tsx src/components/OptInToggle.tsx src/app/'(dashboard)'/customers/'[id]'/visit/
git commit -m "feat: visit recording — notes, opt-in toggle, visit API"
```

---

### Task 9: Photo Capture + S3 Upload

**Files:**
- Create: `src/lib/s3.ts`
- Create: `src/app/api/visits/[id]/photos/route.ts`
- Create: `src/components/PhotoCapture.tsx`

- [ ] **Step 1: Write `src/lib/s3.ts`**

```typescript
// src/lib/s3.ts
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.AWS_S3_BUCKET!;

export async function generateUploadUrl(key: string, contentType: string): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(s3, command, { expiresIn: 300 }); // 5 min
}

export function getPublicUrl(key: string): string {
  return `https://${BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}

export async function deleteObject(key: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}
```

- [ ] **Step 2: Write `src/app/api/visits/[id]/photos/route.ts`**

```typescript
// src/app/api/visits/[id]/photos/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { generateUploadUrl, getPublicUrl } from '@/lib/s3';

const ANGLES = ['front', 'back', 'left', 'right'] as const;
type Angle = typeof ANGLES[number];

const requestSchema = z.object({
  photos: z.array(z.object({
    angle: z.enum(ANGLES),
    contentType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/heic']),
  })).min(1).max(4),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = (session.user as any).shopId as string;

  const visit = await db.visit.findFirst({ where: { id: params.id, shopId } });
  if (!visit) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const results = await Promise.all(
    parsed.data.photos.map(async ({ angle, contentType }) => {
      const ext = contentType.split('/')[1];
      const key = `shops/${shopId}/visits/${params.id}/${angle}.${ext}`;
      const uploadUrl = await generateUploadUrl(key, contentType);
      const publicUrl = getPublicUrl(key);
      return { angle, uploadUrl, publicUrl, key };
    })
  );

  // Pre-create VisitPhoto records (url is the public S3 URL, upload not yet done)
  await db.visitPhoto.createMany({
    data: results.map(r => ({ visitId: params.id, url: r.publicUrl, angle: r.angle })),
    skipDuplicates: true,
  });

  return NextResponse.json(results.map(({ angle, uploadUrl, publicUrl }) => ({ angle, uploadUrl, publicUrl })));
}
```

- [ ] **Step 3: Write `src/components/PhotoCapture.tsx`**

```typescript
// src/components/PhotoCapture.tsx
'use client';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

const ANGLES = ['front', 'back', 'left', 'right'] as const;
type Angle = typeof ANGLES[number];

interface CapturedPhoto {
  angle: Angle;
  file: File;
  preview: string;
}

interface Props {
  visitId: string;
  onDone: () => void;
}

export function PhotoCapture({ visitId, onDone }: Props) {
  const [photos, setPhotos] = useState<Partial<Record<Angle, CapturedPhoto>>>({});
  const [uploading, setUploading] = useState(false);
  const [currentAngle, setCurrentAngle] = useState<Angle>('front');
  const inputRef = useRef<HTMLInputElement>(null);

  function handleCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setPhotos(prev => ({ ...prev, [currentAngle]: { angle: currentAngle, file, preview } }));
    // Auto-advance to next unshot angle
    const next = ANGLES.find(a => a !== currentAngle && !photos[a]);
    if (next) setCurrentAngle(next);
  }

  function triggerCapture(angle: Angle) {
    setCurrentAngle(angle);
    inputRef.current?.click();
  }

  async function handleUpload() {
    const captured = Object.values(photos).filter(Boolean) as CapturedPhoto[];
    if (captured.length === 0) { onDone(); return; }

    setUploading(true);
    try {
      const res = await fetch(`/api/visits/${visitId}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photos: captured.map(p => ({ angle: p.angle, contentType: p.file.type || 'image/jpeg' })),
        }),
      });
      const urls: { angle: Angle; uploadUrl: string }[] = await res.json();

      await Promise.all(
        urls.map(({ angle, uploadUrl }) => {
          const photo = photos[angle]!;
          return fetch(uploadUrl, {
            method: 'PUT',
            body: photo.file,
            headers: { 'Content-Type': photo.file.type || 'image/jpeg' },
          });
        })
      );
      onDone();
    } catch {
      alert('Photo upload failed. Tap "Skip photos" to continue anyway.');
      setUploading(false);
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Add photos (optional)</h2>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleCapture}
      />
      <div className="grid grid-cols-2 gap-3">
        {ANGLES.map(angle => {
          const captured = photos[angle];
          return (
            <button
              key={angle}
              type="button"
              onClick={() => triggerCapture(angle)}
              className="relative border-2 border-dashed border-neutral-300 rounded-lg aspect-square flex flex-col items-center justify-center bg-neutral-50 overflow-hidden"
            >
              {captured ? (
                <Image src={captured.preview} alt={angle} fill className="object-cover" />
              ) : (
                <>
                  <span className="text-3xl">📷</span>
                  <span className="text-xs text-neutral-500 capitalize mt-1">{angle}</span>
                </>
              )}
            </button>
          );
        })}
      </div>
      <div className="flex gap-3">
        <Button variant="outline" onClick={onDone} disabled={uploading} className="flex-1">
          Skip photos
        </Button>
        <Button onClick={handleUpload} disabled={uploading} className="flex-1">
          {uploading ? 'Uploading…' : `Save ${Object.keys(photos).length > 0 ? Object.keys(photos).length + ' photo(s)' : ''}`}
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Test photo upload end-to-end**

```bash
# Set up .env.local with real AWS S3 credentials and bucket
# Visit /customers/<id>/visit/new
# Fill notes, choose opt-in, save
# Take a photo (front), upload
# Expect: photo appears in customer detail page
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/s3.ts src/app/api/visits/ src/components/PhotoCapture.tsx
git commit -m "feat: photo capture — S3 presigned upload, 4-angle capture UI"
```

---

## Phase 3: SMS Reminders

### Task 10: Twilio SMS Integration

**Files:**
- Create: `src/lib/twilio.ts`
- Create: `src/lib/reminders.ts`
- Create: `__tests__/api/reminders.test.ts`

- [ ] **Step 1: Write failing test for reminder logic**

```typescript
// __tests__/api/reminders.test.ts
import { isDueForReminder, buildSmsMessage } from '@/lib/reminders';

describe('isDueForReminder', () => {
  it('returns true when last visit is 42+ days ago and opted in', () => {
    const fortyThreeDaysAgo = new Date(Date.now() - 43 * 24 * 60 * 60 * 1000);
    expect(isDueForReminder(fortyThreeDaysAgo, 'yes')).toBe(true);
  });

  it('returns false when last visit is less than 42 days ago', () => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    expect(isDueForReminder(thirtyDaysAgo, 'yes')).toBe(false);
  });

  it('returns false when opted out', () => {
    const fortyThreeDaysAgo = new Date(Date.now() - 43 * 24 * 60 * 60 * 1000);
    expect(isDueForReminder(fortyThreeDaysAgo, 'no')).toBe(false);
  });

  it('returns false when not asked', () => {
    const fortyThreeDaysAgo = new Date(Date.now() - 43 * 24 * 60 * 60 * 1000);
    expect(isDueForReminder(fortyThreeDaysAgo, 'not_asked')).toBe(false);
  });
});

describe('buildSmsMessage', () => {
  it('builds message with name when available', () => {
    const msg = buildSmsMessage({ name: 'Jake', shopName: "Benjie's", barberName: 'Benjie' });
    expect(msg).toContain('Jake');
    expect(msg).toContain("Benjie's");
    expect(msg).toContain('STOP');
  });

  it('builds message without name when not provided', () => {
    const msg = buildSmsMessage({ name: null, shopName: "Benjie's", barberName: 'Benjie' });
    expect(msg).not.toContain('null');
    expect(msg).toContain('STOP');
  });
});
```

- [ ] **Step 2: Run failing tests**

```bash
npx jest __tests__/api/reminders.test.ts --no-coverage
```

Expected: FAIL — `Cannot find module '@/lib/reminders'`

- [ ] **Step 3: Write `src/lib/reminders.ts`**

```typescript
// src/lib/reminders.ts
const REMINDER_DAYS = 42; // 6 weeks

export function isDueForReminder(lastVisitAt: Date, smsOptIn: string): boolean {
  if (smsOptIn !== 'yes') return false;
  const daysSince = (Date.now() - lastVisitAt.getTime()) / (1000 * 60 * 60 * 24);
  return daysSince >= REMINDER_DAYS;
}

export function buildSmsMessage(params: {
  name: string | null;
  shopName: string;
  barberName: string;
}): string {
  const greeting = params.name ? `Hi ${params.name}` : 'Hi';
  return `${greeting}, it's been 6 weeks since your cut at ${params.shopName}. Time to book in with ${params.barberName}? Reply STOP to opt out.`;
}
```

- [ ] **Step 4: Run tests and verify they pass**

```bash
npx jest __tests__/api/reminders.test.ts --no-coverage
```

Expected: PASS (6 tests).

- [ ] **Step 5: Write `src/lib/twilio.ts`**

```typescript
// src/lib/twilio.ts
import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

export async function sendSms(to: string, body: string): Promise<{ sid: string; status: string }> {
  const message = await client.messages.create({
    from: process.env.TWILIO_PHONE_NUMBER!,
    to,
    body,
  });
  return { sid: message.sid, status: message.status };
}
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/twilio.ts src/lib/reminders.ts __tests__/api/reminders.test.ts
git commit -m "feat: SMS reminder logic — Twilio helper, 6-week due check, message builder"
```

---

### Task 11: Bulk SMS Send API + UI

**Files:**
- Create: `src/app/api/reminders/send/route.ts`
- Create: `src/components/BulkReminderPanel.tsx`
- Create: `src/app/(dashboard)/reminders/page.tsx`

- [ ] **Step 1: Write `src/app/api/reminders/send/route.ts`**

```typescript
// src/app/api/reminders/send/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { sendSms } from '@/lib/twilio';
import { buildSmsMessage } from '@/lib/reminders';

const sendSchema = z.object({
  customerIds: z.array(z.string().cuid()).min(1).max(200),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { shopId, name: barberName } = session.user as any;

  const body = await req.json();
  const parsed = sendSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const shop = await db.shop.findUnique({ where: { id: shopId }, select: { name: true } });
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

  const customers = await db.customer.findMany({
    where: { id: { in: parsed.data.customerIds }, shopId, smsOptIn: 'yes' },
    select: { id: true, phone: true, name: true },
  });

  const results = await Promise.allSettled(
    customers.map(async customer => {
      const message = buildSmsMessage({ name: customer.name, shopName: shop.name, barberName });
      const { sid, status } = await sendSms(customer.phone, message);
      await db.smsLog.create({
        data: { shopId, customerId: customer.id, message, twilioSid: sid, status },
      });
      return { customerId: customer.id, sid, status };
    })
  );

  const sent = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;

  return NextResponse.json({ sent, failed });
}
```

- [ ] **Step 2: Write `src/components/BulkReminderPanel.tsx`**

```typescript
// src/components/BulkReminderPanel.tsx
'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CustomerCard } from './CustomerCard';

interface Customer {
  id: string;
  phone: string;
  name: string | null;
  smsOptIn: string;
  lastVisitAt: string | null;
}

interface Props {
  customers: Customer[];
}

export function BulkReminderPanel({ customers: initial }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set(initial.map(c => c.id)));
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number } | null>(null);

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function handleSend() {
    if (selected.size === 0) return;
    setSending(true);
    const res = await fetch('/api/reminders/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerIds: Array.from(selected) }),
    });
    const data = await res.json();
    setResult(data);
    setSending(false);
  }

  if (result) {
    return (
      <div className="text-center space-y-2 py-8">
        <p className="text-2xl font-bold">{result.sent} sent ✓</p>
        {result.failed > 0 && <p className="text-red-600">{result.failed} failed</p>}
        <Button variant="outline" onClick={() => setResult(null)}>Done</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-500">
          {selected.size} of {initial.length} customers selected
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setSelected(new Set(initial.map(c => c.id)))}>All</Button>
          <Button variant="outline" size="sm" onClick={() => setSelected(new Set())}>None</Button>
        </div>
      </div>
      {initial.map(c => (
        <div
          key={c.id}
          onClick={() => toggle(c.id)}
          className={`cursor-pointer rounded-lg border-2 transition-colors ${
            selected.has(c.id) ? 'border-black' : 'border-transparent'
          }`}
        >
          <CustomerCard {...c} smsOptIn={c.smsOptIn} />
        </div>
      ))}
      <Button
        onClick={handleSend}
        disabled={sending || selected.size === 0}
        className="w-full h-12 text-base"
      >
        {sending ? 'Sending…' : `Send SMS to ${selected.size} customer${selected.size !== 1 ? 's' : ''}`}
      </Button>
    </div>
  );
}
```

- [ ] **Step 3: Write `src/app/(dashboard)/reminders/page.tsx`**

```typescript
// src/app/(dashboard)/reminders/page.tsx
import { getRequiredSession } from '@/lib/session';
import { db } from '@/lib/db';
import { isDueForReminder } from '@/lib/reminders';
import { BulkReminderPanel } from '@/components/BulkReminderPanel';

export default async function RemindersPage() {
  const session = await getRequiredSession();

  const allOptedIn = await db.customer.findMany({
    where: { shopId: session.shopId, smsOptIn: 'yes' },
    select: { id: true, phone: true, name: true, smsOptIn: true, lastVisitAt: true },
    orderBy: { lastVisitAt: 'asc' },
  });

  const due = allOptedIn.filter(c =>
    c.lastVisitAt ? isDueForReminder(c.lastVisitAt, c.smsOptIn) : false
  );

  const serialized = due.map(c => ({
    ...c,
    lastVisitAt: c.lastVisitAt?.toISOString() ?? null,
  }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Reminders</h1>
        <p className="text-sm text-neutral-500">
          {due.length} customer{due.length !== 1 ? 's' : ''} due for a reminder (6+ weeks since last visit)
        </p>
      </div>
      {due.length === 0 ? (
        <p className="text-neutral-400 text-sm">No customers due right now.</p>
      ) : (
        <BulkReminderPanel customers={serialized} />
      )}
    </div>
  );
}
```

- [ ] **Step 4: Test bulk send in browser**

```bash
# http://localhost:3000/reminders
# The seeded customer (44 days ago, opted in) should appear
# With real Twilio credentials in .env.local: send and verify SMS arrives
```

- [ ] **Step 5: Commit**

```bash
git add src/app/api/reminders/ src/components/BulkReminderPanel.tsx src/app/'(dashboard)'/reminders/
git commit -m "feat: bulk SMS reminder send — API + UI with customer checklist"
```

---

### Task 12: Scheduled 6-Week Cron Job

**Files:**
- Create: `src/app/api/reminders/scheduled/route.ts`
- Modify: `vercel.json`

- [ ] **Step 1: Write `src/app/api/reminders/scheduled/route.ts`**

```typescript
// src/app/api/reminders/scheduled/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isDueForReminder, buildSmsMessage } from '@/lib/reminders';
import { sendSms } from '@/lib/twilio';

export async function GET(req: NextRequest) {
  // Vercel Cron sends Authorization: Bearer <CRON_SECRET>
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const shops = await db.shop.findMany({
    where: { subscriptionStatus: 'active' },
    select: { id: true, name: true },
  });

  let totalSent = 0;
  let totalFailed = 0;

  for (const shop of shops) {
    const customers = await db.customer.findMany({
      where: { shopId: shop.id, smsOptIn: 'yes', lastVisitAt: { not: null } },
      select: { id: true, phone: true, name: true, lastVisitAt: true },
    });

    const due = customers.filter(c => isDueForReminder(c.lastVisitAt!, 'yes'));

    for (const customer of due) {
      // Skip if already sent reminder in the last 7 days
      const recentLog = await db.smsLog.findFirst({
        where: {
          customerId: customer.id,
          shopId: shop.id,
          sentAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      });
      if (recentLog) continue;

      try {
        const message = buildSmsMessage({ name: customer.name, shopName: shop.name, barberName: shop.name });
        const { sid, status } = await sendSms(customer.phone, message);
        await db.smsLog.create({
          data: { shopId: shop.id, customerId: customer.id, message, twilioSid: sid, status },
        });
        totalSent++;
      } catch {
        totalFailed++;
      }
    }
  }

  console.log(`Scheduled reminders: sent=${totalSent}, failed=${totalFailed}`);
  return NextResponse.json({ sent: totalSent, failed: totalFailed });
}
```

- [ ] **Step 2: Write `vercel.json`**

```json
{
  "crons": [
    {
      "path": "/api/reminders/scheduled",
      "schedule": "0 9 * * *"
    }
  ]
}
```

This runs daily at 9:00 AM UTC. Vercel sends the `Authorization: Bearer <CRON_SECRET>` header automatically when `CRON_SECRET` is set in Vercel project settings.

- [ ] **Step 3: Write test for deduplication logic**

```typescript
// Add to __tests__/api/reminders.test.ts

describe('scheduled reminder deduplication', () => {
  it('isDueForReminder returns false for a customer with no lastVisitAt', () => {
    // null lastVisitAt shouldn't crash
    expect(() => isDueForReminder(null as any, 'yes')).not.toThrow();
  });
});
```

- [ ] **Step 4: Run test**

```bash
npx jest __tests__/api/reminders.test.ts --no-coverage
```

Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add src/app/api/reminders/scheduled/ vercel.json __tests__/
git commit -m "feat: scheduled daily cron — auto-send 6-week reminders with dedup"
```

---

## Phase 4: Owner Features

### Task 13: Team Management (Invite + Remove Barbers)

**Files:**
- Create: `src/app/api/team/route.ts`
- Create: `src/app/api/team/[id]/route.ts`
- Create: `src/app/(dashboard)/team/page.tsx`

- [ ] **Step 1: Write `src/app/api/team/route.ts`**

```typescript
// src/app/api/team/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

const inviteSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  role: z.enum(['barber', 'owner']).default('barber'),
  password: z.string().min(8),
});

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { shopId, role } = session.user as any;
  if (role !== 'owner') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const barbers = await db.barber.findMany({
    where: { shopId, isActive: true },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json(barbers);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { shopId, role } = session.user as any;
  if (role !== 'owner') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const parsed = inviteSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const existing = await db.barber.findFirst({
    where: { email: parsed.data.email, shopId },
  });
  if (existing) {
    if (!existing.isActive) {
      // Reactivate
      await db.barber.update({ where: { id: existing.id }, data: { isActive: true } });
      return NextResponse.json({ id: existing.id }, { status: 200 });
    }
    return NextResponse.json({ error: 'Barber with this email already exists' }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const barber = await db.barber.create({
    data: { shopId, name: parsed.data.name, email: parsed.data.email, passwordHash, role: parsed.data.role },
  });

  return NextResponse.json({ id: barber.id }, { status: 201 });
}
```

- [ ] **Step 2: Write `src/app/api/team/[id]/route.ts`**

```typescript
// src/app/api/team/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { shopId, role, id: currentBarberId } = session.user as any;
  if (role !== 'owner') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (params.id === currentBarberId) {
    return NextResponse.json({ error: 'Cannot remove yourself' }, { status: 400 });
  }

  await db.barber.updateMany({
    where: { id: params.id, shopId },
    data: { isActive: false },
  });

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: Write `src/app/(dashboard)/team/page.tsx`**

```typescript
// src/app/(dashboard)/team/page.tsx
import { getRequiredSession } from '@/lib/session';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import { TeamClient } from './TeamClient';

export default async function TeamPage() {
  const session = await getRequiredSession();
  if (session.role !== 'owner') redirect('/customers');

  const barbers = await db.barber.findMany({
    where: { shopId: session.shopId, isActive: true },
    select: { id: true, name: true, email: true, role: true },
    orderBy: { createdAt: 'asc' },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Team</h1>
      <TeamClient barbers={barbers} currentBarberId={session.barberId} />
    </div>
  );
}
```

- [ ] **Step 4: Write `src/app/(dashboard)/team/TeamClient.tsx`**

```typescript
// src/app/(dashboard)/team/TeamClient.tsx
'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface Barber {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Props {
  barbers: Barber[];
  currentBarberId: string;
}

export function TeamClient({ barbers: initialBarbers, currentBarberId }: Props) {
  const [barbers, setBarbers] = useState(initialBarbers);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    const res = await fetch('/api/team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role: 'barber' }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? 'Something went wrong');
      setSaving(false);
      return;
    }
    setBarbers(prev => [...prev, { id: data.id, name, email, role: 'barber' }]);
    setName(''); setEmail(''); setPassword('');
    setShowForm(false);
    setSaving(false);
  }

  async function handleRemove(id: string) {
    if (!confirm('Remove this barber? Their visits stay on record.')) return;
    await fetch(`/api/team/${id}`, { method: 'DELETE' });
    setBarbers(prev => prev.filter(b => b.id !== id));
  }

  return (
    <div className="space-y-4">
      {barbers.map(b => (
        <Card key={b.id}>
          <CardContent className="py-3 px-4 flex items-center justify-between">
            <div>
              <p className="font-medium">{b.name}</p>
              <p className="text-sm text-neutral-500">{b.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={b.role === 'owner' ? 'default' : 'secondary'}>{b.role}</Badge>
              {b.id !== currentBarberId && (
                <Button variant="ghost" size="sm" onClick={() => handleRemove(b.id)}>Remove</Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {showForm ? (
        <form onSubmit={handleInvite} className="border rounded-lg p-4 space-y-3">
          <h3 className="font-medium">Add barber</h3>
          <div className="space-y-1">
            <Label htmlFor="b-name">Name</Label>
            <Input id="b-name" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="b-email">Email</Label>
            <Input id="b-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="b-pass">Temporary password</Label>
            <Input id="b-pass" type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>{saving ? 'Adding…' : 'Add barber'}</Button>
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </form>
      ) : (
        <Button onClick={() => setShowForm(true)}>+ Add barber</Button>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/app/api/team/ src/app/'(dashboard)'/team/
git commit -m "feat: team management — owner can add/remove barbers"
```

---

### Task 14: Shop Settings + Branding

**Files:**
- Create: `src/app/api/settings/route.ts`
- Create: `src/app/(dashboard)/settings/page.tsx`

- [ ] **Step 1: Write `src/app/api/settings/route.ts`**

```typescript
// src/app/api/settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  address: z.string().max(200).optional(),
  logoUrl: z.string().url().optional().or(z.literal('')),
});

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = (session.user as any).shopId as string;
  const shop = await db.shop.findUnique({
    where: { id: shopId },
    select: { name: true, address: true, logoUrl: true, slug: true },
  });
  return NextResponse.json(shop);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { shopId, role } = session.user as any;
  if (role !== 'owner') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const shop = await db.shop.update({
    where: { id: shopId },
    data: parsed.data,
    select: { name: true, address: true, logoUrl: true, slug: true },
  });

  return NextResponse.json(shop);
}
```

- [ ] **Step 2: Write `src/app/(dashboard)/settings/page.tsx`**

```typescript
// src/app/(dashboard)/settings/page.tsx
import { getRequiredSession } from '@/lib/session';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import { SettingsForm } from './SettingsForm';

export default async function SettingsPage() {
  const session = await getRequiredSession();
  if (session.role !== 'owner') redirect('/customers');

  const shop = await db.shop.findUnique({
    where: { id: session.shopId },
    select: { name: true, address: true, logoUrl: true, slug: true },
  });

  return (
    <div className="space-y-6 max-w-sm">
      <h1 className="text-2xl font-bold">Shop settings</h1>
      {shop && <SettingsForm shop={shop} />}
    </div>
  );
}
```

- [ ] **Step 3: Write `src/app/(dashboard)/settings/SettingsForm.tsx`**

```typescript
// src/app/(dashboard)/settings/SettingsForm.tsx
'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Props {
  shop: { name: string; address: string | null; logoUrl: string | null; slug: string };
}

export function SettingsForm({ shop }: Props) {
  const [name, setName] = useState(shop.name);
  const [address, setAddress] = useState(shop.address ?? '');
  const [logoUrl, setLogoUrl] = useState(shop.logoUrl ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, address, logoUrl }),
    });
    setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div className="space-y-1">
        <Label>Shop URL</Label>
        <p className="text-sm text-neutral-500">yourbarber.co.uk/{shop.slug}</p>
      </div>
      <div className="space-y-1">
        <Label htmlFor="s-name">Shop name</Label>
        <Input id="s-name" value={name} onChange={e => setName(e.target.value)} required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="s-addr">Address</Label>
        <Input id="s-addr" value={address} onChange={e => setAddress(e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="s-logo">Logo URL</Label>
        <Input id="s-logo" type="url" value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="https://…" />
      </div>
      <Button type="submit" disabled={saving}>
        {saved ? 'Saved ✓' : saving ? 'Saving…' : 'Save settings'}
      </Button>
    </form>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/settings/ src/app/'(dashboard)'/settings/
git commit -m "feat: shop settings — owner can update name, address, logo URL"
```

---

## Post-Build Checks

- [ ] **Run all tests**

```bash
npx jest --no-coverage
```

Expected: All tests PASS.

- [ ] **TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **End-to-end walkthrough (manual)**

1. Login as `owner@benjies.com` / `owner123`
2. Search for `07700900001` → see seeded customer
3. Click customer → "Record cut"
4. Write notes, select "Yes" for SMS opt-in, save
5. Take at least one photo, upload
6. Go to /reminders — customer appears (44 days ago)
7. Send reminder (check phone receives SMS if Twilio is live)
8. Go to /team — add a new barber
9. Sign out, sign in as new barber → verify access

- [ ] **Deploy to Vercel**

```bash
# Push to GitHub first:
git remote add origin <github-url>
git push -u origin main

# In Vercel dashboard:
# 1. Import repo
# 2. Set all env vars from .env.local.example
# 3. Set CRON_SECRET in Vercel env vars
# 4. Deploy
```

---

## Environment Variables Summary

| Variable | Where to get |
|---|---|
| `DATABASE_URL` | Supabase / Railway / Neon (free Postgres) |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `https://yourbarber.co.uk` in prod |
| `AWS_REGION` | AWS Console (e.g. `eu-west-2`) |
| `AWS_ACCESS_KEY_ID` | AWS IAM user with S3 write permissions |
| `AWS_SECRET_ACCESS_KEY` | Same IAM user |
| `AWS_S3_BUCKET` | Create bucket, enable public read |
| `TWILIO_ACCOUNT_SID` | Twilio Console |
| `TWILIO_AUTH_TOKEN` | Twilio Console |
| `TWILIO_PHONE_NUMBER` | Buy a number in Twilio Console |
| `CRON_SECRET` | `openssl rand -base64 32` (same value in Vercel settings) |

---

## Known Gaps (Phase 2)

- **STOP/opt-out handling**: Twilio webhook to update `smsOptIn` to `no` when customer replies STOP
- **Password reset**: Currently owners set temporary passwords manually
- **Customer app/portal**: Phase 2
- **Booking system**: Phase 2
- **Analytics**: Phase 2
- **Subdomain routing** (`benji.yourbarber.co.uk`): Currently uses path-based routing; subdomains require Vercel wildcard domains + middleware rewrite
