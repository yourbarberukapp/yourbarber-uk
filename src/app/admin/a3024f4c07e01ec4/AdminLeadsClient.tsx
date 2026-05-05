'use client';

import { useState } from 'react';
import { Check, Loader2, Trash2, Mail, Copy, CheckCheck } from 'lucide-react';

const ADMIN_KEY = 'a3024f4c07e01ec4';

type Lead = {
  id: string;
  name: string;
  email: string;
  phone: string;
  shopName: string;
  postcode: string | null;
  chairs: number | null;
  barberCount: number | null;
  employmentType: string | null;
  commsPreference: string | null;
  challenge: string | null;
  approved: boolean;
  createdAt: string;
};

function toWaPhone(phone: string) {
  const clean = phone.replace(/\D/g, '');
  return clean.startsWith('07') ? '44' + clean.slice(1) : clean;
}

function timeAgo(date: string) {
  const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const pillStyle = (lime = false): React.CSSProperties => ({
  display: 'inline-block', padding: '2px 8px', borderRadius: 4,
  fontSize: '0.7rem', fontWeight: 700, fontFamily: 'var(--font-barlow)',
  textTransform: 'uppercase', letterSpacing: '0.06em',
  background: lime ? 'rgba(200,241,53,0.12)' : 'rgba(255,255,255,0.07)',
  color: lime ? '#C8F135' : 'rgba(255,255,255,0.45)',
});

export default function AdminLeadsClient({ initialLeads }: { initialLeads: Lead[] }) {
  const [leads, setLeads] = useState(initialLeads);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [approving, setApproving] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState<Set<string>>(new Set());
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [emailState, setEmailState] = useState<'idle' | 'sending' | 'done'>('idle');
  const [copied, setCopied] = useState(false);

  const pending = leads.filter(l => !l.approved);
  const approved = leads.filter(l => l.approved);
  const selectedLeads = leads.filter(l => selected.has(l.id));

  function toggleSelect(id: string) {
    setSelected(s => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function selectAll() {
    if (selected.size === leads.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(leads.map(l => l.id)));
    }
  }

  async function approve(id: string) {
    setApproving(s => new Set(s).add(id));
    await fetch(`/api/admin/leads/${id}/approve`, { method: 'POST', headers: { 'x-admin-key': ADMIN_KEY } });
    setLeads(ls => ls.map(l => l.id === id ? { ...l, approved: true } : l));
    setApproving(s => { const n = new Set(s); n.delete(id); return n; });
  }

  async function deleteLead(id: string) {
    if (!confirm('Delete this lead? This cannot be undone.')) return;
    setDeleting(s => new Set(s).add(id));
    await fetch(`/api/admin/leads/${id}`, { method: 'DELETE', headers: { 'x-admin-key': ADMIN_KEY } });
    setLeads(ls => ls.filter(l => l.id !== id));
    setSelected(s => { const n = new Set(s); n.delete(id); return n; });
    setDeleting(s => { const n = new Set(s); n.delete(id); return n; });
  }

  async function deleteSelected() {
    if (!confirm(`Delete ${selected.size} lead${selected.size !== 1 ? 's' : ''}? This cannot be undone.`)) return;
    const ids = Array.from(selected);
    await Promise.all(ids.map(id =>
      fetch(`/api/admin/leads/${id}`, { method: 'DELETE', headers: { 'x-admin-key': ADMIN_KEY } })
    ));
    setLeads(ls => ls.filter(l => !selected.has(l.id)));
    setSelected(new Set());
  }

  async function sendBulkEmail() {
    setEmailState('sending');
    const res = await fetch('/api/admin/leads/bulk-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': ADMIN_KEY },
      body: JSON.stringify({ ids: Array.from(selected), subject: emailSubject, message: emailMessage }),
    });
    const { sent, failed } = await res.json();
    setEmailState('done');
    setTimeout(() => {
      setShowEmailModal(false);
      setEmailState('idle');
      setEmailSubject('');
      setEmailMessage('');
      alert(`Sent: ${sent}${failed ? ` · Failed: ${failed}` : ''}`);
    }, 1200);
  }

  function copyNumbers() {
    const nums = selectedLeads.map(l => l.phone).join('\n');
    navigator.clipboard.writeText(nums);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function LeadCard({ lead }: { lead: Lead }) {
    const waPhone = toWaPhone(lead.phone);
    const waMsg = encodeURIComponent(
      lead.approved
        ? `Hi ${lead.name.split(' ')[0]}, it's Luke from YourBarber — just approved your beta application! Sign in at yourbarber.uk/login with your Google account (${lead.email}) to get started.`
        : `Hi ${lead.name.split(' ')[0]}, it's Luke from YourBarber — you applied for our beta. Happy to chat about getting you set up?`
    );

    return (
      <div style={{
        background: selected.has(lead.id) ? 'rgba(200,241,53,0.04)' : '#111',
        border: `1px solid ${selected.has(lead.id) ? 'rgba(200,241,53,0.3)' : lead.approved ? 'rgba(200,241,53,0.12)' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 12, padding: '1.25rem 1.5rem',
        transition: 'border-color 0.15s, background 0.15s',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem' }}>
          {/* Checkbox */}
          <button
            onClick={() => toggleSelect(lead.id)}
            style={{
              width: 20, height: 20, borderRadius: 4, flexShrink: 0, marginTop: 2,
              background: selected.has(lead.id) ? '#C8F135' : 'transparent',
              border: `2px solid ${selected.has(lead.id) ? '#C8F135' : 'rgba(255,255,255,0.2)'}`,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
            }}
          >
            {selected.has(lead.id) && <Check size={12} color="#0A0A0A" strokeWidth={3} />}
          </button>

          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-barlow)', fontWeight: 900, fontSize: '1.05rem', textTransform: 'uppercase', color: 'white' }}>
                  {lead.name}
                </div>
                <div style={{ color: '#C8F135', fontSize: '0.85rem', fontWeight: 700, marginTop: '0.1rem' }}>
                  {lead.shopName || '—'}{lead.postcode ? ` · ${lead.postcode}` : ''}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.7rem' }}>{timeAgo(lead.createdAt)}</span>
                {lead.approved
                  ? <span style={{ color: '#C8F135', fontSize: '0.75rem', fontWeight: 700, fontFamily: 'var(--font-barlow)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4 }}><Check size={12} /> Approved</span>
                  : <button onClick={() => approve(lead.id)} disabled={approving.has(lead.id)} style={{ background: '#C8F135', color: '#0A0A0A', padding: '0.4rem 0.875rem', borderRadius: 6, fontSize: '0.75rem', fontWeight: 800, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-barlow)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 5, opacity: approving.has(lead.id) ? 0.6 : 1 }}>
                    {approving.has(lead.id) && <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} />} Approve
                  </button>
                }
              </div>
            </div>

            {/* Pills */}
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.6rem' }}>
              {lead.chairs && <span style={pillStyle()}>{lead.chairs} chair{lead.chairs > 1 ? 's' : ''}</span>}
              {lead.barberCount && <span style={pillStyle()}>{lead.barberCount} barber{lead.barberCount > 1 ? 's' : ''}</span>}
              {lead.employmentType && <span style={pillStyle()}>{lead.employmentType}</span>}
              {lead.commsPreference && <span style={pillStyle(lead.commsPreference === 'whatsapp')}>{lead.commsPreference === 'whatsapp' ? '📱 WhatsApp' : '✉️ Email'}</span>}
            </div>

            {/* Contact */}
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem', marginBottom: lead.challenge ? '0.5rem' : '0.75rem', fontFamily: 'var(--font-inter)' }}>
              {lead.phone} · {lead.email}
            </div>

            {lead.challenge && (
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', fontStyle: 'italic', fontFamily: 'var(--font-inter)', marginBottom: '0.75rem' }}>
                &ldquo;{lead.challenge}&rdquo;
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <a href={`https://wa.me/${waPhone}?text=${waMsg}`} target="_blank" rel="noopener noreferrer"
                style={{ background: '#25D366', color: 'white', padding: '0.35rem 0.75rem', borderRadius: 6, fontSize: '0.72rem', fontWeight: 800, textDecoration: 'none', fontFamily: 'var(--font-barlow)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                WhatsApp
              </a>
              <a href={`mailto:${lead.email}`}
                style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)', padding: '0.35rem 0.75rem', borderRadius: 6, fontSize: '0.72rem', fontWeight: 800, textDecoration: 'none', fontFamily: 'var(--font-barlow)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Email
              </a>
              <button onClick={() => deleteLead(lead.id)} disabled={deleting.has(lead.id)}
                style={{ marginLeft: 'auto', background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(255,100,100,0.4)', padding: '0.35rem', display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,100,100,0.8)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,100,100,0.4)')}>
                {deleting.has(lead.id) ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={15} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', padding: '2rem', fontFamily: 'var(--font-inter, sans-serif)' }}>
      <div style={{ maxWidth: 780, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-barlow)', fontWeight: 900, fontSize: '2rem', textTransform: 'uppercase', color: 'white', margin: 0 }}>
              Beta Signups
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
              {pending.length} pending · {approved.length} approved
            </p>
          </div>
          <a href="/" style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', textDecoration: 'none', fontFamily: 'var(--font-barlow)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>← Home</a>
        </div>

        {/* Bulk action bar */}
        {leads.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', padding: '0.75rem 1rem', background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, flexWrap: 'wrap' }}>
            <button onClick={selectAll} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'var(--font-inter)', padding: 0 }}>
              {selected.size === leads.length ? 'Deselect all' : `Select all (${leads.length})`}
            </button>

            {selected.size > 0 && (
              <>
                <span style={{ color: 'rgba(255,255,255,0.15)' }}>·</span>
                <span style={{ color: '#C8F135', fontSize: '0.8rem', fontWeight: 700, fontFamily: 'var(--font-barlow)' }}>{selected.size} selected</span>
                <button onClick={() => setShowEmailModal(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.07)', border: 'none', color: 'rgba(255,255,255,0.7)', padding: '0.4rem 0.75rem', borderRadius: 6, fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-barlow)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  <Mail size={13} /> Email selected
                </button>
                <button onClick={copyNumbers}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(37,211,102,0.12)', border: 'none', color: '#25D366', padding: '0.4rem 0.75rem', borderRadius: 6, fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-barlow)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {copied ? <><CheckCheck size={13} /> Copied!</> : <><Copy size={13} /> Copy numbers</>}
                </button>
                <button onClick={deleteSelected}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,100,100,0.1)', border: 'none', color: 'rgba(255,100,100,0.7)', padding: '0.4rem 0.75rem', borderRadius: 6, fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-barlow)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  <Trash2 size={13} /> Delete selected
                </button>
              </>
            )}
          </div>
        )}

        {/* Leads */}
        {pending.length > 0 && (
          <>
            <h2 style={{ fontFamily: 'var(--font-barlow)', fontWeight: 900, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)', marginBottom: '0.75rem' }}>
              Pending ({pending.length})
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
              {pending.map(l => <LeadCard key={l.id} lead={l} />)}
            </div>
          </>
        )}

        {approved.length > 0 && (
          <>
            <h2 style={{ fontFamily: 'var(--font-barlow)', fontWeight: 900, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)', marginBottom: '0.75rem' }}>
              Approved ({approved.length})
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {approved.map(l => <LeadCard key={l.id} lead={l} />)}
            </div>
          </>
        )}

        {leads.length === 0 && (
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem' }}>No signups yet.</p>
        )}
      </div>

      {/* Email modal */}
      {showEmailModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}
          onClick={e => e.target === e.currentTarget && setShowEmailModal(false)}>
          <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '1.75rem', width: '100%', maxWidth: 520 }}>
            <h2 style={{ fontFamily: 'var(--font-barlow)', fontWeight: 900, fontSize: '1.1rem', textTransform: 'uppercase', color: 'white', margin: '0 0 1.25rem' }}>
              Email {selected.size} {selected.size === 1 ? 'person' : 'people'}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <input
                placeholder="Subject"
                value={emailSubject}
                onChange={e => setEmailSubject(e.target.value)}
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, padding: '0.75rem 1rem', color: 'white', fontSize: '0.9rem', outline: 'none', fontFamily: 'var(--font-inter)' }}
              />
              <textarea
                placeholder="Your message…"
                value={emailMessage}
                onChange={e => setEmailMessage(e.target.value)}
                rows={6}
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, padding: '0.75rem 1rem', color: 'white', fontSize: '0.9rem', outline: 'none', fontFamily: 'var(--font-inter)', resize: 'vertical', lineHeight: 1.6 }}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowEmailModal(false)}
                style={{ background: 'none', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.5)', padding: '0.6rem 1.25rem', borderRadius: 6, cursor: 'pointer', fontFamily: 'var(--font-barlow)', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.06em' }}>
                Cancel
              </button>
              <button onClick={sendBulkEmail} disabled={!emailSubject || !emailMessage || emailState === 'sending'}
                style={{ background: '#C8F135', color: '#0A0A0A', border: 'none', padding: '0.6rem 1.25rem', borderRadius: 6, cursor: 'pointer', fontFamily: 'var(--font-barlow)', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 6, opacity: (!emailSubject || !emailMessage || emailState === 'sending') ? 0.6 : 1 }}>
                {emailState === 'sending' && <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />}
                {emailState === 'done' ? <><CheckCheck size={13} /> Sent!</> : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
