import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { getCustomerSession } from '@/lib/customerAuth';

const createSchema = z.object({
  customerId: z.string(),
  visitId: z.string(),
  rating: z.enum(['positive', 'neutral', 'negative']),
  issue: z.string().max(500).optional(),
  sourceType: z.enum(['in_shop', 'web']),
  reminderWeeks: z.number().optional(),
});

export async function POST(req: NextRequest) {
  const barberSession = await auth();
  const customerSession = !barberSession?.user ? await getCustomerSession() : null;

  if (!barberSession?.user && !customerSession) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { customerId, visitId, rating, issue, sourceType } = parsed.data;

  // Customer session: can only submit for themselves
  if (customerSession && customerSession.customerId !== customerId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const visit = await db.visit.findFirst({
    where: { id: visitId, customerId },
    select: {
      id: true,
      shopId: true,
      shop: { select: { name: true, phone: true } },
    },
  });

  if (!visit) return NextResponse.json({ error: 'Visit not found' }, { status: 404 });

  // Barber session: must belong to the same shop
  if (barberSession?.user) {
    const sessionShopId = (barberSession.user as any).shopId as string;
    if (visit.shopId !== sessionShopId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  const feedback = await db.feedback.create({
    data: { shopId: visit.shopId, customerId, visitId, rating, issue, sourceType },
  });

  if (parsed.data.reminderWeeks) {
    await db.customer.update({
      where: { id: customerId },
      data: { preferredReminderWeeks: parsed.data.reminderWeeks }
    });
  }

  let ticket = null;
  if (rating !== 'positive') {
    ticket = await db.feedbackTicket.create({
      data: { feedbackId: feedback.id, status: 'unresolved' },
    });
  }

  // Negative feedback shows up on the owner's Feedback dashboard immediately — no SMS alert needed.

  return NextResponse.json(
    { feedbackId: feedback.id, ticketId: ticket?.id ?? null, status: ticket?.status ?? null },
    { status: 201 }
  );
}
