'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronUp } from 'lucide-react';

type Barber = { id: string; name: string };

type Ticket = {
  id: string;
  status: string;
  resolution: string | null;
  notes: string | null;
  createdAt: string;
  feedback: {
    id: string;
    rating: string;
    issue: string | null;
    createdAt: string;
    customer: { id: string; name: string | null; phone: string };
    visit: { id: string; visitedAt: string; barber: { id: string; name: string } };
  };
};

const RATING_CONFIG = {
  positive: { emoji: '😊', color: '#C8F135',  label: 'Positive' },
  neutral:  { emoji: '😐', color: '#f59e0b',  label: 'Neutral'  },
  negative: { emoji: '😞', color: '#f87171',  label: 'Negative' },
} as const;

const RESOLUTIONS = [
  { value: 'same_barber_fix',  label: 'Fix now',        hint: 'Same barber fixes immediately', needsBarber: true  },
  { value: 'book_return',      label: 'Book return',    hint: 'Invite them back, no charge',   needsBarber: false },
  { value: 'different_barber', label: 'New barber',     hint: 'Assign to another barber',      needsBarber: true  },
  { value: 'log_only',         label: 'Log only',       hint: 'Note taken, no action',         needsBarber: false },
] as const;

function ResolvePanel({ ticket, barbers, onResolved }: { ticket: Ticket; barbers: Barber[]; onResolved: () => void }) {
  const [resolution, setResolution] = useState<string | null>(null);
  const [assignedBarberId, setAssignedBarberId] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const chosen = RESOLUTIONS.find(r => r.value === resolution);

  async function submit() {
    if (!resolution) return;
    setSubmitting(true);
    await fetch(`/api/feedback/${ticket.feedback.id}/resolve`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resolution,
        ...(assignedBarberId && { assignedBarberId }),
        ...(notes.trim() && { notes: notes.trim() }),
      }),
    });
    setSubmitting(false);
    onResolved();
  }

  return (
    <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.3)' }}>
      <p style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)', marginBottom: '0.75rem', fontFamily: 'var(--font-barlow, sans-serif)' }}>
        How to resolve?
      </p>

      {/* Resolution options */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
        {RESOLUTIONS.map(r => {
          const active = resolution === r.value;
          return (
            <button
              key={r.value}
              type="button"
              onClick={() => { setResolution(r.value); setAssignedBarberId(''); }}
              style={{
                padding: '0.625rem 0.75rem',
                borderRadius: 8,
                border: active ? '1px solid rgba(200,241,53,0.4)' : '1px solid rgba(255,255,255,0.08)',
                background: active ? 'rgba(200,241,53,0.08)' : 'rgba(255,255,255,0.03)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.12s',
              }}
            >
              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: active ? '#C8F135' : 'white', fontFamily: 'var(--font-barlow, sans-serif)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {r.label}
              </p>
              <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', marginTop: 2, fontFamily: 'var(--font-inter, sans-serif)' }}>
                {r.hint}
              </p>
            </button>
          );
        })}
      </div>

      {/* Barber picker if needed */}
      {chosen?.needsBarber && (
        <div style={{ marginBottom: '0.75rem' }}>
          <p style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.3)', marginBottom: '0.375rem', fontFamily: 'var(--font-barlow, sans-serif)' }}>
            Assign barber
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
            {barbers.map(b => (
              <button
                key={b.id}
                type="button"
                onClick={() => setAssignedBarberId(b.id)}
                style={{
                  padding: '0.35rem 0.75rem', borderRadius: 20,
                  fontSize: '0.75rem', fontWeight: 700,
                  fontFamily: 'var(--font-barlow, sans-serif)',
                  cursor: 'pointer', transition: 'all 0.12s',
                  border: assignedBarberId === b.id ? '1px solid rgba(200,241,53,0.4)' : '1px solid rgba(255,255,255,0.1)',
                  background: assignedBarberId === b.id ? 'rgba(200,241,53,0.1)' : 'transparent',
                  color: assignedBarberId === b.id ? '#C8F135' : 'rgba(255,255,255,0.6)',
                }}
              >
                {b.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Optional notes */}
      {resolution && (
        <div style={{ marginBottom: '0.75rem' }}>
          <input
            type="text"
            placeholder="Notes (optional)…"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            style={{
              width: '100%', background: 'rgba(0,0,0,0.4)',
              border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6,
              padding: '0.5rem 0.75rem', color: 'white', fontSize: '0.8rem',
              outline: 'none', fontFamily: 'var(--font-inter, sans-serif)',
            }}
          />
        </div>
      )}

      <button
        onClick={submit}
        disabled={!resolution || submitting || (!!chosen?.needsBarber && !assignedBarberId)}
        className="btn-lime"
        style={{ padding: '0.625rem 1.25rem', borderRadius: 6, fontSize: '0.8rem', border: 'none', opacity: (!resolution || (!!chosen?.needsBarber && !assignedBarberId)) ? 0.4 : 1 }}
      >
        {submitting ? 'Resolving…' : 'Confirm resolution'}
      </button>
    </div>
  );
}

function TicketCard({ ticket, barbers }: { ticket: Ticket; barbers: Barber[] }) {
  const [open, setOpen] = useState(false);
  const [resolved, setResolved] = useState(false);

  if (resolved) return null;

  const rc = RATING_CONFIG[ticket.feedback.rating as keyof typeof RATING_CONFIG];
  const customerName = ticket.feedback.customer.name ?? ticket.feedback.customer.phone;
  const visitDate = new Date(ticket.feedback.visit.visitedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

  return (
    <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, overflow: 'hidden' }}>
      {/* Main row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '0.875rem 1rem' }}>
        <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{rc?.emoji ?? '❓'}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Link
              href={`/customers/${ticket.feedback.customer.id}`}
              style={{ fontWeight: 700, fontSize: '0.9rem', color: 'white', textDecoration: 'none', fontFamily: 'var(--font-barlow, sans-serif)', textTransform: 'uppercase', letterSpacing: '0.02em' }}
            >
              {customerName}
            </Link>
            <span style={{
              fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
              padding: '0.15rem 0.5rem', borderRadius: 2, fontFamily: 'var(--font-barlow, sans-serif)',
              background: ticket.status === 'in_progress' ? 'rgba(245,158,11,0.12)' : 'rgba(248,113,113,0.12)',
              color: ticket.status === 'in_progress' ? '#f59e0b' : '#f87171',
            }}>
              {ticket.status === 'in_progress' ? 'In progress' : 'Unresolved'}
            </span>
          </div>
          {ticket.feedback.issue && (
            <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginTop: 2, fontFamily: 'var(--font-inter, sans-serif)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              "{ticket.feedback.issue}"
            </p>
          )}
          <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.25)', marginTop: 2, fontFamily: 'var(--font-inter, sans-serif)' }}>
            {visitDate} · {ticket.feedback.visit.barber.name}
          </p>
        </div>
        <button
          onClick={() => setOpen(o => !o)}
          style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 6, padding: '0.375rem 0.75rem', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 700, flexShrink: 0 }}
        >
          Resolve {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>

      {open && (
        <ResolvePanel
          ticket={ticket}
          barbers={barbers}
          onResolved={() => setResolved(true)}
        />
      )}
    </div>
  );
}

export function UnresolvedFeedback({ tickets, barbers }: { tickets: Ticket[]; barbers: Barber[] }) {
  if (tickets.length === 0) {
    return (
      <div className="bg-[#111] border border-white/5 rounded-2xl p-10 text-center">
        <p className="text-white/25 text-sm">No unresolved feedback — all clear.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {tickets.map(t => (
        <TicketCard key={t.id} ticket={t} barbers={barbers} />
      ))}
    </div>
  );
}
