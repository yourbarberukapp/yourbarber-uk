import { db } from '@/lib/db';
import { pushPassUpdate } from './apnsPush';
import { pushGoogleWalletUpdate } from './googlePush';
import { getQueueStatusForCustomer } from './queueStatus';

/**
 * Replaces SMS as the client notification channel. Writes the message onto the
 * customer's Wallet pass (Apple back-field / Google text module) and wakes both
 * wallets so the change shows up immediately — free at any volume, no per-message cost.
 */
export async function notifyCustomer(customerId: string, message: string): Promise<{ notified: boolean }> {
  const customer = await db.customer.findUnique({
    where: { id: customerId },
    include: { shop: true, walletDevices: true },
  });
  if (!customer) return { notified: false };

  await db.customer.update({
    where: { id: customerId },
    data: { passMessage: message, passUpdatedAt: new Date() },
  });

  let notified = false;

  if (customer.walletDevices.length > 0) {
    await pushPassUpdate(customer.walletDevices.map(d => d.pushToken));
    notified = true;
  }

  if (customer.googlePassId) {
    const queue = await getQueueStatusForCustomer(customer.shopId, customer.id);
    await pushGoogleWalletUpdate({
      objectId: customer.googlePassId,
      loyaltyStamps: customer.loyaltyStamps,
      loyaltyReward: customer.shop.loyaltyReward,
      queuePosition: queue?.position ?? null,
      message,
    });
    notified = true;
  }

  return { notified };
}
