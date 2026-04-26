'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Scissors, Phone, ShieldCheck, User, ChevronRight, Loader2, ArrowLeft } from 'lucide-react';
import { Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shopSlug = searchParams.get('shop');
  const redirect = searchParams.get('redirect') || '/customer';

  const [step, setStep] = useState<'phone' | 'otp' | 'name'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const otpInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step === 'phone') phoneInputRef.current?.focus();
    if (step === 'otp') otpInputRef.current?.focus();
    if (step === 'name') nameInputRef.current?.focus();
  }, [step]);

  async function handleRequestOtp(e?: React.FormEvent) {
    e?.preventDefault();
    if (phone.length < 7) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/customer/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, shopSlug }),
      });
      const data = await res.json();
      if (res.ok) {
        setStep('otp');
      } else {
        setError(data.error || 'Failed to send code');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e?: React.FormEvent) {
    e?.preventDefault();
    if (code.length !== 5) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/customer/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, phone, shopSlug }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.isNew) {
          setStep('name');
        } else {
          router.push(redirect);
        }
      } else {
        setError(data.error || 'Invalid code');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveName(e?: React.FormEvent) {
    e?.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError('');
    try {
      // API to update customer name (I'll need to create this or use existing)
      const res = await fetch('/api/customer/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        router.push(redirect);
      } else {
        setError('Failed to save name');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        
        {/* Logo/Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#C8F135]/10 border border-[#C8F135]/20 mb-6">
            <Scissors size={28} className="text-[#C8F135]" />
          </div>
          <h1 className="font-barlow font-black text-4xl uppercase tracking-tighter">
            Your<span className="text-[#C8F135]">Barber</span>
          </h1>
          <p className="text-white/40 text-sm font-inter mt-2 uppercase tracking-widest font-bold">
            {step === 'phone' && 'Welcome Back'}
            {step === 'otp' && 'Verify Identity'}
            {step === 'name' && 'One Last Step'}
          </p>
        </div>

        <div className="bg-[#111] border border-white/5 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          <AnimatePresence mode="wait">
            {step === 'phone' && (
              <motion.form
                key="phone"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleRequestOtp}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <label className="block text-[10px] font-barlow font-black uppercase tracking-[0.2em] text-white/30 ml-1">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                    <input
                      ref={phoneInputRef}
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        setError('');
                        setPhone(e.target.value);
                      }}
                      placeholder="07700 900 000"
                      className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white text-lg font-inter focus:outline-none focus:border-[#C8F135]/50 focus:ring-1 focus:ring-[#C8F135]/20 transition-all placeholder:text-white/10"
                    />
                  </div>
                </div>

                {error && <p className="text-red-400 text-xs text-center font-inter">{error}</p>}

                <button
                  type="submit"
                  disabled={phone.length < 7 || loading}
                  className="w-full bg-[#C8F135] text-black py-4 rounded-2xl font-barlow font-black text-lg uppercase tracking-tight shadow-[0_10px_30px_rgba(200,241,53,0.15)] hover:bg-[#b5da2d] transition-all disabled:opacity-30 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : <>Next <ChevronRight size={20} /></>}
                </button>
              </motion.form>
            )}

            {step === 'otp' && (
              <motion.form
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleVerifyOtp}
                className="space-y-6"
              >
                <button 
                  type="button"
                  onClick={() => setStep('phone')}
                  className="flex items-center gap-2 text-white/30 hover:text-white transition-colors text-xs font-barlow font-bold uppercase tracking-widest"
                >
                  <ArrowLeft size={14} /> Back
                </button>

                <div className="space-y-2">
                  <label className="block text-[10px] font-barlow font-black uppercase tracking-[0.2em] text-white/30 ml-1">
                    Enter 5-Digit Code
                  </label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                    <input
                      ref={otpInputRef}
                      type="text"
                      inputMode="numeric"
                      value={code}
                      onChange={(e) => {
                        setError('');
                        setCode(e.target.value.replace(/\D/g, '').slice(0, 5));
                      }}
                      placeholder="1 2 3 4 5"
                      className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white text-2xl font-mono tracking-[0.5em] focus:outline-none focus:border-[#C8F135]/50 focus:ring-1 focus:ring-[#C8F135]/20 transition-all placeholder:text-white/10"
                    />
                  </div>
                  <p className="text-[10px] text-white/30 text-center font-inter mt-2">
                    Code sent to {phone}
                  </p>
                </div>

                {error && <p className="text-red-400 text-xs text-center font-inter">{error}</p>}

                <button
                  type="submit"
                  disabled={code.length !== 5 || loading}
                  className="w-full bg-[#C8F135] text-black py-4 rounded-2xl font-barlow font-black text-lg uppercase tracking-tight shadow-[0_10px_30px_rgba(200,241,53,0.15)] hover:bg-[#b5da2d] transition-all disabled:opacity-30 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : <>Verify Code <ChevronRight size={20} /></>}
                </button>

                <button 
                  type="button"
                  onClick={handleRequestOtp}
                  className="w-full text-white/20 hover:text-white/40 text-[10px] font-barlow font-bold uppercase tracking-widest transition-colors"
                >
                  Didn't get a code? Resend
                </button>
              </motion.form>
            )}

            {step === 'name' && (
              <motion.form
                key="name"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleSaveName}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <label className="block text-[10px] font-barlow font-black uppercase tracking-[0.2em] text-white/30 ml-1">
                    What's your name?
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                    <input
                      ref={nameInputRef}
                      type="text"
                      value={name}
                      onChange={(e) => {
                        setError('');
                        setName(e.target.value);
                      }}
                      placeholder="John Doe"
                      className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white text-lg font-inter focus:outline-none focus:border-[#C8F135]/50 focus:ring-1 focus:ring-[#C8F135]/20 transition-all placeholder:text-white/10"
                    />
                  </div>
                  <p className="text-[10px] text-white/30 text-center font-inter mt-2">
                    We'll use this for your appointments.
                  </p>
                </div>

                {error && <p className="text-red-400 text-xs text-center font-inter">{error}</p>}

                <button
                  type="submit"
                  disabled={!name.trim() || loading}
                  className="w-full bg-[#C8F135] text-black py-4 rounded-2xl font-barlow font-black text-lg uppercase tracking-tight shadow-[0_10px_30px_rgba(200,241,53,0.15)] hover:bg-[#b5da2d] transition-all disabled:opacity-30 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : <>Complete Profile <ChevronRight size={20} /></>}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        <p className="mt-12 text-center text-white/10 text-[10px] font-barlow font-bold uppercase tracking-[0.3em]">
          Powered by YourBarber Platform
        </p>
      </div>
    </div>
  );
}

export default function CustomerLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
