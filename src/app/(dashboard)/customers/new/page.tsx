'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function NewCustomerPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, name: name || undefined }),
    });
    const data = await res.json();
    if (res.status === 409) { router.push(`/customers/${data.customer.id}`); return; }
    if (!res.ok) {
      setError(data.error?.fieldErrors?.phone?.[0] ?? 'Something went wrong');
      setLoading(false);
      return;
    }
    router.push(`/customers/${data.id}`);
  }

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

  return (
    <div style={{ maxWidth: 420 }}>
      {/* Back */}
      <Link href="/customers" style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem',
        textDecoration: 'none', marginBottom: '1.5rem',
      }}>
        <ArrowLeft size={14} /> All customers
      </Link>

      <h1 style={{
        fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 900,
        fontSize: '2rem', textTransform: 'uppercase', color: 'white',
        letterSpacing: '-0.01em', marginBottom: '1.5rem',
      }}>
        Add customer
      </h1>

      <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '1.5rem' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={labelStyle}>Phone number *</label>
            <input
              type="tel"
              inputMode="tel"
              placeholder="07700 900 001"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              required
              style={{ ...inputStyle, fontSize: '1.25rem' }}
            />
          </div>
          <div>
            <label style={labelStyle}>Name (optional)</label>
            <input
              type="text"
              placeholder="First name"
              value={name}
              onChange={e => setName(e.target.value)}
              style={inputStyle}
            />
          </div>
          {error && (
            <p style={{ color: '#f87171', fontSize: '0.875rem' }}>{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="btn-lime"
            style={{ padding: '0.875rem', borderRadius: 4, fontSize: '1rem', marginTop: '0.5rem', border: 'none', display: 'block', width: '100%' }}
          >
            {loading ? 'Saving…' : 'Add customer'}
          </button>
        </form>
      </div>
    </div>
  );
}
