import { NextResponse } from 'next/server';
import { CUSTOMER_COOKIE } from '@/lib/customerSession';

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(CUSTOMER_COOKIE, '', { maxAge: 0, path: '/' });
  return response;
}
