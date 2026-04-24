import { getRequiredSession } from '@/lib/session';
import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

const optInLabel: Record<string, string> = {
  yes: 'SMS reminders on', no: 'SMS reminders off', not_asked: 'Not yet asked',
};
const optInColor: Record<string, string> = {
  yes: 'bg-green-100 text-green-800', no: 'bg-neutral-100 text-neutral-600', not_asked: 'bg-yellow-100 text-yellow-800',
};

export default async function CustomerDetailPage({ params }: { params: { id: string } }) {
  const session = await getRequiredSession();

  const customer = await db.customer.findFirst({
    where: { id: params.id, shopId: session.shopId },
    include: {
      visits: {
        orderBy: { visitedAt: 'desc' },
        take: 10,
        include: { photos: { orderBy: { createdAt: 'asc' } }, barber: { select: { name: true } } },
      },
    },
  });
  if (!customer) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{customer.name ?? 'No name'}</h1>
          <p className="text-neutral-500 mt-1">{customer.phone}</p>
          <span className={`inline-block mt-2 text-xs font-medium px-2 py-1 rounded-full ${optInColor[customer.smsOptIn]}`}>
            {optInLabel[customer.smsOptIn]}
          </span>
        </div>
        <Link href={`/customers/${customer.id}/visit/new`}
          className="bg-black text-white px-5 py-3 rounded-xl text-sm font-medium">
          Record cut
        </Link>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Visit history</h2>
        {customer.visits.length === 0 && (
          <p className="text-sm text-neutral-400 py-4 text-center">No visits recorded yet.</p>
        )}
        {customer.visits.map(visit => (
          <div key={visit.id} className="bg-white border border-neutral-200 rounded-xl p-4 mb-3">
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium">{new Date(visit.visitedAt).toLocaleDateString('en-GB')}</span>
              <span className="text-sm text-neutral-500">by {visit.barber.name}</span>
            </div>
            {visit.photos.length > 0 && (
              <div className="flex gap-2 mb-3 flex-wrap">
                {visit.photos.map(photo => (
                  <div key={photo.id} className="relative w-20 h-20 rounded-lg overflow-hidden bg-neutral-100">
                    <Image src={photo.url} alt={photo.angle} fill className="object-cover" unoptimized />
                  </div>
                ))}
              </div>
            )}
            {visit.notes && (
              <p className="text-sm text-neutral-700 whitespace-pre-wrap">{visit.notes}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
