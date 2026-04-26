import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete('yb-customer-session');
  return NextResponse.redirect(new URL('/me/login', process.env.NEXTAUTH_URL ?? 'http://localhost:3000'));
}
