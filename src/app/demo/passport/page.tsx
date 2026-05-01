'use client';

import { useEffect, useState } from 'react';
import { Scissors, Clock, ChevronDown, ChevronUp, Star } from 'lucide-react';

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
    photos: { id: string; url: string; angle: string }[];
  };
};

type Data = {
  shopName: string;
  clients: Client[];
};

function timeAgo(dateStr: string) {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function initials(name: string | null) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

function PassportPanel({ client }: { client: Client }) {
  const { lastVisit } = client;
  const details = lastVisit.cutDetails as CutDetails | null;
  const photos = lastVisit.photos;

  const chips: string[] = [];
  if (details?.style?.length) chips.push(...details.style);
  if (details?.sidesGrade) chips.push(`Grade ${details.sidesGrade} sides`);
  if (details?.topLength) chips.push(details.topLength);
  if (details?.beard && details.beard !== 'Not done') chips.push(details.beard);

  return (
    <div style={{
      background: '#111',
      borderRadius: 12,
      border: '1px solid rgba(255,255,255,0.08)',
      overflow: 'hidden',
      marginTop: 4,
    }}>
      {/* Photos grid */}
      {photos.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: photos.length === 1 ? '1fr' : '1fr 1fr',
          gap: 2,
          background: '#0A0A0A',
        }}>
          {photos.slice(0, 4).map((photo) => (
            <div key={photo.id} style={{ position: 'relative', aspectRatio: '1', background: '#1a1a1a' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt={photo.angle}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
              <span style={{
                position: 'absolute', bottom: 4, left: 4,
                background: 'rgba(0,0,0,0.65)',
                color: 'rgba(255,255,255,0.7)',
                fontSize: '0.65rem', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.07em',
                padding: '2px 6px', borderRadius: 3,
                fontFamily: 'var(--font-barlow, sans-serif)',
              }}>
                {photo.angle}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Cut details */}
      <div style={{ padding: '1rem 1.1rem' }}>
        {chips.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: '0.85rem' }}>
            {chips.map(chip => (
              <span key={chip} style={{
                background: 'rgba(200,241,53,0.1)',
                color: '#C8F135',
                border: '1px solid rgba(200,241,53,0.2)',
                fontSize: '0.75rem', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.05em',
                padding: '3px 9px', borderRadius: 20,
                fontFamily: 'var(--font-barlow, sans-serif)',
              }}>
                {chip}
              </span>
            ))}
          </div>
        )}

        {lastVisit.notes && (
          <p style={{
            color: 'rgba(255,255,255,0.55)',
            fontSize: '0.85rem',
            lineHeight: 1.5,
            marginBottom: '0.75rem',
            fontFamily: 'var(--font-inter, sans-serif)',
          }}>
            {lastVisit.notes}
          </p>
        )}

        {lastVisit.recommendation && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(200,241,53,0.06)',
            border: '1px solid rgba(200,241,53,0.15)',
            borderRadius: 8, padding: '0.6rem 0.85rem',
          }}>
            <Clock size={13} color="#C8F135" />
            <span style={{
              color: '#C8F135', fontSize: '0.8rem', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.06em',
              fontFamily: 'var(--font-barlow, sans-serif)',
            }}>
              {lastVisit.recommendation}
            </span>
          </div>
        )}

        {chips.length === 0 && !lastVisit.notes && !lastVisit.recommendation && (
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', fontFamily: 'var(--font-inter, sans-serif)' }}>
            No cut notes recorded for this visit.
          </p>
        )}
      </div>
    </div>
  );
}

export default function DemoPassportPage() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/demo/passport', { cache: 'no-store' })
      .then(r => r.json())
      .then((d: Data) => {
        setData(d);
        if (d.clients.length > 0) setOpenId(d.clients[0].id);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{
        minHeight: '100dvh', background: '#0A0A0A', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 900, fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
          Loading…
        </div>
      </div>
    );
  }

  if (!data || data.clients.length === 0) {
    return (
      <div style={{
        minHeight: '100dvh', background: '#0A0A0A', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: '2rem',
      }}>
        <Scissors size={32} color="rgba(255,255,255,0.15)" style={{ marginBottom: '1rem' }} />
        <p style={{
          color: 'rgba(255,255,255,0.35)', textAlign: 'center', lineHeight: 1.6,
          fontFamily: 'var(--font-inter, sans-serif)', fontSize: '0.9rem',
        }}>
          No cut history with photos found in the Ben J Barbers demo shop.
          <br />Record a few visits with photos to see the passport demo.
        </p>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: '#0A0A0A',
      color: 'white',
      maxWidth: 480,
      margin: '0 auto',
      padding: '0 0 2rem',
    }}>

      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(10,10,10,0.95)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '0.9rem 1.1rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 6,
            background: 'rgba(200,241,53,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Scissors size={16} color="#C8F135" />
          </div>
          <div>
            <div style={{
              fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 900,
              fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1.1,
            }}>
              {data.shopName}
            </div>
            <div style={{
              fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)',
              fontFamily: 'var(--font-barlow, sans-serif)',
            }}>
              Barber view
            </div>
          </div>
        </div>
        <span style={{
          background: 'rgba(200,241,53,0.1)',
          color: '#C8F135',
          border: '1px solid rgba(200,241,53,0.25)',
          fontSize: '0.6rem', fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.12em',
          padding: '3px 8px', borderRadius: 3,
          fontFamily: 'var(--font-barlow, sans-serif)',
        }}>
          Demo
        </span>
      </div>

      {/* Section label */}
      <div style={{
        padding: '1.1rem 1.1rem 0.5rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{
          fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.18em', color: 'rgba(255,255,255,0.3)',
          fontFamily: 'var(--font-barlow, sans-serif)',
        }}>
          Waiting now
        </span>
        <span style={{
          fontSize: '0.65rem', fontWeight: 700,
          color: '#C8F135', fontFamily: 'var(--font-barlow, sans-serif)',
          textTransform: 'uppercase', letterSpacing: '0.12em',
        }}>
          {data.clients.length} in queue
        </span>
      </div>

      {/* Client list */}
      <div style={{ padding: '0 0.75rem', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {data.clients.map((client, i) => {
          const isOpen = openId === client.id;
          const hasPhotos = client.lastVisit.photos.length > 0;

          return (
            <div key={client.id}>
              {/* Client row */}
              <button
                onClick={() => setOpenId(isOpen ? null : client.id)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                  background: isOpen ? 'rgba(200,241,53,0.06)' : 'rgba(255,255,255,0.03)',
                  border: isOpen ? '1px solid rgba(200,241,53,0.2)' : '1px solid rgba(255,255,255,0.07)',
                  borderRadius: isOpen ? '10px 10px 0 0' : 10,
                  padding: '0.85rem 1rem',
                  cursor: 'pointer', textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
              >
                {/* Position */}
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  background: i === 0 ? '#C8F135' : 'rgba(255,255,255,0.08)',
                  color: i === 0 ? '#0A0A0A' : 'rgba(255,255,255,0.5)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.75rem', fontWeight: 900,
                  fontFamily: 'var(--font-barlow, sans-serif)',
                }}>
                  {i + 1}
                </div>

                {/* Avatar */}
                <div style={{
                  width: 38, height: 38, borderRadius: 8, flexShrink: 0,
                  background: 'rgba(255,255,255,0.07)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.9rem', fontWeight: 900,
                  fontFamily: 'var(--font-barlow, sans-serif)',
                  color: 'rgba(255,255,255,0.6)',
                }}>
                  {initials(client.name)}
                </div>

                {/* Name + meta */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 900,
                    fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.03em',
                    color: 'white', lineHeight: 1.2, marginBottom: 2,
                  }}>
                    {client.name ?? 'Unknown'}
                  </div>
                  <div style={{
                    fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)',
                    fontFamily: 'var(--font-inter, sans-serif)',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    <Clock size={10} />
                    Last cut {timeAgo(client.lastVisit.visitedAt)}
                    {hasPhotos && (
                      <span style={{
                        background: 'rgba(200,241,53,0.08)',
                        color: 'rgba(200,241,53,0.7)',
                        border: '1px solid rgba(200,241,53,0.15)',
                        fontSize: '0.6rem', fontWeight: 700,
                        padding: '1px 5px', borderRadius: 3,
                        textTransform: 'uppercase', letterSpacing: '0.08em',
                        fontFamily: 'var(--font-barlow, sans-serif)',
                      }}>
                        {client.lastVisit.photos.length} photos
                      </span>
                    )}
                  </div>
                </div>

                {/* Chevron */}
                <div style={{ color: isOpen ? '#C8F135' : 'rgba(255,255,255,0.2)', flexShrink: 0 }}>
                  {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </button>

              {/* Passport panel — slides in when open */}
              {isOpen && <PassportPanel client={client} />}
            </div>
          );
        })}
      </div>

      {/* Bottom hint */}
      <div style={{
        margin: '2rem 1.1rem 0',
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 10, padding: '1rem',
        display: 'flex', alignItems: 'flex-start', gap: 10,
      }}>
        <Star size={14} color="rgba(200,241,53,0.5)" style={{ flexShrink: 0, marginTop: 2 }} />
        <p style={{
          color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem',
          lineHeight: 1.55, fontFamily: 'var(--font-inter, sans-serif)', margin: 0,
        }}>
          Tap any client to see their Cut Passport — the photos, grades, and notes from their last visit. This is what your barbers see the moment someone sits in the chair.
        </p>
      </div>
    </div>
  );
}
