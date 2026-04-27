import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;

  try {
    const shop = await db.shop.findUnique({
      where: { slug },
      select: {
        id: true,
        defaultCutTime: true,
        barbers: {
          where: { isActive: true },
          select: { id: true }
        }
      }
    });

    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    const waitingCount = await db.walkIn.count({
      where: {
        shopId: shop.id,
        status: 'waiting',
        arrivedAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)) // Only today
        }
      }
    });

    const activeBarbers = shop.barbers.length || 1;
    const cutTime = (shop as any).defaultCutTime ?? 20;

    // Calculate estimated wait
    // If 1 barber and 3 people waiting: (3 / 1) * 20 = 60 mins
    // If 2 barbers and 3 people waiting: (3 / 2) * 20 = 30 mins
    const estimatedWait = Math.ceil((waitingCount / activeBarbers) * cutTime);

    return NextResponse.json({
      waitingCount,
      activeBarbers,
      estimatedWait,
      isBusy: waitingCount > activeBarbers * 2,
      isOpen: true // Could add logic here based on business hours
    });
  } catch (error) {
    console.error('Queue API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
