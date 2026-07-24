'use client';
import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

export type Product = { id: string; name: string; price: string | null; imageUrl: string | null; description: string | null };

interface Props {
  initial: Product[];
}

export function ProductsEditor({ initial }: Props) {
  const [products, setProducts] = useState<Product[]>(initial);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function addProduct() {
    if (!name.trim()) return;
    setAdding(true);
    const res = await fetch('/api/microsite/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        price: price.trim() || undefined,
        imageUrl: imageUrl.trim() || undefined,
        description: description.trim() || undefined,
        sortOrder: products.length,
      }),
    });
    if (res.ok) {
      const p = await res.json();
      setProducts(prev => [...prev, p]);
      setName(''); setPrice(''); setImageUrl(''); setDescription('');
    }
    setAdding(false);
  }

  async function removeProduct(id: string) {
    setRemovingId(id);
    const res = await fetch(`/api/microsite/products/${id}`, { method: 'DELETE' });
    if (res.ok) setProducts(prev => prev.filter(p => p.id !== id));
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
        {products.map(p => (
          <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#1a1a1a', borderRadius: 6, padding: '0.625rem 0.875rem', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div>
              <span style={{ color: 'white', fontSize: '0.875rem', fontWeight: 600, fontFamily: 'var(--font-inter, sans-serif)' }}>{p.name}</span>
              {p.price && <span style={{ color: '#C8F135', fontSize: '0.8rem', marginLeft: 10, fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 700 }}>£{p.price}</span>}
            </div>
            <button
              onClick={() => removeProduct(p.id)}
              disabled={removingId === p.id}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.25)', padding: 4 }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {products.length === 0 && (
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.8rem', fontFamily: 'var(--font-inter, sans-serif)' }}>No products yet.</p>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input placeholder="Product name" value={name} onChange={e => setName(e.target.value)} style={{ ...inputStyle, flex: 2, minWidth: 120 }} />
          <input placeholder="Price (e.g. 12.00)" value={price} onChange={e => setPrice(e.target.value)} style={{ ...inputStyle, width: 120 }} />
        </div>
        <input placeholder="Image URL (optional)" value={imageUrl} onChange={e => setImageUrl(e.target.value)} style={inputStyle} />
        <div style={{ display: 'flex', gap: 8 }}>
          <input placeholder="Short description (optional)" value={description} onChange={e => setDescription(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
          <button
            onClick={addProduct}
            disabled={adding || !name.trim()}
            style={{ background: '#C8F135', color: '#0A0A0A', border: 'none', borderRadius: 4, padding: '0.5rem 0.875rem', fontSize: '0.8rem', fontWeight: 700, fontFamily: 'var(--font-barlow, sans-serif)', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, opacity: adding || !name.trim() ? 0.5 : 1, whiteSpace: 'nowrap' }}
          >
            <Plus size={14} /> Add
          </button>
        </div>
      </div>
    </div>
  );
}
