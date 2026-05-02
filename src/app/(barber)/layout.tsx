import { getRequiredSession } from '@/lib/session';
import Link from 'next/link';
import { LayoutDashboard } from 'lucide-react';
import DemoOverrideTrigger from '@/components/DemoOverrideTrigger';

import { cookies } from 'next/headers';

export default async function BarberLayout({ children }: { children: React.ReactNode }) {
  const session = await getRequiredSession();
  
  // Apply Demo Overrides for display
  const cookieStore = await cookies();
  const overrideCookie = cookieStore.get(`demo_override_${session.shopSlug}`);
  let shopName = session.shopName;

  if (overrideCookie) {
    try {
      const overrides = JSON.parse(decodeURIComponent(atob(overrideCookie.value)));
      if (overrides.name) shopName = overrides.name;
    } catch (e) {
      // Ignore
    }
  }

  return (
    <div style={{ minHeight: '100svh', background: '#0a0a0a', color: 'white' }}>
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '0.875rem 1.25rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <DemoOverrideTrigger shopSlug={session.shopSlug} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 700,
              fontSize: '0.85rem', textTransform: 'uppercase', color: 'white', lineHeight: 1.2,
            }}>
              {session.name}
            </div>
            <div style={{
              fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)',
              fontFamily: 'var(--font-barlow, sans-serif)', textTransform: 'uppercase', letterSpacing: '0.08em',
            }}>
              {shopName}
            </div>
          </div>
          {session.role === 'owner' && (
            <Link href="/dashboard" title="Owner dashboard" style={{
              color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center',
              padding: '0.4rem', borderRadius: 6,
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.03)',
            }}>
              <LayoutDashboard size={15} />
            </Link>
          )}
        </div>
      </header>
      <main style={{ padding: '1.25rem', paddingBottom: '2rem' }}>
        {children}
      </main>
    </div>
  );
}
