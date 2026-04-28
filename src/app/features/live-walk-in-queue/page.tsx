import Link from 'next/link';
import { ArrowRight, CheckCircle2, Clock3, Coffee, MessageSquareText, QrCode, Smartphone, Users } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FeaturePager from '@/components/FeaturePager';
import FeatureHero from '@/components/FeatureHero';

const proofPoints = [
  'Customers join from their own phone without stopping a barber mid-cut',
  'The queue stays visible, fair, and easy to trust',
  'People can leave the doorway instead of crowding the shop',
  'Texts and live updates cut down the usual "how long?" interruptions',
];

const queueParts = [
  {
    icon: QrCode,
    title: 'Wall QR check-in',
    body: 'One code on the wall lets a customer join the queue in seconds with no app to download.',
  },
  {
    icon: Smartphone,
    title: 'Live queue position',
    body: 'Customers can see where they stand without hovering near the chair or asking who is next.',
  },
  {
    icon: MessageSquareText,
    title: 'Text when next',
    body: 'They can step out for a coffee and come back when their turn is close instead of clogging the lobby.',
  },
  {
    icon: Users,
    title: 'Fair for the whole shop',
    body: 'Every barber sees the same waiting list, so the queue is less personal, less messy, and easier to manage.',
  },
];

const moments = [
  'A customer walks in and scans the QR on the wall.',
  'They choose today\'s cut and join the queue from their phone.',
  'The barber sees them appear instantly with service details attached.',
  'When they are next, the queue updates and the shop keeps moving without an argument.',
];

export default function LiveWalkInQueuePage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white overflow-x-hidden selection:bg-[#C8F135] selection:text-[#0A0A0A]">
      <Navbar />

      <FeatureHero
        titleLines={['A live queue', 'the whole shop', 'can trust.']}
        description="YourBarber gives walk-in shops a calmer front door. Customers scan the wall QR, join from their own phone, and see where they stand. Barbers see the same queue instantly, so the day moves without the usual shouting, crowding, and guesswork."
        primaryHref="/demo-hub"
        primaryLabel="Try the Ben J Barbers demo"
        secondaryHref="/arrive/benj-barbers"
        secondaryLabel="Open Customer Scan"
        proofPoints={proofPoints}
        imageSrc="/demo-kiosk.png"
        imageAlt="Wall check-in screen showing the live walk-in queue in a barbershop"
        leftLabel="What customers see"
        leftValue="Where they stand."
        rightLabel="What the shop gets"
        rightValue="Less queue drama."
      />

      <section className="bg-[#0f0f0f] py-20 lg:py-24">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="max-w-3xl mb-12">
            <span className="badge-lime mb-4 inline-block">Why it matters</span>
            <h2 className="font-barlow font-black text-[clamp(2rem,5vw,3.5rem)] uppercase leading-[0.92] mb-5">
              The queue stops
              <br />
              <span className="text-[#C8F135]">living in people&apos;s heads.</span>
            </h2>
            <p className="text-white/56 font-inter text-base leading-relaxed">
              Busy walk-in shops lose money in the messy middle: new customers see a crowded lobby and leave, regulars argue about who was next, and barbers get dragged into queue management while they are trying to cut hair. A live queue fixes that without changing how the shop works.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {queueParts.map(item => (
              <div key={item.title} className="rounded-xl border border-white/8 bg-[#111] p-7">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-sm bg-[#C8F135]/10">
                  <item.icon size={22} className="text-[#C8F135]" />
                </div>
                <h3 className="font-barlow font-black text-2xl uppercase leading-tight mb-3">{item.title}</h3>
                <p className="text-white/56 font-inter leading-relaxed text-sm">{item.body}</p>
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
                This is the bit
                <br />
                <span className="text-[#C8F135]">owners feel straight away.</span>
              </h2>
              <p className="text-white/56 font-inter text-base leading-relaxed mb-8">
                In the demo, the queue is the first thing that makes sense. A customer checks in without interrupting anyone, the barber sees them appear instantly, and the shop suddenly feels more organised.
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
                  <Coffee size={22} className="text-[#C8F135]" />
                </div>
                <div>
                  <div className="text-[10px] font-barlow font-bold uppercase tracking-[0.18em] text-[#C8F135]/60">What changes on the floor</div>
                  <div className="font-barlow font-black text-2xl uppercase">People wait better.</div>
                </div>
              </div>

              <div className="space-y-4 border-t border-white/8 pt-6">
                {[
                  'Customers stop crowding the chair to ask how long is left',
                  'Families can join without confusing the order',
                  'A customer can step out and come back when they are close',
                  'Barbers spend less time managing the queue and more time cutting',
                ].map(item => (
                  <div key={item} className="flex items-center gap-3 text-white/72 font-inter text-sm">
                    <CheckCircle2 size={16} className="text-[#C8F135] flex-shrink-0" />
                    {item}
                  </div>
                ))}
              </div>

              <div className="mt-8 rounded-xl border border-[#C8F135]/15 bg-[#C8F135]/5 p-6">
                <div className="text-[10px] font-barlow font-bold uppercase tracking-[0.18em] text-[#C8F135]/60 mb-2">What the customer feels</div>
                <p className="text-white font-inter leading-relaxed">
                  "I know where I am in the queue, so I&apos;m not stuck standing by the door wondering what&apos;s going on."
                </p>
              </div>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/demo-hub" className="inline-flex items-center gap-2 text-sm font-barlow font-bold uppercase tracking-widest text-[#C8F135] hover:text-white transition-colors">
                  Watch it in the demo <ArrowRight size={15} />
                </Link>
                <Link href="/arrive/benj-barbers" className="inline-flex items-center gap-2 text-sm font-barlow font-bold uppercase tracking-widest text-white/70 hover:text-white transition-colors">
                  Try the customer scan <Smartphone size={15} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <FeaturePager currentSlug="live-walk-in-queue" />

      <section className="bg-[#C8F135] py-20 text-[#0A0A0A]">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="max-w-4xl">
            <span className="mb-4 inline-block rounded-sm border border-black/10 bg-black/5 px-4 py-2 font-barlow font-bold text-[11px] uppercase tracking-[0.18em]">
              Built for walk-ins, not just bookings
            </span>
            <h2 className="font-barlow font-black text-[clamp(2rem,5vw,4rem)] uppercase leading-[0.92] mb-5">
              If people can trust
              <br />
              the queue, they stay.
            </h2>
            <p className="max-w-2xl font-inter text-base leading-relaxed text-black/72 mb-8">
              A fair live queue makes the shop feel calmer from the front door onward. It cuts the friction that sends people walking back out before they ever sit down.
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
