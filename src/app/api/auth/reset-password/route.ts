export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';

const resetSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (!token) return NextResponse.json({ valid: false }, { status: 400 });

  const barber = await db.barber.findFirst({
    where: { resetToken: token, resetTokenExpiry: { gt: new Date() } },
    select: { id: true },
  });

  return NextResponse.json({ valid: !!barber });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = resetSchema.safeParse(body);
    if (!parsed.success) {
      const messages = parsed.error.flatten().fieldErrors;
      const first = Object.values(messages).flat()[0] ?? 'Invalid request';
      return NextResponse.json({ error: first }, { status: 400 });
    }

    const { token, password } = parsed.data;

    const barber = await db.barber.findFirst({
      where: { resetToken: token, resetTokenExpiry: { gt: new Date() } },
    });

    if (!barber) {
      return NextResponse.json({ error: 'This reset link is invalid or has expired.' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await db.barber.update({
      where: { id: barber.id },
      data: { passwordHash, resetToken: null, resetTokenExpiry: null },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
