import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#0A0A0A] border-t border-white/8 py-12">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          <div className="md:col-span-2">
            <span className="font-barlow font-black text-2xl uppercase tracking-tight text-white block mb-3">
              Your<span className="text-[#C8F135]">Barber</span>
            </span>
            <p className="text-white/45 text-sm font-inter max-w-xs leading-relaxed">
              The smart client management system for independent barbershops. Record cuts, send SMS reminders, keep clients coming back.
            </p>
          </div>
          <div>
            <div className="font-barlow font-bold text-xs uppercase tracking-widest text-white/40 mb-4">Product</div>
            <ul className="space-y-2">
              {[
                { href: "/features", label: "Features" },
                { href: "/pricing", label: "Pricing" },
                { href: "/login", label: "Sign in" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>
                    <span className="text-white/55 hover:text-white text-sm font-inter transition-colors cursor-pointer">
                      {link.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="font-barlow font-bold text-xs uppercase tracking-widest text-white/40 mb-4">Account</div>
            <ul className="space-y-2">
              {[
                { href: "/login", label: "Sign in" },
                { href: "/pricing", label: "Get access" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>
                    <span className="text-white/55 hover:text-white text-sm font-inter transition-colors cursor-pointer">
                      {link.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="section-divider mb-6" />
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-white/30 text-xs font-inter">
          <span>© 2025 YourBarber.co.uk — Built by Antigravity</span>
          <span>yourbarber.co.uk</span>
        </div>
      </div>
    </footer>
  );
}
