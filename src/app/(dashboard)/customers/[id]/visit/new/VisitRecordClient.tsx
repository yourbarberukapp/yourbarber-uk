'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  customer: { id: string; name: string | null; phone: string; smsOptIn: string };
}

type OptIn = 'yes' | 'no' | 'not_asked';

export function VisitRecordClient({ customer }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<'notes' | 'photos'>('notes');
  const [visitId, setVisitId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [smsOptIn, setSmsOptIn] = useState<OptIn>(customer.smsOptIn as OptIn);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSaveNotes() {
    setSaving(true); setError('');
    const res = await fetch(`/api/customers/${customer.id}/visits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes, smsOptIn }),
    });
    const data = await res.json();
    if (!res.ok) { setError('Failed to save. Try again.'); setSaving(false); return; }
    setVisitId(data.id);
    setStep('photos');
    setSaving(false);
  }

  if (step === 'photos') {
    return (
      <div className="space-y-4">
        <p className="text-sm text-neutral-500">Visit saved! Add photos below (or skip).</p>
        <div className="grid grid-cols-2 gap-3">
          {['front', 'back', 'left', 'right'].map(angle => (
            <div key={angle} className="border-2 border-dashed border-neutral-300 rounded-xl aspect-square flex flex-col items-center justify-center bg-neutral-50">
              <span className="text-3xl">📷</span>
              <span className="text-xs text-neutral-500 capitalize mt-1">{angle}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-neutral-400 text-center">Photo upload coming in next step</p>
        <button onClick={() => router.push(`/customers/${customer.id}`)}
          className="w-full h-12 bg-black text-white rounded-xl text-base">
          Done
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-base font-medium mb-2">Notes</label>
        <textarea
          rows={5}
          placeholder="Scissors grade, clippers, what was done, anything chatted about…"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-base resize-none focus:outline-none focus:border-black"
        />
      </div>

      <div>
        <label className="block text-base font-medium mb-2">Send SMS reminder in 6 weeks?</label>
        <div className="flex gap-3">
          {(['yes', 'no', 'not_asked'] as OptIn[]).map(opt => (
            <button key={opt} type="button" onClick={() => setSmsOptIn(opt)}
              className={`flex-1 py-3 rounded-xl border-2 text-sm font-medium transition-colors ${
                smsOptIn === opt ? 'border-black bg-black text-white' : 'border-neutral-200 bg-white text-neutral-700'
              }`}>
              {opt === 'yes' ? 'Yes' : opt === 'no' ? 'No' : "Didn't ask"}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <button onClick={handleSaveNotes} disabled={saving}
        className="w-full h-14 bg-black text-white text-lg rounded-xl disabled:opacity-50">
        {saving ? 'Saving…' : 'Save & add photos'}
      </button>
    </div>
  );
}
