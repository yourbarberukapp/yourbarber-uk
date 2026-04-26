import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1),
  shopName: z.string().min(1),
  phone: z.string().min(7),
  email: z.string().email(),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }

  await db.demoLead.create({ data: parsed.data });
  return NextResponse.json({ ok: true });
}
