'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PhotoCapture } from '@/components/PhotoCapture';
import { CutDetailsForm, CutDetails, EMPTY_CUT_DETAILS } from '@/components/CutDetailsForm';

interface Props {
  customer: { id: string; name: string | null; phone: string; smsOptIn: string };
}

type OptIn = 'yes' | 'no' | 'not_asked';

const optInOptions: { value: OptIn; label: string }[] = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'not_asked', label: "Didn't ask" },
];

const sectionLabel: React.CSSProperties = {
  display: 'block', fontSize: '0.7rem', fontWeight: 700,
  textTransform: 'uppercase', letterSpacing: '0.1em',
  color: 'rgba(255,255,255,0.4)', marginBottom: '0.625rem',
  fontFamily: 'var(--font-barlow, sans-serif)',
};

const card: React.CSSProperties = {
  background: '#111', border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 8, padding: '1.25rem', marginBottom: '1rem',
};

export function VisitRecordClient({ customer }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<'details' | 'photos'>('details');
  const [visitId, setVisitId] = useState<string | null>(null);
  const [cutDetails, setCutDetails] = useState<CutDetails>(EMPTY_CUT_DETAILS);
  const [recommendation, setRecommendation] = useState('');
  const [notes, setNotes] = useState('');
  const [smsOptIn, setSmsOptIn] = useState<OptIn>(customer.smsOptIn as OptIn);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    setSaving(true);
    setError('');
    const res = await fetch(`/api/customers/${customer.id}/visits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes, smsOptIn, cutDetails, recommendation }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError('Failed to save. Try again.');
      setSaving(false);
      return;
    }
    setVisitId(data.id);
    setStep('photos');
    setSaving(false);
  }

  if (step === 'photos') {
    return <PhotoCapture visitId={visitId!} onDone={() => router.push(`/customers/${customer.id}`)} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {/* Cut Details */}
      <div style={card}>
        <span style={{ ...sectionLabel, color: '#C8F135', opacity: 0.8 }}>The cut</span>
        <CutDetailsForm value={cutDetails} onChange={setCutDetails} />
      </div>

      {/* Recommendation to client */}
      <div style={card}>
        <label style={sectionLabel}>Recommendation to client</label>
        <textarea
          rows={2}
          placeholder="e.g. Book in 4 weeks, try using clay on top…"
          value={recommendation}
          onChange={e => setRecommendation(e.target.value)}
          style={{
            width: '100%', background: '#0A0A0A',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4,
            padding: '0.625rem 0.875rem', color: 'white', fontSize: '0.875rem',
            resize: 'vertical', outline: 'none', lineHeight: 1.6,
            fontFamily: 'var(--font-inter, sans-serif)',
          }}
        />
      </div>

      {/* Barber notes (freeform) */}
      <div style={card}>
        <label style={sectionLabel}>Internal notes (barber only)</label>
        <textarea
          rows={3}
          placeholder="Anything else to remember about this cut…"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          style={{
            width: '100%', background: '#0A0A0A',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4,
            padding: '0.625rem 0.875rem', color: 'white', fontSize: '0.875rem',
            resize: 'vertical', outline: 'none', lineHeight: 1.6,
            fontFamily: 'var(--font-inter, sans-serif)',
          }}
        />
      </div>

      {/* SMS opt-in */}
      <div style={card}>
        <label style={sectionLabel}>Send SMS reminder in 6 weeks?</label>
        <div style={{ display: 'flex', gap: 8 }}>
          {optInOptions.map(opt => {
            const active = smsOptIn === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSmsOptIn(opt.value)}
                style={{
                  flex: 1, padding: '0.625rem 0.5rem',
                  borderRadius: 4, fontSize: '0.8rem', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  cursor: 'pointer', transition: 'all 0.15s',
                  fontFamily: 'var(--font-barlow, sans-serif)',
                  border: active ? 'none' : '1px solid rgba(255,255,255,0.12)',
                  background: active ? '#C8F135' : '#141414',
                  color: active ? '#0A0A0A' : 'rgba(255,255,255,0.45)',
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {error && <p style={{ color: '#f87171', fontSize: '0.875rem' }}>{error}</p>}

      <button
        onClick={handleSave}
        disabled={saving}
        className="btn-lime"
        style={{ padding: '0.875rem', borderRadius: 4, fontSize: '1rem', border: 'none', width: '100%' }}
      >
        {saving ? 'Saving…' : 'Save & add photos'}
      </button>
    </div>
  );
}
