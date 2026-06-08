import { db } from '@/lib/db';
import { buildMockPassSerialNumber } from '@/lib/e2e/seedFixtures';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

function detectWalletPlatform(userAgent: string) {
  if (/iphone|ipad|macintosh/i.test(userAgent)) {
    return {
      label: 'Apple device detected',
      detail: 'Offer the Apple Wallet action first, but keep Google Wallet available for cross-device sharing.',
      accent: 'border-[#C8F135]/35 bg-[#C8F135]/10 text-[#E4FF8B]',
    };
  }

  if (/android/i.test(userAgent)) {
    return {
      label: 'Android device detected',
      detail: 'Prioritise Google Wallet while leaving the Apple Wallet action visible for staff-assisted flows.',
      accent: 'border-sky-400/35 bg-sky-400/10 text-sky-200',
    };
  }

  return {
    label: 'Desktop browser detected',
    detail: 'Render both wallet actions so the QR or handoff flow can continue from any device.',
    accent: 'border-white/15 bg-white/5 text-white/80',
  };
}

export default async function QueueGatewayPage({ params }: { params: { ticketId: string } }) {
  // E2E scaffold only — must not serve real data in production.
  if (process.env.NODE_ENV === 'production') notFound();

  const ticket = await db.walkIn.findUnique({
    where: { id: params.ticketId },
    include: {
      // phone intentionally excluded — route is unauthenticated
      customer: { select: { name: true } },
      shop: { select: { id: true, name: true, defaultCutTime: true } },
    },
  });

  if (!ticket) notFound();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const queue = await db.walkIn.findMany({
    where: {
      shopId: ticket.shopId,
      arrivedAt: { gte: today },
      status: { in: ['waiting', 'in_progress'] },
    },
    orderBy: { arrivedAt: 'asc' },
    select: { id: true },
  });

  const queuePosition = Math.max(queue.findIndex((entry) => entry.id === ticket.id) + 1, 1);
  const estimatedWaitMinutes = Math.max((queuePosition - 1) * (ticket.shop.defaultCutTime ?? 15), 0);
  const passSerialNumber = buildMockPassSerialNumber(ticket.id);
  const platform = detectWalletPlatform(headers().get('user-agent') ?? '');

  return (
    <main className="min-h-screen bg-[#050505] px-6 py-12 text-white lg:px-10">
      <div className="mx-auto max-w-5xl">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,360px)]">
          <section className="rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(200,241,53,0.18),_rgba(11,11,11,0.95)_42%)] p-8 shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.28em] text-[#C8F135]">Queue gateway</p>
            <h1 className="font-barlow text-4xl font-black uppercase tracking-tight text-white sm:text-5xl">
              {ticket.customer.name ?? 'Guest client'}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">
              Ticket <span className="font-mono text-white/80">{ticket.id}</span> is active in {ticket.shop.name}. The wallet pass serial stays deterministic so QA can seed by ticket and still assert the pass handoff state reliably.
            </p>

            <div
              data-testid="device-platform-indicator"
              className={`mt-6 rounded-2xl border px-5 py-4 ${platform.accent}`}
            >
              <p className="text-sm font-bold uppercase tracking-[0.2em]">{platform.label}</p>
              <p className="mt-2 max-w-xl text-sm leading-6 text-white/80">{platform.detail}</p>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/40">Queue position</p>
                <p data-testid="queue-position" className="mt-2 font-barlow text-4xl font-black text-[#C8F135]">
                  {queuePosition}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/40">Estimated wait</p>
                <p data-testid="estimated-wait" className="mt-2 font-barlow text-4xl font-black text-white">
                  {estimatedWaitMinutes}m
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/40">Wallet serial</p>
                <p data-testid="pass-serial-number" className="mt-2 break-all font-mono text-sm text-white/80">
                  {passSerialNumber}
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                data-testid="apple-wallet-button"
                className="btn-lime min-h-14 flex-1 rounded-xl px-6 py-4 text-left text-sm font-black"
                aria-label="Add to Apple Wallet"
              >
                Add to Apple Wallet
              </button>
              <button
                type="button"
                data-testid="google-wallet-button"
                className="min-h-14 flex-1 rounded-xl border border-white/15 bg-white/[0.04] px-6 py-4 text-left text-sm font-black uppercase tracking-[0.12em] text-white transition-colors hover:border-white/25"
                aria-label="Save to Google Wallet"
              >
                Save to Google Wallet
              </button>
            </div>
          </section>

          <aside className="rounded-[28px] border border-white/10 bg-[#0c0c0c] p-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/35">Seeded ticket payload</p>
            <dl className="mt-5 space-y-4 text-sm text-white/70">
              <div>
                <dt className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/35">Shop ID</dt>
                <dd data-testid="ticket-shop-id" className="mt-1 break-all font-mono">{ticket.shop.id}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/35">Status</dt>
                <dd className="mt-1 uppercase text-[#C8F135]">{ticket.status}</dd>
              </div>
            </dl>
          </aside>
        </div>
      </div>
    </main>
  );
}
