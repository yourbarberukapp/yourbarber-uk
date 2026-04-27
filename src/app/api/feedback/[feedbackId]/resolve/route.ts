import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { sendSms } from '@/lib/twilio';

const RESOLUTIONS = ['same_barber_fix', 'different_barber', 'book_return', 'owner_contact', 'log_only'] as const;

const resolveSchema = z.object({
  resolution: z.enum(RESOLUTIONS),
  assignedBarberId: z.string().optional(),
  preferredDate: z.string().datetime().optional(),
  notes: z.string().max(1000).optional(),
  followUpDate: z.string().datetime().optional(),
});

function buildResolutionSms(params: {
  resolution: (typeof RESOLUTIONS)[number];
  barberName?: string;
  shopName: string;
  preferredDate?: string | null;
}): string {
  const { resolution, barberName, shopName, preferredDate } = params;
  const dateStr = preferredDate
    ? new Date(preferredDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
    : null;

  switch (resolution) {
    case 'same_barber_fix':
      return `Hi, ${barberName ?? 'your barber'} at ${shopName} is ready to fix that for you now. Pop back in and we'll sort it straight away.`;
    case 'different_barber':
      return `Hi, we've arranged for ${barberName ?? 'another barber'} at ${shopName} to fix your cut. Please come back at your convenience.`;
    case 'book_return':
      return `Hi, we'd like to fix that for you — no charge. ${dateStr ? `We have you down for ${dateStr}.` : 'Please book a time that works for you.'} See you soon at ${shopName}.`;
    case 'owner_contact':
      return `Hi, the owner of ${shopName} will be in touch with you shortly to discuss this. We take your feedback seriously.`;
    case 'log_only':
      return '';
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { feedbackId: string } }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { shopId, role } = session.user as any;
  if (role !== 'owner') return NextResponse.json({ error: 'Owner only' }, { status: 403 });

  const body = await req.json();
  const parsed = resolveSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { resolution, assignedBarberId, preferredDate, notes, followUpDate } = parsed.data;

  if ((resolution === 'same_barber_fix' || resolution === 'different_barber') && !assignedBarberId) {
    return NextResponse.json({ error: 'assignedBarberId required for this resolution' }, { status: 400 });
  }

  const feedback = await db.feedback.findFirst({
    where: { id: params.feedbackId, shopId },
    select: {
      id: true,
      issue: true,
      shop: { select: { name: true } },
      customer: { select: { id: true, name: true, phone: true } },
      ticket: { select: { id: true, status: true } },
    },
  });

  if (!feedback) return NextResponse.json({ error: 'Feedback not found' }, { status: 404 });
  if (!feedback.ticket) return NextResponse.json({ error: 'No ticket for this feedback' }, { status: 404 });
  if (feedback.ticket.status === 'resolved') {
    return NextResponse.json({ error: 'Ticket already resolved' }, { status: 409 });
  }

  let assignedBarberName: string | undefined;
  if (assignedBarberId) {
    const barber = await db.barber.findFirst({
      where: { id: assignedBarberId, shopId, isActive: true },
      select: { name: true },
    });
    if (!barber) return NextResponse.json({ error: 'Assigned barber not found in this shop' }, { status: 404 });
    assignedBarberName = barber.name;
  }

  const ticket = await db.feedbackTicket.update({
    where: { id: feedback.ticket.id },
    data: {
      status: resolution === 'log_only' ? 'resolved' : 'in_progress',
      resolution,
      assignedBarberId: assignedBarberId ?? null,
      preferredDate: preferredDate ? new Date(preferredDate) : null,
      notes: notes ?? null,
      followUpDate: followUpDate ? new Date(followUpDate) : null,
      resolvedAt: resolution === 'log_only' ? new Date() : null,
    },
  });

  // SMS to customer
  const customerSms = buildResolutionSms({
    resolution,
    barberName: assignedBarberName,
    shopName: feedback.shop.name,
    preferredDate,
  });
  if (customerSms && feedback.customer.phone) {
    try {
      const { messageId, status: smsStatus } = await sendSms(feedback.customer.phone, customerSms);
      await db.smsLog.create({
        data: {
          shopId,
          customerId: feedback.customer.id,
          message: customerSms,
          twilioSid: messageId,
          status: smsStatus,
        },
      });
    } catch {
      // Log failure but don't block response
    }
  }

  return NextResponse.json({ ticket, smsSent: !!customerSms });
}
