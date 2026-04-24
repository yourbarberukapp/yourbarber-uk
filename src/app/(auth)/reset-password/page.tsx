'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Scissors } from 'lucide-react';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.75rem 1rem',
  background: '#141414', border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 4, color: 'white', fontSize: '1rem',
  outline: 'none', fontFamily: 'var(--font-inter, sans-serif)',
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.75rem', fontWeight: 700,
  textTransform: 'uppercase', letterSpacing: '0.08em',
  color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem',
  fontFamily: 'var(--font-barlow, sans-serif)',
};

function ResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [valid, setValid] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) { setValid(false); return; }
    fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`)
      .then(r => r.json())
      .then(d => setValid(d.valid));
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError('Passwords do not match'); return; }
    setLoading(true);
    setError('');
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    });
    if (res.ok) {
      setDone(true);
      setTimeout(() => router.push('/login'), 2500);
    } else {
      const d = await res.json();
      setError(d.error ?? 'Something went wrong. Please try again.');
    }
    setLoading(false);
  }

  if (valid === null) {
    return <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', fontFamily: 'var(--font-inter, sans-serif)' }}>Checking link…</p>;
  }

  if (!valid) {
    return (
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: '#f87171', marginBottom: '1rem', fontFamily: 'var(--font-inter, sans-serif)' }}>
          This reset link is invalid or has expired.
        </p>
        <Link href="/forgot-password" style={{ color: '#C8F135', fontSize: '0.875rem', fontFamily: 'var(--font-inter, sans-serif)' }}>
          Request a new reset link
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <p style={{ color: '#C8F135', textAlign: 'center', fontFamily: 'var(--font-inter, sans-serif)' }}>
        Password updated! Redirecting to sign in…
      </p>
    );
  }

  return (
    <>
      <h2 style={{ color: 'white', fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 700, fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
        New password
      </h2>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem', marginBottom: '1.5rem', fontFamily: 'var(--font-inter, sans-serif)' }}>
        Choose a password with at least 8 characters.
      </p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={labelStyle}>New password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Confirm password</label>
          <input
            type="password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            required
            autoComplete="new-password"
            style={inputStyle}
          />
        </div>
        {error && <p style={{ color: '#f87171', fontSize: '0.875rem', fontFamily: 'var(--font-inter, sans-serif)' }}>{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="btn-lime"
          style={{ padding: '0.875rem', borderRadius: 4, fontSize: '1rem', border: 'none', width: '100%', marginTop: '0.5rem', cursor: 'pointer' }}
        >
          {loading ? 'Updating…' : 'Set new password'}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
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
        </div>
        <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '2rem' }}>
          <Suspense fallback={<p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>Loading…</p>}>
            <ResetForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
