import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

const inviteSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  role: z.enum(['barber', 'owner']).default('barber'),
  password: z.string().min(8),
});

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { shopId, role } = session.user as any;
  if (role !== 'owner') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const barbers = await db.barber.findMany({
    where: { shopId, isActive: true },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });
  return NextResponse.json(barbers);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { shopId, role } = session.user as any;
  if (role !== 'owner') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const parsed = inviteSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const existing = await db.barber.findFirst({ where: { email: parsed.data.email, shopId } });
  if (existing) {
    if (!existing.isActive) {
      await db.barber.update({ where: { id: existing.id }, data: { isActive: true } });
      return NextResponse.json({ id: existing.id });
    }
    return NextResponse.json({ error: 'Barber with this email already exists' }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const barber = await db.barber.create({
    data: { shopId, name: parsed.data.name, email: parsed.data.email, passwordHash, role: parsed.data.role },
  });
  return NextResponse.json({ id: barber.id }, { status: 201 });
}
