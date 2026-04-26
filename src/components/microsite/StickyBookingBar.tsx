'use client';

import Link from 'next/link';
import { ChevronRight, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function StickyBookingBar({ shopSlug, shopName }: { shopSlug: string; shopName: string }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling 300px
      setIsVisible(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-8 md:pb-4 bg-gradient-to-t from-black to-transparent pointer-events-none"
        >
          <div className="max-w-md mx-auto pointer-events-auto">
            <Link
              href={`/shop/${shopSlug}/book`}
              className="flex items-center justify-between bg-[#C8F135] text-black px-6 py-4 rounded-xl shadow-2xl shadow-[#C8F135]/20 group no-underline transition-transform active:scale-95"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-black/10 flex items-center justify-center">
                  <Calendar size={20} />
                </div>
                <div>
                  <p className="font-barlow font-black text-lg uppercase leading-none tracking-tight">Book Now</p>
                  <p className="text-xs font-inter font-medium opacity-60">Next available: Today</p>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-[#C8F135] group-hover:translate-x-1 transition-transform">
                <ChevronRight size={20} />
              </div>
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
