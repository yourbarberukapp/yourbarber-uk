import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { extractDominantColour } from '@/lib/wallet/artwork';
import { isTrustedAssetUrl } from '@/lib/s3';

const MAX_ASSET_BYTES = 10 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 8000;

// Only our own presigned-upload flow ever writes logoUrl, but this endpoint
// takes the URL straight from the request body — restricting it to our own
// S3 bucket host prevents it being used to make the server fetch arbitrary
// or internal URLs (SSRF).
const schema = z.object({
  imageUrl: z.string().url().refine(isTrustedAssetUrl, { message: 'Image must be hosted on our storage' }),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(parsed.data.imageUrl, { signal: controller.signal, redirect: 'error' });
  } catch {
    return NextResponse.json({ error: 'Could not fetch image' }, { status: 400 });
  } finally {
    clearTimeout(timeout);
  }
  if (!res.ok) return NextResponse.json({ error: 'Could not fetch image' }, { status: 400 });
  const contentLength = res.headers.get('content-length');
  if (contentLength && Number(contentLength) > MAX_ASSET_BYTES) {
    return NextResponse.json({ error: 'Image too large' }, { status: 400 });
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.byteLength > MAX_ASSET_BYTES) {
    return NextResponse.json({ error: 'Image too large' }, { status: 400 });
  }

  const accentColour = await extractDominantColour(buffer);
  return NextResponse.json({ accentColour });
}
