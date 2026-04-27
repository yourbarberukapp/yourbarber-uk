import { getRequiredSession } from '@/lib/session';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import { SettingsForm } from './SettingsForm';
import { StylesManager } from './StylesManager';
import { QRSection } from './QRSection';

export default async function SettingsPage() {
  const session = await getRequiredSession();
  if (session.role !== 'owner') redirect('/customers');

  const shop = await db.shop.findUnique({
    where: { id: session.shopId },
    select: { name: true, address: true, logoUrl: true, slug: true, shopType: true, allowBarberReminders: true, defaultCutTime: true, googleReviewUrl: true },
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      <div>
        <h1 className="font-barlow font-black text-4xl uppercase text-white tracking-tight">
          Shop Settings
        </h1>
        <p className="text-white/40 text-sm mt-1">
          Configure your shop profile and cut styles.
        </p>
      </div>

      <section>
        <h2 className="font-barlow font-bold text-lg uppercase tracking-widest text-white/50 mb-5">
          Profile
        </h2>
        <div className="max-w-md">
          {shop && <SettingsForm shop={shop} />}
        </div>
      </section>

      <section>
        <h2 className="font-barlow font-bold text-lg uppercase tracking-widest text-white/50 mb-1">
          Check-in QR
        </h2>
        <p className="text-white/30 text-sm mb-8">
          The physical gateway to your shop. Print these and place them where clients can easily scan them.
        </p>
        {shop && <QRSection slug={shop.slug} shopName={shop.name} />}
      </section>

      <section>
        <h2 className="font-barlow font-bold text-lg uppercase tracking-widest text-white/50 mb-1">
          Cut Styles
        </h2>
        <p className="text-white/30 text-sm mb-5">
          These appear in the record-cut form. Pick your shop type to auto-load the right defaults, then add or hide as needed.
        </p>
        {shop && <StylesManager initialShopType={shop.shopType ?? null} />}
      </section>
    </div>
  );
}
