'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Save, Bell, Smartphone, Download, AlertCircle } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.4, delay: i * 0.08, ease: 'easeOut' as const },
  }),
};

export default function PreferencesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [smsOptIn, setSmsOptIn] = useState<string>('opt_in');
  const [preferredReminderWeeks, setPreferredReminderWeeks] = useState<number>(6);

  useEffect(() => {
    fetch('/api/customer/preferences')
      .then((r) => {
        if (r.status === 401) { router.push('/customer/login'); return null; }
        return r.json();
      })
      .then((d) => {
        if (d) {
          setSmsOptIn(d.smsOptIn || 'opt_in');
          setPreferredReminderWeeks(d.preferredReminderWeeks || 6);
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/customer/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ smsOptIn, preferredReminderWeeks }),
      });
      if (res.ok) {
        alert('Preferences saved successfully!');
      }
    } catch {
      alert('Error saving preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = () => {
    window.location.href = '/api/customer/export';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-white/30 font-inter text-sm">Loading preferences…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <div className="border-b border-white/8 bg-[#0f0f0f] sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-5 py-4">
          <h1 className="font-barlow font-black text-xl uppercase tracking-tight text-white">
            Your <span className="text-white/50">Preferences</span>
          </h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 py-6 space-y-6">
        <motion.div initial="hidden" animate="visible" custom={0} variants={fadeUp}>
          <div className="bg-[#111] border border-white/8 rounded-lg p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-[#C8F135]/10 flex items-center justify-center">
                <Bell size={14} className="text-[#C8F135]" />
              </div>
              <h2 className="text-white font-barlow font-bold uppercase tracking-wider text-sm">Cut Reminders</h2>
            </div>
            
            <p className="text-white/40 text-[13px] font-inter mb-4">
              When should we remind you that it's time for your next cut?
            </p>
            
            <div className="flex bg-black/40 p-1 rounded-md border border-white/5">
              {[4, 6, 8, 10].map((weeks) => (
                <button
                  key={weeks}
                  onClick={() => setPreferredReminderWeeks(weeks)}
                  className={`flex-1 py-2 text-sm font-barlow font-bold transition-colors rounded ${
                    preferredReminderWeeks === weeks
                      ? 'bg-[#333] text-white shadow-sm'
                      : 'text-white/30 hover:text-white/70'
                  }`}
                >
                  {weeks} WEEKS
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div initial="hidden" animate="visible" custom={1} variants={fadeUp}>
          <div className="bg-[#111] border border-white/8 rounded-lg p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-[#C8F135]/10 flex items-center justify-center">
                <Smartphone size={14} className="text-[#C8F135]" />
              </div>
              <h2 className="text-white font-barlow font-bold uppercase tracking-wider text-sm">SMS Communications</h2>
            </div>
            
            <p className="text-white/40 text-[13px] font-inter mb-4 leading-relaxed">
              We send SMS messages for reminders and check-in links. We never send marketing spam.
            </p>

            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 rounded border border-white/5 bg-black/20 cursor-pointer hover:bg-white/5 transition-colors">
                <input 
                  type="radio" 
                  name="smsOptIn" 
                  value="opt_in" 
                  checked={smsOptIn === 'opt_in'} 
                  onChange={() => setSmsOptIn('opt_in')}
                  className="accent-[#C8F135] w-4 h-4"
                />
                <span className="text-white/80 font-inter text-sm">Send me SMS updates</span>
              </label>
              <label className="flex items-center gap-3 p-3 rounded border border-white/5 bg-black/20 cursor-pointer hover:bg-white/5 transition-colors">
                <input 
                  type="radio" 
                  name="smsOptIn" 
                  value="opt_out" 
                  checked={smsOptIn === 'opt_out'} 
                  onChange={() => setSmsOptIn('opt_out')}
                  className="accent-[#C8F135] w-4 h-4"
                />
                <span className="text-white/80 font-inter text-sm">Do not send me any SMS</span>
              </label>
            </div>
          </div>
        </motion.div>

        <motion.div initial="hidden" animate="visible" custom={2} variants={fadeUp}>
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-4 bg-[#C8F135] text-black rounded-sm font-barlow uppercase tracking-[0.1em] text-[15px] font-black hover:bg-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? 'Saving...' : (
              <>
                <Save size={16} /> Save Preferences
              </>
            )}
          </button>
        </motion.div>

        <motion.div initial="hidden" animate="visible" custom={3} variants={fadeUp} className="pt-6">
          <div className="bg-[#111] border border-white/8 rounded-lg p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                <AlertCircle size={14} className="text-white/50" />
              </div>
              <h2 className="text-white font-barlow font-bold uppercase tracking-wider text-sm">Your Data (GDPR)</h2>
            </div>
            <p className="text-white/40 text-[13px] font-inter mb-4 leading-relaxed">
              You own your photos and cut history. You can request an export of all your data or ask for your account to be deleted.
            </p>
            <button 
              onClick={handleExportData}
              className="flex items-center justify-center w-full gap-2 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 font-inter font-medium text-sm rounded transition-colors"
            >
              <Download size={16} /> Export My Data
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
