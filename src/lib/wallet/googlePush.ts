import { createSign } from 'crypto';

function getServiceAccount(): { email: string; privateKey: string } | null {
  const raw = process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_KEY;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed.client_email || !parsed.private_key) return null;
    return { email: parsed.client_email, privateKey: parsed.private_key.replace(/\\n/g, '\n') };
  } catch {
    return null;
  }
}

async function getAccessToken(): Promise<string | null> {
  const account = getServiceAccount();
  if (!account) return null;

  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const claims = Buffer.from(JSON.stringify({
    iss: account.email,
    scope: 'https://www.googleapis.com/auth/wallet_object.issuer',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  })).toString('base64url');

  const signer = createSign('RSA-SHA256');
  signer.update(`${header}.${claims}`);
  const signature = signer.sign(account.privateKey, 'base64url');
  const assertion = `${header}.${claims}.${signature}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.access_token ?? null;
}

/** Patches a Google Wallet loyalty object's live fields and (optionally) shows a notification banner. */
export async function pushGoogleWalletUpdate(params: {
  objectId: string;
  loyaltyStamps: number;
  loyaltyReward: string;
  queuePosition?: number | null;
  message?: string | null;
}): Promise<void> {
  const accessToken = await getAccessToken();
  if (!accessToken) return; // No service account configured — no-op, matches other wallet fallbacks.

  const textModulesData = [
    { header: 'Reward', body: params.loyaltyReward, id: 'reward' },
    { header: 'Queue Status', body: params.queuePosition ? `Position #${params.queuePosition}` : 'Not in queue', id: 'queue' },
    ...(params.message ? [{ header: 'Update', body: params.message, id: 'message' }] : []),
  ];

  const body: Record<string, unknown> = {
    loyaltyPoints: { balance: { int: params.loyaltyStamps }, label: 'Stamps' },
    textModulesData,
  };

  if (params.message) {
    body.messages = [{ header: 'Update', body: params.message, id: `msg-${Date.now()}` }];
  }

  await fetch(`https://walletobjects.googleapis.com/walletobjects/v1/loyaltyObject/${params.objectId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  }).catch(() => {});
}
