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
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Reminders</h1>
        <p className="text-sm text-neutral-500 mt-1">
          {due.length} customer{due.length !== 1 ? 's' : ''} due (6+ weeks since last visit)
        </p>
      </div>
      {due.length === 0
        ? <p className="text-neutral-400 text-sm text-center py-8">No customers due for a reminder right now.</p>
        : <BulkReminderPanel customers={serialized} />
      }
    </div>
  );
}
