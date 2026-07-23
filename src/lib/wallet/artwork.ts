/**
 * Artwork generator for Apple & Google Wallet Passes in YourBarber.uk
 */
import { createHash } from 'crypto';

function generatePlaceholderPng(colourHex: string = '#111111'): Buffer {
  // Minimal valid 1x1 PNG Buffer
  const PNG_1x1 = Buffer.from(
    '89504e470d0a1a0a0000000d49484452000000010000000108020000009001' +
    '2e0000000c4944415408d7636060600000000400019b5c0e0000000049454e44ae426082',
    'hex'
  );
  return PNG_1x1;
}

export async function generateApplePassArtwork(params: { accentColour?: string }): Promise<{
  icon: Buffer;
  icon2x: Buffer;
  logo: Buffer;
  logo2x: Buffer;
  strip: Buffer;
  strip2x: Buffer;
}> {
  const icon = generatePlaceholderPng(params.accentColour);
  return {
    icon,
    icon2x: icon,
    logo: icon,
    logo2x: icon,
    strip: icon,
    strip2x: icon,
  };
}

export async function generateGoogleHeroArtwork(params: { accentColour?: string }): Promise<Buffer> {
  return generatePlaceholderPng(params.accentColour);
}
