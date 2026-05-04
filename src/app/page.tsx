'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight, Check, ShieldCheck, Scissors } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import WaitlistForm from '@/components/WaitlistForm';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.1, ease: 'easeOut' as const },
  }),
};

function PhoneChrome({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      width: 260, flexShrink: 0,
      background: '#111', border: '6px solid #1e1e1e',
      borderRadius: 36,
      boxShadow: '0 40px 80px rgba(0,0,0,0.7), inset 0 0 0 1px rgba(255,255,255,0.04)',
      overflow: 'hidden',
    }}>
      <div style={{ background: '#0a0a0a', padding: '10px 20px 4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'white', fontFamily: 'monospace' }}>9:41</span>
        <div style={{ width: 40, height: 4, background: '#1e1e1e', borderRadius: 2 }} />
      </div>
      <div style={{ background: '#0a0a0a' }}>{children}</div>
    </div>
  );
}

function CustomerMockup() {
  return (
    <PhoneChrome>
      <div style={{ padding: '1rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1rem', paddingTop: '0.5rem' }}>
          <div style={{ fontSize: 9, fontFamily: 'var(--font-barlow)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>The Barber Room</div>
          <div style={{ fontSize: 22, fontFamily: 'var(--font-barlow)', fontWeight: 900, textTransform: 'uppercase', color: 'white', lineHeight: 1 }}>3 waiting</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-inter)', marginTop: 2 }}>About 20 minutes</div>
        </div>

        <div style={{ background: '#C8F135', borderRadius: 6, padding: '0.6rem', textAlign: 'center', marginBottom: '1rem' }}>
          <span style={{ fontSize: 11, fontFamily: 'var(--font-barlow)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#0a0a0a' }}>Join the queue</span>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.75rem' }}>
          {[
            { pos: 1, name: 'Marcus T.', service: 'Skin Fade', status: 'IN CHAIR', lime: true },
            { pos: 2, name: 'Jordan K.', service: 'Textured Crop', status: "NEXT", dim: true },
            { pos: 3, name: 'Theo P.', service: 'Standard Cut', status: '~10 min', dim: true },
            { pos: 4, name: 'You', service: 'Taper Fade', status: '~20 min', you: true },
          ].map(r => (
            <div key={r.pos} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '5px 4px',
              background: r.you ? 'rgba(200,241,53,0.06)' : 'transparent',
              borderRadius: 4,
              marginBottom: 2,
            }}>
              <span style={{ fontSize: 9, fontFamily: 'var(--font-barlow)', fontWeight: 900, color: r.lime ? '#C8F135' : r.you ? '#C8F135' : 'rgba(255,255,255,0.2)', width: 12, textAlign: 'center' }}>{r.pos}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 9, fontFamily: 'var(--font-barlow)', fontWeight: 800, textTransform: 'uppercase', color: r.you ? 'white' : r.lime ? 'white' : 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</div>
                <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.2)', fontFamily: 'var(--font-barlow)', textTransform: 'uppercase' }}>{r.service}</div>
              </div>
              <span style={{ fontSize: 7, fontFamily: 'var(--font-barlow)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: r.lime ? '#C8F135' : r.you ? 'rgba(200,241,53,0.7)' : 'rgba(255,255,255,0.2)', whiteSpace: 'nowrap' }}>{r.status}</span>
            </div>
          ))}
        </div>
      </div>
    </PhoneChrome>
  );
}

function BarberMockup() {
  return (
    <PhoneChrome>
      <div style={{ padding: '0.875rem 0.875rem 1rem' }}>
        <div style={{ fontSize: 8, fontFamily: 'var(--font-barlow)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.25)', marginBottom: 8 }}>Queue · 4 waiting</div>

        {/* Card 1 - in chair with passport */}
        <div style={{ background: 'rgba(200,241,53,0.07)', border: '1px solid rgba(200,241,53,0.2)', borderRadius: 8, padding: '0.625rem', marginBottom: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
            <div>
              <div style={{ fontSize: 10, fontFamily: 'var(--font-barlow)', fontWeight: 900, textTransform: 'uppercase', color: 'white' }}>Marcus T.</div>
              <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-barlow)', textTransform: 'uppercase' }}>Skin Fade</div>
            </div>
            <span style={{ fontSize: 7, fontFamily: 'var(--font-barlow)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#C8F135' }}>In Chair</span>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 5, padding: '0.4rem 0.5rem' }}>
            <div style={{ fontSize: 7, fontFamily: 'var(--font-barlow)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(200,241,53,0.6)', marginBottom: 4 }}>Cut Passport</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, marginBottom: 4 }}>
              {[['Top', '#2'], ['Sides', '#1'], ['Neckline', 'Tapered'], ['Beard', 'Lined']].map(([k, v]) => (
                <div key={k}>
                  <div style={{ fontSize: 6, color: 'rgba(255,255,255,0.25)', fontFamily: 'var(--font-barlow)', textTransform: 'uppercase' }}>{k}</div>
                  <div style={{ fontSize: 8, color: 'white', fontFamily: 'var(--font-barlow)', fontWeight: 700 }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              {[
                { src: '/trends/skin-fade.png', pos: 'center 15%', label: 'Front' },
                { src: '/trends/skin-fade.png', pos: 'right 10%', label: 'Left' },
                { src: '/trends/skin-fade.png', pos: 'left 10%', label: 'Right' },
                { src: '/trends/classic-taper.png', pos: 'center 5%', label: 'Back' },
              ].map(({ src, pos, label }, i) => (
                <div key={i} style={{ aspectRatio: '4/3', borderRadius: 3, overflow: 'hidden', position: 'relative', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <Image src={src} alt={label} fill sizes="60px" style={{ objectFit: 'cover', objectPosition: pos, opacity: 0.85 }} />
                  <span style={{ position: 'absolute', bottom: 2, left: 2, fontSize: '5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', background: 'rgba(0,0,0,0.65)', color: 'rgba(255,255,255,0.7)', padding: '1px 3px', borderRadius: 1, fontFamily: 'var(--font-barlow)' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '0.5rem 0.625rem', marginBottom: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 10, fontFamily: 'var(--font-barlow)', fontWeight: 800, textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)' }}>Jordan K.</div>
              <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-barlow)', textTransform: 'uppercase' }}>Textured Crop</div>
            </div>
            <span style={{ fontSize: 7, background: 'rgba(255,200,50,0.15)', color: 'rgba(255,200,50,0.8)', padding: '2px 5px', borderRadius: 3, fontFamily: 'var(--font-barlow)', fontWeight: 700, textTransform: 'uppercase' }}>First visit</span>
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8, padding: '0.5rem 0.625rem' }}>
          <div style={{ fontSize: 10, fontFamily: 'var(--font-barlow)', fontWeight: 800, textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>Theo P. + 1 more</div>
          <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)', fontFamily: 'var(--font-barlow)', textTransform: 'uppercase' }}>Standard Cut · ~15 min</div>
        </div>
      </div>
    </PhoneChrome>
  );
}

function OwnerMockup() {
  const bars = [6, 8, 12, 9, 7];
  const days = ['M', 'T', 'W', 'T', 'F'];
  const max = Math.max(...bars);
  return (
    <div style={{
      width: 300, flexShrink: 0,
      background: '#111', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 16, overflow: 'hidden',
      boxShadow: '0 32px 64px rgba(0,0,0,0.6)',
    }}>
      <div style={{ background: '#0d0d0d', padding: '0.75rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 9, fontFamily: 'var(--font-barlow)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)' }}>Owner Dashboard</span>
        <span style={{ fontSize: 9, color: '#C8F135', fontFamily: 'var(--font-barlow)', fontWeight: 700 }}>The Barber Room</span>
      </div>
      <div style={{ padding: '1rem' }}>
        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 14 }}>
          {[['47', 'Cuts this week'], ['£1,127', 'Revenue'], ['89%', 'Retention']].map(([v, l]) => (
            <div key={l} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 6, padding: '0.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: 14, fontFamily: 'var(--font-barlow)', fontWeight: 900, color: '#C8F135' }}>{v}</div>
              <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-barlow)', textTransform: 'uppercase', lineHeight: 1.3 }}>{l}</div>
            </div>
          ))}
        </div>

        {/* Bar chart */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 7, fontFamily: 'var(--font-barlow)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.25)', marginBottom: 8 }}>Cuts per day</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 36 }}>
            {bars.map((b, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                <div style={{ width: '100%', height: (b / max) * 28, background: i === 2 ? '#C8F135' : 'rgba(255,255,255,0.12)', borderRadius: '2px 2px 0 0' }} />
                <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.25)', fontFamily: 'var(--font-barlow)', fontWeight: 700 }}>{days[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Reminders */}
        <div style={{ background: 'rgba(200,241,53,0.05)', border: '1px solid rgba(200,241,53,0.15)', borderRadius: 6, padding: '0.5rem 0.625rem', marginBottom: 8 }}>
          <div style={{ fontSize: 8, fontFamily: 'var(--font-barlow)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#C8F135', marginBottom: 4 }}>3 clients due a reminder</div>
          {['Marcus T. — 5 weeks', 'Zara H. — 6 weeks', 'Ryan M. — 5 weeks'].map(n => (
            <div key={n} style={{ fontSize: 8, color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-inter)', padding: '1px 0' }}>{n}</div>
          ))}
        </div>

        {/* Popular */}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.375rem 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.25)', fontFamily: 'var(--font-barlow)', textTransform: 'uppercase' }}>Most popular</span>
          <span style={{ fontSize: 8, color: 'white', fontFamily: 'var(--font-barlow)', fontWeight: 700 }}>Skin Fade · 38%</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.375rem 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.25)', fontFamily: 'var(--font-barlow)', textTransform: 'uppercase' }}>Busiest slot</span>
          <span style={{ fontSize: 8, color: 'white', fontFamily: 'var(--font-barlow)', fontWeight: 700 }}>Wed 2–4pm</span>
        </div>
      </div>
    </div>
  );
}

const customerSteps = [
  { n: '01', title: 'Scan the wall QR', body: 'The client scans the QR code on your wall or desk from their own phone. No app to download.' },
  { n: '02', title: 'See the queue and join', body: 'They see how many are waiting, pick their service, and join in under 30 seconds.' },
  { n: '03', title: 'All barbers updated instantly', body: "The moment they join, every barber's screen updates. No front desk, no shouting across the shop." },
  { n: '04', title: 'New or returning — handled automatically', body: 'Known clients get a welcome back message. New clients are created on the spot and added to the record.' },
  { n: '05', title: 'Cut saved. Reminder set.', body: 'After the chair, the cut is logged. Five weeks later YourBarber nudges them back in — automatically.' },
];

const barberSteps = [
  { n: '01', title: "Open the app — see today's queue", body: 'Walk-ins and any pre-booked clients in one view. You know exactly what the day looks like.' },
  { n: '02', title: 'Client sits down — open their passport', body: 'For returning clients, their Cut Passport opens immediately. Grade, taper, beard notes, and four reference photos from last time.' },
  { n: '03', title: 'Record the cut in under 30 seconds', body: 'Four photos, guard sizes, a note if needed. The next barber — or your future self — will know exactly what was done.' },
  { n: '04', title: 'Save. Next client loads up.', body: 'One tap and the queue advances. The reminder fires automatically. You stay in the chair, not the admin.' },
];

const ownerSteps = [
  { n: '01', title: 'Analytics at a glance', body: 'Cuts per day, revenue, retention rate, busiest slots. Know where the money comes from and when the quiet patches hit.' },
  { n: '02', title: 'Team and queue view', body: "See every barber's status, queue load, and availability in real time. Spot the bottleneck before it becomes a walkout." },
  { n: '03', title: 'Reminders — one tap to send', body: 'Any client overdue for a visit shows up in the reminders panel. Send a nudge in one tap, from the dashboard or your phone.' },
  { n: '04', title: 'Your microsite and shop screens', body: 'A public-facing shop page for Google searches. A live queue board for your TV. Both managed from the same place.' },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white overflow-x-hidden selection:bg-[#C8F135] selection:text-[#0A0A0A]">
      <Navbar />

      {/* HERO */}
      <section id="waitlist" className="relative min-h-screen flex items-center overflow-hidden">
        <Image src="/hero-ipad.png" alt="YourBarber in a barbershop" fill priority sizes="100vw"
          className="object-cover object-center opacity-45 z-0" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A] via-[#0A0A0A]/85 to-[#0A0A0A]/20 pointer-events-none z-[1]" />

        <div className="relative z-10 container mx-auto px-6 lg:px-12 py-32 lg:py-44">
          <div className="max-w-xl">
            <motion.div initial="hidden" animate="visible" custom={0} variants={fadeUp} className="badge-lime inline-block mb-7">
              Free beta — first 50 barbershops
            </motion.div>

            <motion.h1 initial="hidden" animate="visible" custom={1} variants={fadeUp}
              className="font-barlow font-black text-[clamp(3.25rem,9vw,7rem)] leading-[0.88] tracking-tight uppercase mb-7">
              Know every
              <br />client before
              <br /><span className="text-[#C8F135]">they sit down.</span>
            </motion.h1>

            <motion.p initial="hidden" animate="visible" custom={2} variants={fadeUp}
              className="text-lg text-white/60 max-w-md leading-relaxed mb-3 font-inter">
              The Cut Passport puts every grade, taper, photo, and beard note in your hand before the cape goes on. Walk to the chair knowing — not guessing.
            </motion.p>

            <motion.p initial="hidden" animate="visible" custom={3} variants={fadeUp}
              className="text-sm text-white/35 max-w-md leading-relaxed mb-8 font-inter">
              Get free access to the beta. Help us build it right — your feedback decides what gets built first. No credit card. No contracts.
            </motion.p>

            <motion.div initial="hidden" animate="visible" custom={4} variants={fadeUp} className="mb-8">
              <WaitlistForm />
            </motion.div>

            <motion.div initial="hidden" animate="visible" custom={5} variants={fadeUp}
              className="flex flex-wrap items-center gap-5 text-sm text-white/30 font-inter">
              {['No credit card', 'No contracts', 'Your feedback shapes the product'].map(item => (
                <span key={item} className="flex items-center gap-1.5">
                  <ShieldCheck size={13} className="text-[#C8F135]" /> {item}
                </span>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* SECTION INTRO */}
      <div className="bg-[#0f0f0f] border-y border-white/5 py-12 px-6">
        <div className="container mx-auto max-w-5xl text-center">
          <p className="text-white/30 font-barlow font-bold text-sm uppercase tracking-[0.2em]">How the system works</p>
          <h2 className="font-barlow font-black text-[clamp(1.75rem,4vw,2.75rem)] uppercase mt-3 leading-tight">
            Three views. <span className="text-[#C8F135]">One system.</span>
          </h2>
          <p className="text-white/40 font-inter text-base mt-3 max-w-lg mx-auto">
            The client, the barber, and the owner each see exactly what they need — nothing more.
          </p>
          <div className="flex justify-center gap-4 mt-6 flex-wrap">
            {[['#client', 'The client'], ['#barber', 'The barber'], ['#owner', 'The owner']].map(([href, label]) => (
              <a key={href} href={href} className="text-xs font-barlow font-bold uppercase tracking-widest text-white/30 hover:text-[#C8F135] transition-colors border border-white/10 hover:border-[#C8F135]/30 px-4 py-2 rounded-sm">
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* CLIENT JOURNEY */}
      <section id="client" className="py-24 lg:py-32 bg-[#0A0A0A]">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} variants={fadeUp}>
              <span className="badge-lime inline-block mb-5">The client</span>
              <h2 className="font-barlow font-black text-[clamp(2rem,4.5vw,3rem)] uppercase leading-tight mb-10">
                From the door
                <br /><span className="text-[#C8F135]">to the chair in seconds.</span>
              </h2>
              <div className="space-y-8">
                {customerSteps.map((s, i) => (
                  <motion.div key={s.n} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i} variants={fadeUp}
                    className="flex gap-5">
                    <span className="font-barlow font-black text-3xl text-[#C8F135]/20 leading-none w-10 flex-shrink-0 pt-0.5">{s.n}</span>
                    <div>
                      <h3 className="font-barlow font-bold text-base uppercase tracking-wide text-white mb-1">{s.title}</h3>
                      <p className="text-white/45 text-sm font-inter leading-relaxed">{s.body}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 32 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="flex justify-center lg:justify-end lg:sticky lg:top-28">
              <div className="relative">
                <div className="absolute -inset-8 bg-[#C8F135]/5 rounded-3xl blur-3xl pointer-events-none" />
                <CustomerMockup />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* WALLET SECTION */}
      <section className="py-24 lg:py-32 bg-[#0f0f0f]">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Wallet card mockup */}
            <motion.div initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.7, ease: 'easeOut' }}
              className="flex justify-center">
              <div className="relative">
                <div className="absolute -inset-10 bg-[#C8F135]/8 rounded-3xl blur-3xl pointer-events-none" />
                {/* Apple Wallet card */}
                <div style={{
                  width: 300, borderRadius: 20,
                  background: 'linear-gradient(160deg, #1a1a1a 0%, #0d0d0d 100%)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  boxShadow: '0 40px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)',
                  overflow: 'hidden',
                }}>
                  {/* Top colour strip */}
                  <div style={{ height: 6, background: 'linear-gradient(90deg, #C8F135, #a8d120)' }} />

                  {/* Pass header */}
                  <div style={{ padding: '1rem 1.25rem 0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div>
                      <div style={{ fontSize: 8, fontFamily: 'var(--font-barlow)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)', marginBottom: 2 }}>Cut Passport</div>
                      <div style={{ fontSize: 13, fontFamily: 'var(--font-barlow)', fontWeight: 900, textTransform: 'uppercase', color: 'white', letterSpacing: '0.04em' }}>The Barber Room</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', fontFamily: 'var(--font-inter)' }}>Next visit</div>
                      <div style={{ fontSize: 12, fontFamily: 'var(--font-barlow)', fontWeight: 900, color: '#C8F135' }}>In 2 weeks</div>
                    </div>
                  </div>

                  {/* Client name */}
                  <div style={{ padding: '1rem 1.25rem 0.5rem' }}>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', fontFamily: 'var(--font-barlow)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 4 }}>Member</div>
                    <div style={{ fontSize: 22, fontFamily: 'var(--font-barlow)', fontWeight: 900, textTransform: 'uppercase', color: 'white', letterSpacing: '0.02em' }}>Marcus T.</div>
                  </div>

                  {/* Last cut details */}
                  <div style={{ padding: '0 1.25rem 1rem', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                    {[['Style', 'Skin Fade'], ['Top', '#2 Guard'], ['Sides', '#1 Guard']].map(([k, v]) => (
                      <div key={k}>
                        <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.25)', fontFamily: 'var(--font-barlow)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>{k}</div>
                        <div style={{ fontSize: 10, fontFamily: 'var(--font-barlow)', fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>{v}</div>
                      </div>
                    ))}
                  </div>

                  {/* Photo strip */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 2, margin: '0 1.25rem 1rem' }}>
                    {[
                      { src: '/trends/skin-fade.png', pos: 'center 15%', label: 'Front' },
                      { src: '/trends/skin-fade.png', pos: 'right 10%', label: 'Left' },
                      { src: '/trends/skin-fade.png', pos: 'left 10%', label: 'Right' },
                      { src: '/trends/classic-taper.png', pos: 'center 5%', label: 'Back' },
                    ].map(({ src, pos, label }, i) => (
                      <div key={i} style={{ aspectRatio: '3/4', borderRadius: 4, overflow: 'hidden', position: 'relative', background: 'rgba(255,255,255,0.05)' }}>
                        <Image src={src} alt={label} fill sizes="60px" style={{ objectFit: 'cover', objectPosition: pos, opacity: 0.8 }} />
                        <span style={{ position: 'absolute', bottom: 3, left: 3, fontSize: '6px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', background: 'rgba(0,0,0,0.65)', color: 'rgba(255,255,255,0.7)', padding: '1px 3px', borderRadius: 2, fontFamily: 'var(--font-barlow)' }}>{label}</span>
                      </div>
                    ))}
                  </div>

                  {/* Footer */}
                  <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)', fontFamily: 'var(--font-inter)' }}>Last cut: 3 weeks ago</div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.2)', fontFamily: 'var(--font-inter)' }}>Add to</div>
                      <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 4, padding: '2px 6px' }}>
                        <span style={{ fontSize: 7, fontFamily: 'var(--font-inter)', fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>Wallet</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lock screen notification below card */}
                <div style={{
                  marginTop: 16, width: 300,
                  background: 'rgba(255,255,255,0.06)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 14,
                  padding: '0.625rem 0.875rem',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <div style={{ width: 28, height: 28, background: '#C8F135', borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 12 }}>✂️</span>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, fontFamily: 'var(--font-barlow)', fontWeight: 700, textTransform: 'uppercase', color: 'white' }}>The Barber Room</div>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-inter)' }}>Marcus, time for a trim? You were last in 5 weeks ago.</div>
                  </div>
                  <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)', fontFamily: 'var(--font-inter)', flexShrink: 0 }}>now</div>
                </div>
              </div>
            </motion.div>

            {/* Copy */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} variants={fadeUp}>
              <span className="badge-lime inline-block mb-5">Coming with the beta</span>
              <h2 className="font-barlow font-black text-[clamp(2rem,4.5vw,3rem)] uppercase leading-tight mb-6">
                On their phone.
                <br />On their lock screen.
                <br /><span className="text-[#C8F135]">Free.</span>
              </h2>
              <p className="text-white/55 font-inter text-base leading-relaxed mb-4">
                After the cut, their Cut Passport goes straight into Apple Wallet or Google Wallet — branded to your shop. Photos, grades, style notes, all of it.
              </p>
              <p className="text-white/40 font-inter text-base leading-relaxed mb-8">
                When they&apos;re due back in, the reminder arrives on their lock screen for free. No SMS fees. No spam filters. No app to download. It just appears.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  'Free lock screen reminders — no SMS cost',
                  'Branded to your shop, not a generic app',
                  'Passport updates automatically after every cut',
                  'Works natively on iPhone and Android',
                  'Client adds it once — it stays in their Wallet forever',
                ].map(item => (
                  <li key={item} className="flex items-start gap-3 text-white/60 font-inter text-sm">
                    <Check size={14} className="text-[#C8F135] flex-shrink-0 mt-0.5" /> {item}
                  </li>
                ))}
              </ul>
              <p className="text-white/25 text-xs font-inter">
                Beta shops help shape what this looks like. Your feedback decides the features that get built first.
              </p>
            </motion.div>

          </div>
        </div>
      </section>

      {/* BARBER VIEW */}
      <section id="barber" className="py-24 lg:py-32 bg-[#0A0A0A]">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <motion.div initial={{ opacity: 0, x: -32 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="flex justify-center lg:justify-start order-2 lg:order-1 lg:sticky lg:top-28">
              <div className="relative">
                <div className="absolute -inset-8 bg-[#C8F135]/5 rounded-3xl blur-3xl pointer-events-none" />
                <BarberMockup />
              </div>
            </motion.div>

            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} variants={fadeUp}
              className="order-1 lg:order-2">
              <span className="badge-lime inline-block mb-5">The barber</span>
              <h2 className="font-barlow font-black text-[clamp(2rem,4.5vw,3rem)] uppercase leading-tight mb-10">
                Your queue.
                <br /><span className="text-[#C8F135]">Every passport. Zero guesswork.</span>
              </h2>
              <div className="space-y-8">
                {barberSteps.map((s, i) => (
                  <motion.div key={s.n} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i} variants={fadeUp}
                    className="flex gap-5">
                    <span className="font-barlow font-black text-3xl text-[#C8F135]/20 leading-none w-10 flex-shrink-0 pt-0.5">{s.n}</span>
                    <div>
                      <h3 className="font-barlow font-bold text-base uppercase tracking-wide text-white mb-1">{s.title}</h3>
                      <p className="text-white/45 text-sm font-inter leading-relaxed">{s.body}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* OWNER VIEW */}
      <section id="owner" className="py-24 lg:py-32 bg-[#0A0A0A]">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} variants={fadeUp}>
              <span className="badge-lime inline-block mb-5">The owner</span>
              <h2 className="font-barlow font-black text-[clamp(2rem,4.5vw,3rem)] uppercase leading-tight mb-10">
                Your shop,
                <br /><span className="text-[#C8F135]">at a glance. Any time.</span>
              </h2>
              <div className="space-y-8">
                {ownerSteps.map((s, i) => (
                  <motion.div key={s.n} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i} variants={fadeUp}
                    className="flex gap-5">
                    <span className="font-barlow font-black text-3xl text-[#C8F135]/20 leading-none w-10 flex-shrink-0 pt-0.5">{s.n}</span>
                    <div>
                      <h3 className="font-barlow font-bold text-base uppercase tracking-wide text-white mb-1">{s.title}</h3>
                      <p className="text-white/45 text-sm font-inter leading-relaxed">{s.body}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 32 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="flex justify-center lg:justify-end lg:sticky lg:top-28">
              <div className="relative">
                <div className="absolute -inset-8 bg-[#C8F135]/5 rounded-3xl blur-3xl pointer-events-none" />
                <OwnerMockup />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="py-24 lg:py-32 bg-[#C8F135] relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'repeating-linear-gradient(45deg,#000 0,#000 1px,transparent 0,transparent 50%)', backgroundSize: '20px 20px' }} />
        <div className="relative container mx-auto px-6 lg:px-12 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={fadeUp}>
            <div className="inline-flex items-center gap-2 bg-black/10 rounded-full px-4 py-1.5 mb-8">
              <Scissors size={12} className="text-[#0A0A0A]/50" />
              <span className="text-[10px] font-barlow font-bold uppercase tracking-[0.2em] text-[#0A0A0A]/50">Free beta — first 50 shops</span>
            </div>
            <h2 className="font-barlow font-black text-[clamp(2.5rem,6.5vw,5rem)] uppercase leading-[0.9] text-[#0A0A0A] mb-6">
              Help us build it.
              <br />Use it free.
            </h2>
            <p className="text-[#0A0A0A]/65 max-w-md mx-auto mb-10 font-inter text-lg">
              First 50 barbershops get free access. Your feedback decides what gets built first. After the beta: £20/month, locked in for life if you want to stay.
            </p>
            <Link href="#" onClick={e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
              <button className="bg-[#0A0A0A] text-[#C8F135] px-10 py-5 text-base rounded-sm font-barlow font-black uppercase tracking-wide hover:bg-[#1a1a1a] transition-colors inline-flex items-center gap-2 shadow-lg">
                Apply for free beta access <ArrowRight size={17} />
              </button>
            </Link>
            <p className="mt-5 text-[#0A0A0A]/40 text-sm font-inter">
              No credit card. No contracts. We&apos;ll call you personally to walk through the system.
            </p>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
