import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
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
