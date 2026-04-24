import { getRequiredSession } from '@/lib/session';
import { signOut } from '@/lib/auth';
import { Sidebar } from './Sidebar';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getRequiredSession();

  async function handleSignOut() {
    'use server';
    await signOut({ redirectTo: '/login' });
  }

  return (
    <div className="min-h-screen flex bg-[#0A0A0A] selection:bg-primary/30 selection:text-white">
      <Sidebar session={session} signOutAction={handleSignOut} />
      <main className="flex-1 lg:ml-60 min-h-screen flex flex-col relative overflow-hidden">
        {/* Grain overlay for premium texture */}
        <div className="grain-overlay pointer-events-none opacity-20" />
        
        <div className="flex-1 relative z-10 px-4 py-8 lg:px-12 lg:py-12 max-w-7xl w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
