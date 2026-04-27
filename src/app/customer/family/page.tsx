'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChevronLeft, Users, Shield } from 'lucide-react';
import FamilyManager from '@/components/customer/FamilyManager';
import SharingManager from '@/components/customer/SharingManager';

export default function FamilyPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Header */}
      <div className="border-b border-white/8 bg-[#0f0f0f] sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-5 py-4 flex items-center gap-4">
          <button 
            onClick={() => router.push('/customer')}
            className="p-2 -ml-2 text-white/40 hover:text-white transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="font-barlow font-black text-xl uppercase tracking-tight text-white">
            Family <span className="text-[#C8F135]">& Sharing</span>
          </h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 py-8 space-y-12">
        {/* Section 1: Children/Family */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#C8F135]/10 flex items-center justify-center">
              <Users size={20} className="text-[#C8F135]" />
            </div>
            <div>
              <h2 className="text-white font-barlow font-black text-2xl uppercase leading-none">Family Members</h2>
              <p className="text-white/40 text-xs font-inter mt-1">Manage children and others you check in for.</p>
            </div>
          </div>
          
          <FamilyManager />
        </motion.section>

        {/* Divider */}
        <div className="h-px bg-white/5" />

        {/* Section 2: Sharing */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="space-y-6"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Shield size={20} className="text-blue-400" />
            </div>
            <div>
              <h2 className="text-white font-barlow font-black text-2xl uppercase leading-none">Co-Parent Sharing</h2>
              <p className="text-white/40 text-xs font-inter mt-1">Share access with a partner's mobile number.</p>
            </div>
          </div>

          <SharingManager />
        </motion.section>

        {/* Help text */}
        <div className="pt-8 text-center">
          <p className="text-white/20 text-[10px] font-bold uppercase tracking-[0.2em] max-w-[280px] mx-auto leading-relaxed">
            All data is encrypted and shared only with verified mobile numbers in your shop.
          </p>
        </div>
      </div>
    </div>
  );
}
