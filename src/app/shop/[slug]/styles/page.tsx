import { notFound } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db';
import { ArrowLeft, Scissors } from 'lucide-react';
import { StylesGallery } from './StylesGallery';

export default async function ShopStylesPage({ params }: { params: { slug: string } }) {
  const shop = await db.shop.findUnique({
    where: { slug: params.slug },
    select: {
      name: true,
      slug: true,
      styles: {
        where: { active: true },
        orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
        select: { id: true, name: true, category: true, imageUrl: true },
      },
    },
  });

  if (!shop) notFound();

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Header */}
      <div className="border-b border-white/5 px-6 py-4 flex items-center gap-3 sticky top-0 bg-[#0A0A0A]/95 backdrop-blur-md z-10">
        <Link href={`/shop/${params.slug}`} className="text-white/40 flex items-center hover:text-white/80 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex items-center gap-2 flex-1">
          <Scissors size={16} className="text-[#C8F135]" />
          <span className="font-barlow font-black text-base uppercase tracking-tight">
            {shop.name}
          </span>
        </div>
        <span className="text-[11px] font-bold uppercase tracking-widest text-white/30 font-barlow">
          Style Menu
        </span>
      </div>

      <div className="max-w-3xl mx-auto px-5 pt-8 pb-16">
        <h1 className="font-barlow font-black text-4xl md:text-5xl uppercase tracking-tight leading-none mb-2">
          Style Menu
        </h1>
        <p className="text-white/40 text-sm mb-10 leading-relaxed font-inter">
          Browse our available cuts and styles. Show your barber what you want.
        </p>

        <StylesGallery styles={shop.styles} />
      </div>
    </div>
  );
}
