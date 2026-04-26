import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { generateUploadUrl, getPublicUrl } from '@/lib/s3';

const schema = z.object({
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { shopId } = session.user as any;

  const existing = await db.shopStyle.findUnique({ where: { id: params.id } });
  if (!existing || existing.shopId !== shopId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const ext = parsed.data.contentType.split('/')[1].replace('jpeg', 'jpg');
  const key = `shops/${shopId}/styles/${params.id}.${ext}`;

  const uploadUrl = await generateUploadUrl(key, parsed.data.contentType);
  const publicUrl = getPublicUrl(key);

  return NextResponse.json({ uploadUrl, publicUrl });
}
