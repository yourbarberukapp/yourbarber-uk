'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

const included = [
  'Your shop profile set up for you',
  'Live queue and customer portal walkthrough',
  'Help importing your first regulars',
];

export default function DemoPage() {
  const [form, setForm] = useState({ name: '', shopName: '', phone: '', email: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch('/api/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      setStatus('done');
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white overflow-x-hidden">
      <Navbar />

      <section className="relative min-h-screen flex items-center py-32">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[#C8F135]/10 blur-3xl" />
          <div className="absolute bottom-10 right-0 h-56 w-56 rounded-full bg-white/5 blur-3xl" />
        </div>

        <div className="container relative mx-auto px-6 lg:px-12 max-w-6xl">
          <motion.div initial="hidden" animate="visible" variants={fadeUp}>
            <Link href="/" className="inline-flex items-center gap-2 text-white/40 hover:text-white text-sm font-inter mb-10 transition-colors">
              <ArrowLeft size={14} />
              Back
            </Link>

            {status === 'done' ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-[#C8F135]/10 flex items-center justify-center mx-auto mb-6">
                  <Check size={32} className="text-[#C8F135]" />
                </div>
                <h1 className="font-barlow font-black text-4xl uppercase mb-4">You&apos;re on the list.</h1>
                <p className="text-white/55 font-inter mb-8">
                  We&apos;ll be in touch within 24 hours to set up your shop on YourBarber.
                </p>
                <Link href="/" className="btn-lime inline-flex px-8 py-3 text-sm">
                  Back to home
                </Link>
              </div>
            ) : (
              <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
                <div className="lg:pt-8">
                  <div className="badge-lime inline-block mb-6">Early access for UK barbershops</div>
                  <h1 className="font-barlow font-black text-[clamp(2.8rem,7vw,5rem)] uppercase leading-[0.92] mb-5">
                    See your shop
                    <br />
                    running <span className="text-[#C8F135]">live.</span>
                  </h1>
                  <p className="text-white/55 font-inter text-lg leading-relaxed mb-8 max-w-xl">
                    We&apos;ll set up your shop, walk through the customer journey, and leave you with a working demo in one focused 20-minute call.
                  </p>

                  <div className="grid gap-4 sm:grid-cols-3 mb-8">
                    {included.map((item, index) => (
                      <div key={item} className="bg-white/[0.04] border border-white/8 rounded-lg p-4">
                        <div className="text-[#C8F135] font-barlow font-black text-xl mb-2">0{index + 1}</div>
                        <p className="text-sm text-white/60 font-inter leading-relaxed">{item}</p>
                      </div>
                    ))}
                  </div>

                  <div className="bg-[#101010] border border-white/8 rounded-xl p-5 max-w-xl">
                    <div className="text-[11px] font-barlow font-bold uppercase tracking-[0.18em] text-white/35 mb-3">
                      Best for
                    </div>
                    <p className="text-white/70 font-inter leading-relaxed">
                      Owners who want to replace patchy bookings, messy client notes, and quiet weeks with a cleaner repeat-customer system.
                    </p>
                  </div>
                </div>

                <div className="bg-[#111] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/30">
                  <div className="flex items-start justify-between gap-4 mb-8">
                    <div>
                      <div className="text-[11px] font-barlow font-bold uppercase tracking-[0.18em] text-white/35 mb-2">
                        Book your slot
                      </div>
                      <h2 className="font-barlow font-black text-3xl uppercase leading-none">Free setup demo</h2>
                    </div>
                    <div className="badge-lime whitespace-nowrap">20 mins</div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    {[
                      { key: 'name', label: 'Your name', placeholder: 'Jake Thompson', type: 'text' },
                      { key: 'shopName', label: 'Shop name', placeholder: 'Ben J Barbers', type: 'text' },
                      { key: 'phone', label: 'Phone number', placeholder: '07700 900 000', type: 'tel' },
                      { key: 'email', label: 'Email address', placeholder: 'jake@benj.co.uk', type: 'email' },
                    ].map(({ key, label, placeholder, type }) => (
                      <div key={key}>
                        <label className="block text-xs font-bold uppercase tracking-widest text-white/40 font-barlow mb-2">
                          {label}
                        </label>
                        <input
                          type={type}
                          required
                          placeholder={placeholder}
                          value={form[key as keyof typeof form]}
                          onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
                          className="w-full bg-[#141414] border border-white/10 rounded-sm px-4 py-3 text-white font-inter placeholder:text-white/20 focus:outline-none focus:border-[#C8F135]/50 transition-colors"
                        />
                      </div>
                    ))}

                    {status === 'error' && (
                      <p className="text-red-400 text-sm font-inter">Something went wrong. Please try again.</p>
                    )}

                    <button
                      type="submit"
                      disabled={status === 'loading'}
                      className="btn-lime w-full py-4 text-base flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                    >
                      {status === 'loading' ? (
                        <>
                          <Loader2 size={16} className="animate-spin" /> Sending...
                        </>
                      ) : (
                        <>
                          Book my demo <ArrowRight size={16} />
                        </>
                      )}
                    </button>

                    <p className="text-white/25 text-xs font-inter text-center">
                      No credit card required. Free during early access.
                    </p>
                  </form>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
