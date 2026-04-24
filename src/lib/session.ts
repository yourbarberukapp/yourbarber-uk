import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export interface AppSession {
  barberId: string;
  shopId: string;
  role: 'owner' | 'barber';
  name: string;
  shopName: string;
}

export async function getRequiredSession(): Promise<AppSession> {
  const session = await auth();
  if (!session?.user) redirect('/login');
  const user = session.user as any;
  return {
    barberId: user.id,
    shopId: user.shopId,
    role: user.role,
    name: user.name ?? '',
    shopName: user.shopName ?? '',
  };
}
