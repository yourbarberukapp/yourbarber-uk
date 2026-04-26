import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

const cutDetailsSchema = z.object({
  style: z.array(z.string()).default([]),
  sidesGrade: z.string().default(''),
  topLength: z.string().default(''),
  beard: z.string().default(''),
  products: z.array(z.string()).default([]),
  techniques: z.array(z.string()).default([]),
}).optional();

const createVisitSchema = z.object({
  notes: z.string().max(2000).optional(),
  smsOptIn: z.enum(['yes', 'no', 'not_asked']),
  visitedAt: z.string().datetime().optional(),
  cutDetails: cutDetailsSchema,
  recommendation: z.string().max(500).optional(),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { shopId } = session.user as any;
  const barberId = (session.user as any).id;

  const customer = await db.customer.findFirst({ where: { id: params.id, shopId } });
  if (!customer) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  const parsed = createVisitSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const visitedAt = parsed.data.visitedAt ? new Date(parsed.data.visitedAt) : new Date();

  const [visit] = await db.$transaction([
    db.visit.create({
      data: {
        shopId,
        customerId: params.id,
        barberId,
        notes: parsed.data.notes,
        cutDetails: parsed.data.cutDetails ?? undefined,
        recommendation: parsed.data.recommendation,
        visitedAt,
      },
    }),
    db.customer.update({
      where: { id: params.id },
      data: { lastVisitAt: visitedAt, smsOptIn: parsed.data.smsOptIn },
    }),
    db.appointment.updateMany({
      where: {
        customerId: params.id,
        shopId,
        status: { in: ['booked', 'in_progress'] },
        scheduledAt: {
          lte: new Date(visitedAt.getTime() + 24 * 60 * 60 * 1000) // Within 24 hours of visit
        }
      },
      data: { status: 'completed' }
    }),
  ]);

  return NextResponse.json(visit, { status: 201 });
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = (session.user as any).shopId as string;

  const visits = await db.visit.findMany({
    where: { customerId: params.id, shopId },
    orderBy: { visitedAt: 'desc' },
    include: { photos: true, barber: { select: { name: true } } },
  });
  return NextResponse.json(visits);
}
