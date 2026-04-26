import { db } from '@/lib/db';
import StartCutButton from './StartCutButton';

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

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col pb-24">
      {/* Top Bar */}
      <div className="pt-12 px-8 pb-6 border-b border-white/10 bg-[#111]">
        <h1 className="font-barlow font-black text-6xl uppercase tracking-tighter leading-none mb-2">
          {customer.name || 'Customer'}
        </h1>
        <div className="flex items-center gap-4 text-white/50 font-inter text-lg">
          <span>{customer.shop.name}</span>
          <span>&bull;</span>
          <span>Last cut: {lastVisit ? new Date(lastVisit.visitedAt).toLocaleDateString() : 'Never'}</span>
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
        <StartCutButton customerId={customer.id} />
      </div>
    </div>
  );
}
