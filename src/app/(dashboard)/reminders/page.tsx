import { getRequiredSession } from '@/lib/session';
import { db } from '@/lib/db';
import { isDueForReminder } from '@/lib/reminders';
import { BulkReminderPanel } from '@/components/BulkReminderPanel';

export default async function RemindersPage() {
  const session = await getRequiredSession();

  const all = await db.customer.findMany({
    where: { shopId: session.shopId, smsOptIn: 'yes' },
    select: { id: true, phone: true, name: true, smsOptIn: true, lastVisitAt: true },
    orderBy: { lastVisitAt: 'asc' },
  });

  const due = all.filter(c => isDueForReminder(c.lastVisitAt, 'yes'));
  const serialized = due.map(c => ({ ...c, lastVisitAt: c.lastVisitAt?.toISOString() ?? null }));

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="font-barlow font-black text-4xl uppercase text-white tracking-tight">
          Reminders
        </h1>
        <p className="text-white/40 text-sm mt-1">
          {due.length} customer{due.length !== 1 ? 's' : ''} due (6+ weeks since last visit)
        </p>
      </div>

      {due.length === 0 ? (
        <div className="bg-[#111] border border-white/5 rounded-2xl p-12 text-center">
          <p className="text-white/25 text-sm">
            No customers due for a reminder right now.
          </p>
        </div>
      ) : (
        <BulkReminderPanel customers={serialized} />
      )}
    </div>
  );
}

