'use client';

import { Download, Globe, Smartphone, Printer } from 'lucide-react';

interface Props {
  slug: string;
  shopName: string;
}

export function QRSection({ slug, shopName }: Props) {
  const qrUrl = `/api/qr/arrive/${slug}`;
  const downloadUrl = `${qrUrl}?format=portrait&type=pdf`;
  const stickerUrl = `${qrUrl}?format=square&type=pdf`;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <p className="text-white/50 text-sm leading-relaxed">
            Every shop gets a unique QR code. When clients scan this, they are taken directly to your arrival page where they can check in.
          </p>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3 text-white/40">
              <Smartphone size={18} className="shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-white/60">Digital Check-in</div>
                <p className="text-xs">Clients scan with their own phone. No hardware needed.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 text-white/40">
              <Printer size={18} className="shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-white/60">Print & Display</div>
                <p className="text-xs">Print these cards and display them on your mirror or front desk.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 text-white/40">
              <Globe size={18} className="shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-white/60">Your Link</div>
                <p className="text-xs font-mono">yourbarber.uk/arrive/{slug}</p>
              </div>
            </div>
          </div>

          <div className="pt-4 flex flex-wrap gap-3">
            <a 
              href={downloadUrl} 
              download={`YourBarber-CheckIn-${slug}.pdf`}
              className="btn-lime flex items-center gap-2 px-6 py-3"
            >
              <Download size={18} />
              <span className="font-barlow font-bold uppercase tracking-tight">Download Poster (A4/A5)</span>
            </a>
            
            <a 
              href={stickerUrl} 
              download={`YourBarber-Sticker-${slug}.pdf`}
              className="bg-white/5 hover:bg-white/10 text-white transition-colors flex items-center gap-2 px-6 py-3 rounded-sm"
            >
              <Download size={18} />
              <span className="font-barlow font-bold uppercase tracking-tight text-sm">Download Sticker (Square)</span>
            </a>
          </div>
        </div>

        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-lime/20 to-transparent rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative aspect-[1/1.414] bg-[#0a0a0a] border border-white/5 overflow-hidden shadow-2xl">
            <img 
              src={`${qrUrl}?size=600&format=portrait`} 
              alt={`Check-in QR preview for ${shopName}`} 
              className="w-full h-full object-contain p-8"
            />
          </div>
          <div className="mt-3 text-center">
            <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">Live Preview</p>
          </div>
        </div>
      </div>
    </div>
  );
}
