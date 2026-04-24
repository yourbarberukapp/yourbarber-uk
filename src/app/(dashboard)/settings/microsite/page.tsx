import { redirect } from 'next/navigation';
import { getRequiredSession } from '@/lib/session';
import { db } from '@/lib/db';
import { MicrositeForm } from './MicrositeForm';

export default async function MicrositePage() {
  const session = await getRequiredSession();
  if (session.role !== 'owner') redirect('/customers');

  const shop = await db.shop.findUnique({
    where: { id: session.shopId },
    select: {
      name: true, slug: true, phone: true, about: true,
      coverPhotoUrl: true, googleMapsUrl: true, bookingUrl: true, openingHours: true,
      photos: { orderBy: { sortOrder: 'asc' }, select: { id: true, url: true, caption: true } },
      services: { where: { isActive: true }, orderBy: { sortOrder: 'asc' }, select: { id: true, name: true, price: true, duration: true, description: true } },
    },
  });

  if (!shop) redirect('/customers');

  return (
    <div className="max-w-2xl">
      <h1 className="font-['Barlow_Condensed'] font-black text-3xl uppercase tracking-wide text-white mb-8">Microsite</h1>
      <MicrositeForm shop={shop as any} />
    </div>
  );
}
