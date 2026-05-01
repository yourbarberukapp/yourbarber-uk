import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Purge STANDBY entries older than 12 minutes
  const cutoff = new Date(Date.now() - 12 * 60 * 1000);

  const { count } = await db.walkIn.updateMany({
    where: {
      presenceStatus: 'STANDBY',
      status: 'waiting',
      standbySince: { lte: cutoff },
    },
    data: { status: 'no_show', doneAt: new Date() },
  });

  return NextResponse.json({ purged: count, cutoff });
}
