'use client';

import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Scissors, Clock, ChevronLeft, ArrowRight, Users } from 'lucide-react';

type CutDetails = {
  style?: string[];
  sidesGrade?: string;
  topLength?: string;
  beard?: string;
};

type Client = {
  id: string;
  name: string | null;
  lastVisit: {
    visitedAt: string;
    cutDetails: CutDetails | null;
    recommendation: string | null;
    notes: string | null;
    privateNotes: string | null;
    photos: { id: string; url: string; angle: string }[];
  };
};

// Simulated arrival times (minutes ago) for the demo queue
const ARRIVAL_OFFSETS = [4, 11, 23, 37];

function weeksAgo(dateStr: string) {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w ago`;
}

function initials(name: string | null) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

const ANGLE_ORDER = ['front', 'back', 'left', 'right', 'top'];

function PassportView({ client, onBack }: { client: Client; onBack: () => void }) {
  const { lastVisit } = client;
  const photos = [...lastVisit.photos].sort((a, b) => {
    const ai = ANGLE_ORDER.indexOf(a.angle);
    const bi = ANGLE_ORDER.indexOf(b.angle);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
  const d = lastVisit.cutDetails;
  const chips: string[] = [];
  if (d?.style?.length) chips.push(...d.style);
  if (d?.sidesGrade) chips.push(`Grade ${d.sidesGrade} sides`);
  if (d?.topLength) chips.push(d.topLength);
  if (d?.beard && d.beard !== 'Not done') chips.push(d.beard);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Back bar */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(10,10,10,0.97)', backdropFilter: 'blur(8px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        padding: '0.85rem 1rem',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <button
          onClick={onBack}
          style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 6, padding: '0.4rem 0.7rem', color: 'white', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 5,
            fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.08em', fontFamily: 'var(--font-barlow, sans-serif)',
          }}
        >
          <ChevronLeft size={13} /> Queue
        </button>
        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 900,
            fontSize: '1rem', textTransform: 'uppercase', color: 'white',
          }}>
            {client.name ?? 'Client'}
          </div>
          <div style={{
            fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)',
            fontFamily: 'var(--font-inter, sans-serif)',
          }}>
            Last cut {weeksAgo(lastVisit.visitedAt)}
          </div>
        </div>
        <div style={{
          background: 'rgba(200,241,53,0.1)', border: '1px solid rgba(200,241,53,0.2)',
          borderRadius: 4, padding: '0.25rem 0.6rem',
          fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.12em', color: '#C8F135',
          fontFamily: 'var(--font-barlow, sans-serif)',
        }}>
          Cut Passport
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 0 6rem' }}>

        {/* Photos */}
        {photos.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: photos.length === 1 ? '1fr' : '1fr 1fr',
            gap: 2,
          }}>
            {photos.slice(0, 4).map(p => (
              <div key={p.id} style={{ position: 'relative', aspectRatio: '1', background: '#1a1a1a' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt={p.angle} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <span style={{
                  position: 'absolute', bottom: 4, left: 4,
                  background: 'rgba(0,0,0,0.65)', color: 'rgba(255,255,255,0.8)',
                  fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '0.08em', padding: '2px 5px', borderRadius: 3,
                  fontFamily: 'var(--font-barlow, sans-serif)',
                }}>
                  {p.angle}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            margin: '1rem', background: '#111', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 10, padding: '2rem', textAlign: 'center',
            color: 'rgba(255,255,255,0.2)', fontSize: '0.85rem',
            fontFamily: 'var(--font-inter, sans-serif)',
          }}>
            No photos yet for this client.
          </div>
        )}

        {/* Cut details */}
        <div style={{ padding: '1rem 1rem 0' }}>
          {chips.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: '0.85rem' }}>
              {chips.map(c => (
                <span key={c} style={{
                  background: 'rgba(200,241,53,0.1)', color: '#C8F135',
                  border: '1px solid rgba(200,241,53,0.2)',
                  fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '0.05em', padding: '3px 9px', borderRadius: 20,
                  fontFamily: 'var(--font-barlow, sans-serif)',
                }}>
                  {c}
                </span>
              ))}
            </div>
          )}

          {lastVisit.notes && (
            <div style={{
              background: 'rgba(255,255,255,0.03)', borderLeft: '2px solid rgba(255,255,255,0.1)',
              borderRadius: '0 6px 6px 0', padding: '0.65rem 0.85rem', marginBottom: '0.75rem',
            }}>
              <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.25)', marginBottom: 4, fontFamily: 'var(--font-barlow, sans-serif)' }}>Notes</div>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', lineHeight: 1.5, margin: 0, fontFamily: 'var(--font-inter, sans-serif)' }}>{lastVisit.notes}</p>
            </div>
          )}

          {lastVisit.recommendation && (
            <div style={{
              background: 'rgba(200,241,53,0.05)', border: '1px solid rgba(200,241,53,0.15)',
              borderRadius: 8, padding: '0.65rem 0.85rem', marginBottom: '0.75rem',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <Clock size={13} color="#C8F135" style={{ flexShrink: 0 }} />
              <span style={{ color: '#C8F135', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-barlow, sans-serif)' }}>
                {lastVisit.recommendation}
              </span>
            </div>
          )}

          {chips.length === 0 && !lastVisit.notes && !lastVisit.recommendation && (
            <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.8rem', fontFamily: 'var(--font-inter, sans-serif)' }}>
              No cut notes recorded for this visit.
            </p>
          )}
        </div>

        {/* Private notes */}
        <div style={{
          margin: '0 1rem 1rem',
          background: 'rgba(200,241,53,0.03)', border: '1px solid rgba(200,241,53,0.1)',
          borderRadius: 8, padding: '0.75rem 0.9rem',
        }}>
          <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(200,241,53,0.4)', marginBottom: 4, fontFamily: 'var(--font-barlow, sans-serif)' }}>
            Private notes — just you
          </div>
          {lastVisit.privateNotes ? (
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.85rem', lineHeight: 1.5, margin: 0, fontFamily: 'var(--font-inter, sans-serif)' }}>
              {lastVisit.privateNotes}
            </p>
          ) : (
            <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.8rem', lineHeight: 1.5, margin: 0, fontStyle: 'italic', fontFamily: 'var(--font-inter, sans-serif)' }}>
              Your personal notes about this client — conversation details, preferences, anything you want to remember. Only you ever see these.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DemoBarbersPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [shopName, setShopName] = useState('Ben J Barbers');
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<Client | null>(null);
  const [showShare, setShowShare] = useState(false);

  const demoUrl = 'https://yourbarber.uk/demo/barber';

  useEffect(() => {
    fetch('/api/demo/passport', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => {
        setClients(d.clients ?? []);
        if (d.shopName) setShopName(d.shopName);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: '100dvh', background: '#0A0A0A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 900, fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
          Loading…
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100dvh', background: '#0A0A0A', color: 'white',
      maxWidth: 480, margin: '0 auto',
      display: 'flex', flexDirection: 'column',
      position: 'relative', overflow: 'hidden',
    }}>

      {/* ── PASSPORT VIEW (slides over queue) ── */}
      {active && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50,
          background: '#0A0A0A', overflowY: 'auto',
          maxWidth: 480, margin: '0 auto',
        }}>
          <PassportView client={active} onBack={() => setActive(null)} />
        </div>
      )}

      {/* ── QUEUE VIEW ── */}
      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(10,10,10,0.97)', backdropFilter: 'blur(8px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        padding: '0.9rem 1.1rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 6,
            background: 'rgba(200,241,53,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Scissors size={16} color="#C8F135" />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 900, fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.04em', lineHeight: 1.1 }}>
              {shopName}
            </div>
            <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-barlow, sans-serif)' }}>
              Barber view · Demo
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowShare(s => !s)}
          style={{
            background: showShare ? 'rgba(200,241,53,0.12)' : 'rgba(255,255,255,0.05)',
            border: showShare ? '1px solid rgba(200,241,53,0.3)' : '1px solid rgba(255,255,255,0.1)',
            borderRadius: 6, padding: '0.4rem 0.75rem', cursor: 'pointer',
            fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.1em', color: showShare ? '#C8F135' : 'rgba(255,255,255,0.5)',
            fontFamily: 'var(--font-barlow, sans-serif)',
          }}
        >
          Share
        </button>
      </div>

      {/* Share panel */}
      {showShare && (
        <div style={{
          background: '#111', borderBottom: '1px solid rgba(255,255,255,0.08)',
          padding: '1.25rem 1.1rem',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
        }}>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', textAlign: 'center', margin: 0, fontFamily: 'var(--font-inter, sans-serif)' }}>
            Let a barber scan this to try the demo on their own phone.
          </p>
          <div style={{ background: 'white', padding: 12, borderRadius: 10 }}>
            <QRCodeSVG value={demoUrl} size={160} bgColor="#ffffff" fgColor="#0A0A0A" level="M" />
          </div>
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.65rem', textAlign: 'center', margin: 0, fontFamily: 'var(--font-barlow, sans-serif)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            yourbarber.uk/demo/barber
          </p>
        </div>
      )}

      {/* Queue heading */}
      <div style={{
        padding: '1rem 1.1rem 0.5rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <Users size={13} color="rgba(255,255,255,0.3)" />
          <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-barlow, sans-serif)' }}>
            Waiting now
          </span>
        </div>
        {clients.length > 0 && (
          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#C8F135', fontFamily: 'var(--font-barlow, sans-serif)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            {clients.length} in queue
          </span>
        )}
      </div>

      {/* Client cards */}
      <div style={{ padding: '0 0.75rem', display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
        {clients.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'rgba(255,255,255,0.2)', fontSize: '0.85rem', fontFamily: 'var(--font-inter, sans-serif)' }}>
            No demo clients found. Add some visits with photos to Ben J Barbers first.
          </div>
        ) : (
          clients.map((client, i) => {
            const isNext = i === 0;
            const arrivedMins = ARRIVAL_OFFSETS[i] ?? 40;
            const hasPhotos = client.lastVisit.photos.length > 0;

            return (
              <button
                key={client.id}
                onClick={() => setActive(client)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                  background: isNext ? 'rgba(200,241,53,0.07)' : 'rgba(255,255,255,0.03)',
                  border: isNext ? '1px solid rgba(200,241,53,0.25)' : '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 10, padding: '0.9rem 1rem',
                  cursor: 'pointer', textAlign: 'left',
                  position: 'relative',
                }}
              >
                {/* Position bubble */}
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  background: isNext ? '#C8F135' : 'rgba(255,255,255,0.08)',
                  color: isNext ? '#0A0A0A' : 'rgba(255,255,255,0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.75rem', fontWeight: 900,
                  fontFamily: 'var(--font-barlow, sans-serif)',
                }}>
                  {i + 1}
                </div>

                {/* Avatar */}
                <div style={{
                  width: 40, height: 40, borderRadius: 8, flexShrink: 0,
                  background: 'rgba(255,255,255,0.07)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.95rem', fontWeight: 900,
                  fontFamily: 'var(--font-barlow, sans-serif)',
                  color: 'rgba(255,255,255,0.55)',
                }}>
                  {initials(client.name)}
                </div>

                {/* Name + meta */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 900, fontSize: '1rem', textTransform: 'uppercase', color: 'white', lineHeight: 1.2, marginBottom: 3 }}>
                    {client.name ?? 'Unknown'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.38)', fontFamily: 'var(--font-inter, sans-serif)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Clock size={10} /> Arrived {arrivedMins}m ago
                    </span>
                    <span>·</span>
                    <span>Last cut {weeksAgo(client.lastVisit.visitedAt)}</span>
                    {hasPhotos && (
                      <span style={{
                        background: 'rgba(200,241,53,0.08)', color: 'rgba(200,241,53,0.65)',
                        border: '1px solid rgba(200,241,53,0.15)',
                        fontSize: '0.6rem', fontWeight: 700, padding: '1px 5px', borderRadius: 3,
                        textTransform: 'uppercase', letterSpacing: '0.08em',
                        fontFamily: 'var(--font-barlow, sans-serif)',
                      }}>
                        {client.lastVisit.photos.length} photos
                      </span>
                    )}
                  </div>
                </div>

                <ArrowRight size={15} color={isNext ? '#C8F135' : 'rgba(255,255,255,0.2)'} style={{ flexShrink: 0 }} />
              </button>
            );
          })
        )}
      </div>

      {/* Bottom CTA — fixed */}
      <div style={{
        position: 'sticky', bottom: 0,
        background: 'rgba(10,10,10,0.97)', backdropFilter: 'blur(8px)',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        padding: '1rem 1.1rem',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        <a
          href="/demo"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            background: '#C8F135', color: '#0A0A0A',
            padding: '0.9rem', borderRadius: 6,
            fontSize: '0.85rem', fontWeight: 900, textTransform: 'uppercase',
            letterSpacing: '0.1em', textDecoration: 'none',
            fontFamily: 'var(--font-barlow, sans-serif)',
          }}
        >
          Get this for your shop <ArrowRight size={15} />
        </a>
        <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.65rem', textAlign: 'center', margin: 0, fontFamily: 'var(--font-inter, sans-serif)' }}>
          yourbarber.uk · Try free · No credit card
        </p>
      </div>
    </div>
  );
}
