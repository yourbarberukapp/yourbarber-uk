'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Star, Quote } from 'lucide-react';

type Testimonial = {
  id: string;
  rating: string;
  comment: string | null;
  customer: {
    name: string | null;
  };
  createdAt: Date;
};

export default function TestimonialCarousel({ testimonials }: { testimonials: any[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (testimonials.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [testimonials.length]);

  if (testimonials.length === 0) return null;

  const current = testimonials[index];

  return (
    <section className="mb-20 overflow-hidden">
      <div className="flex items-center gap-2 mb-8">
        <h2 className="font-barlow font-black text-3xl uppercase tracking-tighter">
          What they say
        </h2>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      <div className="relative min-h-[200px] flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full text-center px-4"
          >
            <div className="flex justify-center gap-1 mb-6">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={16} className="fill-[#C8F135] text-[#C8F135]" />
              ))}
            </div>
            
            <p className="font-inter text-xl md:text-2xl text-white italic leading-relaxed mb-8 max-w-2xl mx-auto">
              "{current.comment || 'Amazing service, highly recommended!'}"
            </p>

            <div className="flex flex-col items-center">
              <span className="font-barlow font-bold text-lg uppercase tracking-widest text-[#C8F135]">
                {current.customer.name || 'Regular Customer'}
              </span>
              <span className="text-white/30 text-xs font-inter mt-1">
                Verified Resident
              </span>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress Dots */}
      <div className="flex justify-center gap-2 mt-8">
        {testimonials.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`h-1 rounded-full transition-all ${
              i === index ? 'w-8 bg-[#C8F135]' : 'w-2 bg-white/10 hover:bg-white/30'
            }`}
          />
        ))}
      </div>
    </section>
  );
}
