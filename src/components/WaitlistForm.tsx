'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { ArrowRight, Check, Loader2 } from 'lucide-react';

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 6,
  padding: '0.75rem 1rem',
  color: 'white',
  fontSize: '0.9rem',
  fontFamily: 'var(--font-inter)',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
};

export default function WaitlistForm() {
  const [fields, setFields] = useState({ name: '', email: '', phone: '', shopName: '', challenge: '' });
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState('loading');
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      });
      if (!res.ok) throw new Error();
      setState('done');
    } catch {
      setState('error');
    }
  }

  if (state === 'done') {
    return (
      <div style={{
        background: 'rgba(200,241,53,0.06)',
        border: '1px solid rgba(200,241,53,0.25)',
        borderRadius: 8,
        padding: '1.5rem 2rem',
        maxWidth: 480,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: '#C8F135', display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Check size={14} color="#0A0A0A" strokeWidth={3} />
          </div>
          <span style={{ fontFamily: 'var(--font-barlow)', fontWeight: 900, fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'white' }}>
            You&apos;re in the beta
          </span>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem', fontFamily: 'var(--font-inter)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
          Your spot is confirmed. Sign in with Google to set up your shop — takes 30 seconds.
        </p>
        <button
          onClick={() => signIn('google')}
          style={{
            width: '100%', padding: '0.75rem 1rem',
            background: 'white', border: 'none', borderRadius: 4,
            color: '#111', fontSize: '0.9rem', cursor: 'pointer',
            fontFamily: 'var(--font-inter)', fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Sign in with Google
        </button>
        <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.7rem', fontFamily: 'var(--font-inter)', marginTop: '0.75rem', textAlign: 'center' }}>
          After beta: £20/month locked in for life.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} style={{ maxWidth: 480 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginBottom: '0.875rem' }}>
        <input required type="text" placeholder="Your name"
          value={fields.name} onChange={e => setFields(f => ({ ...f, name: e.target.value }))} style={inputStyle} />
        <input required type="email" placeholder="Email address"
          value={fields.email} onChange={e => setFields(f => ({ ...f, email: e.target.value }))} style={inputStyle} />
        <input required type="tel" placeholder="Phone number"
          value={fields.phone} onChange={e => setFields(f => ({ ...f, phone: e.target.value }))} style={inputStyle} />
        <input type="text" placeholder="Shop name (optional)"
          value={fields.shopName} onChange={e => setFields(f => ({ ...f, shopName: e.target.value }))} style={inputStyle} />
        <textarea
          placeholder="What's the biggest headache in your shop right now? (optional)"
          value={fields.challenge}
          onChange={e => setFields(f => ({ ...f, challenge: e.target.value }))}
          rows={3}
          style={{ ...inputStyle, resize: 'none', lineHeight: 1.5 }}
        />
      </div>

      <button type="submit" disabled={state === 'loading'} className="btn-lime" style={{
        width: '100%', padding: '0.875rem 1.5rem', fontSize: '0.9rem',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
        opacity: state === 'loading' ? 0.7 : 1,
      }}>
        {state === 'loading'
          ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Applying…</>
          : <>Apply for free beta access <ArrowRight size={16} /></>}
      </button>

      <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.75rem', marginTop: '0.5rem', fontFamily: 'var(--font-inter)', textAlign: 'center' }}>
        No credit card. No contracts. After beta: £20/month locked in for life.
      </p>

      {state === 'error' && (
        <p style={{ color: 'rgba(255,100,100,0.8)', fontSize: '0.8rem', marginTop: '0.5rem', fontFamily: 'var(--font-inter)' }}>
          Something went wrong — try again or email us directly.
        </p>
      )}
    </form>
  );
}
