'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { ArrowRight, Loader2, Scissors } from 'lucide-react';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.75rem 1rem',
  background: '#141414', border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 4, color: 'white', fontSize: '1rem',
  outline: 'none', fontFamily: 'var(--font-inter, sans-serif)',
};

export default function SignUpPage() {
  const router = useRouter();
  const [shopName, setShopName] = useState('');
  const [yourName, setYourName] = useState('');
  const [state, setState] = useState<'idle' | 'loading' | 'signing-in' | 'error'>('idle');
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState('loading');
    setError('');

    const res = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shopName, yourName }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Something went wrong');
      setState('error');
      return;
    }

    const data = await res.json();
    setState('signing-in');

    const result = await signIn('passcode', { passcode: data.passcode, redirect: false });
    if (result?.error) {
      // Extremely unlikely (the passcode we just got back from signup should always work),
      // but fall back to the manual login screen rather than leaving the user stuck.
      router.push('/owner/login?welcome=1');
      return;
    }
    router.push('/onboarding');
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0A0A0A', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(200,241,53,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <Scissors size={22} style={{ color: '#C8F135' }} />
          </div>
          <h1 style={{ fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 900, fontSize: '2rem', textTransform: 'uppercase', letterSpacing: '-0.02em', color: 'white' }}>
            Your<span style={{ color: '#C8F135' }}>Barber</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem', marginTop: '0.25rem' }}>Set up your shop — 30 seconds</p>
        </div>

        <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '2rem' }}>
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem', fontFamily: 'var(--font-barlow, sans-serif)' }}>
                Shop name
              </label>
              <input
                type="text"
                value={shopName}
                onChange={e => setShopName(e.target.value)}
                placeholder="The Barber Room"
                required
                autoFocus
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem', fontFamily: 'var(--font-barlow, sans-serif)' }}>
                Your name
              </label>
              <input
                type="text"
                value={yourName}
                onChange={e => setYourName(e.target.value)}
                placeholder="James"
                required
                style={inputStyle}
              />
            </div>

            {error && <p style={{ color: '#f87171', fontSize: '0.875rem' }}>{error}</p>}

            <button
              type="submit"
              disabled={state === 'loading' || state === 'signing-in'}
              className="btn-lime"
              style={{ padding: '0.875rem', borderRadius: 4, fontSize: '1rem', marginTop: '0.5rem', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', width: '100%', opacity: state === 'loading' || state === 'signing-in' ? 0.7 : 1 }}
            >
              {state === 'loading' ? (
                <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Setting up…</>
              ) : state === 'signing-in' ? (
                <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Almost there…</>
              ) : (
                <>Create my shop <ArrowRight size={16} /></>
              )}
            </button>
          </form>
        </div>

        <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.75rem', textAlign: 'center', marginTop: '1.5rem' }}>
          Already have a shop?{' '}
          <a href="/owner/login" style={{ color: '#C8F135' }}>Sign in</a>
        </p>
      </div>
    </div>
  );
}
