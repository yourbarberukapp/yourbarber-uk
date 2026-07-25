/**
 * Apple Wallet PKPass & Google Wallet JWT Generators for YourBarber.uk
 */
import { createHash, createSign } from 'crypto';
import JSZip from 'jszip';
import forge from 'node-forge';
import { generateApplePassArtwork, generateGoogleHeroArtwork } from './artwork';

function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://yourbarber.uk';
}

function rgbString(hexColour?: string): string {
  const safe = /^#[0-9a-f]{6}$/i.test(hexColour || '') ? (hexColour || '').slice(1) : '111111';
  const r = parseInt(safe.slice(0, 2), 16);
  const g = parseInt(safe.slice(2, 4), 16);
  const b = parseInt(safe.slice(4, 6), 16);
  return `rgb(${r}, ${g}, ${b})`;
}

function computeLabelColour(hexColour?: string): string {
  const safe = /^#[0-9a-f]{6}$/i.test(hexColour || '') ? (hexColour || '').slice(1) : '111111';
  const r = parseInt(safe.slice(0, 2), 16);
  const g = parseInt(safe.slice(2, 4), 16);
  const b = parseInt(safe.slice(4, 6), 16);
  return `rgb(${Math.round(r + (255 - r) * 0.65)}, ${Math.round(g + (255 - g) * 0.65)}, ${Math.round(b + (255 - b) * 0.65)})`;
}

function buildStampDisplay(stampCount: number, target: number): string {
  const filled = Math.min(stampCount, target);
  if (target <= 10) {
    return '●'.repeat(filled) + '○'.repeat(target - filled);
  }
  return `${filled} of ${target}`;
}

/** Zips pass.json + artwork into a signed (or unsigned, if no certs configured) .pkpass buffer. */
async function signAndZipPass(passJson: Record<string, unknown>, accentColor: string): Promise<Buffer> {
  const zip = new JSZip();
  const passJsonStr = JSON.stringify(passJson, null, 2);
  const artwork = await generateApplePassArtwork({ accentColour: accentColor });

  zip.file('pass.json', passJsonStr);
  zip.file('icon.png', artwork.icon);
  zip.file('icon@2x.png', artwork.icon2x);
  zip.file('logo.png', artwork.logo);
  zip.file('logo@2x.png', artwork.logo2x);
  zip.file('strip.png', artwork.strip);
  zip.file('strip@2x.png', artwork.strip2x);

  const manifest: Record<string, string> = {
    'pass.json': createHash('sha1').update(passJsonStr).digest('hex'),
    'icon.png': createHash('sha1').update(artwork.icon).digest('hex'),
    'icon@2x.png': createHash('sha1').update(artwork.icon2x).digest('hex'),
    'logo.png': createHash('sha1').update(artwork.logo).digest('hex'),
    'logo@2x.png': createHash('sha1').update(artwork.logo2x).digest('hex'),
    'strip.png': createHash('sha1').update(artwork.strip).digest('hex'),
    'strip@2x.png': createHash('sha1').update(artwork.strip2x).digest('hex'),
  };
  const manifestStr = JSON.stringify(manifest);
  zip.file('manifest.json', manifestStr);

  const certPem = process.env.APPLE_PASS_CERT_PEM;
  const keyPem = process.env.APPLE_PASS_KEY_PEM;
  const wwdrPem = process.env.APPLE_WWDR_PEM;

  if (certPem && keyPem && wwdrPem) {
    try {
      const cert = forge.pki.certificateFromPem(certPem.replace(/\\n/g, '\n'));
      const key = forge.pki.privateKeyFromPem(keyPem.replace(/\\n/g, '\n'));
      const wwdr = forge.pki.certificateFromPem(wwdrPem.replace(/\\n/g, '\n'));

      const p7 = forge.pkcs7.createSignedData();
      p7.content = forge.util.createBuffer(manifestStr, 'utf8');
      p7.addCertificate(cert);
      p7.addCertificate(wwdr);
      p7.addSigner({
        key,
        certificate: cert,
        digestAlgorithm: forge.pki.oids.sha1,
        authenticatedAttributes: [
          { type: forge.pki.oids.contentType, value: forge.pki.oids.data },
          { type: forge.pki.oids.messageDigest },
          { type: forge.pki.oids.signingTime, value: new Date().toISOString() },
        ],
      });
      p7.sign({ detached: true });
      const derBuffer = Buffer.from(forge.asn1.toDer(p7.toAsn1()).getBytes(), 'binary');
      zip.file('signature', derBuffer);
    } catch (err) {
      // Was previously a silent catch — a bad/malformed cert produced an
      // unsigned (uninstallable) pass with zero visibility into why. Logged
      // now so a cert misconfiguration shows up in Vercel's function logs
      // instead of only manifesting as "the pass won't install" support tickets.
      console.error('[Wallet] Apple pass signing failed — shipping unsigned pass:', err);
      zip.file('signature', Buffer.alloc(0));
    }
  } else {
    console.warn('[Wallet] APPLE_PASS_CERT_PEM/APPLE_PASS_KEY_PEM/APPLE_WWDR_PEM not fully set — shipping unsigned pass.');
    zip.file('signature', Buffer.alloc(0));
  }

  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}

export interface ClientPassInput {
  shopName: string;
  shopSlug: string;
  accentColor: string;
  customerName: string;
  phone: string;
  accessCode: string;
  loyaltyStamps: number;
  loyaltyTarget: number;
  loyaltyReward: string;
  queuePosition?: number | null;
  waitMinutes?: number | null;
  promoMessage?: string | null;
  passAuthToken?: string | null;
}

export async function generateClientApplePass(input: ClientPassInput): Promise<{ pkpassBuffer: Buffer; serialNumber: string }> {
  const serialNumber = `yb-client-${input.accessCode}`;
  const stampDisplay = buildStampDisplay(input.loyaltyStamps, input.loyaltyTarget);
  const appUrl = getAppUrl();

  const primaryFields = [
    {
      key: 'stamps',
      label: input.loyaltyStamps >= input.loyaltyTarget ? '🎉 REWARD READY' : 'LOYALTY STAMPS',
      value: stampDisplay,
      textAlignment: 'PKTextAlignmentLeft',
    },
  ];

  const secondaryFields = [
    {
      key: 'reward',
      label: 'REWARD',
      value: input.loyaltyReward,
      textAlignment: 'PKTextAlignmentLeft',
    },
    {
      key: 'queue',
      label: 'QUEUE STATUS',
      value: input.queuePosition ? `Position #${input.queuePosition} (~${input.waitMinutes || 0}m)` : 'Not in queue',
      textAlignment: 'PKTextAlignmentRight',
    },
  ];

  const backFields = [
    { key: 'holder', label: 'CLIENT NAME', value: input.customerName },
    { key: 'phone', label: 'MOBILE NUMBER', value: input.phone },
    {
      key: 'passport',
      label: 'CUT PASSPORT & HISTORY',
      value: 'View your cut history & photos',
      attributedValue: `<a href='${appUrl}/me'>Open My Cut Passport</a>`,
    },
    {
      key: 'microsite',
      label: 'SHOP MICROSITE',
      value: `${input.shopSlug}.yourbarber.uk`,
      attributedValue: `<a href='${appUrl}/shop/${input.shopSlug}'>View Shop Hours & Prices</a>`,
    },
    ...(input.promoMessage ? [{ key: 'promo', label: 'SPECIAL OFFER', value: input.promoMessage }] : []),
    {
      key: 'powered_by',
      label: 'POWERED BY',
      value: 'YourBarber.uk — Barbershop Management Platform',
    },
  ];

  const passJson: Record<string, unknown> = {
    formatVersion: 1,
    passTypeIdentifier: process.env.APPLE_PASS_TYPE_ID || 'pass.uk.yourbarber.client',
    serialNumber,
    teamIdentifier: process.env.APPLE_TEAM_ID || 'XXXXXXXXXX',
    organizationName: input.shopName,
    description: `${input.shopName} Digital Card`,
    logoText: input.shopName,
    backgroundColor: rgbString(input.accentColor),
    foregroundColor: 'rgb(255, 255, 255)',
    labelColor: computeLabelColour(input.accentColor),
    storeCard: {
      primaryFields,
      secondaryFields,
      backFields,
    },
    barcodes: [
      {
        message: input.accessCode,
        format: 'PKBarcodeFormatQR',
        messageEncoding: 'iso-8859-1',
        altText: 'Present barcode to barber',
      },
    ],
  };

  if (input.passAuthToken) {
    passJson.authenticationToken = input.passAuthToken;
    passJson.webServiceURL = `${appUrl}/api/wallet/v1`;
  }

  const pkpassBuffer = await signAndZipPass(passJson, input.accentColor);
  return { pkpassBuffer, serialNumber };
}

export async function generateClientGooglePass(input: ClientPassInput): Promise<{ saveUrl: string }> {
  const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID || 'demo_issuer';
  const classId = `${issuerId}.yb_client_${input.shopSlug}`;
  const objectId = `${issuerId}.card_${input.accessCode}`;
  const appUrl = getAppUrl();

  const loyaltyClass = {
    id: classId,
    issuerName: input.shopName,
    programName: `${input.shopName} Card`,
    hexBackgroundColor: input.accentColor || '#111111',
    reviewStatus: 'APPROVED',
  };

  const loyaltyObject = {
    id: objectId,
    classId,
    state: 'active',
    accountName: input.customerName,
    loyaltyPoints: {
      balance: { int: input.loyaltyStamps },
      label: 'Stamps',
    },
    textModulesData: [
      { header: 'Reward', body: input.loyaltyReward, id: 'reward' },
      { header: 'Queue Status', body: input.queuePosition ? `Position #${input.queuePosition}` : 'Not in queue', id: 'queue' },
      ...(input.promoMessage ? [{ header: 'Special Offer', body: input.promoMessage, id: 'promo' }] : []),
    ],
    barcode: {
      type: 'QR_CODE',
      value: input.accessCode,
      alternateText: 'Present barcode to barber',
    },
    linksModuleData: {
      uris: [
        { uri: `${appUrl}/me`, description: 'Open My Cut Passport' },
        { uri: `${appUrl}/shop/${input.shopSlug}`, description: 'Shop Information' },
      ],
    },
  };

  const serviceAccountKey = process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_KEY;
  let serviceAccountEmail = process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL || 'demo@example.iam.gserviceaccount.com';
  let privateKey = process.env.GOOGLE_WALLET_PRIVATE_KEY;

  if (serviceAccountKey) {
    try {
      const parsed = JSON.parse(serviceAccountKey);
      serviceAccountEmail = parsed.client_email || serviceAccountEmail;
      privateKey = parsed.private_key || privateKey;
    } catch {}
  }

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: serviceAccountEmail,
    aud: 'google',
    typ: 'savetowallet',
    iat: now,
    payload: {
      loyaltyClasses: [loyaltyClass],
      loyaltyObjects: [loyaltyObject],
    },
  };

  let jwt: string;
  if (privateKey) {
    privateKey = privateKey.replace(/\\n/g, '\n');
    const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signer = createSign('RSA-SHA256');
    signer.update(`${header}.${body}`);
    const signature = signer.sign(privateKey, 'base64url');
    jwt = `${header}.${body}.${signature}`;
  } else {
    const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    jwt = `${header}.${body}.DEMO_SIGNATURE`;
  }

  return { saveUrl: `https://pay.google.com/gp/v/save/${jwt}` };
}

export interface OwnerPassInput {
  shopName: string;
  shopSlug: string;
  accentColor: string;
  ownerName: string;
  passcode: string;
  passAuthToken?: string | null;
}

/**
 * The owner's own Wallet card — doubles as their business card and their
 * sign-in credential. The barcode encodes the 6-digit passcode so scanning
 * it (e.g. at /owner/login on a new device) fills the code in automatically.
 */
export async function generateOwnerApplePass(input: OwnerPassInput): Promise<{ pkpassBuffer: Buffer; serialNumber: string }> {
  const serialNumber = `yb-owner-${input.passcode}`;
  const appUrl = getAppUrl();

  const passJson: Record<string, unknown> = {
    formatVersion: 1,
    passTypeIdentifier: process.env.APPLE_PASS_TYPE_ID || 'pass.uk.yourbarber.client',
    serialNumber,
    teamIdentifier: process.env.APPLE_TEAM_ID || 'XXXXXXXXXX',
    organizationName: input.shopName,
    description: `${input.shopName} — Owner Card`,
    logoText: input.shopName,
    backgroundColor: rgbString(input.accentColor),
    foregroundColor: 'rgb(255, 255, 255)',
    labelColor: computeLabelColour(input.accentColor),
    generic: {
      primaryFields: [
        { key: 'owner', label: 'OWNER', value: input.ownerName, textAlignment: 'PKTextAlignmentLeft' },
      ],
      secondaryFields: [
        { key: 'shop', label: 'SHOP', value: input.shopName, textAlignment: 'PKTextAlignmentLeft' },
        { key: 'role', label: 'ACCESS', value: 'Owner', textAlignment: 'PKTextAlignmentRight' },
      ],
      backFields: [
        { key: 'passcode', label: 'SIGN-IN PASSCODE', value: input.passcode },
        {
          key: 'dashboard',
          label: 'DASHBOARD',
          value: 'Sign in to your shop',
          attributedValue: `<a href='${appUrl}/owner/login'>Open Sign-in</a>`,
        },
        {
          key: 'powered_by',
          label: 'POWERED BY',
          value: 'YourBarber.uk — Barbershop Management Platform',
        },
      ],
    },
    barcodes: [
      {
        message: input.passcode,
        format: 'PKBarcodeFormatQR',
        messageEncoding: 'iso-8859-1',
        altText: 'Scan to sign in',
      },
    ],
  };

  if (input.passAuthToken) {
    passJson.authenticationToken = input.passAuthToken;
    passJson.webServiceURL = `${appUrl}/api/wallet/v1`;
  }

  const pkpassBuffer = await signAndZipPass(passJson, input.accentColor);
  return { pkpassBuffer, serialNumber };
}

/**
 * Google Wallet equivalent of generateOwnerApplePass. Uses a Generic pass
 * (not Loyalty) since this is a sign-in credential / business card, not a
 * stamp card — genericObjects is the correct Google Wallet object type for
 * that. Same demo-JWT fallback as generateClientGooglePass when no real
 * service account is configured.
 */
export async function generateOwnerGooglePass(input: OwnerPassInput): Promise<{ saveUrl: string }> {
  const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID || 'demo_issuer';
  const classId = `${issuerId}.yb_owner`;
  const objectId = `${issuerId}.owner_${input.passcode}`;
  const appUrl = getAppUrl();

  const genericClass = {
    id: classId,
    reviewStatus: 'APPROVED',
  };

  const genericObject = {
    id: objectId,
    classId,
    state: 'active',
    cardTitle: { defaultValue: { language: 'en', value: `${input.shopName} — Owner Card` } },
    header: { defaultValue: { language: 'en', value: input.ownerName } },
    hexBackgroundColor: input.accentColor || '#111111',
    textModulesData: [
      { header: 'Sign-in passcode', body: input.passcode, id: 'passcode' },
      { header: 'Shop', body: input.shopName, id: 'shop' },
    ],
    barcode: {
      type: 'QR_CODE',
      value: input.passcode,
      alternateText: 'Scan to sign in',
    },
    linksModuleData: {
      uris: [{ uri: `${appUrl}/owner/login`, description: 'Sign in to your shop' }],
    },
  };

  const serviceAccountKey = process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_KEY;
  let serviceAccountEmail = process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL || 'demo@example.iam.gserviceaccount.com';
  let privateKey = process.env.GOOGLE_WALLET_PRIVATE_KEY;

  if (serviceAccountKey) {
    try {
      const parsed = JSON.parse(serviceAccountKey);
      serviceAccountEmail = parsed.client_email || serviceAccountEmail;
      privateKey = parsed.private_key || privateKey;
    } catch {}
  }

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: serviceAccountEmail,
    aud: 'google',
    typ: 'savetowallet',
    iat: now,
    payload: {
      genericClasses: [genericClass],
      genericObjects: [genericObject],
    },
  };

  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  let jwt: string;
  if (privateKey) {
    privateKey = privateKey.replace(/\\n/g, '\n');
    const signer = createSign('RSA-SHA256');
    signer.update(`${header}.${body}`);
    const signature = signer.sign(privateKey, 'base64url');
    jwt = `${header}.${body}.${signature}`;
  } else {
    jwt = `${header}.${body}.DEMO_SIGNATURE`;
  }

  return { saveUrl: `https://pay.google.com/gp/v/save/${jwt}` };
}
