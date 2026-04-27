'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Scissors, ArrowRight, Loader2, RotateCcw } from 'lucide-react';

const lime = '#C8F135';
const dark = '#0a0a0a';

type Step = 'phone' | 'otp' | 'legacy';

export default function CustomerLoginPage() {
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [resent, setResent] = useState(false);
  const router = useRouter();

  async function requestOtp() {
    setBusy(true);
    setError('');
    setResent(false);
    const res = await fetch('/api/customer/otp/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });
    setBusy(false);
    if (res.ok) {
      setStep('otp');
    } else {
      setError('Could not send code. Check your number and try again.');
    }
  }

  async function verifyOtp() {
    if (code.length !== 5) return;
    setBusy(true);
    setError('');
    const res = await fetch('/api/customer/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, phone }),
    });
    setBusy(false);
    if (res.ok) {
      router.push('/me');
    } else {
      setError('Wrong code or it has expired. Try again.');
    }
  }

  async function resendOtp() {
    setBusy(true);
    setError('');
    await fetch('/api/customer/otp/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });
    setBusy(false);
    setResent(true);
    setCode('');
  }

  async function verifyLegacy() {
    if (code.length !== 5) return;
    setBusy(true);
    setError('');
    const res = await fetch('/api/customer/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: code.toUpperCase() }),
    });
    setBusy(false);
    if (res.ok) {
      router.push('/me');
    } else {
      setError("That code didn't match.");
      setBusy(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.875rem 1rem',
    background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 6, color: 'white', outline: 'none',
    transition: 'border-color 0.2s', boxSizing: 'border-box',
  };

  const btnStyle = (active: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    padding: '0.875rem', borderRadius: 6, border: 'none',
    background: active ? lime : 'rgba(255,255,255,0.06)',
    color: active ? dark : 'rgba(255,255,255,0.2)',
    cursor: active ? 'pointer' : 'default',
    fontFamily: "'Barlow Condensed',sans-serif",
    fontWeight: 900, fontSize: '1rem', textTransform: 'uppercase' as const,
    letterSpacing: '0.08em', transition: 'all 0.2s',
  });

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: dark, padding: '1.5rem',
    }}>
      {/* Wordmark */}
      <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <Scissors size={20} color={lime} />
          <span style={{
            fontFamily: "'Barlow Condensed','Arial Black',sans-serif",
            fontWeight: 900, fontSize: '1.75rem', textTransform: 'uppercase',
            letterSpacing: '-0.01em',
          }}>
            <span style={{ color: 'white' }}>YOUR</span>
            <span style={{ color: lime }}>BARBER</span>
          </span>
        </div>
        <p style={{
          color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem',
          fontFamily: "'Barlow Condensed',sans-serif",
          textTransform: 'uppercase', letterSpacing: '0.15em',
        }}>
          Your cut passport
        </p>
      </div>

      {/* Card */}
      <div style={{
        width: '100%', maxWidth: 360,
        background: '#111', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12, padding: '2rem',
      }}>

        {/* Step: phone */}
        {step === 'phone' && (
          <>
            <h1 style={{
              fontFamily: "'Barlow Condensed','Arial Black',sans-serif",
              fontWeight: 900, fontSize: '1.5rem', textTransform: 'uppercase',
              color: 'white', margin: '0 0 0.375rem',
            }}>
              View your cuts
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem', margin: '0 0 1.75rem', lineHeight: 1.5 }}>
              Enter your mobile number and we&apos;ll text you a code.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input
                type="tel"
                inputMode="tel"
                placeholder="07700 900 000"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && phone.length >= 7 && requestOtp()}
                autoFocus
                style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '1.1rem' }}
              />
              {error && (
                <p style={{ color: '#ff6b6b', fontSize: '0.8rem', background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.2)', borderRadius: 4, padding: '0.625rem 0.75rem', margin: 0 }}>
                  {error}
                </p>
              )}
              <button
                onClick={requestOtp}
                disabled={phone.length < 7 || busy}
                style={btnStyle(phone.length >= 7 && !busy)}
              >
                {busy ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <ArrowRight size={18} />}
                {busy ? 'Sending…' : 'Send code'}
              </button>
            </div>
          </>
        )}

        {/* Step: OTP */}
        {step === 'otp' && (
          <>
            <h1 style={{
              fontFamily: "'Barlow Condensed','Arial Black',sans-serif",
              fontWeight: 900, fontSize: '1.5rem', textTransform: 'uppercase',
              color: 'white', margin: '0 0 0.375rem',
            }}>
              Check your texts
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem', margin: '0 0 1.75rem', lineHeight: 1.5 }}>
              We sent a 5-digit code to <span style={{ color: 'white' }}>{phone}</span>.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input
                type="text"
                inputMode="numeric"
                placeholder="00000"
                maxLength={5}
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                onKeyDown={e => e.key === 'Enter' && code.length === 5 && verifyOtp()}
                autoFocus
                autoComplete="one-time-code"
                style={{
                  ...inputStyle,
                  fontFamily: 'monospace', fontSize: '1.75rem',
                  textAlign: 'center', letterSpacing: '0.4em',
                  borderColor: code.length === 5 ? lime : 'rgba(255,255,255,0.1)',
                }}
              />
              {resent && (
                <p style={{ color: '#C8F135', fontSize: '0.8rem', margin: 0 }}>Code resent.</p>
              )}
              {error && (
                <p style={{ color: '#ff6b6b', fontSize: '0.8rem', background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.2)', borderRadius: 4, padding: '0.625rem 0.75rem', margin: 0 }}>
                  {error}
                </p>
              )}
              <button
                onClick={verifyOtp}
                disabled={code.length !== 5 || busy}
                style={btnStyle(code.length === 5 && !busy)}
              >
                {busy ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <ArrowRight size={18} />}
                {busy ? 'Verifying…' : 'View my cuts'}
              </button>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
                <button
                  onClick={() => { setStep('phone'); setCode(''); setError(''); }}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', cursor: 'pointer', fontFamily: "'Barlow Condensed',sans-serif", textTransform: 'uppercase', letterSpacing: '0.05em', padding: 0 }}
                >
                  ← Wrong number
                </button>
                <button
                  onClick={resendOtp}
                  disabled={busy}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', cursor: 'pointer', fontFamily: "'Barlow Condensed',sans-serif", textTransform: 'uppercase', letterSpacing: '0.05em', padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <RotateCcw size={11} /> Resend
                </button>
              </div>
            </div>
          </>
        )}

        {/* Step: legacy access code */}
        {step === 'legacy' && (
          <>
            <h1 style={{
              fontFamily: "'Barlow Condensed','Arial Black',sans-serif",
              fontWeight: 900, fontSize: '1.5rem', textTransform: 'uppercase',
              color: 'white', margin: '0 0 0.375rem',
            }}>
              Access code
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem', margin: '0 0 1.75rem', lineHeight: 1.5 }}>
              5-letter code from your barber&apos;s card.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase().slice(0, 5))}
                placeholder="XXXXX"
                maxLength={5}
                autoFocus
                autoCapitalize="characters"
                autoComplete="off"
                spellCheck={false}
                style={{
                  ...inputStyle,
                  fontFamily: 'monospace', fontSize: '1.5rem',
                  textAlign: 'center', letterSpacing: '0.5em', textTransform: 'uppercase',
                  borderColor: code.length === 5 ? lime : 'rgba(255,255,255,0.1)',
                }}
              />
              {error && (
                <p style={{ color: '#ff6b6b', fontSize: '0.8rem', background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.2)', borderRadius: 4, padding: '0.625rem 0.75rem', margin: 0 }}>
                  {error}
                </p>
              )}
              <button
                onClick={verifyLegacy}
                disabled={code.length !== 5 || busy}
                style={btnStyle(code.length === 5 && !busy)}
              >
                {busy ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <ArrowRight size={18} />}
                {busy ? 'Checking…' : 'View my cuts'}
              </button>
              <button
                onClick={() => { setStep('phone'); setCode(''); setError(''); }}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', cursor: 'pointer', fontFamily: "'Barlow Condensed',sans-serif", textTransform: 'uppercase', letterSpacing: '0.05em', padding: 0, textAlign: 'left' }}
              >
                ← Use mobile number instead
              </button>
            </div>
          </>
        )}
      </div>

      {/* Legacy fallback link */}
      {step === 'phone' && (
        <button
          onClick={() => { setStep('legacy'); setCode(''); setError(''); }}
          style={{
            marginTop: '1.5rem', background: 'none', border: 'none',
            color: 'rgba(255,255,255,0.2)', fontSize: '0.7rem', cursor: 'pointer',
            fontFamily: "'Barlow Condensed',sans-serif", textTransform: 'uppercase', letterSpacing: '0.1em',
          }}
        >
          Have an old access code?
        </button>
      )}

      <p style={{
        marginTop: '1rem', color: 'rgba(255,255,255,0.1)',
        fontSize: '0.7rem', textAlign: 'center',
        fontFamily: "'Barlow Condensed',sans-serif",
        textTransform: 'uppercase', letterSpacing: '0.1em',
      }}>
        Powered by YourBarber
      </p>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input::placeholder { color: rgba(255,255,255,0.2); }
        input:focus { border-color: rgba(200,241,53,0.4) !important; }
      `}</style>
    </div>
  );
}
