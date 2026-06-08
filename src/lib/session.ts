import { auth } from '@/lib/auth';
import { decodePlaywrightSession } from '@/lib/e2e/sessionToken';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

// Hard-fail at module load: the E2E session bypass must never reach production.
// If this throws, the server refuses to start rather than silently enabling auth spoofing.
if (process.env.PLAYWRIGHT_E2E === 'true' && process.env.NODE_ENV === 'production') {
  throw new Error(
    '[session] PLAYWRIGHT_E2E=true is not permitted in NODE_ENV=production. ' +
    'Remove this env variable from your production environment immediately.'
  );
}

export interface AppSession {
  barberId: string;
  shopId: string;
  role: 'owner' | 'barber';
  name: string;
  shopName: string;
  shopSlug: string;
}

async function getPlaywrightSession(): Promise<AppSession | null> {
  if (process.env.PLAYWRIGHT_E2E !== 'true') return null;

  const cookieStore = await cookies();
  const token = cookieStore.get('app_session_id')?.value;
  if (!token) return null;

  return decodePlaywrightSession(token);
}

export async function getRequiredSession(): Promise<AppSession> {
  const playwrightSession = await getPlaywrightSession();
  if (playwrightSession) return playwrightSession;

  const session = await auth();
  if (!session?.user) redirect('/login');
  const user = session.user as any;
  return {
    barberId: user.id,
    shopId: user.shopId,
    role: user.role,
    name: user.name ?? '',
    shopName: user.shopName ?? '',
    shopSlug: user.shopSlug ?? '',
  };
}

export async function getSession(): Promise<AppSession | null> {
  const playwrightSession = await getPlaywrightSession();
  if (playwrightSession) return playwrightSession;

  const session = await auth();
  if (!session?.user) return null;
  const user = session.user as any;
  return {
    barberId: user.id,
    shopId: user.shopId,
    role: user.role,
    name: user.name ?? '',
    shopName: user.shopName ?? '',
    shopSlug: user.shopSlug ?? '',
  };
}
