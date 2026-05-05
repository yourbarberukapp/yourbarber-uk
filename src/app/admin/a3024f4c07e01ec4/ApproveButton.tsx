'use client';

import { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';

export default function ApproveButton({ id, approved }: { id: string; approved: boolean }) {
  const [state, setState] = useState<'idle' | 'loading' | 'done'>(approved ? 'done' : 'idle');

  async function approve() {
    setState('loading');
    await fetch(`/api/admin/leads/${id}/approve`, {
      method: 'POST',
      headers: { 'x-admin-key': 'a3024f4c07e01ec4' },
    });
    setState('done');
  }

  if (state === 'done') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#C8F135', fontSize: '0.8rem', fontWeight: 700, fontFamily: 'var(--font-barlow)', textTransform: 'uppercase' }}>
        <Check size={14} /> Approved
      </div>
    );
  }

  return (
    <button
      onClick={approve}
      disabled={state === 'loading'}
      style={{
        background: '#C8F135', color: '#0A0A0A',
        padding: '0.5rem 1rem', borderRadius: 6,
        fontSize: '0.8rem', fontWeight: 800, border: 'none', cursor: 'pointer',
        fontFamily: 'var(--font-barlow)', textTransform: 'uppercase', letterSpacing: '0.06em',
        display: 'flex', alignItems: 'center', gap: 6,
        opacity: state === 'loading' ? 0.6 : 1,
      }}
    >
      {state === 'loading' ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : null}
      Approve
    </button>
  );
}
