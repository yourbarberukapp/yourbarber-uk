'use client';

import { useState } from 'react';
import { MessageCircle, Loader2 } from 'lucide-react';

export default function WhatsAppMyDayButton() {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch('/api/barber/my-day');
      if (!res.ok) throw new Error();
      const { text } = await res.json();
      const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank');
    } catch {
      alert('Could not load your day. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe5a] text-white font-barlow font-bold uppercase tracking-wide text-sm px-4 py-2.5 rounded-sm transition-colors disabled:opacity-60"
    >
      {loading ? <Loader2 size={15} className="animate-spin" /> : <MessageCircle size={15} />}
      WhatsApp my day
    </button>
  );
}
