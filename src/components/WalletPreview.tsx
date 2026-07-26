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
  const fg = computeForegroundColour(accentColor);
  const fgMuted = fg === '#ffffff' ? 'rgba(255,255,255,0.65)' : 'rgba(17,17,17,0.6)';
  const fgBorder = fg === '#ffffff' ? 'rgba(255,255,255,0.14)' : 'rgba(17,17,17,0.14)';
  const fgSubtleBg = fg === '#ffffff' ? 'rgba(255,255,255,0.07)' : 'rgba(17,17,17,0.06)';
  const dotOn = labelColor;
  const dotOff = fg === '#ffffff' ? 'rgba(255,255,255,0.18)' : 'rgba(17,17,17,0.16)';

  return (
    <div
      style={{
        width: 300,
        height: 440,
        borderRadius: 18,
        background: accentColor
          ? `linear-gradient(160deg, ${accentColor} 0%, ${accentColor} 55%, rgba(0,0,0,0.18) 100%)`
          : '#111111',
        border: `1px solid ${fgBorder}`,
        padding: 0,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        color: fg,
        boxShadow: '0 24px 48px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.08)',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'var(--font-barlow, sans-serif)',
      }}
    >
      {/* Banner / hero image, always present so the card never reads as a flat block */}
      <div style={{ position: 'relative', width: '100%', height: 108, flexShrink: 0, background: 'rgba(0,0,0,0.25)' }}>
        {stripUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={stripUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              background: `linear-gradient(135deg, rgba(255,255,255,0.10), rgba(255,255,255,0) 60%)`,
            }}
          />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.35) 100%)' }} />

        {/* Logo badge, overlaps the banner bottom edge */}
        <div
          style={{
            position: 'absolute',
            left: 20,
            bottom: -22,
            width: 52,
            height: 52,
            borderRadius: 12,
            background: '#0a0a0a',
            border: '3px solid #0a0a0a',
            boxShadow: '0 8px 18px rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 4 }} />
          ) : (
            <span style={{ fontSize: '1rem', fontWeight: 900, color: labelColor }}>YB</span>
          )}
        </div>
      </div>

      <div style={{ padding: '1.25rem', paddingTop: '2rem', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
        {/* Header */}
        <div>
          <span style={{ fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: labelColor }}>
            BARBERSHOP PASS
          </span>
          <h4 style={{ margin: '2px 0 0', fontSize: '1.3rem', fontWeight: 900, textTransform: 'uppercase', color: fg, lineHeight: 1.1 }}>
            {shopName || 'BENJ BARBERS'}
          </h4>
        </div>

        {/* Stamp Section */}
        <div style={{ margin: '1.1rem 0 0.9rem' }}>
          <span style={{ fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: labelColor }}>
            LOYALTY STAMPS · {filled}/{loyaltyTarget}
          </span>
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            {Array.from({ length: loyaltyTarget }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  background: i < filled ? dotOn : 'transparent',
                  border: `2px solid ${i < filled ? dotOn : dotOff}`,
                  boxShadow: i < filled ? `0 0 8px ${dotOn}66` : 'none',
                }}
              />
            ))}
          </div>
        </div>

        {/* Primary Info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', paddingTop: '0.85rem', borderTop: `1px solid ${fgBorder}` }}>
          <div>
            <span style={{ fontSize: '0.55rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: labelColor }}>
              REWARD
            </span>
            <p style={{ margin: '2px 0 0', fontSize: '0.85rem', fontWeight: 800, color: fg, lineHeight: 1.2 }}>
              {rewardName}
            </p>
          </div>
          <div>
            <span style={{ fontSize: '0.55rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: labelColor }}>
              CLIENT
            </span>
            <p style={{ margin: '2px 0 0', fontSize: '0.85rem', fontWeight: 800, color: fg, lineHeight: 1.2 }}>
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
        <div style={{ marginTop: 'auto', paddingTop: '0.9rem', background: 'white', borderRadius: 12, padding: '0.85rem', textAlign: 'center', color: '#0a0a0a' }}>
          <div
            style={{
              width: 84,
              height: 84,
              margin: '0 auto',
              borderRadius: 6,
              backgroundImage:
                'repeating-linear-gradient(0deg, #0a0a0a 0 3px, transparent 3px 6px), repeating-linear-gradient(90deg, #0a0a0a 0 3px, transparent 3px 6px)',
              backgroundBlendMode: 'multiply',
              backgroundColor: 'white',
            }}
          />
          <span style={{ fontSize: '0.55rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#666', marginTop: 6, display: 'block' }}>
            PRESENT BARCODE TO BARBER
          </span>
        </div>
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
  const filled = Math.min(loyaltyStamps, loyaltyTarget);

  return (
    <div
      style={{
        width: 300,
        height: 440,
        borderRadius: 20,
        background: '#ffffff',
        border: '1px solid rgba(0,0,0,0.08)',
        padding: 0,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        color: '#1f1f1f',
        boxShadow: '0 18px 40px rgba(0,0,0,0.18)',
        overflow: 'hidden',
        fontFamily: 'Roboto, sans-serif',
      }}
    >
      {/* Google Wallet Header Banner */}
      <div style={{ position: 'relative', background: accentColor || '#111111', height: 96, flexShrink: 0 }}>
        {stripUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={stripUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0) 60%)` }} />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(0,0,0,0.3) 100%)' }} />
        <div style={{ position: 'absolute', left: '1.1rem', right: '1.1rem', bottom: '0.75rem', color: 'white' }}>
          <span style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.85 }}>
            YOURBARBER PASS
          </span>
          <h4 style={{ margin: '2px 0 0', fontSize: '1.15rem', fontWeight: 900, textTransform: 'uppercase', lineHeight: 1.1 }}>
            {shopName || 'BENJ BARBERS'}
          </h4>
        </div>
        <div
          style={{
            position: 'absolute',
            right: 16,
            bottom: -18,
            width: 44,
            height: 44,
            borderRadius: 10,
            background: '#fff',
            boxShadow: '0 6px 14px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 4 }} />
          ) : (
            <span style={{ fontSize: '0.85rem', fontWeight: 900, color: accentColor || '#111' }}>YB</span>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '1.5rem 1.25rem 1.25rem', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: '0.9rem' }}>
          {Array.from({ length: loyaltyTarget }).map((_, i) => (
            <div
              key={i}
              style={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                background: i < filled ? (accentColor || '#111') : 'transparent',
                border: `2px solid ${i < filled ? (accentColor || '#111') : '#ddd'}`,
              }}
            />
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', color: '#888' }}>
              STAMPS
            </span>
            <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#111' }}>
              {loyaltyStamps} of {loyaltyTarget}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', color: '#888' }}>
              CLIENT
            </span>
            <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#111' }}>
              {customerName}
            </p>
          </div>
        </div>

        <div style={{ background: '#f5f5f5', borderRadius: 10, padding: '0.75rem' }}>
          <span style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', color: '#888' }}>
            REWARD
          </span>
          <p style={{ margin: '2px 0 0', fontSize: '0.85rem', fontWeight: 800, color: '#111' }}>
            {rewardName}
          </p>
        </div>

        {/* Barcode */}
        <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid #eee', textAlign: 'center' }}>
          <div
            style={{
              width: 78,
              height: 78,
              margin: '0 auto',
              borderRadius: 6,
              backgroundImage:
                'repeating-linear-gradient(0deg, #111 0 3px, transparent 3px 6px), repeating-linear-gradient(90deg, #111 0 3px, transparent 3px 6px)',
              backgroundBlendMode: 'multiply',
              backgroundColor: 'white',
            }}
          />
          <span style={{ fontSize: '0.55rem', fontWeight: 700, color: '#888', marginTop: 6, display: 'block' }}>
            SCAN AT BARBER SCANNER
          </span>
        </div>
      </div>
    </div>
  );
}
