'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Loader2, Scissors, Check } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.75rem 1rem',
  background: '#141414', border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 4, color: 'white', fontSize: '1rem',
  outline: 'none', fontFamily: 'var(--font-inter, sans-serif)',
};

export default function SetupPage() {
  const { data: session, update, status } = useSession();
  const router = useRouter();
  const [shopName, setShopName] = useState('');
  const [yourName, setYourName] = useState('');
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ shopSlug: string; shopName: string } | null>(null);

  // Pre-fill name from Google profile
  useEffect(() => {
    if (session?.user?.name && !yourName) {
      setYourName(session.user.name);
    }
  }, [session?.user?.name]);

  // If already set up, go to dashboard
  useEffect(() => {
    if (status === 'authenticated' && !(session?.user as any)?.needsSetup) {
      router.replace('/dashboard');
    }
  }, [status, session]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState('loading');
    setError('');

    const res = await fetch('/api/setup', {
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
    setResult({ shopSlug: data.shopSlug, shopName: data.shopName });

    // Refresh JWT so needsSetup clears
    await update();
    setState('done');
  }

  if (state === 'done' && result) {
    const arriveUrl = `https://yourbarber.uk/arrive/${result.shopSlug}`;
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0A0A0A', padding: '1rem' }}>
        <div style={{ width: '100%', maxWidth: 420, textAlign: 'center' }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#C8F135', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <Check size={24} color="#0A0A0A" strokeWidth={3} />
          </div>
          <h1 style={{ fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 900, fontSize: '1.75rem', textTransform: 'uppercase', color: 'white', marginBottom: '0.5rem' }}>
            You&apos;re live, {yourName.split(' ')[0]}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.9rem', fontFamily: 'var(--font-inter, sans-serif)', marginBottom: '2rem' }}>
            {result.shopName} is set up. Here&apos;s your shop QR code — print it and put it on your wall.
          </p>

          <div style={{ background: 'white', borderRadius: 12, padding: '1.5rem', display: 'inline-block', marginBottom: '1rem' }}>
            <QRCodeSVG value={arriveUrl} size={180} fgColor="#0A0A0A" bgColor="white" />
          </div>

          <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.75rem', fontFamily: 'var(--font-inter, sans-serif)', marginBottom: '2rem' }}>
            yourbarber.uk/arrive/{result.shopSlug}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: 320, margin: '0 auto' }}>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem', fontFamily: 'var(--font-inter, sans-serif)', lineHeight: 1.5, textAlign: 'left' }}>
              Clients scan this on their phone → join your queue → you see them instantly on your barber screen.
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="btn-lime"
              style={{ padding: '0.875rem', borderRadius: 4, fontSize: '1rem', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', width: '100%' }}
            >
              Open my dashboard <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    );
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
              disabled={state === 'loading'}
              className="btn-lime"
              style={{ padding: '0.875rem', borderRadius: 4, fontSize: '1rem', marginTop: '0.5rem', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', width: '100%', opacity: state === 'loading' ? 0.7 : 1 }}
            >
              {state === 'loading'
                ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Setting up…</>
                : <>Create my shop <ArrowRight size={16} /></>}
            </button>
          </form>
        </div>

        <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.75rem', textAlign: 'center', marginTop: '1.5rem' }}>
          Signed in as {session?.user?.email}
        </p>
      </div>
    </div>
  );
}
