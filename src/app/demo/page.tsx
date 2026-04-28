'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Check,
  Loader2,
  Smartphone,
  Monitor,
  Layout,
  ExternalLink,
  Lock,
  ArrowLeft,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { signOut } from 'next-auth/react';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: 'easeOut' as const },
  }),
};

const screens = [
  {
    id: 'customer',
    icon: Smartphone,
    who: 'CUSTOMER',
    title: 'Join the Queue',
    desc: 'Walk in, scan the wall QR, add your phone number, and take your place in line. This is the fair-play queue your customers see.',
    link: '/arrive/ben-j-barbers',
    creds: null,
    image: '/demo-kiosk-luke.png',
    imageAlt: 'Wall check-in screen in a barbershop with a barber cutting hair in the background',
    cta: 'Try the Wall Scan',
    accent: true,
  },
  {
    id: 'barber',
    icon: Monitor,
    who: 'BARBER',
    title: 'Remember the Fade',
    desc: "Open the next client, check their last cut, and record today's photos in under 30 seconds. This is the Cut Passport in the chair.",
    link: '/login?callbackUrl=%2Fbarber',
    creds: 'jake@benjbarbers.com\nbarber123',
    image: '/demo-barber.png',
    imageAlt: 'Barber queue view on a phone inside a barbershop',
    cta: 'Open Barber View',
    accent: false,
  },
  {
    id: 'owner',
    icon: Layout,
    who: 'OWNER',
    title: 'Run the Shop',
    desc: 'See the queue, the team, customer history, reminders, feedback, bookings, and settings from one owner dashboard.',
    link: '/login?callbackUrl=%2Fdashboard',
    creds: 'owner@benjbarbers.com\nowner123',
    image: '/demo-dashboard.png',
    imageAlt: 'Owner dashboard on a laptop in a barbershop',
    cta: 'Open Owner Dashboard',
    accent: false,
  },
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

      <section className="relative pt-36 pb-16 px-6">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute left-1/2 top-20 h-80 w-80 -translate-x-1/2 rounded-full bg-[#C8F135]/8 blur-3xl" />
        </div>

        <div className="container relative mx-auto max-w-6xl">
          <motion.div initial="hidden" animate="visible" custom={0} variants={fadeUp}>
            <Link href="/" className="inline-flex items-center gap-2 text-white/35 hover:text-white text-sm font-inter mb-10 transition-colors">
              <ArrowLeft size={13} /> Back to home
            </Link>
          </motion.div>

          <motion.div initial="hidden" animate="visible" custom={1} variants={fadeUp} className="text-center mb-6">
            <span className="badge-lime mb-5 inline-block">Ben J Barbers - Live Demo Shop</span>
            <h1 className="font-barlow font-black text-[clamp(2.5rem,8vw,5rem)] uppercase leading-[0.9] mb-5">
              Walk through
              <br />
              the shop flow.
              <br />
              <span className="text-[#C8F135]">No tech talk.</span>
            </h1>
            <p className="text-white/45 font-inter text-base max-w-xl mx-auto mb-6 leading-relaxed">
              Try the three moments that matter: a customer joins the queue, a barber opens the Cut Passport, and the owner keeps the shop moving.
            </p>
          </motion.div>

          <motion.div initial="hidden" animate="visible" custom={2} variants={fadeUp} className="flex justify-center mb-14">
            <div className="flex items-center gap-4 bg-white/[0.03] border border-white/6 rounded-full px-5 py-2.5">
              <span className="text-[11px] font-barlow font-bold uppercase tracking-widest text-white/30">Switching between views?</span>
              <button
                onClick={() => signOut({ callbackUrl: '/demo' })}
                className="text-[11px] font-barlow font-bold uppercase tracking-widest text-[#C8F135] hover:text-white transition-colors"
              >
                Sign out first
              </button>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-24">
            {screens.map((s, i) => (
              <motion.div
                key={s.id}
                initial="hidden"
                animate="visible"
                custom={i + 3}
                variants={fadeUp}
                className={`group relative rounded-xl border overflow-hidden flex flex-col transition-all hover:-translate-y-1 ${
                  s.accent
                    ? 'bg-[#C8F135]/5 border-[#C8F135]/30 hover:border-[#C8F135]/55 shadow-[0_0_40px_rgba(200,241,53,0.05)]'
                    : 'bg-[#0f0f0f] border-white/10 hover:border-white/25'
                }`}
              >
                {s.accent && (
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#C8F135]/60 to-transparent" />
                )}

                <div className="relative aspect-[16/10] overflow-hidden border-b border-white/8 bg-black">
                  <Image
                    src={s.image}
                    alt={s.imageAlt}
                    fill
                    sizes="(min-width: 1024px) 33vw, 100vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-transparent to-transparent" />
                </div>

                <div className="p-8 flex-1">
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`w-10 h-10 rounded-sm flex items-center justify-center flex-shrink-0 ${s.accent ? 'bg-[#C8F135]/15' : 'bg-white/6'}`}>
                      <s.icon size={20} className={s.accent ? 'text-[#C8F135]' : 'text-white/50'} />
                    </div>
                    <span className="text-[10px] font-barlow font-bold uppercase tracking-[0.2em] text-white/35">{s.who}</span>
                  </div>

                  <h3 className="font-barlow font-black text-2xl uppercase leading-tight mb-3">{s.title}</h3>
                  <p className="text-white/50 text-sm font-inter leading-relaxed">{s.desc}</p>

                  {s.creds ? (
                    <div className="mt-6 bg-black/40 rounded-lg p-4 border border-white/6">
                      <div className="flex items-center gap-2 mb-2">
                        <Lock size={11} className="text-white/25" />
                        <span className="text-[10px] font-barlow font-bold uppercase tracking-widest text-white/25">Demo sign-in</span>
                      </div>
                      <pre className="text-sm font-mono text-white/70 whitespace-pre-wrap leading-relaxed">{s.creds}</pre>
                    </div>
                  ) : (
                    <div className="mt-6 bg-black/30 rounded-lg p-3 border border-white/6">
                      <span className="text-[10px] font-barlow font-bold uppercase tracking-widest text-[#C8F135]/60">No login required</span>
                    </div>
                  )}
                </div>

                <div className="p-6 pt-0">
                  <Link
                    href={s.link}
                    className={`w-full py-4 rounded-sm font-barlow font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all ${
                      s.accent
                        ? 'bg-[#C8F135] text-[#0A0A0A] hover:bg-white'
                        : 'bg-white/5 border border-white/10 text-white hover:bg-[#C8F135] hover:text-[#0A0A0A] hover:border-transparent'
                    }`}
                  >
                    {s.cta} <ExternalLink size={14} />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="border-t border-white/6 pt-20">
            {status === 'done' ? (
              <div className="text-center py-12 max-w-md mx-auto">
                <div className="w-14 h-14 rounded-full bg-[#C8F135]/10 border border-[#C8F135]/25 flex items-center justify-center mx-auto mb-6">
                  <Check size={28} className="text-[#C8F135]" />
                </div>
                <h2 className="font-barlow font-black text-3xl uppercase mb-3">You&apos;re on the list.</h2>
                <p className="text-white/45 font-inter mb-8">We&apos;ll be in touch within 24 hours to get your shop set up on YourBarber.</p>
                <Link href="/" className="btn-lime inline-flex px-8 py-3 text-sm">Back to home</Link>
              </div>
            ) : (
              <div className="grid gap-10 lg:grid-cols-2 lg:items-start max-w-5xl mx-auto">
                <div>
                  <span className="badge-lime mb-4 inline-block">Want your shop set up?</span>
                  <h2 className="font-barlow font-black text-[clamp(2rem,5vw,3rem)] uppercase leading-tight mb-5">
                    Book a free
                    <br />
                    <span className="text-[#C8F135]">20-minute call.</span>
                  </h2>
                  <p className="text-white/50 font-inter leading-relaxed mb-8">
                    We set up your shop profile, walk through the queue and Cut Passport with you, and leave you with a working shop demo. No commitment.
                  </p>
                  <div className="space-y-4">
                    {[
                      'Your shop profile created for you',
                      'Wall-scan queue configured',
                      'Help adding your first regulars and their last cuts',
                    ].map((item, idx) => (
                      <div key={item} className="flex items-start gap-4 bg-white/[0.03] border border-white/6 rounded-lg p-4">
                        <div className="text-[#C8F135] font-barlow font-black text-lg leading-none w-6 flex-shrink-0">0{idx + 1}</div>
                        <p className="text-sm text-white/55 font-inter leading-relaxed">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[#111] border border-white/10 rounded-2xl p-7 shadow-2xl shadow-black/30">
                  <div className="flex items-start justify-between gap-4 mb-7">
                    <div>
                      <div className="text-[10px] font-barlow font-bold uppercase tracking-[0.18em] text-white/30 mb-1.5">Free setup call</div>
                      <h3 className="font-barlow font-black text-2xl uppercase">Get started</h3>
                    </div>
                    <span className="badge-lime whitespace-nowrap">20 mins</span>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {[
                      { key: 'name', label: 'Your name', placeholder: 'Ben Thompson', type: 'text' },
                      { key: 'shopName', label: 'Shop name', placeholder: 'Ben J Barbers', type: 'text' },
                      { key: 'phone', label: 'Your mobile', placeholder: '07700 900 000', type: 'tel' },
                      { key: 'email', label: 'Email address', placeholder: 'ben@benjbarbers.co.uk', type: 'email' },
                    ].map(({ key, label, placeholder, type }) => (
                      <div key={key}>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-white/35 font-barlow mb-1.5">{label}</label>
                        <input
                          type={type}
                          required
                          placeholder={placeholder}
                          value={form[key as keyof typeof form]}
                          onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                          className="w-full bg-[#141414] border border-white/10 rounded-sm px-4 py-3 text-white font-inter text-sm placeholder:text-white/20 focus:outline-none focus:border-[#C8F135]/50 transition-colors"
                        />
                      </div>
                    ))}

                    {status === 'error' && (
                      <p className="text-red-400 text-sm font-inter">Something went wrong. Please try again.</p>
                    )}

                    <button
                      type="submit"
                      disabled={status === 'loading'}
                      className="btn-lime w-full py-3.5 text-sm flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                    >
                      {status === 'loading' ? (
                        <><Loader2 size={15} className="animate-spin" /> Sending...</>
                      ) : (
                        <>Book my setup call <ArrowRight size={15} /></>
                      )}
                    </button>

                    <p className="text-white/20 text-xs font-inter text-center">No credit card. No commitment. Free during early access.</p>
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
