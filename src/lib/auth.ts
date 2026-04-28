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
            include: { shop: { select: { name: true, slug: true } } }
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
            shopSlug: barber.shop.slug,
          };
        }
        return null;
      },
    }),
  ],
  callbacks: {
    // Preserve edge-safe authorized callback from authConfig
    authorized: authConfig.callbacks?.authorized,
    // Preserve session callback from authConfig
    session: authConfig.callbacks?.session,
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
          include: { shop: { select: { name: true, slug: true } } },
        });
        if (barber) {
          token.id = barber.id;
          token.shopId = barber.shopId;
          token.role = barber.role;
          token.shopName = barber.shop.name;
          token.shopSlug = barber.shop.slug;
        }
        return token;
      }
      // Credentials sign-in: user is populated with data from authorize()
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
