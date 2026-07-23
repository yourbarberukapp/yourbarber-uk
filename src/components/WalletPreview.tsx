'use client';

import React from 'react';

interface Props {
  shopName: string;
  customerName?: string;
  accentColor: string;
  labelColor?: string;
  loyaltyStamps?: number;
  loyaltyTarget?: number;
  rewardName?: string;
  promoMessage?: string;
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
}: Props) {
  const filled = Math.min(loyaltyStamps, loyaltyTarget);
  const stampDots = '●'.repeat(filled) + '○'.repeat(Math.max(0, loyaltyTarget - filled));

  return (
    <div
      style={{
        width: 300,
        height: 440,
        borderRadius: 16,
        background: accentColor || '#111111',
        border: '1px solid rgba(255,255,255,0.15)',
        padding: '1.25rem',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        color: 'white',
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
          <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, textTransform: 'uppercase', color: 'white', lineHeight: 1.1 }}>
            {shopName || 'BENJ BARBERS'}
          </h4>
        </div>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 900, color: labelColor }}>YB</span>
        </div>
      </div>

      {/* Stamp Section */}
      <div style={{ margin: '1.5rem 0 1rem' }}>
        <span style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: labelColor }}>
          LOYALTY STAMPS
        </span>
        <div style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '0.15em', color: 'white', marginTop: 4 }}>
          {stampDots}
        </div>
      </div>

      {/* Primary Info */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div>
          <span style={{ fontSize: '0.55rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: labelColor }}>
            REWARD
          </span>
          <p style={{ margin: '2px 0 0', fontSize: '0.8rem', fontWeight: 800, color: 'white', lineHeight: 1.2 }}>
            {rewardName}
          </p>
        </div>
        <div>
          <span style={{ fontSize: '0.55rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: labelColor }}>
            CLIENT
          </span>
          <p style={{ margin: '2px 0 0', fontSize: '0.8rem', fontWeight: 800, color: 'white', lineHeight: 1.2 }}>
            {customerName}
          </p>
        </div>
      </div>

      {promoMessage && (
        <div style={{ marginTop: '0.75rem', background: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: '0.5rem 0.75rem', border: '1px solid rgba(255,255,255,0.1)' }}>
          <span style={{ fontSize: '0.55rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: labelColor }}>
            PROMO OFFER
          </span>
          <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>
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
      <div style={{ background: accentColor || '#111111', borderRadius: 12, padding: '1rem', color: 'white' }}>
        <span style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.7 }}>
          YOURBARBER PASS
        </span>
        <h4 style={{ margin: '2px 0 0', fontSize: '1.1rem', fontWeight: 900, textTransform: 'uppercase' }}>
          {shopName || 'BENJ BARBERS'}
        </h4>
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
