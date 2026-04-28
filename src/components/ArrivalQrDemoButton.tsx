'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, QrCode, X } from 'lucide-react';
import { useDemoOverride } from './DemoOverrideProvider';

interface Props {
  shopSlug: string;
  shopName: string;
  className?: string;
}

export default function ArrivalQrDemoButton({ shopSlug, shopName, className = '' }: Props) {
  const [open, setOpen] = useState(false);
  const [nonce, setNonce] = useState(0);
  const { overrides } = useDemoOverride();
  const displayName = overrides[shopSlug]?.name || shopName;
  const cacheKey = useMemo(() => encodeURIComponent(displayName), [displayName]);
  const arrivePath = `/arrive/${shopSlug}?demo=walkin`;
  const qrImageUrl = `/api/qr/arrive/${shopSlug}?size=1000&format=square&demo=1&target=demo-walkin&v=${cacheKey}-${nonce}`;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setNonce(Date.now());
          setOpen(true);
        }}
        className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-sm text-[#0A0A0A] bg-[#C8F135] hover:bg-[#d4ff3f] transition-colors ${className}`}
      >
        <QrCode size={17} />
        <span className="text-xs font-black uppercase tracking-[0.14em] whitespace-nowrap">Show QR code</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full max-w-[min(92vw,680px)] bg-[#0A0A0A] border border-white/10 rounded-lg shadow-2xl p-4 sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 p-2 rounded-sm bg-white/5 text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close arrival QR"
            >
              <X size={20} />
            </button>

            <div className="pr-12 mb-4">
              <div className="text-[#C8F135] text-[10px] font-bold uppercase tracking-[0.2em] mb-2">
                Customer arrival demo
              </div>
              <h2 className="font-barlow font-black text-white text-3xl sm:text-4xl uppercase tracking-tight">
                Scan to check in
              </h2>
              <p className="text-white/40 text-sm mt-1">{displayName}</p>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-sm">
              <img
                src={qrImageUrl}
                alt={`Arrival QR for ${displayName}`}
                className="w-full aspect-square object-contain"
              />
            </div>

            <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="font-mono text-xs text-white/40 break-all">yourbarber.uk{arrivePath}</div>
              <Link
                href={arrivePath}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-lime inline-flex items-center justify-center gap-2 px-4 py-3 rounded-sm text-xs font-black uppercase tracking-[0.16em]"
              >
                <ExternalLink size={15} />
                Open
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
