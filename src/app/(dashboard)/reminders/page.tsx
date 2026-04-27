import { getRequiredSession } from '@/lib/session';
import { db } from '@/lib/db';
import { calcAVI, getReminderStatus, daysSince } from '@/lib/reminders';
import { BulkReminderPanel } from '@/components/BulkReminderPanel';
import { UnresolvedFeedback } from './UnresolvedFeedback';
import { Lock } from 'lucide-react';

export default async function RemindersPage() {
  const session = await getRequiredSession();

  const [shop, customers, tickets, barbers] = await Promise.all([
    db.shop.findUnique({ where: { id: session.shopId }, select: { allowBarberReminders: true } }),
    db.customer.findMany({
      where: { shopId: session.shopId, smsOptIn: 'yes' },
      select: {
        id: true, phone: true, name: true, smsOptIn: true, lastVisitAt: true,
        visits: {
          orderBy: { visitedAt: 'desc' },
          take: 4,
          select: { visitedAt: true },
        },
      },
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

  const isRestricted = session.role === 'barber' && !shop?.allowBarberReminders;

  // Classify each customer by AVI-based status
  const predictor: ReturnType<typeof toRow>[] = [];
  const winback: ReturnType<typeof toRow>[] = [];

  function toRow(c: typeof customers[number], avi: number) {
    return {
      id: c.id,
      phone: c.phone,
      name: c.name,
      smsOptIn: c.smsOptIn,
      lastVisitAt: c.lastVisitAt?.toISOString() ?? null,
      avi,
      daysSinceVisit: c.lastVisitAt ? Math.floor(daysSince(c.lastVisitAt)) : null,
    };
  }

  for (const c of customers) {
    const avi = calcAVI(c.visits.map((v: { visitedAt: Date }) => v.visitedAt));
    const status = getReminderStatus(c.lastVisitAt, avi);
    if (status === 'predictor') predictor.push(toRow(c, avi));
    else if (status === 'winback') winback.push(toRow(c, avi));
  }

  const serializedTickets = tickets.map((t: typeof tickets[number]) => ({
    ...t,
    createdAt: t.createdAt.toISOString(),
    feedback: {
      ...t.feedback,
      createdAt: t.feedback.createdAt.toISOString(),
      visit: { ...t.feedback.visit, visitedAt: t.feedback.visit.visitedAt.toISOString() },
    },
  }));

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="font-barlow font-black text-4xl uppercase text-white tracking-tight">
          Reminders
        </h1>
        <p className="text-white/40 text-sm mt-1">
          Smart SMS — based on each client&apos;s own visit pattern
        </p>
      </div>

      {isRestricted ? (
        <div className="bg-[#111] border border-white/5 rounded-2xl p-10 text-center flex flex-col items-center gap-4 mb-10">
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/20">
            <Lock size={20} />
          </div>
          <div>
            <p className="text-white font-bold uppercase tracking-tight text-sm">Access Restricted</p>
            <p className="text-white/30 text-xs mt-1">SMS Reminders are restricted by the owner.</p>
          </div>
        </div>
      ) : (
        <>
          {/* Predictor section */}
          <section className="mb-10">
            <div className="mb-4">
              <h2 className="font-barlow font-bold text-xs uppercase tracking-widest text-white/35">
                Due now — {predictor.length} client{predictor.length !== 1 ? 's' : ''}
              </h2>
              <p className="text-white/20 text-xs mt-1" style={{ fontFamily: 'var(--font-inter, sans-serif)' }}>
                Approaching their usual visit interval. Good time to nudge.
              </p>
            </div>
            {predictor.length === 0 ? (
              <div className="bg-[#111] border border-white/5 rounded-2xl p-8 text-center">
                <p className="text-white/25 text-sm">No one approaching their usual interval right now.</p>
              </div>
            ) : (
              <BulkReminderPanel customers={predictor} reminderType="predictor" />
            )}
          </section>

          {/* Win-back section */}
          <section className="mb-10">
            <div className="mb-4">
              <h2 className="font-barlow font-bold text-xs uppercase tracking-widest text-white/35">
                Win back — {winback.length} client{winback.length !== 1 ? 's' : ''}
              </h2>
              <p className="text-white/20 text-xs mt-1" style={{ fontFamily: 'var(--font-inter, sans-serif)' }}>
                More than 21 days past their usual interval. They&apos;re drifting — act now.
              </p>
            </div>
            {winback.length === 0 ? (
              <div className="bg-[#111] border border-white/5 rounded-2xl p-8 text-center">
                <p className="text-white/25 text-sm">No win-back candidates right now.</p>
              </div>
            ) : (
              <BulkReminderPanel customers={winback} reminderType="winback" />
            )}
          </section>
        </>
      )}

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
