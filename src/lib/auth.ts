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
      if (isOnLoginPage) {
        if (isLoggedIn) return Response.redirect(new URL('/customers', request.nextUrl));
        return true;
      }
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
