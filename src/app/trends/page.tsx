'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Check, Scissors, Sparkles } from 'lucide-react';

const TRENDS = [
  {
    title: 'Modern Skin Fade',
    description: 'A sharp, clean transition from skin to hair. The gold standard for modern grooming.',
    image: '/trends/skin-fade.png',
    tags: ['Sharp', 'Clean', 'Modern']
  },
  {
    title: 'Textured Crop',
    description: 'Perfect for adding volume and movement. Works best with matte products.',
    image: '/trends/textured-crop.png',
    tags: ['Volume', 'Matte', 'Textured']
  },
  {
    title: 'Classic Taper',
    description: 'The timeless gentleman\'s choice. Low maintenance but high impact.',
    image: '/trends/classic-taper.png',
    tags: ['Classic', 'Professional', 'Smooth']
  }
];

function ordinal(value: string | null) {
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  if (n === 1) return '1st';
  if (n === 2) return '2nd';
  if (n === 3) return '3rd';
  return `${n}th`;
}

function TrendsContent() {
  const searchParams = useSearchParams();
  const [ready, setReady] = useState(false);
  const [savedStatus, setSavedStatus] = useState<{ position?: number; waitMinutes?: number } | null>(null);
  const shopSlug = searchParams.get('shop') || 'the-barber-room';
  const urlCheckedIn = searchParams.get('checkedIn') === '1';
  const urlPosition = searchParams.get('position');
  const urlWait = searchParams.get('wait');
  const checkedIn = urlCheckedIn || !!savedStatus;
  const position = urlPosition || (savedStatus?.position ? String(savedStatus.position) : null);
  const wait = urlWait || (savedStatus?.waitMinutes !== undefined ? String(savedStatus.waitMinutes) : null);
  const arriveUrl = `/arrive/${shopSlug}`;

  useEffect(() => {
    const raw = window.localStorage.getItem(`yourbarber-arrival-${shopSlug}`);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      const maxAgeMs = 6 * 60 * 60 * 1000;
      if (Date.now() - parsed.savedAt <= maxAgeMs) {
        setSavedStatus({
          position: Number(parsed.position) || undefined,
          waitMinutes: Number.isFinite(Number(parsed.waitMinutes)) ? Number(parsed.waitMinutes) : undefined,
        });
      }
    } catch {
      window.localStorage.removeItem(`yourbarber-arrival-${shopSlug}`);
    }
  }, [shopSlug]);

  return (
    <div className="min-h-screen bg-black text-white selection:bg-[#C8F135] selection:text-black">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-xl mx-auto px-6 py-4 flex items-center justify-between">
          {checkedIn ? (
            <button
              type="button"
              onClick={() => setReady(true)}
              className="p-2 -ml-2 text-white/40 hover:text-white transition-colors"
              aria-label="Show queue status"
            >
              <ArrowLeft size={20} />
            </button>
          ) : (
            <Link href={arriveUrl} className="p-2 -ml-2 text-white/40 hover:text-white transition-colors">
              <ArrowLeft size={20} />
            </Link>
          )}
          <div className="flex flex-col items-center">
            <h1 className="font-barlow font-black text-xl uppercase tracking-tight flex items-center gap-2">
              <Sparkles size={16} className="text-[#C8F135]" />
              Hair Trends
            </h1>
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/30">Gallery</p>
          </div>
          <div className="w-9" /> {/* Spacer */}
        </div>
      </div>

      <main className="max-w-xl mx-auto px-6 py-8 pb-32">
        <div className="mb-10 text-center">
          <p className="text-white/50 text-sm leading-relaxed">
            Take a seat, grab a drink, and browse our latest signature styles. Show your barber the one you want.
          </p>
        </div>

        <div className="space-y-12">
          {TRENDS.map((trend, i) => (
            <div key={i} className="group animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: `${i * 150}ms` }}>
              <div className="relative aspect-[4/5] rounded-3xl overflow-hidden mb-6 bg-white/5 ring-1 ring-white/10 group-hover:ring-white/20 transition-all duration-500 shadow-2xl">
                <Image 
                  src={trend.image} 
                  alt={trend.title} 
                  fill 
                  className="object-cover transition-transform duration-1000 group-hover:scale-105"
                  priority={i === 0}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {trend.tags.map(tag => (
                      <span key={tag} className="px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[10px] font-bold uppercase tracking-widest">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h2 className="font-barlow font-black text-3xl uppercase tracking-tight mb-2">
                    {trend.title}
                  </h2>
                </div>
              </div>
              <p className="text-white/40 text-sm leading-relaxed px-2">
                {trend.description}
              </p>
            </div>
          ))}
        </div>
      </main>

      {ready && (
        <div className="fixed inset-0 z-[80] bg-black/90 backdrop-blur-md flex items-center justify-center p-6">
          <div className="w-full max-w-sm bg-[#111] border border-[#C8F135]/20 rounded-3xl p-8 text-center shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-[#C8F135]/12 border border-[#C8F135]/30 flex items-center justify-center mx-auto mb-5">
              <Check size={28} className="text-[#C8F135]" />
            </div>
            <h2 className="font-barlow font-black text-3xl uppercase tracking-tight text-white">
              You&apos;re checked in.
            </h2>
            <p className="text-white/45 text-sm leading-relaxed mt-3">
              Your place is still held in the queue. Keep this screen open and show your barber any style you liked when they call you.
            </p>
            {(position || wait) && (
              <div className="mt-6 rounded-2xl border border-[#C8F135]/15 bg-[#C8F135]/5 p-4">
                {position && (
                  <p className="font-barlow font-black text-4xl text-[#C8F135] leading-none">
                    {ordinal(position)}
                  </p>
                )}
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/35 mt-2">
                  {position ? 'Your queue position' : 'In the queue'}
                </p>
                {wait && wait !== '0' && (
                  <p className="text-xs text-white/40 mt-2">
                    Around {wait} min wait
                  </p>
                )}
                {wait === '0' && (
                  <p className="text-xs text-[#C8F135]/80 mt-2">
                    You&apos;re up next
                  </p>
                )}
              </div>
            )}
            <button
              type="button"
              onClick={() => setReady(false)}
              className="mt-6 w-full bg-[#C8F135] text-black py-4 rounded-2xl font-barlow font-black text-sm uppercase tracking-widest active:scale-[0.98] transition-all"
            >
              Browse more styles
            </button>
          </div>
        </div>
      )}

      {/* Floating CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/90 to-transparent">
        <div className="max-w-xl mx-auto">
          {checkedIn ? (
            <button
              type="button"
              onClick={() => setReady(true)}
              className="flex items-center justify-center gap-3 w-full bg-[#C8F135] text-black py-5 rounded-2xl font-barlow font-black text-lg uppercase tracking-tight shadow-[0_20px_50px_rgba(200,241,53,0.3)] active:scale-[0.98] transition-all"
            >
              <Check size={20} />
              Done browsing styles
            </button>
          ) : (
            <Link 
              href={arriveUrl}
              className="flex items-center justify-center gap-3 w-full bg-[#C8F135] text-black py-5 rounded-2xl font-barlow font-black text-lg uppercase tracking-tight shadow-[0_20px_50px_rgba(200,241,53,0.3)] active:scale-[0.98] transition-all"
            >
              <Scissors size={20} />
              Check in for a cut
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TrendsPage() {
  return (
    <Suspense fallback={null}>
      <TrendsContent />
    </Suspense>
  );
}
