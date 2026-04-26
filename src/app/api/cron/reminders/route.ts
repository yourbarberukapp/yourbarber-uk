import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: Request) {
  // Normally secure with CRON_SECRET header from Vercel
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const next25h = new Date(now.getTime() + 25 * 60 * 60 * 1000);

  // Find appointments in the next 24-25 hours that haven't had a reminder
  const upcomingAppointments = await db.appointment.findMany({
    where: {
      status: 'booked',
      reminderSentAt: null,
      scheduledAt: {
        gte: next24h,
        lte: next25h,
      },
    },
  });

  const results = [];
  const origin = req.headers.get('host') 
    ? `http${req.headers.get('host')?.includes('localhost') ? '' : 's'}://${req.headers.get('host')}`
    : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  for (const appt of upcomingAppointments) {
    try {
      const response = await fetch(`${origin}/api/appointments/${appt.id}/remind`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.CRON_SECRET}`,
        },
      });
      const data = await response.json();
      results.push({ id: appt.id, success: response.ok, data });
    } catch (e) {
      results.push({ id: appt.id, success: false, error: String(e) });
    }
  }

  return NextResponse.json({ processed: upcomingAppointments.length, results });
}
