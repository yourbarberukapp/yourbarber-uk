'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { UserPlus, X, Trash2, Shield, User, Check, QrCode, Copy } from 'lucide-react';

const QRCodeSVG = dynamic(() => import('qrcode.react').then((m) => m.QRCodeSVG), { ssr: false });

interface Barber { id: string; name: string; email: string; role: string; ownerPasscode?: string | null; }
interface Props { barbers: Barber[]; currentBarberId: string; shopSlug: string; }

export function TeamClient({ barbers: initial, currentBarberId, shopSlug }: Props) {
  const [barbers, setBarbers] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [newPasscode, setNewPasscode] = useState<{ name: string; code: string } | null>(null);
  const [qrBarber, setQrBarber] = useState<Barber | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError('');
    const res = await fetch('/api/team', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (!res.ok) {
      let errorMsg = 'Error';
      if (typeof data.error === 'string') {
        errorMsg = data.error;
      } else if (data.error && typeof data.error === 'object') {
        const fieldErrors = Object.values(data.error.fieldErrors || {}).flat();
        const formErrors = data.error.formErrors || [];
        errorMsg = [...formErrors, ...fieldErrors].join(', ') || 'Validation error';
      }
      setError(errorMsg);
      setSaving(false);
      return;
    }
    setBarbers(prev => [...prev, { id: data.id, name, email: '', role: 'barber', ownerPasscode: data.passcode }]);
    setNewPasscode({ name, code: data.passcode });
    setName(''); setShowForm(false); setSaving(false);
  }

  async function handleRemove(id: string) {
    if (!confirm('Remove this barber? Their visit records stay.')) return;
    await fetch(`/api/team/${id}`, { method: 'DELETE' });
    setBarbers(prev => prev.filter(b => b.id !== id));
  }

  return (
    <div className="space-y-4">
      {newPasscode && (
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center">
              <Check size={18} className="text-primary" />
            </div>
            <div>
              <p className="text-white text-sm font-semibold">{newPasscode.name}'s passcode</p>
              <p className="font-mono text-2xl tracking-[0.3em] text-primary mt-1">{newPasscode.code}</p>
              <p className="text-white/40 text-xs mt-1">Give them this code to sign in - no email or password needed.</p>
            </div>
          </div>
          <button onClick={() => setNewPasscode(null)} className="text-white/30 hover:text-white">
            <X size={18} />
          </button>
        </div>
      )}

      <div className="grid gap-3">
        {barbers.map(b => (
          <div key={b.id} className="bg-[#111] border border-white/5 rounded-2xl px-5 py-4 flex items-center justify-between group transition-all hover:border-white/10">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40">
                <User size={20} />
              </div>
              <div>
                <p className="font-medium text-white">{b.name} {b.id === currentBarberId && <span className="text-white/30 text-xs ml-1">(You)</span>}</p>
                {b.ownerPasscode && (
                  <p className="text-sm text-white/40 font-mono tracking-widest">{b.ownerPasscode}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                b.role === 'owner' ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-white/5 text-white/40 border border-white/10'
              }`}>
                {b.role === 'owner' && <Shield size={10} />}
                {b.role}
              </div>
              <button
                onClick={() => { setQrBarber(b); setCopied(false); }}
                title="Client QR - shares a link that pre-selects this barber"
                className="p-2 text-white/20 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
              >
                <QrCode size={16} />
              </button>
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

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-white/40 mb-1.5 ml-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Barber name"
              required
              className="w-full h-12 px-4 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 focus:bg-white/[0.05] transition-all"
            />
            <p className="text-white/30 text-xs mt-2 ml-1">A 6-digit passcode is generated automatically - no email or password needed.</p>
          </div>

          {error && <p className="text-red-400 text-sm bg-red-400/10 p-3 rounded-lg border border-red-400/20">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 btn-lime h-12 rounded-xl text-sm font-bold shadow-lg shadow-primary/10 disabled:opacity-50"
            >
              {saving ? 'Adding...' : 'Add barber'}
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

      {qrBarber && (
        <div
          onClick={() => setQrBarber(null)}
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#111] border border-white/10 rounded-2xl p-6 max-w-sm w-full"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-barlow font-bold text-lg text-white uppercase">
                {qrBarber.name}&apos;s Client QR
              </h3>
              <button onClick={() => setQrBarber(null)} className="text-white/30 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <p className="text-white/40 text-sm mb-4">
              Share this with a client - scanning it joins the queue with {qrBarber.name} pre-selected as their barber.
            </p>
            <div className="bg-white rounded-xl p-4 flex justify-center mb-4">
              <QRCodeSVG value={`https://yourbarber.uk/arrive/${shopSlug}?barber=${qrBarber.id}`} size={180} fgColor="#0A0A0A" bgColor="white" />
            </div>
            <button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(`https://yourbarber.uk/arrive/${shopSlug}?barber=${qrBarber.id}`);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                } catch {}
              }}
              className="w-full h-11 border border-white/10 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 transition-all flex items-center justify-center gap-2"
            >
              {copied ? <Check size={14} className="text-primary" /> : <Copy size={14} />}
              {copied ? 'Copied' : 'Copy link'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
