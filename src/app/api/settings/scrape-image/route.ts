import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { isSafeExternalUrl } from '@/lib/ssrfGuard';

const ALLOWED_MIMES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
];

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = req.nextUrl.searchParams.get('url');
  if (!url) {
    return NextResponse.json({ error: 'url required' }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  if (!(await isSafeExternalUrl(parsed))) {
    return NextResponse.json({ error: 'That URL cannot be fetched' }, { status: 400 });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(parsed.toString(), {
      signal: controller.signal,
      redirect: 'manual',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; YourBarberBot/1.0)',
        'Accept': 'image/jpeg, image/png, image/webp, image/*'
      }
    });
    clearTimeout(timeout);

    if (response.status >= 300 && response.status < 400) {
      return NextResponse.json({ error: 'Image URL redirected — try the direct URL' }, { status: 400 });
    }

    if (!response.ok) {
      return NextResponse.json({ error: `Failed to fetch: ${response.status}` }, { status: 502 });
    }

    const contentType = response.headers.get('content-type') || 'image/png';
    const baseMime = contentType.split(';')[0].trim();

    if (!ALLOWED_MIMES.some(m => baseMime === m)) {
      return NextResponse.json({ error: 'URL did not return a valid image' }, { status: 422 });
    }

    const contentLength = response.headers.get('content-length');
    if (contentLength && Number(contentLength) > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: 'Image too large' }, { status: 400 });
    }

    const buffer = await response.arrayBuffer();
    if (buffer.byteLength > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: 'Image too large' }, { status: 400 });
    }

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': baseMime,
        'Cache-Control': 'public, max-age=3600',
        'X-Content-Type-Options': 'nosniff'
      }
    });

  } catch (err) {
    return NextResponse.json({ error: 'Could not fetch image' }, { status: 502 });
  }
}
