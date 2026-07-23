import { db } from '@/lib/db';

export async function getQueueStatusForCustomer(
  shopId: string,
  customerId: string
): Promise<{ position: number; waitMinutes: number } | null> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const walkIn = await db.walkIn.findFirst({
    where: {
      shopId,
      customerId,
      status: { in: ['waiting', 'in_progress'] },
      arrivedAt: { gte: today },
    },
    orderBy: { arrivedAt: 'asc' },
  });
  if (!walkIn) return null;

  const shop = await db.shop.findUnique({
    where: { id: shopId },
    include: { barbers: { where: { isActive: true }, select: { id: true } } },
  });
  if (!shop) return null;

  const waitingAheadOrSelf = await db.walkIn.count({
    where: {
      shopId,
      status: 'waiting',
      arrivedAt: { gte: today, lte: walkIn.arrivedAt },
    },
  });

  const busyCount = await db.walkIn.count({
    where: { shopId, status: 'in_progress', arrivedAt: { gte: today } },
  });

  const barberCount = Math.max(shop.barbers.length, 1);
  const cutTime = shop.defaultCutTime ?? 20;
  const waitingAhead = walkIn.status === 'waiting' ? Math.max(waitingAheadOrSelf - 1, 0) : 0;
  const waitMinutes = walkIn.status === 'in_progress'
    ? 0
    : Math.ceil(((waitingAhead + busyCount) / barberCount) * cutTime);

  return {
    position: walkIn.status === 'waiting' ? waitingAheadOrSelf : 0,
    waitMinutes,
  };
}
