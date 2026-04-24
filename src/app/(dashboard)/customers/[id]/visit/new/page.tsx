import { getRequiredSession } from '@/lib/session';
import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import { VisitRecordClient } from './VisitRecordClient';

export default async function NewVisitPage({ params }: { params: { id: string } }) {
  const session = await getRequiredSession();
  const customer = await db.customer.findFirst({
    where: { id: params.id, shopId: session.shopId },
    select: { id: true, name: true, phone: true, smsOptIn: true },
  });
  if (!customer) notFound();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Record cut</h1>
        <p className="text-neutral-500">{customer.name ?? customer.phone}</p>
      </div>
      <VisitRecordClient customer={customer} />
    </div>
  );
}
