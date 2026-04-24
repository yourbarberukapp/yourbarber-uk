export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { sendPasswordResetEmail } from '@/lib/email';

const schema = z.object({ email: z.string().email() });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ ok: true }); // always 200

    const { email } = parsed.data;
    const barber = await db.barber.findFirst({ where: { email, isActive: true } });

    if (barber) {
      const token = crypto.randomBytes(32).toString('hex');
      const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await db.barber.update({
        where: { id: barber.id },
        data: { resetToken: token, resetTokenExpiry: expiry },
      });

      const resetUrl = `${process.env.APP_URL}/reset-password?token=${token}`;
      await sendPasswordResetEmail(email, resetUrl).catch(console.error);
    }

    // Always 200 — never reveal whether email is registered
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ ok: true });
  }
}
