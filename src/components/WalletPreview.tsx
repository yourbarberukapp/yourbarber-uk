'use client';

import React from 'react';

/**
 * Primary text colour on the pass — flips to near-black once the accent
 * background is light enough that white text loses contrast (e.g. lime
 * green). Standard WCAG relative-luminance check; mirrors
 * computeForegroundColour in src/lib/wallet/passGenerator.ts so the preview
 * matches the real generated pass.
 */
function computeForegroundColour(hex?: string): string {
  const safe = /^#[0-9a-f]{6}$/i.test(hex || '') ? (hex as string).slice(1) : '111111';
  const r = parseInt(safe.slice(0, 2), 16) / 255;
  const g = parseInt(safe.slice(2, 4), 16) / 255;
  const b = parseInt(safe.slice(4, 6), 16) / 255;
  const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const luminance = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  return luminance > 0.5 ? '#111111' : '#ffffff';
}

interface Props {
  shopName: string;
  customerName?: string;
  accentColor: string;
  labelColor?: string;
  loyaltyStamps?: number;
  loyaltyTarget?: number;
  rewardName?: string;
  promoMessage?: string;
  logoUrl?: string | null;
  stripUrl?: string | null;
}

export function AppleWalletPreview({
  shopName,
  customerName = 'ALEX SMITH',
  accentColor,
  labelColor = '#C8F135',
  loyaltyStamps = 3,
  loyaltyTarget = 5,
  rewardName = '50% Off 5th Cut',
  promoMessage,
  logoUrl,
  stripUrl,
}: Props) {
  const filled = Math.min(loyaltyStamps, loyaltyTarget);
  const stampDots = '●'.repeat(filled) + '○'.repeat(Math.max(0, loyaltyTarget - filled));
  const fg = computeForegroundColour(accentColor);
  const fgMuted = fg === '#ffffff' ? 'rgba(255,255,255,0.8)' : 'rgba(17,17,17,0.7)';
  const fgBorder = fg === '#ffffff' ? 'rgba(255,255,255,0.15)' : 'rgba(17,17,17,0.15)';
  const fgSubtleBg = fg === '#ffffff' ? 'rgba(255,255,255,0.06)' : 'rgba(17,17,17,0.06)';
  const fgIconBg = fg === '#ffffff' ? 'rgba(255,255,255,0.1)' : 'rgba(17,17,17,0.1)';

  return (
    <div
      style={{
        width: 300,
        height: 440,
        borderRadius: 16,
        background: accentColor || '#111111',
        border: `1px solid ${fgBorder}`,
        padding: '1.25rem',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        color: fg,
        boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'var(--font-barlow, sans-serif)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: labelColor }}>
            BARBERSHOP PASS
          </span>
          <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, textTransform: 'uppercase', color: fg, lineHeight: 1.1 }}>
            {shopName || 'BENJ BARBERS'}
          </h4>
        </div>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: fgIconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: '0.75rem', fontWeight: 900, color: labelColor }}>YB</span>
          )}
        </div>
      </div>

      {stripUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={stripUrl}
          alt=""
          style={{ width: '100%', height: 64, objectFit: 'cover', borderRadius: 8, margin: '0.75rem 0 0' }}
        />
      )}

      {/* Stamp Section */}
      <div style={{ margin: '1.5rem 0 1rem' }}>
        <span style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: labelColor }}>
          LOYALTY STAMPS
        </span>
        <div style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '0.15em', color: fg, marginTop: 4 }}>
          {stampDots}
        </div>
      </div>

      {/* Primary Info */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div>
          <span style={{ fontSize: '0.55rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: labelColor }}>
            REWARD
          </span>
          <p style={{ margin: '2px 0 0', fontSize: '0.8rem', fontWeight: 800, color: fg, lineHeight: 1.2 }}>
            {rewardName}
          </p>
        </div>
        <div>
          <span style={{ fontSize: '0.55rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: labelColor }}>
            CLIENT
          </span>
          <p style={{ margin: '2px 0 0', fontSize: '0.8rem', fontWeight: 800, color: fg, lineHeight: 1.2 }}>
            {customerName}
          </p>
        </div>
      </div>

      {promoMessage && (
        <div style={{ marginTop: '0.75rem', background: fgSubtleBg, borderRadius: 8, padding: '0.5rem 0.75rem', border: `1px solid ${fgBorder}` }}>
          <span style={{ fontSize: '0.55rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: labelColor }}>
            PROMO OFFER
          </span>
          <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: fgMuted }}>
            {promoMessage}
          </p>
        </div>
      )}

      {/* QR Barcode */}
      <div style={{ marginTop: 'auto', background: 'white', borderRadius: 10, padding: '0.75rem', textAlign: 'center', color: '#0a0a0a' }}>
        <div style={{ width: 80, height: 80, background: '#0a0a0a', margin: '0 auto', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: 'white', fontSize: '0.6rem', fontFamily: 'monospace' }}>[QR BARCODE]</span>
        </div>
        <span style={{ fontSize: '0.55rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#666', marginTop: 4, display: 'block' }}>
          PRESENT BARCODE TO BARBER
        </span>
      </div>
    </div>
  );
}

export function GoogleWalletPreview({
  shopName,
  customerName = 'ALEX SMITH',
  accentColor,
  loyaltyStamps = 3,
  loyaltyTarget = 5,
  rewardName = '50% Off 5th Cut',
  logoUrl,
  stripUrl,
}: Props) {
  return (
    <div
      style={{
        width: 300,
        height: 440,
        borderRadius: 20,
        background: '#ffffff',
        border: '1px solid rgba(0,0,0,0.1)',
        padding: '1.25rem',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        color: '#1f1f1f',
        boxShadow: '0 15px 35px rgba(0,0,0,0.15)',
        fontFamily: 'Roboto, sans-serif',
      }}
    >
      {/* Google Wallet Header Banner */}
      <div style={{ background: accentColor || '#111111', borderRadius: 12, overflow: 'hidden', color: 'white' }}>
        {stripUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={stripUrl} alt="" style={{ width: '100%', height: 64, objectFit: 'cover', display: 'block' }} />
        )}
        <div style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
          )}
          <div>
            <span style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.7 }}>
              YOURBARBER PASS
            </span>
            <h4 style={{ margin: '2px 0 0', fontSize: '1.1rem', fontWeight: 900, textTransform: 'uppercase' }}>
              {shopName || 'BENJ BARBERS'}
            </h4>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ margin: '1rem 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', color: '#666' }}>
              STAMPS
            </span>
            <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#111' }}>
              {loyaltyStamps} of {loyaltyTarget}
            </p>
          </div>
          <div>
            <span style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', color: '#666' }}>
              CLIENT
            </span>
            <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#111' }}>
              {customerName}
            </p>
          </div>
        </div>

        <div style={{ background: '#f5f5f5', borderRadius: 10, padding: '0.75rem' }}>
          <span style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', color: '#666' }}>
            REWARD
          </span>
          <p style={{ margin: '2px 0 0', fontSize: '0.85rem', fontWeight: 800, color: '#111' }}>
            {rewardName}
          </p>
        </div>
      </div>

      {/* Barcode */}
      <div style={{ borderTop: '1px solid #eee', paddingTop: '0.75rem', textAlign: 'center' }}>
        <div style={{ width: 75, height: 75, background: '#111', margin: '0 auto', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: 'white', fontSize: '0.55rem', fontFamily: 'monospace' }}>[QR CODE]</span>
        </div>
        <span style={{ fontSize: '0.55rem', fontWeight: 700, color: '#888', marginTop: 4, display: 'block' }}>
          SCAN AT BARBER SCANNER
        </span>
      </div>
    </div>
  );
}
