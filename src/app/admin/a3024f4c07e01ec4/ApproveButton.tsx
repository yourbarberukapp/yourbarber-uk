'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ApproveButton({ leadId, approved }: { leadId: string; approved: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    await fetch('/api/admin/approve-lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadId, approve: !approved }),
    });
    router.refresh();
    setLoading(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      style={{
        padding: '0.5rem 1rem',
        borderRadius: 8,
        fontSize: '0.8rem',
        fontWeight: 800,
        fontFamily: 'var(--font-barlow, sans-serif)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        cursor: 'pointer',
        border: 'none',
        opacity: loading ? 0.6 : 1,
        background: approved ? 'rgba(255,255,255,0.06)' : 'rgba(200,241,53,0.15)',
        color: approved ? 'rgba(255,255,255,0.4)' : '#C8F135',
      }}
    >
      {loading ? '…' : approved ? 'Revoke' : 'Approve'}
    </button>
  );
}
