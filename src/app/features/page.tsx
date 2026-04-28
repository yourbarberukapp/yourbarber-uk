import Link from 'next/link';
import { ArrowRight, Camera, MessageSquare, Smartphone } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const featureCards = [
  {
    href: '/features/cut-passport',
    label: 'The Cut Passport',
    title: 'Remember every fade.',
    body: 'Keep the haircut history, photos, grades, and notes against the client so any barber can see what "same as last time" means.',
    cta: 'See Cut Passport',
    icon: Camera,
  },
  {
    href: '/features/live-walk-in-queue',
    label: 'The Fair-Play Queue',
    title: 'End the "who is next?" shuffle.',
    body: 'Customers scan the wall QR, join from their own phone, and see where they stand without crowding the chair or interrupting a cut.',
    cta: 'See Live Queue',
    icon: Smartphone,
  },
  {
    href: '/features/automated-nudge',
    label: 'The Automated Nudge',
    title: 'Bring regulars back before they drift.',
    body: 'YourBarber spots who is due back and sends a clean, timely reminder that helps fill quiet slots without more admin.',
    cta: 'See Automated Nudge',
    icon: MessageSquare,
  },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white overflow-x-hidden selection:bg-[#C8F135] selection:text-[#0A0A0A]">
      <Navbar />

      <section className="relative overflow-hidden pt-36 pb-20 lg:pt-44 lg:pb-28">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-[#C8F135]/6 via-transparent to-transparent" />
        </div>

        <div className="container relative mx-auto px-6 lg:px-12">
          <div className="max-w-4xl">
            <span className="badge-lime mb-6 inline-block">Built for walk-ins, not just bookings</span>
            <h1 className="font-barlow font-black text-[clamp(3rem,8vw,6rem)] uppercase leading-[0.88] tracking-tight mb-6">
              Three tools
              <br />
              one sharper
              <br />
              <span className="text-[#C8F135]">shop system.</span>
            </h1>
            <p className="max-w-3xl text-lg leading-relaxed text-white/62 font-inter mb-10">
              YourBarber is not just a queue screen. The live queue gets people in the chair, the Cut Passport remembers what happened in it, and the reminder loop helps bring regulars back. Explore the three pieces below.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {featureCards.map(card => (
              <div key={card.href} className="rounded-xl border border-white/8 bg-[#111] p-8">
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-sm bg-[#C8F135]/10">
                  <card.icon size={22} className="text-[#C8F135]" />
                </div>
                <div className="text-[10px] font-barlow font-bold uppercase tracking-[0.18em] text-[#C8F135]/60 mb-2">{card.label}</div>
                <h2 className="font-barlow font-black text-3xl uppercase leading-[0.95] mb-4">{card.title}</h2>
                <p className="text-white/56 font-inter leading-relaxed text-base mb-8">{card.body}</p>
                <Link
                  href={card.href}
                  className="inline-flex items-center gap-2 text-sm font-barlow font-bold uppercase tracking-widest text-white/75 transition-colors hover:text-[#C8F135]"
                >
                  {card.cta} <ArrowRight size={15} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#C8F135] py-20 text-[#0A0A0A]">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="max-w-4xl">
            <span className="mb-4 inline-block rounded-sm border border-black/10 bg-black/5 px-4 py-2 font-barlow font-bold text-[11px] uppercase tracking-[0.18em]">
              Ben J Barbers demo
            </span>
            <h2 className="font-barlow font-black text-[clamp(2rem,5vw,4rem)] uppercase leading-[0.92] mb-5">
              See how the three pieces
              <br />
              work together in the demo.
            </h2>
            <p className="max-w-2xl font-inter text-base leading-relaxed text-black/72 mb-8">
              Start with the customer scan, move through Barber Mode, then finish in the owner dashboard. That is where the queue, history, and reminder story click into one flow.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/demo-hub" className="inline-flex items-center justify-center gap-2 rounded-sm bg-[#0A0A0A] px-8 py-4 font-barlow font-bold uppercase tracking-widest text-[#C8F135] transition-colors hover:bg-[#1a1a1a]">
                Try the demo <ArrowRight size={17} />
              </Link>
              <Link href="/pricing" className="inline-flex items-center justify-center rounded-sm border border-black/15 px-8 py-4 font-barlow font-bold uppercase tracking-widest text-[#0A0A0A] transition-colors hover:bg-black/5">
                See pricing
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
