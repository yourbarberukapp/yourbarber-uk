import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendBetaConfirmationEmail } from '@/lib/email';

const ADMIN_KEY = process.env.ADMIN_KEY || 'a3024f4c07e01ec4';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const key = req.headers.get('x-admin-key');
  if (key !== ADMIN_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const lead = await db.demoLead.findUnique({ where: { id: params.id } });
  if (!lead) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (lead.approved) return NextResponse.json({ ok: true, alreadyApproved: true });

  await db.demoLead.update({
    where: { id: params.id },
    data: { approved: true, approvedAt: new Date() },
  });

  await sendBetaConfirmationEmail({ name: lead.name, email: lead.email }).catch(() => null);

  return NextResponse.json({ ok: true });
}
