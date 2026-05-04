import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

function isGoogleMapsUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === 'https:' &&
      (parsed.hostname === 'www.google.com' || parsed.hostname === 'google.com' || parsed.hostname === 'maps.google.com' || parsed.hostname === 'maps.app.goo.gl') &&
      (parsed.pathname.startsWith('/maps') || parsed.hostname === 'maps.app.goo.gl')
    );
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    if (!isGoogleMapsUrl(url)) {
      return NextResponse.json({ error: 'Only Google Maps URLs are supported' }, { status: 400 });
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      redirect: 'follow',
    });

    const html = await response.text();

    // Extract Title (Shop Name)
    const titleMatch = html.match(/<meta property="og:title" content="([^"]+)">/);
    let name = titleMatch ? titleMatch[1] : '';
    
    // Google Maps often appends " · [Address]" to the title
    if (name.includes(' · ')) {
      name = name.split(' · ')[0];
    }

    // Extract Description (often contains Address and Rating)
    const descMatch = html.match(/<meta property="og:description" content="([^"]+)">/);
    let address = descMatch ? descMatch[1] : '';
    
    // The description usually starts with "Rating · [Category] · [Address]"
    if (address.includes(' · ')) {
      const parts = address.split(' · ');
      // Usually the last part or second to last is the address
      // e.g. "4.5 (100) · Barber shop · 123 High St, London"
      address = parts[parts.length - 1];
    }

    // Try to find opening hours - this is harder as it's often in JSON-LD or deep in the HTML
    // For now, let's return name and address and see if we can find more
    
    return NextResponse.json({
      success: true,
      data: {
        name: name.trim(),
        address: address.trim(),
        // openingHours: ...
      }
    });
  } catch (error) {
    console.error('Extraction error:', error);
    return NextResponse.json({ error: 'Failed to extract data' }, { status: 500 });
  }
}
