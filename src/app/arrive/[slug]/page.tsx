import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import ArriveClient from './ArriveClient';

export default async function ArrivePage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams?: { demo?: string };
}) {
  const shop = await db.shop.findUnique({
    where: { slug: params.slug },
    select: {
      id: true,
      name: true,
      slug: true,
      defaultCutTime: true,
      services: {
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        select: { id: true, name: true, price: true, duration: true },
      },
      barbers: {
        where: { isActive: true, acceptsBookings: true },
        select: { id: true, name: true },
        orderBy: { createdAt: 'asc' },
      },
    },
  });
  if (!shop) notFound();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const liveWaitingCount = await db.walkIn.count({
    where: {
      shopId: shop.id,
      arrivedAt: { gte: today },
      status: { in: ['waiting', 'in_progress'] },
    },
  });

  const isDemoShop = shop.slug === 'the-barber-room';
  const waitingCount = isDemoShop && liveWaitingCount === 0 ? 3 : liveWaitingCount;
  const waitMinutes = waitingCount * (shop.defaultCutTime ?? 20);

  return (
    <ArriveClient
      shopSlug={shop.slug}
      shopName={shop.name}
      services={shop.services.map(s => ({
        id: s.id,
        name: s.name,
        price: s.price ? s.price.toString() : null,
        duration: s.duration,
      }))}
      barbers={shop.barbers}
      initialWaitingCount={waitingCount}
      initialWaitMinutes={waitMinutes}
      isDemoShop={isDemoShop}
      demoWalkIn={searchParams?.demo === 'walkin'}
    />
  );
}
