import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateReadUrl } from '@/lib/s3';

const DEMO_SLUG = 'benj-barbers';
const ANGLE_ORDER = ['front', 'back', 'left', 'right', 'top'];

async function getPassportForCustomer(customerId: string) {
  const customer = await db.customer.findUnique({
    where: { id: customerId },
    select: {
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
  });

  const lastVisit = customer?.visits[0];
  if (!lastVisit) return null;

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
    visitedAt: lastVisit.visitedAt,
    cutDetails: lastVisit.cutDetails,
    recommendation: lastVisit.recommendation,
    notes: lastVisit.notes,
    privateNotes: lastVisit.privateNotes,
    photos,
  };
}

export async function GET() {
  const shop = await db.shop.findUnique({
    where: { slug: DEMO_SLUG },
    select: { id: true, name: true },
  });

  if (!shop) return NextResponse.json({ error: 'Demo shop not found' }, { status: 404 });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check for real live walk-ins first
  const walkIns = await db.walkIn.findMany({
    where: {
      shopId: shop.id,
      arrivedAt: { gte: today },
      status: { in: ['waiting', 'in_progress'] },
    },
    include: {
      customer: { select: { id: true, name: true } },
      familyMember: { select: { name: true } },
    },
    orderBy: { arrivedAt: 'asc' },
  });

  if (walkIns.length > 0) {
    // Return live queue with passport data joined
    const clients = await Promise.all(
      walkIns.map(async (w) => {
        const displayName = w.familyMember?.name ?? w.customer.name;
        const lastVisit = await getPassportForCustomer(w.customer.id);
        return {
          id: w.customer.id,
          walkInId: w.id,
          name: displayName,
          arrivedAt: w.arrivedAt,
          status: w.status,
          note: w.note,
          lastVisit,
        };
      })
    );

    return NextResponse.json(
      { shopName: shop.name, clients, isLive: true },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  }

  // No live queue — fall back to seeded example clients
  const customers = await db.customer.findMany({
    where: { shopId: shop.id, visits: { some: {} } },
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
        walkInId: null,
        name: c.name,
        arrivedAt: null,
        status: null,
        note: null,
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
    { shopName: shop.name, clients, isLive: false },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
