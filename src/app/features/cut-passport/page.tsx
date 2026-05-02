import Link from 'next/link';
import { ArrowRight, Camera, CheckCircle2, Clock3, ImageIcon, Scissors, Smartphone, Star } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FeaturePager from '@/components/FeaturePager';
import FeatureHero from '@/components/FeatureHero';

const proofPoints = [
  'The last cut stays with the shop, not one barber\'s memory',
  'Photos, grades, notes, and preferences live in one place',
  'Any barber can open the client and see what "same as last time" means',
  'Regulars feel recognised without having to explain everything again',
];

const passportItems = [
  {
    icon: ImageIcon,
    title: 'Cut photos',
    body: 'Save the front, left, right, and back so the next barber can see the shape before the cape goes on.',
  },
  {
    icon: Scissors,
    title: 'Grades and notes',
    body: 'Keep the guard lengths, fade type, top length, neckline, beard work, and any details that matter.',
  },
  {
    icon: Clock3,
    title: 'Visit history',
    body: 'See when they came in, what they had, and how often they usually return.',
  },
  {
    icon: Star,
    title: 'Next-visit prompt',
    body: 'Add a recommendation like "come back in four weeks" so reminders feel timely instead of random.',
  },
];

const moments = [
  'A regular walks in and says, "same as last time."',
  'The barber opens their Cut Passport before they sit down.',
  'The last cut is right there: photos, grades, and notes.',
  'After the cut, the barber saves the new details in under 30 seconds.',
];

export default function CutPassportPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white overflow-x-hidden selection:bg-[#C8F135] selection:text-[#0A0A0A]">
      <Navbar />

      <FeatureHero
        titleLines={['Every regular', 'gets a', 'Cut Passport.']}
        description="Your queue gets people in the chair. The Cut Passport is what makes them come back. It gives every barber in the shop the same memory: what the client had last time, what they liked, and what to repeat today."
        primaryHref="/demo-hub"
        primaryLabel="Try the demo"
        secondaryHref="/login?callbackUrl=%2Fbarber"
        secondaryLabel="Open Barber Mode"
        proofPoints={proofPoints}
        imageSrc="/showcase-record.png"
        imageAlt="Cut Passport preview showing haircut notes and photos on a tablet in a barbershop"
        leftLabel="Saved details"
        leftValue="Photos. Grades. Notes."
        rightLabel="What it changes"
        rightValue="Less guesswork."
      />

      <section className="bg-[#0f0f0f] py-20 lg:py-24">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="max-w-3xl mb-12">
            <span className="badge-lime mb-4 inline-block">Why it matters</span>
            <h2 className="font-barlow font-black text-[clamp(2rem,5vw,3.5rem)] uppercase leading-[0.92] mb-5">
              The haircut history
              <br />
              <span className="text-[#C8F135]">stays in the shop.</span>
            </h2>
            <p className="text-white/56 font-inter text-base leading-relaxed">
              Most walk-in shops rely on memory, WhatsApp messages, or one barber knowing one client. The Cut Passport turns that into a proper shop asset. If a different barber takes the chair, the client still feels known.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {passportItems.map(item => (
              <div key={item.title} className="rounded-xl border border-white/8 bg-[#111] p-7">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-sm bg-[#C8F135]/10">
                  <item.icon size={22} className="text-[#C8F135]" />
                </div>
                <h3 className="font-barlow font-black text-2xl uppercase leading-tight mb-3">{item.title}</h3>
                <p className="text-white/56 font-inter leading-relaxed text-base">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#0A0A0A] py-20 lg:py-24">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div>
              <span className="badge-lime mb-4 inline-block">Demo proof</span>
              <h2 className="font-barlow font-black text-[clamp(2rem,5vw,3.5rem)] uppercase leading-[0.92] mb-5">
                This is the moment
                <br />
                <span className="text-[#C8F135]">barbers get instantly.</span>
              </h2>
              <p className="text-white/56 font-inter text-base leading-relaxed mb-8">
                In the demo, the Cut Passport is the moment where it clicks. A barber opens the client, sees the last cut, trusts it, and keeps moving.
              </p>

              <div className="space-y-4">
                {moments.map((moment, index) => (
                  <div key={moment} className="flex gap-4 rounded-xl border border-white/8 bg-[#0f0f0f] p-5">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#C8F135] text-[#0A0A0A] font-barlow font-black">
                      {index + 1}
                    </div>
                    <p className="text-white/70 font-inter leading-relaxed">{moment}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/8 bg-[#111] p-8 lg:p-10">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-sm bg-[#C8F135]/10">
                  <Camera size={22} className="text-[#C8F135]" />
                </div>
                <div>
                  <div className="text-[10px] font-barlow font-bold uppercase tracking-[0.18em] text-[#C8F135]/60">What the barber sees</div>
                  <div className="font-barlow font-black text-2xl uppercase">Luke chose the last cut he liked.</div>
                </div>
              </div>

              <div className="space-y-4 border-t border-white/8 pt-6">
                {[
                  'Mid fade with beard blend',
                  'Shorter on top with texture left in front',
                  'Front, left, right, and back photos saved',
                  'Recommendation: back in four weeks',
                ].map(item => (
                  <div key={item} className="flex items-center gap-3 text-white/72 font-inter text-base">
                    <CheckCircle2 size={16} className="text-[#C8F135] flex-shrink-0" />
                    {item}
                  </div>
                ))}
              </div>

              <div className="mt-8 rounded-xl border border-[#C8F135]/15 bg-[#C8F135]/5 p-6">
                <div className="text-[10px] font-barlow font-bold uppercase tracking-[0.18em] text-[#C8F135]/60 mb-2">What the client feels</div>
                <p className="text-white font-inter leading-relaxed">
                  "I don&apos;t have to explain it again. They already know what I had last time."
                </p>
              </div>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/demo-hub" className="inline-flex items-center gap-2 text-sm font-barlow font-bold uppercase tracking-widest text-[#C8F135] hover:text-white transition-colors">
                  Watch it in the demo <ArrowRight size={15} />
                </Link>
                <Link href="/shop/the-barber-room" className="inline-flex items-center gap-2 text-sm font-barlow font-bold uppercase tracking-widest text-white/70 hover:text-white transition-colors">
                  View the shop microsite <Smartphone size={15} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <FeaturePager currentSlug="cut-passport" />

      <section className="bg-[#C8F135] py-20 text-[#0A0A0A]">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="max-w-4xl">
            <span className="mb-4 inline-block rounded-sm border border-black/10 bg-black/5 px-4 py-2 font-barlow font-bold text-[11px] uppercase tracking-[0.18em]">
              Built for walk-ins, not just bookings
            </span>
            <h2 className="font-barlow font-black text-[clamp(2rem,5vw,4rem)] uppercase leading-[0.92] mb-5">
              If the queue gets them in,
              <br />
              the Cut Passport brings them back.
            </h2>
            <p className="max-w-2xl font-inter text-base leading-relaxed text-black/72 mb-8">
              This is the part of YourBarber that turns a busy day into a better regular business. The queue makes the shop calmer. The memory makes the shop stick.
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
