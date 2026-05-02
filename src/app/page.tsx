'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight, Camera, Check, MessageSquare, Scissors, ShieldCheck, Smartphone, Tv2, X } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const fadeUp = {
  hidden: { opacity: 1, y: 0 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.1, ease: 'easeOut' as const },
  }),
};

const pains = [
  {
    headline: 'The "same as last time" problem',
    body: 'Your regulars expect you to remember the fade, the guard, the neckline, and the beard shape. When you forget, they feel it.',
  },
  {
    headline: 'The lobby loitering problem',
    body: 'When the shop looks rammed, new customers keep walking. A messy queue can send good money straight back onto the street.',
  },
  {
    headline: 'The staff exit problem',
    body: 'When a barber leaves, their client knowledge usually leaves too. Your shop should not become a blank slate every time someone moves on.',
  },
];

const pillars = [
  {
    icon: Camera,
    label: 'The Cut Passport',
    hook: 'Remember every fade.',
    body: 'Snap four photos, tap in the grades, and keep the haircut history against the client. Next time they sit down, any barber can show them the last cut before the cape goes on.',
    result: 'You cut faster. They feel like a VIP. Nobody has to guess.',
    image: '/demo-barber.png',
    imageAlt: 'Barber checking a client\'s cut history on their phone before the cut begins',
    href: '/features/cut-passport',
    cta: 'See Cut Passport',
  },
  {
    icon: Smartphone,
    label: 'The Fair-Play Queue',
    hook: 'End the "who is next?" shuffle.',
    body: 'Customers scan the wall QR, join from their own phone, and get a text when they are next. They can grab a coffee instead of crowding the door.',
    result: 'A calmer shop, a clearer lobby, and fewer walkouts.',
    image: '/demo-kiosk-luke.png',
    imageAlt: 'Wall check-in screen in a barbershop with a barber cutting hair in the background',
    href: '/features/live-walk-in-queue',
    cta: 'See Live Queue',
  },
  {
    icon: MessageSquare,
    label: 'The Automated Nudge',
    hook: 'Bring regulars back before they drift.',
    body: 'When someone has not been in for five weeks, YourBarber sends a polite "time for a trim?" message for you.',
    result: 'You fill quiet mornings without stopping a haircut.',
    image: '/showcase-sms.png?v=2',
    imageAlt: 'Customer receiving a YourBarber reminder text inside a barbershop',
    href: '/features/automated-nudge',
    cta: 'See Automated Nudge',
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white overflow-x-hidden selection:bg-[#C8F135] selection:text-[#0A0A0A]">
      <Navbar />

      <section className="relative min-h-screen flex items-center overflow-hidden">
        <Image
          src="/hero-ipad.png"
          alt="A barber using YourBarber on an iPad inside a busy barbershop"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-55 z-0"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A] via-[#0A0A0A]/80 to-[#0A0A0A]/30 pointer-events-none z-[1]" />
        <div className="absolute inset-0 pointer-events-none z-[2]">
          <div
            className="absolute inset-0"
            style={{ backgroundImage: 'radial-gradient(ellipse 80% 50% at 70% 50%, rgba(200,241,53,0.13) 0%, transparent 70%)' }}
          />
        </div>

        <div className="relative z-10 container mx-auto px-6 lg:px-12 py-32 lg:py-44">
          <div className="max-w-3xl">
            <motion.div initial="hidden" animate="visible" custom={0} variants={fadeUp} className="badge-lime inline-block mb-7">
              Built for walk-ins, not just bookings
            </motion.div>

            <motion.h1
              initial="hidden"
              animate="visible"
              custom={1}
              variants={fadeUp}
              className="font-barlow font-black text-[clamp(3.25rem,9vw,7.25rem)] leading-[0.88] tracking-tight uppercase mb-7"
            >
              The walk-in
              <br />
              queue system
              <br />
              that remembers
              <br />
              <span className="text-[#C8F135]">every client.</span>
            </motion.h1>

            <motion.p initial="hidden" animate="visible" custom={2} variants={fadeUp} className="text-lg text-white/62 max-w-2xl leading-relaxed mb-10 font-inter">
              Customers scan your QR code, join the queue, and choose today&apos;s cut from their phone. Your barbers see who&apos;s waiting, what they want, and what they had last time.
            </motion.p>

            <motion.div initial="hidden" animate="visible" custom={3} variants={fadeUp} className="flex flex-wrap gap-4 mb-10">
              <Link href="/demo-hub">
                <button className="btn-lime px-8 py-4 text-base flex items-center gap-2 shadow-[0_0_28px_rgba(200,241,53,0.28)]">
                  Try the demo <ArrowRight size={17} />
                </button>
              </Link>
              <Link href="/pricing">
                <button className="px-8 py-4 text-base border border-white/20 text-white hover:border-white/45 transition-colors font-barlow font-bold uppercase tracking-wide rounded-sm">
                  See pricing
                </button>
              </Link>
            </motion.div>

            <motion.div initial="hidden" animate="visible" custom={4} variants={fadeUp} className="flex flex-wrap items-center gap-5 text-sm text-white/35 font-inter">
              {['No customer app needed', 'Built for walk-ins', 'Cut Passport included'].map(item => (
                <span key={item} className="flex items-center gap-1.5">
                  <ShieldCheck size={13} className="text-[#C8F135]" /> {item}
                </span>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-[#0f0f0f]">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="max-w-5xl mx-auto">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={fadeUp} className="mb-10">
              <h2 className="font-barlow font-black text-[clamp(2rem,5vw,3.25rem)] uppercase leading-tight mb-3">
                Is your shop&apos;s memory
                <br />
                <span className="text-[#C8F135]">walking out the door?</span>
              </h2>
              <p className="text-white/45 font-inter text-base">
                These are not tech problems. They are chair, queue, and till problems.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {pains.map((p, i) => (
                <motion.div
                  key={p.headline}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: '-40px' }}
                  custom={i}
                  variants={fadeUp}
                  className="bg-[#111] border border-red-500/12 rounded-xl p-7"
                >
                  <X size={20} className="text-red-400/55 mb-4" />
                  <h3 className="font-barlow font-bold text-base uppercase leading-tight mb-3 text-white/85">{p.headline}</h3>
                  <p className="text-white/50 text-base font-inter leading-relaxed">{p.body}</p>
                </motion.div>
              ))}
            </div>

            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-40px' }} variants={fadeUp} className="bg-[#C8F135]/5 border border-[#C8F135]/20 rounded-xl p-7 flex items-start gap-4">
              <Check size={20} className="text-[#C8F135] mt-0.5 flex-shrink-0" />
              <p className="text-white/72 text-base font-inter leading-relaxed">
                <span className="text-white font-semibold">YourBarber gives the shop a memory.</span> The queue stays fair, the haircut history stays in the shop, and your regulars keep feeling recognised.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      <section id="features" className="py-24 lg:py-32 bg-[#0A0A0A]">
        <div className="container mx-auto px-6 lg:px-12">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={fadeUp} className="mb-16">
            <span className="badge-lime mb-4 inline-block">Three tools barbers actually use</span>
            <h2 className="font-barlow font-black text-[clamp(2.25rem,5vw,3.75rem)] uppercase leading-tight">
              The Cut Passport
              <br />
              <span className="text-[#C8F135]">is the star.</span>
            </h2>
            <p className="text-white/45 font-inter mt-4 max-w-lg text-base leading-relaxed">
              The queue gets people in the chair. The history keeps them coming back.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {pillars.map((pillar, i) => (
              <motion.div
                key={pillar.label}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-40px' }}
                custom={i}
                variants={fadeUp}
                className="bg-[#0f0f0f] border border-white/8 rounded-xl p-8 flex flex-col"
              >
                <div className="relative mb-6 aspect-[4/3] overflow-hidden rounded-lg border border-white/8 bg-black">
                  <Image
                    src={pillar.image}
                    alt={pillar.imageAlt}
                    fill
                    sizes="(min-width: 1024px) 33vw, 100vw"
                    loading="eager"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f]/80 via-transparent to-transparent" />
                </div>
                <div className="w-12 h-12 rounded-sm bg-[#C8F135]/10 flex items-center justify-center mb-6 flex-shrink-0">
                  <pillar.icon size={22} className="text-[#C8F135]" />
                </div>
                <div className="text-[10px] font-barlow font-bold uppercase tracking-[0.18em] text-[#C8F135]/60 mb-1">{pillar.label}</div>
                <h3 className="font-barlow font-black text-2xl uppercase leading-tight mb-4 text-white">{pillar.hook}</h3>
                <p className="text-white/56 text-base leading-relaxed font-inter flex-1">{pillar.body}</p>
                <p className="mt-6 text-sm text-[#C8F135]/75 font-inter leading-relaxed">{pillar.result}</p>
                {pillar.href ? (
                  <Link
                    href={pillar.href}
                    className="mt-6 inline-flex items-center gap-2 text-sm font-barlow font-bold uppercase tracking-widest text-white/75 transition-colors hover:text-[#C8F135]"
                  >
                    {pillar.cta} <ArrowRight size={14} />
                  </Link>
                ) : null}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 lg:py-28 bg-[#0f0f0f]">
        <div className="container mx-auto px-6 lg:px-12">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={fadeUp} className="mb-14">
            <span className="badge-lime mb-4 inline-block">How it feels in the shop</span>
            <h2 className="font-barlow font-black text-[clamp(2rem,4.5vw,3.25rem)] uppercase leading-tight">
              No clipboards.
              <br />
              <span className="text-[#C8F135]">No queue arguments.</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
            {[
              {
                n: '01',
                title: 'They scan the wall',
                body: 'The customer joins the queue from their own phone and tells you what they want before they sit down.',
              },
              {
                n: '02',
                title: 'You open their history',
                body: 'Their last cut, photos, guard lengths, beard notes, and preferences are right there when the chair is ready.',
              },
              {
                n: '03',
                title: 'You send them back happy',
                body: 'After the cut, the photos and notes are saved. Five weeks later, the nudge brings them back in.',
              },
            ].map((step, i) => (
              <motion.div
                key={step.n}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-60px' }}
                custom={i}
                variants={fadeUp}
                className="relative border-l border-white/8 pl-8 pr-6 py-8 first:border-l-0 first:pl-0"
              >
                <div className="font-barlow font-black text-5xl text-[#C8F135]/20 mb-4 leading-none">{step.n}</div>
                <h3 className="font-barlow font-bold text-xl uppercase tracking-wide mb-3 text-white">{step.title}</h3>
                <p className="text-white/52 text-base leading-relaxed font-inter">{step.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="live-board" className="py-24 lg:py-32 bg-[#0A0A0A] overflow-hidden">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={fadeUp}>
              <span className="badge-lime mb-4 inline-block">YourBarber Live-Board</span>
              <h2 className="font-barlow font-black text-[clamp(2rem,4.5vw,3.25rem)] uppercase leading-tight mb-5">
                Put your shop
                <br />
                on the map.
              </h2>
              <p className="text-white/62 text-base leading-relaxed mb-4 font-inter">
                We send you a tiny device that plugs into your shop TV. It shows live wait times and photos of your best work to everyone in the shop, and everyone looking through the window.
              </p>
              <p className="text-white/45 text-base leading-relaxed mb-8 font-inter">
                It makes the place feel organised, professional, and busy in the right way.
              </p>
              <ul className="space-y-3">
                {[
                  'Live wait times visible from the street',
                  'Best cuts shown on the big screen',
                  'Customers stop asking how long is left',
                  'The shop looks sharper before they even sit down',
                ].map(item => (
                  <li key={item} className="flex items-center gap-3 text-white/62 font-inter text-base">
                    <Check size={15} className="text-[#C8F135] flex-shrink-0" /> {item}
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 48 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="relative"
            >
              <div className="absolute -inset-8 bg-[#C8F135]/5 rounded-3xl blur-3xl pointer-events-none" />
              <div className="relative bg-[#0a0a0a] border-4 border-[#1c1c1c] rounded-2xl overflow-hidden shadow-2xl shadow-black/70">
                <div className="bg-[#111] px-5 py-3 flex items-center justify-between border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <Tv2 size={13} className="text-[#C8F135]" />
                    <span className="font-barlow font-bold text-[10px] uppercase tracking-[0.18em] text-white/35">The Barber Room - Live Queue</span>
                  </div>
                  <span className="font-mono text-[10px] text-white/20">11:42</span>
                </div>
                <div className="flex">
                  <div className="flex-1 p-4 space-y-2 border-r border-white/5">
                    {[
                      { pos: 1, name: 'Marcus T.', style: 'Skin Fade', wait: 'IN CHAIR', lime: true },
                      { pos: 2, name: 'Jordan K.', style: 'Textured Crop', wait: "YOU'RE NEXT", next: true },
                      { pos: 3, name: 'Theo + Jay', style: 'Standard Cut x2', wait: '~20 min' },
                      { pos: 4, name: 'Ryan M.', style: 'Taper Fade', wait: '~40 min' },
                    ].map(row => (
                      <div
                        key={row.name}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg ${
                          row.lime
                            ? 'bg-[#C8F135]/8 border border-[#C8F135]/20'
                            : row.next
                              ? 'bg-white/[0.04] border border-white/10'
                              : 'bg-white/[0.02] border border-white/5'
                        }`}
                      >
                        <span className={`font-barlow font-black text-base w-5 text-center flex-shrink-0 ${row.lime ? 'text-[#C8F135]' : 'text-white/15'}`}>{row.pos}</span>
                        <div className="flex-1 min-w-0">
                          <div className={`font-barlow font-black text-xs uppercase truncate ${row.lime ? 'text-white' : 'text-white/65'}`}>{row.name}</div>
                          <div className="text-[9px] font-barlow uppercase tracking-wide text-white/25 truncate">{row.style}</div>
                        </div>
                        <span className={`text-[9px] font-barlow font-bold uppercase tracking-widest flex-shrink-0 ${row.lime ? 'text-[#C8F135]' : row.next ? 'text-white/50' : 'text-white/20'}`}>{row.wait}</span>
                      </div>
                    ))}
                  </div>
                  <div className="w-28 p-3 flex flex-col gap-2">
                    <div className="text-[8px] font-barlow font-bold uppercase tracking-widest text-white/20 mb-1">Our work</div>
                    {[
                      { color: 'bg-white/8', label: 'Skin Fade' },
                      { color: 'bg-white/6', label: 'Crop' },
                      { color: 'bg-white/5', label: 'Taper' },
                    ].map(img => (
                      <div key={img.label} className={`${img.color} rounded border border-white/5 aspect-square flex items-end p-1`}>
                        <span className="text-[7px] font-barlow font-bold uppercase text-white/25">{img.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="px-5 py-2 border-t border-white/5 flex items-center justify-center">
                  <span className="text-[8px] font-barlow font-bold uppercase tracking-[0.2em] text-white/10">yourbarber.uk</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-[#0f0f0f]">
        <div className="container mx-auto px-6 lg:px-12 max-w-4xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={fadeUp} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#111] border border-white/6 rounded-xl p-7">
              <div className="text-[#C8F135] font-barlow font-black text-4xl mb-1">0%</div>
              <div className="text-xs font-barlow font-bold uppercase tracking-widest text-white/30 mb-3">Commission</div>
              <p className="text-white/52 text-base font-inter leading-relaxed">You keep the money from every customer. One flat monthly price, no slice of the till.</p>
            </div>
            <div className="bg-[#111] border border-white/6 rounded-xl p-7">
              <div className="text-[#C8F135] font-barlow font-black text-4xl mb-1">&lt;30s</div>
              <div className="text-xs font-barlow font-bold uppercase tracking-widest text-white/30 mb-3">After each cut</div>
              <p className="text-white/52 text-base font-inter leading-relaxed">Four photos, a few taps, and the next visit is already easier.</p>
            </div>
            <div className="bg-[#111] border border-white/6 rounded-xl p-7">
              <div className="text-[#C8F135] font-barlow font-black text-4xl mb-1">1</div>
              <div className="text-xs font-barlow font-bold uppercase tracking-widest text-white/30 mb-3">Return visit pays for it</div>
              <p className="text-white/52 text-base font-inter leading-relaxed">Bring back one client who was about to forget and the month has already paid for itself.</p>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-12 bg-[#0A0A0A]">
        <div className="container mx-auto px-6 lg:px-12">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={fadeUp} className="bg-[#111] border border-white/8 rounded-2xl p-10 lg:p-14 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-72 h-72 bg-[#C8F135]/5 blur-3xl rounded-full pointer-events-none" />
            <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div>
                <span className="badge-lime mb-4 inline-block">Founding members</span>
                <h2 className="font-barlow font-black text-[clamp(2rem,4vw,3rem)] uppercase leading-tight mb-4">
                  &pound;29/month.
                  <br />
                  <span className="text-[#C8F135]">That&apos;s it.</span>
                </h2>
                <p className="text-white/52 font-inter text-base leading-relaxed max-w-md">
                  No contracts. No hidden fees. If the queue stops one walkout or the reminder brings one regular back, YourBarber has done its job for the month.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-start sm:items-center gap-8">
                <div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-barlow font-black text-[3.5rem] text-[#C8F135] leading-none">&pound;29</span>
                    <span className="text-white/30 font-inter text-base">/month</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-white/20 line-through text-sm font-inter">&pound;49/month</span>
                    <span className="text-[10px] font-barlow font-bold uppercase tracking-widest text-[#C8F135]/60">founding price</span>
                  </div>
                  <ul className="mt-4 space-y-2">
                    {['Cut Passports for every client', 'Fair-play walk-in queue', 'Return-visit nudges', 'Live-Board ready'].map(item => (
                      <li key={item} className="flex items-center gap-2 text-white/62 text-sm font-inter">
                        <Check size={12} className="text-[#C8F135] flex-shrink-0" /> {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex flex-col gap-3 flex-shrink-0">
                  <Link href="/demo-hub">
                    <button className="btn-lime px-8 py-3 text-sm whitespace-nowrap">Try the demo</button>
                  </Link>
                  <Link href="/pricing">
                    <button className="text-white/30 hover:text-white text-xs font-barlow font-bold uppercase tracking-widest transition-colors text-center">
                      See pricing
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-24 lg:py-32 bg-[#C8F135] relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'repeating-linear-gradient(45deg,#000 0,#000 1px,transparent 0,transparent 50%)', backgroundSize: '20px 20px' }}
        />
        <div className="relative container mx-auto px-6 lg:px-12 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={fadeUp}>
            <div className="inline-flex items-center gap-2 bg-black/10 rounded-full px-4 py-1.5 mb-8">
              <Scissors size={12} className="text-[#0A0A0A]/50" />
              <span className="text-[10px] font-barlow font-bold uppercase tracking-[0.2em] text-[#0A0A0A]/50">Built for the chair, the queue, and the till</span>
            </div>

            <h2 className="font-barlow font-black text-[clamp(2.5rem,6.5vw,5rem)] uppercase leading-[0.9] text-[#0A0A0A] mb-6">
              Stop Guessing.
              <br />
              Start Remembering.
            </h2>
            <p className="text-[#0A0A0A]/65 max-w-md mx-auto mb-10 font-inter text-lg">
              Give every regular a history, every walk-in a clear place in line, and every quiet week a reason to fill up again.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/demo-hub">
                <button className="bg-[#0A0A0A] text-[#C8F135] px-10 py-5 text-base rounded-sm font-barlow font-black uppercase tracking-wide hover:bg-[#1a1a1a] transition-colors flex items-center justify-center gap-2 w-full sm:w-auto shadow-lg">
                  Try the demo <ArrowRight size={17} />
                </button>
              </Link>
              <Link href="/demo">
                <button className="border-2 border-[#0A0A0A]/25 text-[#0A0A0A] px-10 py-5 text-base rounded-sm font-barlow font-bold uppercase tracking-wide hover:border-[#0A0A0A]/50 transition-colors w-full sm:w-auto">
                  Book setup call
                </button>
              </Link>
            </div>

            <p className="mt-5 text-[#0A0A0A]/45 text-sm font-inter">
              &pound;29/month for founding members. No contracts. Cancel any time.
            </p>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
