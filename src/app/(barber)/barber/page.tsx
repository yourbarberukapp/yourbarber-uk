import { getRequiredSession } from '@/lib/session';
import { db } from '@/lib/db';
import BarberClient from './BarberClient';

export default async function BarberPage() {
  const session = await getRequiredSession();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const walkIns = await db.walkIn.findMany({
    where: {
      shopId: session.shopId,
      arrivedAt: { gte: today },
      status: { in: ['waiting', 'in_progress'] },
    },
    include: {
      customer: { select: { id: true, name: true, phone: true, lastVisitAt: true } },
    },
    orderBy: { arrivedAt: 'asc' },
  });

  return <BarberClient initialWalkIns={JSON.parse(JSON.stringify(walkIns))} />;
}
