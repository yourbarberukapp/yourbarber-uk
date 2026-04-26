import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { STYLE_DEFAULTS, SHOP_TYPES, ShopType } from '@/lib/styleDefaults';

const seedSchema = z.object({
  shopType: z.enum(SHOP_TYPES.map(t => t.value) as [ShopType, ...ShopType[]]),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { shopId, role } = session.user as any;
  if (role !== 'owner') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const parsed = seedSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { shopType } = parsed.data;
  const defaults = STYLE_DEFAULTS[shopType];

  // Deactivate all existing styles (clean slate for new type)
  await db.shopStyle.updateMany({ where: { shopId }, data: { active: false } });

  // Upsert all defaults for the new type
  await Promise.all(
    defaults.map(style =>
      db.shopStyle.upsert({
        where: { shopId_name: { shopId, name: style.name } },
        update: { active: true, category: style.category, sortOrder: style.sortOrder },
        create: { shopId, ...style, active: true },
      })
    )
  );

  // Save shopType on the shop
  await db.shop.update({ where: { id: shopId }, data: { shopType } });

  const styles = await db.shopStyle.findMany({
    where: { shopId, active: true },
    orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
    select: { id: true, name: true, category: true, sortOrder: true, active: true },
  });

  return NextResponse.json({ shopType, styles });
}
