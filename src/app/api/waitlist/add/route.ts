import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { normalizePhone } from '@/lib/customerHelpers';
import { generateUniqueAccessCode } from '@/lib/accessCode';

const schema = z.object({
  phone: z.string().min(7).max(20),
  name: z.string().max(100).optional(),
  preferredBarberId: z.string().optional(),
  note: z.string().max(300).optional(),
});

/**
 * Staff-facing "add walk-in" - for clients who didn't self-check-in via the
 * arrive QR (phoned ahead, no smartphone, etc). Unlike POST /api/arrive
 * (public, unauthenticated, sets a customer session cookie for the client's
 * own device) this requires a signed-in barber/owner session and never
 * touches customer-session cookies - the barber is acting on the client's
 * behalf from the shop's own device.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { shopId } = session.user as any;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const phone = normalizePhone(parsed.data.phone);

  let customer = await db.customer.findUnique({ where: { phone_shopId: { phone, shopId } } });
  if (!customer) {
    if (!parsed.data.name) {
      return NextResponse.json({ error: 'Name required for a new client' }, { status: 400 });
    }
    const accessCode = await generateUniqueAccessCode();
    customer = await db.customer.create({
      data: { shopId, phone, name: parsed.data.name, accessCode },
    });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const alreadyWaiting = await db.walkIn.findFirst({
    where: { shopId, customerId: customer.id, status: { in: ['waiting', 'in_progress'] }, arrivedAt: { gte: today } },
  });
  if (alreadyWaiting) {
    return NextResponse.json({ error: 'This client is already in the queue', customer }, { status: 409 });
  }

  let preferredBarberName: string | null = null;
  if (parsed.data.preferredBarberId) {
    const barber = await db.barber.findFirst({
      where: { id: parsed.data.preferredBarberId, shopId, isActive: true },
      select: { name: true },
    });
    preferredBarberName = barber?.name ?? null;
  }

  const noteParts: string[] = [];
  if (preferredBarberName) noteParts.push(`See: ${preferredBarberName}`);
  if (parsed.data.note?.trim()) noteParts.push(parsed.data.note.trim());

  const walkIn = await db.walkIn.create({
    data: {
      shopId,
      customerId: customer.id,
      note: noteParts.join(' / ') || null,
    },
  });

  return NextResponse.json({ customer, walkIn }, { status: 201 });
}
