'use client';

import Image from 'next/image';

export function PhoneChrome({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      width: 260, flexShrink: 0,
      background: '#111', border: '6px solid #1e1e1e',
      borderRadius: 36,
      boxShadow: '0 40px 80px rgba(0,0,0,0.7), inset 0 0 0 1px rgba(255,255,255,0.04)',
      overflow: 'hidden',
    }}>
      <div style={{ background: '#0a0a0a', padding: '10px 20px 4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'white', fontFamily: 'monospace' }}>9:41</span>
        <div style={{ width: 40, height: 4, background: '#1e1e1e', borderRadius: 2 }} />
      </div>
      <div style={{ background: '#0a0a0a' }}>{children}</div>
    </div>
  );
}

export function CustomerMockup() {
  return (
    <PhoneChrome>
      <div style={{ padding: '1rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1rem', paddingTop: '0.5rem' }}>
          <div style={{ fontSize: 9, fontFamily: 'var(--font-barlow)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>The Barber Room</div>
          <div style={{ fontSize: 22, fontFamily: 'var(--font-barlow)', fontWeight: 900, textTransform: 'uppercase', color: 'white', lineHeight: 1 }}>3 waiting</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-inter)', marginTop: 2 }}>About 20 minutes</div>
        </div>

        <div style={{ background: '#C8F135', borderRadius: 6, padding: '0.6rem', textAlign: 'center', marginBottom: '1rem' }}>
          <span style={{ fontSize: 11, fontFamily: 'var(--font-barlow)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#0a0a0a' }}>Join the queue</span>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.75rem' }}>
          {[
            { pos: 1, name: 'Marcus T.', service: 'Skin Fade', status: 'IN CHAIR', lime: true },
            { pos: 2, name: 'Jordan K.', service: 'Textured Crop', status: "NEXT", dim: true },
            { pos: 3, name: 'Theo P.', service: 'Standard Cut', status: '~10 min', dim: true },
            { pos: 4, name: 'You', service: 'Taper Fade', status: '~20 min', you: true },
          ].map(r => (
            <div key={r.pos} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '5px 4px',
              background: r.you ? 'rgba(200,241,53,0.06)' : 'transparent',
              borderRadius: 4,
              marginBottom: 2,
            }}>
              <span style={{ fontSize: 9, fontFamily: 'var(--font-barlow)', fontWeight: 900, color: r.lime ? '#C8F135' : r.you ? '#C8F135' : 'rgba(255,255,255,0.2)', width: 12, textAlign: 'center' }}>{r.pos}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 9, fontFamily: 'var(--font-barlow)', fontWeight: 800, textTransform: 'uppercase', color: r.you ? 'white' : r.lime ? 'white' : 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</div>
                <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.2)', fontFamily: 'var(--font-barlow)', textTransform: 'uppercase' }}>{r.service}</div>
              </div>
              <span style={{ fontSize: 7, fontFamily: 'var(--font-barlow)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: r.lime ? '#C8F135' : r.you ? 'rgba(200,241,53,0.7)' : 'rgba(255,255,255,0.2)', whiteSpace: 'nowrap' }}>{r.status}</span>
            </div>
          ))}
        </div>
      </div>
    </PhoneChrome>
  );
}

export function WalletLockScreenMockup() {
  return (
    <div
      style={{
        width: 300,
        aspectRatio: '300 / 375',
        borderRadius: 14,
        overflow: 'hidden',
        position: 'relative',
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        background: 'linear-gradient(160deg, #0d1f0d 0%, #06120a 55%, #030603 100%)',
      }}
    >
      {/* Lock screen chrome */}
      <div style={{ textAlign: 'center', paddingTop: 28 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--font-inter)' }}>Friday, May 24</div>
        <div style={{ fontSize: 52, fontWeight: 300, color: 'white', letterSpacing: '-0.02em', lineHeight: 1.1, fontFamily: 'var(--font-inter)' }}>10:30</div>
      </div>

      {/* Wallet pass push notification */}
      <div
        style={{
          margin: '28px 14px 0',
          background: 'rgba(255,255,255,0.12)',
          backdropFilter: 'blur(20px)',
          borderRadius: 14,
          padding: '10px 12px',
          display: 'flex',
          gap: 10,
          alignItems: 'flex-start',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div
          style={{
            width: 32, height: 32, borderRadius: 8, flexShrink: 0,
            background: '#C8F135', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 900, color: '#0a0a0a', fontFamily: 'var(--font-barlow)' }}>YB</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'white', fontFamily: 'var(--font-barlow)' }}>Wallet</span>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-inter)' }}>now</span>
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'white', marginTop: 2, fontFamily: 'var(--font-inter)' }}>The Barber Room</div>
          <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.65)', marginTop: 1, lineHeight: 1.3, fontFamily: 'var(--font-inter)' }}>
            You&apos;re due back in — tap to see your usual, Marcus.
          </div>
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: 18, left: 0, right: 0, textAlign: 'center' }}>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-barlow)' }}>
          Swipe up to unlock
        </div>
      </div>
    </div>
  );
}

export function BarberMockup() {
  return (
    <PhoneChrome>
      <div style={{ padding: '0.875rem 0.875rem 1rem' }}>
        <div style={{ fontSize: 8, fontFamily: 'var(--font-barlow)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.25)', marginBottom: 8 }}>Queue · 4 waiting</div>

        {/* Card 1 - in chair with passport */}
        <div style={{ background: 'rgba(200,241,53,0.07)', border: '1px solid rgba(200,241,53,0.2)', borderRadius: 8, padding: '0.625rem', marginBottom: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
            <div>
              <div style={{ fontSize: 10, fontFamily: 'var(--font-barlow)', fontWeight: 900, textTransform: 'uppercase', color: 'white' }}>Marcus T.</div>
              <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-barlow)', textTransform: 'uppercase' }}>Skin Fade</div>
            </div>
            <span style={{ fontSize: 7, fontFamily: 'var(--font-barlow)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#C8F135' }}>In Chair</span>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 5, padding: '0.4rem 0.5rem' }}>
            <div style={{ fontSize: 7, fontFamily: 'var(--font-barlow)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(200,241,53,0.6)', marginBottom: 4 }}>Cut Passport</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, marginBottom: 4 }}>
              {[['Top', '#2'], ['Sides', '#1'], ['Neckline', 'Tapered'], ['Beard', 'Lined']].map(([k, v]) => (
                <div key={k}>
                  <div style={{ fontSize: 6, color: 'rgba(255,255,255,0.25)', fontFamily: 'var(--font-barlow)', textTransform: 'uppercase' }}>{k}</div>
                  <div style={{ fontSize: 8, color: 'white', fontFamily: 'var(--font-barlow)', fontWeight: 700 }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              {[
                { src: '/trends/skin-fade.png', pos: 'center 15%', label: 'Front' },
                { src: '/trends/skin-fade.png', pos: 'right 10%', label: 'Left' },
                { src: '/trends/skin-fade.png', pos: 'left 10%', label: 'Right' },
                { src: '/trends/classic-taper.png', pos: 'center 5%', label: 'Back' },
              ].map(({ src, pos, label }, i) => (
                <div key={i} style={{ aspectRatio: '4/3', borderRadius: 3, overflow: 'hidden', position: 'relative', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <Image src={src} alt={label} fill sizes="(max-width: 768px) 30vw, 100px" style={{ objectFit: 'cover', objectPosition: pos, opacity: 0.85 }} />
                  <span style={{ position: 'absolute', bottom: 2, left: 2, fontSize: '5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', background: 'rgba(0,0,0,0.65)', color: 'rgba(255,255,255,0.7)', padding: '1px 3px', borderRadius: 1, fontFamily: 'var(--font-barlow)' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '0.5rem 0.625rem', marginBottom: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 10, fontFamily: 'var(--font-barlow)', fontWeight: 800, textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)' }}>Jordan K.</div>
              <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-barlow)', textTransform: 'uppercase' }}>Textured Crop</div>
            </div>
            <span style={{ fontSize: 7, background: 'rgba(255,200,50,0.15)', color: 'rgba(255,200,50,0.8)', padding: '2px 5px', borderRadius: 3, fontFamily: 'var(--font-barlow)', fontWeight: 700, textTransform: 'uppercase' }}>First visit</span>
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8, padding: '0.5rem 0.625rem' }}>
          <div style={{ fontSize: 10, fontFamily: 'var(--font-barlow)', fontWeight: 800, textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>Theo P. + 1 more</div>
          <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)', fontFamily: 'var(--font-barlow)', textTransform: 'uppercase' }}>Standard Cut · ~15 min</div>
        </div>
      </div>
    </PhoneChrome>
  );
}
