'use client';
import { useState } from 'react';
import { Check, Send } from 'lucide-react';

interface Customer {
  id: string;
  phone: string;
  name: string | null;
  smsOptIn: string;
  lastVisitAt: string | null;
  avi?: number;
  daysSinceVisit?: number | null;
}

interface Props {
  customers: Customer[];
  reminderType?: string;
}

export function BulkReminderPanel({ customers: initial, reminderType }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set(initial.map(c => c.id)));
  const [sending, setSending] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number } | null>(null);
  const [preview, setPreview] = useState<{ message: string; wouldSendToPhone: string; previewUrl: string | null } | null>(null);

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

  async function handlePreview() {
    const firstSelectedId = Array.from(selected)[0];
    if (!firstSelectedId) return;
    setPreviewing(true);
    const res = await fetch('/api/reminders/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId: firstSelectedId, reminderType: reminderType ?? 'overdue' }),
    });
    if (res.ok) {
      setPreview(await res.json());
    }
    setPreviewing(false);
  }

  if (result) {
    return (
      <div className="bg-[#111] border border-white/5 rounded-2xl p-12 text-center animate-in fade-in zoom-in duration-300">
        <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-4">
          <Check size={22} className="text-primary" />
        </div>
        <p className="font-barlow font-black text-4xl text-white">
          {result.sent} sent
        </p>
        {result.failed > 0 && (
          <p className="text-red-400 text-sm mt-2">{result.failed} failed</p>
        )}
        <button
          onClick={() => setResult(null)}
          className="mt-6 px-6 py-2.5 border border-white/10 rounded-full bg-transparent text-white/60 text-sm hover:text-white hover:border-white/20 transition-colors font-medium"
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Selection controls */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-white/40 text-sm">
          <span className="text-white font-semibold">{selected.size}</span> of {initial.length} selected
        </p>
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setSelected(new Set(initial.map(c => c.id)))}
            className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest border border-white/10 rounded-lg bg-white/5 text-white/50 hover:text-white hover:bg-white/10 transition-all font-barlow"
          >
            All
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest border border-white/10 rounded-lg bg-white/5 text-white/50 hover:text-white hover:bg-white/10 transition-all font-barlow"
          >
            None
          </button>
          <button
            onClick={handlePreview}
            disabled={previewing || !selected.size}
            className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest border border-white/10 rounded-lg bg-white/5 text-white/50 hover:text-white hover:bg-white/10 transition-all font-barlow disabled:opacity-50"
          >
            {previewing ? 'Previewing...' : 'Preview SMS'}
          </button>
        </div>
      </div>

      {preview && (
        <div className="bg-[#111] border border-white/5 rounded-2xl p-5">
          <div className="flex items-center justify-between gap-3 mb-3">
            <p className="font-barlow font-bold text-xs uppercase tracking-widest text-white/35">
              SMS preview
            </p>
            <button
              onClick={() => setPreview(null)}
              className="text-white/30 hover:text-white text-xs uppercase tracking-widest font-barlow"
            >
              Close
            </button>
          </div>
          <p className="text-white text-sm leading-6">{preview.message}</p>
          <p className="text-white/35 text-xs mt-3 font-mono">{preview.wouldSendToPhone}</p>
          {preview.previewUrl && (
            <a
              href={preview.previewUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-block mt-3 text-primary text-xs font-bold uppercase tracking-widest"
            >
              Open customer link
            </a>
          )}
        </div>
      )}

      {/* Customer list */}
      <div className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden divide-y divide-white/[0.03]">
        {initial.map((c) => {
          const isSelected = selected.has(c.id);
          return (
            <button
              key={c.id}
              onClick={() => toggle(c.id)}
              className={`w-full text-left px-5 py-4 flex items-center gap-4 transition-all duration-150 group ${
                isSelected ? 'bg-primary/[0.03]' : 'hover:bg-white/[0.02]'
              }`}
            >
              {/* Checkbox */}
              <div className={`w-5 h-5 rounded-md flex-shrink-0 border transition-all duration-200 flex items-center justify-center ${
                isSelected 
                  ? 'bg-primary border-primary shadow-[0_0_10px_rgba(200,241,53,0.3)]' 
                  : 'bg-transparent border-white/20 group-hover:border-white/40'
              }`}>
                {isSelected && <Check size={12} className="text-black stroke-[3px]" />}
              </div>
              {/* Info */}
              <div>
                <p className="text-white text-[15px] font-medium leading-tight">{c.name ?? 'No name'}</p>
                <p className="text-white/30 text-xs mt-1 font-mono tracking-tight">
                  {c.phone} &middot; {c.lastVisitAt ? new Date(c.lastVisitAt).toLocaleDateString('en-GB') : 'Never'}
                  {c.avi != null && (
                    <span className="text-white/20"> &middot; every ~{c.avi}d</span>
                  )}
                  {c.daysSinceVisit != null && (
                    <span className="text-white/20"> &middot; {c.daysSinceVisit}d ago</span>
                  )}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Send button */}
      <button
        onClick={handleSend}
        disabled={sending || !selected.size}
        className="btn-lime w-full py-4 rounded-xl flex items-center justify-center gap-2 text-base font-bold shadow-xl shadow-primary/10 disabled:opacity-50 disabled:shadow-none transition-all active:scale-[0.98]"
      >
        <Send size={18} className={sending ? 'animate-pulse' : ''} />
        {sending ? 'Sending…' : `Send SMS to ${selected.size} customer${selected.size !== 1 ? 's' : ''}`}
      </button>
    </div>
  );
}

