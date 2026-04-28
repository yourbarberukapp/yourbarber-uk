'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { UserCheck, Check, X, Search, Clock, ChevronRight, Loader2, Scissors, Trash2 } from 'lucide-react';

type WalkInStatus = 'waiting' | 'in_progress' | 'done' | 'no_show';

interface WalkIn {
  id: string;
  note: string | null;
  preferredStyle: string | null;
  status: WalkInStatus;
  arrivedAt: string;
  customer: { id: string; name: string | null; phone: string; lastVisitAt: string | null };
  familyMember: { name: string | null } | null;
  isAway: boolean;
  returnByMinutes: number | null;
  queueReminderSentAt: string | null;
}

interface CustomerResult {
  id: string;
  name: string | null;
  phone: string;
  lastVisitAt: string | null;
}

type Tab = 'queue' | 'search';

function timeAgo(dateStr: string) {
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return days === 1 ? 'yesterday' : `${days} days ago`;
}

function initials(name: string | null) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

export default function BarberClient({ initialWalkIns, initialIsBusy }: { initialWalkIns: WalkIn[]; initialIsBusy: boolean }) {
  const [tab, setTab] = useState<Tab>('queue');
  const [walkIns, setWalkIns] = useState<WalkIn[]>(initialWalkIns);
  const [updating, setUpdating] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(initialIsBusy);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CustomerResult[]>([]);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch('/api/waitlist', { cache: 'no-store' });
    if (res.ok) setWalkIns(await res.json());
  }, []);

  useEffect(() => {
    const id = setInterval(refresh, 15000);
    return () => clearInterval(id);
  }, [refresh]);

  useEffect(() => {
    if (tab === 'search') setTimeout(() => searchRef.current?.focus(), 100);
  }, [tab]);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (query.length < 2) { setResults([]); return; }
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      const res = await fetch(`/api/customers?q=${encodeURIComponent(query)}`);
      if (res.ok) setResults(await res.json());
      setSearching(false);
    }, 300);
  }, [query]);

  async function setBarberBusy(busy: boolean) {
    setIsBusy(busy);
    await fetch('/api/barber/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isBusy: busy }),
    });
  }

  async function toggleBarberStatus() {
    setTogglingStatus(true);
    await setBarberBusy(!isBusy);
    setTogglingStatus(false);
  }

  async function updateStatus(id: string, status: WalkInStatus) {
    setUpdating(id);
    await fetch(`/api/waitlist/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    // Auto-sync barber availability with chair state
    if (status === 'in_progress') await setBarberBusy(true);
    if (status === 'done' || status === 'no_show') await setBarberBusy(false);
    await refresh();
    setUpdating(null);
  }

  async function sendReturnReminder(id: string) {
    setUpdating(id);
    await fetch(`/api/waitlist/${id}/return-reminder`, { method: 'POST' });
    await refresh();
    setUpdating(null);
  }

  async function deleteWalkIn(id: string) {
    if (!confirm('Remove this person from the queue?')) return;
    setUpdating(id);
    await fetch(`/api/waitlist/${id}`, { method: 'DELETE' });
    await refresh();
    setUpdating(null);
  }

  const active = walkIns.filter(w => w.status === 'waiting' || w.status === 'in_progress');

  const tabBtn = (t: Tab, label: string) => (
    <button
      onClick={() => setTab(t)}
      style={{
        flex: 1, padding: '0.75rem', border: 'none', cursor: 'pointer', borderRadius: 8,
        fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 700, fontSize: '0.8rem',
        textTransform: 'uppercase', letterSpacing: '0.08em', transition: 'all 0.15s',
        background: tab === t ? 'rgba(200,241,53,0.1)' : 'transparent',
        color: tab === t ? '#C8F135' : 'rgba(255,255,255,0.35)',
        borderBottom: tab === t ? '2px solid #C8F135' : '2px solid transparent',
      }}
    >
      {label} {t === 'queue' && active.length > 0 && (
        <span style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 18, height: 18, borderRadius: '50%',
          background: '#C8F135', color: '#0a0a0a',
          fontSize: '0.6rem', fontWeight: 900, marginLeft: 4,
        }}>
          {active.length}
        </span>
      )}
    </button>
  );

  return (
    <div style={{ maxWidth: 480, margin: '0 auto' }}>

      {/* Status toggle */}
      <button
        onClick={toggleBarberStatus}
        disabled={togglingStatus}
        style={{
          width: '100%', marginBottom: '1rem',
          padding: '1rem 1.25rem',
          background: isBusy ? 'rgba(255,255,255,0.04)' : 'rgba(200,241,53,0.08)',
          border: isBusy ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(200,241,53,0.25)',
          borderRadius: 12, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          transition: 'all 0.2s',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: 10, height: 10, borderRadius: '50%',
            background: isBusy ? 'rgba(255,255,255,0.2)' : '#C8F135',
            boxShadow: isBusy ? 'none' : '0 0 8px rgba(200,241,53,0.6)',
            flexShrink: 0,
          }} />
          <span style={{
            fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 900,
            fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.08em',
            color: isBusy ? 'rgba(255,255,255,0.35)' : '#C8F135',
          }}>
            {isBusy ? 'Busy — in chair' : 'Available'}
          </span>
        </div>
        <span style={{
          fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
          color: 'rgba(255,255,255,0.2)', fontFamily: 'var(--font-barlow, sans-serif)',
        }}>
          {togglingStatus ? '…' : 'Tap to change'}
        </span>
      </button>

      {/* Tabs */}
      <div style={{
        display: 'flex', background: '#111', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 10, marginBottom: '1.25rem', overflow: 'hidden',
      }}>
        {tabBtn('queue', 'Queue')}
        {tabBtn('search', 'Find client')}
      </div>

      {/* Queue tab */}
      {tab === 'queue' && (
        <div>
          {active.length === 0 ? (
            <div style={{
              background: '#111', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 12, padding: '3rem 1.5rem', textAlign: 'center',
            }}>
              <Clock size={32} color="rgba(255,255,255,0.1)" style={{ marginBottom: '0.75rem' }} />
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.95rem', margin: 0, fontFamily: 'var(--font-inter, sans-serif)' }}>
                Queue is empty
              </p>
              <p style={{ color: 'rgba(255,255,255,0.15)', fontSize: '0.8rem', margin: '0.375rem 0 0', fontFamily: 'var(--font-inter, sans-serif)' }}>
                Clients check in on their phone
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {active.map((w, i) => {
                const inChair = w.status === 'in_progress';
                const isUpdating = updating === w.id;
                const canSendReturnReminder = w.isAway && !w.queueReminderSentAt && i <= 1;
                return (
                  <div key={w.id} style={{
                    background: '#111',
                    border: inChair ? '1px solid rgba(200,241,53,0.25)' : '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 12,
                    boxShadow: inChair ? '0 0 20px rgba(200,241,53,0.05)' : 'none',
                  }}>
                    {/* Client row */}
                    <div style={{ padding: '1rem 1.125rem', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                      {/* Position */}
                      <span style={{
                        fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 900,
                        fontSize: '1.5rem', color: 'rgba(255,255,255,0.12)', width: 28, flexShrink: 0, lineHeight: 1,
                      }}>
                        {i + 1}
                      </span>

                      {/* Avatar */}
                      <div style={{
                        width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
                        background: inChair ? 'rgba(200,241,53,0.1)' : 'rgba(255,255,255,0.05)',
                        border: inChair ? '2px solid rgba(200,241,53,0.3)' : '1.5px solid rgba(255,255,255,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <span style={{
                          color: inChair ? '#C8F135' : 'rgba(255,255,255,0.5)',
                          fontWeight: 900, fontSize: '1rem',
                          fontFamily: 'var(--font-barlow, sans-serif)',
                        }}>
                          {initials(w.customer.name)}
                        </span>
                      </div>

                      {/* Name + meta */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span style={{
                            fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 800,
                            fontSize: '1.1rem', color: 'white', textTransform: 'uppercase',
                          }}>
                            {w.familyMember?.name || w.customer.name || 'Unknown'}
                          </span>
                          {w.familyMember && (
                            <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginLeft: 6 }}>
                              (Account: {w.customer.name})
                            </span>
                          )}
                          {inChair && (
                            <span style={{
                              fontSize: '0.55rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
                              background: 'rgba(200,241,53,0.12)', color: '#C8F135',
                              border: '1px solid rgba(200,241,53,0.25)',
                              padding: '0.15rem 0.45rem', borderRadius: 2,
                              fontFamily: 'var(--font-barlow, sans-serif)',
                            }}>
                              In chair
                            </span>
                          )}
                          {w.isAway && (
                            <span style={{
                              fontSize: '0.55rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
                              background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.55)',
                              border: '1px solid rgba(255,255,255,0.12)',
                              padding: '0.15rem 0.45rem', borderRadius: 2,
                              fontFamily: 'var(--font-barlow, sans-serif)',
                            }}>
                              Away {w.queueReminderSentAt ? '· text sent' : '· place held'}
                            </span>
                          )}
                        </div>
                        <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.7rem', fontFamily: 'monospace', marginTop: 2 }}>
                          {timeAgo(w.arrivedAt)} · {w.customer.phone}
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
                          <div style={{
                            color: 'rgba(255,255,255,0.45)', fontSize: '0.8rem',
                            fontFamily: 'var(--font-inter, sans-serif)', marginTop: 4, fontStyle: 'italic',
                          }}>
                            &ldquo;{w.note}&rdquo;
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{
                      borderTop: '1px solid rgba(255,255,255,0.05)',
                      padding: '0.75rem 1.125rem',
                      display: 'flex', gap: '0.5rem',
                    }}>
                      {isUpdating ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>
                          <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Updating…
                        </div>
                      ) : (
                        <>
                          {w.status === 'waiting' && (
                            <>
                              {canSendReturnReminder && (
                                <button
                                  onClick={() => sendReturnReminder(w.id)}
                                  style={{
                                    flex: 1, padding: '0.75rem', borderRadius: 8,
                                    background: 'rgba(200,241,53,0.08)', color: '#C8F135',
                                    border: '1px solid rgba(200,241,53,0.25)',
                                    fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 800,
                                    fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em',
                                    cursor: 'pointer',
                                  }}
                                >
                                  Text back
                                </button>
                              )}
                              <button
                                onClick={() => updateStatus(w.id, 'in_progress')}
                                style={{
                                  flex: 1, padding: '0.75rem', borderRadius: 8, border: 'none',
                                  background: '#C8F135', color: '#0a0a0a',
                                  fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 800,
                                  fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em',
                                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                }}
                              >
                                <UserCheck size={14} /> In chair
                              </button>
                            </>
                          )}
                          {w.status === 'in_progress' && (
                            <>
                              <button
                                onClick={() => updateStatus(w.id, 'done')}
                                style={{
                                  flex: 1, padding: '0.75rem', borderRadius: 8, border: 'none',
                                  background: '#C8F135', color: '#0a0a0a',
                                  fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 800,
                                  fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em',
                                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                }}
                              >
                                <Check size={14} /> Done
                              </button>
                              <Link
                                href={`/customers/${w.customer.id}/visit/new`}
                                style={{
                                  padding: '0.75rem 1rem', borderRadius: 8,
                                  background: 'rgba(200,241,53,0.08)', border: '1px solid rgba(200,241,53,0.2)',
                                  color: '#C8F135', textDecoration: 'none',
                                  fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 700,
                                  fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.06em',
                                  display: 'flex', alignItems: 'center', gap: 5,
                                }}
                              >
                                <Scissors size={13} /> Record
                              </Link>
                            </>
                          )}
                          <button
                            onClick={() => updateStatus(w.id, 'no_show')}
                            title="No show"
                            style={{
                              padding: '0.75rem', borderRadius: 8,
                              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                              color: 'rgba(255,255,255,0.3)', cursor: 'pointer',
                              display: 'flex', alignItems: 'center',
                            }}
                          >
                            <X size={14} />
                          </button>
                          <button
                            onClick={() => deleteWalkIn(w.id)}
                            title="Remove from queue"
                            style={{
                              padding: '0.75rem', borderRadius: 8,
                              background: 'rgba(255,80,80,0.06)', border: '1px solid rgba(255,80,80,0.14)',
                              color: 'rgba(255,120,120,0.6)', cursor: 'pointer',
                              display: 'flex', alignItems: 'center',
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                          <Link
                            href={`/customers/${w.customer.id}`}
                            style={{
                              padding: '0.75rem', borderRadius: 8,
                              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                              color: 'rgba(255,255,255,0.3)', textDecoration: 'none',
                              display: 'flex', alignItems: 'center',
                            }}
                          >
                            <ChevronRight size={14} />
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Search tab */}
      {tab === 'search' && (
        <div>
          <div style={{ position: 'relative', marginBottom: '1rem' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
            <input
              ref={searchRef}
              type="text"
              placeholder="Name or phone number…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              style={{
                width: '100%', boxSizing: 'border-box',
                background: '#111', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10, padding: '0.9rem 0.875rem 0.9rem 2.75rem',
                color: 'white', fontSize: '1rem', fontFamily: 'var(--font-inter, sans-serif)',
                outline: 'none',
              }}
            />
            {searching && (
              <Loader2 size={14} style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', animation: 'spin 1s linear infinite' }} />
            )}
          </div>

          {query.length >= 2 && results.length === 0 && !searching && (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.25)', fontSize: '0.875rem', fontFamily: 'var(--font-inter, sans-serif)' }}>
              No clients found
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {results.map(c => (
              <Link key={c.id} href={`/customers/${c.id}`} style={{
                background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10,
                padding: '1rem 1.125rem', textDecoration: 'none',
                display: 'flex', alignItems: 'center', gap: '0.875rem',
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                  background: 'rgba(200,241,53,0.08)', border: '1px solid rgba(200,241,53,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ color: '#C8F135', fontWeight: 900, fontSize: '0.85rem', fontFamily: 'var(--font-barlow, sans-serif)' }}>
                    {initials(c.name)}
                  </span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 800, fontSize: '1rem', color: 'white', textTransform: 'uppercase' }}>
                    {c.name ?? 'No name'}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', fontFamily: 'monospace', marginTop: 2 }}>
                    {c.phone}
                    {c.lastVisitAt && <span style={{ color: 'rgba(255,255,255,0.2)' }}> · {timeAgo(c.lastVisitAt)}</span>}
                  </div>
                </div>
                <ChevronRight size={16} color="rgba(255,255,255,0.2)" />
              </Link>
            ))}
          </div>

          {query.length < 2 && (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'rgba(255,255,255,0.2)', fontSize: '0.875rem', fontFamily: 'var(--font-inter, sans-serif)' }}>
              Type a name or phone number
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: rgba(255,255,255,0.2); }
        input:focus { border-color: rgba(200,241,53,0.35) !important; }
      `}</style>
    </div>
  );
}
