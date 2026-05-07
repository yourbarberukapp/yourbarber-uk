import { db } from '@/lib/db';
import AdminLeadsClient from './AdminLeadsClient';

export const dynamic = 'force-dynamic';

export default async function AdminLeadsPage() {
  const leads = await db.demoLead.findMany({ orderBy: { createdAt: 'desc' } });
  const serialised = leads.map(l => ({
    ...l,
    createdAt: l.createdAt.toISOString(),
    approvedAt: l.approvedAt?.toISOString() ?? null,
  }));
  return <AdminLeadsClient initialLeads={serialised} />;
}
