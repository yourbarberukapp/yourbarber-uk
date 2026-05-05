'use client';

import { useState } from 'react';
import { ArrowRight, Check, Loader2, ChevronDown } from 'lucide-react';

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

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: 'none',
  WebkitAppearance: 'none',
  backgroundImage: 'none',
  cursor: 'pointer',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.7rem',
  fontWeight: 700,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.1em',
  color: 'rgba(255,255,255,0.35)',
  marginBottom: '0.35rem',
  fontFamily: 'var(--font-barlow)',
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

function SelectField({ label, value, onChange, options, placeholder }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
}) {
  return (
    <Field label={label}>
      <div style={{ position: 'relative' }}>
        <select value={value} onChange={e => onChange(e.target.value)} style={selectStyle}>
          <option value="" disabled>{placeholder}</option>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
      </div>
    </Field>
  );
}

export default function WaitlistForm() {
  const [fields, setFields] = useState({
    name: '', email: '', phone: '', shopName: '',
    chairs: '', barberCount: '', employmentType: '',
    postcode: '', commsPreference: '', challenge: '',
  });
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  function set(key: string, value: string) {
    setFields(f => ({ ...f, [key]: value }));
  }

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
            background: '#C8F135', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Check size={14} color="#0A0A0A" strokeWidth={3} />
          </div>
          <span style={{ fontFamily: 'var(--font-barlow)', fontWeight: 900, fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'white' }}>
            Application received
          </span>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem', fontFamily: 'var(--font-inter)', lineHeight: 1.6, marginBottom: '0.75rem' }}>
          We&apos;ll review your application and be in touch within 24 hours — by WhatsApp or email, whichever you selected.
        </p>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem', fontFamily: 'var(--font-inter)', lineHeight: 1.6 }}>
          When approved, you&apos;ll get an email with a sign-in link. <strong style={{ color: 'rgba(255,255,255,0.55)' }}>Sign in with Google using this exact email address</strong> — {fields.email}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} style={{ maxWidth: 480 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '0.875rem' }}>

        {/* Contact */}
        <Field label="Your name">
          <input required type="text" placeholder="First and last name"
            value={fields.name} onChange={e => set('name', e.target.value)} style={inputStyle} />
        </Field>

        <Field label="Email address">
          <input required type="email" placeholder="The Google account you'll sign in with"
            value={fields.email} onChange={e => set('email', e.target.value)} style={inputStyle} />
          <p style={{ color: 'rgba(200,241,53,0.6)', fontSize: '0.7rem', marginTop: '0.3rem', fontFamily: 'var(--font-inter)' }}>
            Use your Google email — this is the account you&apos;ll log in with.
          </p>
        </Field>

        <Field label="Mobile number">
          <input required type="tel" placeholder="07700 000000"
            value={fields.phone} onChange={e => set('phone', e.target.value)} style={inputStyle} />
        </Field>

        <Field label="Shop name">
          <input type="text" placeholder="The Barber Room"
            value={fields.shopName} onChange={e => set('shopName', e.target.value)} style={inputStyle} />
        </Field>

        <Field label="Postcode">
          <input type="text" placeholder="e.g. SW1A 1AA"
            value={fields.postcode} onChange={e => set('postcode', e.target.value)} style={inputStyle} />
        </Field>

        {/* Shop details */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <SelectField
            label="Number of chairs"
            value={fields.chairs}
            onChange={v => set('chairs', v)}
            placeholder="Select…"
            options={[
              { value: '1', label: '1 chair' },
              { value: '2', label: '2 chairs' },
              { value: '3', label: '3 chairs' },
              { value: '4', label: '4 chairs' },
              { value: '5', label: '5+ chairs' },
            ]}
          />
          <SelectField
            label="Number of barbers"
            value={fields.barberCount}
            onChange={v => set('barberCount', v)}
            placeholder="Select…"
            options={[
              { value: '1', label: 'Just me' },
              { value: '2', label: '2 barbers' },
              { value: '3', label: '3 barbers' },
              { value: '4', label: '4 barbers' },
              { value: '5', label: '5+ barbers' },
            ]}
          />
        </div>

        <SelectField
          label="Your barbers are…"
          value={fields.employmentType}
          onChange={v => set('employmentType', v)}
          placeholder="Select…"
          options={[
            { value: 'employed', label: 'Employed (on payroll)' },
            { value: 'self-employed', label: 'Self-employed (chair rental)' },
            { value: 'mixed', label: 'Mix of both' },
            { value: 'solo', label: 'Just me — no staff' },
          ]}
        />

        <SelectField
          label="How would you prefer updates?"
          value={fields.commsPreference}
          onChange={v => set('commsPreference', v)}
          placeholder="Select…"
          options={[
            { value: 'whatsapp', label: 'WhatsApp group (recommended)' },
            { value: 'email', label: 'Email only' },
          ]}
        />

        <Field label="Biggest headache in your shop right now? (optional)">
          <textarea
            placeholder="No-shows, keeping track of regulars, slow days…"
            value={fields.challenge}
            onChange={e => set('challenge', e.target.value)}
            rows={2}
            style={{ ...inputStyle, resize: 'none', lineHeight: 1.5 }}
          />
        </Field>
      </div>

      <button type="submit" disabled={state === 'loading'} className="btn-lime" style={{
        width: '100%', padding: '0.875rem 1.5rem', fontSize: '0.9rem',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
        opacity: state === 'loading' ? 0.7 : 1,
      }}>
        {state === 'loading'
          ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Sending…</>
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
