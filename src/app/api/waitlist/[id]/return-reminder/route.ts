import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { sendSms } from '@/lib/twilio';

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = (session.user as any).shopId as string;

  const walkIn = await db.walkIn.findFirst({
    where: { id: params.id, shopId },
    include: { customer: true, shop: true },
  });

  if (!walkIn) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!walkIn.isAway) return NextResponse.json({ error: 'Customer is not marked away' }, { status: 400 });
  if (walkIn.queueReminderSentAt) return NextResponse.json({ error: 'Reminder already sent' }, { status: 400 });

  const message = `You're nearly up at ${walkIn.shop.name}. Please head back now so we can keep your place in the queue.`;
  const { messageId, status } = await sendSms(walkIn.customer.phone, message);

  await db.smsLog.create({
    data: {
      shopId,
      customerId: walkIn.customerId,
      message,
      twilioSid: messageId,
      status,
    },
  });

  const updated = await db.walkIn.update({
    where: { id: walkIn.id },
    data: { queueReminderSentAt: new Date() },
  });

  return NextResponse.json({ success: true, walkIn: updated });
}
