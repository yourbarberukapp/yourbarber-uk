import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
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
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(1) })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;
          const barber = await db.barber.findFirst({
            where: { email, isActive: true },
            include: { shop: { select: { name: true, slug: true } } }
          });
          if (!barber || !barber.passwordHash || barber.passwordHash === 'OAUTH') return null;
          const passwordsMatch = await bcrypt.compare(password, barber.passwordHash);
          if (passwordsMatch) return {
            id: barber.id,
            email: barber.email,
            name: barber.name,
            shopId: barber.shopId,
            role: barber.role,
            shopName: barber.shop.name,
            shopSlug: barber.shop.slug,
          };
        }
        return null;
      },
    }),
  ],
  callbacks: {
    authorized: authConfig.callbacks?.authorized,
    session: authConfig.callbacks?.session,
    async signIn({ account, profile }) {
      if (account?.provider === 'google') {
        const email = profile?.email;
        if (!email) return false;
        // Existing barber → always allow
        const barber = await db.barber.findFirst({ where: { email, isActive: true } });
        if (barber) return true;
        // New user → must be on the approved beta list
        const lead = await db.demoLead.findFirst({ where: { email, approved: true } });
        if (!lead) return '/signup?error=not_approved';
        return true;
      }
      return true;
    },
    async jwt({ token, user, account, trigger }) {
      // Re-fetch after session.update() call (triggered after /api/setup completes)
      if (trigger === 'update' && token.email) {
        const barber = await db.barber.findFirst({
          where: { email: token.email, isActive: true },
          include: { shop: { select: { name: true, slug: true } } },
        });
        if (barber) {
          token.id = barber.id;
          token.shopId = barber.shopId;
          token.role = barber.role;
          token.shopName = barber.shop.name;
          token.shopSlug = barber.shop.slug;
          token.needsSetup = false;
        }
        return token;
      }
      // First Google sign-in: check if barber already exists
      if (account?.provider === 'google') {
        const barber = await db.barber.findFirst({
          where: { email: token.email!, isActive: true },
          include: { shop: { select: { name: true, slug: true } } },
        });
        if (barber) {
          token.id = barber.id;
          token.shopId = barber.shopId;
          token.role = barber.role;
          token.shopName = barber.shop.name;
          token.shopSlug = barber.shop.slug;
          token.needsSetup = false;
        } else {
          token.needsSetup = true;
        }
        return token;
      }
      // Credentials sign-in
      if (user) {
        token.id = user.id;
        token.shopId = (user as any).shopId;
        token.role = (user as any).role;
        token.shopName = (user as any).shopName;
        token.shopSlug = (user as any).shopSlug;
        token.needsSetup = false;
      }
      return token;
    },
  },
});
