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
    <div className="max-w-sm space-y-6">
      <h1 className="text-2xl font-bold">Shop settings</h1>
      {shop && <SettingsForm shop={shop} />}
    </div>
  );
}
