import { Scissors } from 'lucide-react';

export default function ComingSoonMicrosite({ shopName, logoUrl }: { shopName: string; logoUrl: string | null }) {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-8 overflow-hidden">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={shopName} className="w-full h-full object-cover" />
          ) : (
            <Scissors size={28} className="text-[#C8F135]" />
          )}
        </div>
        <h1 className="font-barlow font-black text-4xl uppercase tracking-tight mb-4">
          {shopName}
        </h1>
        <p className="text-white/40 font-inter text-base leading-relaxed">
          This shop&apos;s page is still being set up. Check back soon.
        </p>
      </div>
    </div>
  );
}
