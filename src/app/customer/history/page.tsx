'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Scissors, Clock, MapPin, ChevronDown, ChevronUp, Star, X, ThumbsUp, ThumbsDown } from 'lucide-react';

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
  cutRating: string | null;
  barber: { name: string };
  photos: { id: string; url: string; angle: string }[];
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
    ...(cut.style || []),
    cut.sidesGrade ? `Sides: ${cut.sidesGrade}` : null,
    cut.topLength ? `Top: ${cut.topLength}` : null,
    cut.beard && cut.beard !== 'Not done' ? `Beard: ${cut.beard}` : null,
    ...(cut.products || []).filter((p: string) => p !== 'None'),
    ...(cut.techniques || []),
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

function VisitCard({ 
  visit, 
  index, 
  onPhotoClick 
}: { 
  visit: Visit; 
  index: number; 
  onPhotoClick: (photos: Visit['photos'], startIndex: number) => void 
}) {
  const [expanded, setExpanded] = useState(index === 0);
  const [rating, setRating] = useState(visit.cutRating);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const angleLabel: Record<string, string> = {
    front: 'Front', back: 'Back', left: 'Left side', right: 'Right side',
  };

  const handleRate = async (newRating: 'positive' | 'negative') => {
    if (rating || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/customer/visits/${visit.id}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: newRating }),
      });
      if (res.ok) {
        setRating(newRating);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial="hidden" animate="visible" custom={index + 1} variants={fadeUp}
      className="bg-[#111] border border-white/8 rounded-lg overflow-hidden mb-4"
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
            <div className="text-white text-sm font-['Inter'] font-medium flex items-center gap-2">
              Cut by {visit.barber?.name}
              {rating === 'positive' && <ThumbsUp size={12} className="text-[#C8F135]" />}
              {rating === 'negative' && <ThumbsDown size={12} className="text-red-400" />}
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

          {visit.photos && visit.photos.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mt-3 mb-3">
              {visit.photos.map((photo, pidx) => (
                <button 
                  key={photo.id} 
                  onClick={() => onPhotoClick(visit.photos, pidx)}
                  className="relative aspect-square rounded overflow-hidden bg-[#0A0A0A] block w-full"
                >
                  <img src={photo.url} alt={angleLabel[photo.angle] ?? photo.angle} className="w-full h-full object-cover" />
                  <span className="absolute bottom-1.5 left-1.5 text-[10px] font-barlow font-bold uppercase tracking-wide bg-black/60 text-white/80 px-1.5 py-0.5 rounded-sm">
                    {angleLabel[photo.angle] ?? photo.angle}
                  </span>
                </button>
              ))}
            </div>
          )}

          {visit.notes && (
            <div className="bg-[#0A0A0A] rounded px-4 py-3 mt-2">
                <div className="text-xs text-white/30 uppercase tracking-widest font-barlow font-bold mb-1.5">
                  Recommendation
                </div>
                <div className="text-white/80 font-inter text-[15px] leading-relaxed">{visit.notes}</div>
            </div>
          )}

          {!visit.recommendation && !visit.cutDetails && (!visit.photos || !visit.photos.length) && !visit.notes && (
            <p className="text-white/25 text-sm font-inter mt-4">No details recorded for this visit.</p>
          )}

          {!rating && (
            <div className="mt-5 pt-5 border-t border-white/5 flex items-center justify-between">
              <span className="text-sm font-inter text-white/50">How was this cut?</span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleRate('positive')}
                  disabled={isSubmitting}
                  className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#C8F135]/10 hover:border-[#C8F135]/30 hover:text-[#C8F135] transition-colors text-white/60"
                >
                  <ThumbsUp size={16} />
                </button>
                <button
                  onClick={() => handleRate('negative')}
                  disabled={isSubmitting}
                  className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 transition-colors text-white/60"
                >
                  <ThumbsDown size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

export default function HistoryPage() {
  const router = useRouter();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);

  // Lightbox State
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxPhotos, setLightboxPhotos] = useState<{ id: string; url: string; angle: string }[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    fetch('/api/customer/me')
      .then((r) => {
        if (r.status === 401) { router.push('/customer/login'); return null; }
        return r.json();
      })
      .then((d) => { 
        if (d && d.visits) {
          // You might want a dedicated endpoint for full history, but we use 'me' for now
          setVisits(d.visits);
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  const openLightbox = (photos: Visit['photos'], startIndex: number) => {
    setLightboxPhotos(photos);
    setLightboxIndex(startIndex);
    setLightboxOpen(true);
  };

  const closeLightbox = () => setLightboxOpen(false);
  const nextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLightboxIndex((prev) => (prev + 1) % lightboxPhotos.length);
  };
  const prevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLightboxIndex((prev) => (prev - 1 + lightboxPhotos.length) % lightboxPhotos.length);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-white/30 font-inter text-sm">Loading history…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <div className="border-b border-white/8 bg-[#0f0f0f] sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-5 py-4">
          <h1 className="font-barlow font-black text-xl uppercase tracking-tight text-white">
            Cut <span className="text-white/50">History</span>
          </h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 py-6">
        {visits.length === 0 ? (
          <div className="bg-[#111] border border-white/8 rounded-lg px-5 py-10 text-center">
            <p className="text-white/40 text-[15px] font-inter">No visits recorded yet.</p>
          </div>
        ) : (
          visits.map((visit, i) => (
            <VisitCard key={visit.id} visit={visit} index={i} onPhotoClick={openLightbox} />
          ))
        )}
      </div>

      <AnimatePresence>
        {lightboxOpen && lightboxPhotos.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-center items-center"
            onClick={closeLightbox}
          >
            <button className="absolute top-6 right-6 text-white/50 hover:text-white p-2 z-50">
              <X size={32} />
            </button>

            <div className="relative w-full max-w-lg aspect-[3/4] flex items-center justify-center">
              <img 
                src={lightboxPhotos[lightboxIndex].url} 
                alt="Cut angle" 
                className="w-full h-full object-contain"
              />
              
              <div className="absolute top-4 left-4 bg-black/60 px-3 py-1 rounded font-barlow font-bold text-sm uppercase tracking-widest text-[#C8F135]">
                {lightboxPhotos[lightboxIndex].angle} View
              </div>

              {lightboxPhotos.length > 1 && (
                <>
                  <button 
                    onClick={prevPhoto}
                    className="absolute left-4 w-12 h-12 bg-black/50 rounded-full flex items-center justify-center text-white/80 hover:bg-[#C8F135] hover:text-black transition-colors"
                  >
                    <ChevronDown size={24} className="rotate-90" />
                  </button>
                  <button 
                    onClick={nextPhoto}
                    className="absolute right-4 w-12 h-12 bg-black/50 rounded-full flex items-center justify-center text-white/80 hover:bg-[#C8F135] hover:text-black transition-colors"
                  >
                    <ChevronDown size={24} className="-rotate-90" />
                  </button>
                </>
              )}
            </div>
            
            {lightboxPhotos.length > 1 && (
              <div className="flex gap-2 mt-6">
                {lightboxPhotos.map((_, idx) => (
                  <div 
                    key={idx} 
                    className={`h-1.5 rounded-full transition-all ${idx === lightboxIndex ? 'w-8 bg-[#C8F135]' : 'w-2 bg-white/20'}`}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
