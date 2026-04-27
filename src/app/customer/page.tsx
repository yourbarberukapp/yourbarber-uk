'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Scissors, Clock, MapPin, X, Calendar, Settings, Plus } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import QueueStatus from '@/components/microsite/QueueStatus';
import Link from 'next/link';
import { Users } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.4, delay: i * 0.08, ease: 'easeOut' as const },
  }),
};

type Visit = {
  id: string;
  visitedAt: string;
  barber: { name: string };
};

type CustomerData = {
  id: string;
  name: string | null;
  accessCode: string | null;
  lastVisitAt: string | null;
  shop: { name: string; address: string | null; slug: string } | null;
  visits: Visit[];
  appointments: {
    id: string;
    scheduledAt: string;
    shop: { name: string; slug: string };
    barber: { name: string } | null;
    service: { name: string } | null;
  }[];
  familyMembers: { id: string; name: string }[];
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

function QuickCheckInCard({ visit, onCheckIn }: { visit: Visit; onCheckIn: (id: string) => void }) {
  return (
    <div className="bg-[#111] border border-[#C8F135]/20 rounded-lg p-5 mt-2">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-10 h-10 rounded-full bg-[#C8F135]/10 flex items-center justify-center flex-shrink-0">
          <Scissors size={18} className="text-[#C8F135]" />
        </div>
        <div>
          <div className="text-white font-barlow font-bold uppercase tracking-wider text-sm mb-0.5">
            Repeat Last Cut
          </div>
          <div className="text-white/40 text-xs font-inter">
            By {visit.barber.name} • {timeAgo(visit.visitedAt)}
          </div>
        </div>
      </div>
      <button
        onClick={() => onCheckIn(visit.id)}
        className="w-full py-3.5 bg-[#C8F135] text-black rounded-sm font-barlow uppercase tracking-[0.1em] text-[15px] font-black hover:bg-white transition-colors"
      >
        Check in Now
      </button>
    </div>
  );
}

export default function CustomerPortal() {
  const router = useRouter();
  const [data, setData] = useState<CustomerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [generatingQr, setGeneratingQr] = useState(false);
  const [selectionModal, setSelectionModal] = useState<{ visitId: string } | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<string[]>(['me']); // 'me' for the customer themselves

  async function generateCheckIn(visitId: string) {
    if (generatingQr) return;
    
    // If they have family, show the selection modal first
    if (data?.familyMembers && data.familyMembers.length > 0 && !selectionModal) {
      setSelectionModal({ visitId });
      return;
    }

    setGeneratingQr(true);
    try {
      const familyMemberIds = selectedMembers.filter(m => m !== 'me');
      const includesSelf = selectedMembers.includes('me');

      const res = await fetch('/api/customer/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          referenceVisitId: visitId,
          familyMemberIds: familyMemberIds,
          includeCustomer: includesSelf 
        }),
      });
      if (res.ok) {
        const { qrToken } = await res.json();
        setQrToken(qrToken);
        setSelectionModal(null);
      } else {
        alert('Failed to generate Check-In QR');
      }
    } catch {
      alert('Error generating QR');
    } finally {
      setGeneratingQr(false);
    }
  }

  useEffect(() => {
    fetch('/api/customer/me')
      .then((r) => {
        if (r.status === 401) {
          router.push('/customer/login');
          return null;
        }
        if (!r.ok) return null;
        return r.json();
      })
      .then((d) => {
        if (d && !d.error) {
          setData(d);
        } else if (d?.error) {
          console.error('Customer data fetch error:', d.error);
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-white/30 font-inter text-sm">Loading…</div>
      </div>
    );
  }

  if (!data?.shop?.slug) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-6">
        <div className="max-w-sm text-center">
          <h1 className="text-white font-barlow font-black text-2xl uppercase mb-3">Profile unavailable</h1>
          <p className="text-white/40 text-sm font-inter mb-6">
            We could not find a shop linked to this customer profile.
          </p>
          <button
            onClick={() => router.push('/customer/login')}
            className="bg-[#C8F135] text-black px-5 py-3 rounded-sm font-barlow font-black uppercase tracking-widest text-xs"
          >
            Log in again
          </button>
        </div>
      </div>
    );
  }

  const shop = data.shop;

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Modal overlay */}
      {qrToken && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 p-6 backdrop-blur-md">
          <button 
            onClick={() => setQrToken(null)}
            className="absolute top-6 right-6 text-white/50 hover:text-white p-2"
          >
            <X size={32} />
          </button>
          
          <h2 className="text-white font-barlow text-4xl font-black uppercase tracking-tight mb-8 text-center leading-none">
            Show this<br/>to your barber
          </h2>
          
          <div className="bg-white p-4 rounded-xl shadow-[0_0_40px_rgba(200,241,53,0.15)]">
             <QRCodeSVG 
               value={`https://yourbarber.uk/checkin/${qrToken}`} 
               size={280} 
               level="H" 
               includeMargin={false} 
             />
          </div>
          
          <p className="text-white/40 font-inter text-sm mt-8 text-center max-w-[280px]">
            Your barber will scan this to instantly load your preferred style and cut history. Valid for 2 hours.
          </p>
        </div>
      )}

      {/* Selection Modal */}
      {selectionModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ y: 100 }} animate={{ y: 0 }}
            className="bg-[#111] border border-white/10 w-full max-w-sm rounded-2xl p-6 shadow-2xl"
          >
            <h3 className="font-barlow font-black text-2xl uppercase text-white mb-2">Who is getting a cut?</h3>
            <p className="text-white/40 text-xs font-inter mb-6 uppercase tracking-wider">Select everyone having a haircut today</p>
            
            <div className="space-y-2 mb-8">
              <label className={`flex items-center gap-3 p-4 rounded-xl border transition-all cursor-pointer ${selectedMembers.includes('me') ? 'bg-[#C8F135]/10 border-[#C8F135]' : 'bg-white/5 border-white/5'}`}>
                <input 
                  type="checkbox" className="hidden"
                  checked={selectedMembers.includes('me')}
                  onChange={() => {
                    if (selectedMembers.includes('me')) {
                      setSelectedMembers(selectedMembers.filter(m => m !== 'me'));
                    } else {
                      setSelectedMembers([...selectedMembers, 'me']);
                    }
                  }}
                />
                <div className={`w-5 h-5 rounded flex items-center justify-center border-2 ${selectedMembers.includes('me') ? 'bg-[#C8F135] border-[#C8F135]' : 'border-white/20'}`}>
                  {selectedMembers.includes('me') && <X size={14} className="text-black stroke-[3px]" />}
                </div>
                <span className={`font-inter font-bold text-sm ${selectedMembers.includes('me') ? 'text-[#C8F135]' : 'text-white/60'}`}>
                  {data.name || 'Me'}
                </span>
              </label>

              {data.familyMembers.map((member) => (
                <label key={member.id} className={`flex items-center gap-3 p-4 rounded-xl border transition-all cursor-pointer ${selectedMembers.includes(member.id) ? 'bg-[#C8F135]/10 border-[#C8F135]' : 'bg-white/5 border-white/5'}`}>
                  <input 
                    type="checkbox" className="hidden"
                    checked={selectedMembers.includes(member.id)}
                    onChange={() => {
                      if (selectedMembers.includes(member.id)) {
                        setSelectedMembers(selectedMembers.filter(m => m !== member.id));
                      } else {
                        setSelectedMembers([...selectedMembers, member.id]);
                      }
                    }}
                  />
                  <div className={`w-5 h-5 rounded flex items-center justify-center border-2 ${selectedMembers.includes(member.id) ? 'bg-[#C8F135] border-[#C8F135]' : 'border-white/20'}`}>
                    {selectedMembers.includes(member.id) && <X size={14} className="text-black stroke-[3px]" />}
                  </div>
                  <span className={`font-inter font-bold text-sm ${selectedMembers.includes(member.id) ? 'text-[#C8F135]' : 'text-white/60'}`}>
                    {member.name}
                  </span>
                </label>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setSelectionModal(null)}
                className="py-4 rounded-xl border border-white/10 text-white/40 font-barlow font-black uppercase tracking-widest text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={() => generateCheckIn(selectionModal.visitId)}
                disabled={selectedMembers.length === 0}
                className="py-4 rounded-xl bg-[#C8F135] text-black font-barlow font-black uppercase tracking-widest text-sm disabled:opacity-50"
              >
                Confirm
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <div className="border-b border-white/8 bg-[#0f0f0f]">
        <div className="max-w-lg mx-auto px-5 py-4 flex items-center justify-between">
          <span className="font-barlow font-black text-xl uppercase tracking-tight text-white">
            Your<span className="text-[#C8F135]">Barber</span>
          </span>
          {data.accessCode && (
            <span className="badge-lime">Code: {data.accessCode}</span>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 py-6 space-y-4">
        <motion.div
          initial="hidden" animate="visible" custom={-0.5} variants={fadeUp}
        >
          <QueueStatus shopSlug={shop.slug} />
        </motion.div>

        <motion.div
          initial="hidden" animate="visible" custom={0} variants={fadeUp}
          className="bg-[#111] border border-white/8 rounded-lg p-5"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-[#C8F135]/10 flex items-center justify-center flex-shrink-0">
              <span className="text-[#C8F135] font-barlow font-black text-lg">
                {data.name ? data.name.split(' ').map((n) => n[0]).join('').slice(0, 2) : '?'}
              </span>
            </div>
            <div>
              <h2 className="font-barlow font-black text-2xl uppercase text-white leading-none">
                {data.name ?? 'Hey there'}
              </h2>
              <div className="flex items-center gap-1.5 mt-1.5">
                <Scissors size={11} className="text-[#C8F135]/60" />
                <span className="text-white/50 text-xs font-inter">{shop.name}</span>
              </div>
              {shop.address && (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <MapPin size={11} className="text-white/25" />
                  <span className="text-white/30 text-xs font-inter">{shop.address}</span>
                </div>
              )}
            </div>
          </div>
          {data.lastVisitAt && (
            <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2">
              <Clock size={12} className="text-white/25" />
              <span className="text-white/40 text-xs font-inter">Last cut: {timeAgo(data.lastVisitAt)}</span>
            </div>
          )}
        </motion.div>

        {data.visits.length > 0 && (
          <motion.div initial="hidden" animate="visible" custom={1} variants={fadeUp}>
            <QuickCheckInCard visit={data.visits[0]} onCheckIn={generateCheckIn} />
          </motion.div>
        )}

        {data.appointments.length > 0 && (
          <motion.div
            initial="hidden" animate="visible" custom={1.5} variants={fadeUp}
            className="bg-[#C8F135]/5 border border-[#C8F135]/20 rounded-lg p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#C8F135]/20 flex items-center justify-center">
                  <Calendar size={14} className="text-[#C8F135]" />
                </div>
                <span className="text-white font-barlow font-bold uppercase tracking-wider text-sm">Upcoming Appointment</span>
              </div>
              <button 
                onClick={async () => {
                  if (confirm('Cancel this appointment?')) {
                    const res = await fetch(`/api/appointments/${data.appointments[0].id}/cancel`, { method: 'PATCH' });
                    if (res.ok) window.location.reload();
                    else alert('Failed to cancel');
                  }
                }}
                className="text-[10px] font-bold uppercase tracking-widest text-white/30 hover:text-red-400 transition-colors px-2 py-1 border border-white/5 rounded-sm"
              >
                Cancel
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="text-white/60 text-xs font-inter uppercase tracking-widest">Date</div>
                <div className="text-white font-bold font-inter text-sm">
                  {new Date(data.appointments[0].scheduledAt).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div className="text-white/60 text-xs font-inter uppercase tracking-widest">Time</div>
                <div className="text-white font-bold font-inter text-sm">
                  {new Date(data.appointments[0].scheduledAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div className="text-white/60 text-xs font-inter uppercase tracking-widest">Barber</div>
                <div className="text-white font-bold font-inter text-sm">{data.appointments[0].barber?.name ?? 'Anyone'}</div>
              </div>
            </div>
          </motion.div>
        )}

        <motion.div initial="hidden" animate="visible" custom={2} variants={fadeUp} className="mt-8">
          <div className="font-barlow font-bold text-sm uppercase tracking-widest text-[#C8F135] mb-5">
            Quick Actions
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => router.push(`/shop/${shop.slug}/book`)}
              className="col-span-2 bg-[#C8F135]/10 border border-[#C8F135]/30 rounded-lg p-5 text-left hover:bg-[#C8F135]/20 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Plus className="text-[#C8F135]" size={18} />
                    <div className="text-white font-barlow font-bold uppercase tracking-wider text-base">Book New Cut</div>
                  </div>
                  <div className="text-white/40 text-xs font-inter">Save your spot at {shop.name}</div>
                </div>
                <span className="text-[#C8F135] group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </button>
            <button
              onClick={() => router.push('/customer/history')}
              className="bg-[#111] border border-white/8 rounded-lg p-4 text-left hover:bg-white/5 transition-colors"
            >
              <Clock className="text-white/40 mb-3" size={20} />
              <div className="text-white font-inter font-medium text-sm">Full History</div>
              <div className="text-white/40 text-xs mt-1">Photos & Notes</div>
            </button>
            <button
              onClick={() => router.push('/customer/preferences')}
              className="bg-[#111] border border-white/8 rounded-lg p-4 text-left hover:bg-white/5 transition-colors"
            >
              <Settings className="text-white/40 mb-3" size={20} />
              <div className="text-white font-inter font-medium text-sm">Preferences</div>
              <div className="text-white/40 text-xs mt-1">SMS & Reminders</div>
            </button>
            <button
              onClick={() => router.push('/customer/family')}
              className="bg-[#111] border border-white/8 rounded-lg p-4 text-left hover:bg-white/5 transition-colors"
            >
              <Users className="text-[#C8F135] mb-3" size={20} />
              <div className="text-white font-inter font-medium text-sm">Family & Sharing</div>
              <div className="text-white/40 text-xs mt-1">Manage children & partners</div>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
