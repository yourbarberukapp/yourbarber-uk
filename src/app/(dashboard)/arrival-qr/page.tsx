import Link from 'next/link';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { getRequiredSession } from '@/lib/session';
import { Download, ExternalLink, QrCode, Smartphone } from 'lucide-react';

function getDemoShopName(slug: string) {
  const cookie = cookies().get(`demo_override_${slug}`);
  if (!cookie?.value) return null;
  try {
    const overrides = JSON.parse(decodeURIComponent(atob(cookie.value)));
    return typeof overrides.name === 'string' && overrides.name.trim() ? overrides.name.trim() : null;
  } catch {
    return null;
  }
}

export default async function ArrivalQrPage() {
  const session = await getRequiredSession();
  const shop = await db.shop.findUnique({
    where: { id: session.shopId },
    select: { name: true, slug: true },
  });

  if (!shop) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="font-barlow font-black text-4xl uppercase text-white tracking-tight">Arrival QR</h1>
        <p className="text-white/40 text-sm mt-2">Shop not found.</p>
      </div>
    );
  }

  const arrivePath = `/arrive/${shop.slug}`;
  const arriveUrl = `yourbarber.uk${arrivePath}`;
  const displayName = getDemoShopName(shop.slug) || shop.name;
  const qrImageUrl = `/api/qr/arrive/${shop.slug}?size=900&format=square`;
  const posterUrl = `/api/qr/arrive/${shop.slug}?format=portrait&type=pdf`;
  const stickerUrl = `/api/qr/arrive/${shop.slug}?format=square&type=pdf`;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-[#C8F135] text-[11px] font-bold uppercase tracking-[0.2em] mb-3">
            <QrCode size={16} />
            Live shop QR
          </div>
          <h1 className="font-barlow font-black text-4xl sm:text-5xl uppercase text-white tracking-tight">
            Arrival QR
          </h1>
          <p className="text-white/40 text-sm mt-2">
            {displayName} customers check in at <span className="font-mono text-white/60">{arriveUrl}</span>
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href={arrivePath}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white/5 hover:bg-white/10 text-white transition-colors flex items-center gap-2 px-5 py-3 rounded-sm text-xs font-black uppercase tracking-[0.16em]"
          >
            <ExternalLink size={16} />
            Open
          </Link>
          <a
            href={posterUrl}
            download={`YourBarber-CheckIn-${shop.slug}.pdf`}
            className="btn-lime flex items-center gap-2 px-5 py-3 rounded-sm text-xs font-black uppercase tracking-[0.16em]"
          >
            <Download size={16} />
            Poster PDF
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(320px,560px)_1fr] gap-8 items-start">
        <section className="bg-[#111] border border-white/5 rounded-lg p-4 sm:p-6">
          <div className="bg-[#0a0a0a] border border-white/5 rounded-sm p-4 sm:p-8">
            <img
              src={qrImageUrl}
              alt={`Arrival QR for ${displayName}`}
              className="w-full aspect-square object-contain"
            />
          </div>
        </section>

        <section className="space-y-4">
          <div className="bg-[#111] border border-white/5 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-lg bg-[#C8F135]/10 border border-[#C8F135]/20 flex items-center justify-center text-[#C8F135] shrink-0">
                <Smartphone size={20} />
              </div>
              <div className="min-w-0">
                <h2 className="font-barlow font-black text-white uppercase tracking-tight text-xl">
                  Scan demo
                </h2>
                <p className="text-white/40 text-sm leading-relaxed mt-1">
                  Scan this from a phone, enter your own mobile number, and you will join this shop&apos;s live walk-in queue.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#111] border border-white/5 rounded-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5 bg-white/[0.02]">
              <h2 className="font-barlow font-bold text-sm uppercase tracking-widest text-white">Print files</h2>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <a
                href={posterUrl}
                download={`YourBarber-CheckIn-${shop.slug}.pdf`}
                className="bg-white/5 hover:bg-white/10 border border-white/5 text-white transition-colors flex items-center justify-center gap-2 px-4 py-4 rounded-sm text-xs font-black uppercase tracking-[0.14em]"
              >
                <Download size={16} />
                A4 Poster
              </a>
              <a
                href={stickerUrl}
                download={`YourBarber-Sticker-${shop.slug}.pdf`}
                className="bg-white/5 hover:bg-white/10 border border-white/5 text-white transition-colors flex items-center justify-center gap-2 px-4 py-4 rounded-sm text-xs font-black uppercase tracking-[0.14em]"
              >
                <Download size={16} />
                Square
              </a>
            </div>
          </div>

          <div className="bg-black/30 border border-white/5 rounded-lg p-5">
            <div className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2">Arrival link</div>
            <div className="font-mono text-sm text-white/70 break-all">{arriveUrl}</div>
          </div>
        </section>
      </div>
    </div>
  );
}
