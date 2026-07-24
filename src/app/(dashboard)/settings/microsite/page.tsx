import { redirect } from 'next/navigation';
import { getRequiredSession } from '@/lib/session';
import { db } from '@/lib/db';
import { isMicrositeComplete } from '@/lib/microsite';
import { MicrositeForm } from './MicrositeForm';

export default async function MicrositePage() {
  const session = await getRequiredSession();
  if (session.role !== 'owner') redirect('/customers');

  const shop = await db.shop.findUnique({
    where: { id: session.shopId },
    select: {
      name: true, slug: true, address: true, phone: true, about: true,
      coverPhotoUrl: true, googleMapsUrl: true, bookingUrl: true, openingHours: true,
      instagramUrl: true, facebookUrl: true, xUrl: true,
      photos: { orderBy: { sortOrder: 'asc' }, select: { id: true, url: true, caption: true } },
      services: { where: { isActive: true }, orderBy: { sortOrder: 'asc' }, select: { id: true, name: true, price: true, duration: true, description: true } },
      products: { where: { isActive: true }, orderBy: { sortOrder: 'asc' }, select: { id: true, name: true, price: true, imageUrl: true, description: true } },
    },
  });

  if (!shop) redirect('/customers');

  const checklist = [
    { label: 'Address', done: Boolean(shop.address) },
    { label: 'Phone number', done: Boolean(shop.phone) },
    { label: 'Opening hours', done: Boolean(shop.openingHours) },
    { label: 'Cover photo', done: Boolean(shop.coverPhotoUrl) },
    { label: 'At least 1 service', done: shop.services.length > 0 },
  ];
  const complete = isMicrositeComplete(shop);

  return (
    <div className="max-w-2xl">
      <h1 className="font-['Barlow_Condensed'] font-black text-3xl uppercase tracking-wide text-white mb-8">Microsite</h1>

      {!complete && (
        <div className="bg-[#C8F135]/5 border border-[#C8F135]/20 rounded-lg px-4 py-4 mb-8">
          <p className="text-[#C8F135] text-sm font-bold font-['Barlow_Condensed'] uppercase tracking-wide mb-3">
            {checklist.filter(c => c.done).length} of {checklist.length} required fields set — your public microsite isn&apos;t live yet
          </p>
          <ul className="space-y-1.5">
            {checklist.map(c => (
              <li key={c.label} className="text-sm font-['Inter'] flex items-center gap-2">
                <span className={c.done ? 'text-[#C8F135]' : 'text-white/20'}>{c.done ? '✓' : '○'}</span>
                <span className={c.done ? 'text-white/70' : 'text-white/40'}>{c.label}</span>
              </li>
            ))}
          </ul>
          <p className="text-white/30 text-xs font-['Inter'] mt-3">
            Address and phone number are set on the main <a href="/settings" className="text-[#C8F135]/70 hover:text-[#C8F135] underline">Settings</a> page. Everything else is below.
          </p>
        </div>
      )}

      <MicrositeForm shop={shop as any} />
    </div>
  );
}
