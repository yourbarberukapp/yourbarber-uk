import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Scissors, Sparkles } from 'lucide-react';

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

export default function TrendsPage() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-[#C8F135] selection:text-black">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/arrive" className="p-2 -ml-2 text-white/40 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex flex-col items-center">
            <h1 className="font-barlow font-black text-xl uppercase tracking-tight flex items-center gap-2">
              <Sparkles size={16} className="text-[#C8F135]" />
              Hair Trends
            </h1>
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/30">Ben J Barbers Gallery</p>
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

      {/* Floating CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/90 to-transparent">
        <div className="max-w-xl mx-auto">
          <Link 
            href="/arrive"
            className="flex items-center justify-center gap-3 w-full bg-[#C8F135] text-black py-5 rounded-2xl font-barlow font-black text-lg uppercase tracking-tight shadow-[0_20px_50px_rgba(200,241,53,0.3)] active:scale-[0.98] transition-all"
          >
            <Scissors size={20} />
            Ready for your cut?
          </Link>
        </div>
      </div>
    </div>
  );
}
