'use client';
import { useState } from 'react';
import { Save, ExternalLink, Globe, Store, MapPin, Image as ImageIcon, BellRing, ShieldAlert } from 'lucide-react';

interface Props { shop: { name: string; address: string | null; logoUrl: string | null; slug: string; allowBarberReminders: boolean }; }

export function SettingsForm({ shop }: Props) {
  const [name, setName] = useState(shop.name);
  const [address, setAddress] = useState(shop.address ?? '');
  const [logoUrl, setLogoUrl] = useState(shop.logoUrl ?? '');
  const [allowBarberReminders, setAllowBarberReminders] = useState(shop.allowBarberReminders);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    await fetch('/api/settings', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, address, logoUrl, allowBarberReminders }),
    });
    setSaved(true); setSaving(false);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="bg-[#111] border border-white/5 rounded-2xl p-5 group transition-all hover:border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Globe size={16} />
          </div>
          <label className="text-[11px] font-bold uppercase tracking-widest text-white/40">Shop URL</label>
        </div>
        <div className="flex items-center justify-between bg-black/40 border border-white/5 rounded-xl px-4 py-3 group/url">
          <p className="text-sm font-mono text-white/60">yourbarber.uk/{shop.slug}</p>
          <a 
            href={`https://yourbarber.uk/${shop.slug}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-1.5 text-white/20 hover:text-primary transition-colors"
          >
            <ExternalLink size={14} />
          </a>
        </div>
      </div>

      <div className="space-y-4">
        {[
          { label: 'Shop Name', icon: Store, type: 'text', value: name, setter: setName, placeholder: 'My Barbershop' },
          { label: 'Address', icon: MapPin, type: 'text', value: address, setter: setAddress, placeholder: '123 Street Name, City' },
          { label: 'Logo URL', icon: ImageIcon, type: 'url', value: logoUrl, setter: setLogoUrl, placeholder: 'https://...' }
        ].map((field) => (
          <div key={field.label}>
            <div className="flex items-center gap-2 mb-1.5 ml-1">
              <field.icon size={12} className="text-white/30" />
              <label className="text-[11px] font-bold uppercase tracking-widest text-white/40">{field.label}</label>
            </div>
            <input 
              type={field.type} 
              value={field.value} 
              onChange={e => field.setter(e.target.value)} 
              placeholder={field.placeholder}
              className="w-full h-12 px-4 bg-[#111] border border-white/5 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 focus:bg-white/[0.02] transition-all" 
            />
          </div>
        ))}
      </div>

      {/* Permissions Section */}
      <div className="pt-4 border-t border-white/5 space-y-4">
        <div className="flex items-center gap-2 mb-2 ml-1">
          <ShieldAlert size={12} className="text-white/30" />
          <label className="text-[11px] font-bold uppercase tracking-widest text-white/40">Permissions & Costs</label>
        </div>
        
        <div 
          onClick={() => setAllowBarberReminders(!allowBarberReminders)}
          className={`
            flex items-center justify-between p-4 bg-[#111] border rounded-2xl cursor-pointer transition-all
            ${allowBarberReminders ? 'border-primary/20 bg-primary/[0.02]' : 'border-white/5 hover:border-white/10'}
          `}
        >
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${allowBarberReminders ? 'bg-primary/20 text-primary' : 'bg-white/5 text-white/20'}`}>
              <BellRing size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-white uppercase tracking-tight">Barber Reminders</p>
              <p className="text-xs text-white/30 font-inter">Allow staff to send manual SMS reminders</p>
            </div>
          </div>
          <div className={`w-10 h-6 rounded-full relative transition-colors ${allowBarberReminders ? 'bg-primary' : 'bg-white/10'}`}>
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${allowBarberReminders ? 'left-5' : 'left-1'}`} />
          </div>
        </div>
      </div>

      <button 
        type="submit" 
        disabled={saving}
        className="btn-lime w-full h-12 rounded-xl flex items-center justify-center gap-2 text-sm font-bold shadow-lg shadow-primary/10 disabled:opacity-50 transition-all active:scale-[0.98]"
      >
        {saved ? (
          <>Saved ✓</>
        ) : (
          <>
            <Save size={18} />
            {saving ? 'Saving…' : 'Save Settings'}
          </>
        )}
      </button>
    </form>
  );
}

