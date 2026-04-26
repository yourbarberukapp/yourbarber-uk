import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

const VALID_STATUSES = ['unresolved', 'in_progress', 'resolved'] as const;
const VALID_RATINGS = ['positive', 'neutral', 'negative'] as const;

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { shopId } = session.user as any;

  const { searchParams } = req.nextUrl;
  const status = searchParams.get('status') as (typeof VALID_STATUSES)[number] | null;
  const rating = searchParams.get('rating') as (typeof VALID_RATINGS)[number] | null;
  const createdAfter = searchParams.get('createdAfter');
  const limitParam = searchParams.get('limit');
  const limit = Math.min(parseInt(limitParam ?? '10', 10) || 10, 100);

  if (status && !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }
  if (rating && !VALID_RATINGS.includes(rating)) {
    return NextResponse.json({ error: 'Invalid rating' }, { status: 400 });
  }

  const feedbacks = await db.feedback.findMany({
    where: {
      shopId,
      ...(rating ? { rating } : {}),
      ...(createdAfter ? { createdAt: { gte: new Date(createdAfter) } } : {}),
      ...(status
        ? { ticket: { status } }
        : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      rating: true,
      issue: true,
      sourceType: true,
      createdAt: true,
      customer: { select: { id: true, name: true, phone: true } },
      visit: {
        select: {
          id: true,
          visitedAt: true,
          barber: { select: { id: true, name: true } },
        },
      },
      ticket: {
        select: {
          id: true,
          status: true,
          resolution: true,
          assignedBarberId: true,
          preferredDate: true,
          followUpDate: true,
          resolvedAt: true,
          createdAt: true,
        },
      },
    },
  });

  // When ?status= is set, the Prisma where filters to feedbacks that HAVE a ticket with that status.
  // Positive feedbacks have no ticket — filter them out when a status filter is active.
  const result = status
    ? feedbacks.filter(f => f.ticket?.status === status)
    : feedbacks;

  return NextResponse.json(result);
}
