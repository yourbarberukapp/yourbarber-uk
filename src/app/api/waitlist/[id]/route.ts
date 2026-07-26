import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { notifyCustomer } from '@/lib/wallet/notify';
import { getQueueStatusForCustomer } from '@/lib/wallet/queueStatus';

const schema = z.object({
  status: z.enum(['waiting', 'in_progress', 'done', 'no_show']),
});

/**
 * Pushes an updated Wallet pass (queue position + a short status line) to
 * every customer still waiting today at this shop. Called whenever a walk-in
 * leaves the active queue (moves to in_progress/done/no_show), since that
 * shifts everyone else's position — this is the real replacement for
 * "browser notification, keep tab open": clients get a native Wallet lock-
 * screen update instead, no tab or app required.
 */
async function pushQueueUpdatesToWaitingCustomers(shopId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const waiting = await db.walkIn.findMany({
    where: { shopId, status: 'waiting', arrivedAt: { gte: today } },
    select: { customerId: true },
  });

  await Promise.all(
    waiting.map(async (w) => {
      const queue = await getQueueStatusForCustomer(shopId, w.customerId);
      if (!queue) return;
      const message = queue.position <= 1
        ? "You're up next — head to the chair!"
        : `You're now #${queue.position} in the queue (~${queue.waitMinutes}m).`;
      await notifyCustomer(w.customerId, message);
    })
  );
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = (session.user as any).shopId as string;

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid status' }, { status: 400 });

  const walkIn = await db.walkIn.findFirst({ where: { id: params.id, shopId } });
  if (!walkIn) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { status } = parsed.data;
  const wasActive = walkIn.status === 'waiting' || walkIn.status === 'in_progress';
  const leavingActiveQueue = wasActive && (status === 'in_progress' || status === 'done' || status === 'no_show') && status !== walkIn.status;

  const updated = await db.walkIn.update({
    where: { id: params.id },
    data: {
      status,
      startedAt: status === 'in_progress' ? new Date() : undefined,
      doneAt: (status === 'done' || status === 'no_show') ? new Date() : undefined,
    },
  });

  if (leavingActiveQueue) {
    pushQueueUpdatesToWaitingCustomers(shopId).catch(() => {});
  }

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = (session.user as any).shopId as string;

  const walkIn = await db.walkIn.findFirst({ where: { id: params.id, shopId } });
  if (!walkIn) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const wasActive = walkIn.status === 'waiting' || walkIn.status === 'in_progress';

  await db.walkIn.delete({ where: { id: params.id } });

  if (wasActive) {
    pushQueueUpdatesToWaitingCustomers(shopId).catch(() => {});
  }

  return NextResponse.json({ success: true });
}
