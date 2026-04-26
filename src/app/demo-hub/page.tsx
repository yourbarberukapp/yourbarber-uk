'use client';

import { motion } from 'framer-motion';
import { 
  Monitor, 
  Smartphone, 
  Layout, 
  ArrowRight, 
  ExternalLink, 
  ShieldCheck, 
  Zap, 
  CheckCircle2,
  Lock,
  LogOut
} from 'lucide-react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: 'easeOut' as const },
  }),
};

const screens = [
  {
    id: "kiosk",
    title: "Customer Kiosk",
    subtitle: "The Arrival Screen",
    desc: "The public page customers scan on their own phone when they walk in. Zero friction, zero login, instant waitlist addition.",
    icon: Smartphone,
    color: "#C8F135",
    link: "/arrive/benj-barbers",
    login: "No login required",
    features: [
      "Phone number lookup",
      "Style preference picker",
      "Queue position tracker",
      "GDPR SMS opt-in"
    ]
  },
  {
    id: "barber",
    title: "Barber Mode",
    subtitle: "Staff Queue View",
    desc: "The mobile-first view for barbers on the shop floor. Designed to be added to the phone home screen as a PWA.",
    icon: Monitor,
    color: "#C8F135",
    link: "/barber",
    login: "jake@benjbarbers.com / barber123",
    features: [
      "Personal daily queue",
      "Quick client lookup",
      "One-tap cut recording",
      "Photo history access"
    ]
  },
  {
    id: "owner",
    title: "Owner Dashboard",
    subtitle: "Shop Management",
    desc: "The full-power control centre. Manage the team, view analytics, download QR materials, and control shop settings.",
    icon: Layout,
    color: "#C8F135",
    link: "/dashboard",
    login: "owner@benjbarbers.com / owner123",
    features: [
      "Team management",
      "Global visit history",
      "Bulk SMS marketing",
      "Financial analytics"
    ]
  }
];

export default function DemoHubPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <Navbar />

      <section className="pt-40 pb-24 px-6">
        <div className="container mx-auto max-w-6xl">
          <motion.div initial="hidden" animate="visible" custom={0} variants={fadeUp} className="text-center mb-20">
            <span className="badge-lime mb-6 inline-block">Product Experience</span>
            <h1 className="font-barlow font-black text-[clamp(2.5rem,8vw,5.5rem)] uppercase leading-[0.9] mb-8">
              The <span className="text-[#C8F135]">3-Screen</span><br />
              System.
            </h1>
            <p className="text-white/45 font-inter text-lg max-w-2xl mx-auto mb-12 leading-relaxed">
              YourBarber isn't just one app. It's an ecosystem designed for the specific needs of the Customer, the Barber, and the Owner.
            </p>

            <div className="flex justify-center items-center gap-4 p-4 bg-white/[0.03] border border-white/5 rounded-full max-w-md mx-auto mb-8">
              <span className="text-xs font-barlow font-bold uppercase tracking-widest text-white/40">Switching personas?</span>
              <button 
                onClick={() => signOut({ callbackUrl: '/demo-hub' })}
                className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#C8F135] hover:text-white transition-colors"
              >
                <LogOut size={14} /> Sign Out First
              </button>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-24">
            {screens.map((screen, i) => (
              <motion.div
                key={screen.id}
                initial="hidden"
                animate="visible"
                custom={i + 1}
                variants={fadeUp}
                className="group relative bg-[#0f0f0f] border border-white/10 rounded-xl overflow-hidden hover:border-[#C8F135]/40 transition-all shadow-2xl"
              >
                <div className="p-8">
                  <div className="w-12 h-12 rounded-sm bg-[#C8F135]/10 flex items-center justify-center mb-6 group-hover:bg-[#C8F135]/20 transition-colors">
                    <screen.icon size={24} className="text-[#C8F135]" />
                  </div>
                  
                  <div className="mb-6">
                    <h3 className="font-barlow font-black text-2xl uppercase tracking-tight mb-1">{screen.title}</h3>
                    <p className="font-barlow font-bold text-xs uppercase tracking-widest text-[#C8F135]/60">{screen.subtitle}</p>
                  </div>

                  <p className="text-white/50 text-sm font-inter leading-relaxed mb-8 h-20">
                    {screen.desc}
                  </p>

                  <ul className="space-y-3 mb-10 border-t border-white/5 pt-8">
                    {screen.features.map(f => (
                      <li key={f} className="flex items-center gap-3 text-xs font-inter text-white/70">
                        <CheckCircle2 size={14} className="text-[#C8F135]" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <div className="bg-black/40 rounded-lg p-4 mb-8 border border-white/5">
                    <div className="flex items-center gap-2 mb-2">
                      <Lock size={12} className="text-white/30" />
                      <span className="text-[10px] font-barlow font-bold uppercase tracking-widest text-white/30">Demo Credentials</span>
                    </div>
                    <p className="text-sm font-mono text-white/80">{screen.login}</p>
                  </div>

                  <Link href={screen.link}>
                    <button className="w-full py-4 bg-white/5 hover:bg-[#C8F135] hover:text-[#0A0A0A] text-white font-barlow font-bold uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-2 rounded-sm border border-white/10 hover:border-transparent">
                      Launch Demo <ExternalLink size={16} />
                    </button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Value Prop Banner */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="bg-[#141414] border border-white/10 rounded-2xl p-12 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
               <Zap size={200} className="text-[#C8F135]" />
            </div>
            <div className="max-w-2xl relative z-10">
              <h2 className="font-barlow font-black text-4xl uppercase mb-6 italic leading-tight">
                Designed to be <span className="text-[#C8F135]">Invisible</span>.
              </h2>
              <p className="text-white/50 font-inter leading-relaxed mb-8">
                The best technology doesn't get in the way of the haircut. YourBarber lives on the wall (Kiosk), in the pocket (Barber), and on the desk (Owner). It creates a seamless flow that helps you focus on the craft, not the computer.
              </p>
              <div className="flex flex-wrap gap-8">
                <div>
                  <div className="text-[#C8F135] font-barlow font-black text-3xl mb-1">0%</div>
                  <div className="text-xs font-barlow font-bold uppercase tracking-widest text-white/30">Commission</div>
                </div>
                <div>
                  <div className="text-[#C8F135] font-barlow font-black text-3xl mb-1">100%</div>
                  <div className="text-xs font-barlow font-bold uppercase tracking-widest text-white/30">Data Ownership</div>
                </div>
                <div>
                  <div className="text-[#C8F135] font-barlow font-black text-3xl mb-1">&lt;30s</div>
                  <div className="text-xs font-barlow font-bold uppercase tracking-widest text-white/30">Admin Per Cut</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
