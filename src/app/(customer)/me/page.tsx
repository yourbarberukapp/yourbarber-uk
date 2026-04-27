import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { generateReadUrl } from '@/lib/s3';
import { getCustomerSession } from '@/lib/customerAuth';
import Image from 'next/image';
import { Scissors, LogOut, Users, Plus, Trash2 } from 'lucide-react';
import { RateVisit } from './RateVisit';
import { FamilyManager } from './FamilyManager';

const lime = '#C8F135';
const ANGLE_ORDER = ['front', 'back', 'left', 'right', 'top'];

type CutDetails = {
  style?: string[];
  sidesGrade?: string;
  topLength?: string;
  beard?: string;
};

function fmtDate(d: Date) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function sortPhotos<T extends { angle: string }>(photos: T[]) {
  return [...photos].sort((a, b) => {
    const ai = ANGLE_ORDER.indexOf(a.angle);
    const bi = ANGLE_ORDER.indexOf(b.angle);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
}

function Chip({ label, accent }: { label: string; accent?: boolean }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '0.2rem 0.55rem', borderRadius: 20,
      fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em',
      fontFamily: "'Barlow Condensed',sans-serif",
      background: accent ? 'rgba(200,241,53,0.12)' : 'rgba(255,255,255,0.07)',
      color: accent ? lime : 'rgba(255,255,255,0.65)',
      border: accent ? '1px solid rgba(200,241,53,0.25)' : '1px solid rgba(255,255,255,0.08)',
    }}>
      {label}
    </span>
  );
}

export default async function MyPassportPage() {
  const session = await getCustomerSession();
  if (!session) redirect('/me/login');

  const customer = await db.customer.findUnique({
    where: { id: session.customerId },
    select: {
      id: true,
      name: true,
      phone: true,
      accessCode: true,
      createdAt: true,
      shop: { select: { name: true, slug: true } },
      visits: {
        orderBy: { visitedAt: 'desc' },
        select: {
          id: true,
          visitedAt: true,
          cutDetails: true,
          recommendation: true,
          barber: { select: { name: true } },
          familyMember: { select: { name: true } },
          photos: { orderBy: { createdAt: 'asc' } },
          feedbacks: { select: { id: true, rating: true }, take: 1 },
        },
      },
      familyMembers: {
        select: { id: true, name: true }
      },
      familySharings: {
        select: { id: true, sharedWithPhone: true }
      },
      shopId: true,
    },
  });

  if (!customer) redirect('/me/login');

  // Fetch family members shared WITH this customer
  const sharedSharings = await db.familySharing.findMany({
    where: { 
      sharedWithPhone: customer.phone,
      owner: { shopId: customer.shopId }
    },
    include: {
      owner: {
        select: {
          name: true,
          phone: true,
          familyMembers: { select: { id: true, name: true } }
        }
      }
    }
  });

  const sharedMembers = sharedSharings.flatMap(s => 
    s.owner.familyMembers.map(m => ({
      ...m,
      isShared: true,
      sharedBy: s.owner.name || s.owner.phone
    }))
  );

  const allFamilyMembers = [...customer.familyMembers, ...sharedMembers];

  // Sign all photo URLs
  const visits = await Promise.all(
    customer.visits.map(async visit => ({
      ...visit,
      photos: await Promise.all(
        sortPhotos(visit.photos).map(async p => ({ ...p, signedUrl: await generateReadUrl(p.url) }))
      ),
    }))
  );

  const initials = customer.name
    ? customer.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  const maskedPhone = customer.phone.slice(0, -4).replace(/\d/g, '•') + customer.phone.slice(-4);

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 1rem 4rem' }}>

      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(10,10,10,0.9)', backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '1rem 0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Scissors size={16} color={lime} />
          <span style={{
            fontFamily: "'Barlow Condensed','Arial Black',sans-serif",
            fontWeight: 900, fontSize: '1.25rem', textTransform: 'uppercase',
          }}>
            <span style={{ color: 'white' }}>YOUR</span>
            <span style={{ color: lime }}>BARBER</span>
          </span>
        </div>
        <form action="/api/customer/logout" method="POST">
          <button type="submit" style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 4, padding: '0.375rem 0.75rem',
            color: 'rgba(255,255,255,0.35)', cursor: 'pointer', fontSize: '0.75rem',
            fontFamily: "'Barlow Condensed',sans-serif",
            fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>
            <LogOut size={12} /> Sign out
          </button>
        </form>
      </div>

      {/* Customer card */}
      <div style={{
        margin: '1.5rem 0 2rem',
        background: '#111', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12, padding: '1.25rem',
        display: 'flex', alignItems: 'center', gap: '1rem',
      }}>
        {/* Avatar */}
        <div style={{
          width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
          background: 'rgba(200,241,53,0.1)', border: `2px solid rgba(200,241,53,0.25)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{
            color: lime, fontWeight: 900, fontSize: '1.1rem',
            fontFamily: "'Barlow Condensed',sans-serif",
          }}>{initials}</span>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: "'Barlow Condensed',sans-serif",
            fontWeight: 900, fontSize: '1.4rem', textTransform: 'uppercase',
            color: 'white', lineHeight: 1, marginBottom: 4,
          }}>
            {customer.name ?? 'Your passport'}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem', fontFamily: 'monospace', marginBottom: 6 }}>
            {maskedPhone}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{
              display: 'inline-block',
              padding: '0.15rem 0.5rem', borderRadius: 3,
              background: 'rgba(200,241,53,0.08)', border: '1px solid rgba(200,241,53,0.2)',
              color: lime, fontSize: '0.7rem', fontWeight: 700,
              fontFamily: "'Barlow Condensed',sans-serif",
              textTransform: 'uppercase', letterSpacing: '0.08em',
            }}>
              {visits.length} {visits.length === 1 ? 'cut' : 'cuts'}
            </span>
          </div>
        </div>
      </div>

      {/* Family Section */}
      <FamilyManager 
        initialMembers={allFamilyMembers} 
        initialSharings={customer.familySharings} 
      />

      {/* Empty state */}
      {visits.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '4rem 1rem',
          color: 'rgba(255,255,255,0.25)', fontSize: '0.875rem',
        }}>
          <Scissors size={32} style={{ margin: '0 auto 1rem', display: 'block', opacity: 0.2 }} />
          <p style={{ margin: 0 }}>No cuts recorded yet. Check back after your next visit.</p>
        </div>
      )}

      {/* Visit timeline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {visits.map((visit) => {
          const details = visit.cutDetails as CutDetails | null;
          const hasDetails = details && (
            (details.style && details.style.length > 0) ||
            details.sidesGrade || details.topLength ||
            (details.beard && details.beard !== 'Not done')
          );

          return (
            <div key={visit.id} style={{
              background: '#111', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 12, overflow: 'hidden',
            }}>
              {/* Visit header */}
              <div style={{
                padding: '0.875rem 1rem',
                borderBottom: (visit.photos.length > 0 || hasDetails || visit.recommendation)
                  ? '1px solid rgba(255,255,255,0.06)' : 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{
                    fontFamily: "'Barlow Condensed',sans-serif",
                    fontWeight: 800, fontSize: '1rem', color: 'white',
                    textTransform: 'uppercase', letterSpacing: '0.02em',
                  }}>
                    {fmtDate(visit.visitedAt)}
                  </span>
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem' }}>
                    {visit.barber.name}
                    {visit.familyMember && (
                      <span style={{ color: lime, marginLeft: '0.5rem', fontWeight: 700 }}>
                        • {visit.familyMember.name}
                      </span>
                    )}
                  </span>
                </div>
                <RateVisit visitId={visit.id} alreadyRated={visit.feedbacks.length > 0} />
              </div>

              {/* Photos */}
              {visit.photos.length > 0 && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: visit.photos.length === 1 ? '1fr'
                    : visit.photos.length === 2 ? '1fr 1fr'
                    : visit.photos.length === 3 ? '1fr 1fr 1fr'
                    : '1fr 1fr',
                  gap: 2,
                  borderBottom: (hasDetails || visit.recommendation)
                    ? '1px solid rgba(255,255,255,0.06)' : 'none',
                }}>
                  {visit.photos.map((photo) => (
                    <div key={photo.id} style={{
                      position: 'relative',
                      aspectRatio: visit.photos.length <= 2 ? '4/3' : '1',
                      background: '#1a1a1a',
                    }}>
                      <Image
                        src={photo.signedUrl}
                        alt={photo.angle}
                        fill
                        style={{ objectFit: 'cover' }}
                        unoptimized
                      />
                      <span style={{
                        position: 'absolute', bottom: 4, left: 4,
                        fontSize: '0.5rem', fontWeight: 700, textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        background: 'rgba(0,0,0,0.6)', color: 'rgba(255,255,255,0.6)',
                        padding: '0.1rem 0.35rem', borderRadius: 2,
                        fontFamily: "'Barlow Condensed',sans-serif",
                      }}>
                        {photo.angle}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Cut details */}
              {(hasDetails || visit.recommendation) && (
                <div style={{ padding: '0.875rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {hasDetails && details && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                      {details.style?.map(s => <Chip key={s} label={s} accent />)}
                      {details.sidesGrade && <Chip label={`Sides ${details.sidesGrade}`} />}
                      {details.topLength && <Chip label={`Top ${details.topLength}`} />}
                      {details.beard && details.beard !== 'Not done' && <Chip label={`Beard: ${details.beard}`} />}
                    </div>
                  )}

                  {visit.recommendation && (
                    <div style={{
                      background: 'rgba(200,241,53,0.05)', border: '1px solid rgba(200,241,53,0.12)',
                      borderRadius: 6, padding: '0.625rem 0.875rem',
                    }}>
                      <p style={{
                        fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase',
                        letterSpacing: '0.1em', color: 'rgba(200,241,53,0.55)',
                        marginBottom: '0.25rem',
                        fontFamily: "'Barlow Condensed',sans-serif",
                      }}>
                        Barber's note
                      </p>
                      <p style={{
                        color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem',
                        lineHeight: 1.55, margin: 0,
                      }}>
                        {visit.recommendation}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <p style={{
        marginTop: '3rem', textAlign: 'center',
        color: 'rgba(255,255,255,0.12)', fontSize: '0.65rem',
        fontFamily: "'Barlow Condensed',sans-serif",
        textTransform: 'uppercase', letterSpacing: '0.15em',
      }}>
        Powered by YourBarber
      </p>
    </div>
  );
}
