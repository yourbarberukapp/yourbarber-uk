'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { CreditCard, X, Loader2, Copy, Check } from 'lucide-react';

const QRCodeSVG = dynamic(() => import('qrcode.react').then((m) => m.QRCodeSVG), { ssr: false });

type Tab = 'signin' | 'client';

export default function BarberWalletCardLink({ shopSlug, barberId }: { shopSlug: string; barberId: string }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('signin');
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [copied, setCopied] = useState(false);

  const clientUrl = `https://yourbarber.uk/arrive/${shopSlug}?barber=${barberId}`;

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

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(clientUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable; the link is still visible to select manually.
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="My cards"
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
                My Cards
              </h3>
              <button type="button" onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: 3, marginBottom: '1.25rem' }}>
              <button
                type="button"
                onClick={() => setTab('signin')}
                style={{
                  flex: 1, padding: '0.5rem', borderRadius: 6, border: 'none', cursor: 'pointer',
                  fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em',
                  background: tab === 'signin' ? '#C8F135' : 'transparent',
                  color: tab === 'signin' ? '#0a0a0a' : 'rgba(255,255,255,0.5)',
                }}
              >
                Sign-in Card
              </button>
              <button
                type="button"
                onClick={() => setTab('client')}
                style={{
                  flex: 1, padding: '0.5rem', borderRadius: 6, border: 'none', cursor: 'pointer',
                  fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em',
                  background: tab === 'client' ? '#C8F135' : 'transparent',
                  color: tab === 'client' ? '#0a0a0a' : 'rgba(255,255,255,0.5)',
                }}
              >
                Client QR
              </button>
            </div>

            {tab === 'signin' ? (
              <>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                  Save your card to your phone - it carries your sign-in passcode so you can log back in any time.
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
              </>
            ) : (
              <>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', marginBottom: '1rem', lineHeight: 1.5 }}>
                  Share this with a client - scanning it joins your queue with you pre-selected as their barber.
                </p>
                <div style={{ background: 'white', borderRadius: 10, padding: '1rem', display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                  <QRCodeSVG value={clientUrl} size={160} fgColor="#0A0A0A" bgColor="white" />
                </div>
                <button
                  type="button"
                  onClick={copyLink}
                  style={{
                    width: '100%', padding: '0.75rem', borderRadius: 6,
                    background: 'rgba(255,255,255,0.08)', color: 'white', border: '1px solid rgba(255,255,255,0.15)',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                    fontSize: '0.75rem', fontWeight: 700,
                  }}
                >
                  {copied ? <Check size={14} color="#C8F135" /> : <Copy size={14} />}
                  {copied ? 'Copied' : 'Copy link'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
