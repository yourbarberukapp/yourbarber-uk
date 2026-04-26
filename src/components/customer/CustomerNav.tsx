'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Clock, Settings } from 'lucide-react';

export default function CustomerNav() {
  const pathname = usePathname();

  const links = [
    { href: '/customer', label: 'Home', icon: Home, exact: true },
    { href: '/customer/history', label: 'History', icon: Clock },
    { href: '/customer/preferences', label: 'Settings', icon: Settings },
  ];

  // Don't show nav on the login page
  if (pathname === '/customer/login') return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#0A0A0A]/90 backdrop-blur-md border-t border-white/10 pb-safe z-40">
      <div className="max-w-lg mx-auto flex justify-around items-center h-16">
        {links.map((link) => {
          const isActive = link.exact ? pathname === link.href : pathname.startsWith(link.href);
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
                isActive ? 'text-[#C8F135]' : 'text-white/40 hover:text-white/70'
              }`}
            >
              <Icon size={20} />
              <span className="text-[10px] font-inter font-medium tracking-wide uppercase">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
