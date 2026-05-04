'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import DemoOverrideTrigger from "./DemoOverrideTrigger";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "/features", label: "Features" },
    { href: "/pricing", label: "Pricing" },
    { href: "/demo-hub", label: "Live Demo" },
    { href: "/demo", label: "Early Access" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 border-b border-white/8 backdrop-blur-md transition-all duration-300 ${
        scrolled
          ? "bg-[#0A0A0A]/94 shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
          : "bg-[#0A0A0A]/72"
      }`}
    >
      <div className="container mx-auto px-6 lg:px-12 flex items-center justify-between h-16">
        {/* Logo */}
        <DemoOverrideTrigger />

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <span
                className={`font-inter text-sm transition-colors cursor-pointer ${
                  pathname === link.href || (link.href === "/features" && pathname.startsWith("/features"))
                    ? "text-[#C8F135]"
                    : "text-white/65 hover:text-white"
                }`}
              >
                {link.label}
              </span>
            </Link>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/login">
            <span className="font-inter text-sm text-white/65 hover:text-white transition-colors cursor-pointer">
              Sign in
            </span>
          </Link>
          <Link href="/#waitlist">
            <button className="btn-lime px-5 py-2 text-sm">
              Get beta access
            </button>
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden text-white/70 hover:text-white transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-[#0A0A0A] border-t border-white/10 px-6 py-6 flex flex-col gap-4">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <span
                className="font-barlow font-bold text-xl uppercase tracking-wide text-white/80 hover:text-white block"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </span>
            </Link>
          ))}
          <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
            <Link href="/login">
              <span className="font-inter text-sm text-white/65 block" onClick={() => setMobileOpen(false)}>
                Sign in
              </span>
            </Link>
            <Link href="/#waitlist">
              <button className="btn-lime px-5 py-3 text-sm w-full" onClick={() => setMobileOpen(false)}>
                Get beta access
              </button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
