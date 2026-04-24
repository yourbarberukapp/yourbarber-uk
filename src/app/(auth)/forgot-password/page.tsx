'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Scissors } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    setSubmitted(true);
    setLoading(false);
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.75rem 1rem',
    background: '#141414', border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 4, color: 'white', fontSize: '1rem',
    outline: 'none', fontFamily: 'var(--font-inter, sans-serif)',
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
        </div>

        <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '2rem' }}>
          {submitted ? (
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '1.5rem', lineHeight: 1.6, fontFamily: 'var(--font-inter, sans-serif)' }}>
                If that email is registered, you will receive a reset link shortly. Check your inbox.
              </p>
              <Link href="/login" style={{ color: '#C8F135', fontSize: '0.875rem', fontFamily: 'var(--font-inter, sans-serif)' }}>
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <h2 style={{ color: 'white', fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 700, fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
                Reset password
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem', marginBottom: '1.5rem', fontFamily: 'var(--font-inter, sans-serif)' }}>
                Enter your email and we'll send you a reset link.
              </p>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem', fontFamily: 'var(--font-barlow, sans-serif)' }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    style={inputStyle}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-lime"
                  style={{ padding: '0.875rem', borderRadius: 4, fontSize: '1rem', border: 'none', width: '100%', marginTop: '0.5rem', cursor: 'pointer' }}
                >
                  {loading ? 'Sending…' : 'Send reset link'}
                </button>
              </form>
              <p style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                <Link href="/login" style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', fontFamily: 'var(--font-inter, sans-serif)' }}>
                  Back to sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
