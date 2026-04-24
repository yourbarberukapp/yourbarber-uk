'use client';
import { useEffect, useRef, useState } from 'react';

interface Customer {
  id: string; phone: string; name?: string | null;
  smsOptIn: string; lastVisitAt?: string | null;
}

interface Props {
  onResults: (customers: Customer[]) => void;
  onLoading: (v: boolean) => void;
}

export function CustomerSearch({ onResults, onLoading }: Props) {
  const [query, setQuery] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    clearTimeout(debounceRef.current);
    onLoading(true);
    const url = query.length >= 2 ? `/api/customers?q=${encodeURIComponent(query)}` : '/api/customers';
    debounceRef.current = setTimeout(() => {
      fetch(url).then(r => r.json()).then(data => { onResults(data); onLoading(false); });
    }, query.length < 2 ? 0 : 250);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  return (
    <input
      type="search"
      inputMode="tel"
      placeholder="Search by phone or name…"
      value={query}
      onChange={e => setQuery(e.target.value)}
      className="w-full text-lg h-14 px-4 border-2 border-neutral-200 rounded-xl focus:outline-none focus:border-black"
    />
  );
}
