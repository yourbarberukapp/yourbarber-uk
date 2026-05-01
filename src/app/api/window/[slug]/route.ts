import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateReadUrl } from '@/lib/s3';

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  const shop = await db.shop.findUnique({
    where: { slug: params.slug },
    select: {
      id: true,
      name: true,
      slug: true,
      logoUrl: true,
      openingHours: true,
      defaultCutTime: true,
    },
  });

  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [waiting, inProgress, recentPhotos] = await Promise.all([
    db.walkIn.count({
      where: { shopId: shop.id, arrivedAt: { gte: today }, status: 'waiting', isAway: false },
    }),
    db.walkIn.count({
      where: { shopId: shop.id, arrivedAt: { gte: today }, status: 'in_progress' },
    }),
    db.visitPhoto.findMany({
      where: {
        visit: { shopId: shop.id },
        angle: { in: ['front', 'back', 'left', 'right'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 16,
      select: { id: true, url: true, angle: true },
    }),
  ]);

  // Effective serving capacity — at least 1 to avoid divide by zero
  const serving = Math.max(inProgress, 1);
  const rawWait = waiting === 0 ? 0 : Math.ceil(waiting / serving) * shop.defaultCutTime;
  // Round up to nearest 5
  const waitMinutes = waiting === 0 ? 0 : Math.ceil(rawWait / 5) * 5;

  const photos = await Promise.all(
    recentPhotos.map(async (p) => ({
      id: p.id,
      url: await generateReadUrl(p.url),
      angle: p.angle,
    }))
  );

  return NextResponse.json(
    {
      shop: {
        name: shop.name,
        slug: shop.slug,
        logoUrl: shop.logoUrl,
        openingHours: shop.openingHours,
      },
      waiting,
      inProgress,
      waitMinutes,
      photos,
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
