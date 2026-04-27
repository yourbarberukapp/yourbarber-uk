import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'yb-customer-session';

function getCustomerAuthSecret() {
  const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error('NEXTAUTH_SECRET or AUTH_SECRET is required for customer sessions');
  }
  return new TextEncoder().encode(secret);
}

export async function signCustomerToken(customerId: string): Promise<string> {
  return new SignJWT({ customerId })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30d')
    .sign(getCustomerAuthSecret());
}

export async function verifyCustomerToken(token: string): Promise<{ customerId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getCustomerAuthSecret());
    return { customerId: payload.customerId as string };
  } catch {
    return null;
  }
}

export async function getCustomerSession(): Promise<{ customerId: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyCustomerToken(token);
}

export function customerCookieOptions(token: string) {
  return {
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  };
}
