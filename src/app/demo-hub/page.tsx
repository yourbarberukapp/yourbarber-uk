'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Monitor,
  Smartphone,
  Layout,
  Store,
  Tv2,
  ExternalLink,
  CheckCircle2,
  Lock,
  LogOut,
  Scissors,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ArrivalQrDemoButton from '@/components/ArrivalQrDemoButton';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: 'easeOut' as const },
  }),
};

type Step = {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  desc: string;
  icon: typeof Smartphone;
  primaryHref: string;
  primaryLabel: string;
  primaryTarget?: '_blank';
  login: string;
  features: string[];
};

const steps: Step[] = [
  {
    id: 'kiosk',
    number: '01',
    title: 'Customer Scan',
    subtitle: 'A walk-in joins the queue',
    desc: 'A customer walks in, scans the QR, chooses today\'s cut from their phone, and joins the live queue without stopping the barber.',
    icon: Smartphone,
    primaryHref: '/arrive/the-barber-room',
    primaryLabel: 'Open Customer Scan',
    primaryTarget: '_blank',
    login: 'No login required',
    features: ['Scan the wall QR', 'Choose today\'s cut', 'See live queue position', 'Get a free Wallet-pass push when they\'re next'],
  },
  {
    id: 'barber',
    number: '02',
    title: 'Barber Mode',
    subtitle: 'The queue, from the chair',
    desc: 'The barber sees the live queue, opens the next client, and checks what they had last time before they sit down.',
    icon: Monitor,
    primaryHref: '/demo/barber',
    primaryLabel: 'Open Barber Mode',
    primaryTarget: '_blank',
    login: 'No login required',
    features: ['Live queue in the pocket', 'Tap a client to open their history', 'See grades, notes, and photos', 'Know exactly what to repeat today'],
  },
  {
    id: 'passport',
    number: '03',
    title: 'Cut Passport',
    subtitle: 'What the barber sees, up close',
    desc: 'The same client history from Barber Mode, laid out so you can see exactly what a returning client\'s record looks like: photos, grades, notes, and the next-visit recommendation.',
    icon: Layout,
    primaryHref: '/demo/passport',
    primaryLabel: 'Open Cut Passport',
    primaryTarget: '_blank',
    login: 'No login required',
    features: ['Front, back, left, right photos', 'Guard sizes and fade grade', 'Notes from the last visit', 'Recommended return date'],
  },
  {
    id: 'owner',
    number: '04',
    title: 'Owner Dashboard',
    subtitle: 'Run the whole shop',
    desc: 'The owner sees the whole shop in one place: the queue, the team, the regulars, reminders, feedback, and the tools that bring clients back.',
    icon: Store,
    primaryHref: '/login?callbackUrl=%2Fdashboard',
    primaryLabel: 'Open Owner Dashboard',
    login: 'Demo passcode required — sign in to view',
    features: ['Live shop view', 'Customer history', 'Return-visit reminders', 'Feedback and settings'],
  },
];

const previewScreens = [
  {
    id: 'microsite',
    title: 'Shop Microsite Preview',
    subtitle: 'Public shop page',
    desc: 'See how The Barber Room looks to a customer online, with services, opening hours, gallery, and a cleaner first impression than a bare link tree.',
    icon: Store,
    link: '/shop/the-barber-room',
    status: 'No login required',
    cta: 'Open Microsite Preview',
  },
  {
    id: 'tv',
    title: 'TV Queue Screen',
    subtitle: 'Coming soon',
    desc: 'The Live-Board concept: a shop TV showing the queue, wait times, and QR code for people inside the shop and outside the window. Not built yet.',
    icon: Tv2,
    link: null,
    status: 'Not yet available',
    cta: null,
  },
];

export default function DemoHubPage() {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <Navbar />

      <section className="relative pt-40 pb-16 px-6">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute left-1/2 top-24 h-80 w-80 -translate-x-1/2 rounded-full bg-[#C8F135]/8 blur-3xl" />
        </div>

        <div className="container relative mx-auto max-w-4xl">
          <motion.div initial="hidden" animate="visible" custom={0} variants={fadeUp} className="text-center mb-14">
            <span className="badge-lime mb-6 inline-block">The Barber Room — Demo Shop</span>
            <h1 className="font-barlow font-black text-[clamp(2.5rem,8vw,5.5rem)] uppercase leading-[0.9] mb-6">
              Follow the
              <br />
              <span className="text-[#C8F135]">walk-in flow.</span>
            </h1>
            <p className="text-white/48 font-inter text-lg max-w-xl mx-auto leading-relaxed">
              Four steps, in order: a customer joins the queue, the barber opens their history, you see the Cut Passport up close, then the owner's view of the whole shop.
            </p>
          </motion.div>

          {/* Step tracker */}
          <div className="flex items-center justify-center gap-2 mb-4 flex-wrap">
            {steps.map((step, i) => (
              <button
                key={step.id}
                onClick={() => setActiveStep(i)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-sm border text-xs font-barlow font-bold uppercase tracking-wide transition-colors ${
                  activeStep === i
                    ? 'bg-[#C8F135] border-[#C8F135] text-[#0A0A0A]'
                    : 'bg-white/[0.03] border-white/10 text-white/50 hover:border-white/25 hover:text-white/80'
                }`}
              >
                <span className={activeStep === i ? 'text-[#0A0A0A]/60' : 'text-white/25'}>{step.number}</span>
                {step.title}
              </button>
            ))}
          </div>

          <div className="flex justify-center mb-12">
            <button
              onClick={() => signOut({ callbackUrl: '/demo-hub' })}
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/30 hover:text-[#C8F135] transition-colors"
            >
              <LogOut size={12} /> Switching views? Sign out first
            </button>
          </div>

          {/* Active step panel */}
          {steps.map((step, i) => {
            if (i !== activeStep) return null;
            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="bg-[#0f0f0f] border border-white/10 rounded-xl overflow-hidden shadow-2xl"
              >
                <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-0">
                  <div className="p-8 md:p-10 md:border-r border-white/8 md:w-96">
                    <div className="w-12 h-12 rounded-sm bg-[#C8F135]/10 flex items-center justify-center mb-6">
                      <step.icon size={24} className="text-[#C8F135]" />
                    </div>
                    <div className="mb-6">
                      <div className="font-barlow font-bold text-xs uppercase tracking-widest text-[#C8F135]/60 mb-1">
                        Step {step.number} of {steps.length} — {step.subtitle}
                      </div>
                      <h2 className="font-barlow font-black text-3xl uppercase tracking-tight">{step.title}</h2>
                    </div>
                    <p className="text-white/56 text-sm font-inter leading-relaxed mb-8">{step.desc}</p>

                    <ul className="space-y-3 mb-8">
                      {step.features.map(feature => (
                        <li key={feature} className="flex items-start gap-3 text-xs font-inter text-white/72">
                          <CheckCircle2 size={14} className="text-[#C8F135] flex-shrink-0 mt-0.5" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <div className="bg-black/40 rounded-lg p-4 mb-6 border border-white/5">
                      <div className="flex items-center gap-2 mb-2">
                        <Lock size={12} className="text-white/30" />
                        <span className="text-[10px] font-barlow font-bold uppercase tracking-widest text-white/30">Access</span>
                      </div>
                      <p className="text-sm font-mono text-white/80">{step.login}</p>
                    </div>

                    <Link
                      href={step.primaryHref}
                      target={step.primaryTarget}
                      rel={step.primaryTarget ? 'noopener noreferrer' : undefined}
                      className="w-full py-4 bg-[#C8F135] hover:bg-[#d4f84d] text-[#0A0A0A] font-barlow font-black uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-2 rounded-sm mb-3"
                    >
                      {step.primaryLabel}
                      <ExternalLink size={16} />
                    </Link>

                    {step.id === 'kiosk' && (
                      <div className="opacity-70 hover:opacity-100 transition-opacity">
                        <ArrivalQrDemoButton shopSlug="the-barber-room" shopName="The Barber Room" className="w-full py-3 text-xs !bg-white/10 !text-white hover:!bg-white/15" />
                      </div>
                    )}

                    {i < steps.length - 1 && (
                      <button
                        onClick={() => setActiveStep(i + 1)}
                        className="w-full mt-3 py-3 text-xs font-barlow font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors flex items-center justify-center gap-2"
                      >
                        Next: {steps[i + 1].title} <ArrowRight size={14} />
                      </button>
                    )}
                  </div>

                  {/* Visual placeholder — deliberately not an iframe. Embedding the real
                      login page would invite typing a real passcode inside a frame on a
                      marketing page, which is the shape of a clickjacking/phishing risk
                      even same-origin. Click through instead via the button above. */}
                  <div className="bg-black min-h-[420px] md:min-h-[520px] flex flex-col items-center justify-center gap-4 p-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-[#C8F135]/10 flex items-center justify-center">
                      <step.icon size={28} className="text-[#C8F135]/60" />
                    </div>
                    <p className="text-white/25 text-xs font-barlow font-bold uppercase tracking-widest max-w-xs">
                      Opens in a new tab so you keep your place here
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            variants={fadeUp}
            className="mb-16"
          >
            <div className="text-center mb-10">
              <span className="badge-lime mb-4 inline-block">More to preview</span>
              <h2 className="font-barlow font-black text-[clamp(2rem,5vw,3.25rem)] uppercase leading-[0.92] mb-4">
                See the public side
                <br />
                <span className="text-[#C8F135]">of the shop.</span>
              </h2>
              <p className="text-white/48 font-inter text-base max-w-2xl mx-auto leading-relaxed">
                Once the queue and Cut Passport make sense, this shows how YourBarber helps the shop look sharper to customers as well.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {previewScreens.map((screen, i) => (
                <motion.div
                  key={screen.id}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: '-40px' }}
                  custom={i + 1}
                  variants={fadeUp}
                  className={`relative bg-[#0f0f0f] border border-white/10 rounded-xl overflow-hidden shadow-2xl p-8 ${screen.link ? 'hover:border-[#C8F135]/40 transition-all hover:-translate-y-1' : 'opacity-60'}`}
                >
                  <div className="w-12 h-12 rounded-sm bg-[#C8F135]/10 flex items-center justify-center mb-6">
                    <screen.icon size={24} className="text-[#C8F135]" />
                  </div>

                  <div className="mb-6">
                    <h3 className="font-barlow font-black text-2xl uppercase tracking-tight mb-1">{screen.title}</h3>
                    <p className="font-barlow font-bold text-xs uppercase tracking-widest text-[#C8F135]/60">{screen.subtitle}</p>
                  </div>

                  <p className="text-white/52 text-sm font-inter leading-relaxed mb-8">{screen.desc}</p>

                  <div className="bg-black/40 rounded-lg p-4 mb-8 border border-white/5">
                    <div className="flex items-center gap-2 mb-2">
                      <Lock size={12} className="text-white/30" />
                      <span className="text-[10px] font-barlow font-bold uppercase tracking-widest text-white/30">
                        Preview access
                      </span>
                    </div>
                    <p className="text-sm font-mono text-white/80">{screen.status}</p>
                  </div>

                  {screen.link ? (
                    <Link
                      href={screen.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-4 bg-white/5 hover:bg-[#C8F135] hover:text-[#0A0A0A] text-white font-barlow font-bold uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-2 rounded-sm border border-white/10 hover:border-transparent"
                    >
                      {screen.cta}
                      <ExternalLink size={16} />
                    </Link>
                  ) : (
                    <div className="w-full py-4 bg-white/[0.02] text-white/25 font-barlow font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2 rounded-sm border border-white/5">
                      Not built yet
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="bg-[#141414] border border-white/10 rounded-2xl p-12 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
              <Scissors size={200} className="text-[#C8F135]" />
            </div>
            <div className="max-w-2xl relative z-10">
              <h2 className="font-barlow font-black text-4xl uppercase mb-6 leading-tight">
                Built around the
                <br />
                <span className="text-[#C8F135]">full shop flow.</span>
              </h2>
              <p className="text-white/52 font-inter leading-relaxed mb-8">
                YourBarber starts on the wall, moves through the live queue, helps the barber remember the cut, and gives the owner the full picture after the client walks out.
              </p>
              <div className="flex flex-wrap gap-8">
                <div>
                  <div className="text-[#C8F135] font-barlow font-black text-3xl mb-1">0%</div>
                  <div className="text-xs font-barlow font-bold uppercase tracking-widest text-white/30">Commission</div>
                </div>
                <div>
                  <div className="text-[#C8F135] font-barlow font-black text-3xl mb-1">&pound;20</div>
                  <div className="text-xs font-barlow font-bold uppercase tracking-widest text-white/30">Per month</div>
                </div>
                <div>
                  <div className="text-[#C8F135] font-barlow font-black text-3xl mb-1">&lt;30s</div>
                  <div className="text-xs font-barlow font-bold uppercase tracking-widest text-white/30">After each cut</div>
                </div>
              </div>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 mt-8 bg-[#C8F135] text-[#0A0A0A] px-8 py-4 rounded-sm font-barlow font-black uppercase tracking-widest text-sm hover:bg-white transition-colors"
              >
                Set up my shop <ArrowRight size={16} />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
