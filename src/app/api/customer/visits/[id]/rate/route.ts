import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCustomerSession } from '@/lib/customerAuth';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { stars, issue } = await req.json();
  const visitId = params.id;

  let finalRating: string;
  if (stars >= 4) finalRating = 'positive';
  else if (stars === 3) finalRating = 'neutral';
  else finalRating = 'negative';

  const visit = await db.visit.findUnique({
    where: { id: visitId, customerId: session.customerId },
    select: { shopId: true },
  });

  if (!visit) return NextResponse.json({ error: 'Visit not found' }, { status: 404 });

  const existing = await db.feedback.findFirst({ where: { visitId } });
  if (existing) return NextResponse.json({ error: 'Already rated' }, { status: 400 });

  const { googleReviewUrl } = await db.$transaction(async (tx) => {
    const shop = await tx.shop.findUnique({
      where: { id: visit.shopId },
      select: { googleReviewUrl: true },
    });

    const fb = await tx.feedback.create({
      data: {
        shopId: visit.shopId,
        customerId: session.customerId,
        visitId,
        rating: finalRating,
        stars,
        issue: finalRating === 'negative' ? issue : null,
        sourceType: 'web',
      },
    });

    if (finalRating === 'negative') {
      await tx.feedbackTicket.create({ data: { feedbackId: fb.id, status: 'unresolved' } });
    }

    await tx.visit.update({
      where: { id: visitId },
      data: { cutRating: finalRating, stars },
    });

    return { googleReviewUrl: shop?.googleReviewUrl ?? null };
  });

  // Negative feedback shows up on the owner's Feedback dashboard immediately — no SMS alert needed.

  return NextResponse.json({
    success: true,
    googleReviewUrl: stars === 5 ? googleReviewUrl : null,
  });
}
