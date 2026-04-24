import { getRequiredSession } from '@/lib/session';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import { SettingsForm } from './SettingsForm';

export default async function SettingsPage() {
  const session = await getRequiredSession();
  if (session.role !== 'owner') redirect('/customers');

  const shop = await db.shop.findUnique({
    where: { id: session.shopId },
    select: { name: true, address: true, logoUrl: true, slug: true },
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="font-barlow font-black text-4xl uppercase text-white tracking-tight">
          Shop Settings
        </h1>
        <p className="text-white/40 text-sm mt-1">
          Configure your shop profile and public presence.
        </p>
      </div>
      <div className="max-w-md">
        {shop && <SettingsForm shop={shop} />}
      </div>
    </div>
  );
}

