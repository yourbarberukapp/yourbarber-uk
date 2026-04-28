import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.shopId = (user as any).shopId;
        token.role = (user as any).role;
        token.shopName = (user as any).shopName;
        token.shopSlug = (user as any).shopSlug;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as any).shopId = token.shopId;
        (session.user as any).role = token.role;
        (session.user as any).shopName = token.shopName;
        (session.user as any).shopSlug = token.shopSlug;
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isCustomerPortal = nextUrl.pathname.startsWith('/customer') ||
                               nextUrl.pathname.startsWith('/c') ||
                               nextUrl.pathname.startsWith('/shop');
      if (isCustomerPortal) return true;

      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard') ||
                            nextUrl.pathname.startsWith('/appointments') ||
                            nextUrl.pathname.startsWith('/customers') ||
                            nextUrl.pathname.startsWith('/reminders') ||
                            nextUrl.pathname.startsWith('/settings') ||
                            nextUrl.pathname.startsWith('/team');
      const isOnLoginPage = nextUrl.pathname.startsWith('/login');

      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      } else if (isOnLoginPage) {
        if (isLoggedIn) {
          return Response.redirect(new URL('/dashboard', nextUrl));
        }
        return true;
      }
      return true;
    },
  },
  providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig;
