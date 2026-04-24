import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { generateUploadUrl, getPublicUrl } from '@/lib/s3';

const ANGLES = ['front', 'back', 'left', 'right'] as const;

const requestSchema = z.object({
  photos: z.array(z.object({
    angle: z.enum(ANGLES),
    contentType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']),
  })).min(1).max(4),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = (session.user as any).shopId as string;

  const visit = await db.visit.findFirst({ where: { id: params.id, shopId } });
  if (!visit) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const results = await Promise.all(
    parsed.data.photos.map(async ({ angle, contentType }) => {
      const ext = contentType.split('/')[1].replace('jpeg', 'jpg');
      const key = `shops/${shopId}/visits/${params.id}/${angle}.${ext}`;
      const uploadUrl = await generateUploadUrl(key, contentType);
      const publicUrl = getPublicUrl(key);
      return { angle, uploadUrl, publicUrl };
    })
  );

  // Pre-create VisitPhoto records (upload hasn't happened yet, but URL is deterministic)
  await db.visitPhoto.createMany({
    data: results.map(r => ({ visitId: params.id, url: r.publicUrl, angle: r.angle })),
    skipDuplicates: true,
  });

  return NextResponse.json(results);
}
