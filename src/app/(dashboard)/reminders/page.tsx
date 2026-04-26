import { getRequiredSession } from '@/lib/session';
import { db } from '@/lib/db';
import { isDueForReminder } from '@/lib/reminders';
import { BulkReminderPanel } from '@/components/BulkReminderPanel';
import { UnresolvedFeedback } from './UnresolvedFeedback';

export default async function RemindersPage() {
  const session = await getRequiredSession();

  const [all, tickets, barbers] = await Promise.all([
    db.customer.findMany({
      where: { shopId: session.shopId, smsOptIn: 'yes' },
      select: { id: true, phone: true, name: true, smsOptIn: true, lastVisitAt: true },
      orderBy: { lastVisitAt: 'asc' },
    }),
    db.feedbackTicket.findMany({
      where: {
        status: { in: ['unresolved', 'in_progress'] },
        feedback: { shopId: session.shopId },
      },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true, status: true, resolution: true, notes: true, createdAt: true,
        feedback: {
          select: {
            id: true, rating: true, issue: true, createdAt: true,
            customer: { select: { id: true, name: true, phone: true } },
            visit: { select: { id: true, visitedAt: true, barber: { select: { id: true, name: true } } } },
          },
        },
      },
    }),
    db.barber.findMany({
      where: { shopId: session.shopId, isActive: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  const due = all.filter(c => isDueForReminder(c.lastVisitAt, 'yes'));
  const serialized = due.map(c => ({ ...c, lastVisitAt: c.lastVisitAt?.toISOString() ?? null }));

  const serializedTickets = tickets.map(t => ({
    ...t,
    createdAt: t.createdAt.toISOString(),
    feedback: {
      ...t.feedback,
      createdAt: t.feedback.createdAt.toISOString(),
      visit: {
        ...t.feedback.visit,
        visitedAt: t.feedback.visit.visitedAt.toISOString(),
      },
    },
  }));

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="font-barlow font-black text-4xl uppercase text-white tracking-tight">
          Reminders
        </h1>
        <p className="text-white/40 text-sm mt-1">
          SMS due · unresolved feedback
        </p>
      </div>

      {/* SMS due section */}
      <section className="mb-10">
        <h2 className="font-barlow font-bold text-xs uppercase tracking-widest text-white/35 mb-4">
          SMS due — {due.length} customer{due.length !== 1 ? 's' : ''}
        </h2>
        {due.length === 0 ? (
          <div className="bg-[#111] border border-white/5 rounded-2xl p-10 text-center">
            <p className="text-white/25 text-sm">No customers due for a reminder right now.</p>
          </div>
        ) : (
          <BulkReminderPanel customers={serialized} />
        )}
      </section>

      {/* Unresolved feedback section */}
      <section>
        <h2 className="font-barlow font-bold text-xs uppercase tracking-widest text-white/35 mb-4 flex items-center gap-2">
          Unresolved feedback
          {tickets.length > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-black">
              {tickets.length}
            </span>
          )}
        </h2>
        <UnresolvedFeedback tickets={serializedTickets} barbers={barbers} />
      </section>
    </div>
  );
}
