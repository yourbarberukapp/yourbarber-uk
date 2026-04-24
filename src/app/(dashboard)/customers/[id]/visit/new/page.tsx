import { getRequiredSession } from '@/lib/session';
import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { VisitRecordClient } from './VisitRecordClient';

export default async function NewVisitPage({ params }: { params: { id: string } }) {
  const session = await getRequiredSession();
  const customer = await db.customer.findFirst({
    where: { id: params.id, shopId: session.shopId },
    select: { id: true, name: true, phone: true, smsOptIn: true },
  });
  if (!customer) notFound();

  return (
    <div style={{ maxWidth: 540 }}>
      {/* Back */}
      <Link
        href={`/customers/${customer.id}`}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem',
          textDecoration: 'none', marginBottom: '1.5rem',
        }}
      >
        <ArrowLeft size={14} /> Back
      </Link>

      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{
          fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 900,
          fontSize: '2rem', textTransform: 'uppercase', color: 'white', lineHeight: 1,
        }}>
          Record cut
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem', marginTop: 6 }}>
          {customer.name ?? customer.phone}
        </p>
      </div>

      <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '1.5rem' }}>
        <VisitRecordClient customer={customer} />
      </div>
    </div>
  );
}
