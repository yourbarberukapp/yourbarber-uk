# Auth Enhancements — OAuth + Password Reset Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Google and Facebook OAuth as alternative sign-in options for barbers, plus a forgot-password / reset-password email flow — all alongside the existing email+password login.

**Architecture:** OAuth providers are added to NextAuth v5 in `auth.ts` (server runtime, not edge). Because yourbarber.uk pre-registers barbers (owners invite them), OAuth sign-in is gated by a `signIn` callback that rejects any Google/Facebook account whose email isn't already a registered `Barber` row. Password reset uses a short-lived `resetToken` stored on the `Barber` row, emailed via Resend. Both flows use the existing `(auth)` route group with no layout change.

**Tech Stack:** NextAuth v5 (`next-auth@^5`), `next-auth/providers/google`, `next-auth/providers/facebook`, Prisma 7 + PostgreSQL (Neon), Resend (email), bcryptjs, Next.js 14 App Router, TypeScript.

---

## Codebase Context

Project root: `c:/Users/luke/Thornes Surveyors & Valuers/Thornes - Documents/AI stuff/AntiGravity Folders/yourbarber.uk/`

**Key existing files:**
- `src/lib/auth.ts` — NextAuth config with Credentials provider; exports `auth`, `signIn`, `signOut`, `handlers`
- `src/lib/auth.config.ts` — Edge-safe config: `pages`, `authorized` callback (middleware), `jwt` + `session` callbacks
- `src/app/(auth)/login/page.tsx` — Barber login page (email + password form)
- `prisma/schema.prisma` — Prisma 7 schema; `Barber` model has `@@unique([email, shopId])`
- `prisma/migrations/` — Manual SQL migrations, deployed with `prisma migrate deploy`

**Prisma 7 migration pattern:** Create SQL manually → `prisma migrate deploy` (never `prisma migrate dev`).

**Design tokens:** `#C8F135` lime, `#0A0A0A` near-black, `#111` card bg. Fonts: `var(--font-barlow, sans-serif)`, `var(--font-inter, sans-serif)`. Class `btn-lime` is a Tailwind custom class defined in globals.css.

**Auth architecture note:** `auth.config.ts` is intentionally edge-safe (no DB). DB calls in `auth.ts` only. The `callbacks` in `auth.config.ts` (`jwt`, `session`, `authorized`) are spread into the `NextAuth({})` call in `auth.ts`. To extend `jwt` for OAuth, we override it in `auth.ts`'s `callbacks` object while preserving `session` and `authorized` from the spread.

**OAuth constraint:** Barbers must already exist in the DB (owner-invited). OAuth is an auth *method*, not auto-registration. The `signIn` callback rejects OAuth users whose email isn't a registered active barber.

**Password reset:** Token is 64-char hex (`crypto.randomBytes(32).toString('hex')`), stored as `resetToken String? @unique` on `Barber`, expires after 1 hour. Always return 200 from the forgot-password API to prevent email enumeration.

---

## File Map

```
prisma/
  schema.prisma                                       MODIFY — add resetToken + resetTokenExpiry to Barber
  migrations/
    20260424300000_barber_reset_token/
      migration.sql                                   CREATE

src/
  lib/
    email.ts                                          CREATE — Resend client + sendPasswordResetEmail helper
    auth.ts                                           MODIFY — add Google/Facebook providers + signIn + jwt callbacks
  app/
    (auth)/
      login/
        page.tsx                                      MODIFY — add OAuth buttons + "Forgot password?" link
      forgot-password/
        page.tsx                                      CREATE — email input form
      reset-password/
        page.tsx                                      CREATE — new password form (reads ?token= from URL)
    api/
      auth/
        forgot-password/
          route.ts                                    CREATE — POST: generate token, send email
        reset-password/
          route.ts                                    CREATE — GET: validate token | POST: update password
```

---

## Task 1: Schema + Migration — Reset Token Fields

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260424300000_barber_reset_token/migration.sql`

- [ ] **Step 1: Add reset token fields to Barber model**

Open `prisma/schema.prisma`. Find the `Barber` model. Add two fields after `photoUrl String?`:

```prisma
  resetToken       String?  @unique
  resetTokenExpiry DateTime?
```

The Barber model should now look like:
```prisma
model Barber {
  id               String    @id @default(cuid())
  shopId           String
  shop             Shop      @relation(fields: [shopId], references: [id], onDelete: Cascade)
  name             String
  email            String
  passwordHash     String
  role             String    @default("barber")
  isActive         Boolean   @default(true)
  bio              String?
  photoUrl         String?
  resetToken       String?   @unique
  resetTokenExpiry DateTime?
  createdAt        DateTime  @default(now())
  visits           Visit[]

  @@unique([email, shopId])
  @@index([shopId])
}
```

- [ ] **Step 2: Create migration directory and SQL file**

```bash
mkdir "prisma/migrations/20260424300000_barber_reset_token"
```

Create `prisma/migrations/20260424300000_barber_reset_token/migration.sql`:

```sql
-- AlterTable
ALTER TABLE "Barber" ADD COLUMN "resetToken" TEXT;
ALTER TABLE "Barber" ADD COLUMN "resetTokenExpiry" TIMESTAMP(3);
CREATE UNIQUE INDEX "Barber_resetToken_key" ON "Barber"("resetToken");
```

- [ ] **Step 3: Regenerate Prisma client**

```bash
node_modules/.bin/prisma generate
```

Expected: `✔ Generated Prisma Client (v7.x.x)`

- [ ] **Step 4: Deploy migration**

```bash
node_modules/.bin/prisma migrate deploy
```

Expected: `Applying migration '20260424300000_barber_reset_token'` then `All migrations have been successfully applied.`

- [ ] **Step 5: Commit**

```bash
git add prisma/
git commit -m "feat: add resetToken + resetTokenExpiry to Barber for password reset"
```

---

## Task 2: Install Resend + Email Helper

**Files:**
- Create: `src/lib/email.ts`

- [ ] **Step 1: Install resend**

```bash
npm install resend
```

Expected: `added 1 package` (or similar, no errors).

- [ ] **Step 2: Create src/lib/email.ts**

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  await resend.emails.send({
    from: 'noreply@yourbarber.uk',
    to,
    subject: 'Reset your YourBarber password',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 2rem; background: #0A0A0A; color: white; border-radius: 8px;">
        <h1 style="font-size: 1.5rem; font-weight: 900; text-transform: uppercase; letter-spacing: -0.02em; margin-bottom: 1rem; color: white;">
          Your<span style="color: #C8F135;">Barber</span>
        </h1>
        <p style="color: rgba(255,255,255,0.7); margin-bottom: 1.5rem; line-height: 1.6;">
          We received a request to reset your password. Click the button below to set a new one. This link expires in 1 hour.
        </p>
        <a href="${resetUrl}" style="display: inline-block; background: #C8F135; color: #0A0A0A; padding: 0.75rem 1.5rem; border-radius: 4px; font-weight: 700; text-decoration: none; text-transform: uppercase; letter-spacing: 0.05em; font-size: 0.9rem;">
          Reset password
        </a>
        <p style="color: rgba(255,255,255,0.3); font-size: 0.75rem; margin-top: 1.5rem;">
          If you did not request this, ignore this email. Your password will not change.
        </p>
      </div>
    `,
  });
}
```

- [ ] **Step 3: Build check**

```bash
node_modules/.bin/next build 2>&1 | tail -10
```

Expected: `✓ Compiled successfully` (email.ts won't be compiled until imported, but this validates the install).

- [ ] **Step 4: Commit**

```bash
git add src/lib/email.ts package.json package-lock.json
git commit -m "feat: Resend email helper for password reset"
```

---

## Task 3: Forgot-Password + Reset-Password API Routes

**Files:**
- Create: `src/app/api/auth/forgot-password/route.ts`
- Create: `src/app/api/auth/reset-password/route.ts`

- [ ] **Step 1: Create forgot-password API route**

```bash
mkdir -p src/app/api/auth/forgot-password
```

Create `src/app/api/auth/forgot-password/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { sendPasswordResetEmail } from '@/lib/email';

const schema = z.object({ email: z.string().email() });

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ ok: true }); // always 200

  const { email } = parsed.data;
  const barber = await db.barber.findFirst({ where: { email, isActive: true } });

  if (barber) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.barber.update({
      where: { id: barber.id },
      data: { resetToken: token, resetTokenExpiry: expiry },
    });

    const resetUrl = `${process.env.APP_URL}/reset-password?token=${token}`;
    await sendPasswordResetEmail(email, resetUrl).catch(console.error);
  }

  // Always 200 — never reveal whether email is registered
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Create reset-password API route**

```bash
mkdir -p src/app/api/auth/reset-password
```

Create `src/app/api/auth/reset-password/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';

const resetSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (!token) return NextResponse.json({ valid: false }, { status: 400 });

  const barber = await db.barber.findFirst({
    where: { resetToken: token, resetTokenExpiry: { gt: new Date() } },
    select: { id: true },
  });

  return NextResponse.json({ valid: !!barber });
}

export async function POST(req: NextRequest) {
  const parsed = resetSchema.safeParse(await req.json());
  if (!parsed.success) {
    const messages = parsed.error.flatten().fieldErrors;
    const first = Object.values(messages).flat()[0] ?? 'Invalid request';
    return NextResponse.json({ error: first }, { status: 400 });
  }

  const { token, password } = parsed.data;

  const barber = await db.barber.findFirst({
    where: { resetToken: token, resetTokenExpiry: { gt: new Date() } },
  });

  if (!barber) {
    return NextResponse.json({ error: 'This reset link is invalid or has expired.' }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await db.barber.update({
    where: { id: barber.id },
    data: { passwordHash, resetToken: null, resetTokenExpiry: null },
  });

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: Build check**

```bash
node_modules/.bin/next build 2>&1 | tail -15
```

Expected: no errors; both API routes appear in build output.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/auth/
git commit -m "feat: forgot-password and reset-password API routes"
```

---

## Task 4: Forgot-Password + Reset-Password Pages

**Files:**
- Create: `src/app/(auth)/forgot-password/page.tsx`
- Create: `src/app/(auth)/reset-password/page.tsx`

- [ ] **Step 1: Create forgot-password page**

```bash
mkdir -p "src/app/(auth)/forgot-password"
```

Create `src/app/(auth)/forgot-password/page.tsx`:

```typescript
'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Scissors } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    setSubmitted(true);
    setLoading(false);
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.75rem 1rem',
    background: '#141414', border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 4, color: 'white', fontSize: '1rem',
    outline: 'none', fontFamily: 'var(--font-inter, sans-serif)',
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0A0A0A', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(200,241,53,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <Scissors size={22} style={{ color: '#C8F135' }} />
          </div>
          <h1 style={{ fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 900, fontSize: '2rem', textTransform: 'uppercase', letterSpacing: '-0.02em', color: 'white' }}>
            Your<span style={{ color: '#C8F135' }}>Barber</span>
          </h1>
        </div>

        <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '2rem' }}>
          {submitted ? (
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '1.5rem', lineHeight: 1.6, fontFamily: 'var(--font-inter, sans-serif)' }}>
                If that email is registered, you will receive a reset link shortly. Check your inbox.
              </p>
              <Link href="/login" style={{ color: '#C8F135', fontSize: '0.875rem', fontFamily: 'var(--font-inter, sans-serif)' }}>
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <h2 style={{ color: 'white', fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 700, fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
                Reset password
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem', marginBottom: '1.5rem', fontFamily: 'var(--font-inter, sans-serif)' }}>
                Enter your email and we'll send you a reset link.
              </p>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem', fontFamily: 'var(--font-barlow, sans-serif)' }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    style={inputStyle}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-lime"
                  style={{ padding: '0.875rem', borderRadius: 4, fontSize: '1rem', border: 'none', width: '100%', marginTop: '0.5rem' }}
                >
                  {loading ? 'Sending…' : 'Send reset link'}
                </button>
              </form>
              <p style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                <Link href="/login" style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', fontFamily: 'var(--font-inter, sans-serif)' }}>
                  Back to sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create reset-password page**

```bash
mkdir -p "src/app/(auth)/reset-password"
```

Create `src/app/(auth)/reset-password/page.tsx`:

```typescript
'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Scissors } from 'lucide-react';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.75rem 1rem',
  background: '#141414', border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 4, color: 'white', fontSize: '1rem',
  outline: 'none', fontFamily: 'var(--font-inter, sans-serif)',
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.75rem', fontWeight: 700,
  textTransform: 'uppercase', letterSpacing: '0.08em',
  color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem',
  fontFamily: 'var(--font-barlow, sans-serif)',
};

function ResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [valid, setValid] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) { setValid(false); return; }
    fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`)
      .then(r => r.json())
      .then(d => setValid(d.valid));
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError('Passwords do not match'); return; }
    setLoading(true);
    setError('');
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    });
    if (res.ok) {
      setDone(true);
      setTimeout(() => router.push('/login'), 2500);
    } else {
      const d = await res.json();
      setError(d.error ?? 'Something went wrong. Please try again.');
    }
    setLoading(false);
  }

  if (valid === null) {
    return <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', fontFamily: 'var(--font-inter, sans-serif)' }}>Checking link…</p>;
  }

  if (!valid) {
    return (
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: '#f87171', marginBottom: '1rem', fontFamily: 'var(--font-inter, sans-serif)' }}>
          This reset link is invalid or has expired.
        </p>
        <Link href="/forgot-password" style={{ color: '#C8F135', fontSize: '0.875rem', fontFamily: 'var(--font-inter, sans-serif)' }}>
          Request a new reset link
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <p style={{ color: '#C8F135', textAlign: 'center', fontFamily: 'var(--font-inter, sans-serif)' }}>
        Password updated! Redirecting to sign in…
      </p>
    );
  }

  return (
    <>
      <h2 style={{ color: 'white', fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 700, fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
        New password
      </h2>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem', marginBottom: '1.5rem', fontFamily: 'var(--font-inter, sans-serif)' }}>
        Choose a password with at least 8 characters.
      </p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={labelStyle}>New password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Confirm password</label>
          <input
            type="password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            required
            autoComplete="new-password"
            style={inputStyle}
          />
        </div>
        {error && <p style={{ color: '#f87171', fontSize: '0.875rem', fontFamily: 'var(--font-inter, sans-serif)' }}>{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="btn-lime"
          style={{ padding: '0.875rem', borderRadius: 4, fontSize: '1rem', border: 'none', width: '100%', marginTop: '0.5rem' }}
        >
          {loading ? 'Updating…' : 'Set new password'}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0A0A0A', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(200,241,53,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <Scissors size={22} style={{ color: '#C8F135' }} />
          </div>
          <h1 style={{ fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 900, fontSize: '2rem', textTransform: 'uppercase', letterSpacing: '-0.02em', color: 'white' }}>
            Your<span style={{ color: '#C8F135' }}>Barber</span>
          </h1>
        </div>
        <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '2rem' }}>
          <Suspense fallback={<p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>Loading…</p>}>
            <ResetForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Build check**

```bash
node_modules/.bin/next build 2>&1 | tail -15
```

Expected: both pages compiled, no TypeScript errors.

- [ ] **Step 4: Manual smoke test**

Start dev server: `node_modules/.bin/next dev -p 3001`

1. Go to `http://localhost:3001/forgot-password`
2. Verify: page loads, email input visible, "Send reset link" button present
3. Enter `owner@benjbarbers.com` → submit
4. Verify: "If that email is registered…" message appears (no crash)
5. Check dev console: should log a Resend error (no API key in dev) or print the resetUrl
6. Go to `http://localhost:3001/reset-password` (no token)
7. Verify: "This reset link is invalid or has expired" message appears
8. Go to `http://localhost:3001/reset-password?token=fake`
9. Verify: same invalid message appears after brief "Checking link…" state

- [ ] **Step 5: Commit**

```bash
git add "src/app/(auth)/forgot-password/" "src/app/(auth)/reset-password/"
git commit -m "feat: forgot-password and reset-password pages"
```

---

## Task 5: Google + Facebook OAuth + Login Page Update

**Files:**
- Modify: `src/lib/auth.ts`
- Modify: `src/app/(auth)/login/page.tsx`

This task adds OAuth providers and updates the login page. OAuth requires app credentials set up in Google Cloud Console and Facebook Developer Console — see the env vars section at the end of this task.

- [ ] **Step 1: Update src/lib/auth.ts — add providers + OAuth callbacks**

Read the file. Replace its ENTIRE contents with:

```typescript
import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import Facebook from 'next-auth/providers/facebook';
import { z } from 'zod';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

export const { auth, signIn, signOut, handlers } = NextAuth({
  ...authConfig,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Facebook({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    }),
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(1) })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;
          const barber = await db.barber.findFirst({
            where: { email, isActive: true },
            include: { shop: { select: { name: true } } }
          });
          if (!barber) return null;
          const passwordsMatch = await bcrypt.compare(password, barber.passwordHash);
          if (passwordsMatch) return {
            id: barber.id,
            email: barber.email,
            name: barber.name,
            shopId: barber.shopId,
            role: barber.role,
            shopName: barber.shop.name,
          };
        }
        return null;
      },
    }),
  ],
  callbacks: {
    // Preserve edge-safe authorized callback from authConfig
    authorized: authConfig.callbacks!.authorized!,
    // Preserve session callback from authConfig
    session: authConfig.callbacks!.session!,
    // Override signIn to gate OAuth on pre-registered barbers only
    async signIn({ account, profile }) {
      if (account?.provider === 'google' || account?.provider === 'facebook') {
        const email = profile?.email;
        if (!email) return false;
        const barber = await db.barber.findFirst({
          where: { email, isActive: true },
          select: { id: true },
        });
        // Reject OAuth sign-ins for emails not registered as barbers
        return !!barber;
      }
      return true; // credentials handled by authorize()
    },
    // Override jwt to handle both OAuth + credentials
    async jwt({ token, user, account }) {
      // First OAuth sign-in: account is populated — look up barber data
      if (account?.provider === 'google' || account?.provider === 'facebook') {
        const barber = await db.barber.findFirst({
          where: { email: token.email!, isActive: true },
          include: { shop: { select: { name: true } } },
        });
        if (barber) {
          token.id = barber.id;
          token.shopId = barber.shopId;
          token.role = barber.role;
          token.shopName = barber.shop.name;
        }
        return token;
      }
      // Credentials sign-in: user is populated with data from authorize()
      if (user) {
        token.id = user.id;
        token.shopId = (user as any).shopId;
        token.role = (user as any).role;
        token.shopName = (user as any).shopName;
      }
      return token;
    },
  },
});
```

- [ ] **Step 2: Update login page — add OAuth buttons + "Forgot password?" link**

Read `src/app/(auth)/login/page.tsx`. Replace its ENTIRE contents with:

```typescript
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { Scissors } from 'lucide-react';

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

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.75rem 1rem',
    background: '#141414', border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 4, color: 'white', fontSize: '1rem',
    outline: 'none', fontFamily: 'var(--font-inter, sans-serif)',
  };

  const oauthBtnStyle: React.CSSProperties = {
    width: '100%', padding: '0.75rem 1rem',
    background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 4, color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem',
    cursor: 'pointer', fontFamily: 'var(--font-inter, sans-serif)',
    fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
    transition: 'border-color 0.15s',
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0A0A0A', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(200,241,53,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <Scissors size={22} style={{ color: '#C8F135' }} />
          </div>
          <h1 style={{ fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 900, fontSize: '2rem', textTransform: 'uppercase', letterSpacing: '-0.02em', color: 'white' }}>
            Your<span style={{ color: '#C8F135' }}>Barber</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem', marginTop: '0.25rem', fontFamily: 'var(--font-inter, sans-serif)' }}>
            Sign in to your shop
          </p>
        </div>

        {/* Card */}
        <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '2rem' }}>

          {/* OAuth buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: '1.5rem' }}>
            <button
              type="button"
              onClick={() => signIn('google', { callbackUrl: '/customers' })}
              style={oauthBtnStyle}
            >
              {/* Google G icon */}
              <svg width="18" height="18" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
                <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.1 6.6 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z"/>
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.8 18.9 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.1 6.6 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
                <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.4-5.1l-6.2-5.2C29.4 35.5 26.8 36 24 36c-5.2 0-9.7-3.3-11.3-7.9l-6.5 5C9.5 39.5 16.2 44 24 44z"/>
                <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.7l6.2 5.2C36.9 40.4 44 35 44 24c0-1.3-.1-2.6-.4-3.9z"/>
              </svg>
              Continue with Google
            </button>
            <button
              type="button"
              onClick={() => signIn('facebook', { callbackUrl: '/customers' })}
              style={oauthBtnStyle}
            >
              {/* Facebook F icon */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2" style={{ flexShrink: 0 }}>
                <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
              </svg>
              Continue with Facebook
            </button>
          </div>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.5rem' }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
            <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.75rem', fontFamily: 'var(--font-inter, sans-serif)' }}>or email</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
          </div>

          {/* Email + password form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem', fontFamily: 'var(--font-barlow, sans-serif)' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                style={inputStyle}
              />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-barlow, sans-serif)' }}>
                  Password
                </label>
                <Link href="/forgot-password" style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-inter, sans-serif)', textDecoration: 'none' }}>
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                style={inputStyle}
              />
            </div>
            {error && (
              <p style={{ color: '#f87171', fontSize: '0.875rem', fontFamily: 'var(--font-inter, sans-serif)' }}>{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="btn-lime"
              style={{ padding: '0.875rem', borderRadius: 4, fontSize: '1rem', marginTop: '0.5rem', border: 'none', display: 'block', width: '100%' }}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.75rem', textAlign: 'center', marginTop: '1.5rem', fontFamily: 'var(--font-inter, sans-serif)' }}>
            Demo: owner@benjbarbers.com / owner123
          </p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Build check**

```bash
node_modules/.bin/next build 2>&1 | tail -15
```

Expected: no TypeScript errors. If you see "Property 'authorized' does not exist on type 'Callbacks'" — wrap the callback references with `as any`:
```typescript
authorized: (authConfig.callbacks as any).authorized,
session: (authConfig.callbacks as any).session,
```

- [ ] **Step 4: Manual smoke test — email flow still works**

Start dev server: `node_modules/.bin/next dev -p 3001`

1. Go to `http://localhost:3001/login`
2. Verify: Google and Facebook buttons appear above the divider
3. Verify: "Forgot password?" link is next to the Password label
4. Sign in with `owner@benjbarbers.com` / `owner123` → redirects to `/customers`

OAuth buttons will redirect to Google/Facebook consent pages — they'll fail without credentials (expected in dev). To test OAuth end-to-end, set up credentials per the env var instructions below and test with real accounts.

- [ ] **Step 5: Commit**

```bash
git add src/lib/auth.ts "src/app/(auth)/login/page.tsx"
git commit -m "feat: Google + Facebook OAuth login + Forgot password link"
```

---

## Env Vars Required

Add to `.env.local` (and to Vercel dashboard for production):

```bash
# Password reset
RESEND_API_KEY=re_xxxxxxxxxxxx        # From resend.com dashboard
APP_URL=http://localhost:3001          # In production: https://yourbarber.uk

# Google OAuth — create at console.cloud.google.com
# Authorised redirect URI: https://yourbarber.uk/api/auth/callback/google
GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxx

# Facebook OAuth — create at developers.facebook.com
# Valid OAuth redirect URI: https://yourbarber.uk/api/auth/callback/facebook
FACEBOOK_CLIENT_ID=xxxxxxxxxxxxxxxxx
FACEBOOK_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Google setup (5 min):**
1. console.cloud.google.com → New project → APIs & Services → Credentials
2. Create OAuth 2.0 Client ID → Web application
3. Authorised redirect URIs: `http://localhost:3001/api/auth/callback/google` (dev) + `https://yourbarber.uk/api/auth/callback/google` (prod)

**Facebook setup (10 min):**
1. developers.facebook.com → My Apps → Create App → Consumer
2. Add Facebook Login product
3. Valid OAuth redirect URIs: `http://localhost:3001/api/auth/callback/facebook` + `https://yourbarber.uk/api/auth/callback/facebook`
4. App must be in "Live" mode to use with non-test accounts

**Resend setup (2 min):**
1. resend.com → Create account → API Keys → Create key
2. Add your domain `yourbarber.uk` to Resend (verify DNS) for production sends
3. In dev, send to your own email or use Resend's test mode

---

## Self-Review

**Spec coverage:**
- ✅ Google OAuth → Task 5
- ✅ Facebook OAuth → Task 5
- ✅ Email + password login preserved → Task 5 (Credentials provider unchanged)
- ✅ Password reset ability → Tasks 1, 2, 3, 4 (schema + email + API + pages)
- ✅ "Forgot password?" link on login page → Task 5

**No placeholders found.**

**Type consistency confirmed:**
- `sendPasswordResetEmail(to: string, resetUrl: string)` — defined in Task 2, called in Task 3
- Reset token: `crypto.randomBytes(32).toString('hex')` — 64-char string, stored as `resetToken String? @unique`
- `{ valid: boolean }` response from `GET /api/auth/reset-password` — consumed by `ResetForm` in Task 4
- `authConfig.callbacks!.authorized!` / `.session!` — non-null asserted because they're defined in auth.config.ts

**OAuth JWT note:** The `jwt` callback is called on every token refresh, but `account` is only non-null on the first sign-in. Subsequent calls only populate `token` (from the stored cookie). The Barber lookup only happens once (when `account` is present), which is correct.
