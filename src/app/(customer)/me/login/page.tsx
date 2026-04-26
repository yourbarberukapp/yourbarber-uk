'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Scissors, ArrowRight, Loader2 } from 'lucide-react';

const lime = '#C8F135';
const dark = '#0a0a0a';

export default function CustomerLoginPage() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 5) return;
    setBusy(true);
    setError('');

    const res = await fetch('/api/customer/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: code.toUpperCase() }),
    });

    if (res.ok) {
      router.push('/me');
    } else {
      setError("That code didn't match. Check the card your barber gave you.");
      setBusy(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: dark, padding: '1.5rem',
    }}>
      {/* Wordmark */}
      <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <Scissors size={20} color={lime} />
          <span style={{
            fontFamily: "'Barlow Condensed','Arial Black',sans-serif",
            fontWeight: 900, fontSize: '1.75rem', textTransform: 'uppercase',
            letterSpacing: '-0.01em',
          }}>
            <span style={{ color: 'white' }}>YOUR</span>
            <span style={{ color: lime }}>BARBER</span>
          </span>
        </div>
        <p style={{
          color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem',
          fontFamily: "'Barlow Condensed',sans-serif",
          textTransform: 'uppercase', letterSpacing: '0.15em',
        }}>
          Your cut passport
        </p>
      </div>

      {/* Card */}
      <div style={{
        width: '100%', maxWidth: 360,
        background: '#111', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12, padding: '2rem',
      }}>
        <h1 style={{
          fontFamily: "'Barlow Condensed','Arial Black',sans-serif",
          fontWeight: 900, fontSize: '1.5rem', textTransform: 'uppercase',
          color: 'white', margin: '0 0 0.375rem',
        }}>
          Enter your code
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem', margin: '0 0 1.75rem', lineHeight: 1.5 }}>
          5-letter code from your barber's card or your last visit receipt.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input
            ref={inputRef}
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase().slice(0, 5))}
            placeholder="XXXXX"
            maxLength={5}
            autoFocus
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            style={{
              width: '100%', padding: '0.875rem 1rem',
              background: '#1a1a1a', border: `1px solid ${code.length === 5 ? lime : 'rgba(255,255,255,0.1)'}`,
              borderRadius: 6, color: 'white',
              fontFamily: 'monospace', fontSize: '1.5rem',
              textAlign: 'center', letterSpacing: '0.5em',
              textTransform: 'uppercase', outline: 'none',
              transition: 'border-color 0.2s',
              boxSizing: 'border-box',
            }}
          />

          {error && (
            <p style={{
              color: '#ff6b6b', fontSize: '0.8rem',
              background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.2)',
              borderRadius: 4, padding: '0.625rem 0.75rem', margin: 0,
            }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={code.length !== 5 || busy}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '0.875rem', borderRadius: 6,
              background: code.length === 5 ? lime : 'rgba(255,255,255,0.06)',
              color: code.length === 5 ? dark : 'rgba(255,255,255,0.2)',
              border: 'none', cursor: code.length === 5 ? 'pointer' : 'default',
              fontFamily: "'Barlow Condensed',sans-serif",
              fontWeight: 900, fontSize: '1rem', textTransform: 'uppercase',
              letterSpacing: '0.08em', transition: 'all 0.2s',
            }}
          >
            {busy ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <ArrowRight size={18} />}
            {busy ? 'Checking...' : 'View my cuts'}
          </button>
        </form>
      </div>

      <p style={{
        marginTop: '2rem', color: 'rgba(255,255,255,0.15)',
        fontSize: '0.7rem', textAlign: 'center',
        fontFamily: "'Barlow Condensed',sans-serif",
        textTransform: 'uppercase', letterSpacing: '0.1em',
      }}>
        Powered by YourBarber
      </p>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
