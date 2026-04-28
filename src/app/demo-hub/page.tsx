'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
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
    title: 'Customer Scan',
    subtitle: 'Step 1 - Join the queue',
    desc: 'A customer walks in, scans the QR, chooses today\'s cut from their phone, and joins the live queue without stopping the barber.',
    icon: Smartphone,
    link: '/arrive/benj-barbers',
    login: 'No login required',
    image: '/demo-kiosk-luke.png',
    imageAlt: 'Wall check-in screen in a barbershop with a barber cutting hair in the background',
    features: ['Scan the wall QR', 'Choose today\'s cut', 'See live queue position', 'Get a text when they are next'],
  },
  {
    id: 'barber',
    title: 'Barber Mode',
    subtitle: 'Steps 2 to 4 - Queue to Cut Passport',
    desc: 'The barber sees the live queue, opens the next client, checks what they had last time, and records the new cut before they leave the chair.',
    icon: Monitor,
    link: '/login?callbackUrl=%2Fbarber',
    login: 'jake@benjbarbers.com / barber123',
    image: '/demo-barber.png',
    imageAlt: 'Barber mode showing the live queue and client cut history on a phone in a barbershop',
    features: ['Live queue in the pocket', 'Mark in chair and done', 'Open the Cut Passport', 'Save grades, notes, and photos'],
  },
  {
    id: 'owner',
    title: 'Owner Dashboard',
    subtitle: 'Step 5 - Run the shop',
    desc: 'The owner sees the whole shop in one place: the queue, the team, the regulars, reminders, feedback, and the tools that bring clients back.',
    icon: Layout,
    link: '/login?callbackUrl=%2Fdashboard',
    login: 'owner@benjbarbers.com / owner123',
    image: '/demo-dashboard.png',
    imageAlt: 'Owner dashboard on a laptop in a barbershop',
    features: ['Live shop view', 'Customer history', 'Return-visit reminders', 'Feedback and settings'],
  },
];

const previewScreens = [
  {
    id: 'microsite',
    title: 'Shop Microsite Preview',
    subtitle: 'Public shop page',
    desc: 'See how Ben J Barbers looks to a customer online, with services, opening hours, gallery, and a cleaner first impression than a bare link tree.',
    icon: Store,
    link: '/shop/benj-barbers',
    status: 'No login required',
    image: '/showcase-team.png',
    imageAlt: 'Public-facing shop microsite preview for Ben J Barbers',
    cta: 'Open Microsite Preview',
  },
  {
    id: 'tv',
    title: 'TV Queue Screen Preview',
    subtitle: 'Coming soon',
    desc: 'Preview the Live-Board concept: a shop TV showing the queue, wait times, QR code, and shop presence for people inside the shop and outside the window.',
    icon: Tv2,
    link: '/#live-board',
    status: 'Preview on homepage',
    image: '/hero-ipad.png',
    imageAlt: 'YourBarber preview inside a barbershop representing the TV queue screen concept',
    cta: 'View TV Preview',
  },
];

export default function DemoHubPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <Navbar />

      <section className="relative pt-40 pb-24 px-6">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute left-1/2 top-24 h-80 w-80 -translate-x-1/2 rounded-full bg-[#C8F135]/8 blur-3xl" />
        </div>

        <div className="container relative mx-auto max-w-6xl">
          <motion.div initial="hidden" animate="visible" custom={0} variants={fadeUp} className="text-center mb-20">
            <span className="badge-lime mb-6 inline-block">Ben J Barbers - Demo Shop</span>
            <h1 className="font-barlow font-black text-[clamp(2.5rem,8vw,5.5rem)] uppercase leading-[0.9] mb-8">
              Follow the
              <br />
              <span className="text-[#C8F135]">walk-in flow.</span>
            </h1>
            <p className="text-white/48 font-inter text-lg max-w-2xl mx-auto mb-12 leading-relaxed">
              Start with the customer scan, follow the live queue into Barber Mode, open the Cut Passport, and finish in the owner dashboard. This demo is built to show how the shop runs from the front door to the next visit.
            </p>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5 max-w-6xl mx-auto mb-10">
              {[
                { title: 'Customer Scan', body: 'A walk-in joins from their own phone with no app to download.' },
                { title: 'Live Queue', body: 'The queue updates instantly so everyone knows where they stand.' },
                { title: 'Barber Mode', body: 'The barber sees who is next and what they want before they sit down.' },
                { title: 'Cut Passport', body: 'Last-cut photos, notes, and grades stay with the client record.' },
                { title: 'Owner Dashboard', body: 'The owner sees reminders, feedback, customers, and shop activity.' },
              ].map(item => (
                <div key={item.title} className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
                  <div className="text-[11px] font-barlow font-bold uppercase tracking-[0.18em] text-white/35 mb-2">{item.title}</div>
                  <p className="text-sm text-white/62 font-inter leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-center items-center gap-4 p-4 bg-white/[0.03] border border-white/5 rounded-full max-w-md mx-auto mb-8">
              <span className="text-xs font-barlow font-bold uppercase tracking-widest text-white/40">Switching views?</span>
              <button
                onClick={() => signOut({ callbackUrl: '/demo-hub' })}
                className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#C8F135] hover:text-white transition-colors"
              >
                <LogOut size={14} /> Sign out first
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
                <div className="relative aspect-[16/10] overflow-hidden border-b border-white/8 bg-black">
                  <Image
                    src={screen.image}
                    alt={screen.imageAlt}
                    fill
                    sizes="(min-width: 1024px) 33vw, 100vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-transparent to-transparent" />
                </div>
                <div className="p-8">
                  <div className="w-12 h-12 rounded-sm bg-[#C8F135]/10 flex items-center justify-center mb-6 group-hover:bg-[#C8F135]/20 transition-colors">
                    <screen.icon size={24} className="text-[#C8F135]" />
                  </div>

                  <div className="mb-6">
                    <h3 className="font-barlow font-black text-2xl uppercase tracking-tight mb-1">{screen.title}</h3>
                    <p className="font-barlow font-bold text-xs uppercase tracking-widest text-[#C8F135]/60">{screen.subtitle}</p>
                  </div>

                  <p className="text-white/52 text-sm font-inter leading-relaxed mb-8 min-h-20">{screen.desc}</p>

                  <ul className="space-y-3 mb-10 border-t border-white/5 pt-8">
                    {screen.features.map(feature => (
                      <li key={feature} className="flex items-center gap-3 text-xs font-inter text-white/72">
                        <CheckCircle2 size={14} className="text-[#C8F135]" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <div className="bg-black/40 rounded-lg p-4 mb-8 border border-white/5">
                    <div className="flex items-center gap-2 mb-2">
                      <Lock size={12} className="text-white/30" />
                      <span className="text-[10px] font-barlow font-bold uppercase tracking-widest text-white/30">
                        {screen.login === 'No login required' ? 'Access' : 'Demo sign-in'}
                      </span>
                    </div>
                    <p className="text-sm font-mono text-white/80">{screen.login}</p>
                  </div>

                  <Link
                    href={screen.link}
                    className="w-full py-4 bg-white/5 hover:bg-[#C8F135] hover:text-[#0A0A0A] text-white font-barlow font-bold uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-2 rounded-sm border border-white/10 hover:border-transparent"
                  >
                    {screen.id === 'kiosk'
                      ? 'Open Customer Scan'
                      : screen.id === 'barber'
                        ? 'Open Barber Mode'
                        : 'Open Owner Dashboard'}
                    <ExternalLink size={16} />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            variants={fadeUp}
            className="mb-24"
          >
            <div className="text-center mb-10">
              <span className="badge-lime mb-4 inline-block">More to preview</span>
              <h2 className="font-barlow font-black text-[clamp(2rem,5vw,3.25rem)] uppercase leading-[0.92] mb-4">
                See the public side
                <br />
                <span className="text-[#C8F135]">of the shop.</span>
              </h2>
              <p className="text-white/48 font-inter text-base max-w-2xl mx-auto leading-relaxed">
                Once the queue and Cut Passport make sense, these two previews show how YourBarber helps the shop look sharper to customers as well.
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
                  className="group relative bg-[#0f0f0f] border border-white/10 rounded-xl overflow-hidden hover:border-[#C8F135]/40 transition-all shadow-2xl hover:-translate-y-1"
                >
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#C8F135]/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="relative aspect-[16/10] overflow-hidden border-b border-white/8 bg-black">
                    <Image
                      src={screen.image}
                      alt={screen.imageAlt}
                      fill
                      sizes="(min-width: 1024px) 50vw, 100vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-transparent to-transparent" />
                  </div>

                  <div className="p-8">
                    <div className="w-12 h-12 rounded-sm bg-[#C8F135]/10 flex items-center justify-center mb-6 group-hover:bg-[#C8F135]/20 transition-colors">
                      <screen.icon size={24} className="text-[#C8F135]" />
                    </div>

                    <div className="mb-6">
                      <h3 className="font-barlow font-black text-2xl uppercase tracking-tight mb-1">{screen.title}</h3>
                      <p className="font-barlow font-bold text-xs uppercase tracking-widest text-[#C8F135]/60">{screen.subtitle}</p>
                    </div>

                    <p className="text-white/52 text-sm font-inter leading-relaxed mb-8 min-h-20">{screen.desc}</p>

                    <div className="bg-black/40 rounded-lg p-4 mb-8 border border-white/5">
                      <div className="flex items-center gap-2 mb-2">
                        <Lock size={12} className="text-white/30" />
                        <span className="text-[10px] font-barlow font-bold uppercase tracking-widest text-white/30">
                          Preview access
                        </span>
                      </div>
                      <p className="text-sm font-mono text-white/80">{screen.status}</p>
                    </div>

                    <Link
                      href={screen.link}
                      className="w-full py-4 bg-white/5 hover:bg-[#C8F135] hover:text-[#0A0A0A] text-white font-barlow font-bold uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-2 rounded-sm border border-white/10 hover:border-transparent"
                    >
                      {screen.cta}
                      <ExternalLink size={16} />
                    </Link>
                  </div>
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
                  <div className="text-[#C8F135] font-barlow font-black text-3xl mb-1">&pound;29</div>
                  <div className="text-xs font-barlow font-bold uppercase tracking-widest text-white/30">Founding price</div>
                </div>
                <div>
                  <div className="text-[#C8F135] font-barlow font-black text-3xl mb-1">&lt;30s</div>
                  <div className="text-xs font-barlow font-bold uppercase tracking-widest text-white/30">After each cut</div>
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
