import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { db } from '@/lib/db';
import AppointmentGrid from './AppointmentGrid';
import WhatsAppMyDayButton from './WhatsAppMyDayButton';

function startOfWeek(date: Date) {
  const next = new Date(date);
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + diff);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfWeek(date: Date) {
  const next = startOfWeek(date);
  next.setDate(next.getDate() + 6);
  next.setHours(23, 59, 59, 999);
  return next;
}

export default async function AppointmentsPage({ searchParams }: { searchParams: { date?: string } }) {
  const session = await getSession();
  if (!session) redirect('/login');

  const selectedDate = searchParams.date ? new Date(searchParams.date) : new Date();
  const weekStart = startOfWeek(selectedDate);
  const weekEnd = endOfWeek(selectedDate);

  const appointments = await db.appointment.findMany({
    where: {
      shopId: session.shopId,
      scheduledAt: {
        gte: weekStart,
        lte: weekEnd,
      },
      status: { not: 'cancelled' },
    },
    include: {
      customer: true,
      barber: true,
      service: true,
    },
    orderBy: { scheduledAt: 'asc' },
  });

  const barbers = await db.barber.findMany({
    where: { shopId: session.shopId, isActive: true },
  });

  return (
    <div className="p-6 lg:p-10 space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-barlow font-black uppercase tracking-tight text-white">
            Booking <span className="text-primary">Schedule</span>
          </h1>
          <p className="text-muted-foreground text-sm font-inter">Manage your shop's upcoming appointments</p>
        </div>
        <WhatsAppMyDayButton />
      </header>

      <AppointmentGrid 
        initialAppointments={appointments} 
        barbers={barbers}
        weekStart={weekStart.toISOString()}
        session={session}
      />
    </div>
  );
}
