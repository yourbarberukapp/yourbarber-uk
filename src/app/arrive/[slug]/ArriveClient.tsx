'use client';

import { useState } from 'react';
import { Scissors, ChevronRight, Check, Loader2 } from 'lucide-react';

type Step = 'phone' | 'name' | 'note' | 'done';

interface Props {
  shopSlug: string;
  shopName: string;
}

function ordinal(n: number) {
  if (n === 1) return '1st';
  if (n === 2) return '2nd';
  if (n === 3) return '3rd';
  return `${n}th`;
}

export default function ArriveClient({ shopSlug, shopName }: Props) {
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ customerName: string | null; position: number; alreadyWaiting?: boolean } | null>(null);

  async function submitPhone() {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/arrive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopSlug, phone }),
      });
      const data = await res.json();
      if (data.needsName) {
        setStep('name');
      } else if (data.customerName !== undefined) {
        setResult(data);
        setStep('done');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function submitName() {
    setError('');
    setStep('note');
  }

  async function submitFinal() {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/arrive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopSlug, phone, name: name || undefined, note: note || undefined }),
      });
      const data = await res.json();
      if (data.customerName !== undefined) {
        setResult(data);
        setStep('done');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 8, padding: '1rem 1.125rem', color: 'white', fontSize: '1.1rem',
    fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box',
  };

  const btnStyle: React.CSSProperties = {
    width: '100%', padding: '1rem', borderRadius: 8, fontSize: '0.9rem', fontWeight: 800,
    textTransform: 'uppercase' as const, letterSpacing: '0.1em', cursor: 'pointer',
    border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    fontFamily: 'var(--font-barlow, sans-serif)',
    background: '#C8F135', color: '#0a0a0a',
    transition: 'opacity 0.15s',
  };

  return (
    <div style={{
      minHeight: '100svh', background: '#0a0a0a', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '1.5rem',
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 52, height: 52, borderRadius: '50%',
            background: 'rgba(200,241,53,0.12)', border: '1px solid rgba(200,241,53,0.25)',
            marginBottom: '1rem',
          }}>
            <Scissors size={22} color="#C8F135" />
          </div>
          <h1 style={{
            fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 900, fontSize: '1.75rem',
            textTransform: 'uppercase', color: 'white', letterSpacing: '0.02em', margin: 0,
          }}>
            {shopName}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem', marginTop: '0.375rem', fontFamily: 'var(--font-barlow, sans-serif)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Check in
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16,
          padding: '2rem',
        }}>

          {/* Step: phone */}
          {step === 'phone' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)', marginBottom: '0.625rem', fontFamily: 'var(--font-barlow, sans-serif)' }}>
                  Your mobile number
                </label>
                <input
                  style={inputStyle}
                  type="tel"
                  inputMode="tel"
                  placeholder="07700 900 000"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && phone.length >= 7 && submitPhone()}
                  autoFocus
                />
              </div>
              {error && <p style={{ color: '#ff6b6b', fontSize: '0.8rem', margin: 0 }}>{error}</p>}
              <button
                style={{ ...btnStyle, opacity: phone.length < 7 || loading ? 0.5 : 1 }}
                disabled={phone.length < 7 || loading}
                onClick={submitPhone}
              >
                {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <><ChevronRight size={16} /> Check in</>}
              </button>
            </div>
          )}

          {/* Step: name (new customer) */}
          {step === 'name' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem', margin: 0, lineHeight: 1.5, fontFamily: 'var(--font-inter, sans-serif)' }}>
                First time here — what&apos;s your name?
              </p>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)', marginBottom: '0.625rem', fontFamily: 'var(--font-barlow, sans-serif)' }}>
                  Your name
                </label>
                <input
                  style={{ ...inputStyle, fontFamily: 'var(--font-inter, sans-serif)' }}
                  type="text"
                  placeholder="First name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && name.trim().length >= 1 && submitName()}
                  autoFocus
                />
              </div>
              {error && <p style={{ color: '#ff6b6b', fontSize: '0.8rem', margin: 0 }}>{error}</p>}
              <button
                style={{ ...btnStyle, opacity: name.trim().length < 1 ? 0.5 : 1 }}
                disabled={name.trim().length < 1}
                onClick={submitName}
              >
                <ChevronRight size={16} /> Next
              </button>
            </div>
          )}

          {/* Step: note */}
          {step === 'note' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem', margin: 0, lineHeight: 1.5, fontFamily: 'var(--font-inter, sans-serif)' }}>
                Anything specific today? <span style={{ color: 'rgba(255,255,255,0.25)' }}>(optional)</span>
              </p>
              <textarea
                style={{
                  ...inputStyle, fontFamily: 'var(--font-inter, sans-serif)', fontSize: '0.95rem',
                  resize: 'none', height: 90,
                }}
                placeholder="e.g. just a trim, skin fade with taper…"
                value={note}
                onChange={e => setNote(e.target.value)}
                autoFocus
              />
              {error && <p style={{ color: '#ff6b6b', fontSize: '0.8rem', margin: 0 }}>{error}</p>}
              <button
                style={{ ...btnStyle, opacity: loading ? 0.5 : 1 }}
                disabled={loading}
                onClick={submitFinal}
              >
                {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <><Check size={16} /> Check in</>}
              </button>
              <button
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'var(--font-barlow, sans-serif)', textTransform: 'uppercase', letterSpacing: '0.08em' }}
                onClick={submitFinal}
              >
                Skip
              </button>
            </div>
          )}

          {/* Step: done */}
          {step === 'done' && result && (
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'rgba(200,241,53,0.12)', border: '2px solid rgba(200,241,53,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Check size={24} color="#C8F135" />
              </div>
              <div>
                <h2 style={{
                  fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 900, fontSize: '1.5rem',
                  textTransform: 'uppercase', color: 'white', margin: 0,
                }}>
                  {result.alreadyWaiting ? 'Already checked in' : 'You\'re on the list'}
                </h2>
                {result.customerName && (
                  <p style={{ color: '#C8F135', fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 700, fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.375rem' }}>
                    {result.customerName}
                  </p>
                )}
              </div>
              <div style={{
                background: 'rgba(200,241,53,0.06)', border: '1px solid rgba(200,241,53,0.15)',
                borderRadius: 10, padding: '1rem 1.5rem', width: '100%',
              }}>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-barlow, sans-serif)', margin: '0 0 0.25rem' }}>
                  Position
                </p>
                <p style={{ color: '#C8F135', fontSize: '2.5rem', fontWeight: 900, fontFamily: 'var(--font-barlow, sans-serif)', margin: 0, lineHeight: 1 }}>
                  {ordinal(result.position)}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', fontFamily: 'var(--font-inter, sans-serif)', margin: '0.25rem 0 0' }}>
                  in the queue
                </p>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.8rem', fontFamily: 'var(--font-inter, sans-serif)', lineHeight: 1.5 }}>
                Take a seat — the barber will call you when it&apos;s your turn.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <p style={{ textAlign: 'center', marginTop: '2rem', color: 'rgba(255,255,255,0.15)', fontSize: '0.7rem', fontFamily: 'var(--font-barlow, sans-serif)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Powered by YourBarber
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.2); }
        input:focus, textarea:focus { border-color: rgba(200,241,53,0.4) !important; }
      `}</style>
    </div>
  );
}
