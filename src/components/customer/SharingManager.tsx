'use client';

import { useState, useEffect } from 'react';
import { Share2, X, Phone, Loader2, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Sharing = {
  id: string;
  sharedWithPhone: string;
  createdAt: string;
};

export default function SharingManager() {
  const [sharings, setSharings] = useState<Sharing[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSharings();
  }, []);

  const fetchSharings = async () => {
    try {
      const res = await fetch('/api/customer/family/share');
      if (res.ok) {
        const data = await res.json();
        setSharings(data);
      }
    } catch (error) {
      console.error('Failed to fetch sharings:', error);
    } finally {
      setLoading(false);
    }
  };

  const addSharing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/customer/family/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim(), action: 'add' }),
      });

      if (res.ok) {
        setPhone('');
        setAdding(false);
        fetchSharings();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to share account');
      }
    } catch (error) {
      alert('Error sharing account');
    } finally {
      setSubmitting(false);
    }
  };

  const removeSharing = async (targetPhone: string) => {
    if (!confirm(`Stop sharing with ${targetPhone}?`)) return;

    try {
      const res = await fetch('/api/customer/family/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: targetPhone, action: 'remove' }),
      });

      if (res.ok) {
        fetchSharings();
      }
    } catch (error) {
      alert('Error removing sharing');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="text-[#C8F135] animate-spin" size={24} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-barlow font-bold uppercase tracking-wider text-sm">Account Sharing</h3>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 text-[#C8F135] text-xs font-bold uppercase tracking-widest hover:text-white transition-colors"
          >
            <Share2 size={14} /> Add Partner
          </button>
        )}
      </div>

      <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4 flex gap-3">
        <Info className="text-blue-400 flex-shrink-0" size={18} />
        <p className="text-blue-100/60 text-xs font-inter leading-relaxed">
          Sharing your account allows another person (like a partner or co-parent) to see your family members and visit history when they log in with their own phone number.
        </p>
      </div>

      <AnimatePresence mode="popLayout">
        {adding && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={addSharing}
            className="bg-[#111] border border-[#C8F135]/20 rounded-lg p-4 overflow-hidden"
          >
            <div className="space-y-3">
              <div>
                <label className="block text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] mb-1.5">
                  Partner's Mobile Number
                </label>
                <input
                  autoFocus
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 07700 900000"
                  className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-3 text-white font-inter text-sm focus:outline-none focus:border-[#C8F135]/50 transition-colors"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-[#C8F135] text-black font-barlow font-black uppercase tracking-widest text-xs py-3 rounded-sm disabled:opacity-50"
                >
                  {submitting ? 'Sharing...' : 'Confirm Share'}
                </button>
                <button
                  type="button"
                  onClick={() => setAdding(false)}
                  className="px-4 border border-white/10 text-white/40 font-barlow font-black uppercase tracking-widest text-xs py-3 rounded-sm hover:bg-white/5"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="space-y-2">
        {sharings.length === 0 && !adding && (
          <div className="bg-[#111] border border-white/5 rounded-lg p-8 text-center">
            <Share2 className="mx-auto text-white/10 mb-3" size={32} />
            <p className="text-white/40 text-sm font-inter">You haven't shared your account with anyone yet.</p>
          </div>
        )}
        {sharings.map((share) => (
          <motion.div
            layout
            key={share.id}
            className="group bg-[#111] border border-white/8 rounded-lg p-4 flex items-center justify-between hover:border-white/20 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Phone size={18} className="text-blue-400" />
              </div>
              <div>
                <div className="text-white font-bold font-inter text-sm">{share.sharedWithPhone}</div>
                <div className="text-white/40 text-[10px] font-bold uppercase tracking-wider mt-0.5">
                  Shared on {new Date(share.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
            <button
              onClick={() => removeSharing(share.sharedWithPhone)}
              className="p-2 text-white/20 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
            >
              <X size={16} />
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
