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
      id: true, name: true, slug: true,
      styles: {
        where: { active: true },
        orderBy: { sortOrder: 'asc' },
        select: { name: true, category: true },
      },
    },
  });
  if (!shop) notFound();

  return (
    <ArriveClient
      shopSlug={shop.slug}
      shopName={shop.name}
      shopStyles={shop.styles}
      demoWalkIn={searchParams?.demo === 'walkin'}
    />
  );
}
