import { getRequiredSession } from '@/lib/session';
import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Check, X, Minus, ArrowLeft } from 'lucide-react';

const optInConfigs = {
  yes: { bg: 'rgba(200,241,53,0.1)', color: '#C8F135', border: 'rgba(200,241,53,0.2)', label: 'SMS on', Icon: Check },
  no: { bg: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.35)', border: 'rgba(255,255,255,0.1)', label: 'SMS off', Icon: X },
  not_asked: { bg: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.25)', border: 'rgba(255,255,255,0.08)', label: 'Not asked', Icon: Minus },
} as const;

function OptInBadge({ status }: { status: string }) {
  const c = optInConfigs[status as keyof typeof optInConfigs] ?? optInConfigs.not_asked;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
      fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
      letterSpacing: '0.08em', padding: '0.2rem 0.6rem', borderRadius: 2,
      fontFamily: 'var(--font-barlow, sans-serif)',
    }}>
      <c.Icon size={10} /> {c.label}
    </span>
  );
}

export default async function CustomerDetailPage({ params }: { params: { id: string } }) {
  const session = await getRequiredSession();

  const customer = await db.customer.findFirst({
    where: { id: params.id, shopId: session.shopId },
    include: {
      visits: {
        orderBy: { visitedAt: 'desc' },
        take: 10,
        include: {
          photos: { orderBy: { createdAt: 'asc' } },
          barber: { select: { name: true } },
        },
      },
    },
  });
  if (!customer) notFound();

  const initials = customer.name
    ? customer.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '#';

  return (
    <div style={{ maxWidth: 720 }}>
      {/* Back */}
      <Link href="/customers" style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem',
        textDecoration: 'none', marginBottom: '1.5rem',
      }}>
        <ArrowLeft size={14} /> All customers
      </Link>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(200,241,53,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ color: '#C8F135', fontWeight: 800, fontSize: '1.1rem', fontFamily: 'var(--font-barlow, sans-serif)' }}>{initials}</span>
          </div>
          <div>
            <h1 style={{
              fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 900,
              fontSize: '2rem', textTransform: 'uppercase', color: 'white', lineHeight: 1,
            }}>
              {customer.name ?? 'No name'}
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem', fontFamily: 'monospace', marginTop: 4 }}>
              {customer.phone}
            </p>
            <div style={{ marginTop: 8 }}>
              <OptInBadge status={customer.smsOptIn} />
            </div>
          </div>
        </div>
        <Link
          href={`/customers/${customer.id}/visit/new`}
          className="btn-lime"
          style={{ padding: '0.75rem 1.5rem', borderRadius: 4, fontSize: '0.9rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}
        >
          + Record cut
        </Link>
      </div>

      {/* Visit history heading */}
      <h2 style={{
        fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 700,
        fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.08em',
        color: 'rgba(255,255,255,0.5)', marginBottom: '1rem',
      }}>
        Visit history
      </h2>

      {/* Empty state */}
      {customer.visits.length === 0 && (
        <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '3rem', textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: '0.875rem' }}>
          No visits recorded yet. Tap &ldquo;Record cut&rdquo; to start.
        </div>
      )}

      {/* Visit cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {customer.visits.map(visit => (
          <div key={visit.id} style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span style={{ fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 700, fontSize: '1rem', color: 'white' }}>
                {new Date(visit.visitedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem' }}>by {visit.barber.name}</span>
            </div>
            {visit.photos.length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                {visit.photos.map(photo => (
                  <div key={photo.id} style={{ position: 'relative', width: 72, height: 72, borderRadius: 4, overflow: 'hidden', background: '#1a1a1a', flexShrink: 0 }}>
                    <Image src={photo.url} alt={photo.angle} fill style={{ objectFit: 'cover' }} unoptimized />
                  </div>
                ))}
              </div>
            )}
            {visit.notes && (
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem', lineHeight: 1.6, whiteSpace: 'pre-wrap', background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: 4, borderLeft: '2px solid rgba(200,241,53,0.3)' }}>
                {visit.notes}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
