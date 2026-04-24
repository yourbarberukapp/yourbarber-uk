'use client';
import { useState } from 'react';

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
    <form onSubmit={handleSave} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Shop URL</label>
        <p className="text-sm text-neutral-500">yourbarber.co.uk/{shop.slug}</p>
      </div>
      {[['Shop name', 'text', name, setName], ['Address', 'text', address, setAddress], ['Logo URL', 'url', logoUrl, setLogoUrl]].map(([label, type, val, setter]) => (
        <div key={label as string}>
          <label className="block text-sm font-medium mb-1">{label as string}</label>
          <input type={type as string} value={val as string} onChange={e => (setter as any)(e.target.value)}
            className="w-full h-11 px-3 border border-neutral-200 rounded-lg focus:outline-none focus:border-black" />
        </div>
      ))}
      <button type="submit" disabled={saving}
        className="h-11 px-6 bg-black text-white rounded-lg text-sm disabled:opacity-50">
        {saved ? 'Saved ✓' : saving ? 'Saving…' : 'Save settings'}
      </button>
    </form>
  );
}
