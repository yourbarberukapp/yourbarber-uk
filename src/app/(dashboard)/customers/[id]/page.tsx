import { getRequiredSession } from '@/lib/session';
import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Check, X, Minus, ArrowLeft, Scissors, Calendar } from 'lucide-react';

type CutDetails = {
  style?: string[];
  sidesGrade?: string;
  topLength?: string;
  beard?: string;
};

const ANGLE_ORDER = ['front', 'back', 'left', 'right', 'top'];

function sortPhotos(photos: { id: string; url: string; angle: string }[]) {
  return [...photos].sort((a, b) => {
    const ai = ANGLE_ORDER.indexOf(a.angle);
    const bi = ANGLE_ORDER.indexOf(b.angle);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
}

function shortId(id: string) {
  return `#YB-${id.slice(-4).toUpperCase()}`;
}

function fmtDate(d: Date) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

const optInConfigs = {
  yes:      { bg: 'rgba(200,241,53,0.1)',    color: '#C8F135',              border: 'rgba(200,241,53,0.2)',    label: 'SMS on',   Icon: Check },
  no:       { bg: 'rgba(255,255,255,0.05)',  color: 'rgba(255,255,255,0.35)', border: 'rgba(255,255,255,0.1)', label: 'SMS off',  Icon: X },
  not_asked:{ bg: 'rgba(255,255,255,0.03)',  color: 'rgba(255,255,255,0.25)', border: 'rgba(255,255,255,0.08)',label: 'Not asked',Icon: Minus },
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

function Chip({ label, accent }: { label: string; accent?: boolean }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '0.25rem 0.625rem', borderRadius: 20,
      fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
      fontFamily: 'var(--font-barlow, sans-serif)',
      background: accent ? 'rgba(200,241,53,0.12)' : 'rgba(255,255,255,0.07)',
      color: accent ? '#C8F135' : 'rgba(255,255,255,0.65)',
      border: accent ? '1px solid rgba(200,241,53,0.25)' : '1px solid rgba(255,255,255,0.08)',
    }}>
      {label}
    </span>
  );
}

function CutDetailsPanel({ details }: { details: CutDetails }) {
  const hasStyle = details.style && details.style.length > 0;
  const hasGrade = details.sidesGrade || details.topLength;
  const hasBeard = details.beard && details.beard !== 'Not done';
  if (!hasStyle && !hasGrade && !hasBeard) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {hasStyle && (
        <div>
          <p style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)', marginBottom: '0.375rem', fontFamily: 'var(--font-barlow, sans-serif)' }}>
            Style
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
            {details.style!.map(s => <Chip key={s} label={s} accent />)}
          </div>
        </div>
      )}

      {hasGrade && (
        <div>
          <p style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)', marginBottom: '0.375rem', fontFamily: 'var(--font-barlow, sans-serif)' }}>
            Grade
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
            {details.sidesGrade && <Chip label={`Sides: ${details.sidesGrade}`} />}
            {details.topLength && <Chip label={`Top: ${details.topLength}`} />}
          </div>
        </div>
      )}

      {hasBeard && (
        <div>
          <p style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)', marginBottom: '0.375rem', fontFamily: 'var(--font-barlow, sans-serif)' }}>
            Beard
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
            <Chip label={details.beard!} />
          </div>
        </div>
      )}
    </div>
  );
}

export default async function CustomerDetailPage({ params }: { params: { id: string } }) {
  const session = await getRequiredSession();

  const customer = await db.customer.findFirst({
    where: { id: params.id, shopId: session.shopId },
    include: {
      visits: {
        orderBy: { visitedAt: 'desc' },
        take: 20,
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

  const lastVisit = customer.visits[0];

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

      {/* Header card */}
      <div style={{
        background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12,
        padding: '1.5rem', marginBottom: '1.5rem',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '1rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
            background: 'rgba(200,241,53,0.12)', border: '2px solid rgba(200,241,53,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ color: '#C8F135', fontWeight: 900, fontSize: '1.2rem', fontFamily: 'var(--font-barlow, sans-serif)' }}>{initials}</span>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
              <h1 style={{
                fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 900,
                fontSize: '1.75rem', textTransform: 'uppercase', color: 'white', lineHeight: 1, margin: 0,
              }}>
                {customer.name ?? 'No name'}
              </h1>
              <span style={{
                fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)',
                fontFamily: 'var(--font-barlow, sans-serif)', letterSpacing: '0.05em',
              }}>
                {shortId(customer.id)}
              </span>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', fontFamily: 'monospace', margin: '4px 0 8px' }}>
              {customer.phone}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <OptInBadge status={customer.smsOptIn} />
              {lastVisit && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-inter, sans-serif)' }}>
                  <Calendar size={11} /> Last cut: {fmtDate(lastVisit.visitedAt)}
                </span>
              )}
            </div>
          </div>
        </div>
        <Link
          href={`/customers/${customer.id}/visit/new`}
          className="btn-lime"
          style={{ padding: '0.75rem 1.25rem', borderRadius: 6, fontSize: '0.875rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0 }}
        >
          <Scissors size={14} /> Record cut
        </Link>
      </div>

      {/* Visit history heading */}
      <h2 style={{
        fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 700,
        fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.12em',
        color: 'rgba(255,255,255,0.35)', marginBottom: '0.875rem',
      }}>
        Visit history ({customer.visits.length})
      </h2>

      {/* Empty state */}
      {customer.visits.length === 0 && (
        <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '3rem', textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: '0.875rem' }}>
          No visits recorded yet. Tap &ldquo;Record cut&rdquo; to start.
        </div>
      )}

      {/* Visit cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {customer.visits.map(visit => {
          const details = visit.cutDetails as CutDetails | null;
          const photos = sortPhotos(visit.photos);
          const hasContent = details || visit.notes || visit.recommendation;

          return (
            <div key={visit.id} style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, overflow: 'hidden' }}>

              {/* Visit header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderBottom: (photos.length > 0 || hasContent) ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                <span style={{ fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 800, fontSize: '1rem', color: 'white', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                  {fmtDate(visit.visitedAt)}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', fontFamily: 'var(--font-inter, sans-serif)' }}>
                  by {visit.barber.name}
                </span>
              </div>

              {/* Photos — 2×2 grid up to 4, then overflow row */}
              {photos.length > 0 && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: photos.length === 1 ? '1fr' : photos.length === 2 ? '1fr 1fr' : photos.length === 3 ? '1fr 1fr 1fr' : '1fr 1fr',
                  gap: 2,
                  borderBottom: hasContent ? '1px solid rgba(255,255,255,0.06)' : 'none',
                }}>
                  {photos.slice(0, 4).map((photo, i) => (
                    <div key={photo.id} style={{ position: 'relative', aspectRatio: photos.length <= 2 ? '4/3' : '1', background: '#1a1a1a' }}>
                      <Image src={photo.url} alt={photo.angle} fill style={{ objectFit: 'cover' }} unoptimized />
                      <span style={{
                        position: 'absolute', bottom: 4, left: 4,
                        fontSize: '0.55rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
                        background: 'rgba(0,0,0,0.65)', color: 'rgba(255,255,255,0.7)',
                        padding: '0.15rem 0.4rem', borderRadius: 2,
                        fontFamily: 'var(--font-barlow, sans-serif)',
                      }}>
                        {photo.angle}
                      </span>
                    </div>
                  ))}
                  {photos.length > 4 && (
                    <div style={{ position: 'relative', aspectRatio: '1', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem', fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 700 }}>
                        +{photos.length - 4}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Cut details + notes */}
              {hasContent && (
                <div style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                  {details && <CutDetailsPanel details={details} />}

                  {visit.recommendation && (
                    <div style={{
                      background: 'rgba(200,241,53,0.05)', border: '1px solid rgba(200,241,53,0.15)',
                      borderRadius: 6, padding: '0.75rem 1rem',
                    }}>
                      <p style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(200,241,53,0.6)', marginBottom: '0.3rem', fontFamily: 'var(--font-barlow, sans-serif)' }}>
                        Recommendation
                      </p>
                      <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.85rem', lineHeight: 1.6, fontFamily: 'var(--font-inter, sans-serif)', margin: 0 }}>
                        {visit.recommendation}
                      </p>
                    </div>
                  )}

                  {visit.notes && (
                    <div style={{
                      background: 'rgba(255,255,255,0.02)', borderLeft: '2px solid rgba(255,255,255,0.1)',
                      borderRadius: '0 4px 4px 0', padding: '0.625rem 0.875rem',
                    }}>
                      <p style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.25)', marginBottom: '0.25rem', fontFamily: 'var(--font-barlow, sans-serif)' }}>
                        Internal notes
                      </p>
                      <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.85rem', lineHeight: 1.6, whiteSpace: 'pre-wrap', fontFamily: 'var(--font-inter, sans-serif)', margin: 0 }}>
                        {visit.notes}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
