import { NextRequest, NextResponse } from 'next/server';
import { getRequiredSession } from '@/lib/session';
import { db } from '@/lib/db';

export async function PATCH(req: NextRequest) {
  const session = await getRequiredSession();
  const { isBusy } = await req.json();
  if (typeof isBusy !== 'boolean') {
    return NextResponse.json({ error: 'isBusy must be a boolean' }, { status: 400 });
  }
  await db.barber.update({
    where: { id: session.barberId },
    data: { isBusy },
  });
  return NextResponse.json({ ok: true });
}
