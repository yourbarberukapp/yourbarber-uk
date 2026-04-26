'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, Bell, UserPlus, Settings, LogOut, Menu, X, Globe, MessageSquare, Calendar, ListOrdered } from 'lucide-react';
import { AppSession } from '@/lib/session';

interface Props {
  session: AppSession;
  signOutAction: () => Promise<void>;
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Globe },
  { href: '/waitlist', label: 'Walk-ins', icon: ListOrdered },
  { href: '/appointments', label: 'Appointments', icon: Calendar },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/reminders', label: 'Reminders', icon: Bell },
];

const ownerItems = [
  { href: '/team', label: 'Team', icon: UserPlus },
  { href: '/feedback', label: 'Feedback', icon: MessageSquare },
  { href: '/settings/microsite', label: 'Microsite', icon: Globe },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ session, signOutAction }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => pathname.startsWith(href);

  const initials = session.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const allNav = [...navItems, ...(session.role === 'owner' ? ownerItems : [])];

  function Content() {
    return (
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="p-6 border-b border-white/5">
          <div className="font-barlow font-black text-xl uppercase tracking-tight text-white flex items-center gap-2">
            YOUR<span className="text-primary">BARBER</span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{session.shopName}</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 flex flex-col gap-1">
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-3 mb-2 opacity-50">
            Menu
          </div>
          {allNav.map(item => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-sm transition-all duration-200 group
                  ${active 
                    ? 'bg-primary/10 text-primary font-semibold' 
                    : 'text-muted-foreground hover:bg-white/[0.03] hover:text-white'}
                `}
              >
                <item.icon size={18} className={`${active ? 'text-primary' : 'text-muted-foreground group-hover:text-white'} transition-colors`} />
                <span className="text-sm tracking-tight">{item.label}</span>
                {active && <div className="ml-auto w-1 h-1 rounded-full bg-primary shadow-[0_0_8px_oklch(0.88_0.22_120)]" />}
              </Link>
            );
          })}
        </nav>

        {/* Bottom: user + sign out */}
        <div className="p-4 border-t border-white/5 bg-white/[0.01]">
          <div className="flex items-center gap-3 p-2 mb-2">
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center border border-primary/20 shrink-0">
              <span className="text-primary text-xs font-bold font-barlow">{initials}</span>
            </div>
            <div className="min-w-0">
              <div className="text-white text-sm font-semibold truncate leading-tight">{session.name}</div>
              <div className="text-muted-foreground text-[10px] uppercase tracking-wider font-bold">{session.role}</div>
            </div>
          </div>
          
          <form action={signOutAction}>
            <button
              type="submit"
              className="flex items-center gap-3 w-full px-3 py-2 rounded-sm text-muted-foreground hover:text-white hover:bg-white/[0.03] transition-colors group"
            >
              <LogOut size={16} className="text-muted-foreground group-hover:text-white" />
              <span className="text-xs font-medium">Sign out</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 text-white/60 bg-black/40 backdrop-blur-md border border-white/10 rounded-sm p-2 transition-all hover:bg-black/60"
      >
        <Menu size={20} />
      </button>

      {/* Mobile overlay */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`
          lg:hidden fixed top-0 left-0 bottom-0 z-50 w-64 bg-[#0A0A0A] border-r border-white/5 flex flex-col
          transition-transform duration-300 ease-out
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <button
          onClick={() => setOpen(false)}
          className="absolute top-6 right-4 text-muted-foreground hover:text-white transition-colors"
        >
          <X size={20} />
        </button>
        <Content />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed top-0 left-0 bottom-0 w-60 bg-[#0A0A0A] border-r border-white/5 flex-col z-40">
        <Content />
      </aside>
    </>
  );
}

