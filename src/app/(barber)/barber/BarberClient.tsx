'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { UserCheck, Check, X, Search, Clock, ChevronRight, Loader2, Scissors, Trash2 } from 'lucide-react';

type WalkInStatus = 'waiting' | 'in_progress' | 'done' | 'no_show';

interface LastVisit {
  visitedAt: string;
  cutDetails: {
    style?: string[];
    sidesGrade?: string;
    topLength?: string;
    beard?: string;
  } | null;
  notes: string | null;
}

interface WalkIn {
  id: string;
  note: string | null;
  preferredStyle: string | null;
  status: WalkInStatus;
  arrivedAt: string;
  customer: {
    id: string;
    name: string | null;
    phone: string;
    lastVisitAt: string | null;
    visits: LastVisit[];
  };
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
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

function initials(name: string | null) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

function parseNote(note: string | null): { preferredBarber: string | null; text: string | null } {
  if (!note) return { preferredBarber: null, text: null };
  const match = note.match(/^See:\s*([^\n]+)(?:\n([\s\S]+))?/);
  if (match) {
    return { preferredBarber: match[1].trim(), text: match[2]?.trim() || null };
  }
  return { preferredBarber: null, text: note.trim() || null };
}

function formatCutSummary(cutDetails: LastVisit['cutDetails']): string | null {
  if (!cutDetails) return null;
  const parts: string[] = [];
  if (cutDetails.style?.length) parts.push(cutDetails.style.join(', '));
  if (cutDetails.sidesGrade) parts.push(`#${cutDetails.sidesGrade} sides`);
  if (cutDetails.topLength) parts.push(cutDetails.topLength);
  if (cutDetails.beard && cutDetails.beard !== 'none') parts.push(`beard: ${cutDetails.beard}`);
  return parts.length ? parts.join(' · ') : null;
}

export default function BarberClient({
  initialWalkIns,
  initialIsBusy,
}: {
  initialWalkIns: WalkIn[];
  initialIsBusy: boolean;
}) {
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
    const id = setInterval(refresh, 8000);
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
    const previous = walkIns;
    setUpdating(id);
    setWalkIns(current => current.filter(w => w.id !== id));
    const res = await fetch(`/api/waitlist/${id}`, { method: 'DELETE' });
    if (!res.ok) setWalkIns(previous);
    else await refresh();
    setUpdating(null);
  }

  const active = walkIns.filter(w => w.status === 'waiting' || w.status === 'in_progress');
  const inChair = active.filter(w => w.status === 'in_progress');
  const waiting = active.filter(w => w.status === 'waiting');

  return (
    <div style={{ maxWidth: 480, margin: '0 auto' }}>

      {/* Availability toggle */}
      <button
        onClick={toggleBarberStatus}
        disabled={togglingStatus}
        style={{
          width: '100%', marginBottom: '1rem', padding: '1rem 1.25rem',
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
        {(['queue', 'search'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1, padding: '0.75rem', border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 700,
              fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em',
              transition: 'all 0.15s',
              background: tab === t ? 'rgba(200,241,53,0.1)' : 'transparent',
              color: tab === t ? '#C8F135' : 'rgba(255,255,255,0.35)',
              borderBottom: tab === t ? '2px solid #C8F135' : '2px solid transparent',
            }}
          >
            {t === 'queue' ? 'Queue' : 'Find client'}
            {t === 'queue' && active.length > 0 && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 18, height: 18, borderRadius: '50%',
                background: '#C8F135', color: '#0a0a0a',
                fontSize: '0.6rem', fontWeight: 900, marginLeft: 6,
              }}>
                {active.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Queue tab */}
      {tab === 'queue' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {active.length === 0 ? (
            <div style={{
              background: '#111', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 12, padding: '3rem 1.5rem', textAlign: 'center',
            }}>
              <Clock size={32} color="rgba(255,255,255,0.1)" style={{ marginBottom: '0.75rem' }} />
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.95rem', margin: 0 }}>Queue is empty</p>
              <p style={{ color: 'rgba(255,255,255,0.15)', fontSize: '0.8rem', margin: '0.375rem 0 0' }}>
                Clients check in on their phone
              </p>
            </div>
          ) : (
            <>
              {inChair.length > 0 && (
                <SectionLabel icon={<Scissors size={13} />} label="In the chair" color="#C8F135" />
              )}
              {inChair.map(w => (
                <QueueCard key={w.id} walkIn={w} position="chair" isUpdating={updating === w.id}
                  onDone={() => updateStatus(w.id, 'done')} onNoShow={() => updateStatus(w.id, 'no_show')}
                  onDelete={() => deleteWalkIn(w.id)} onInChair={() => updateStatus(w.id, 'in_progress')}
                  onReturnReminder={() => sendReturnReminder(w.id)} canSendReturnReminder={false} />
              ))}

              {waiting.length > 0 && (
                <SectionLabel icon={<Clock size={13} />} label="Waiting" color="rgba(255,255,255,0.35)"
                  style={{ marginTop: inChair.length > 0 ? '0.5rem' : 0 }} />
              )}
              {waiting.map((w, i) => (
                <QueueCard key={w.id} walkIn={w} position={i + 1} isUpdating={updating === w.id}
                  onDone={() => updateStatus(w.id, 'done')} onNoShow={() => updateStatus(w.id, 'no_show')}
                  onDelete={() => deleteWalkIn(w.id)} onInChair={() => updateStatus(w.id, 'in_progress')}
                  onReturnReminder={() => sendReturnReminder(w.id)}
                  canSendReturnReminder={w.isAway && !w.queueReminderSentAt && i <= 1} />
              ))}
            </>
          )}
        </div>
      )}

      {/* Search tab */}
      {tab === 'search' && (
        <div>
          <div style={{ position: 'relative', marginBottom: '1rem' }}>
            <Search size={16} style={{
              position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)',
              color: 'rgba(255,255,255,0.3)', pointerEvents: 'none',
            }} />
            <input
              ref={searchRef} type="text" placeholder="Name or phone number…"
              value={query} onChange={e => setQuery(e.target.value)}
              style={{
                width: '100%', boxSizing: 'border-box',
                background: '#111', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10, padding: '0.9rem 0.875rem 0.9rem 2.75rem',
                color: 'white', fontSize: '1rem', fontFamily: 'var(--font-inter, sans-serif)', outline: 'none',
              }}
            />
            {searching && (
              <Loader2 size={14} style={{
                position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)',
                color: 'rgba(255,255,255,0.3)', animation: 'spin 1s linear infinite',
              }} />
            )}
          </div>

          {query.length >= 2 && results.length === 0 && !searching && (
            <p style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.25)', fontSize: '0.875rem', margin: 0 }}>
              No clients found
            </p>
          )}
          {query.length < 2 && (
            <p style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'rgba(255,255,255,0.2)', fontSize: '0.875rem', margin: 0 }}>
              Type a name or phone number
            </p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {results.map(c => (
              <Link key={c.id} href={`/customers/${c.id}`} style={{
                background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10,
                padding: '1rem 1.125rem', textDecoration: 'none',
                display: 'flex', alignItems: 'center', gap: '0.875rem',
              }}>
                <Avatar name={c.name} size={44} />
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

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ icon, label, color, style: extra }: {
  icon: React.ReactNode; label: string; color: string; style?: React.CSSProperties;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.5rem', color,
      fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 900,
      textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: '0.7rem', ...extra,
    }}>
      {icon} {label}
    </div>
  );
}

function Avatar({ name, size = 48, active = false }: { name: string | null; size?: number; active?: boolean }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: active ? 'rgba(200,241,53,0.1)' : 'rgba(255,255,255,0.05)',
      border: active ? '2px solid rgba(200,241,53,0.3)' : '1.5px solid rgba(255,255,255,0.1)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <span style={{
        color: active ? '#C8F135' : 'rgba(255,255,255,0.5)',
        fontWeight: 900, fontSize: size * 0.35,
        fontFamily: 'var(--font-barlow, sans-serif)',
      }}>
        {initials(name)}
      </span>
    </div>
  );
}

function QueueCard({
  walkIn: w, position, isUpdating,
  onDone, onNoShow, onDelete, onInChair, onReturnReminder, canSendReturnReminder,
}: {
  walkIn: WalkIn;
  position: number | 'chair';
  isUpdating: boolean;
  onDone: () => void;
  onNoShow: () => void;
  onDelete: () => void;
  onInChair: () => void;
  onReturnReminder: () => void;
  canSendReturnReminder: boolean;
}) {
  const isInChair = w.status === 'in_progress';
  const { preferredBarber, text: noteText } = parseNote(w.note);
  const lastVisit = w.customer.visits?.[0] ?? null;
  const cutSummary = lastVisit ? formatCutSummary(lastVisit.cutDetails) : null;
  const isFirstVisit = !lastVisit;
  const displayName = w.familyMember?.name || w.customer.name || 'Unknown';

  let preferredStyles: string[] = [];
  try { if (w.preferredStyle) preferredStyles = JSON.parse(w.preferredStyle); } catch { /* noop */ }

  return (
    <div style={{
      background: '#111',
      border: isInChair ? '1px solid rgba(200,241,53,0.25)' : '1px solid rgba(255,255,255,0.08)',
      borderRadius: 12,
      boxShadow: isInChair ? '0 0 24px rgba(200,241,53,0.04)' : 'none',
    }}>
      {/* Main row */}
      <div style={{ padding: '1rem 1.125rem', display: 'flex', alignItems: 'flex-start', gap: '0.875rem' }}>

        {/* Position */}
        <div style={{
          width: 28, flexShrink: 0, textAlign: 'center', paddingTop: 12,
          fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 900, lineHeight: 1,
          ...(isInChair
            ? { fontSize: '0.5rem', textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: '#C8F135' }
            : { fontSize: '1.4rem', color: 'rgba(255,255,255,0.12)' }
          ),
        }}>
          {isInChair ? 'Chair' : position}
        </div>

        <Avatar name={displayName} size={48} active={isInChair} />

        {/* Info block */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{
              fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 800,
              fontSize: '1.05rem', color: 'white', textTransform: 'uppercase', lineHeight: 1.2,
            }}>
              {displayName}
            </span>
            {w.familyMember && (
              <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)' }}>
                via {w.customer.name}
              </span>
            )}
          </div>

          <div style={{ color: 'rgba(255,255,255,0.22)', fontSize: '0.7rem', fontFamily: 'monospace', marginTop: 3 }}>
            {timeAgo(w.arrivedAt)} · {w.customer.phone}
          </div>

          {/* Passport — last cut or first visit */}
          <div style={{ marginTop: 7, display: 'flex', flexWrap: 'wrap', gap: '0.35rem', alignItems: 'center' }}>
            {isFirstVisit ? (
              <span style={{
                fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
                background: 'rgba(255,200,50,0.1)', color: 'rgba(255,200,50,0.85)',
                border: '1px solid rgba(255,200,50,0.2)', borderRadius: 3,
                padding: '0.15rem 0.45rem', fontFamily: 'var(--font-barlow, sans-serif)',
              }}>
                First visit
              </span>
            ) : (
              <>
                {cutSummary && (
                  <span style={{
                    fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                    background: 'rgba(200,241,53,0.08)', color: '#C8F135',
                    border: '1px solid rgba(200,241,53,0.18)', borderRadius: 3,
                    padding: '0.15rem 0.45rem', fontFamily: 'var(--font-barlow, sans-serif)',
                  }}>
                    {cutSummary}
                  </span>
                )}
                {lastVisit && (
                  <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.2)' }}>
                    {timeAgo(lastVisit.visitedAt)}
                  </span>
                )}
              </>
            )}
          </div>

          {/* Wants a specific barber */}
          {preferredBarber && (
            <div style={{ marginTop: 5 }}>
              <span style={{
                fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
                background: 'rgba(200,241,53,0.06)', color: 'rgba(200,241,53,0.65)',
                border: '1px solid rgba(200,241,53,0.15)', borderRadius: 3,
                padding: '0.15rem 0.45rem', fontFamily: 'var(--font-barlow, sans-serif)',
              }}>
                Wants {preferredBarber}
              </span>
            </div>
          )}

          {/* Service selected at check-in */}
          {preferredStyles.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: 5 }}>
              {preferredStyles.map(s => (
                <span key={s} style={{
                  fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase',
                  background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)',
                  border: '1px solid rgba(255,255,255,0.09)', borderRadius: 3,
                  padding: '0.1rem 0.4rem', fontFamily: 'var(--font-barlow, sans-serif)',
                }}>
                  {s}
                </span>
              ))}
            </div>
          )}

          {/* Away badge */}
          {w.isAway && (
            <div style={{ marginTop: 5 }}>
              <span style={{
                fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
                background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: 3,
                padding: '0.15rem 0.45rem', fontFamily: 'var(--font-barlow, sans-serif)',
              }}>
                Away {w.queueReminderSentAt ? '· text sent' : '· place held'}
              </span>
            </div>
          )}

          {/* Custom note */}
          {noteText && (
            <div style={{
              color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem',
              fontFamily: 'var(--font-inter, sans-serif)', marginTop: 6, fontStyle: 'italic',
            }}>
              &ldquo;{noteText}&rdquo;
            </div>
          )}
        </div>
      </div>

      {/* Action bar */}
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
                  <button onClick={onReturnReminder} style={actionBtn('ghost')}>Text back</button>
                )}
                <button onClick={onInChair} style={actionBtn('primary')}>
                  <UserCheck size={14} /> In chair
                </button>
              </>
            )}
            {w.status === 'in_progress' && (
              <>
                <button onClick={onDone} style={actionBtn('primary')}>
                  <Check size={14} /> Done
                </button>
                <Link href={`/customers/${w.customer.id}/visit/new`} style={actionBtn('ghost-link')}>
                  <Scissors size={13} /> Record
                </Link>
              </>
            )}
            <button onClick={onNoShow} title="No show" style={actionBtn('icon')}><X size={14} /></button>
            <button onClick={onDelete} title="Remove" style={actionBtn('danger')}><Trash2 size={14} /></button>
            <Link href={`/customers/${w.customer.id}`} style={actionBtn('icon-link')}>
              <ChevronRight size={14} />
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Button style helper ──────────────────────────────────────────────────────

type BtnVariant = 'primary' | 'ghost' | 'ghost-link' | 'icon' | 'icon-link' | 'danger';

function actionBtn(variant: BtnVariant): React.CSSProperties {
  const base: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderRadius: 8, cursor: 'pointer', border: 'none', textDecoration: 'none',
    fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 800,
    fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0.75rem',
  };
  const variants: Record<BtnVariant, React.CSSProperties> = {
    primary:    { ...base, flex: 1, background: '#C8F135', color: '#0a0a0a' },
    ghost:      { ...base, flex: 1, background: 'rgba(200,241,53,0.08)', color: '#C8F135', border: '1px solid rgba(200,241,53,0.25)' },
    'ghost-link': { ...base, padding: '0.75rem 1rem', background: 'rgba(200,241,53,0.08)', color: '#C8F135', border: '1px solid rgba(200,241,53,0.2)' },
    icon:       { ...base, padding: '0.75rem', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.08)' },
    'icon-link': { ...base, padding: '0.75rem', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.08)' },
    danger:     { ...base, padding: '0.75rem', background: 'rgba(255,80,80,0.06)', color: 'rgba(255,120,120,0.6)', border: '1px solid rgba(255,80,80,0.14)' },
  };
  return variants[variant];
}
