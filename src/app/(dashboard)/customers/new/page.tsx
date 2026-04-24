'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewCustomerPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    const res = await fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, name: name || undefined }),
    });
    const data = await res.json();
    if (res.status === 409) { router.push(`/customers/${data.customer.id}`); return; }
    if (!res.ok) {
      setError(data.error?.fieldErrors?.phone?.[0] ?? 'Something went wrong');
      setLoading(false); return;
    }
    router.push(`/customers/${data.id}`);
  }

  return (
    <div className="max-w-sm mx-auto mt-8">
      <h1 className="text-2xl font-bold mb-6">Add customer</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Phone number *</label>
          <input type="tel" inputMode="tel" placeholder="07700 900 001" value={phone}
            onChange={e => setPhone(e.target.value)} required
            className="w-full text-xl h-14 px-4 border-2 border-neutral-200 rounded-xl focus:outline-none focus:border-black" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Name (optional)</label>
          <input type="text" placeholder="First name" value={name}
            onChange={e => setName(e.target.value)}
            className="w-full h-12 px-4 border border-neutral-200 rounded-xl focus:outline-none focus:border-black" />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button type="submit" disabled={loading}
          className="w-full h-14 bg-black text-white text-lg rounded-xl disabled:opacity-50">
          {loading ? 'Saving…' : 'Add customer'}
        </button>
      </form>
    </div>
  );
}
