import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  const { leadId, approve } = await req.json();
  if (!leadId) return NextResponse.json({ error: 'leadId required' }, { status: 400 });

  await db.demoLead.update({
    where: { id: leadId },
    data: {
      approved: approve !== false,
      approvedAt: approve !== false ? new Date() : null,
    },
  });

  return NextResponse.json({ ok: true });
}
