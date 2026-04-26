import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = (session.user as any).shopId as string;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const walkIns = await db.walkIn.findMany({
    where: {
      shopId,
      arrivedAt: { gte: today },
      status: { in: ['waiting', 'in_progress'] },
    },
    include: {
      customer: { select: { id: true, name: true, phone: true, lastVisitAt: true } },
    },
    orderBy: { arrivedAt: 'asc' },
  });

  return NextResponse.json(walkIns);
}
