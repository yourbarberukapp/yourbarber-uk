'use client';
import { useState } from 'react';

type Rating = 'positive' | 'neutral' | 'negative';

interface Props {
  customerId: string;
  visitId: string;
  onDone: () => void;
}

const OPTIONS: { rating: Rating; emoji: string; label: string; color: string; bg: string; border: string }[] = [
  { rating: 'positive', emoji: '😊', label: 'Great',    color: '#C8F135', bg: 'rgba(200,241,53,0.08)',  border: 'rgba(200,241,53,0.25)' },
  { rating: 'neutral',  emoji: '😐', label: 'Ok',       color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)' },
  { rating: 'negative', emoji: '😞', label: 'Not great', color: '#f87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.25)' },
];

export function FeedbackScreen({ customerId, visitId, onDone }: Props) {
  const [selected, setSelected] = useState<Rating | null>(null);
  const [issue, setIssue] = useState('');
  const [reminderWeeks, setReminderWeeks] = useState<number>(6);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    if (!selected) return;
    setSubmitting(true);
    await fetch('/api/feedback/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        customerId, 
        visitId, 
        rating: selected, 
        issue: issue.trim() || undefined, 
        sourceType: 'in_shop',
        reminderWeeks
      }),
    });
    setDone(true);
    setSubmitting(false);
    setTimeout(onDone, 1200);
  }

  if (done) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '0.75rem' }}>
        <span style={{ fontSize: '3rem' }}>✓</span>
        <p style={{ fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 900, fontSize: '1.25rem', textTransform: 'uppercase', color: '#C8F135' }}>
          Thanks!
        </p>
      </div>
    );
  }

  const opt = OPTIONS.find(o => o.rating === selected);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '1.5rem' }}>
      <div>
        <p style={{ fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 900, fontSize: '1.4rem', textTransform: 'uppercase', color: 'white', lineHeight: 1, marginBottom: '0.25rem' }}>
          How was your experience?
        </p>
        <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-inter, sans-serif)' }}>
          Hand the phone to your client
        </p>
      </div>

      {/* 3 big rating buttons */}
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        {OPTIONS.map(opt => {
          const active = selected === opt.rating;
          return (
            <button
              key={opt.rating}
              type="button"
              onClick={() => setSelected(opt.rating)}
              style={{
                flex: 1,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: '0.5rem',
                padding: '1.5rem 0.5rem',
                borderRadius: 12,
                border: `2px solid ${active ? opt.border : 'rgba(255,255,255,0.07)'}`,
                background: active ? opt.bg : 'rgba(255,255,255,0.03)',
                cursor: 'pointer',
                transition: 'all 0.15s',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <span style={{ fontSize: '2.5rem', lineHeight: 1 }}>{opt.emoji}</span>
              <span style={{
                fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                fontFamily: 'var(--font-barlow, sans-serif)',
                color: active ? opt.color : 'rgba(255,255,255,0.35)',
                transition: 'color 0.15s',
              }}>
                {opt.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Optional detail for non-positive */}
      {selected && selected !== 'positive' && (
        <div style={{ animation: 'fadeIn 0.2s ease' }}>
          <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.4)', marginBottom: '0.5rem', fontFamily: 'var(--font-barlow, sans-serif)' }}>
            What could be better? <span style={{ color: 'rgba(255,255,255,0.2)', fontWeight: 400 }}>(optional)</span>
          </label>
          <textarea
            rows={3}
            placeholder="e.g. Fade could be a little lower…"
            value={issue}
            onChange={e => setIssue(e.target.value)}
            autoFocus
            style={{
              width: '100%', background: '#0A0A0A',
              border: `1px solid ${opt?.border ?? 'rgba(255,255,255,0.1)'}`,
              borderRadius: 8, padding: '0.75rem', color: 'white', fontSize: '0.9rem',
              resize: 'none', outline: 'none', lineHeight: 1.6,
              fontFamily: 'var(--font-inter, sans-serif)',
            }}
          />
        </div>
      )}

      {/* Reminder Preference */}
      {selected === 'positive' && (
        <div style={{ animation: 'fadeIn 0.2s ease' }}>
          <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#C8F135', marginBottom: '0.5rem', fontFamily: 'var(--font-barlow, sans-serif)' }}>
            When should we remind you for your next cut?
          </label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {[4, 6, 8, 10].map(weeks => (
              <button
                key={weeks}
                type="button"
                onClick={() => setReminderWeeks(weeks)}
                style={{
                  flex: 1, padding: '0.75rem 0.25rem', borderRadius: 8,
                  fontSize: '0.8rem', fontWeight: 700, fontFamily: 'var(--font-barlow, sans-serif)',
                  border: reminderWeeks === weeks ? 'none' : '1px solid rgba(255,255,255,0.12)',
                  background: reminderWeeks === weeks ? '#C8F135' : 'rgba(255,255,255,0.03)',
                  color: reminderWeeks === weeks ? '#0A0A0A' : 'rgba(255,255,255,0.4)',
                  cursor: 'pointer', transition: 'all 0.15s'
                }}
              >
                {weeks} Wks
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
        {selected && (
          <button
            onClick={submit}
            disabled={submitting}
            className="btn-lime"
            style={{ padding: '0.875rem', borderRadius: 8, fontSize: '1rem', border: 'none', width: '100%' }}
          >
            {submitting ? 'Sending…' : 'Submit feedback'}
          </button>
        )}
        <button
          onClick={onDone}
          type="button"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'rgba(255,255,255,0.25)', fontSize: '0.8rem',
            fontFamily: 'var(--font-inter, sans-serif)', padding: '0.5rem',
            textDecoration: 'underline',
          }}
        >
          Skip
        </button>
      </div>
    </div>
  );
}
