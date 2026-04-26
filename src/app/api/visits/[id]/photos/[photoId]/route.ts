import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { deleteS3Object } from '@/lib/s3';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; photoId: string } }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = (session.user as any).shopId as string;

  const photo = await db.visitPhoto.findFirst({
    where: {
      id: params.photoId,
      visit: { id: params.id, shopId },
    },
    select: { id: true, url: true },
  });

  if (!photo) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await db.visitPhoto.delete({ where: { id: photo.id } });

  try {
    await deleteS3Object(photo.url);
  } catch {
    // S3 failure is non-fatal — DB record is already gone
  }

  return NextResponse.json({ ok: true });
}
