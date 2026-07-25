import { getRequiredSession } from '@/lib/session';
import { db } from '@/lib/db';
import OnboardingWizard from './OnboardingWizard';

export default async function OnboardingPage() {
  const session = await getRequiredSession();

  const shop = await db.shop.findUnique({
    where: { id: session.shopId },
    select: {
      passAccentColor: true,
      passLabelColor: true,
      loyaltyTarget: true,
      loyaltyReward: true,
      logoUrl: true,
      passStripUrl: true,
    },
  });

  return (
    <OnboardingWizard
      shopName={session.shopName}
      shopSlug={session.shopSlug}
      initialAccentColor={shop?.passAccentColor || '#111111'}
      initialLabelColor={shop?.passLabelColor || '#C8F135'}
      initialLoyaltyTarget={shop?.loyaltyTarget || 5}
      initialLoyaltyReward={shop?.loyaltyReward || '50% Off 5th Cut'}
      initialLogoUrl={shop?.logoUrl || ''}
      initialStripUrl={shop?.passStripUrl || ''}
    />
  );
}
