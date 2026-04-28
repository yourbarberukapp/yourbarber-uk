import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { normalizePhone } from '@/lib/customerHelpers';
import { generateUniqueAccessCode } from '@/lib/accessCode';

const schema = z.object({
  shopSlug: z.string(),
  phone: z.string().min(7).max(20),
  name: z.string().max(100).optional(),
  note: z.string().max(300).optional(),
  preferredStyle: z.string().max(500).optional(),
  demoName: z.string().max(100).optional(),
  final: z.boolean().optional(), // true on the submit call, absent on the lookup call
  familyMemberIds: z.array(z.string()).optional(), // List of family members to check in
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

  const { shopSlug, phone: rawPhone, name, demoName, note, preferredStyle, final: isFinal } = parsed.data;
  const phone = normalizePhone(rawPhone);
  const customerName = name || demoName;
  const shop = await db.shop.findUnique({
    where: { slug: shopSlug },
    include: {
      barbers: { where: { isActive: true }, select: { id: true } },
    },
  });
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

  let customer: any = await db.customer.findUnique({
    where: { phone_shopId: { phone, shopId: shop.id } },
    include: { familyMembers: { select: { id: true, name: true } } },
  });

  if (!customer) {
    if (!customerName) return NextResponse.json({ needsName: true });
    const accessCode = await generateUniqueAccessCode();
    const createdCustomer = await db.customer.create({
      data: { shopId: shop.id, phone, name: customerName, accessCode },
    });
    customer = { ...createdCustomer, familyMembers: [] };
  } else if (demoName && customer.name !== demoName) {
    customer = await db.customer.update({
      where: { id: customer.id },
      data: { name: demoName },
      include: { familyMembers: { select: { id: true, name: true } } },
    });
  }

  // Lookup call (first step) — just identify the customer, don't create WalkIn yet
  if (!isFinal) {
    if (!customer) return NextResponse.json({ needsName: true });

    // Also fetch shared family members
    const sharings = await db.familySharing.findMany({
      where: { 
        sharedWithPhone: phone,
        owner: { shopId: shop.id }
      },
      include: {
        owner: {
          include: {
            familyMembers: { select: { id: true, name: true } },
          },
        },
      },
    });

    const sharedMembers = sharings.flatMap(s => s.owner.familyMembers);
    const allMembers = [...(customer.familyMembers || []), ...sharedMembers];

    return NextResponse.json({ 
      proceedToStyle: true, 
      customerName: customer.name,
      familyMembers: allMembers 
    });
  }

  const { familyMemberIds } = parsed.data;

  // Don't double-add if already on the active list today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const existing = await db.walkIn.findFirst({
    where: {
      shopId: shop.id,
      customerId: customer.id,
      status: { in: ['waiting', 'in_progress'] },
      arrivedAt: { gte: today },
    },
  });

  const barberCount = Math.max(shop.barbers.length, 1);
  const cutTime = (shop as any).defaultCutTime ?? 20;

  function calcWait(position: number) {
    const ahead = Math.max(position - 1, 0);
    return Math.ceil((ahead / barberCount) * cutTime);
  }

  if (existing) {
    const position = await db.walkIn.count({
      where: {
        shopId: shop.id,
        status: { in: ['waiting', 'in_progress'] },
        arrivedAt: { lte: existing.arrivedAt },
      },
    });
    return NextResponse.json({ customerName: customer.name, position, waitMinutes: calcWait(position), alreadyWaiting: true });
  }

  // If no familyMemberIds provided, just check in the customer
  const targetIds = familyMemberIds && familyMemberIds.length > 0
    ? familyMemberIds.map((id) => (id === 'ME' ? null : id))
    : [null];

  // Shared groupId when multiple people check in together
  const groupId = targetIds.length > 1 ? crypto.randomUUID() : null;

  // Create WalkIn for each person
  const walkIns = await Promise.all(targetIds.map(fmId =>
    db.walkIn.create({
      data: {
        shopId: shop.id,
        customerId: customer!.id,
        familyMemberId: fmId,
        groupId,
        note: note || null,
        preferredStyle: preferredStyle || null,
      },
    })
  ));

  const firstWalkIn = walkIns[0];

  const position = await db.walkIn.count({
    where: {
      shopId: shop.id,
      status: { in: ['waiting', 'in_progress'] },
      arrivedAt: { lte: firstWalkIn.arrivedAt },
    },
  });

  return NextResponse.json({ 
    customerName: customer.name, 
    position, 
    waitMinutes: calcWait(position + walkIns.length - 1),
    groupSize: walkIns.length 
  });
}
