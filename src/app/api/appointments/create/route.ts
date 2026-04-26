import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getCustomerSession } from '@/lib/customerAuth';
import { sendSms } from '@/lib/vonage';

const createSchema = z.object({
  shopId: z.string(),
  barberId: z.string().optional(),
  serviceId: z.string(),
  scheduledAt: z.string().datetime(),
  notes: z.string().max(1000).optional(),
});

export async function POST(req: NextRequest) {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { shopId, barberId, serviceId, scheduledAt, notes } = parsed.data;

  // Verify service and get duration
  const service = await db.shopService.findUnique({ where: { id: serviceId } });
  if (!service || service.shopId !== shopId || !service.isActive) {
    return NextResponse.json({ error: 'Invalid service' }, { status: 400 });
  }

  const duration = service.duration || 30; // fallback to 30 mins
  const start = new Date(scheduledAt);
  const end = new Date(start.getTime() + duration * 60000);

  // If barber specified, check they accept bookings and are free
  if (barberId) {
    const barber = await db.barber.findUnique({ where: { id: barberId } });
    if (!barber || barber.shopId !== shopId || !barber.isActive || !barber.acceptsBookings) {
      return NextResponse.json({ error: 'Barber unavailable' }, { status: 400 });
    }

    // Check overlaps for this barber
    const overlapping = await db.appointment.findFirst({
      where: {
        barberId,
        status: { in: ['booked', 'in_progress'] },
        AND: [
          { scheduledAt: { lt: end } },
          {
            scheduledAt: {
              gte: new Date(start.getTime() - 120 * 60000), // check up to 2 hours before to be safe
            },
          },
        ],
      },
    });

    if (overlapping) {
      // In a real app we'd need exact overlap logic using duration of existing appointment
      const existingEnd = new Date(overlapping.scheduledAt.getTime() + overlapping.duration * 60000);
      if (start < existingEnd && end > overlapping.scheduledAt) {
        return NextResponse.json({ error: 'Time slot taken' }, { status: 409 });
      }
    }
  }

  // Create appointment
  const appointment = await db.appointment.create({
    data: {
      shopId,
      customerId: session.customerId,
      barberId: barberId || null,
      serviceId,
      scheduledAt: start,
      duration,
      status: 'booked',
      notes,
    },
    include: {
      shop: true,
      customer: true,
      barber: true,
      service: true,
    }
  });

  // Send confirmation SMS
  if (appointment.customer.phone) {
    const dateStr = start.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
    const timeStr = start.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const barberStr = appointment.barber ? ` with ${appointment.barber.name}` : '';
    const message = `Confirmed: Your appointment at ${appointment.shop.name}${barberStr} is booked for ${dateStr} at ${timeStr}. See you then!`;
    
    try {
      const { messageId, status } = await sendSms(appointment.customer.phone, message);
      await db.smsLog.create({
        data: {
          shopId: appointment.shopId,
          customerId: appointment.customerId,
          message,
          twilioSid: messageId,
          status,
        },
      });
    } catch (err) {
      console.error('Failed to send confirmation SMS', err);
    }
  }

  return NextResponse.json({ appointment }, { status: 201 });
}
