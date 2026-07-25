/**
 * Artwork generator for Apple & Google Wallet Passes in YourBarber.uk
 *
 * Apple's exact required pixel sizes (from PassKit docs):
 *   icon:  29x29 / 58x58 (@2x) / 87x87 (@3x — not shipped, we only emit @1x/@2x)
 *   logo:  up to 160x50 / 320x100 (@2x), left-aligned in the pass header
 *   strip: 375x144 / 750x288 (@2x) — storeCard/coupon banner image
 */
import sharp from 'sharp';
import { isTrustedAssetUrl } from '@/lib/s3';

const MAX_ASSET_BYTES = 10 * 1024 * 1024; // 10MB — logos/banners are small; guards against a huge response tying up the function.
const FETCH_TIMEOUT_MS = 8000;

function safeHex(hex?: string): string {
  return /^#[0-9a-f]{6}$/i.test(hex || '') ? (hex as string) : '#111111';
}

/**
 * Fetches an uploaded logo/banner image for embedding in a Wallet pass.
 * Only fetches URLs pointing at our own S3 bucket (see isTrustedAssetUrl) —
 * logoUrl/passStripUrl ultimately come from Shop columns set via our own
 * presigned-upload flow, but treating them as untrusted here prevents an
 * SSRF if that ever changes (e.g. a future admin-editable field).
 */
async function fetchImageBuffer(url: string): Promise<Buffer | null> {
  if (!isTrustedAssetUrl(url)) return null;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(url, { signal: controller.signal, redirect: 'error' });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const contentLength = res.headers.get('content-length');
    if (contentLength && Number(contentLength) > MAX_ASSET_BYTES) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.byteLength > MAX_ASSET_BYTES) return null;
    return buffer;
  } catch {
    return null;
  }
}

/** Flat-colour square PNG, used when no logo is uploaded. */
async function solidSquare(size: number, colour: string): Promise<Buffer> {
  return sharp({
    create: { width: size, height: size, channels: 4, background: colour },
  })
    .png()
    .toBuffer();
}

/** Flat-colour rectangle PNG, used for the strip banner when no image is uploaded. */
async function solidRect(width: number, height: number, colour: string): Promise<Buffer> {
  return sharp({
    create: { width, height, channels: 4, background: colour },
  })
    .png()
    .toBuffer();
}

/** Crops/pads a source image into an exact square, for icon.png. */
async function squareFromLogo(source: Buffer, size: number, colour: string): Promise<Buffer> {
  return sharp(source)
    .resize(size, size, { fit: 'cover', position: 'centre' })
    .flatten({ background: colour })
    .png()
    .toBuffer();
}

/** Fits a source image inside a rect without cropping (Apple logo art must not be cropped), padded with the accent colour. */
async function padLogoToRect(source: Buffer, width: number, height: number, colour: string): Promise<Buffer> {
  return sharp(source)
    .resize(width, height, { fit: 'contain', background: colour })
    .flatten({ background: colour })
    .png()
    .toBuffer();
}

async function stripFromBanner(source: Buffer, width: number, height: number): Promise<Buffer> {
  return sharp(source)
    .resize(width, height, { fit: 'cover', position: 'centre' })
    .png()
    .toBuffer();
}

export async function generateApplePassArtwork(params: {
  accentColour?: string;
  logoUrl?: string | null;
  stripUrl?: string | null;
  passType: 'storeCard' | 'generic';
}): Promise<{
  icon: Buffer;
  icon2x: Buffer;
  logo: Buffer;
  logo2x: Buffer;
  strip?: Buffer;
  strip2x?: Buffer;
  thumbnail?: Buffer;
  thumbnail2x?: Buffer;
}> {
  const colour = safeHex(params.accentColour);
  const logoSource = params.logoUrl ? await fetchImageBuffer(params.logoUrl) : null;
  const stripSource = params.stripUrl ? await fetchImageBuffer(params.stripUrl) : null;

  const [icon, icon2x, logo, logo2x] = logoSource
    ? await Promise.all([
        squareFromLogo(logoSource, 29, colour),
        squareFromLogo(logoSource, 58, colour),
        padLogoToRect(logoSource, 160, 50, colour),
        padLogoToRect(logoSource, 320, 100, colour),
      ])
    : await Promise.all([
        solidSquare(29, colour),
        solidSquare(58, colour),
        solidRect(160, 50, colour),
        solidRect(320, 100, colour),
      ]);

  const result: any = { icon, icon2x, logo, logo2x };

  if (params.passType === 'storeCard') {
    const [strip, strip2x] = stripSource
      ? await Promise.all([stripFromBanner(stripSource, 375, 123), stripFromBanner(stripSource, 750, 246)])
      : await Promise.all([solidRect(375, 123, colour), solidRect(750, 246, colour)]);
    result.strip = strip;
    result.strip2x = strip2x;
  } else if (params.passType === 'generic') {
    const [thumbnail, thumbnail2x] = logoSource
      ? await Promise.all([squareFromLogo(logoSource, 90, colour), squareFromLogo(logoSource, 180, colour)])
      : await Promise.all([solidSquare(90, colour), solidSquare(180, colour)]);
    result.thumbnail = thumbnail;
    result.thumbnail2x = thumbnail2x;
  }

  return result;
}

/** Google Wallet's heroImage — 1032x336, shown as the wide banner at the top of the card. */
export async function generateGoogleHeroArtwork(params: {
  accentColour?: string;
  stripUrl?: string | null;
}): Promise<Buffer> {
  const colour = safeHex(params.accentColour);
  const stripSource = params.stripUrl ? await fetchImageBuffer(params.stripUrl) : null;
  return stripSource
    ? stripFromBanner(stripSource, 1032, 336)
    : solidRect(1032, 336, colour);
}

/** Google Wallet's programLogo — 1:1 aspect ratio, min 300x300, masked to a circle by Google. */
export async function generateGoogleLogoArtwork(params: {
  accentColour?: string;
  logoUrl?: string | null;
}): Promise<Buffer> {
  const colour = safeHex(params.accentColour);
  const logoSource = params.logoUrl ? await fetchImageBuffer(params.logoUrl) : null;
  return logoSource
    ? squareFromLogo(logoSource, 300, colour)
    : solidSquare(300, colour);
}

/**
 * Averages an uploaded image down to a single representative colour, for
 * auto-suggesting a pass accent colour from a shop's uploaded logo.
 */
export async function extractDominantColour(imageBuffer: Buffer): Promise<string> {
  const { data } = await sharp(imageBuffer)
    .resize(1, 1, { fit: 'cover' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(data[0])}${toHex(data[1])}${toHex(data[2])}`;
}
