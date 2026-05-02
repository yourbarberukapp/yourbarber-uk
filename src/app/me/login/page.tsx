'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type Step = 'phone' | 'otp';

export default function CustomerLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const otpRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step === 'otp') setTimeout(() => otpRef.current?.focus(), 100);
  }, [step]);

  async function requestOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/me/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Something went wrong.'); return; }
      if (data.demo && data.otpCode) setDemoCode(data.otpCode);
      setStep('otp');
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/me/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Incorrect code.'); return; }
      router.push('/me');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100svh', background: '#0a0a0a', color: 'white',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '2rem', fontFamily: 'var(--font-inter, sans-serif)',
    }}>
      <div style={{ width: '100%', maxWidth: 360 }}>

        {/* Logo / wordmark */}
        <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
          <div style={{
            fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 900,
            fontSize: '1.5rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#C8F135',
          }}>
            YourBarber
          </div>
          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Your Cut Passport
          </div>
        </div>

        {step === 'phone' && (
          <form onSubmit={requestOtp}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)', marginBottom: '0.5rem', fontFamily: 'var(--font-barlow, sans-serif)' }}>
              Mobile number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="07700 900124"
              autoFocus
              required
              style={{
                width: '100%', boxSizing: 'border-box',
                background: '#111', border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 10, padding: '1rem',
                color: 'white', fontSize: '1.25rem', fontFamily: 'var(--font-inter, sans-serif)',
                outline: 'none', marginBottom: '1rem', letterSpacing: '0.05em',
              }}
            />
            {error && <p style={{ color: '#ff6b6b', fontSize: '0.85rem', marginBottom: '0.75rem' }}>{error}</p>}
            <button
              type="submit"
              disabled={loading || phone.length < 7}
              style={{
                width: '100%', padding: '1rem',
                background: phone.length >= 7 ? '#C8F135' : 'rgba(200,241,53,0.2)',
                color: phone.length >= 7 ? '#0a0a0a' : 'rgba(200,241,53,0.4)',
                border: 'none', borderRadius: 10, cursor: phone.length >= 7 ? 'pointer' : 'default',
                fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 900,
                fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.1em',
                transition: 'all 0.15s',
              }}
            >
              {loading ? 'Sending…' : 'Get my code'}
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={verifyOtp}>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              Enter the 6-digit code sent to <span style={{ color: 'white' }}>{phone}</span>.
            </p>

            {/* Demo code hint */}
            {demoCode && (
              <div style={{
                background: 'rgba(200,241,53,0.06)', border: '1px solid rgba(200,241,53,0.15)',
                borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1.25rem',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-barlow, sans-serif)' }}>
                  Demo code
                </span>
                <span style={{ fontFamily: 'monospace', fontSize: '1.25rem', fontWeight: 700, color: '#C8F135', letterSpacing: '0.2em' }}>
                  {demoCode}
                </span>
              </div>
            )}

            <input
              ref={otpRef}
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              required
              style={{
                width: '100%', boxSizing: 'border-box',
                background: '#111', border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 10, padding: '1rem',
                color: 'white', fontSize: '2rem', fontFamily: 'monospace',
                outline: 'none', marginBottom: '1rem', letterSpacing: '0.4em',
                textAlign: 'center',
              }}
            />
            {error && <p style={{ color: '#ff6b6b', fontSize: '0.85rem', marginBottom: '0.75rem' }}>{error}</p>}
            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              style={{
                width: '100%', padding: '1rem',
                background: otp.length === 6 ? '#C8F135' : 'rgba(200,241,53,0.2)',
                color: otp.length === 6 ? '#0a0a0a' : 'rgba(200,241,53,0.4)',
                border: 'none', borderRadius: 10, cursor: otp.length === 6 ? 'pointer' : 'default',
                fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 900,
                fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.1em',
                transition: 'all 0.15s',
              }}
            >
              {loading ? 'Checking…' : 'View my passport'}
            </button>
            <button
              type="button"
              onClick={() => { setStep('phone'); setOtp(''); setError(null); setDemoCode(null); }}
              style={{
                width: '100%', marginTop: '0.75rem', padding: '0.75rem',
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: 'rgba(255,255,255,0.25)', fontSize: '0.8rem',
                fontFamily: 'var(--font-inter, sans-serif)',
              }}
            >
              Wrong number?
            </button>
          </form>
        )}

      </div>
      <style>{`input::placeholder { color: rgba(255,255,255,0.2); } input:focus { border-color: rgba(200,241,53,0.4) !important; }`}</style>
    </div>
  );
}
