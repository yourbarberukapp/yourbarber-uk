import { NextRequest, NextResponse } from 'next/server';
import NextAuth from 'next-auth';
import { authConfig } from './lib/auth.config';

const { auth } = NextAuth(authConfig);

export default auth(function middleware(req: NextRequest) {
  const hostname = req.headers.get('host') ?? '';
  const url = req.nextUrl.clone();

  // Subdomain detection: benjbarbers.yourbarber.uk → /shop/benj-barbers
  const hostParts = hostname.split('.');
  const isSubdomain =
    hostParts.length >= 3 &&
    hostname.endsWith('.yourbarber.uk') &&
    hostParts[0] !== 'www';

  if (isSubdomain) {
    const subSlug = hostParts[0].toLowerCase();
    url.pathname = `/shop/${subSlug}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
