import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const customer = await db.customer.findFirst({
    where: { visits: { some: {} } }
  });
  return NextResponse.json(customer);
}
