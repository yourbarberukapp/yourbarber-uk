import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ShieldCheck } from 'lucide-react';

type FeatureHeroProps = {
  titleLines: [string, string, string];
  description: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
  proofPoints: string[];
  imageSrc: string;
  imageAlt: string;
  leftLabel: string;
  leftValue: string;
  rightLabel: string;
  rightValue: string;
};

export default function FeatureHero({
  titleLines,
  description,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
  proofPoints,
  imageSrc,
  imageAlt,
  leftLabel,
  leftValue,
  rightLabel,
  rightValue,
}: FeatureHeroProps) {
  return (
    <section className="relative overflow-hidden pt-36 pb-20 lg:pt-44 lg:pb-28">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-[#C8F135]/6 via-transparent to-transparent" />
      </div>

      <div className="container relative mx-auto px-6 lg:px-12">
        <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="max-w-3xl">
            <span className="badge-lime mb-6 inline-block">Feature deep dive</span>
            <h1 className="font-barlow font-black text-[clamp(3rem,7.5vw,5.75rem)] uppercase leading-[0.9] tracking-tight mb-6">
              {titleLines[0]}
              <br />
              {titleLines[1]}
              <br />
              <span className="text-[#C8F135]">{titleLines[2]}</span>
            </h1>
            <p className="max-w-2xl text-lg leading-relaxed text-white/62 font-inter mb-8">
              {description}
            </p>

            <div className="flex flex-wrap gap-4 mb-10">
              <Link href={primaryHref} className="btn-lime px-8 py-4 text-base inline-flex items-center gap-2 shadow-[0_0_28px_rgba(200,241,53,0.24)]">
                {primaryLabel} <ArrowRight size={17} />
              </Link>
              <Link href={secondaryHref} className="px-8 py-4 text-base border border-white/20 text-white hover:border-white/45 transition-colors font-barlow font-bold uppercase tracking-wide rounded-sm inline-flex items-center gap-2">
                {secondaryLabel}
              </Link>
            </div>

            <div className="space-y-3">
              {proofPoints.map(point => (
                <div key={point} className="flex items-start gap-3 text-white/72 font-inter">
                  <ShieldCheck size={16} className="text-[#C8F135] mt-1 flex-shrink-0" />
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 rounded-[2rem] bg-[#C8F135]/8 blur-3xl pointer-events-none" />
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0f0f0f] shadow-2xl shadow-black/60">
              <div className="relative aspect-[4/5]">
                <Image
                  src={imageSrc}
                  alt={imageAlt}
                  fill
                  priority
                  sizes="(min-width: 1024px) 40vw, 100vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/10 to-transparent" />
              </div>
              <div className="grid gap-4 border-t border-white/8 p-6 sm:grid-cols-2">
                <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
                  <div className="text-[10px] font-barlow font-bold uppercase tracking-[0.18em] text-[#C8F135]/60 mb-2">{leftLabel}</div>
                  <div className="text-white font-barlow font-black text-xl uppercase">{leftValue}</div>
                </div>
                <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
                  <div className="text-[10px] font-barlow font-bold uppercase tracking-[0.18em] text-[#C8F135]/60 mb-2">{rightLabel}</div>
                  <div className="text-white font-barlow font-black text-xl uppercase">{rightValue}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
