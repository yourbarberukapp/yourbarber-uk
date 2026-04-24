import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { buildCustomerWhereClause, normalizePhone } from '@/lib/customerHelpers';
import { generateUniqueAccessCode } from '@/lib/accessCode';

const createSchema = z.object({
  phone: z.string().min(7).max(20),
  name: z.string().max(100).optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = (session.user as any).shopId as string;

  const q = req.nextUrl.searchParams.get('q') ?? '';
  const where = q.length >= 2 ? buildCustomerWhereClause(shopId, q) : { shopId };

  const customers = await db.customer.findMany({
    where,
    orderBy: { lastVisitAt: 'desc' },
    take: 50,
    select: { id: true, phone: true, name: true, smsOptIn: true, lastVisitAt: true },
  });

  return NextResponse.json(customers);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = (session.user as any).shopId as string;

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const phone = normalizePhone(parsed.data.phone);

  const existing = await db.customer.findUnique({
    where: { phone_shopId: { phone, shopId } },
  });
  if (existing) {
    return NextResponse.json({ error: 'Customer with this phone already exists', customer: existing }, { status: 409 });
  }

  const accessCode = await generateUniqueAccessCode();
  const customer = await db.customer.create({
    data: { shopId, phone, name: parsed.data.name, accessCode },
  });
  return NextResponse.json(customer, { status: 201 });
}
