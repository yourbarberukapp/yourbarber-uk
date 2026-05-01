import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateReadUrl } from '@/lib/s3';

const DEMO_SLUG = 'benj-barbers';
const ANGLE_ORDER = ['front', 'back', 'left', 'right', 'top'];

export async function GET() {
  const shop = await db.shop.findUnique({
    where: { slug: DEMO_SLUG },
    select: { id: true, name: true },
  });

  if (!shop) return NextResponse.json({ error: 'Demo shop not found' }, { status: 404 });

  // Get customers who have at least one visit with cut details, most recent visitors first
  const customers = await db.customer.findMany({
    where: {
      shopId: shop.id,
      visits: { some: {} },
    },
    select: {
      id: true,
      name: true,
      visits: {
        orderBy: { visitedAt: 'desc' },
        take: 1,
        select: {
          id: true,
          visitedAt: true,
          cutDetails: true,
          recommendation: true,
          notes: true,
          privateNotes: true,
          photos: {
            orderBy: { createdAt: 'asc' },
            select: { id: true, url: true, angle: true },
          },
        },
      },
    },
    orderBy: { lastVisitAt: 'desc' },
    take: 8,
  });

  const clients = await Promise.all(
    customers.map(async (c) => {
      const lastVisit = c.visits[0];
      const sortedPhotos = [...lastVisit.photos].sort((a, b) => {
        const ai = ANGLE_ORDER.indexOf(a.angle);
        const bi = ANGLE_ORDER.indexOf(b.angle);
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
      });

      const photos = await Promise.all(
        sortedPhotos.map(async (p) => ({
          id: p.id,
          url: await generateReadUrl(p.url),
          angle: p.angle,
        }))
      );

      return {
        id: c.id,
        name: c.name,
        lastVisit: {
          visitedAt: lastVisit.visitedAt,
          cutDetails: lastVisit.cutDetails,
          recommendation: lastVisit.recommendation,
          notes: lastVisit.notes,
          privateNotes: lastVisit.privateNotes,
          photos,
        },
      };
    })
  );

  return NextResponse.json(
    { shopName: shop.name, clients },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
