import { getRequiredSession } from '@/lib/session';
import Link from 'next/link';
import { LayoutDashboard } from 'lucide-react';

export default async function BarberLayout({ children }: { children: React.ReactNode }) {
  const session = await getRequiredSession();

  return (
    <div style={{ minHeight: '100svh', background: '#0a0a0a', color: 'white' }}>
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '0.875rem 1.25rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{
            fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 900,
            fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '0.02em', color: 'white',
          }}>
            YOUR<span style={{ color: '#C8F135' }}>BARBER</span>
          </span>
          <span style={{
            fontSize: '0.55rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
            background: 'rgba(200,241,53,0.1)', color: '#C8F135',
            border: '1px solid rgba(200,241,53,0.2)',
            padding: '0.2rem 0.5rem', borderRadius: 2,
            fontFamily: 'var(--font-barlow, sans-serif)',
          }}>Barber</span>
        </div>
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
              {session.shopName}
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
