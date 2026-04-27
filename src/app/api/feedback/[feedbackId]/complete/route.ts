import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { sendSms } from '@/lib/twilio';

const completeSchema = z.object({
  barberId: z.string().optional(),
  photoUrl: z.string().url().optional(),
  notes: z.string().max(1000).optional(),
  customerHappy: z.boolean().optional(),
});

function addWeeks(date: Date, weeks: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + weeks * 7);
  return next;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { feedbackId: string } }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = completeSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { role, shopId, id: sessionUserId } = session.user as any;
  if (!['owner', 'barber'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const feedback = await db.feedback.findFirst({
    where: { id: params.feedbackId, shopId },
    select: {
      id: true,
      customerId: true,
      issue: true,
      shopId: true,
      shop: { select: { name: true, phone: true, defaultReminderWeeks: true } },
      customer: {
        select: { id: true, phone: true, preferredReminderWeeks: true },
      },
      visit: {
        select: { id: true, barberId: true },
      },
      ticket: {
        select: {
          id: true,
          status: true,
          assignedBarberId: true,
          notes: true,
        },
      },
    },
  });

  if (!feedback) return NextResponse.json({ error: 'Feedback not found' }, { status: 404 });
  if (!feedback.ticket) return NextResponse.json({ error: 'No ticket for this feedback' }, { status: 404 });
  if (feedback.ticket.status === 'resolved') {
    return NextResponse.json({ error: 'Ticket already resolved' }, { status: 409 });
  }

  const sessionBarberId = role === 'barber' ? sessionUserId : null;
  if (role === 'barber' && feedback.ticket.assignedBarberId && feedback.ticket.assignedBarberId !== sessionBarberId) {
    return NextResponse.json({ error: 'Only the assigned barber can complete this ticket' }, { status: 403 });
  }

  const completionNotes = [
    feedback.ticket.notes?.trim(),
    parsed.data.notes?.trim(),
    parsed.data.photoUrl ? `Completion photo: ${parsed.data.photoUrl}` : null,
    parsed.data.customerHappy === true ? 'Customer confirmed happy with the fix.' : null,
    parsed.data.customerHappy === false ? 'Customer still not fully happy after the fix.' : null,
  ]
    .filter(Boolean)
    .join('\n');

  const reminderWeeks = feedback.customer.preferredReminderWeeks ?? feedback.shop.defaultReminderWeeks;
  const resolvedAt = new Date();

  const ticket = await db.feedbackTicket.update({
    where: { id: feedback.ticket.id },
    data: {
      status: 'resolved',
      resolvedAt,
      assignedBarberId: feedback.ticket.assignedBarberId ?? parsed.data.barberId ?? sessionBarberId,
      notes: completionNotes || null,
    },
    select: {
      id: true,
      status: true,
      resolvedAt: true,
      assignedBarberId: true,
    },
  });

  await db.visit.update({
    where: { id: feedback.visit.id },
    data: {
      reminderScheduledAt: addWeeks(resolvedAt, reminderWeeks),
      cutRating: parsed.data.customerHappy === true ? 'positive' : undefined,
    },
  });

  const customerSms = `All sorted at ${feedback.shop.name}. Thanks for giving us the chance to fix it.`;
  if (feedback.customer.phone) {
    try {
      const { messageId, status } = await sendSms(feedback.customer.phone, customerSms);
      await db.smsLog.create({
        data: {
          shopId: feedback.shopId,
          customerId: feedback.customer.id,
          message: customerSms,
          twilioSid: messageId,
          status,
        },
      });
    } catch {
      // Keep completion resilient if SMS is unavailable in dev or temporarily failing.
    }
  }

  if (feedback.shop.phone) {
    try {
      await sendSms(feedback.shop.phone, `Feedback ticket resolved for customer ${feedback.customer.id}.`);
    } catch {
      // Owner confirmation is best-effort only.
    }
  }

  return NextResponse.json({ ticket });
}
