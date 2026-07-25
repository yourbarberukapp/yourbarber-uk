'use client';

import React from 'react';
import { AppleWalletPreview } from '@/components/WalletPreview';

export interface WizardState {
  shopName: string;
  logoUrl: string;
  accentColor: string;
  labelColor: string;
  stripUrl: string;
  loyaltyTarget: number;
  loyaltyReward: string;
}

const STEPS = [
  { key: 'logo', label: 'Logo' },
  { key: 'colour', label: 'Colour' },
  { key: 'banner', label: 'Banner' },
  { key: 'loyalty', label: 'Loyalty' },
  { key: 'review', label: 'Review' },
] as const;

export function OnboardingLayout({
  step,
  state,
  children,
}: {
  step: string;
  state: WizardState;
  children: React.ReactNode;
}) {
  const currentIndex = STEPS.findIndex((s) => s.key === step);

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0A', display: 'flex', flexDirection: 'column' }}>
      {/* Progress bar */}
      <div style={{ padding: '1.5rem 1.5rem 0', maxWidth: 1100, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {STEPS.map((s, i) => (
            <div
              key={s.key}
              style={{
                flex: 1,
                height: 3,
                borderRadius: 2,
                background: i <= currentIndex ? '#C8F135' : 'rgba(255,255,255,0.1)',
                transition: 'background 0.3s',
              }}
            />
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
          {STEPS.map((s, i) => (
            <span
              key={s.key}
              style={{
                fontSize: '0.65rem',
                fontFamily: 'var(--font-barlow, sans-serif)',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: i <= currentIndex ? '#C8F135' : 'rgba(255,255,255,0.3)',
              }}
            >
              {s.label}
            </span>
          ))}
        </div>
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexWrap: 'wrap',
          gap: '2.5rem',
          alignItems: 'flex-start',
          justifyContent: 'center',
          maxWidth: 1100,
          margin: '0 auto',
          padding: '2.5rem 1.5rem',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ flex: '1 1 380px', maxWidth: 460 }}>{children}</div>

        <div style={{ flex: '0 0 auto', position: 'sticky', top: '2rem' }}>
          <p
            style={{
              fontSize: '0.7rem',
              fontFamily: 'var(--font-barlow, sans-serif)',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'rgba(255,255,255,0.4)',
              marginBottom: '0.75rem',
              textAlign: 'center',
            }}
          >
            Live Pass Preview
          </p>
          <AppleWalletPreview
            shopName={state.shopName}
            accentColor={state.accentColor}
            labelColor={state.labelColor}
            loyaltyTarget={state.loyaltyTarget}
            rewardName={state.loyaltyReward}
            logoUrl={state.logoUrl || null}
            stripUrl={state.stripUrl || null}
          />
        </div>
      </div>
    </div>
  );
}

export const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.75rem 1rem',
  background: '#141414',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 4,
  color: 'white',
  fontSize: '1rem',
  outline: 'none',
  fontFamily: 'var(--font-inter, sans-serif)',
};

export const cardStyle: React.CSSProperties = {
  background: '#111',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 8,
  padding: '2rem',
};
