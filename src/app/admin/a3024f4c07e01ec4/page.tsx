import { db } from '@/lib/db';
import Link from 'next/link';
import ApproveButton from './ApproveButton';

function toWaPhone(phone: string) {
  const clean = phone.replace(/\D/g, '');
  if (clean.startsWith('07')) return '44' + clean.slice(1);
  return clean;
}

function timeAgo(date: Date) {
  const mins = Math.floor((Date.now() - date.getTime()) / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const pill = (label: string, lime = false): React.CSSProperties => ({
  display: 'inline-block',
  padding: '2px 8px',
  borderRadius: 4,
  fontSize: '0.7rem',
  fontWeight: 700,
  fontFamily: 'var(--font-barlow)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  background: lime ? 'rgba(200,241,53,0.12)' : 'rgba(255,255,255,0.07)',
  color: lime ? '#C8F135' : 'rgba(255,255,255,0.45)',
});

export default async function AdminLeadsPage() {
  const leads = await db.demoLead.findMany({ orderBy: { createdAt: 'desc' } });
  const pending = leads.filter(l => !l.approved);
  const approved = leads.filter(l => l.approved);

  function LeadCard({ lead }: { lead: typeof leads[number] }) {
    const waPhone = toWaPhone(lead.phone);
    const waMsg = encodeURIComponent(
      `Hi ${lead.name.split(' ')[0]}, it's Luke from YourBarber — just approved your beta application! Sign in at yourbarber.uk/login with your Google account (${lead.email}) to get started.`
    );

    return (
      <div style={{
        background: '#111', border: `1px solid ${lead.approved ? 'rgba(200,241,53,0.15)' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 12, padding: '1.25rem 1.5rem',
      }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-barlow)', fontWeight: 900, fontSize: '1.1rem', textTransform: 'uppercase', color: 'white' }}>
              {lead.name}
            </div>
            <div style={{ color: '#C8F135', fontSize: '0.875rem', fontWeight: 700, marginTop: '0.1rem' }}>
              {lead.shopName || '—'}{lead.postcode ? ` · ${lead.postcode}` : ''}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.75rem' }}>{timeAgo(lead.createdAt)}</span>
            <ApproveButton id={lead.id} approved={lead.approved} />
          </div>
        </div>

        {/* Quick stats */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
          {lead.chairs && <span style={pill(`${lead.chairs} chair${lead.chairs > 1 ? 's' : ''}`)}>{lead.chairs} chair{lead.chairs > 1 ? 's' : ''}</span>}
          {lead.barberCount && <span style={pill(`${lead.barberCount} barber${lead.barberCount > 1 ? 's' : ''}`)}>{lead.barberCount} barber{lead.barberCount > 1 ? 's' : ''}</span>}
          {lead.employmentType && <span style={pill(lead.employmentType)}>{lead.employmentType}</span>}
          {lead.commsPreference && <span style={pill(lead.commsPreference, lead.commsPreference === 'whatsapp')}>{lead.commsPreference === 'whatsapp' ? '📱 WhatsApp' : '✉️ Email'}</span>}
        </div>

        {/* Contact */}
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', marginBottom: lead.challenge ? '0.75rem' : 0, display: 'flex', gap: '1rem', flexWrap: 'wrap', fontFamily: 'var(--font-inter)' }}>
          <span>{lead.phone}</span>
          <span>·</span>
          <span>{lead.email}</span>
        </div>

        {/* Challenge */}
        {lead.challenge && (
          <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.8rem', fontStyle: 'italic', fontFamily: 'var(--font-inter)', marginBottom: '0.75rem' }}>
            &ldquo;{lead.challenge}&rdquo;
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <a
            href={`https://wa.me/${waPhone}?text=${waMsg}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: '#25D366', color: 'white',
              padding: '0.4rem 0.875rem', borderRadius: 6,
              fontSize: '0.75rem', fontWeight: 800,
              textDecoration: 'none',
              fontFamily: 'var(--font-barlow)',
              textTransform: 'uppercase', letterSpacing: '0.08em',
            }}
          >
            WhatsApp
          </a>
          <a
            href={`mailto:${lead.email}`}
            style={{
              background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)',
              padding: '0.4rem 0.875rem', borderRadius: 6,
              fontSize: '0.75rem', fontWeight: 800,
              textDecoration: 'none',
              fontFamily: 'var(--font-barlow)',
              textTransform: 'uppercase', letterSpacing: '0.08em',
            }}
          >
            Email
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', padding: '2rem', fontFamily: 'var(--font-inter, sans-serif)' }}>
      <div style={{ maxWidth: 780, margin: '0 auto' }}>

        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 900, fontSize: '2rem', textTransform: 'uppercase', color: 'white', margin: 0 }}>
              Beta Signups
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
              {pending.length} pending · {approved.length} approved
            </p>
          </div>
          <Link href="/" style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', textDecoration: 'none', fontFamily: 'var(--font-barlow, sans-serif)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            ← Home
          </Link>
        </div>

        {pending.length > 0 && (
          <>
            <h2 style={{ fontFamily: 'var(--font-barlow)', fontWeight: 900, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)', marginBottom: '0.75rem' }}>
              Pending ({pending.length})
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
              {pending.map(lead => <LeadCard key={lead.id} lead={lead} />)}
            </div>
          </>
        )}

        {approved.length > 0 && (
          <>
            <h2 style={{ fontFamily: 'var(--font-barlow)', fontWeight: 900, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)', marginBottom: '0.75rem' }}>
              Approved ({approved.length})
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {approved.map(lead => <LeadCard key={lead.id} lead={lead} />)}
            </div>
          </>
        )}

        {leads.length === 0 && (
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem' }}>No signups yet.</p>
        )}
      </div>
    </div>
  );
}
