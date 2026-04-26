import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function PATCH(_req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const appointment = await db.appointment.findUnique({
      where: { id: params.id },
      include: { customer: true }
    });

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    if (appointment.shopId !== session.shopId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await db.appointment.update({
      where: { id: params.id },
      data: { status: 'cancelled' }
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Cancel Appointment Error:', err);
    return NextResponse.json({ error: 'Failed to cancel appointment' }, { status: 500 });
  }
}
