import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCustomerSession } from '@/lib/customerAuth';
import { sendSms } from '@/lib/vonage';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { rating, stars, issue } = await req.json();
  const visitId = params.id;

  // stars is the new source of truth if provided, otherwise fallback to legacy rating
  let finalRating = rating;
  let finalStars = stars;

  if (finalStars !== undefined) {
    if (finalStars >= 4) finalRating = 'positive';
    else if (finalStars === 3) finalRating = 'neutral';
    else finalRating = 'negative';
  }

  if (!finalRating || !['positive', 'negative', 'neutral'].includes(finalRating)) {
    return NextResponse.json({ error: 'Invalid rating' }, { status: 400 });
  }

  const visit = await db.visit.findUnique({
    where: { id: visitId, customerId: session.customerId },
    select: { shopId: true },
  });

  if (!visit) {
    return NextResponse.json({ error: 'Visit not found' }, { status: 404 });
  }

  // Check if feedback already exists
  const existing = await db.feedback.findFirst({
    where: { visitId },
  });

  if (existing) {
    return NextResponse.json({ error: 'Already rated' }, { status: 400 });
  }

  // Create feedback and update visit
  const { feedback, shopPhone, googleReviewUrl } = await db.$transaction(async (tx) => {
    const shop = await tx.shop.findUnique({ where: { id: visit.shopId }, select: { phone: true, googleReviewUrl: true } });

    const fb = await tx.feedback.create({
      data: {
        shopId: visit.shopId,
        customerId: session.customerId,
        visitId,
        rating: finalRating,
        stars: finalStars,
        issue: finalRating === 'negative' ? issue : null,
        sourceType: 'web',
      },
    });

    if (finalRating === 'negative') {
      await tx.feedbackTicket.create({
        data: {
          feedbackId: fb.id,
          status: 'unresolved',
        },
      });
    }

    await tx.visit.update({
      where: { id: visitId },
      data: { 
        cutRating: finalRating,
        stars: finalStars
      },
    });

    return { feedback: fb, shopPhone: shop?.phone, googleReviewUrl: shop?.googleReviewUrl ?? null };
  });

  if (finalRating === 'negative' && shopPhone) {
    try {
      await sendSms(shopPhone, `New Negative Feedback: A customer just rated their cut ${finalStars ? finalStars + ' stars' : 'poorly'}. Please check the feedback dashboard.`);
    } catch (err) {
      console.error('Failed to notify owner', err);
    }
  }

  // Only trigger Google Review link for 5-star ratings
  const triggerGoogle = finalStars === 5;

  return NextResponse.json({ 
    success: true, 
    googleReviewUrl: triggerGoogle ? googleReviewUrl : null 
  });
}
