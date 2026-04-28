import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import QRCode from 'qrcode';

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function clampSize(rawSize: string | null) {
  const parsed = parseInt(rawSize || '600', 10);
  if (Number.isNaN(parsed)) return 600;
  return Math.min(Math.max(parsed, 300), 2400);
}

function isUsableImageUrl(value: string | null) {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

function pdfText(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function buildPdfPoster(shopName: string, slug: string, format: string, isDemoWalkIn = false) {
  const pageWidth = 595.28;
  const pageHeight = format === 'square' ? 595.28 : 841.89;
  const lime = [0.784, 0.945, 0.208];
  const dark = [0.039, 0.039, 0.039];
  const panel = [0.078, 0.078, 0.078];
  const qrUrl = `https://yourbarber.uk/arrive/${encodeURIComponent(slug)}${isDemoWalkIn ? '?demo=walkin' : ''}`;
  const qr = QRCode.create(qrUrl, { errorCorrectionLevel: 'H' });
  const marginModules = 1;
  const modules = qr.modules.size;
  const totalModules = modules + marginModules * 2;
  const qrSize = pageWidth * (format === 'square' ? 0.64 : 0.68);
  const qrX = (pageWidth - qrSize) / 2;
  const qrTop = format === 'square' ? 132 : 252;
  const cell = qrSize / totalModules;
  const lines: string[] = [];

  function rgb(values: number[]) {
    return `${values.map((v) => v.toFixed(3)).join(' ')} rg`;
  }

  function rectTop(x: number, y: number, width: number, height: number, color: number[]) {
    lines.push(`${rgb(color)} ${x.toFixed(2)} ${(pageHeight - y - height).toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re f`);
  }

  function line(x1: number, y1: number, x2: number, y2: number, color: number[], strokeWidth = 1) {
    lines.push(`${color.map((v) => v.toFixed(3)).join(' ')} RG ${strokeWidth.toFixed(2)} w ${x1.toFixed(2)} ${(pageHeight - y1).toFixed(2)} m ${x2.toFixed(2)} ${(pageHeight - y2).toFixed(2)} l S`);
  }

  function text(value: string, x: number, y: number, size: number, color: number[], font = 'F1') {
    lines.push(`BT /${font} ${size.toFixed(2)} Tf ${rgb(color)} ${x.toFixed(2)} ${(pageHeight - y).toFixed(2)} Td (${pdfText(value)}) Tj ET`);
  }

  function centeredText(value: string, y: number, size: number, color: number[], font = 'F1') {
    const approxWidth = value.length * size * 0.56;
    text(value, (pageWidth - approxWidth) / 2, y, size, color, font);
  }

  rectTop(0, 0, pageWidth, pageHeight, dark);

  const wordSize = format === 'square' ? 46 : 62;
  const wordY = format === 'square' ? 66 : 108;
  const yourWidth = 'YOUR'.length * wordSize * 0.56;
  const barberWidth = 'BARBER'.length * wordSize * 0.56;
  const wordX = (pageWidth - yourWidth - barberWidth) / 2;
  text('YOUR', wordX, wordY, wordSize, [1, 1, 1]);
  text('BARBER', wordX + yourWidth, wordY, wordSize, lime);
  centeredText(shopName.toUpperCase(), wordY + 36, format === 'square' ? 17 : 21, [0.5, 0.5, 0.5]);
  line(pageWidth * 0.1, wordY + 58, pageWidth * 0.9, wordY + 58, lime, 0.6);

  rectTop(qrX - 8, qrTop - 8, qrSize + 16, qrSize + 16, panel);
  for (let row = 0; row < modules; row += 1) {
    for (let col = 0; col < modules; col += 1) {
      if (qr.modules.get(row, col)) {
        rectTop(qrX + (col + marginModules) * cell, qrTop + (row + marginModules) * cell, cell + 0.05, cell + 0.05, [1, 1, 1]);
      }
    }
  }

  const markSize = qrSize * 0.18;
  const markX = qrX + (qrSize - markSize) / 2;
  const markTop = qrTop + (qrSize - markSize) / 2;
  rectTop(markX - 6, markTop - 6, markSize + 12, markSize + 12, panel);
  centeredText('YB', markTop + markSize * 0.68, markSize * 0.52, lime);

  centeredText('SCAN TO CHECK IN', qrTop + qrSize + (format === 'square' ? 55 : 62), format === 'square' ? 20 : 24, lime);
  centeredText(`yourbarber.uk/arrive/${slug}`, qrTop + qrSize + (format === 'square' ? 82 : 92), format === 'square' ? 12 : 14, [0.55, 0.55, 0.55], 'F2');

  const content = lines.join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${Buffer.byteLength(content, 'utf8')} >>\nstream\n${content}\nendstream`,
  ];

  let pdf = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf, 'binary'));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(pdf, 'binary');
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${offset.toString().padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf, 'binary');
}

function getDemoShopName(slug: string) {
  const cookie = cookies().get(`demo_override_${slug}`);
  if (!cookie?.value) return null;
  try {
    const overrides = JSON.parse(decodeURIComponent(atob(cookie.value)));
    return typeof overrides.name === 'string' && overrides.name.trim() ? overrides.name.trim() : null;
  } catch {
    return null;
  }
}

function buildQrSvgModules(qrUrl: string, x: number, y: number, size: number) {
  const qr = QRCode.create(qrUrl, { errorCorrectionLevel: 'H' });
  const marginModules = 1;
  const modules = qr.modules.size;
  const totalModules = modules + marginModules * 2;
  const cell = size / totalModules;
  const rects: string[] = [];

  for (let row = 0; row < modules; row += 1) {
    for (let col = 0; col < modules; col += 1) {
      if (qr.modules.get(row, col)) {
        rects.push(
          `<rect x="${x + (col + marginModules) * cell}" y="${y + (row + marginModules) * cell}" width="${cell + 0.05}" height="${cell + 0.05}" fill="white"/>`
        );
      }
    }
  }

  return rects.join('\n    ');
}

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
  const size = clampSize(req.nextUrl.searchParams.get('size'));
  const requestedFormat = req.nextUrl.searchParams.get('format');
  const format = requestedFormat === 'square' ? 'square' : 'portrait';
  const output = req.nextUrl.searchParams.get('type') === 'pdf' ? 'pdf' : 'svg';
  const isDemoWalkIn = req.nextUrl.searchParams.get('target') === 'demo-walkin';

  const shop = await db.shop.findUnique({
    where: { slug },
    select: { name: true, logoUrl: true },
  });
  if (!shop) return new NextResponse('Shop not found', { status: 404 });
  const demoShopName = getDemoShopName(slug);
  const shopName = demoShopName || shop.name;
  const isDemoDisplay = req.nextUrl.searchParams.has('demo');
  const cacheControl = demoShopName || isDemoDisplay
    ? 'private, no-store'
    : 'public, max-age=3600, s-maxage=3600';

  if (output === 'pdf') {
    const pdf = buildPdfPoster(shopName, slug, format, isDemoWalkIn);
    const variant = format === 'square' ? 'Sticker' : 'Poster';
    return new NextResponse(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="YourBarber-${variant}-${slug}.pdf"`,
        'Cache-Control': cacheControl,
      },
    });
  }

  const qrUrl = `https://yourbarber.uk/arrive/${encodeURIComponent(slug)}${isDemoWalkIn ? '?demo=walkin' : ''}`;

  const lime = '#C8F135';
  const dark = '#0a0a0a';

  const w = size;
  const h = format === 'square' ? size : Math.round(size * 1.414);

  const pad = w * 0.1;
  const qrSize = w * 0.72;
  const qrX = (w - qrSize) / 2;
  const qrY = format === 'square' ? (h - qrSize) / 2 : h * 0.3;
  const qrModules = buildQrSvgModules(qrUrl, qrX, qrY, qrSize);

  // Scissors icon centred over QR
  const icSize = qrSize * 0.18;
  const icX = qrX + (qrSize - icSize) / 2;
  const icY = qrY + (qrSize - icSize) / 2;
  const logoPad = icSize * 0.12;

  const titleFontSize = w * 0.11;
  const titleY = format === 'square' ? h * 0.12 : h * 0.13;
  const shopNameY = titleY + w * 0.055;
  const ruleY = shopNameY + w * 0.045;
  const ctaY = qrY + qrSize + w * 0.07;
  const safeShopName = escapeXml(shopName);
  const logoUrl = isUsableImageUrl(shop.logoUrl) ? escapeXml(shop.logoUrl!) : null;
  const centreMark = logoUrl
    ? `<rect x="${icX - logoPad}" y="${icY - logoPad}" width="${icSize + logoPad * 2}" height="${icSize + logoPad * 2}" fill="#141414" rx="${icSize * 0.16}"/>
  <clipPath id="shop-logo-clip"><rect x="${icX}" y="${icY}" width="${icSize}" height="${icSize}" rx="${icSize * 0.12}"/></clipPath>
  <image href="${logoUrl}" x="${icX}" y="${icY}" width="${icSize}" height="${icSize}" preserveAspectRatio="xMidYMid meet" clip-path="url(#shop-logo-clip)"/>`
    : `<rect x="${icX - 4}" y="${icY - 4}" width="${icSize + 8}" height="${icSize + 8}" fill="#141414"/>
  <g transform="translate(${icX},${icY}) scale(${icSize / 100})">
    <circle cx="30" cy="72" r="16" stroke="${lime}" stroke-width="7" fill="none"/>
    <circle cx="70" cy="72" r="16" stroke="${lime}" stroke-width="7" fill="none"/>
    <path d="M43,58 L75,18 M57,58 L25,18" stroke="${lime}" stroke-width="7" stroke-linecap="round"/>
    <circle cx="50" cy="48" r="4" fill="${lime}"/>
  </g>`;

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
    ${safeShopName}
  </text>

  <!-- Rule -->
  <line x1="${pad}" y1="${ruleY}" x2="${w - pad}" y2="${ruleY}" stroke="${lime}" stroke-width="1" stroke-opacity="0.2"/>

  <!-- QR dark background -->
  <rect x="${qrX - 8}" y="${qrY - 8}" width="${qrSize + 16}" height="${qrSize + 16}" fill="#141414" rx="${w * 0.02}"/>

  <!-- QR code -->
  <g>
    ${qrModules}
  </g>

  <!-- Shop logo overlay when configured, otherwise the default mark -->
  ${centreMark}

  <!-- CTA -->
  <text x="50%" y="${ctaY}" text-anchor="middle" class="wm" fill="${lime}" font-size="${w * 0.04}" letter-spacing="0.15em">
    SCAN TO CHECK IN
  </text>
</svg>`;

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': cacheControl,
    },
  });
}
