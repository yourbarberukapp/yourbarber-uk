import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import ArriveClient from './ArriveClient';

export default async function ArrivePage({ params }: { params: { slug: string } }) {
  const shop = await db.shop.findUnique({
    where: { slug: params.slug },
    select: { id: true, name: true, slug: true },
  });
  if (!shop) notFound();

  return <ArriveClient shopSlug={shop.slug} shopName={shop.name} />;
}
