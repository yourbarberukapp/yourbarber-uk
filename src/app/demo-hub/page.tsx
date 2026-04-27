'use client';

import { motion } from 'framer-motion';
import {
  Monitor,
  Smartphone,
  Layout,
  ExternalLink,
  Zap,
  CheckCircle2,
  Lock,
  LogOut,
} from 'lucide-react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: 'easeOut' as const },
  }),
};

const screens = [
  {
    id: 'kiosk',
    title: 'Customer Kiosk',
    subtitle: 'The Arrival Screen',
    desc: 'The public page customers scan on their own phone when they walk in. Zero friction, zero login, instant waitlist addition.',
    icon: Smartphone,
    link: '/arrive/benj-barbers',
    login: 'No login required',
    features: ['Phone number lookup', 'Style preference picker', 'Queue position tracker', 'GDPR SMS opt-in'],
  },
  {
    id: 'barber',
    title: 'Barber Mode',
    subtitle: 'Staff Queue View',
    desc: 'The mobile-first view for barbers on the shop floor. Designed to be added to the phone home screen as a PWA.',
    icon: Monitor,
    link: '/login?callbackUrl=%2Fbarber',
    login: 'jake@benjbarbers.com / barber123',
    features: ['Personal daily queue', 'Quick client lookup', 'One-tap cut recording', 'Photo history access'],
  },
  {
    id: 'owner',
    title: 'Owner Dashboard',
    subtitle: 'Shop Management',
    desc: 'The full-power control centre. Manage the team, view analytics, download QR materials, and control shop settings.',
    icon: Layout,
    link: '/login?callbackUrl=%2Fdashboard',
    login: 'owner@benjbarbers.com / owner123',
    features: ['Team management', 'Global visit history', 'Bulk SMS marketing', 'Financial analytics'],
  },
];

export default function DemoHubPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <Navbar />

      <section className="relative pt-40 pb-24 px-6">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute left-1/2 top-24 h-80 w-80 -translate-x-1/2 rounded-full bg-[#C8F135]/8 blur-3xl" />
          <div className="absolute right-0 top-1/3 h-64 w-64 rounded-full bg-white/[0.03] blur-3xl" />
        </div>

        <div className="container relative mx-auto max-w-6xl">
          <motion.div initial="hidden" animate="visible" custom={0} variants={fadeUp} className="text-center mb-20">
            <span className="badge-lime mb-6 inline-block">Product Experience</span>
            <h1 className="font-barlow font-black text-[clamp(2.5rem,8vw,5.5rem)] uppercase leading-[0.9] mb-8">
              The <span className="text-[#C8F135]">3-Screen</span>
              <br />
              System.
            </h1>
            <p className="text-white/45 font-inter text-lg max-w-2xl mx-auto mb-12 leading-relaxed">
              YourBarber isn&apos;t just one app. It&apos;s an ecosystem designed for the specific needs of the Customer, the Barber, and the Owner.
            </p>

            <div className="grid gap-4 md:grid-cols-3 max-w-4xl mx-auto mb-10">
              <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
                <div className="text-[11px] font-barlow font-bold uppercase tracking-[0.18em] text-white/35 mb-2">Customer</div>
                <p className="text-sm text-white/60 font-inter leading-relaxed">Walk in, scan, join the queue, and revisit cut history without staff friction.</p>
              </div>
              <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
                <div className="text-[11px] font-barlow font-bold uppercase tracking-[0.18em] text-white/35 mb-2">Barber</div>
                <p className="text-sm text-white/60 font-inter leading-relaxed">See the live queue, open client history, and record cuts quickly from the shop floor.</p>
              </div>
              <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
                <div className="text-[11px] font-barlow font-bold uppercase tracking-[0.18em] text-white/35 mb-2">Owner</div>
                <p className="text-sm text-white/60 font-inter leading-relaxed">Control the team, customer retention, and settings from one sharper dashboard.</p>
              </div>
            </div>

            <div className="flex justify-center items-center gap-4 p-4 bg-white/[0.03] border border-white/5 rounded-full max-w-md mx-auto mb-8">
              <span className="text-xs font-barlow font-bold uppercase tracking-widest text-white/40">Switching personas?</span>
              <button
                onClick={() => signOut({ callbackUrl: '/demo-hub' })}
                className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#C8F135] hover:text-white transition-colors"
              >
                <LogOut size={14} /> Sign Out First
              </button>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-24">
            {screens.map((screen, i) => (
              <motion.div
                key={screen.id}
                initial="hidden"
                animate="visible"
                custom={i + 1}
                variants={fadeUp}
                className="group relative bg-[#0f0f0f] border border-white/10 rounded-xl overflow-hidden hover:border-[#C8F135]/40 transition-all shadow-2xl hover:-translate-y-1"
              >
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#C8F135]/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="p-8">
                  <div className="w-12 h-12 rounded-sm bg-[#C8F135]/10 flex items-center justify-center mb-6 group-hover:bg-[#C8F135]/20 transition-colors">
                    <screen.icon size={24} className="text-[#C8F135]" />
                  </div>

                  <div className="mb-6">
                    <h3 className="font-barlow font-black text-2xl uppercase tracking-tight mb-1">{screen.title}</h3>
                    <p className="font-barlow font-bold text-xs uppercase tracking-widest text-[#C8F135]/60">{screen.subtitle}</p>
                  </div>

                  <p className="text-white/50 text-sm font-inter leading-relaxed mb-8 h-20">{screen.desc}</p>

                  <ul className="space-y-3 mb-10 border-t border-white/5 pt-8">
                    {screen.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-3 text-xs font-inter text-white/70">
                        <CheckCircle2 size={14} className="text-[#C8F135]" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <div className="bg-black/40 rounded-lg p-4 mb-8 border border-white/5">
                    <div className="flex items-center gap-2 mb-2">
                      <Lock size={12} className="text-white/30" />
                      <span className="text-[10px] font-barlow font-bold uppercase tracking-widest text-white/30">
                        {screen.login === 'No login required' ? 'Access' : 'Demo Credentials'}
                      </span>
                    </div>
                    <p className="text-sm font-mono text-white/80">{screen.login}</p>
                  </div>

                  <Link
                    href={screen.link}
                    className="w-full py-4 bg-white/5 hover:bg-[#C8F135] hover:text-[#0A0A0A] text-white font-barlow font-bold uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-2 rounded-sm border border-white/10 hover:border-transparent"
                  >
                    {screen.login === 'No login required' ? 'Open Live Screen' : 'Launch Demo'}
                    <ExternalLink size={16} />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="bg-[#141414] border border-white/10 rounded-2xl p-12 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
              <Zap size={200} className="text-[#C8F135]" />
            </div>
            <div className="max-w-2xl relative z-10">
              <h2 className="font-barlow font-black text-4xl uppercase mb-6 italic leading-tight">
                Designed to be <span className="text-[#C8F135]">Invisible</span>.
              </h2>
              <p className="text-white/50 font-inter leading-relaxed mb-8">
                The best technology doesn&apos;t get in the way of the haircut. YourBarber lives on the wall, in the pocket, and on the desk. It creates a seamless flow that helps you focus on the craft, not the computer.
              </p>
              <div className="flex flex-wrap gap-8">
                <div>
                  <div className="text-[#C8F135] font-barlow font-black text-3xl mb-1">0%</div>
                  <div className="text-xs font-barlow font-bold uppercase tracking-widest text-white/30">Commission</div>
                </div>
                <div>
                  <div className="text-[#C8F135] font-barlow font-black text-3xl mb-1">100%</div>
                  <div className="text-xs font-barlow font-bold uppercase tracking-widest text-white/30">Data Ownership</div>
                </div>
                <div>
                  <div className="text-[#C8F135] font-barlow font-black text-3xl mb-1">&lt;30s</div>
                  <div className="text-xs font-barlow font-bold uppercase tracking-widest text-white/30">Admin Per Cut</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
