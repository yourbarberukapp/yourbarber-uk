'use client';

import { useEffect, useState, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Scissors, Clock, ChevronLeft, ArrowRight, Users, Radio } from 'lucide-react';

type CutDetails = {
  style?: string[];
  sidesGrade?: string;
  topLength?: string;
  beard?: string;
};

type Client = {
  id: string;
  walkInId: string | null;
  name: string | null;
  arrivedAt: string | null;
  status: string | null;
  note: string | null;
  lastVisit: {
    visitedAt: string;
    cutDetails: CutDetails | null;
    recommendation: string | null;
    notes: string | null;
    privateNotes: string | null;
    photos: { id: string; url: string; angle: string }[];
  } | null;
};

// Fallback arrival offsets for example data
const ARRIVAL_OFFSETS = [4, 11, 23, 37, 52, 68, 84, 99];

function minutesAgo(dateStr: string) {
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60_000);
  if (mins < 1) return 'just now';
  if (mins === 1) return '1m ago';
  return `${mins}m ago`;
}

function weeksAgo(dateStr: string) {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
  if (days === 0) return 'today';
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
  const photos = lastVisit
    ? [...lastVisit.photos].sort((a, b) => {
        const ai = ANGLE_ORDER.indexOf(a.angle);
        const bi = ANGLE_ORDER.indexOf(b.angle);
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
      })
    : [];

  const d = lastVisit?.cutDetails;
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
            {lastVisit ? `Last cut ${weeksAgo(lastVisit.visitedAt)}` : 'New client — no previous visit'}
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

        {/* Client note from check-in */}
        {client.note && (
          <div style={{
            margin: '0.75rem 1rem 0',
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8, padding: '0.65rem 0.85rem',
            display: 'flex', alignItems: 'flex-start', gap: 8,
          }}>
            <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-barlow, sans-serif)', flexShrink: 0, marginTop: 2 }}>Today</div>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', lineHeight: 1.5, margin: 0, fontFamily: 'var(--font-inter, sans-serif)' }}>{client.note}</p>
          </div>
        )}

        {/* No previous visit */}
        {!lastVisit && (
          <div style={{
            margin: '1rem', background: '#111', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 10, padding: '2rem', textAlign: 'center',
          }}>
            <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.85rem', fontFamily: 'var(--font-inter, sans-serif)', marginBottom: 6 }}>
              First visit to this shop
            </div>
            <div style={{ color: 'rgba(255,255,255,0.15)', fontSize: '0.75rem', fontFamily: 'var(--font-inter, sans-serif)' }}>
              Record their cut today to start their passport.
            </div>
          </div>
        )}

        {/* Photos */}
        {photos.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: photos.length === 1 ? '1fr' : '1fr 1fr',
            gap: 2,
            marginTop: client.note ? '0.75rem' : 0,
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
        )}

        {/* Cut details */}
        {lastVisit && (
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
          </div>
        )}

        {/* Private notes */}
        {lastVisit && (
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
                Your personal notes about this client. Only you ever see these.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DemoBarbersPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [shopName, setShopName] = useState('Ben J Barbers');
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<Client | null>(null);
  const [showShare, setShowShare] = useState(false);

  const demoUrl = 'https://yourbarber.uk/demo/barber';
  const arriveUrl = 'https://yourbarber.uk/arrive/benj-barbers';

  const fetchQueue = useCallback(() => {
    fetch('/api/demo/queue', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => {
        setClients(d.clients ?? []);
        setIsLive(d.isLive ?? false);
        if (d.shopName) setShopName(d.shopName);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 8_000);
    return () => clearInterval(interval);
  }, [fetchQueue]);

  // Keep active client in sync with latest data
  useEffect(() => {
    if (active) {
      const updated = clients.find(c => c.id === active.id);
      if (updated) setActive(updated);
    }
  }, [clients, active]);

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

      {/* ── PASSPORT VIEW ── */}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              {isLive ? (
                <>
                  <Radio size={9} color="#C8F135" />
                  <span style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#C8F135', fontFamily: 'var(--font-barlow, sans-serif)' }}>
                    Live queue
                  </span>
                </>
              ) : (
                <span style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-barlow, sans-serif)' }}>
                  Example data · queue empty
                </span>
              )}
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
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
        }}>
          <div style={{ display: 'flex', gap: 14, width: '100%' }}>
            {/* Barber demo QR */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{ background: 'white', padding: 10, borderRadius: 8 }}>
                <QRCodeSVG value={demoUrl} size={110} bgColor="#ffffff" fgColor="#0A0A0A" level="M" />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-barlow, sans-serif)' }}>
                  Barber view
                </div>
                <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.6rem', fontFamily: 'var(--font-inter, sans-serif)', marginTop: 2 }}>
                  Let them try this demo
                </div>
              </div>
            </div>

            {/* Customer arrival QR */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{ background: 'white', padding: 10, borderRadius: 8 }}>
                <QRCodeSVG value={arriveUrl} size={110} bgColor="#ffffff" fgColor="#0A0A0A" level="M" />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#C8F135', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-barlow, sans-serif)' }}>
                  Customer scan
                </div>
                <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.6rem', fontFamily: 'var(--font-inter, sans-serif)', marginTop: 2 }}>
                  Scan to join the live queue
                </div>
              </div>
            </div>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.72rem', textAlign: 'center', margin: 0, fontFamily: 'var(--font-inter, sans-serif)', lineHeight: 1.5 }}>
            Customer scans the right QR → they appear on this screen within 8 seconds.
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
            {isLive ? 'Waiting now' : 'Example clients'}
          </span>
        </div>
        {clients.length > 0 && (
          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: isLive ? '#C8F135' : 'rgba(255,255,255,0.25)', fontFamily: 'var(--font-barlow, sans-serif)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            {clients.length} {isLive ? 'in queue' : 'clients'}
          </span>
        )}
      </div>

      {/* Client cards */}
      <div style={{ padding: '0 0.75rem', display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
        {clients.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'rgba(255,255,255,0.2)', fontSize: '0.85rem', fontFamily: 'var(--font-inter, sans-serif)' }}>
            Queue is empty.
          </div>
        ) : (
          clients.map((client, i) => {
            const isNext = i === 0;
            const arrivedDisplay = client.arrivedAt
              ? minutesAgo(client.arrivedAt)
              : `${ARRIVAL_OFFSETS[i] ?? 99}m ago`;
            const hasPhotos = (client.lastVisit?.photos.length ?? 0) > 0;
            const hasPassport = !!client.lastVisit;

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
                }}
              >
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

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 900, fontSize: '1rem', textTransform: 'uppercase', color: 'white', lineHeight: 1.2, marginBottom: 3 }}>
                    {client.name ?? 'Unknown'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.38)', fontFamily: 'var(--font-inter, sans-serif)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Clock size={10} /> {arrivedDisplay}
                    </span>
                    {hasPassport && (
                      <>
                        <span>·</span>
                        <span>Last cut {weeksAgo(client.lastVisit!.visitedAt)}</span>
                      </>
                    )}
                    {!hasPassport && client.walkInId && (
                      <>
                        <span>·</span>
                        <span style={{ color: 'rgba(255,255,255,0.25)' }}>New client</span>
                      </>
                    )}
                    {hasPhotos && (
                      <span style={{
                        background: 'rgba(200,241,53,0.08)', color: 'rgba(200,241,53,0.65)',
                        border: '1px solid rgba(200,241,53,0.15)',
                        fontSize: '0.6rem', fontWeight: 700, padding: '1px 5px', borderRadius: 3,
                        textTransform: 'uppercase', letterSpacing: '0.08em',
                        fontFamily: 'var(--font-barlow, sans-serif)',
                      }}>
                        {client.lastVisit!.photos.length} photos
                      </span>
                    )}
                    {client.note && (
                      <span style={{
                        background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        fontSize: '0.6rem', fontWeight: 700, padding: '1px 5px', borderRadius: 3,
                        textTransform: 'uppercase', letterSpacing: '0.08em',
                        fontFamily: 'var(--font-barlow, sans-serif)',
                        maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {client.note}
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

      {/* Bottom CTA */}
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
