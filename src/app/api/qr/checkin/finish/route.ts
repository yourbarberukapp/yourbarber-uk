import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

const finishSchema = z.object({
  appointmentId: z.string().optional(),
  visitId: z.string().optional(),
  customerId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'barber') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const parsed = finishSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { appointmentId, visitId, customerId } = parsed.data;
  if (!appointmentId && !visitId && !customerId) {
    return NextResponse.json({ error: 'appointmentId, visitId, or customerId is required' }, { status: 400 });
  }

  let appointment = null as null | { id: string; customerId: string };
  if (appointmentId) {
    const existing = await db.appointment.findFirst({
      where: { id: appointmentId, shopId: session.shopId },
      select: { id: true, customerId: true },
    });
    if (!existing) return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    await db.appointment.update({
      where: { id: appointmentId },
      data: { status: 'completed' },
    });
    appointment = existing;
  } else if (customerId) {
    appointment = await db.appointment.findFirst({
      where: {
        customerId,
        shopId: session.shopId,
        status: 'in_progress',
      },
      orderBy: { scheduledAt: 'desc' },
      select: { id: true, customerId: true },
    });

    if (appointment) {
      await db.appointment.update({
        where: { id: appointment.id },
        data: { status: 'completed' },
      });
    }
  }

  let visit = null as null | { id: string; customerId: string; customer: { preferredReminderWeeks: number | null } };
  if (visitId) {
    visit = await db.visit.findFirst({
      where: { id: visitId, shopId: session.shopId },
      select: {
        id: true,
        customerId: true,
        customer: { select: { preferredReminderWeeks: true } },
      },
    });

    if (!visit) return NextResponse.json({ error: 'Visit not found' }, { status: 404 });

    await db.visit.update({
      where: { id: visitId },
      data: {
        reminderScheduledAt: visit.customer.preferredReminderWeeks
          ? new Date(Date.now() + visit.customer.preferredReminderWeeks * 7 * 24 * 60 * 60 * 1000)
          : undefined,
      },
    });
  }

  const reminderWeeks = visit?.customer.preferredReminderWeeks ?? null;

  return NextResponse.json({
    status: 'completed',
    reminderPreference: reminderWeeks ? `${reminderWeeks}_weeks` : 'ask_now',
    appointmentId: appointment?.id ?? null,
    visitId: visit?.id ?? null,
    customerId: visit?.customerId ?? appointment?.customerId ?? customerId ?? null,
  });
}
