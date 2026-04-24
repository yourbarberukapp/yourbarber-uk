'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Scissors, Clock, MapPin, ChevronDown, ChevronUp, Star } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.4, delay: i * 0.08, ease: 'easeOut' as const },
  }),
};

type CutDetails = {
  style: string[];
  sidesGrade: string;
  topLength: string;
  beard: string;
  products: string[];
  techniques: string[];
};

type Visit = {
  id: string;
  visitedAt: string;
  notes: string | null;
  cutDetails: CutDetails | null;
  recommendation: string | null;
  barber: { name: string };
  photos: { id: string; url: string; angle: string }[];
};

type CustomerData = {
  id: string;
  name: string | null;
  accessCode: string | null;
  lastVisitAt: string | null;
  shop: { name: string; address: string | null };
  visits: Visit[];
};

function timeAgo(date: string) {
  const days = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 14) return '1 week ago';
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 60) return '1 month ago';
  return `${Math.floor(days / 30)} months ago`;
}

function Chip({ label }: { label: string }) {
  return (
    <span style={{
      display: 'inline-block',
      background: 'rgba(200,241,53,0.12)',
      color: '#C8F135',
      border: '1px solid rgba(200,241,53,0.25)',
      borderRadius: 4,
      padding: '0.2rem 0.55rem',
      fontSize: '0.7rem',
      fontWeight: 700,
      fontFamily: 'var(--font-barlow, sans-serif)',
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      marginRight: 4,
      marginBottom: 4,
    }}>
      {label}
    </span>
  );
}

function CutSummary({ cut }: { cut: CutDetails }) {
  const allChips = [
    ...cut.style,
    cut.sidesGrade ? `Sides: ${cut.sidesGrade}` : null,
    cut.topLength ? `Top: ${cut.topLength}` : null,
    cut.beard && cut.beard !== 'Not done' ? `Beard: ${cut.beard}` : null,
    ...cut.products.filter(p => p !== 'None').map(p => p),
    ...cut.techniques,
  ].filter(Boolean) as string[];

  if (allChips.length === 0) return null;
  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <div style={{ marginBottom: '0.35rem', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-barlow, sans-serif)' }}>Your cut</div>
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        {allChips.map(chip => <Chip key={chip} label={chip} />)}
      </div>
    </div>
  );
}

function VisitCard({ visit, index }: { visit: Visit; index: number }) {
  const [expanded, setExpanded] = useState(index === 0);
  const angleLabel: Record<string, string> = {
    front: 'Front', back: 'Back', left: 'Left side', right: 'Right side',
  };

  return (
    <motion.div
      initial="hidden" animate="visible" custom={index + 2} variants={fadeUp}
      className="bg-[#111] border border-white/8 rounded-lg overflow-hidden"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/3 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#C8F135]/10 flex items-center justify-center flex-shrink-0">
            <Scissors size={13} className="text-[#C8F135]" />
          </div>
          <div className="text-left">
            <div className="text-white text-sm font-['Inter'] font-medium">
              Cut by {visit.barber.name}
            </div>
            <div className="text-white/35 text-xs font-['Inter']">
              {timeAgo(visit.visitedAt)} · {new Date(visit.visitedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          </div>
        </div>
        {expanded
          ? <ChevronUp size={16} className="text-white/30" />
          : <ChevronDown size={16} className="text-white/30" />}
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-white/5">
          {visit.recommendation && (
            <div style={{
              background: 'rgba(200,241,53,0.07)',
              border: '1px solid rgba(200,241,53,0.2)',
              borderRadius: 6,
              padding: '0.75rem 1rem',
              marginTop: '1rem',
              marginBottom: '0.875rem',
              display: 'flex',
              gap: '0.625rem',
              alignItems: 'flex-start',
            }}>
              <Star size={13} style={{ color: '#C8F135', marginTop: 2, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(200,241,53,0.7)', marginBottom: 3, fontFamily: 'var(--font-barlow, sans-serif)' }}>Barber says</div>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem', fontFamily: 'var(--font-inter, sans-serif)', lineHeight: 1.5 }}>{visit.recommendation}</p>
              </div>
            </div>
          )}

          {visit.cutDetails && <CutSummary cut={visit.cutDetails} />}

          {visit.photos.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mt-3 mb-3">
              {visit.photos.map((photo) => (
                <div key={photo.id} className="relative aspect-square rounded overflow-hidden bg-[#0A0A0A]">
                  <img src={photo.url} alt={angleLabel[photo.angle] ?? photo.angle} className="w-full h-full object-cover" />
                  <span className="absolute bottom-1.5 left-1.5 text-[10px] font-['Barlow_Condensed'] font-bold uppercase tracking-wide bg-black/60 text-white/80 px-1.5 py-0.5 rounded-sm">
                    {angleLabel[photo.angle] ?? photo.angle}
                  </span>
                </div>
              ))}
            </div>
          )}

          {visit.notes && (
            <div className="bg-[#0A0A0A] rounded px-4 py-3 mt-2">
              <div className="text-white/30 text-[10px] font-['Barlow_Condensed'] font-bold uppercase tracking-widest mb-1.5">Notes</div>
              <p className="text-white/60 text-sm font-['Inter'] leading-relaxed">{visit.notes}</p>
            </div>
          )}

          {!visit.recommendation && !visit.cutDetails && !visit.photos.length && !visit.notes && (
            <p className="text-white/25 text-sm font-['Inter'] mt-4">No details recorded for this visit.</p>
          )}
        </div>
      )}
    </motion.div>
  );
}

export default function CustomerPortal() {
  const router = useRouter();
  const [data, setData] = useState<CustomerData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/customer/me')
      .then((r) => {
        if (r.status === 401) { router.push('/customer/login'); return null; }
        return r.json();
      })
      .then((d) => { if (d) setData(d); })
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-white/30 font-['Inter'] text-sm">Loading…</div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <div className="border-b border-white/8 bg-[#0f0f0f]">
        <div className="max-w-lg mx-auto px-5 py-4 flex items-center justify-between">
          <span className="font-['Barlow_Condensed'] font-black text-xl uppercase tracking-tight text-white">
            Your<span className="text-[#C8F135]">Barber</span>
          </span>
          {data.accessCode && (
            <span className="badge-lime">Code: {data.accessCode}</span>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 py-6 space-y-4">
        <motion.div
          initial="hidden" animate="visible" custom={0} variants={fadeUp}
          className="bg-[#111] border border-white/8 rounded-lg p-5"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-[#C8F135]/10 flex items-center justify-center flex-shrink-0">
              <span className="text-[#C8F135] font-['Barlow_Condensed'] font-black text-lg">
                {data.name ? data.name.split(' ').map((n) => n[0]).join('').slice(0, 2) : '?'}
              </span>
            </div>
            <div>
              <h2 className="font-['Barlow_Condensed'] font-black text-2xl uppercase text-white leading-none">
                {data.name ?? 'Hey there'}
              </h2>
              <div className="flex items-center gap-1.5 mt-1.5">
                <Scissors size={11} className="text-[#C8F135]/60" />
                <span className="text-white/50 text-xs font-['Inter']">{data.shop.name}</span>
              </div>
              {data.shop.address && (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <MapPin size={11} className="text-white/25" />
                  <span className="text-white/30 text-xs font-['Inter']">{data.shop.address}</span>
                </div>
              )}
            </div>
          </div>
          {data.lastVisitAt && (
            <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2">
              <Clock size={12} className="text-white/25" />
              <span className="text-white/40 text-xs font-['Inter']">Last cut: {timeAgo(data.lastVisitAt)}</span>
            </div>
          )}
        </motion.div>

        <motion.div initial="hidden" animate="visible" custom={1} variants={fadeUp}>
          <h3 className="font-['Barlow_Condensed'] font-bold text-sm uppercase tracking-widest text-white/35 mb-3">
            Your cuts
          </h3>
        </motion.div>

        {data.visits.length === 0 ? (
          <motion.div
            initial="hidden" animate="visible" custom={2} variants={fadeUp}
            className="bg-[#111] border border-white/8 rounded-lg px-5 py-10 text-center"
          >
            <p className="text-white/25 font-['Inter'] text-sm">No visits recorded yet.</p>
          </motion.div>
        ) : (
          data.visits.map((visit, i) => (
            <VisitCard key={visit.id} visit={visit} index={i} />
          ))
        )}
      </div>
    </div>
  );
}
