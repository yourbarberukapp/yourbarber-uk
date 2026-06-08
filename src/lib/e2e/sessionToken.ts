export interface PlaywrightSessionPayload {
  barberId: string;
  shopId: string;
  role: 'owner' | 'barber';
  name: string;
  shopName: string;
  shopSlug: string;
}

export function encodePlaywrightSession(payload: PlaywrightSessionPayload): string {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

export function decodePlaywrightSession(token: string): PlaywrightSessionPayload | null {
  try {
    const parsed = JSON.parse(Buffer.from(token, 'base64url').toString('utf8')) as Partial<PlaywrightSessionPayload>;
    if (
      !parsed ||
      typeof parsed.barberId !== 'string' ||
      typeof parsed.shopId !== 'string' ||
      (parsed.role !== 'owner' && parsed.role !== 'barber') ||
      typeof parsed.name !== 'string' ||
      typeof parsed.shopName !== 'string' ||
      typeof parsed.shopSlug !== 'string'
    ) {
      return null;
    }

    return {
      barberId: parsed.barberId,
      shopId: parsed.shopId,
      role: parsed.role,
      name: parsed.name,
      shopName: parsed.shopName,
      shopSlug: parsed.shopSlug,
    };
  } catch {
    return null;
  }
}
