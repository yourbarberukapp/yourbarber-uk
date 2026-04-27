import { getRequiredSession } from '@/lib/session';
import { db } from '@/lib/db';
import WaitlistClient from './WaitlistClient';
import { QrCode } from 'lucide-react';

export default async function WaitlistPage() {
  const session = await getRequiredSession();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [walkIns, shop, barbers] = await Promise.all([
    db.walkIn.findMany({
      where: {
        shopId: session.shopId,
        arrivedAt: { gte: today },
        status: { in: ['waiting', 'in_progress'] },
      },
      include: {
        customer: { select: { id: true, name: true, phone: true, lastVisitAt: true } },
      },
      orderBy: { arrivedAt: 'asc' },
    }),
    db.shop.findUnique({ where: { id: session.shopId }, select: { slug: true } }),
    db.barber.findMany({
      where: { shopId: session.shopId, isActive: true },
      select: { id: true, name: true, isBusy: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  const arriveUrl = shop ? `yourbarber.uk/arrive/${shop.slug}` : null;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 900, fontSize: '2.5rem',
            textTransform: 'uppercase', color: 'white', letterSpacing: '-0.01em', margin: 0, lineHeight: 1,
          }}>
            Walk-ins
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.875rem', margin: '0.5rem 0 0', fontFamily: 'var(--font-inter, sans-serif)' }}>
            {walkIns.length === 0 ? 'No one in the queue' : `${walkIns.length} in the queue`}
          </p>
        </div>
        {arriveUrl && (
          <div style={{
            background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10,
            padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.625rem',
          }}>
            <QrCode size={16} color="rgba(200,241,53,0.7)" />
            <div>
              <p style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)', margin: 0, fontFamily: 'var(--font-barlow, sans-serif)' }}>
                Your wall QR
              </p>
              <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', margin: '2px 0 0', fontFamily: 'monospace' }}>
                {arriveUrl}
              </p>
            </div>
          </div>
        )}
      </div>

      <WaitlistClient initialWalkIns={JSON.parse(JSON.stringify(walkIns))} initialBarbers={JSON.parse(JSON.stringify(barbers))} />
    </div>
  );
}
