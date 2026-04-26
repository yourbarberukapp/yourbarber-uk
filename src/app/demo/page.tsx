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

      <section className="min-h-screen flex items-center py-32">
        <div className="container mx-auto px-6 lg:px-12 max-w-2xl">

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
                <Link href="/">
                  <button className="btn-lime px-8 py-3 text-sm">
                    Back to home
                  </button>
                </Link>
              </div>
            ) : (
              <>
                <div className="badge-lime inline-block mb-6">Early access — UK barbershops</div>
                <h1 className="font-barlow font-black text-[clamp(2.5rem,6vw,4rem)] uppercase leading-tight mb-4">
                  Book a free<br />
                  <span className="text-[#C8F135]">demo.</span>
                </h1>
                <p className="text-white/55 font-inter mb-10">
                  We&apos;ll set up your shop, show you how it works, and get your first customers in the system — in one 20-minute call.
                </p>

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
                        onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                        className="w-full bg-[#141414] border border-white/10 rounded-sm px-4 py-3 text-white font-inter placeholder:text-white/20 focus:outline-none focus:border-[#C8F135]/50 transition-colors"
                      />
                    </div>
                  ))}

                  {status === 'error' && (
                    <p className="text-red-400 text-sm font-inter">Something went wrong — please try again.</p>
                  )}

                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="btn-lime w-full py-4 text-base flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                  >
                    {status === 'loading' ? (
                      <><Loader2 size={16} className="animate-spin" /> Sending...</>
                    ) : (
                      <>Book my demo <ArrowRight size={16} /></>
                    )}
                  </button>

                  <p className="text-white/25 text-xs font-inter text-center">
                    No credit card required. Free during early access.
                  </p>
                </form>
              </>
            )}
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
