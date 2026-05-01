import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { sendSms } from '@/lib/vonage';

const schema = z.object({
  groupIds: z.array(z.string()).optional(),
});

async function maybeSendPosition2Nudge(shopId: string, shopName: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const queue = await db.walkIn.findMany({
    where: { shopId, status: 'waiting', presenceStatus: 'IN_SHOP', arrivedAt: { gte: today } },
    include: { customer: { select: { name: true, phone: true } } },
    orderBy: { arrivedAt: 'asc' },
    take: 3,
  });
  const target = queue[1];
  if (target && !target.nudgeSentAt) {
    try {
      const name = target.customer.name ?? 'Hi';
      await sendSms(target.customer.phone, `${name}, you're next up at ${shopName} — get ready!`);
      await db.walkIn.update({ where: { id: target.id }, data: { nudgeSentAt: new Date() } });
    } catch {}
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = (session.user as any).shopId as string;

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  const groupIds = parsed.success ? (parsed.data.groupIds ?? []) : [];

  const walkIn = await db.walkIn.findFirst({
    where: { id: params.id, shopId },
    include: {
      customer: { select: { name: true, phone: true } },
      shop: { select: { name: true } },
    },
  });
  if (!walkIn) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const now = new Date();

  await db.walkIn.update({
    where: { id: params.id },
    data: { presenceStatus: 'STANDBY', standbySince: now },
  });

  if (groupIds.length > 0) {
    await db.walkIn.updateMany({
      where: { id: { in: groupIds }, shopId },
      data: { presenceStatus: 'STANDBY', standbySince: now },
    });
  }

  const shopName = walkIn.shop.name;

  try {
    const name = walkIn.customer.name ?? 'Hi';
    await sendSms(
      walkIn.customer.phone,
      `${name}, you were skipped at ${shopName}. Re-scan the QR code on the wall when you're ready to rejoin the queue.`
    );
  } catch {}

  await maybeSendPosition2Nudge(shopId, shopName);

  return NextResponse.json({ ok: true });
}
