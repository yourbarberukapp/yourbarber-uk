import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCustomerSession } from '@/lib/customerAuth';
import { sendSms } from '@/lib/twilio';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { rating, issue } = await req.json();
  const visitId = params.id;

  if (!rating || !['positive', 'negative'].includes(rating)) {
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
  const { feedback, shopPhone } = await db.$transaction(async (tx) => {
    const shop = await tx.shop.findUnique({ where: { id: visit.shopId }, select: { phone: true } });
    
    const fb = await tx.feedback.create({
      data: {
        shopId: visit.shopId,
        customerId: session.customerId,
        visitId,
        rating,
        issue: rating === 'negative' ? issue : null,
        sourceType: 'web',
      },
    });

    if (rating === 'negative') {
      await tx.feedbackTicket.create({
        data: {
          feedbackId: fb.id,
          status: 'unresolved',
        },
      });
    }

    await tx.visit.update({
      where: { id: visitId },
      data: { cutRating: rating },
    });

    return { feedback: fb, shopPhone: shop?.phone };
  });

  if (rating === 'negative' && shopPhone) {
    try {
      await sendSms(shopPhone, `New Negative Feedback: A customer just thumb-downed their cut. Please check the feedback dashboard.`);
    } catch (err) {
      console.error('Failed to notify owner', err);
    }
  }

  return NextResponse.json({ success: true, feedback });
}
