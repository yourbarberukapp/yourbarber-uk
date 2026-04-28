import { db } from '@/lib/db';
import StartCutButton from './StartCutButton';
import Link from 'next/link';
import { Home } from 'lucide-react';

export default async function CheckInPage({ params }: { params: { qrToken: string } }) {
  const checkIn = await db.checkIn.findUnique({
    where: { qrToken: params.qrToken },
    include: {
      customer: {
        include: {
          shop: true,
          visits: {
            orderBy: { visitedAt: 'desc' },
            take: 5,
            include: { photos: true, barber: true },
          },
        },
      },
      familyMember: true,
    },
  });

  if (!checkIn || checkIn.expiresAt < new Date()) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-8">
        <h1 className="text-white text-2xl font-barlow uppercase tracking-widest text-center">
          QR Code Expired or Invalid
        </h1>
      </div>
    );
  }

  // Mark as scanned if not already
  if (!checkIn.scannedAt) {
    await db.checkIn.update({
      where: { id: checkIn.id },
      data: { scannedAt: new Date() },
    });
  }

  const customer = checkIn.customer;
  const referenceVisit = customer.visits.find((v: any) => v.id === checkIn.referenceVisitId);
  const lastVisit = customer.visits[0];

  // Group handling
  const groupMemberIds = checkIn.groupMemberIds ? checkIn.groupMemberIds.split(',') : [];
  const groupMembers = groupMemberIds.length > 0 
    ? await db.familyMember.findMany({ where: { id: { in: groupMemberIds } } })
    : [];
  
  const people = [];
  if (checkIn.includeCustomer) {
    people.push({ id: 'me', name: customer.name, type: 'customer' });
  }
  groupMembers.forEach(m => {
    people.push({ id: m.id, name: m.name, type: 'family' });
  });

  // If checkIn.familyMemberId was set (legacy/single), and not in group, add it
  if (checkIn.familyMemberId && !groupMemberIds.includes(checkIn.familyMemberId)) {
    const fm = await db.familyMember.findUnique({ where: { id: checkIn.familyMemberId } });
    if (fm) people.push({ id: fm.id, name: fm.name, type: 'family' });
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col pb-24">
      {/* Top Bar */}
      <div className="pt-12 px-8 pb-6 border-b border-white/10 bg-[#111] relative">
        <Link 
          href="/" 
          className="absolute top-4 right-8 flex items-center gap-2 text-white/30 hover:text-[#C8F135] transition-colors text-xs font-bold uppercase tracking-widest"
        >
          <Home size={14} />
          <span>Home</span>
        </Link>
        <h1 className="font-barlow font-black text-6xl uppercase tracking-tighter leading-none mb-2">
          {people.length > 1 ? 'Group Check-in' : (people[0]?.name || 'Customer')}
        </h1>
        <div className="flex flex-col gap-1 text-white/50 font-inter text-lg">
          {people.length > 1 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {people.map(p => (
                <span key={p.id} className="px-3 py-1 bg-[#C8F135]/10 text-[#C8F135] rounded-full text-sm font-bold border border-[#C8F135]/20">
                  {p.name}
                </span>
              ))}
            </div>
          )}
          <div className="flex items-center gap-4">
            {people.length === 1 && people[0].type === 'family' && (
              <>
                <span className="text-[#C8F135]/80 font-bold">Account: {customer.name}</span>
                <span>&bull;</span>
              </>
            )}
            <span>{customer.shop.name}</span>
            <span>&bull;</span>
            <span>Last cut: {lastVisit ? new Date(lastVisit.visitedAt).toLocaleDateString() : 'Never'}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-12">
        {/* Reference Visit Hero */}
        {referenceVisit && referenceVisit.photos.length > 0 && (
          <div>
            <h2 className="font-barlow font-bold text-xl uppercase tracking-widest text-[#C8F135] mb-4">
              Requested Style
            </h2>
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-black border border-white/10">
              <img 
                src={referenceVisit.photos.find((p: any) => p.angle === 'front')?.url || referenceVisit.photos[0].url} 
                alt="Reference Style" 
                className="w-full h-full object-cover"
              />
              {referenceVisit.cutDetails && typeof referenceVisit.cutDetails === 'object' && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-6 pt-12">
                  <div className="text-white font-barlow font-bold text-2xl uppercase tracking-wider">
                    {((referenceVisit.cutDetails as any).style || []).join(', ')}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Last Visit Notes */}
        {lastVisit && (lastVisit.notes || lastVisit.recommendation) && (
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
            {lastVisit.recommendation && (
              <div className="mb-6">
                <h3 className="font-barlow font-bold text-sm uppercase tracking-widest text-[#C8F135] mb-2">
                  Previous Recommendation
                </h3>
                <p className="text-white/80 font-inter text-lg">{lastVisit.recommendation}</p>
              </div>
            )}
            {lastVisit.notes && (
              <div>
                <h3 className="font-barlow font-bold text-sm uppercase tracking-widest text-white/30 mb-2">
                  Barber Notes ({lastVisit.barber.name})
                </h3>
                <p className="text-white/60 font-inter text-lg">{lastVisit.notes}</p>
              </div>
            )}
          </div>
        )}

        {/* Last 5 Cuts Strip */}
        {customer.visits.length > 0 && (
          <div>
            <h2 className="font-barlow font-bold text-xl uppercase tracking-widest text-white/50 mb-4">
              Recent History
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
              {customer.visits.map((visit: any) => {
                const frontPhoto = visit.photos.find((p: any) => p.angle === 'front') || visit.photos[0];
                return (
                  <div key={visit.id} className="snap-start flex-none w-64 bg-[#111] border border-white/10 rounded-xl overflow-hidden">
                    {frontPhoto ? (
                      <div className="aspect-square bg-black">
                        <img src={frontPhoto.url} className="w-full h-full object-cover" alt="Cut" />
                      </div>
                    ) : (
                      <div className="aspect-square bg-black flex items-center justify-center text-white/20">
                        No Photo
                      </div>
                    )}
                    <div className="p-4">
                      <div className="font-inter font-medium text-white">
                        {new Date(visit.visitedAt).toLocaleDateString()}
                      </div>
                      <div className="font-inter text-sm text-white/40 mt-1">
                        By {visit.barber.name}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Fixed Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0A0A0A]/90 backdrop-blur-xl border-t border-white/10 p-6">
        <StartCutButton 
          customerId={customer.id} 
          familyMemberIds={groupMemberIds}
          includeCustomer={checkIn.includeCustomer}
        />
      </div>
    </div>
  );
}
