import Link from 'next/link';
import { ArrowRight, BellRing, CalendarClock, CheckCircle2, MessageSquareText, Sparkles, Smartphone, UserCheck } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FeaturePager from '@/components/FeaturePager';
import FeatureHero from '@/components/FeatureHero';

const proofPoints = [
  'Regulars get a timely nudge before they drift away',
  'The shop can fill quieter mornings without chasing people manually',
  'Messages feel personal because they are based on real visit history',
  'Owners get a calmer follow-up system instead of scraps of memory and old chats',
];

const reminderParts = [
  {
    icon: CalendarClock,
    title: 'Due at the right time',
    body: 'The reminder lands when a client is actually due back, not at random and not six weeks too late.',
  },
  {
    icon: MessageSquareText,
    title: 'Simple text message',
    body: 'A short "time for a trim?" text is enough to bring regulars back without making the shop sound pushy.',
  },
  {
    icon: UserCheck,
    title: 'Built from real visits',
    body: 'The nudge works because it connects to the client history, cut record, and return rhythm already stored in the shop.',
  },
  {
    icon: BellRing,
    title: 'Less manual follow-up',
    body: 'Owners stop relying on memory, paper notes, or WhatsApp lists to remember who should have come back by now.',
  },
];

const moments = [
  'A regular has not been in for a few weeks and is due back.',
  'The shop sees that they are ready for a reminder.',
  'YourBarber sends a clean, polite text at the right moment.',
  'The client rebooks or walks back in before they drift to another shop.',
];

export default function AutomatedNudgePage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white overflow-x-hidden selection:bg-[#C8F135] selection:text-[#0A0A0A]">
      <Navbar />

      <FeatureHero
        titleLines={['Bring regulars', 'back before', 'they drift.']}
        description="YourBarber watches who is due back and gives the shop a clean way to nudge them at the right time. No chasing people manually, no guessing who has gone quiet, and no losing easy repeat business to the barbershop down the road."
        primaryHref="/demo-hub"
        primaryLabel="Try the Ben J Barbers demo"
        secondaryHref="/login?callbackUrl=%2Freminders"
        secondaryLabel="Open Reminders"
        proofPoints={proofPoints}
        imageSrc="/showcase-sms.png"
        imageAlt="Reminder text message preview for a barber customer returning for their next trim"
        leftLabel="What the client sees"
        leftValue="A timely nudge."
        rightLabel="What the shop gets"
        rightValue="More return visits."
      />

      <section className="bg-[#0f0f0f] py-20 lg:py-24">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="max-w-3xl mb-12">
            <span className="badge-lime mb-4 inline-block">Why it matters</span>
            <h2 className="font-barlow font-black text-[clamp(2rem,5vw,3.5rem)] uppercase leading-[0.92] mb-5">
              The easy repeat visit
              <br />
              <span className="text-[#C8F135]">should not go missing.</span>
            </h2>
            <p className="text-white/56 font-inter text-base leading-relaxed">
              A lot of lost revenue is not dramatic. It is just regulars quietly slipping out of habit. The Automated Nudge gives the owner a simple way to catch that before it becomes churn.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {reminderParts.map(item => (
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
                <span className="text-[#C8F135]">that fills quiet slots.</span>
              </h2>
              <p className="text-white/56 font-inter text-base leading-relaxed mb-8">
                In the demo, the reminder story completes the loop. The queue gets them in, the Cut Passport remembers the visit, and the nudge brings them back before the relationship cools off.
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
                  <Sparkles size={22} className="text-[#C8F135]" />
                </div>
                <div>
                  <div className="text-[10px] font-barlow font-bold uppercase tracking-[0.18em] text-[#C8F135]/60">What changes for the owner</div>
                  <div className="font-barlow font-black text-2xl uppercase">Follow-up stops being random.</div>
                </div>
              </div>

              <div className="space-y-4 border-t border-white/8 pt-6">
                {[
                  'The shop can spot regulars who have gone quiet',
                  'Messages go out without interrupting the day',
                  'Return visits are driven by timing, not luck',
                  'The reminder system feels like a tool, not more admin',
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
                  "That reminder landed at the right time. I was due a trim anyway."
                </p>
              </div>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/demo-hub" className="inline-flex items-center gap-2 text-sm font-barlow font-bold uppercase tracking-widest text-[#C8F135] hover:text-white transition-colors">
                  Watch it in the demo <ArrowRight size={15} />
                </Link>
                <Link href="/login?callbackUrl=%2Freminders" className="inline-flex items-center gap-2 text-sm font-barlow font-bold uppercase tracking-widest text-white/70 hover:text-white transition-colors">
                  Open reminders <Smartphone size={15} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <FeaturePager currentSlug="automated-nudge" />

      <section className="bg-[#C8F135] py-20 text-[#0A0A0A]">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="max-w-4xl">
            <span className="mb-4 inline-block rounded-sm border border-black/10 bg-black/5 px-4 py-2 font-barlow font-bold text-[11px] uppercase tracking-[0.18em]">
              Built for walk-ins, not just bookings
            </span>
            <h2 className="font-barlow font-black text-[clamp(2rem,5vw,4rem)] uppercase leading-[0.92] mb-5">
              A quiet nudge
              <br />
              keeps regulars regular.
            </h2>
            <p className="max-w-2xl font-inter text-base leading-relaxed text-black/72 mb-8">
              This is how YourBarber turns a good visit into another visit. The reminder lands at the right time, feels natural, and helps the shop hold onto the clients it already earned.
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
