import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import { db } from '@/lib/db';
import { checkRateLimit } from '@/lib/rateLimit';

export const { auth, signIn, signOut, handlers } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      id: 'passcode',
      credentials: { passcode: {} },
      async authorize(credentials) {
        const parsed = z.object({ passcode: z.string().length(6) }).safeParse(credentials);
        if (!parsed.success) return null;

        // Rate-limited by passcode value itself — a fixed 6-digit space (1M
        // combinations) is brute-forceable without this. IP isn't reliably
        // available in the Credentials authorize() callback on Vercel, so the
        // bucket is keyed on the attempted code, capping guesses per code
        // rather than per attacker.
        const rl = await checkRateLimit('owner-passcode', parsed.data.passcode, {
          windowMs: 15 * 60 * 1000,
          max: 5,
        });
        if (!rl.allowed) return null;

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
