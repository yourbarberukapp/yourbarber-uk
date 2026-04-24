'use client';
import { useState } from 'react';
import Link from 'next/link';
import { CustomerSearch } from '@/components/CustomerSearch';
import { CustomerCard } from '@/components/CustomerCard';

interface Customer {
  id: string; phone: string; name?: string | null;
  smsOptIn: string; lastVisitAt?: string | null;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Customers</h1>
        <Link href="/customers/new" className="bg-black text-white text-sm px-4 py-2 rounded-lg">+ New</Link>
      </div>
      <CustomerSearch onResults={setCustomers} onLoading={setLoading} />
      {loading && <p className="text-sm text-neutral-400 text-center py-4">Loading…</p>}
      {!loading && customers.length === 0 && (
        <p className="text-sm text-neutral-400 text-center py-8">No customers found.</p>
      )}
      {!loading && customers.map(c => <CustomerCard key={c.id} {...c} />)}
    </div>
  );
}
