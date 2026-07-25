import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateGoogleHeroArtwork } from '@/lib/wallet/artwork';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const shopSlug = searchParams.get('shop');

  if (!shopSlug) {
    return new NextResponse('Missing shop parameter', { status: 400 });
  }

  try {
    const shop = await db.shop.findUnique({
      where: { slug: shopSlug },
      select: { passStripUrl: true, passAccentColor: true },
    });

    if (!shop) {
      return new NextResponse('Shop not found', { status: 404 });
    }

    const buffer = await generateGoogleHeroArtwork({
      accentColour: shop.passAccentColor || undefined,
      stripUrl: shop.passStripUrl,
    });

    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=43200',
      },
    });
  } catch (err) {
    console.error('Error generating Google Hero Artwork:', err);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
