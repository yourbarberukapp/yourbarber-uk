import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = (session.user as any).shopId as string;

  const barbers = await db.barber.findMany({
    where: { shopId, isActive: true },
    select: { id: true, name: true, isBusy: true },
    orderBy: { name: 'asc' },
  });

  return NextResponse.json(barbers);
}
