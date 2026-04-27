import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'barber') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { customerId, familyMemberIds = [], includeCustomer = true } = await req.json();

    if (!customerId) {
      return NextResponse.json({ error: 'customerId is required' }, { status: 400 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const targetPeople = [];
    if (includeCustomer) targetPeople.push({ id: null, type: 'customer' });
    familyMemberIds.forEach((id: string) => targetPeople.push({ id, type: 'family' }));

    if (targetPeople.length > 1) {
      // Group check-in: Add everyone to the WalkIn queue
      const walkIns = await Promise.all(targetPeople.map(person => 
        db.walkIn.create({
          data: {
            shopId: session.shopId,
            customerId,
            familyMemberId: person.id,
            status: 'waiting',
          }
        })
      ));
      return NextResponse.json({ success: true, count: walkIns.length, type: 'queue' });
    }

    // Single person logic (original)
    const person = targetPeople[0] || { id: null, type: 'customer' };

    // Check for existing appointment
    const existingAppt = await db.appointment.findFirst({
      where: {
        customerId,
        status: 'booked',
        scheduledAt: { gte: today, lt: tomorrow }
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
      return NextResponse.json({ success: true, appointmentId: existingAppt.id, type: 'appointment' });
    }

    // Create walk-in (either as in-progress appointment or queue entry)
    // For now, let's keep it as in-progress appointment as per original design for single person
    const newAppt = await db.appointment.create({
      data: {
        customerId,
        shopId: session.shopId,
        barberId: session.barberId,
        scheduledAt: new Date(),
        duration: 30,
        status: 'in_progress',
        notes: person.id ? `Walk-in for family member ${person.id}` : 'Walk-in from QR Check-in'
      }
    });

    return NextResponse.json({ success: true, appointmentId: newAppt.id, type: 'appointment' });
  } catch (err) {
    console.error('Checkin Start Error:', err);
    return NextResponse.json({ error: 'Failed to start check-in' }, { status: 500 });
  }
}
