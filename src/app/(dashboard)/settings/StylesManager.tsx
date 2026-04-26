'use client';
import { useState, useEffect, useRef } from 'react';
import { Plus, X, Eye, EyeOff, Camera } from 'lucide-react';
import { SHOP_TYPES, ShopType } from '@/lib/styleDefaults';
import { DarkSelect } from '@/components/DarkSelect';

type Style = { id: string; name: string; category: string; active: boolean; imageUrl?: string | null };

const CATEGORIES = [
  { value: 'fade',    label: 'Fade' },
  { value: 'taper',   label: 'Taper' },
  { value: 'classic', label: 'Classic' },
  { value: 'natural', label: 'Natural' },
  { value: 'beard',   label: 'Beard' },
] as const;

const CATEGORY_COLORS: Record<string, string> = {
  fade:    '#C8F135',
  taper:   '#60a5fa',
  classic: '#f472b6',
  natural: '#fb923c',
  beard:   '#a78bfa',
};

function StyleRow({ style, onToggle, onDelete, onImageUploaded }: {
  style: Style;
  onToggle: (id: string, active: boolean) => void;
  onDelete: (id: string) => void;
  onImageUploaded: (id: string, url: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const catLabel = CATEGORIES.find(c => c.value === style.category)?.label ?? style.category;

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const res = await fetch(`/api/shop/styles/${style.id}/image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentType: file.type }),
      });
      const { uploadUrl, publicUrl } = await res.json();
      await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
      await fetch(`/api/shop/styles/${style.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: publicUrl }),
      });
      onImageUploaded(style.id, publicUrl);
    } finally {
      setUploading(false);
    }
  }

  const src = style.imageUrl ?? `/styles/${style.name}.png`;
  const opacity = style.active ? 1 : 0.5;

  return (
    <div
      className="flex items-center gap-3 border border-white/5 rounded-xl px-3 py-2 group hover:border-white/10 transition-all"
      style={{ background: style.active ? '#111' : '#0a0a0a', opacity }}
    >
      {/* Thumbnail with upload overlay */}
      <div
        className="relative flex-shrink-0 cursor-pointer"
        style={{ width: 40, height: 40, borderRadius: 6, overflow: 'hidden', background: '#1a1a1a' }}
        onClick={() => fileRef.current?.click()}
        title="Upload photo"
      >
        <img
          src={src}
          alt={style.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
          {uploading
            ? <span style={{ fontSize: 10, color: 'white', fontWeight: 700 }}>…</span>
            : <Camera size={13} color="white" />
          }
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
        />
      </div>

      <span
        className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded flex-shrink-0"
        style={{ background: CATEGORY_COLORS[style.category] + '22', color: CATEGORY_COLORS[style.category] }}
      >
        {catLabel}
      </span>
      <span className="flex-1 text-white text-sm truncate">{style.name}</span>

      {style.active ? (
        <button
          onClick={() => onToggle(style.id, false)}
          className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-white/60 transition-all"
          title="Hide style"
        >
          <EyeOff size={14} />
        </button>
      ) : (
        <button
          onClick={() => onToggle(style.id, true)}
          className="opacity-0 group-hover:opacity-100 text-white/40 hover:text-white/70 transition-all"
          title="Show style"
        >
          <Eye size={14} />
        </button>
      )}
      <button
        onClick={() => onDelete(style.id)}
        className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-all"
        title="Delete style"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function StylesManager({ initialShopType }: { initialShopType: string | null }) {
  const [styles, setStyles] = useState<Style[]>([]);
  const [shopType, setShopType] = useState<ShopType>((initialShopType as ShopType) ?? 'uk_general');
  const [seedType, setSeedType] = useState<ShopType>((initialShopType as ShopType) ?? 'uk_general');
  const [seeding, setSeeding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCat, setNewCat] = useState<'fade' | 'taper' | 'classic' | 'natural' | 'beard'>('classic');
  const [adding, setAdding] = useState(false);
  const [filterCat, setFilterCat] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/shop/styles?all=1')
      .then(r => r.json())
      .then(d => { setStyles(d.styles ?? []); setLoading(false); });
  }, []);

  async function applyDefaults() {
    if (!confirm(`This will replace your current styles with ${SHOP_TYPES.find(t => t.value === seedType)?.label} defaults. Continue?`)) return;
    setSeeding(true);
    const res = await fetch('/api/shop/styles/seed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shopType: seedType }),
    });
    const data = await res.json();
    if (res.ok) { setStyles(data.styles); setShopType(seedType); }
    setSeeding(false);
  }

  async function toggleStyle(id: string, active: boolean) {
    setStyles(prev => prev.map(s => s.id === id ? { ...s, active } : s));
    await fetch(`/api/shop/styles/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active }),
    });
  }

  async function deleteStyle(id: string) {
    setStyles(prev => prev.filter(s => s.id !== id));
    await fetch(`/api/shop/styles/${id}`, { method: 'DELETE' });
  }

  async function addStyle() {
    if (!newName.trim()) return;
    setAdding(true);
    const res = await fetch('/api/shop/styles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim(), category: newCat }),
    });
    const data = await res.json();
    if (res.ok) { setStyles(prev => [...prev, data.style]); setNewName(''); }
    setAdding(false);
  }

  function handleImageUploaded(id: string, url: string) {
    setStyles(prev => prev.map(s => s.id === id ? { ...s, imageUrl: url } : s));
  }

  const filtered = filterCat === 'all' ? styles : styles.filter(s => s.category === filterCat);
  const activeCount = styles.filter(s => s.active).length;

  return (
    <div>
      {/* Shop type + apply defaults */}
      <div className="bg-[#111] border border-white/5 rounded-2xl p-5 mb-6">
        <p className="text-[11px] font-bold uppercase tracking-widest text-white/40 mb-3">Shop Type</p>
        <p className="text-white/50 text-xs mb-4">
          Choose your barbershop style and apply the matching defaults. You can add or remove styles below after applying.
        </p>
        <div className="flex gap-3">
          <DarkSelect
            value={seedType}
            onChange={v => setSeedType(v as ShopType)}
            options={SHOP_TYPES.map(t => ({ value: t.value, label: t.label }))}
          />
          <button
            onClick={applyDefaults}
            disabled={seeding}
            className="btn-lime px-5 h-11 rounded-xl text-sm font-bold whitespace-nowrap disabled:opacity-50"
          >
            {seeding ? 'Applying…' : 'Apply defaults'}
          </button>
        </div>
        {shopType && (
          <p className="text-white/25 text-xs mt-2">
            Current: {SHOP_TYPES.find(t => t.value === shopType)?.label ?? shopType} — {activeCount} active styles
          </p>
        )}
      </div>

      {/* Category filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {[{ value: 'all', label: 'All' }, ...CATEGORIES].map(cat => (
          <button
            key={cat.value}
            onClick={() => setFilterCat(cat.value)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all"
            style={{
              background: filterCat === cat.value
                ? (cat.value === 'all' ? 'rgba(255,255,255,0.12)' : CATEGORY_COLORS[cat.value] + '22')
                : 'transparent',
              color: filterCat === cat.value
                ? (cat.value === 'all' ? 'white' : CATEGORY_COLORS[cat.value])
                : 'rgba(255,255,255,0.3)',
              border: `1px solid ${filterCat === cat.value
                ? (cat.value === 'all' ? 'rgba(255,255,255,0.2)' : CATEGORY_COLORS[cat.value] + '55')
                : 'rgba(255,255,255,0.06)'}`,
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <p className="text-white/20 text-xs mb-3 flex items-center gap-1.5">
        <Camera size={11} /> Hover a style and click the thumbnail to upload a custom photo
      </p>

      {/* Styles list — active first, then inactive inline */}
      {loading ? (
        <p className="text-white/30 text-sm py-4">Loading styles…</p>
      ) : filtered.length === 0 ? (
        <p className="text-white/30 text-sm py-4">No styles. Apply defaults above or add one below.</p>
      ) : (
        <div className="space-y-1 mb-6">
          {/* Active */}
          {filtered.filter(s => s.active).map(style => (
            <StyleRow
              key={style.id}
              style={style}
              onToggle={toggleStyle}
              onDelete={deleteStyle}
              onImageUploaded={handleImageUploaded}
            />
          ))}

          {/* Hidden — collapsed */}
          {filtered.filter(s => !s.active).length > 0 && (
            <details className="mt-2">
              <summary className="text-white/30 text-xs cursor-pointer hover:text-white/50 transition-colors py-1">
                {filtered.filter(s => !s.active).length} hidden styles
              </summary>
              <div className="space-y-1 mt-2">
                {filtered.filter(s => !s.active).map(style => (
                  <StyleRow
                    key={style.id}
                    style={style}
                    onToggle={toggleStyle}
                    onDelete={deleteStyle}
                    onImageUploaded={handleImageUploaded}
                  />
                ))}
              </div>
            </details>
          )}
        </div>
      )}

      {/* Add custom style */}
      <div className="bg-[#111] border border-white/5 rounded-2xl p-4">
        <p className="text-[11px] font-bold uppercase tracking-widest text-white/40 mb-3">Add custom style</p>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Style name…"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addStyle()}
            className="flex-1 h-10 px-3 bg-black/40 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-primary/50"
          />
          <DarkSelect
            value={newCat}
            onChange={v => setNewCat(v as typeof newCat)}
            options={CATEGORIES.map(c => ({ value: c.value, label: c.label }))}
          />
          <button
            onClick={addStyle}
            disabled={adding || !newName.trim()}
            className="h-10 w-10 flex items-center justify-center btn-lime rounded-xl disabled:opacity-40"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
