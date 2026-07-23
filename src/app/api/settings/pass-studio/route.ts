import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

const schema = z.object({
  passAccentColor: z.string(),
  passLabelColor: z.string(),
  loyaltyTarget: z.number().min(1).max(20),
  loyaltyReward: z.string().min(1).max(100),
  promoMessage: z.string().max(200).optional().nullable(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = (session.user as any).shopId as string;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

  const updated = await db.shop.update({
    where: { id: shopId },
    data: {
      passAccentColor: parsed.data.passAccentColor,
      passLabelColor: parsed.data.passLabelColor,
      loyaltyTarget: parsed.data.loyaltyTarget,
      loyaltyReward: parsed.data.loyaltyReward,
      promoMessage: parsed.data.promoMessage || null,
    },
  });

  return NextResponse.json({ success: true, shop: updated });
}
