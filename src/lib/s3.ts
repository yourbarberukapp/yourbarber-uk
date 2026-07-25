import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

function getS3Client() {
  return new S3Client({
    region: process.env.AWS_REGION ?? 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
    },
  });
}

const BUCKET = process.env.AWS_S3_BUCKET ?? 'yourbarber-photos';

export async function generateUploadUrl(key: string, contentType: string): Promise<string> {
  const s3 = getS3Client();
  const command = new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: contentType });
  return getSignedUrl(s3, command, { expiresIn: 300 });
}

export function getPublicUrl(key: string): string {
  const region = process.env.AWS_REGION ?? 'us-east-1';
  return `https://${BUCKET}.s3.${region}.amazonaws.com/${key}`;
}

/**
 * Only URLs pointing at our own S3 bucket are safe to fetch server-side.
 * logoUrl/passStripUrl are always written via generateUploadUrl+getPublicUrl
 * above, so this should never reject a legitimate value — it exists to stop
 * an attacker-supplied URL (e.g. a crafted logoUrl) from making the server
 * fetch arbitrary/internal hosts (SSRF) when we later re-fetch the image to
 * build Wallet pass artwork or extract a dominant colour.
 */
export function isTrustedAssetUrl(rawUrl: string): boolean {
  try {
    const url = new URL(rawUrl);
    if (url.protocol !== 'https:') return false;
    const region = process.env.AWS_REGION ?? 'us-east-1';
    return url.hostname === `${BUCKET}.s3.${region}.amazonaws.com`;
  } catch {
    return false;
  }
}

export async function generateReadUrl(publicUrl: string): Promise<string> {
  const s3 = getS3Client();
  const url = new URL(publicUrl);
  const key = url.pathname.slice(1);
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(s3, command, { expiresIn: 3600 });
}

export async function deleteS3Object(publicUrl: string): Promise<void> {
  const s3 = getS3Client();
  const url = new URL(publicUrl);
  const key = url.pathname.slice(1);
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}
