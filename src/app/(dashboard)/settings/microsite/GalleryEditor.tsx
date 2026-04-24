'use client';
import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

export type Photo = { id: string; url: string; caption: string | null };

interface Props { initial: Photo[] }

export function GalleryEditor({ initial }: Props) {
  const [photos, setPhotos] = useState<Photo[]>(initial);
  const [url, setUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function addPhoto() {
    if (!url.trim()) return;
    setAdding(true);
    const res = await fetch('/api/microsite/photos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: url.trim(), caption: caption.trim() || undefined, sortOrder: photos.length }),
    });
    if (res.ok) {
      const p = await res.json();
      setPhotos(prev => [...prev, p]);
      setUrl(''); setCaption('');
    }
    setAdding(false);
  }

  async function removePhoto(id: string) {
    setRemovingId(id);
    const res = await fetch(`/api/microsite/photos/${id}`, { method: 'DELETE' });
    if (res.ok) setPhotos(prev => prev.filter(p => p.id !== id));
    setRemovingId(null);
  }

  return (
    <div>
      {photos.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8, marginBottom: '1rem' }}>
          {photos.map(p => (
            <div key={p.id} style={{ position: 'relative', aspectRatio: '1', borderRadius: 6, overflow: 'hidden', background: '#1a1a1a' }}>
              <img src={p.url} alt={p.caption ?? ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <button
                onClick={() => removePhoto(p.id)}
                disabled={removingId === p.id}
                style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: 4, cursor: 'pointer', color: 'white', padding: 4 }}
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          placeholder="Photo URL (paste image link)"
          value={url}
          onChange={e => setUrl(e.target.value)}
          style={{ flex: 3, minWidth: 200, background: '#141414', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, color: 'white', padding: '0.5rem 0.75rem', fontSize: '0.85rem', outline: 'none', fontFamily: 'var(--font-inter, sans-serif)' }}
        />
        <input
          placeholder="Caption (optional)"
          value={caption}
          onChange={e => setCaption(e.target.value)}
          style={{ flex: 1, minWidth: 120, background: '#141414', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, color: 'white', padding: '0.5rem 0.75rem', fontSize: '0.85rem', outline: 'none', fontFamily: 'var(--font-inter, sans-serif)' }}
        />
        <button
          onClick={addPhoto}
          disabled={adding || !url.trim()}
          style={{ background: '#C8F135', color: '#0A0A0A', border: 'none', borderRadius: 4, padding: '0.5rem 0.875rem', fontSize: '0.8rem', fontWeight: 700, fontFamily: 'var(--font-barlow, sans-serif)', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, opacity: adding || !url.trim() ? 0.5 : 1 }}
        >
          <Plus size={14} /> Add
        </button>
      </div>
    </div>
  );
}
