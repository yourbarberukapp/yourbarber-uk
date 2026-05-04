'use client';

import { Suspense, useState } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, Loader2, Scissors } from 'lucide-react';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.75rem 1rem',
  background: '#141414', border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 4, color: 'white', fontSize: '1rem',
  outline: 'none', fontFamily: 'var(--font-inter, sans-serif)',
};

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const notApproved = searchParams.get('error') === 'not_approved';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [shopName, setShopName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);

  async function handleEmailSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name, shopName }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Something went wrong');
      setLoading(false);
      return;
    }
    const result = await signIn('credentials', { email, password, redirect: false });
    if (result?.error) {
      setError('Account created — please sign in');
      router.push('/login');
    } else {
      router.push('/dashboard');
    }
  }

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
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem', marginTop: '0.25rem' }}>Create your shop account</p>
          <div style={{ marginTop: '0.75rem' }}>
            <span style={{ background: 'rgba(200,241,53,0.1)', border: '1px solid rgba(200,241,53,0.2)', color: '#C8F135', fontSize: '0.7rem', fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '3px 10px', borderRadius: 20 }}>
              Free beta
            </span>
          </div>
        </div>

        {notApproved ? (
          <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
            <h2 style={{ fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 900, fontSize: '1.25rem', textTransform: 'uppercase', color: 'white', marginBottom: '0.75rem' }}>
              You&apos;re on the list
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.875rem', lineHeight: 1.6, fontFamily: 'var(--font-inter, sans-serif)', marginBottom: '1.5rem' }}>
              We review every application personally. We&apos;ll call or WhatsApp you when your beta spot is confirmed — usually within 24 hours.
            </p>
            <Link href="/" style={{ color: '#C8F135', fontSize: '0.875rem', fontFamily: 'var(--font-inter, sans-serif)', textDecoration: 'none' }}>
              ← Back to home
            </Link>
          </div>
        ) : (
          <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '2rem' }}>
            {!showEmailForm ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button
                  onClick={() => signIn('google')}
                  style={{ width: '100%', padding: '0.875rem 1rem', background: 'white', border: 'none', borderRadius: 4, color: '#111', fontSize: '0.95rem', cursor: 'pointer', fontFamily: 'var(--font-inter, sans-serif)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Sign up with Google
                </button>

                <div style={{ margin: '0.25rem 0', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.05)' }} />
                  <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.2)' }}>or</span>
                  <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.05)' }} />
                </div>

                <button
                  onClick={() => setShowEmailForm(true)}
                  style={{ width: '100%', padding: '0.75rem 1rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 4, color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'var(--font-inter, sans-serif)' }}
                >
                  Sign up with email
                </button>
              </div>
            ) : (
              <form onSubmit={handleEmailSignUp} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem', fontFamily: 'var(--font-barlow, sans-serif)' }}>Your name</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="James" required style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem', fontFamily: 'var(--font-barlow, sans-serif)' }}>Shop name</label>
                  <input type="text" value={shopName} onChange={e => setShopName(e.target.value)} placeholder="The Barber Room" required style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem', fontFamily: 'var(--font-barlow, sans-serif)' }}>Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem', fontFamily: 'var(--font-barlow, sans-serif)' }}>Password</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} autoComplete="new-password" style={inputStyle} />
                </div>
                {error && <p style={{ color: '#f87171', fontSize: '0.875rem' }}>{error}</p>}
                <button type="submit" disabled={loading} className="btn-lime" style={{ padding: '0.875rem', borderRadius: 4, fontSize: '1rem', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', width: '100%', opacity: loading ? 0.7 : 1 }}>
                  {loading ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Creating account…</> : <>Create account <ArrowRight size={16} /></>}
                </button>
                <button type="button" onClick={() => setShowEmailForm(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'var(--font-inter, sans-serif)' }}>
                  ← Back
                </button>
              </form>
            )}
          </div>
        )}

        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', textAlign: 'center', marginTop: '1.5rem' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: '#C8F135', textDecoration: 'none' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={null}>
      <SignUpForm />
    </Suspense>
  );
}
