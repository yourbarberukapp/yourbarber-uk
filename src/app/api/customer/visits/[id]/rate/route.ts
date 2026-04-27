import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCustomerSession } from '@/lib/customerAuth';
import { sendSms } from '@/lib/vonage';

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

  const { shopPhone, googleReviewUrl } = await db.$transaction(async (tx) => {
    const shop = await tx.shop.findUnique({
      where: { id: visit.shopId },
      select: { phone: true, googleReviewUrl: true },
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

    return { shopPhone: shop?.phone ?? null, googleReviewUrl: shop?.googleReviewUrl ?? null };
  });

  if (finalRating === 'negative' && shopPhone) {
    try {
      await sendSms(shopPhone, `New feedback: a customer rated their cut ${stars} star${stars !== 1 ? 's' : ''}. Check the feedback dashboard.`);
    } catch (err) {
      console.error('Failed to notify owner', err);
    }
  }

  return NextResponse.json({
    success: true,
    googleReviewUrl: stars === 5 ? googleReviewUrl : null,
  });
}
