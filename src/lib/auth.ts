import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { checkRateLimit } from '@/lib/rateLimit';

function getClientIp(): string {
  const h = headers();
  // Vercel sets x-forwarded-for on every request; take the first (client) hop.
  const forwarded = h.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return h.get('x-real-ip') || 'unknown';
}

export const { auth, signIn, signOut, handlers } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      id: 'passcode',
      credentials: { passcode: {} },
      async authorize(credentials) {
        const parsed = z.object({ passcode: z.string().length(6) }).safeParse(credentials);
        if (!parsed.success) return null;

        // Two limits, since either alone is bypassable: capping only by
        // passcode lets one attacker sweep across many different codes;
        // capping only by IP is defeated by a botnet. Both keyed the same
        // 15-minute window.
        const ip = getClientIp();
        const [byCode, byIp] = await Promise.all([
          checkRateLimit('owner-passcode', parsed.data.passcode, { windowMs: 15 * 60 * 1000, max: 5 }),
          checkRateLimit('owner-passcode-ip', ip, { windowMs: 15 * 60 * 1000, max: 20 }),
        ]);
        if (!byCode.allowed || !byIp.allowed) return null;

        const barber = await db.barber.findFirst({
          where: { ownerPasscode: parsed.data.passcode, isActive: true },
          include: { shop: { select: { name: true, slug: true } } },
        });
        if (!barber) return null;

        return {
          id: barber.id,
          email: barber.email,
          name: barber.name,
          shopId: barber.shopId,
          role: barber.role,
          shopName: barber.shop.name,
          shopSlug: barber.shop.slug,
        };
      },
    }),
  ],
  callbacks: {
    authorized: authConfig.callbacks?.authorized,
    session: authConfig.callbacks?.session,
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.shopId = (user as any).shopId;
        token.role = (user as any).role;
        token.shopName = (user as any).shopName;
        token.shopSlug = (user as any).shopSlug;
      }
      return token;
    },
  },
});
