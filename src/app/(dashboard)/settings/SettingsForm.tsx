'use client';
import { useState, useRef } from 'react';
import { Save, ExternalLink, Globe, Store, MapPin, Image as ImageIcon, BellRing, ShieldAlert, Clock, Star, Upload, Loader2 } from 'lucide-react';

interface Props { shop: { name: string; address: string | null; logoUrl: string | null; slug: string; allowBarberReminders: boolean; defaultCutTime: number; googleReviewUrl: string | null }; }

const CUT_TIME_OPTIONS = [10, 15, 20, 25, 30, 40, 45, 60];

export function SettingsForm({ shop }: Props) {
  const [name, setName] = useState(shop.name);
  const [address, setAddress] = useState(shop.address ?? '');
  const [logoUrl, setLogoUrl] = useState(shop.logoUrl ?? '');
  const [googleReviewUrl, setGoogleReviewUrl] = useState(shop.googleReviewUrl ?? '');
  const [allowBarberReminders, setAllowBarberReminders] = useState(shop.allowBarberReminders);
  const [defaultCutTime, setDefaultCutTime] = useState(shop.defaultCutTime);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoError, setLogoError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleLogoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setLogoError('Use a JPG, PNG, or WEBP image.');
      return;
    }
    setLogoError('');
    setUploadingLogo(true);
    try {
      const res = await fetch('/api/settings/logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentType: file.type }),
      });
      if (!res.ok) throw new Error();
      const { uploadUrl, publicUrl } = await res.json();
      const putRes = await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
      if (!putRes.ok) throw new Error();
      setLogoUrl(publicUrl);
    } catch {
      setLogoError('Upload failed — try again.');
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    await fetch('/api/settings', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, address, logoUrl, allowBarberReminders, defaultCutTime, googleReviewUrl }),
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

        <div>
          <div className="flex items-center gap-2 mb-1.5 ml-1">
            <ImageIcon size={12} className="text-white/30" />
            <label className="text-[11px] font-bold uppercase tracking-widest text-white/40">Logo</label>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-[#111] border border-white/5 flex items-center justify-center overflow-hidden shrink-0">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="Shop logo" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon size={20} className="text-white/15" />
              )}
            </div>
            <div className="flex-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleLogoFile}
                className="hidden"
                id="logo-upload"
              />
              <label
                htmlFor="logo-upload"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#111] border border-white/10 rounded-xl text-sm text-white/70 hover:border-primary/40 hover:text-white cursor-pointer transition-all"
              >
                {uploadingLogo ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                {uploadingLogo ? 'Uploading…' : logoUrl ? 'Replace logo' : 'Upload logo'}
              </label>
              {logoError && <p className="text-[11px] text-red-400 mt-1.5">{logoError}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Google review URL */}
      <div>
        <div className="flex items-center gap-2 mb-1.5 ml-1">
          <Star size={12} className="text-white/30" />
          <label className="text-[11px] font-bold uppercase tracking-widest text-white/40">Google Review Link</label>
        </div>
        <input
          type="url"
          value={googleReviewUrl}
          onChange={e => setGoogleReviewUrl(e.target.value)}
          placeholder="https://g.page/r/..."
          className="w-full h-12 px-4 bg-[#111] border border-white/5 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 focus:bg-white/[0.02] transition-all"
        />
        <p className="text-[11px] text-white/20 mt-1.5 ml-1" style={{ fontFamily: 'var(--font-inter, sans-serif)' }}>
          Google Business Profile → Get more reviews → Copy link. Shown to clients after a positive rating.
        </p>
      </div>

      {/* Cut time */}
      <div className="pt-4 border-t border-white/5">
        <div className="flex items-center gap-2 mb-3 ml-1">
          <Clock size={12} className="text-white/30" />
          <label className="text-[11px] font-bold uppercase tracking-widest text-white/40">Typical cut time</label>
        </div>
        <div className="flex flex-wrap gap-2">
          {CUT_TIME_OPTIONS.map(mins => (
            <button
              key={mins}
              type="button"
              onClick={() => setDefaultCutTime(mins)}
              className="px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-tight transition-all"
              style={{
                background: defaultCutTime === mins ? 'rgba(200,241,53,0.12)' : 'rgba(255,255,255,0.04)',
                border: defaultCutTime === mins ? '1px solid rgba(200,241,53,0.3)' : '1px solid rgba(255,255,255,0.06)',
                color: defaultCutTime === mins ? '#C8F135' : 'rgba(255,255,255,0.35)',
                fontFamily: 'var(--font-barlow, sans-serif)',
              }}
            >
              {mins} min
            </button>
          ))}
        </div>
        <p className="text-[11px] text-white/20 mt-2 ml-1" style={{ fontFamily: 'var(--font-inter, sans-serif)' }}>
          Used to estimate queue wait times for clients
        </p>
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
              <p className="text-xs text-white/30 font-inter">Allow staff to send manual Wallet-pass reminders</p>
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

