'use client';
import { useState } from 'react';

interface Customer {
  id: string; phone: string; name: string | null;
  smsOptIn: string; lastVisitAt: string | null;
}

interface Props { customers: Customer[]; }

export function BulkReminderPanel({ customers: initial }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set(initial.map(c => c.id)));
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number } | null>(null);

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleSend() {
    if (!selected.size) return;
    setSending(true);
    const res = await fetch('/api/reminders/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerIds: Array.from(selected) }),
    });
    setResult(await res.json());
    setSending(false);
  }

  if (result) {
    return (
      <div className="text-center py-8 space-y-3">
        <p className="text-3xl font-bold">{result.sent} sent ✓</p>
        {result.failed > 0 && <p className="text-red-600 text-sm">{result.failed} failed</p>}
        <button onClick={() => setResult(null)} className="border border-neutral-200 rounded-xl px-6 py-2 text-sm">Done</button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-500">{selected.size} of {initial.length} selected</p>
        <div className="flex gap-2">
          <button onClick={() => setSelected(new Set(initial.map(c => c.id)))}
            className="text-xs border border-neutral-200 rounded-lg px-3 py-1">All</button>
          <button onClick={() => setSelected(new Set())}
            className="text-xs border border-neutral-200 rounded-lg px-3 py-1">None</button>
        </div>
      </div>
      {initial.map(c => (
        <button key={c.id} onClick={() => toggle(c.id)}
          className={`w-full text-left bg-white border-2 rounded-xl px-4 py-3 transition-colors ${selected.has(c.id) ? 'border-black' : 'border-neutral-200'}`}>
          <p className="font-medium">{c.name ?? 'No name'}</p>
          <p className="text-sm text-neutral-500">{c.phone} · {c.lastVisitAt ? new Date(c.lastVisitAt).toLocaleDateString('en-GB') : 'Never'}</p>
        </button>
      ))}
      <button onClick={handleSend} disabled={sending || !selected.size}
        className="w-full h-14 bg-black text-white rounded-xl text-base font-medium disabled:opacity-50">
        {sending ? 'Sending…' : `Send SMS to ${selected.size} customer${selected.size !== 1 ? 's' : ''}`}
      </button>
    </div>
  );
}
