'use client';
import { useState } from 'react';

interface Barber { id: string; name: string; email: string; role: string; }
interface Props { barbers: Barber[]; currentBarberId: string; }

export function TeamClient({ barbers: initial, currentBarberId }: Props) {
  const [barbers, setBarbers] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false); const [error, setError] = useState('');

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError('');
    const res = await fetch('/api/team', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role: 'barber' }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? 'Error'); setSaving(false); return; }
    setBarbers(prev => [...prev, { id: data.id, name, email, role: 'barber' }]);
    setName(''); setEmail(''); setPassword(''); setShowForm(false); setSaving(false);
  }

  async function handleRemove(id: string) {
    if (!confirm('Remove this barber? Their visit records stay.')) return;
    await fetch(`/api/team/${id}`, { method: 'DELETE' });
    setBarbers(prev => prev.filter(b => b.id !== id));
  }

  return (
    <div className="space-y-3">
      {barbers.map(b => (
        <div key={b.id} className="bg-white border border-neutral-200 rounded-xl px-4 py-3 flex items-center justify-between">
          <div>
            <p className="font-medium">{b.name}</p>
            <p className="text-sm text-neutral-500">{b.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${b.role === 'owner' ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-600'}`}>
              {b.role}
            </span>
            {b.id !== currentBarberId && (
              <button onClick={() => handleRemove(b.id)} className="text-sm text-red-500 hover:text-red-700">Remove</button>
            )}
          </div>
        </div>
      ))}

      {showForm ? (
        <form onSubmit={handleInvite} className="border-2 border-neutral-200 rounded-xl p-4 space-y-3">
          <h3 className="font-semibold">Add barber</h3>
          {[['Name', 'text', name, setName], ['Email', 'email', email, setEmail], ['Temp password (8+ chars)', 'password', password, setPassword]].map(([label, type, val, setter]) => (
            <div key={label as string}>
              <label className="block text-sm font-medium mb-1">{label as string}</label>
              <input type={type as string} value={val as string} onChange={e => (setter as any)(e.target.value)} required minLength={type === 'password' ? 8 : undefined}
                className="w-full h-11 px-3 border border-neutral-200 rounded-lg focus:outline-none focus:border-black" />
            </div>
          ))}
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="flex-1 h-11 bg-black text-white rounded-lg text-sm disabled:opacity-50">
              {saving ? 'Adding…' : 'Add barber'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="flex-1 h-11 border border-neutral-200 rounded-lg text-sm">Cancel</button>
          </div>
        </form>
      ) : (
        <button onClick={() => setShowForm(true)} className="w-full h-12 border-2 border-dashed border-neutral-200 rounded-xl text-sm text-neutral-500 hover:border-black hover:text-black">
          + Add barber
        </button>
      )}
    </div>
  );
}
