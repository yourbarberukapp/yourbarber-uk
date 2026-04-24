import Link from 'next/link';
import { ArrowRight, Check, X, Minus } from 'lucide-react';

const optInConfigs = {
  yes: { bg: 'rgba(200,241,53,0.1)', color: '#C8F135', border: 'rgba(200,241,53,0.2)', label: 'SMS on', Icon: Check },
  no: { bg: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.35)', border: 'rgba(255,255,255,0.1)', label: 'SMS off', Icon: X },
  not_asked: { bg: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.25)', border: 'rgba(255,255,255,0.08)', label: 'Not asked', Icon: Minus },
} as const;

interface Props {
  id: string;
  phone: string;
  name?: string | null;
  smsOptIn: string;
  lastVisitAt?: string | null;
}

export function CustomerCard({ id, phone, name, smsOptIn, lastVisitAt }: Props) {
  const lastVisit = lastVisitAt ? new Date(lastVisitAt).toLocaleDateString('en-GB') : 'Never';
  const c = optInConfigs[smsOptIn as keyof typeof optInConfigs] ?? optInConfigs.not_asked;
  const initials = name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '#';

  return (
    <Link href={`/customers/${id}`} style={{ textDecoration: 'none', display: 'block', marginBottom: 4 }}>
      <div style={{
        background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6,
        padding: '0.875rem 1.25rem', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: '0.75rem', transition: 'background 0.15s',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(200,241,53,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ color: '#C8F135', fontSize: '0.7rem', fontWeight: 700, fontFamily: 'var(--font-barlow, sans-serif)' }}>
              {initials}
            </span>
          </div>
          <div>
            <p style={{ color: 'white', fontWeight: 500, fontSize: '0.875rem' }}>{name ?? 'No name'}</p>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem', fontFamily: 'monospace' }}>
              {phone} &middot; Last visit: {lastVisit}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            background: c.bg, color: c.color, border: `1px solid ${c.border}`,
            fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.08em', padding: '0.15rem 0.5rem', borderRadius: 2,
            fontFamily: 'var(--font-barlow, sans-serif)', whiteSpace: 'nowrap',
          }}>
            <c.Icon size={9} /> {c.label}
          </span>
          <ArrowRight size={14} style={{ color: 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
        </div>
      </div>
    </Link>
  );
}
