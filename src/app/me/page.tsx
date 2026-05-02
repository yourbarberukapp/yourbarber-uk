import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCustomerPhone } from '@/lib/customerSession';
import { db } from '@/lib/db';
import { generateReadUrl } from '@/lib/s3';
import LogoutButton from './LogoutButton';

const ANGLE_ORDER = ['front', 'back', 'left', 'right', 'top'];

function sortPhotos(photos: { url: string; angle: string }[]) {
  return [...photos].sort((a, b) => ANGLE_ORDER.indexOf(a.angle) - ANGLE_ORDER.indexOf(b.angle));
}

function timeAgo(date: Date) {
  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

function formatDate(date: Date) {
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function CutChip({ label }: { label: string }) {
  return (
    <span style={{
      display: 'inline-block', fontSize: '0.65rem', fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: '0.05em',
      background: 'rgba(200,241,53,0.08)', color: '#C8F135',
      border: '1px solid rgba(200,241,53,0.18)', borderRadius: 3,
      padding: '0.2rem 0.5rem', fontFamily: 'var(--font-barlow, sans-serif)',
    }}>
      {label}
    </span>
  );
}

export default async function CustomerPortalPage() {
  const phone = await getCustomerPhone();
  if (!phone) redirect('/me/login');

  // Find all Customer records for this phone across every shop
  const customers = await db.customer.findMany({
    where: { phone },
    select: { id: true, name: true, shopId: true },
  });

  if (customers.length === 0) redirect('/me/login');

  const customerName = customers.find(c => c.name)?.name ?? 'You';
  const customerIds = customers.map(c => c.id);

  // Fetch all visits across all shops
  const rawVisits = await db.visit.findMany({
    where: { customerId: { in: customerIds } },
    include: {
      barber: { select: { name: true } },
      shop: { select: { name: true } },
      photos: { select: { url: true, angle: true } },
    },
    orderBy: { visitedAt: 'desc' },
  });

  // Presign all photo URLs in parallel
  const visits = await Promise.all(
    rawVisits.map(async visit => {
      const sorted = sortPhotos(visit.photos);
      const signedPhotos = await Promise.all(
        sorted.map(async p => ({
          angle: p.angle,
          url: await generateReadUrl(p.url).catch(() => p.url),
        }))
      );
      return { ...visit, photos: signedPhotos };
    })
  );

  const cutDetails = (cd: unknown): { style?: string[]; sidesGrade?: string; topLength?: string; beard?: string } | null => {
    if (!cd || typeof cd !== 'object') return null;
    return cd as { style?: string[]; sidesGrade?: string; topLength?: string; beard?: string };
  };

  return (
    <div style={{ minHeight: '100svh', background: '#0a0a0a', color: 'white', fontFamily: 'var(--font-inter, sans-serif)' }}>

      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '1rem 1.25rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{
            fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 900,
            fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#C8F135',
          }}>
            YourBarber
          </div>
          <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Cut Passport
          </div>
        </div>
        <LogoutButton />
      </header>

      <main style={{ maxWidth: 520, margin: '0 auto', padding: '1.5rem 1.25rem 4rem' }}>

        {/* Identity */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{
            fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 900,
            fontSize: '2rem', textTransform: 'uppercase', color: 'white', margin: '0 0 0.25rem',
          }}>
            {customerName}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', margin: 0, fontFamily: 'monospace' }}>
            {phone}
          </p>
          {visits.length > 0 && (
            <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.75rem', margin: '0.5rem 0 0' }}>
              {visits.length} {visits.length === 1 ? 'visit' : 'visits'} recorded
              {customers.length > 1 && ` across ${customers.length} shops`}
            </p>
          )}
        </div>

        {/* Empty state */}
        {visits.length === 0 && (
          <div style={{
            background: '#111', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12, padding: '3rem 1.5rem', textAlign: 'center',
          }}>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.95rem', margin: 0 }}>No visits recorded yet.</p>
            <p style={{ color: 'rgba(255,255,255,0.15)', fontSize: '0.8rem', margin: '0.5rem 0 0' }}>
              Your cut history will appear here after your first visit.
            </p>
          </div>
        )}

        {/* Visit timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {visits.map((visit, i) => {
            const cd = cutDetails(visit.cutDetails);
            const chips: string[] = [];
            if (cd?.style?.length) chips.push(...cd.style);
            if (cd?.sidesGrade) chips.push(`#${cd.sidesGrade} sides`);
            if (cd?.topLength) chips.push(cd.topLength);
            if (cd?.beard && cd.beard !== 'none') chips.push(`beard: ${cd.beard}`);

            const isLatest = i === 0;

            return (
              <div key={visit.id} style={{
                background: '#111',
                border: isLatest ? '1px solid rgba(200,241,53,0.2)' : '1px solid rgba(255,255,255,0.07)',
                borderRadius: 14,
                overflow: 'hidden',
              }}>
                {/* Visit header */}
                <div style={{ padding: '1rem 1.125rem 0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <div>
                      <div style={{
                        fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 800,
                        fontSize: '0.95rem', textTransform: 'uppercase', color: 'white', lineHeight: 1.2,
                      }}>
                        {visit.shop.name}
                      </div>
                      <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem', marginTop: 2 }}>
                        with {visit.barber.name} · {formatDate(new Date(visit.visitedAt))}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      {isLatest && (
                        <span style={{
                          fontSize: '0.55rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
                          background: 'rgba(200,241,53,0.1)', color: '#C8F135',
                          border: '1px solid rgba(200,241,53,0.2)', borderRadius: 3,
                          padding: '0.15rem 0.45rem', fontFamily: 'var(--font-barlow, sans-serif)',
                        }}>
                          Latest
                        </span>
                      )}
                      <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.2)' }}>
                        {timeAgo(new Date(visit.visitedAt))}
                      </span>
                    </div>
                  </div>

                  {/* Cut detail chips */}
                  {chips.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.75rem' }}>
                      {chips.map(chip => <CutChip key={chip} label={chip} />)}
                    </div>
                  )}

                  {/* Recommendation */}
                  {visit.recommendation && (
                    <div style={{
                      marginTop: '0.75rem', padding: '0.625rem 0.75rem',
                      background: 'rgba(255,255,255,0.03)', borderRadius: 8,
                      borderLeft: '2px solid rgba(200,241,53,0.3)',
                    }}>
                      <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)', marginBottom: 3, fontFamily: 'var(--font-barlow, sans-serif)' }}>
                        Barber&rsquo;s note
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', fontStyle: 'italic', lineHeight: 1.5 }}>
                        &ldquo;{visit.recommendation}&rdquo;
                      </div>
                    </div>
                  )}

                  {/* Public notes */}
                  {visit.notes && !visit.recommendation && (
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', fontStyle: 'italic', margin: '0.75rem 0 0', lineHeight: 1.5 }}>
                      &ldquo;{visit.notes}&rdquo;
                    </p>
                  )}
                </div>

                {/* Photos */}
                {visit.photos.length > 0 && (
                  <div style={{
                    display: 'flex', gap: '0.5rem',
                    overflowX: 'auto', padding: '0 1.125rem 1rem',
                    scrollbarWidth: 'none',
                  }}>
                    {visit.photos.map(photo => (
                      <div key={photo.angle} style={{ flexShrink: 0, position: 'relative' }}>
                        <img
                          src={photo.url}
                          alt={photo.angle}
                          style={{
                            width: 100, height: 130, objectFit: 'cover',
                            borderRadius: 8, display: 'block',
                            border: '1px solid rgba(255,255,255,0.07)',
                          }}
                        />
                        <div style={{
                          position: 'absolute', bottom: 4, left: 4,
                          fontSize: '0.55rem', fontWeight: 700, textTransform: 'uppercase',
                          background: 'rgba(0,0,0,0.65)', color: 'rgba(255,255,255,0.7)',
                          padding: '0.1rem 0.35rem', borderRadius: 2,
                          fontFamily: 'var(--font-barlow, sans-serif)', letterSpacing: '0.06em',
                        }}>
                          {photo.angle}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        {visits.length > 0 && (
          <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.1)', fontSize: '0.7rem', marginTop: '2rem' }}>
            Powered by YourBarber
          </p>
        )}
      </main>

      <style>{`::-webkit-scrollbar { display: none; }`}</style>
    </div>
  );
}
