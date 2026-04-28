import Link from 'next/link';
import { ArrowRight, Camera, MessageSquare, Smartphone } from 'lucide-react';

const features = [
  {
    href: '/features/cut-passport',
    slug: 'cut-passport',
    label: 'Cut Passport',
    hook: 'Remember every fade.',
    icon: Camera,
  },
  {
    href: '/features/live-walk-in-queue',
    slug: 'live-walk-in-queue',
    label: 'Live Walk-In Queue',
    hook: 'End the "who is next?" shuffle.',
    icon: Smartphone,
  },
  {
    href: '/features/automated-nudge',
    slug: 'automated-nudge',
    label: 'Automated Nudge',
    hook: 'Bring regulars back before they drift.',
    icon: MessageSquare,
  },
];

export default function FeaturePager({ currentSlug }: { currentSlug: string }) {
  return (
    <section className="bg-[#0f0f0f] py-16 lg:py-20">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="max-w-3xl mb-8">
          <span className="badge-lime mb-4 inline-block">Explore the other tools</span>
          <h2 className="font-barlow font-black text-[clamp(2rem,4.5vw,3rem)] uppercase leading-[0.92] mb-4">
            The queue gets them in.
            <br />
            <span className="text-[#C8F135]">The system keeps them coming back.</span>
          </h2>
          <p className="text-white/52 font-inter text-base leading-relaxed">
            These three pieces work together. Jump between them and see how the walk-in flow, the Cut Passport, and the reminder loop fit into one sharper shop system.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {features.map(feature => {
            const active = feature.slug === currentSlug;
            return (
              <div
                key={feature.slug}
                className={`rounded-xl border p-7 transition-colors ${
                  active
                    ? 'border-[#C8F135]/30 bg-[#C8F135]/6'
                    : 'border-white/8 bg-[#111]'
                }`}
              >
                <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-sm ${active ? 'bg-[#C8F135]/14' : 'bg-white/6'}`}>
                  <feature.icon size={22} className={active ? 'text-[#C8F135]' : 'text-white/70'} />
                </div>
                <div className="text-[10px] font-barlow font-bold uppercase tracking-[0.18em] text-[#C8F135]/60 mb-2">
                  {active ? 'Current page' : 'Feature page'}
                </div>
                <h3 className="font-barlow font-black text-2xl uppercase leading-tight mb-3">{feature.label}</h3>
                <p className="text-white/56 font-inter leading-relaxed text-sm mb-6">{feature.hook}</p>
                {active ? (
                  <span className="inline-flex items-center gap-2 text-sm font-barlow font-bold uppercase tracking-widest text-[#C8F135]">
                    You&apos;re here
                  </span>
                ) : (
                  <Link
                    href={feature.href}
                    className="inline-flex items-center gap-2 text-sm font-barlow font-bold uppercase tracking-widest text-white/75 transition-colors hover:text-[#C8F135]"
                  >
                    Open feature <ArrowRight size={15} />
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
