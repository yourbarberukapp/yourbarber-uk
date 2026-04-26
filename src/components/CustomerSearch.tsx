'use client';
import { useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';

interface Customer {
  id: string;
  phone: string;
  name?: string | null;
  smsOptIn: string;
  lastVisitAt?: string | null;
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    <div style={{ position: 'relative' }}>
      <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
      <input
        type="search"
        inputMode="tel"
        placeholder="Search by phone or name…"
        value={query}
        onChange={e => setQuery(e.target.value)}
        style={{
          width: '100%', background: '#141414',
          border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4,
          padding: '0.75rem 1rem 0.75rem 2.75rem',
          color: 'white', fontSize: '1rem', outline: 'none',
          fontFamily: 'var(--font-inter, sans-serif)',
        }}
      />
    </div>
  );
}
