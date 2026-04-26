import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import QRCode from 'qrcode';

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
  const size = parseInt(req.nextUrl.searchParams.get('size') || '600', 10);
  const format = req.nextUrl.searchParams.get('format') || 'portrait';

  const shop = await db.shop.findUnique({
    where: { slug },
    select: { name: true },
  });
  if (!shop) return new NextResponse('Shop not found', { status: 404 });

  const qrUrl = `https://yourbarber.uk/arrive/${slug}`;

  const qrSvgString = await QRCode.toString(qrUrl, {
    type: 'svg',
    margin: 1,
    color: { dark: '#FFFFFF', light: '#00000000' },
    errorCorrectionLevel: 'H',
  });

  // Get the native QR coordinate size from the viewBox
  const vbMatch = qrSvgString.match(/viewBox="0 0 (\d+) (\d+)"/);
  const qrNative = vbMatch ? parseInt(vbMatch[1]) : 100;

  // Extract the path data
  const pathMatch = qrSvgString.match(/<path[^>]+d="([^"]+)"/);
  const qrPath = pathMatch ? pathMatch[1] : '';

  const lime = '#C8F135';
  const dark = '#0a0a0a';

  const w = size;
  const h = format === 'square' ? size : Math.round(size * 1.414);

  const pad = w * 0.1;
  const qrSize = w * 0.72;
  const qrX = (w - qrSize) / 2;
  const qrY = format === 'square' ? (h - qrSize) / 2 : h * 0.3;
  const scale = qrSize / qrNative;

  // Scissors icon centred over QR
  const icSize = qrSize * 0.18;
  const icX = qrX + (qrSize - icSize) / 2;
  const icY = qrY + (qrSize - icSize) / 2;

  const titleFontSize = w * 0.11;
  const titleY = format === 'square' ? h * 0.12 : h * 0.13;
  const shopNameY = titleY + w * 0.055;
  const ruleY = shopNameY + w * 0.045;
  const ctaY = qrY + qrSize + w * 0.07;

  const svg = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .wm { font-family: 'Barlow Condensed','Impact','Arial Black',sans-serif; font-weight:900; text-transform:uppercase; }
      .sh { font-family: 'Barlow Condensed','Arial Narrow',sans-serif; font-weight:700; text-transform:uppercase; letter-spacing:0.12em; }
    </style>
  </defs>

  <!-- Background -->
  <rect width="100%" height="100%" fill="${dark}"/>

  <!-- Wordmark -->
  <text x="50%" y="${titleY}" text-anchor="middle" class="wm" font-size="${titleFontSize}">
    <tspan fill="white">YOUR</tspan><tspan fill="${lime}">BARBER</tspan>
  </text>

  <!-- Shop name -->
  <text x="50%" y="${shopNameY}" text-anchor="middle" class="sh" fill="white" fill-opacity="0.5" font-size="${w * 0.038}">
    ${shop.name}
  </text>

  <!-- Rule -->
  <line x1="${pad}" y1="${ruleY}" x2="${w - pad}" y2="${ruleY}" stroke="${lime}" stroke-width="1" stroke-opacity="0.2"/>

  <!-- QR dark background -->
  <rect x="${qrX - 8}" y="${qrY - 8}" width="${qrSize + 16}" height="${qrSize + 16}" fill="#141414" rx="${w * 0.02}"/>

  <!-- QR code -->
  <g transform="translate(${qrX},${qrY}) scale(${scale})">
    <path d="${qrPath}" fill="white"/>
  </g>

  <!-- Scissors icon overlay (covers QR centre) -->
  <rect x="${icX - 4}" y="${icY - 4}" width="${icSize + 8}" height="${icSize + 8}" fill="#141414"/>
  <g transform="translate(${icX},${icY}) scale(${icSize / 100})">
    <circle cx="30" cy="72" r="16" stroke="${lime}" stroke-width="7" fill="none"/>
    <circle cx="70" cy="72" r="16" stroke="${lime}" stroke-width="7" fill="none"/>
    <path d="M43,58 L75,18 M57,58 L25,18" stroke="${lime}" stroke-width="7" stroke-linecap="round"/>
    <circle cx="50" cy="48" r="4" fill="${lime}"/>
  </g>

  <!-- CTA -->
  <text x="50%" y="${ctaY}" text-anchor="middle" class="wm" fill="${lime}" font-size="${w * 0.04}" letter-spacing="0.15em">
    SCAN TO CHECK IN
  </text>
</svg>`;

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
