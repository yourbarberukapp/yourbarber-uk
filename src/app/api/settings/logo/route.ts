import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { generateUploadUrl, getPublicUrl } from '@/lib/s3';

const schema = z.object({
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { shopId, role } = session.user as any;
  if (role !== 'owner') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const ext = parsed.data.contentType.split('/')[1].replace('jpeg', 'jpg');
  // Cache-bust the key itself (not just the URL) so browsers/CDNs that cached the
  // old logo by URL don't keep serving it after a re-upload.
  const key = `shops/${shopId}/logo-${Date.now()}.${ext}`;

  const uploadUrl = await generateUploadUrl(key, parsed.data.contentType);
  const publicUrl = getPublicUrl(key);

  return NextResponse.json({ uploadUrl, publicUrl });
}
