'use client';

import { useState } from 'react';
import { CreditCard, X, Loader2 } from 'lucide-react';

export default function BarberWalletCardLink() {
  const [open, setOpen] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  async function addToGoogleWallet() {
    setLoadingGoogle(true);
    try {
      const res = await fetch('/api/wallet/owner/google');
      if (res.ok) {
        const { saveUrl } = await res.json();
        window.open(saveUrl, '_blank', 'noopener');
      }
    } finally {
      setLoadingGoogle(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="My Wallet card"
        style={{
          color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center',
          padding: '0.4rem', borderRadius: 6,
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.03)',
          cursor: 'pointer',
        }}
      >
        <CreditCard size={15} />
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 100, padding: '1rem',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#111', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12, padding: '1.5rem', maxWidth: 320, width: '100%',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 800, fontSize: '1rem', textTransform: 'uppercase', color: 'white', margin: 0 }}>
                My Wallet Card
              </h3>
              <button type="button" onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 4 }}>
                <X size={18} />
              </button>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', marginBottom: '1.25rem', lineHeight: 1.5 }}>
              Save your card to your phone — it carries your sign-in passcode so you can log back in any time.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <a
                href="/api/wallet/owner/apple"
                className="btn-lime"
                style={{ padding: '0.75rem', borderRadius: 6, textAlign: 'center', fontSize: '0.8rem', fontWeight: 700, textDecoration: 'none' }}
              >
                Add to Apple Wallet
              </a>
              <button
                type="button"
                onClick={addToGoogleWallet}
                disabled={loadingGoogle}
                style={{
                  padding: '0.75rem', borderRadius: 6, textAlign: 'center', fontSize: '0.8rem', fontWeight: 700,
                  background: 'rgba(255,255,255,0.08)', color: 'white', border: '1px solid rgba(255,255,255,0.15)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                }}
              >
                {loadingGoogle && <Loader2 size={14} className="animate-spin" />}
                Add to Google Wallet
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
