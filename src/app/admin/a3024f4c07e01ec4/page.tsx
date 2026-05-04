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

export default async function AdminLeadsPage() {
  const leads = await db.demoLead.findMany({ orderBy: { createdAt: 'desc' } });
  const approved = leads.filter(l => l.approved).length;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', padding: '2rem', fontFamily: 'var(--font-inter, sans-serif)' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>

        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 900, fontSize: '2rem', textTransform: 'uppercase', color: 'white', margin: 0 }}>
              Beta Leads
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
              {leads.length} {leads.length === 1 ? 'application' : 'applications'} · {approved} approved
            </p>
          </div>
          <Link href="/" style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', textDecoration: 'none', fontFamily: 'var(--font-barlow, sans-serif)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            ← Home
          </Link>
        </div>

        {leads.length === 0 ? (
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem' }}>No leads yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {leads.map(lead => {
              const waPhone = toWaPhone(lead.phone);
              const waMsg = encodeURIComponent(
                `Hi ${lead.name.split(' ')[0]}, it's Luke from YourBarber — thanks for your interest! When's a good time for a quick 20-min call?`
              );
              return (
                <div key={lead.id} style={{
                  background: lead.approved ? 'rgba(200,241,53,0.04)' : '#111',
                  border: lead.approved ? '1px solid rgba(200,241,53,0.2)' : '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 12, padding: '1.25rem 1.5rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.1rem' }}>
                        <span style={{ fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 900, fontSize: '1rem', textTransform: 'uppercase', color: 'white' }}>
                          {lead.name}
                        </span>
                        {lead.approved && (
                          <span style={{ background: 'rgba(200,241,53,0.15)', color: '#C8F135', fontSize: '0.6rem', fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '2px 8px', borderRadius: 20 }}>
                            Approved
                          </span>
                        )}
                      </div>
                      <div style={{ color: '#C8F135', fontSize: '0.875rem', fontWeight: 700 }}>
                        {lead.shopName || '—'}
                      </div>
                      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', marginTop: '0.35rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <span>{lead.phone}</span>
                        <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
                        <span>{lead.email}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexShrink: 0, flexWrap: 'wrap' }}>
                      <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.75rem' }}>
                        {timeAgo(lead.createdAt)}
                      </span>
                      <ApproveButton leadId={lead.id} approved={lead.approved} />
                      <a
                        href={`https://wa.me/${waPhone}?text=${waMsg}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          background: '#25D366', color: 'white',
                          padding: '0.5rem 1.125rem', borderRadius: 8,
                          fontSize: '0.8rem', fontWeight: 800,
                          textDecoration: 'none',
                          fontFamily: 'var(--font-barlow, sans-serif)',
                          textTransform: 'uppercase', letterSpacing: '0.08em',
                        }}
                      >
                        WhatsApp
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
