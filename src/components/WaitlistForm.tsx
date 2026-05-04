'use client';

import { useState } from 'react';
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: '#C8F135', display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Check size={14} color="#0A0A0A" strokeWidth={3} />
          </div>
          <span style={{ fontFamily: 'var(--font-barlow)', fontWeight: 900, fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'white' }}>
            You&apos;re in
          </span>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem', fontFamily: 'var(--font-inter)', lineHeight: 1.6, marginLeft: '2.5rem' }}>
          We&apos;ll call you personally to walk through the system. No credit card, no contracts — just free access and your honest feedback.
        </p>
        <p style={{ color: 'rgba(200,241,53,0.4)', fontSize: '0.75rem', fontFamily: 'var(--font-inter)', lineHeight: 1.5, marginLeft: '2.5rem', marginTop: '0.5rem' }}>
          After the beta: £20/month locked in for life if you want to stay.
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
