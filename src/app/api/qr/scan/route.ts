import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'barber') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { qrToken } = await req.json();

    if (!qrToken) {
      return NextResponse.json({ error: 'qrToken is required' }, { status: 400 });
    }

    const checkIn = await db.checkIn.findUnique({
      where: { qrToken },
      include: {
        customer: {
          include: {
            visits: {
              orderBy: { visitedAt: 'desc' },
              take: 1,
              include: { photos: true }
            }
          }
        }
      }
    });

    if (!checkIn) {
      return NextResponse.json({ error: 'Invalid QR code' }, { status: 404 });
    }

    if (checkIn.expiresAt < new Date()) {
      return NextResponse.json({ error: 'QR code expired' }, { status: 400 });
    }

    // Mark as scanned
    await db.checkIn.update({
      where: { id: checkIn.id },
      data: { scannedAt: new Date() }
    });

    return NextResponse.json({
      success: true,
      customerId: checkIn.customer.id,
      customerName: checkIn.customer.name,
      checkInId: checkIn.id,
      lastVisit: checkIn.customer.visits[0] || null
    });
  } catch (err) {
    console.error('QR Scan Error:', err);
    return NextResponse.json({ error: 'Failed to process QR' }, { status: 500 });
  }
}
