'use client';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { Scissors } from 'lucide-react';

function OwnerLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const justSignedUp = searchParams.get('welcome') === '1';
  const rawCallbackUrl = searchParams.get('callbackUrl');
  // Only ever navigate to a same-origin relative path after login — never an
  // absolute URL or protocol-relative "//host" (browsers treat that as
  // absolute too). An unvalidated callbackUrl here is an open redirect: a
  // crafted link shows the real login page, then bounces a successfully
  // authenticated owner straight to an attacker's site after their passcode
  // is submitted.
  const callbackUrl = rawCallbackUrl && rawCallbackUrl.startsWith('/') && !rawCallbackUrl.startsWith('//') && !rawCallbackUrl.startsWith('/\\')
    ? rawCallbackUrl
    : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (passcode.length !== 6) return;
    setLoading(true);
    setError('');
    const result = await signIn('passcode', { passcode, redirect: false });
    if (result?.error) {
      setError('That passcode didn\'t match. Check your Wallet card and try again.');
      setLoading(false);
    } else {
      if (callbackUrl) {
        router.push(callbackUrl);
      } else {
        const session = await fetch('/api/auth/session').then(r => r.json());
        const role = session?.user?.role;
        router.push(role === 'barber' ? '/barber' : '/dashboard');
      }
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.875rem 1rem',
    background: '#141414', border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 6, color: 'white', outline: 'none',
    fontFamily: 'monospace', fontSize: '1.5rem',
    textAlign: 'center', letterSpacing: '0.5em',
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0A0A0A', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(200,241,53,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <Scissors size={22} style={{ color: '#C8F135' }} />
          </div>
          <h1 style={{ fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 900, fontSize: '2rem', textTransform: 'uppercase', letterSpacing: '-0.02em', color: 'white' }}>
            Your<span style={{ color: '#C8F135' }}>Barber</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem', marginTop: '0.25rem' }}>Sign in to your shop</p>
        </div>

        <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '2rem' }}>
          {justSignedUp && (
            <div style={{ padding: '0.75rem', background: 'rgba(200,241,53,0.1)', border: '1px solid rgba(200,241,53,0.2)', borderRadius: 4, color: '#C8F135', fontSize: '0.875rem', marginBottom: '1.5rem', textAlign: 'center' }}>
              Shop created. Enter your passcode below to sign in.
            </div>
          )}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.5)', marginBottom: '0.75rem', textAlign: 'center', fontFamily: 'var(--font-barlow, sans-serif)' }}>
                6-digit passcode
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={passcode}
                onChange={e => setPasscode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                autoFocus
                autoComplete="off"
                placeholder="000000"
                style={inputStyle}
              />
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', marginTop: '0.75rem', textAlign: 'center' }}>
                From your Wallet business card - no password needed.
              </p>
            </div>
            {error && (
              <p style={{ color: '#f87171', fontSize: '0.875rem', textAlign: 'center' }}>{error}</p>
            )}
            <button
              type="submit"
              disabled={loading || passcode.length !== 6}
              className="btn-lime"
              style={{ padding: '0.875rem', borderRadius: 4, fontSize: '1rem', border: 'none', display: 'block', width: '100%', cursor: 'pointer', opacity: passcode.length === 6 ? 1 : 0.5 }}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>

        <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.75rem', textAlign: 'center', marginTop: '1.5rem' }}>
          New shop?{' '}
          <Link href="/signup" style={{ color: '#C8F135' }}>Set up in 30 seconds</Link>
        </p>
      </div>
    </div>
  );
}

export default function OwnerLoginPage() {
  return (
    <Suspense fallback={null}>
      <OwnerLoginForm />
    </Suspense>
  );
}
