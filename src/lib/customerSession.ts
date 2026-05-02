import { createHmac, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'yb_customer';
const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function secret() {
  return process.env.SESSION_SECRET ?? 'dev-secret-change-in-prod';
}

export function signCustomerToken(phone: string): string {
  const ts = Date.now().toString();
  const payload = `${phone}|${ts}`;
  const sig = createHmac('sha256', secret()).update(payload).digest('hex');
  return Buffer.from(`${payload}|${sig}`).toString('base64url');
}

export function verifyCustomerToken(token: string): string | null {
  try {
    const decoded = Buffer.from(token, 'base64url').toString();
    const parts = decoded.split('|');
    if (parts.length !== 3) return null;
    const [phone, ts, sig] = parts;
    if (Date.now() - parseInt(ts) > TTL_MS) return null;
    const payload = `${phone}|${ts}`;
    const expected = createHmac('sha256', secret()).update(payload).digest('hex');
    const sigBuf = Buffer.from(sig, 'hex');
    const expBuf = Buffer.from(expected, 'hex');
    if (sigBuf.length !== expBuf.length) return null;
    if (!timingSafeEqual(sigBuf, expBuf)) return null;
    return phone;
  } catch {
    return null;
  }
}

export async function getCustomerPhone(): Promise<string | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyCustomerToken(token);
}

export const CUSTOMER_COOKIE = COOKIE_NAME;
