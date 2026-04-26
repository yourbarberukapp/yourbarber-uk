'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

export default function AnimateIn({ 
  children, 
  delay = 0, 
  direction = 'up',
  distance = 20,
  duration = 0.5
}: { 
  children: ReactNode; 
  delay?: number; 
  direction?: 'up' | 'down' | 'left' | 'right';
  distance?: number;
  duration?: number;
}) {
  const x = direction === 'left' ? distance : direction === 'right' ? -distance : 0;
  const y = direction === 'up' ? distance : direction === 'down' ? -distance : 0;

  return (
    <motion.div
      initial={{ opacity: 0, x, y }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ 
        duration, 
        delay,
        ease: [0.21, 0.47, 0.32, 0.98] 
      }}
    >
      {children}
    </motion.div>
  );
}
