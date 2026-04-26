import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import QRCode from 'qrcode';

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
  const searchParams = req.nextUrl.searchParams;
  const size = parseInt(searchParams.get('size') || '600', 10);
  const format = searchParams.get('format') || 'portrait'; // 'portrait' (A5/A4) or 'square' (sticker)

  // Fetch shop name for the card
  const shop = await db.shop.findUnique({
    where: { slug },
    select: { name: true }
  });

  if (!shop) {
    return new NextResponse('Shop not found', { status: 404 });
  }

  const shopName = shop.name;
  const qrUrl = `https://yourbarber.uk/arrive/${slug}`;

  // Generate QR code SVG path
  // We'll use a higher error correction level to allow for the icon in the center
  const qrSvgString = await QRCode.toString(qrUrl, {
    type: 'svg',
    margin: 0,
    color: {
      dark: '#FFFFFF',
      light: '#00000000', // transparent
    },
    errorCorrectionLevel: 'H'
  });

  // Extract the path from the QR SVG
  const pathMatch = qrSvgString.match(/d="([^"]+)"/);
  const qrPath = pathMatch ? pathMatch[1] : '';

  // Card dimensions
  const width = size;
  const height = format === 'square' ? size : Math.round(size * 1.414);
  const viewBox = `0 0 ${width} ${height}`;

  // Design Constants
  const lime = '#C8F135';
  const dark = '#0a0a0a';
  const qrBg = '#141414'; // Very dark square for QR
  
  // Layout math
  const padding = width * 0.1;
  const qrSize = width * 0.7;
  const qrX = (width - qrSize) / 2;
  const qrY = format === 'square' ? (height - qrSize) / 1.6 : height * 0.35;
  
  const titleY = height * 0.15;
  const subtitleY = titleY + (width * 0.05);
  const ruleY = subtitleY + (width * 0.05);
  
  const footerY = qrY + qrSize + (width * 0.08);
  const urlY = footerY + (width * 0.05);
  const poweredY = height - (width * 0.05);

  // Scissors icon (simplified path)
  const scissorsSize = qrSize * 0.2;
  const scX = qrX + (qrSize - scissorsSize) / 2;
  const scY = qrY + (qrSize - scissorsSize) / 2;
  const scissorsPath = `M${scX + scissorsSize*0.3},${scY + scissorsSize*0.2} L${scX + scissorsSize*0.7},${scY + scissorsSize*0.6} M${scX + scissorsSize*0.7},${scY + scissorsSize*0.2} L${scX + scissorsSize*0.3},${scY + scissorsSize*0.6} M${scX + scissorsSize*0.2},${scY + scissorsSize*0.7} A${scissorsSize*0.15},${scissorsSize*0.15} 0 1,0 ${scX + scissorsSize*0.4},${scY + scissorsSize*0.7} A${scissorsSize*0.15},${scissorsSize*0.15} 0 1,0 ${scX + scissorsSize*0.2},${scY + scissorsSize*0.7} M${scX + scissorsSize*0.6},${scY + scissorsSize*0.7} A${scissorsSize*0.15},${scissorsSize*0.15} 0 1,0 ${scX + scissorsSize*0.8},${scY + scissorsSize*0.7} A${scissorsSize*0.15},${scissorsSize*0.15} 0 1,0 ${scX + scissorsSize*0.6},${scY + scissorsSize*0.7}`;
  // Better scissors path
  const scissorsIcon = `
    <g transform="translate(${scX}, ${scY}) scale(${scissorsSize/100})">
      <!-- Handles -->
      <circle cx="35" cy="70" r="15" stroke="${lime}" stroke-width="6" fill="none" />
      <circle cx="65" cy="70" r="15" stroke="${lime}" stroke-width="6" fill="none" />
      <!-- Blades -->
      <path d="M42,60 L70,25 M58,60 L30,25" stroke="${lime}" stroke-width="6" stroke-linecap="round" />
      <!-- Pivot -->
      <circle cx="50" cy="50" r="3" fill="${lime}" />
    </g>
  `;

  const svg = `
    <svg width="${width}" height="${height}" viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&amp;family=JetBrains+Mono&amp;display=swap');
          .wordmark { font-family: 'Barlow Condensed', 'Impact', 'Arial Black', sans-serif; font-weight: 900; text-transform: uppercase; letter-spacing: -0.02em; }
          .shopname { font-family: 'Barlow Condensed', 'Arial Narrow', sans-serif; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; }
          .mono { font-family: 'JetBrains Mono', 'Courier New', monospace; }
        </style>
      </defs>
      
      <!-- Background -->
      <rect width="100%" height="100%" fill="${dark}" />
      
      <!-- Wordmark -->
      <text x="50%" y="${titleY}" text-anchor="middle" class="wordmark" font-size="${width * 0.12}">
        <tspan fill="white">YOUR</tspan><tspan fill="${lime}">BARBER</tspan>
      </text>
      
      <!-- Shop Name (Optional/Contextual) -->
      <text x="50%" y="${subtitleY}" text-anchor="middle" class="shopname" fill="white" fill-opacity="0.6" font-size="${width * 0.04}">
        ${shopName}
      </text>
      
      <!-- Horizontal Rule -->
      <line x1="${padding}" y1="${ruleY}" x2="${width - padding}" y2="${ruleY}" stroke="${lime}" stroke-width="1" stroke-opacity="0.15" />
      
      <!-- QR Container -->
      <rect x="${qrX - 10}" y="${qrY - 10}" width="${qrSize + 20}" height="${qrSize + 20}" fill="${qrBg}" rx="${width * 0.03}" />
      
      <!-- QR Code -->
      <g transform="translate(${qrX}, ${qrY}) scale(${qrSize / 100})">
        <path d="${qrPath}" fill="white" />
      </g>
      
      <!-- Scissors Icon in Center -->
      <rect x="${scX - 2}" y="${scY - 2}" width="${scissorsSize + 4}" height="${scissorsSize + 4}" fill="${qrBg}" />
      ${scissorsIcon}
      
      <!-- Footer Text -->
      <text x="50%" y="${footerY}" text-anchor="middle" class="wordmark" fill="${lime}" font-size="${width * 0.035}" letter-spacing="0.1em">
        SCAN TO CHECK IN
      </text>
      
      <text x="50%" y="${urlY}" text-anchor="middle" class="mono" fill="white" fill-opacity="0.4" font-size="${width * 0.03}">
        yourbarber.uk/arrive/${slug}
      </text>
      
      <text x="50%" y="${poweredY}" text-anchor="middle" class="wordmark" fill="white" fill-opacity="0.2" font-size="${width * 0.02}">
        POWERED BY YOURBARBER
      </text>
    </svg>
  `;

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
