'use client';
import { useState } from 'react';
import { Save, ExternalLink, Globe, Store, MapPin, Image as ImageIcon } from 'lucide-react';

interface Props { shop: { name: string; address: string | null; logoUrl: string | null; slug: string }; }

export function SettingsForm({ shop }: Props) {
  const [name, setName] = useState(shop.name);
  const [address, setAddress] = useState(shop.address ?? '');
  const [logoUrl, setLogoUrl] = useState(shop.logoUrl ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    await fetch('/api/settings', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, address, logoUrl }),
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

