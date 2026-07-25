import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { extractDominantColour } from '@/lib/wallet/artwork';

const schema = z.object({ imageUrl: z.string().url() });

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const res = await fetch(parsed.data.imageUrl);
  if (!res.ok) return NextResponse.json({ error: 'Could not fetch image' }, { status: 400 });
  const buffer = Buffer.from(await res.arrayBuffer());

  const accentColour = await extractDominantColour(buffer);
  return NextResponse.json({ accentColour });
}
