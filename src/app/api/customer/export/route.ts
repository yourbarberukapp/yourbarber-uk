import { NextResponse } from 'next/server';
import { getCustomerSession } from '@/lib/customerAuth';
import { db } from '@/lib/db';

export async function GET() {
  const session = await getCustomerSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const customer = await db.customer.findUnique({
      where: { id: session.customerId },
      include: {
        visits: {
          include: {
            photos: true,
            feedbacks: true,
            barber: { select: { name: true } },
            shop: { select: { name: true } },
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const exportData = {
      profile: {
        name: customer.name,
        phone: customer.phone,
        smsOptIn: customer.smsOptIn,
        preferredReminderWeeks: customer.preferredReminderWeeks,
        createdAt: customer.createdAt,
      },
      visits: customer.visits.map((visit) => ({
        id: visit.id,
        date: visit.visitedAt,
        shopName: visit.shop.name,
        barberName: visit.barber.name,
        notes: visit.notes,
        photos: visit.photos.map((p) => p.url),
        feedback: visit.feedbacks.map((feedback) => ({
          rating: feedback.rating,
          issue: feedback.issue,
          createdAt: feedback.createdAt,
        })),
      })),
    };

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="yourbarber_data_${session.customerId}.json"`,
      },
    });
  } catch (err) {
    console.error('Export Error:', err);
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 });
  }
}
