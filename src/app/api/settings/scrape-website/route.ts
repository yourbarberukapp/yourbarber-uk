import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { isSafeExternalUrl } from '@/lib/ssrfGuard';

const MAX_HTML_BYTES = 2 * 1024 * 1024;

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const targetUrl = req.nextUrl.searchParams.get('url');
  if (!targetUrl) {
    return NextResponse.json({ error: 'url required' }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`);
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
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });
    clearTimeout(timeout);

    if (response.status >= 300 && response.status < 400) {
      // Redirects aren't followed automatically so a validated hostname can't be
      // bounced to an internal address by the remote server — refuse rather than
      // silently re-fetch an unvalidated Location.
      return NextResponse.json({ error: 'Website redirected — try the direct URL' }, { status: 400 });
    }

    if (!response.ok) {
      return NextResponse.json({ error: `Failed to fetch website: ${response.status}` }, { status: 502 });
    }

    const contentLength = response.headers.get('content-length');
    if (contentLength && Number(contentLength) > MAX_HTML_BYTES) {
      return NextResponse.json({ error: 'Page too large' }, { status: 400 });
    }
    const html = await response.text();
    if (html.length > MAX_HTML_BYTES) {
      return NextResponse.json({ error: 'Page too large' }, { status: 400 });
    }

    // Extract image sources using regex
    const imgSrcRegex = /<img[^>]+src=["']([^"']+)["']/gi;
    const linkHrefRegex = /<link[^>]+rel=["'](?:shortcut )?icon["'][^>]+href=["']([^"']+)["']/gi;
    const linkHrefRegexAlt = /<link[^>]+href=["']([^"']+)["'][^>]+rel=["'](?:shortcut )?icon["']/gi;
    const metaOgImageRegex = /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/gi;
    const metaOgImageRegexAlt = /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/gi;

    const urls = new Set<string>();

    const resolveUrl = (src: string) => {
      try {
        if (src.startsWith('data:')) return null;
        return new URL(src, parsed.toString()).toString();
      } catch {
        return null;
      }
    };

    let match;
    while ((match = imgSrcRegex.exec(html)) !== null) {
      const u = resolveUrl(match[1]);
      if (u) urls.add(u);
    }
    while ((match = linkHrefRegex.exec(html)) !== null) {
      const u = resolveUrl(match[1]);
      if (u) urls.add(u);
    }
    while ((match = linkHrefRegexAlt.exec(html)) !== null) {
      const u = resolveUrl(match[1]);
      if (u) urls.add(u);
    }
    while ((match = metaOgImageRegex.exec(html)) !== null) {
      const u = resolveUrl(match[1]);
      if (u) urls.add(u);
    }
    while ((match = metaOgImageRegexAlt.exec(html)) !== null) {
      const u = resolveUrl(match[1]);
      if (u) urls.add(u);
    }

    // Default icons
    urls.add(resolveUrl('/favicon.ico')!);
    urls.add(resolveUrl('/apple-touch-icon.png')!);

    return NextResponse.json({
      images: Array.from(urls).filter(Boolean)
    });

  } catch {
    return NextResponse.json({ error: 'Could not scrape website' }, { status: 502 });
  }
}
