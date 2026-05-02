import { getRequiredSession } from '@/lib/session';
import { db } from '@/lib/db';
import BarberClient from './BarberClient';

export default async function BarberPage() {
  const session = await getRequiredSession();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [walkIns, barber] = await Promise.all([
    db.walkIn.findMany({
      where: {
        shopId: session.shopId,
        arrivedAt: { gte: today },
        status: { in: ['waiting', 'in_progress'] },
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            lastVisitAt: true,
            visits: {
              orderBy: { visitedAt: 'desc' },
              take: 1,
              select: { visitedAt: true, cutDetails: true, notes: true },
            },
          },
        },
        familyMember: { select: { name: true } },
      },
      orderBy: { arrivedAt: 'asc' },
    }),
    db.barber.findUnique({
      where: { id: session.barberId },
      select: { id: true, name: true, isBusy: true },
    }),
  ]);

  return (
    <BarberClient
      initialWalkIns={JSON.parse(JSON.stringify(walkIns))}
      initialIsBusy={barber?.isBusy ?? false}
    />
  );
}
