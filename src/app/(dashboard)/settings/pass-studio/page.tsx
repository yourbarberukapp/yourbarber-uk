import { getRequiredSession } from '@/lib/session';
import { db } from '@/lib/db';
import PassStudioClient from './PassStudioClient';

export default async function PassStudioPage() {
  const session = await getRequiredSession();

  const shop = await db.shop.findUnique({
    where: { id: session.shopId },
    select: {
      id: true,
      name: true,
      slug: true,
      passAccentColor: true,
      passLabelColor: true,
      loyaltyEnabled: true,
      loyaltyTarget: true,
      loyaltyReward: true,
      promoMessage: true,
    },
  });

  if (!shop) return <div>Shop not found.</div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-4xl font-barlow font-black text-white uppercase tracking-tight">
          Pass Design Studio
        </h1>
        <p className="text-white/40 text-sm mt-1">
          Customize your shop&apos;s digital Apple & Google Wallet loyalty cards and staff business passes.
        </p>
      </div>

      <PassStudioClient shop={JSON.parse(JSON.stringify(shop))} />
    </div>
  );
}
