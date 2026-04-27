'use client';

import { useState, useEffect } from 'react';
import { Clock, Users, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

type QueueData = {
  waitingCount: number;
  activeBarbers: number;
  estimatedWait: number;
  isBusy: boolean;
};

export default function QueueStatus({ shopSlug }: { shopSlug: string }) {
  const [data, setData] = useState<QueueData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQueue = async () => {
      try {
        const res = await fetch(`/api/shop/${shopSlug}/queue`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error('Failed to fetch queue:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchQueue();
    const interval = setInterval(fetchQueue, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, [shopSlug]);

  if (loading) {
    return (
      <div className="h-16 bg-[#111] border border-white/5 rounded-lg animate-pulse" />
    );
  }

  if (!data) return null;

  return (
    <div className="bg-[#111] border border-[#C8F135]/10 rounded-lg overflow-hidden relative">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#C8F135]/5 blur-[40px] -mr-16 -mt-16" />

      <div className="p-4 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-[#C8F135]/10 flex items-center justify-center">
              <Clock size={20} className="text-[#C8F135]" />
            </div>
            {/* Pulsating Live Dot */}
            <span className="absolute top-0 right-0 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C8F135] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#C8F135]"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-barlow font-black text-2xl uppercase leading-none">
                {data.estimatedWait} <span className="text-sm font-bold text-white/40">MINS</span>
              </span>
            </div>
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">
              ESTIMATED WAIT
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="text-right">
            <div className="flex items-center justify-end gap-1.5 text-white font-inter font-bold text-sm">
              <Users size={14} className="text-white/20" />
              {data.waitingCount}
            </div>
            <p className="text-white/20 text-[9px] font-bold uppercase tracking-wider mt-0.5">
              IN QUEUE
            </p>
          </div>

          <div className="w-px h-8 bg-white/5" />

          <div className="text-right">
            <div className="flex items-center justify-end gap-1.5 text-white font-inter font-bold text-sm">
              <Zap size={14} className={data.isBusy ? 'text-orange-400' : 'text-[#C8F135]'} />
              {data.isBusy ? 'Busy' : 'Normal'}
            </div>
            <p className="text-white/20 text-[9px] font-bold uppercase tracking-wider mt-0.5">
              TRAFFIC
            </p>
          </div>
        </div>
      </div>

      {/* Progress Bar (Visual decoration) */}
      <div className="h-0.5 w-full bg-white/5">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${Math.min((data.estimatedWait / 120) * 100, 100)}%` }}
          className="h-full bg-[#C8F135]/30"
        />
      </div>
    </div>
  );
}
