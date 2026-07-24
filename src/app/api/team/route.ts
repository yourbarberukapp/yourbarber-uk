import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { randomBytes } from 'crypto';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { generateUniqueOwnerPasscode } from '@/lib/ownerPasscode';

const inviteSchema = z.object({
  name: z.string().min(1).max(100),
});

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { shopId, role } = session.user as any;
  if (role !== 'owner') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const barbers = await db.barber.findMany({
    where: { shopId, isActive: true },
    select: { id: true, name: true, email: true, role: true, createdAt: true, ownerPasscode: true },
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
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues.map(i => i.message).join(', ') }, { status: 400 });

  const passcode = await generateUniqueOwnerPasscode();
  const slug = (await db.shop.findUnique({ where: { id: shopId }, select: { slug: true } }))?.slug ?? shopId;
  // Random token, not the passcode itself — email is read back on GET /api/team,
  // so embedding the login credential there would leak it to anyone who can view the page.
  const placeholderEmail = `${slug}-${randomBytes(6).toString('hex')}@yourbarber.uk`;

  const barber = await db.barber.create({
    data: {
      shopId,
      name: parsed.data.name,
      email: placeholderEmail,
      passwordHash: 'PASSCODE',
      role: 'barber',
      ownerPasscode: passcode,
    },
  });
  return NextResponse.json({ id: barber.id, passcode }, { status: 201 });
}
