import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const ADMIN_KEY = process.env.ADMIN_KEY || 'a3024f4c07e01ec4';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (req.headers.get('x-admin-key') !== ADMIN_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  await db.demoLead.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
