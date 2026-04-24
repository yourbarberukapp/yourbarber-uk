'use client';
import { useState } from 'react';
import { Save, ExternalLink } from 'lucide-react';
import { HoursEditor, OpeningHours, DEFAULT_HOURS } from './HoursEditor';
import { ServicesEditor, Service } from './ServicesEditor';
import { GalleryEditor, Photo } from './GalleryEditor';

interface ShopData {
  name: string;
  slug: string;
  phone: string | null;
  about: string | null;
  coverPhotoUrl: string | null;
  googleMapsUrl: string | null;
  bookingUrl: string | null;
  openingHours: OpeningHours | null;
  services: Service[];
  photos: Photo[];
}

export function MicrositeForm({ shop }: { shop: ShopData }) {
  const [phone, setPhone] = useState(shop.phone ?? '');
  const [about, setAbout] = useState(shop.about ?? '');
  const [coverPhotoUrl, setCoverPhotoUrl] = useState(shop.coverPhotoUrl ?? '');
  const [googleMapsUrl, setGoogleMapsUrl] = useState(shop.googleMapsUrl ?? '');
  const [bookingUrl, setBookingUrl] = useState(shop.bookingUrl ?? '');
  const [hours, setHours] = useState<OpeningHours>(shop.openingHours ?? DEFAULT_HOURS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch('/api/microsite/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, about, coverPhotoUrl, googleMapsUrl, bookingUrl, openingHours: hours }),
    });
    setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 2000);
  }

  const inputCls = "w-full bg-[#141414] border border-white/8 rounded px-3 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#C8F135]/40 transition-colors font-['Inter']";
  const sectionLabel = "text-[11px] font-bold uppercase tracking-widest text-white/35 font-['Barlow_Condensed'] mb-2 block";

  return (
    <form onSubmit={handleSave} className="space-y-8 max-w-2xl">
      <div className="bg-[#C8F135]/5 border border-[#C8F135]/20 rounded-lg px-4 py-3 flex items-center justify-between">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-widest text-[#C8F135]/60 font-['Barlow_Condensed'] mb-0.5">Your microsite</div>
          <code className="text-white/70 text-sm font-mono">{shop.slug}.yourbarber.uk</code>
        </div>
        <a href={`/shop/${shop.slug}`} target="_blank" rel="noopener noreferrer" className="text-[#C8F135]/50 hover:text-[#C8F135] transition-colors">
          <ExternalLink size={16} />
        </a>
      </div>

      <div className="space-y-4">
        <h3 className="font-['Barlow_Condensed'] font-bold text-base uppercase tracking-wide text-white">Contact & info</h3>
        <div>
          <label className={sectionLabel}>Phone number</label>
          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="01202 661075" className={inputCls} />
        </div>
        <div>
          <label className={sectionLabel}>About your shop</label>
          <textarea rows={4} value={about} onChange={e => setAbout(e.target.value)} placeholder="Tell customers about your shop…" className={`${inputCls} resize-none`} />
        </div>
        <div>
          <label className={sectionLabel}>Cover photo URL</label>
          <input type="url" value={coverPhotoUrl} onChange={e => setCoverPhotoUrl(e.target.value)} placeholder="https://…" className={inputCls} />
        </div>
        <div>
          <label className={sectionLabel}>Google Maps URL</label>
          <input type="url" value={googleMapsUrl} onChange={e => setGoogleMapsUrl(e.target.value)} placeholder="https://maps.google.com/?q=…" className={inputCls} />
        </div>
        <div>
          <label className={sectionLabel}>Booking link (optional)</label>
          <input type="url" value={bookingUrl} onChange={e => setBookingUrl(e.target.value)} placeholder="https://your-booking-tool.com/…" className={inputCls} />
        </div>
      </div>

      <div>
        <h3 className="font-['Barlow_Condensed'] font-bold text-base uppercase tracking-wide text-white mb-4">Opening hours</h3>
        <HoursEditor value={hours} onChange={setHours} />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="btn-lime w-full py-3 rounded flex items-center justify-center gap-2 text-sm disabled:opacity-50"
      >
        <Save size={16} />
        {saved ? 'Saved ✓' : saving ? 'Saving…' : 'Save microsite settings'}
      </button>

      <div>
        <h3 className="font-['Barlow_Condensed'] font-bold text-base uppercase tracking-wide text-white mb-4">Services & prices</h3>
        <ServicesEditor initial={shop.services} />
      </div>

      <div>
        <h3 className="font-['Barlow_Condensed'] font-bold text-base uppercase tracking-wide text-white mb-4">Gallery</h3>
        <p className="text-white/30 text-xs font-['Inter'] mb-3">Paste image URLs. These appear in your public gallery section.</p>
        <GalleryEditor initial={shop.photos} />
      </div>
    </form>
  );
}
