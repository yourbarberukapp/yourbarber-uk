import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'barber') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { customerId } = await req.json();

    if (!customerId) {
      return NextResponse.json({ error: 'customerId is required' }, { status: 400 });
    }

    // Check if there's an existing appointment for today that we can transition
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingAppt = await db.appointment.findFirst({
      where: {
        customerId,
        status: 'booked',
        scheduledAt: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    if (existingAppt) {
      await db.appointment.update({
        where: { id: existingAppt.id },
        data: { 
          status: 'in_progress',
          barberId: session.barberId
        }
      });
      
      return NextResponse.json({ success: true, appointmentId: existingAppt.id });
    }

    // If no appointment, create a walk-in
    const newAppt = await db.appointment.create({
      data: {
        customerId,
        shopId: session.shopId,
        barberId: session.barberId,
        scheduledAt: new Date(),
        duration: 30, // Default duration
        status: 'in_progress',
        notes: 'Walk-in from QR Check-in'
      }
    });

    return NextResponse.json({ success: true, appointmentId: newAppt.id });
  } catch (err) {
    console.error('Checkin Start Error:', err);
    return NextResponse.json({ error: 'Failed to start check-in' }, { status: 500 });
  }
}
