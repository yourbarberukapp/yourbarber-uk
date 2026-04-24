'use client';
import { useState } from 'react';
import { UserPlus, X, Trash2, Shield, User } from 'lucide-react';

interface Barber { id: string; name: string; email: string; role: string; }
interface Props { barbers: Barber[]; currentBarberId: string; }

export function TeamClient({ barbers: initial, currentBarberId }: Props) {
  const [barbers, setBarbers] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState(''); 
  const [email, setEmail] = useState(''); 
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false); 
  const [error, setError] = useState('');

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
    <div className="space-y-4">
      <div className="grid gap-3">
        {barbers.map(b => (
          <div key={b.id} className="bg-[#111] border border-white/5 rounded-2xl px-5 py-4 flex items-center justify-between group transition-all hover:border-white/10">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40">
                <User size={20} />
              </div>
              <div>
                <p className="font-medium text-white">{b.name} {b.id === currentBarberId && <span className="text-white/30 text-xs ml-1">(You)</span>}</p>
                <p className="text-sm text-white/40">{b.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                b.role === 'owner' ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-white/5 text-white/40 border border-white/10'
              }`}>
                {b.role === 'owner' && <Shield size={10} />}
                {b.role}
              </div>
              {b.id !== currentBarberId && (
                <button 
                  onClick={() => handleRemove(b.id)} 
                  className="p-2 text-white/20 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showForm ? (
        <form onSubmit={handleInvite} className="bg-[#111] border border-primary/20 rounded-2xl p-6 space-y-5 animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between">
            <h3 className="font-barlow font-bold text-xl text-white uppercase tracking-tight">Add new barber</h3>
            <button type="button" onClick={() => setShowForm(false)} className="text-white/30 hover:text-white">
              <X size={20} />
            </button>
          </div>
          
          <div className="space-y-4">
            {[
              { label: 'Name', type: 'text', value: name, setter: setName, placeholder: 'Barber name' },
              { label: 'Email', type: 'email', value: email, setter: setEmail, placeholder: 'barber@example.com' },
              { label: 'Temporary Password', type: 'password', value: password, setter: setPassword, placeholder: '8+ characters' }
            ].map((field) => (
              <div key={field.label}>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-white/40 mb-1.5 ml-1">{field.label}</label>
                <input 
                  type={field.type} 
                  value={field.value} 
                  onChange={e => field.setter(e.target.value)} 
                  placeholder={field.placeholder}
                  required 
                  minLength={field.type === 'password' ? 8 : undefined}
                  className="w-full h-12 px-4 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 focus:bg-white/[0.05] transition-all" 
                />
              </div>
            ))}
          </div>

          {error && <p className="text-red-400 text-sm bg-red-400/10 p-3 rounded-lg border border-red-400/20">{error}</p>}
          
          <div className="flex gap-3 pt-2">
            <button 
              type="submit" 
              disabled={saving} 
              className="flex-1 btn-lime h-12 rounded-xl text-sm font-bold shadow-lg shadow-primary/10 disabled:opacity-50"
            >
              {saving ? 'Adding…' : 'Add barber'}
            </button>
            <button 
              type="button" 
              onClick={() => setShowForm(false)} 
              className="flex-1 h-12 border border-white/10 rounded-xl text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button 
          onClick={() => setShowForm(true)} 
          className="w-full h-16 border border-dashed border-white/10 rounded-2xl text-sm font-medium text-white/40 hover:border-primary/50 hover:text-primary hover:bg-primary/[0.02] transition-all flex items-center justify-center gap-2 group"
        >
          <UserPlus size={18} className="group-hover:scale-110 transition-transform" />
          Add barber
        </button>
      )}
    </div>
  );
}

