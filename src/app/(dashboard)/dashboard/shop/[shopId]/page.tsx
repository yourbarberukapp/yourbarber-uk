import { db } from '@/lib/db';
import { getRequiredSession } from '@/lib/session';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

function formatQueueStatus(status: string) {
  if (status === 'in_progress') return 'In chair';
  if (status === 'done') return 'Completed';
  return 'Waiting';
}

export default async function ShopDetailDashboardPage({ params }: { params: { shopId: string } }) {
  const session = await getRequiredSession();
  if (params.shopId !== session.shopId) notFound();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [shop, queue, last5Haircuts] = await Promise.all([
    db.shop.findUnique({
      where: { id: session.shopId },
      select: { id: true, name: true, slug: true },
    }),
    db.walkIn.findMany({
      where: {
        shopId: session.shopId,
        arrivedAt: { gte: today },
        status: { in: ['waiting', 'in_progress'] },
      },
      include: {
        customer: { select: { name: true, phone: true } },
      },
      orderBy: { arrivedAt: 'asc' },
    }),
    db.visit.findMany({
      where: { shopId: session.shopId },
      include: {
        customer: { select: { name: true } },
        barber: { select: { name: true } },
      },
      orderBy: { visitedAt: 'desc' },
      take: 5,
    }),
  ]);

  if (!shop) notFound();

  const haircutDataset = last5Haircuts.map((visit) => {
    const styleValues = (visit.cutDetails as { style?: string[] } | null)?.style;

    return {
      id: visit.id,
      customerName: visit.customer.name ?? 'Guest client',
      barberName: visit.barber.name,
      visitedAt: visit.visitedAt.toISOString(),
      services: Array.isArray(styleValues) ? styleValues : [],
      notes: visit.notes ?? 'No cut notes recorded.',
    };
  });

  return (
    <div className="space-y-8" data-testid="shop-dashboard-shell">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#C8F135]">Barber operations</p>
          <h1 className="font-barlow text-4xl font-black uppercase tracking-tight text-white">
            {shop.name}
          </h1>
          <p className="mt-2 text-sm text-white/45">
            Authenticated through the injected <span className="font-mono text-white/60">app_session_id</span> cookie for Playwright-owned owner access.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/35">Shop slug</p>
          <p className="mt-1 font-mono text-sm text-white/80">{shop.slug}</p>
        </div>
      </header>

      <section className="rounded-3xl border border-white/10 bg-[#111] p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-barlow text-2xl font-black uppercase tracking-[0.04em] text-white">Client queue</h2>
            <p className="text-sm text-white/40">Live walk-ins are rendered from the seeded database state.</p>
          </div>
          <span className="rounded-full border border-[#C8F135]/25 bg-[#C8F135]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-[#C8F135]">
            {queue.length} active
          </span>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10">
          <table data-testid="shop-queue-table" className="min-w-full divide-y divide-white/10 text-left text-sm">
            <thead className="bg-white/[0.03] text-[11px] uppercase tracking-[0.2em] text-white/40">
              <tr>
                <th className="px-4 py-3">Position</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {queue.map((ticket, index) => (
                <tr key={ticket.id} data-testid="queue-table-row" className="bg-black/10">
                  <td className="px-4 py-4 font-barlow text-xl font-black text-[#C8F135]">{index + 1}</td>
                  <td className="px-4 py-4 font-medium text-white">{ticket.customer.name ?? 'Guest client'}</td>
                  <td className="px-4 py-4 font-mono text-white/60">{ticket.customer.phone}</td>
                  <td className="px-4 py-4 text-white/80">{formatQueueStatus(ticket.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="rounded-3xl border border-white/10 bg-[#111] p-6">
          <div className="mb-5">
            <h2 className="font-barlow text-2xl font-black uppercase tracking-[0.04em] text-white">Last 5 Haircuts</h2>
            <p className="text-sm text-white/40">The owner view keeps the recent haircut history array visible beside the queue.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {haircutDataset.map((visit) => (
              <article key={visit.id} data-testid="haircut-history-card" className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/35">{visit.barberName}</p>
                <h3 className="mt-2 font-barlow text-2xl font-black uppercase text-white">{visit.customerName}</h3>
                <p className="mt-2 text-sm text-white/50">{visit.services.join(' | ') || 'No services captured'}</p>
                <p className="mt-3 text-sm leading-6 text-white/70">{visit.notes}</p>
              </article>
            ))}
          </div>
        </div>

        <aside className="rounded-3xl border border-white/10 bg-[#0d0d0d] p-6">
          <div className="mb-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/35">Structured dataset</p>
            <p className="mt-2 text-sm text-white/45">Stable JSON output for QA assertions against the last five haircut entries.</p>
          </div>
          <pre
            data-testid="last-5-haircuts-dataset"
            className="max-h-[480px] overflow-auto rounded-2xl border border-white/10 bg-black/30 p-4 text-xs leading-6 text-white/70"
          >
            {JSON.stringify(haircutDataset, null, 2)}
          </pre>
        </aside>
      </section>
    </div>
  );
}
