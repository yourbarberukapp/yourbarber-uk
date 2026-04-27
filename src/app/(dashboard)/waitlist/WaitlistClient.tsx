'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Loader2, UserCheck, Check, X, Clock, ArrowRight } from 'lucide-react';

type WalkInStatus = 'waiting' | 'in_progress' | 'done' | 'no_show';

interface WalkInCustomer {
  id: string;
  name: string | null;
  phone: string;
  lastVisitAt: string | null;
}

interface WalkIn {
  id: string;
  note: string | null;
  preferredStyle: string | null;
  status: WalkInStatus;
  arrivedAt: string;
  customer: WalkInCustomer;
}

function timeAgo(dateStr: string) {
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins === 1) return '1 min ago';
  if (mins < 60) return `${mins} mins ago`;
  const hrs = Math.floor(mins / 60);
  return hrs === 1 ? '1 hour ago' : `${hrs} hours ago`;
}

function initials(name: string | null) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

const STATUS_CONFIG = {
  waiting:     { label: 'Waiting',     color: 'rgba(255,255,255,0.5)',  bg: 'rgba(255,255,255,0.06)',  border: 'rgba(255,255,255,0.1)' },
  in_progress: { label: 'In chair',    color: '#C8F135',               bg: 'rgba(200,241,53,0.08)',   border: 'rgba(200,241,53,0.2)' },
  done:        { label: 'Done',        color: 'rgba(255,255,255,0.25)', bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.06)' },
  no_show:     { label: 'No show',     color: 'rgba(255,100,100,0.6)',  bg: 'rgba(255,100,100,0.04)', border: 'rgba(255,100,100,0.12)' },
};

interface Barber {
  id: string;
  name: string;
  isBusy: boolean;
}

export default function WaitlistClient({ initialWalkIns, initialBarbers, defaultCutTime }: { initialWalkIns: WalkIn[]; initialBarbers: Barber[]; defaultCutTime: number }) {
  const [walkIns, setWalkIns] = useState<WalkIn[]>(initialWalkIns);
  const [updating, setUpdating] = useState<string | null>(null);
  const [barbers, setBarbers] = useState<Barber[]>(initialBarbers);

  const refresh = useCallback(async () => {
    const [waitlistRes, barbersRes] = await Promise.all([
      fetch('/api/waitlist', { cache: 'no-store' }),
      fetch('/api/barbers', { cache: 'no-store' }),
    ]);
    if (waitlistRes.ok) setWalkIns(await waitlistRes.json());
    if (barbersRes.ok) setBarbers(await barbersRes.json());
  }, []);

  // Poll every 20 seconds
  useEffect(() => {
    const id = setInterval(refresh, 20000);
    return () => clearInterval(id);
  }, [refresh]);

  async function updateStatus(id: string, status: WalkInStatus) {
    setUpdating(id);
    await fetch(`/api/waitlist/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    await refresh();
    setUpdating(null);
  }

  const active = walkIns.filter(w => w.status === 'waiting' || w.status === 'in_progress');

  return (
    <div>
      {/* Barber availability panel */}
      {barbers.length > 0 && (
        <div style={{
          background: '#111', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12, padding: '0.875rem 1.125rem',
          marginBottom: '1.25rem',
          display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
        }}>
          <span style={{
            fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
            color: 'rgba(255,255,255,0.25)', fontFamily: 'var(--font-barlow, sans-serif)', flexShrink: 0,
          }}>
            Barbers
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.625rem' }}>
            {barbers.map(b => (
              <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                  background: b.isBusy ? 'rgba(255,255,255,0.2)' : '#C8F135',
                  boxShadow: b.isBusy ? 'none' : '0 0 6px rgba(200,241,53,0.5)',
                }} />
                <span style={{
                  fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em',
                  color: b.isBusy ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.75)',
                  fontFamily: 'var(--font-barlow, sans-serif)',
                }}>
                  {b.name.split(' ')[0]}
                </span>
                {b.isBusy && (
                  <span style={{
                    fontSize: '0.55rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                    color: 'rgba(255,255,255,0.2)', fontFamily: 'var(--font-barlow, sans-serif)',
                  }}>
                    busy
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {active.length === 0 ? (
        <div style={{
          background: '#111', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12,
          padding: '3rem', textAlign: 'center',
        }}>
          <Clock size={28} color="rgba(255,255,255,0.15)" style={{ marginBottom: '0.75rem' }} />
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.875rem', margin: 0, fontFamily: 'var(--font-inter, sans-serif)' }}>
            No one in the queue yet.
          </p>
          <p style={{ color: 'rgba(255,255,255,0.15)', fontSize: '0.8rem', marginTop: '0.375rem', fontFamily: 'var(--font-inter, sans-serif)' }}>
            Clients check in by scanning the QR code on your wall.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {active.map((w, i) => {
            const cfg = STATUS_CONFIG[w.status];
            const isUpdating = updating === w.id;
            const barberCount = Math.max(barbers.length, 1);
            const waitMins = w.status === 'in_progress' ? 0 : Math.ceil((i / barberCount) * defaultCutTime);
            return (
              <div key={w.id} style={{
                background: '#111', border: `1px solid ${cfg.border}`,
                borderRadius: 12, padding: '1rem 1.25rem',
                display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
              }}>
                {/* Position + avatar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: '1 1 200px', minWidth: 0 }}>
                  <span style={{
                    fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 900,
                    fontSize: '1.25rem', color: 'rgba(255,255,255,0.15)', width: 24, flexShrink: 0,
                  }}>
                    {i + 1}
                  </span>
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                    background: cfg.bg, border: `1.5px solid ${cfg.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ color: cfg.color, fontWeight: 900, fontSize: '0.875rem', fontFamily: 'var(--font-barlow, sans-serif)' }}>
                      {initials(w.customer.name)}
                    </span>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 800, fontSize: '1rem', color: 'white', textTransform: 'uppercase' }}>
                        {w.customer.name ?? 'Unknown'}
                      </span>
                      <span style={{
                        fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
                        padding: '0.15rem 0.5rem', borderRadius: 3,
                        background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
                        fontFamily: 'var(--font-barlow, sans-serif)',
                      }}>
                        {cfg.label}
                      </span>
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', fontFamily: 'monospace', marginTop: 2 }}>
                      {w.customer.phone}
                    </div>
                    {w.preferredStyle && (() => {
                      try {
                        const styles: string[] = JSON.parse(w.preferredStyle);
                        return styles.length > 0 ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: 5 }}>
                            {styles.map(s => (
                              <span key={s} style={{
                                fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase',
                                background: 'rgba(200,241,53,0.1)', color: '#C8F135',
                                border: '1px solid rgba(200,241,53,0.2)', borderRadius: 3,
                                padding: '0.1rem 0.4rem',
                                fontFamily: 'var(--font-barlow, sans-serif)',
                              }}>
                                {s}
                              </span>
                            ))}
                          </div>
                        ) : null;
                      } catch { return null; }
                    })()}
                    {w.note && (
                      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', fontFamily: 'var(--font-inter, sans-serif)', marginTop: 4, fontStyle: 'italic' }}>
                        &ldquo;{w.note}&rdquo;
                      </div>
                    )}
                    <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.7rem', fontFamily: 'var(--font-inter, sans-serif)', marginTop: 4 }}>
                      Arrived {timeAgo(w.arrivedAt)}
                      {w.customer.lastVisitAt && (
                        <span> · Last cut {timeAgo(w.customer.lastVisitAt)}</span>
                      )}
                      {w.status === 'waiting' && (
                        <span style={{ color: waitMins === 0 ? '#C8F135' : 'rgba(255,255,255,0.3)' }}>
                          {' · '}
                          {waitMins === 0 ? 'Up next' : `~${waitMins} min wait`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                  {isUpdating ? (
                    <Loader2 size={18} color="rgba(255,255,255,0.3)" style={{ animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <>
                      {w.status === 'waiting' && (
                        <button
                          onClick={() => updateStatus(w.id, 'in_progress')}
                          title="Start cut"
                          style={{
                            background: 'rgba(200,241,53,0.1)', border: '1px solid rgba(200,241,53,0.25)',
                            color: '#C8F135', borderRadius: 6, padding: '0.5rem 0.875rem',
                            fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                            cursor: 'pointer', fontFamily: 'var(--font-barlow, sans-serif)',
                            display: 'flex', alignItems: 'center', gap: 5,
                          }}
                        >
                          <UserCheck size={13} /> In chair
                        </button>
                      )}
                      {w.status === 'in_progress' && (
                        <button
                          onClick={() => updateStatus(w.id, 'done')}
                          title="Done"
                          style={{
                            background: 'rgba(200,241,53,0.1)', border: '1px solid rgba(200,241,53,0.25)',
                            color: '#C8F135', borderRadius: 6, padding: '0.5rem 0.875rem',
                            fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                            cursor: 'pointer', fontFamily: 'var(--font-barlow, sans-serif)',
                            display: 'flex', alignItems: 'center', gap: 5,
                          }}
                        >
                          <Check size={13} /> Done
                        </button>
                      )}
                      <button
                        onClick={() => updateStatus(w.id, 'no_show')}
                        title="No show"
                        style={{
                          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                          color: 'rgba(255,255,255,0.35)', borderRadius: 6, padding: '0.5rem',
                          cursor: 'pointer', display: 'flex', alignItems: 'center',
                        }}
                      >
                        <X size={13} />
                      </button>
                      <Link
                        href={`/customers/${w.customer.id}`}
                        title="View profile"
                        style={{
                          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                          color: 'rgba(255,255,255,0.35)', borderRadius: 6, padding: '0.5rem',
                          display: 'flex', alignItems: 'center', textDecoration: 'none',
                        }}
                      >
                        <ArrowRight size={13} />
                      </Link>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
