import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

type OpeningHours = Record<string, { open: string; close: string; closed?: boolean }>;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const shopId = searchParams.get('shopId');
  const dateStr = searchParams.get('date'); // YYYY-MM-DD
  const barberId = searchParams.get('barberId');
  const serviceId = searchParams.get('serviceId');

  if (!shopId || !dateStr || !serviceId) {
    return NextResponse.json({ error: 'shopId, date, and serviceId required' }, { status: 400 });
  }

  // Get service duration
  const service = await db.shopService.findUnique({ where: { id: serviceId } });
  if (!service) {
    return NextResponse.json({ error: 'Service not found' }, { status: 404 });
  }
  const duration = service.duration || 30;

  // Get barbers
  const barbers = await db.barber.findMany({
    where: {
      shopId,
      isActive: true,
      acceptsBookings: true,
      ...(barberId ? { id: barberId } : {}),
    },
  });

  if (barbers.length === 0) {
    return NextResponse.json({ slots: [] });
  }

  // Get shop to check generic opening hours if needed
  const shop = await db.shop.findUnique({ where: { id: shopId } });
  
  // Date boundaries
  const dateObj = new Date(dateStr);
  const startOfDay = new Date(dateObj.setHours(0, 0, 0, 0));
  const endOfDay = new Date(dateObj.setHours(23, 59, 59, 999));

  // Get existing appointments for the day for these barbers
  const existingAppts = await db.appointment.findMany({
    where: {
      shopId,
      barberId: { in: barbers.map(b => b.id) },
      status: { in: ['booked', 'in_progress'] },
      scheduledAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    select: {
      barberId: true,
      scheduledAt: true,
      duration: true,
    },
  });

  // Get day of week
  const dayOfWeek = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][new Date(dateStr).getDay()] as keyof OpeningHours;

  const slots: { time: string; available: boolean; barberId?: string }[] = [];

  for (const barber of barbers) {
    // Determine working hours for this barber on this day
    const barberHours = (barber.workingHours as any)?.[dayOfWeek] || (shop?.openingHours as any)?.[dayOfWeek];
    
    if (!barberHours || barberHours.closed) continue;

    const [startH, startM] = barberHours.open.split(':').map(Number);
    const [endH, endM] = barberHours.close.split(':').map(Number);

    const startTime = new Date(dateStr);
    startTime.setHours(startH, startM, 0, 0);

    const endTime = new Date(dateStr);
    endTime.setHours(endH, endM, 0, 0);

    // Generate slots for this barber
    const currentSlot = new Date(startTime);
    while (new Date(currentSlot.getTime() + duration * 60000) <= endTime) {
      const slotStart = new Date(currentSlot);
      const slotEnd = new Date(currentSlot.getTime() + duration * 60000);

      const barberAppts = existingAppts.filter(a => a.barberId === barber.id);
      const hasOverlap = barberAppts.some(appt => {
        const apptEnd = new Date(appt.scheduledAt.getTime() + appt.duration * 60000);
        return slotStart < apptEnd && slotEnd > appt.scheduledAt;
      });

      if (!hasOverlap) {
        // Find if this time slot already exists in slots (for another barber)
        const existingSlot = slots.find(s => s.time === slotStart.toISOString());
        if (!existingSlot) {
          slots.push({
            time: slotStart.toISOString(),
            available: true,
            barberId: barber.id,
          });
        }
      }

      // Increment by 15 mins or duration? 
      // Playbook suggests slots every 30 mins, but let's go with 15 for better density if duration allows
      currentSlot.setMinutes(currentSlot.getMinutes() + 15);
    }
  }

  // Sort slots by time
  slots.sort((a, b) => a.time.localeCompare(b.time));

  return NextResponse.json({ slots });
}
