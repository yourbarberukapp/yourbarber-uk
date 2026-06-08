import { db } from '@/lib/db';
import type { AppSession } from '@/lib/session';

// The seed contract mirrors the requested queue-ticket shape even though this repo
// currently persists test state through Prisma rather than Drizzle.
export interface QueueTicketSeedRecord {
  id: string;
  shopId: string;
  phoneNumber: string;
  customerName: string;
  position: number;
  estimatedWaitMinutes: number;
  status: 'waiting' | 'in_chair' | 'completed';
  passSerialNumber: string;
}

export interface HaircutHistoryRecord {
  id: string;
  customerName: string;
  barberName: string;
  visitedAt: string;
  services: string[];
  notes: string;
}

export interface SeededBarberE2EState {
  session: AppSession;
  shopId: string;
  shopSlug: string;
  queueTicket: QueueTicketSeedRecord;
  last5Haircuts: HaircutHistoryRecord[];
}

const SHOP_ID = 'e2e-shop-your-barber';
const SHOP_SLUG = 'e2e-your-barber';
const BARBER_ID = 'e2e-owner-your-barber';
const DEFAULT_CUT_TIME = 15;

export function buildMockPassSerialNumber(ticketId: string): string {
  const normalized = ticketId.replace(/[^a-z0-9]/gi, '').slice(0, 12).toUpperCase();
  return `YB-${normalized.padEnd(12, '0')}-PASS`;
}

function getQueueStatus(status: QueueTicketSeedRecord['status']): 'waiting' | 'in_progress' | 'done' {
  if (status === 'in_chair') return 'in_progress';
  if (status === 'completed') return 'done';
  return 'waiting';
}

export async function seedBarberE2EState(): Promise<SeededBarberE2EState> {
  await db.walkIn.deleteMany({ where: { shopId: SHOP_ID } });
  await db.visit.deleteMany({ where: { shopId: SHOP_ID } });
  await db.customer.deleteMany({ where: { shopId: SHOP_ID } });
  await db.barber.deleteMany({ where: { shopId: SHOP_ID } });
  await db.shop.deleteMany({ where: { id: SHOP_ID } });

  const shop = await db.shop.create({
    data: {
      id: SHOP_ID,
      name: 'Your Barber QA Lab',
      slug: SHOP_SLUG,
      subscriptionStatus: 'active',
      defaultCutTime: DEFAULT_CUT_TIME,
      phone: '02070000000',
    },
  });

  const barber = await db.barber.create({
    data: {
      id: BARBER_ID,
      shopId: shop.id,
      name: 'Maya Principal',
      email: 'maya.qa+e2e@yourbarber.uk',
      passwordHash: 'PLAYWRIGHT_SESSION_ONLY',
      role: 'owner',
      isActive: true,
    },
  });

  const aheadCustomer = await db.customer.create({
    data: {
      id: 'e2e-customer-ahead',
      shopId: shop.id,
      phone: '07700000001',
      name: 'Alex Queuehead',
      smsOptIn: 'yes',
      lastVisitAt: new Date('2026-05-25T09:00:00.000Z'),
    },
  });

  const targetCustomer = await db.customer.create({
    data: {
      id: 'e2e-customer-target',
      shopId: shop.id,
      phone: '07700000002',
      name: 'Jordan Booker',
      smsOptIn: 'yes',
      lastVisitAt: new Date('2026-06-01T11:30:00.000Z'),
    },
  });

  const historyCustomers = await Promise.all(
    [
      { id: 'e2e-history-1', phone: '07700000003', name: 'Chris Fade', service: ['Skin Fade', 'Line-up'], notes: 'Low taper blended into beard.' },
      { id: 'e2e-history-2', phone: '07700000004', name: 'Miles Crop', service: ['Textured Crop'], notes: 'Leave extra weight through the crown.' },
      { id: 'e2e-history-3', phone: '07700000005', name: 'Theo Waves', service: ['Wave trim'], notes: 'Keep the temple edge soft.' },
      { id: 'e2e-history-4', phone: '07700000006', name: 'Isaac Beard', service: ['Beard sculpt', 'Hot towel'], notes: 'Sharper cheek line, rounded chin.' },
      { id: 'e2e-history-5', phone: '07700000007', name: 'Noah Taper', service: ['Burst fade'], notes: 'Maintain curl length on top.' },
    ].map((customer, index) =>
      db.customer.create({
        data: {
          id: customer.id,
          shopId: shop.id,
          phone: customer.phone,
          name: customer.name,
          smsOptIn: 'yes',
          lastVisitAt: new Date(`2026-06-0${index + 2}T12:00:00.000Z`),
        },
      })
    )
  );

  const queueDate = new Date();
  queueDate.setHours(9, 0, 0, 0);

  await db.walkIn.create({
    data: {
      id: 'e2e-walkin-ahead',
      shopId: shop.id,
      customerId: aheadCustomer.id,
      status: 'waiting',
      preferredStyle: 'Skin Fade',
      arrivedAt: new Date(queueDate.getTime()),
    },
  });

  const targetWalkIn = await db.walkIn.create({
    data: {
      id: 'e2e-walkin-target',
      shopId: shop.id,
      customerId: targetCustomer.id,
      status: getQueueStatus('waiting'),
      preferredStyle: 'Textured Crop',
      arrivedAt: new Date(queueDate.getTime() + 5 * 60 * 1000),
    },
  });

  const haircutSeeds = [
    { customerId: targetCustomer.id, customerName: targetCustomer.name ?? 'Jordan Booker', services: ['Textured Crop', 'Shape-up'], notes: 'Keep the front corner crisp.', visitedAt: '2026-06-08T10:00:00.000Z' },
    { customerId: historyCustomers[0].id, customerName: historyCustomers[0].name ?? 'Chris Fade', services: ['Skin Fade', 'Line-up'], notes: 'Blend lower than last visit.', visitedAt: '2026-06-07T16:15:00.000Z' },
    { customerId: historyCustomers[1].id, customerName: historyCustomers[1].name ?? 'Miles Crop', services: ['Textured Crop'], notes: 'Matte finish and looser fringe.', visitedAt: '2026-06-06T14:45:00.000Z' },
    { customerId: historyCustomers[2].id, customerName: historyCustomers[2].name ?? 'Theo Waves', services: ['Wave trim'], notes: 'Keep compression even around the crown.', visitedAt: '2026-06-05T12:20:00.000Z' },
    { customerId: historyCustomers[3].id, customerName: historyCustomers[3].name ?? 'Isaac Beard', services: ['Beard sculpt', 'Hot towel'], notes: 'Leave more density at the chin.', visitedAt: '2026-06-04T11:10:00.000Z' },
  ];

  await Promise.all(
    haircutSeeds.map((seed, index) =>
      db.visit.create({
        data: {
          id: `e2e-visit-${index + 1}`,
          shopId: shop.id,
          customerId: seed.customerId,
          barberId: barber.id,
          visitedAt: new Date(seed.visitedAt),
          notes: seed.notes,
          recommendation: 'Rebook in 3 weeks',
          cutDetails: {
            style: seed.services,
            sidesGrade: `${index + 1}`,
            topLength: index === 0 ? 'Keep 2cm texture' : 'Keep natural length',
            beard: index % 2 === 0 ? 'Lined' : 'Not done',
          },
        },
      })
    )
  );

  const queueTicket: QueueTicketSeedRecord = {
    id: targetWalkIn.id,
    shopId: shop.id,
    phoneNumber: targetCustomer.phone,
    customerName: targetCustomer.name ?? 'Jordan Booker',
    position: 2,
    estimatedWaitMinutes: DEFAULT_CUT_TIME,
    status: 'waiting',
    passSerialNumber: buildMockPassSerialNumber(targetWalkIn.id),
  };

  const last5Haircuts: HaircutHistoryRecord[] = haircutSeeds.map((seed, index) => ({
    id: `e2e-visit-${index + 1}`,
    customerName: seed.customerName,
    barberName: barber.name,
    visitedAt: seed.visitedAt,
    services: seed.services,
    notes: seed.notes,
  }));

  return {
    session: {
      barberId: barber.id,
      shopId: shop.id,
      role: 'owner',
      name: barber.name,
      shopName: shop.name,
      shopSlug: shop.slug,
    },
    shopId: shop.id,
    shopSlug: shop.slug,
    queueTicket,
    last5Haircuts,
  };
}
