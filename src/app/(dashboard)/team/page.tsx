import { getRequiredSession } from '@/lib/session';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import { TeamClient } from './TeamClient';

export default async function TeamPage() {
  const session = await getRequiredSession();
  if (session.role !== 'owner') redirect('/customers');

  const barbers = await db.barber.findMany({
    where: { shopId: session.shopId, isActive: true },
    select: { id: true, name: true, email: true, role: true },
    orderBy: { createdAt: 'asc' },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Team</h1>
      <TeamClient barbers={barbers} currentBarberId={session.barberId} />
    </div>
  );
}
