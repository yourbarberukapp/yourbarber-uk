import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { notifyCustomer } from '@/lib/wallet/notify';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  // Normally we would secure this with an API key if called from cron,
  // or a user session if called manually.
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const appointment = await db.appointment.findUnique({
    where: { id: params.id },
    include: {
      shop: true,
      customer: true,
      barber: true,
      service: true,
    },
  });

  if (!appointment) {
    return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
  }

  if (appointment.status !== 'booked') {
    return NextResponse.json({ error: 'Appointment is not booked' }, { status: 400 });
  }

  if (appointment.reminderSentAt) {
    return NextResponse.json({ error: 'Reminder already sent' }, { status: 400 });
  }

  // Format date and time
  const dateStr = appointment.scheduledAt.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  const timeStr = appointment.scheduledAt.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const message = `Reminder: your appointment at ${appointment.shop.name} with ${appointment.barber?.name || 'us'} is tomorrow (${dateStr}) at ${timeStr}.`;

  let notified = false;
  try {
    const result = await notifyCustomer(appointment.customerId, message);
    notified = result.notified;

    await db.appointment.update({
      where: { id: appointment.id },
      data: { reminderSentAt: new Date() },
    });
  } catch (error) {
    console.error('Failed to send reminder push', error);
    return NextResponse.json({ error: 'Failed to send reminder' }, { status: 500 });
  }

  return NextResponse.json({ success: true, notified });
}
