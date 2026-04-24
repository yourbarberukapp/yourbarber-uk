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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="font-barlow font-black text-4xl uppercase text-white tracking-tight">
          Team
        </h1>
        <p className="text-white/40 text-sm mt-1">
          Manage your barbers and access roles.
        </p>
      </div>
      <TeamClient barbers={barbers} currentBarberId={session.barberId} />
    </div>
  );
}

