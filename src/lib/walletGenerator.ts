/**
 * walletGenerator.ts — Apple Wallet .pkpass and Google Wallet JWT for yourbarber
 *
 * Generates a combined loyalty + customer record pass:
 *   - QR code = customer accessCode (permanent — staff scan to log visits)
 *   - Primary: customer name + visit count
 *   - Back: next appointment, preferred barber, shop contact
 *
 * Apple: requires APPLE_PASS_CERT_PEM, APPLE_PASS_KEY_PEM, APPLE_WWDR_PEM
 * Google: requires GOOGLE_WALLET_SERVICE_ACCOUNT_KEY, GOOGLE_WALLET_ISSUER_ID
 * Both fall back to unsigned demo passes when certs are missing.
 */

import { createHash, createSign } from "crypto";
import JSZip from "jszip";

// ─────────────────────────────────────────────────────────────────────────────
// Input types (shaped to match Prisma results)
// ─────────────────────────────────────────────────────────────────────────────

export interface WalletShop {
  id: string;
  name: string;
  slug: string;
  phone?: string | null;
  logoUrl?: string | null;
  googleReviewUrl?: string | null;
}

export interface WalletBarber {
  name: string;
}

export interface WalletAppointment {
  scheduledAt: Date;
  barber?: WalletBarber | null;
  service?: { name: string } | null;
}

export interface WalletPassInput {
  customerId: string;
  customerName: string;
  accessCode: string;
  shopSlug: string;
  shop: WalletShop;
  visitCount: number;
  preferredBarber?: WalletBarber | null;
  nextAppointment?: WalletAppointment | null;
  /** Loyalty milestone — e.g. every 10 visits = free cut. 0 = disabled */
  loyaltyStamp?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function normPem(pem: string): string {
  return pem.replace(/\\n/g, "\n");
}

function placeholderPng(): Buffer {
  return Buffer.from(
    "89504e470d0a1a0a0000000d49484452000000010000000108020000009001" +
    "2e0000000c4944415408d7636060600000000400019b5c0e0000000049454e44ae426082",
    "hex"
  );
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

async function fetchImageBuffer(url: string): Promise<Buffer> {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(res.statusText);
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return placeholderPng();
  }
}

function buildLoyaltyDisplay(visits: number, milestone: number): string {
  if (milestone <= 0) return `${visits} visits`;
  const progress = visits % milestone;
  const remaining = milestone - progress;
  if (remaining === 0) return "🎉 Free cut ready!";
  if (milestone <= 10) return "●".repeat(progress) + "○".repeat(remaining);
  return `${progress} of ${milestone}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// APPLE WALLET
// ─────────────────────────────────────────────────────────────────────────────

export async function generateBarberApplePass(input: WalletPassInput): Promise<{
  pkpassBase64: string;
  serialNumber: string;
}> {
  const { customerName, accessCode, shop, visitCount, preferredBarber, nextAppointment, loyaltyStamp = 10 } = input;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://yourbarber.uk";
  const serialNumber = `yb-${shop.id}-${input.customerId}-${Date.now()}`;
  const passAuthToken = crypto.randomUUID().replace(/-/g, "");
  const qrValue = `${appUrl}/arrive/${shop.slug}?code=${accessCode}`;

  const milestone = loyaltyStamp > 0 ? loyaltyStamp : 0;
  const loyaltyDisplay = buildLoyaltyDisplay(visitCount, milestone);
  const visitsToNext = milestone > 0 ? milestone - (visitCount % milestone) : 0;

  const backFields: Array<{ key: string; label: string; value: string; attributedValue?: string; changeMessage?: string }> = [];

  if (nextAppointment) {
    const d = new Date(nextAppointment.scheduledAt);
    backFields.push({
      key: "next_appt",
      label: "Next appointment",
      value: `${formatDate(d)} at ${formatTime(d)}${nextAppointment.barber ? ` · ${nextAppointment.barber.name}` : ""}`,
      changeMessage: "Appointment updated: %@",
    });
  }

  if (preferredBarber) {
    backFields.push({ key: "barber", label: "Your barber", value: preferredBarber.name });
  }

  backFields.push({ key: "visits_total", label: "Total visits", value: `${visitCount}` });

  if (milestone > 0 && visitsToNext > 0) {
    backFields.push({
      key: "loyalty_progress",
      label: "Until free cut",
      value: `${visitsToNext} more visit${visitsToNext !== 1 ? "s" : ""}`,
      changeMessage: "%@",
    });
  }

  if (shop.phone) {
    backFields.push({
      key: "shop_phone",
      label: "Phone",
      value: shop.phone,
      attributedValue: `<a href='tel:${shop.phone}'>${shop.phone}</a>`,
    });
  }

  if (shop.googleReviewUrl) {
    backFields.push({
      key: "review",
      label: "Leave us a review",
      value: "Google Reviews",
      attributedValue: `<a href='${shop.googleReviewUrl}'>Leave a Google review</a>`,
    });
  }

  backFields.push({
    key: "booking",
    label: "Book online",
    value: appUrl,
    attributedValue: `<a href='${appUrl}'>${appUrl}</a>`,
  });

  const passJson = {
    formatVersion: 1,
    passTypeIdentifier: process.env.APPLE_PASS_TYPE_ID ?? "pass.uk.yourbarber.loyalty",
    serialNumber,
    teamIdentifier: process.env.APPLE_TEAM_ID ?? "XXXXXXXXXX",
    organizationName: shop.name,
    description: `${shop.name} loyalty card`,
    logoText: shop.name,

    backgroundColor: "rgb(18, 18, 18)",
    foregroundColor: "rgb(255, 255, 255)",
    labelColor: "rgb(160, 160, 160)",

    storeCard: {
      primaryFields: [
        {
          key: "customer",
          label: "LOYALTY CARD",
          value: customerName,
          textAlignment: "PKTextAlignmentLeft",
        },
      ],
      secondaryFields: [
        {
          key: "visits",
          label: milestone > 0 ? "STAMPS" : "VISITS",
          value: loyaltyDisplay,
          textAlignment: "PKTextAlignmentLeft",
          changeMessage: "%@",
        },
        ...(nextAppointment
          ? [{
              key: "next_appt_front",
              label: "NEXT VISIT",
              value: formatDate(new Date(nextAppointment.scheduledAt)),
              textAlignment: "PKTextAlignmentRight" as const,
              changeMessage: "%@",
            }]
          : []),
      ],
      auxiliaryFields: [
        {
          key: "barber_front",
          label: "BARBER",
          value: preferredBarber?.name ?? shop.name,
          textAlignment: "PKTextAlignmentLeft",
        },
      ],
      backFields,
    },

    barcodes: [
      {
        message: qrValue,
        format: "PKBarcodeFormatQR",
        messageEncoding: "iso-8859-1",
        altText: "Show to staff",
      },
    ],

    ...(process.env.APPLE_PASS_WEB_SERVICE_URL
      ? { webServiceURL: process.env.APPLE_PASS_WEB_SERVICE_URL, authenticationToken: passAuthToken }
      : {}),
  };

  const zip = new JSZip();
  const passJsonStr = JSON.stringify(passJson, null, 2);

  // Logo: use shop logo if available, otherwise placeholder
  const logoBuffer = shop.logoUrl ? await fetchImageBuffer(shop.logoUrl) : placeholderPng();

  zip.file("pass.json", passJsonStr);
  zip.file("icon.png", logoBuffer);
  zip.file("icon@2x.png", logoBuffer);
  zip.file("logo.png", logoBuffer);
  zip.file("logo@2x.png", logoBuffer);

  const manifest: Record<string, string> = {
    "pass.json": createHash("sha1").update(passJsonStr).digest("hex"),
    "icon.png":  createHash("sha1").update(logoBuffer).digest("hex"),
    "icon@2x.png": createHash("sha1").update(logoBuffer).digest("hex"),
    "logo.png":  createHash("sha1").update(logoBuffer).digest("hex"),
    "logo@2x.png": createHash("sha1").update(logoBuffer).digest("hex"),
  };
  const manifestStr = JSON.stringify(manifest);
  zip.file("manifest.json", manifestStr);

  const certPem = process.env.APPLE_PASS_CERT_PEM ?? process.env.APPLE_CERT_PEM;
  const keyPem  = process.env.APPLE_PASS_KEY_PEM  ?? process.env.APPLE_KEY_PEM;
  const wwdrPem = process.env.APPLE_WWDR_PEM;

  if (certPem && keyPem && wwdrPem) {
    try {
      const forge = await import("node-forge");
      const cert = forge.pki.certificateFromPem(normPem(certPem));
      const key  = forge.pki.privateKeyFromPem(normPem(keyPem));
      const wwdr = forge.pki.certificateFromPem(normPem(wwdrPem));
      const p7   = forge.pkcs7.createSignedData();
      p7.content = forge.util.createBuffer(manifestStr, "utf8");
      p7.addCertificate(cert);
      p7.addCertificate(wwdr);
      p7.addSigner({
        key, certificate: cert,
        digestAlgorithm: forge.pki.oids.sha1,
        authenticatedAttributes: [
          { type: forge.pki.oids.contentType, value: forge.pki.oids.data },
          { type: forge.pki.oids.messageDigest },
          { type: forge.pki.oids.signingTime, value: new Date().toISOString() },
        ],
      });
      p7.sign({ detached: true });
      zip.file("signature", Buffer.from(forge.asn1.toDer(p7.toAsn1()).getBytes(), "binary"));
    } catch (err) {
      console.warn("[PassKit] Signing failed:", err);
      zip.file("signature", Buffer.alloc(0));
    }
  } else {
    zip.file("signature", Buffer.alloc(0));
  }

  const buf = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  return { pkpassBase64: buf.toString("base64"), serialNumber };
}

// ─────────────────────────────────────────────────────────────────────────────
// GOOGLE WALLET
// ─────────────────────────────────────────────────────────────────────────────

export async function generateBarberGooglePass(input: WalletPassInput): Promise<{
  jwt: string;
  saveUrl: string;
}> {
  const { customerName, accessCode, shop, visitCount, preferredBarber, nextAppointment, loyaltyStamp = 10 } = input;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://yourbarber.uk";
  const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID ?? "demo_issuer";
  const classId  = `${issuerId}.yb_loyalty_${shop.id}`;
  const objectId = `${issuerId}.yb_card_${input.customerId}`;
  const qrValue  = `${appUrl}/arrive/${shop.slug}?code=${accessCode}`;

  const milestone = loyaltyStamp > 0 ? loyaltyStamp : 0;
  const progress  = milestone > 0 ? visitCount % milestone : 0;
  const visitsToNext = milestone > 0 ? milestone - progress : 0;

  const textModulesData: Array<{ header: string; body: string; id: string }> = [];

  if (preferredBarber) {
    textModulesData.push({ header: "Your barber", body: preferredBarber.name, id: "barber" });
  }

  if (nextAppointment) {
    const d = new Date(nextAppointment.scheduledAt);
    textModulesData.push({
      header: "Next appointment",
      body: `${formatDate(d)} at ${formatTime(d)}${nextAppointment.barber ? ` · ${nextAppointment.barber.name}` : ""}`,
      id: "next_appt",
    });
  }

  textModulesData.push({ header: "Total visits", body: `${visitCount}`, id: "visits" });

  if (milestone > 0 && visitsToNext > 0) {
    textModulesData.push({
      header: "Until free cut",
      body: `${visitsToNext} more visit${visitsToNext !== 1 ? "s" : ""}`,
      id: "loyalty",
    });
  }

  const loyaltyClass = {
    id: classId,
    issuerName: "yourbarber",
    programName: shop.name,
    hexBackgroundColor: "#121212",
    countryCode: "GB",
    reviewStatus: "underReview",
    rewardsTier: milestone > 0 ? `${milestone} visits` : "Loyalty",
    rewardsTierLabel: "Free cut every",
    secondaryRewardsTier: `${visitCount}`,
    secondaryRewardsTierLabel: "Visits",
    ...(shop.logoUrl
      ? { programLogo: { sourceUri: { uri: shop.logoUrl }, contentDescription: { defaultValue: { language: "en-GB", value: shop.name } } } }
      : {}),
  };

  const loyaltyObject = {
    id: objectId,
    classId,
    state: "active",
    accountId: `customer_${input.customerId}`,
    accountName: customerName,
    loyaltyPoints: {
      balance: { int: milestone > 0 ? progress : visitCount },
      label: milestone > 0 ? "Stamps" : "Visits",
    },
    ...(milestone > 0 ? {
      secondaryLoyaltyPoints: { balance: { int: milestone }, label: "Target" },
    } : {}),
    textModulesData,
    barcode: {
      type: "QR_CODE",
      value: qrValue,
      alternateText: "Show to staff",
    },
    linksModuleData: {
      uris: [
        { uri: appUrl, description: "Book online" },
        ...(shop.phone ? [{ uri: `tel:${shop.phone}`, description: "Call the shop" }] : []),
        ...(shop.googleReviewUrl ? [{ uri: shop.googleReviewUrl, description: "Leave a review" }] : []),
      ],
    },
  };

  const serviceAccountKey = process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_KEY;
  let serviceAccountEmail = process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL ?? "demo@example.iam.gserviceaccount.com";
  let privateKey = process.env.GOOGLE_WALLET_PRIVATE_KEY;

  if (serviceAccountKey) {
    try {
      const parsed = JSON.parse(serviceAccountKey) as { client_email?: string; private_key?: string };
      serviceAccountEmail = parsed.client_email ?? serviceAccountEmail;
      privateKey = parsed.private_key ?? privateKey;
    } catch {
      privateKey = serviceAccountKey;
    }
  }

  if (privateKey) privateKey = privateKey.replace(/\\n/g, "\n");

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: serviceAccountEmail,
    aud: "google",
    typ: "savetowallet",
    iat: now,
    payload: { loyaltyClasses: [loyaltyClass], loyaltyObjects: [loyaltyObject] },
    origins: [appUrl],
  };

  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const body   = Buffer.from(JSON.stringify(payload)).toString("base64url");

  let jwt: string;
  if (privateKey) {
    try {
      const signer = createSign("RSA-SHA256");
      signer.update(`${header}.${body}`);
      jwt = `${header}.${body}.${signer.sign(privateKey, "base64url")}`;
    } catch (err) {
      throw new Error(`Google Wallet JWT signing failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  } else {
    jwt = `${header}.${body}.DEMO_SIGNATURE_NOT_VALID`;
  }

  return { jwt, saveUrl: `https://pay.google.com/gp/v/save/${jwt}` };
}
