import { getRequiredSession } from '@/lib/session';
import { signOut } from '@/lib/auth';
import Link from 'next/link';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getRequiredSession();

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <span className="font-bold text-lg">yourbarber</span>
          <span className="text-sm text-neutral-400">{session.shopName}</span>
        </div>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/customers" className="text-neutral-600 hover:text-black">Customers</Link>
          <Link href="/reminders" className="text-neutral-600 hover:text-black">Reminders</Link>
          {session.role === 'owner' && (
            <>
              <Link href="/team" className="text-neutral-600 hover:text-black">Team</Link>
              <Link href="/settings" className="text-neutral-600 hover:text-black">Settings</Link>
            </>
          )}
          <form action={async () => { 'use server'; await signOut({ redirectTo: '/login' }); }}>
            <button type="submit" className="text-neutral-500 hover:text-black text-sm">Sign out</button>
          </form>
        </nav>
      </header>
      <main className="flex-1 p-4 max-w-2xl mx-auto w-full">{children}</main>
    </div>
  );
}
