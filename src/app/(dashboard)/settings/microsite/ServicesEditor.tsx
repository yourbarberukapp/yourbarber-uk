'use client';
import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

export type Service = { id: string; name: string; price: string | null; duration: number | null; description: string | null };

interface Props {
  initial: Service[];
}

export function ServicesEditor({ initial }: Props) {
  const [services, setServices] = useState<Service[]>(initial);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('');
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function addService() {
    if (!name.trim()) return;
    setAdding(true);
    const res = await fetch('/api/microsite/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), price: price.trim() || undefined, duration: duration ? parseInt(duration) : undefined, sortOrder: services.length }),
    });
    if (res.ok) {
      const s = await res.json();
      setServices(prev => [...prev, s]);
      setName(''); setPrice(''); setDuration('');
    }
    setAdding(false);
  }

  async function removeService(id: string) {
    setRemovingId(id);
    const res = await fetch(`/api/microsite/services/${id}`, { method: 'DELETE' });
    if (res.ok) setServices(prev => prev.filter(s => s.id !== id));
    setRemovingId(null);
  }

  const inputStyle: React.CSSProperties = {
    background: '#141414', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4,
    color: 'white', padding: '0.5rem 0.75rem', fontSize: '0.85rem', outline: 'none',
    fontFamily: 'var(--font-inter, sans-serif)',
  };

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: '1rem' }}>
        {services.map(s => (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#1a1a1a', borderRadius: 6, padding: '0.625rem 0.875rem', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div>
              <span style={{ color: 'white', fontSize: '0.875rem', fontWeight: 600, fontFamily: 'var(--font-inter, sans-serif)' }}>{s.name}</span>
              {s.price && <span style={{ color: '#C8F135', fontSize: '0.8rem', marginLeft: 10, fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 700 }}>{s.price}</span>}
              {s.duration && <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem', marginLeft: 8 }}>{s.duration} min</span>}
            </div>
            <button
              onClick={() => removeService(s.id)}
              disabled={removingId === s.id}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.25)', padding: 4 }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {services.length === 0 && (
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.8rem', fontFamily: 'var(--font-inter, sans-serif)' }}>No services yet.</p>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <input placeholder="Service name" value={name} onChange={e => setName(e.target.value)} style={{ ...inputStyle, flex: 2, minWidth: 120 }} />
        <input placeholder="Price (e.g. £15)" value={price} onChange={e => setPrice(e.target.value)} style={{ ...inputStyle, width: 100 }} />
        <input placeholder="Mins" type="number" value={duration} onChange={e => setDuration(e.target.value)} style={{ ...inputStyle, width: 70 }} />
        <button
          onClick={addService}
          disabled={adding || !name.trim()}
          style={{ background: '#C8F135', color: '#0A0A0A', border: 'none', borderRadius: 4, padding: '0.5rem 0.875rem', fontSize: '0.8rem', fontWeight: 700, fontFamily: 'var(--font-barlow, sans-serif)', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, opacity: adding || !name.trim() ? 0.5 : 1 }}
        >
          <Plus size={14} /> Add
        </button>
      </div>
    </div>
  );
}
