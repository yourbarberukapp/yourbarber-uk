'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  customerId: string;
}

export default function StartCutButton({ customerId }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function handleStart() {
    setSubmitting(true);
    try {
      await fetch('/api/qr/checkin/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId }),
      });
    } finally {
      router.push(`/customers/${customerId}/visit/new`);
    }
  }

  return (
    <button
      type="button"
      onClick={handleStart}
      disabled={submitting}
      className="block w-full text-center bg-[#C8F135] hover:bg-[#b5da2d] text-black py-5 rounded-lg font-barlow font-black text-2xl uppercase tracking-wider transition-colors disabled:opacity-70"
    >
      {submitting ? 'Starting...' : 'Start Recording Cut'}
    </button>
  );
}
