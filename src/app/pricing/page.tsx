'use client';

import { motion } from 'framer-motion';
import { Check, X, ArrowRight, Zap, Shield, Users } from 'lucide-react';
import Link from 'next/link';
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

const plans = [
  {
    name: "Independent",
    price: "19",
    desc: "Perfect for solo barbers or tiny 2-chair shops.",
    features: [
      "1 Barber account",
      "Unlimited customers",
      "4-angle photo history",
      "SMS reminders",
      "Branded QR card generator",
      "PWA Home Screen App",
    ],
    notIncluded: [
      "Multi-shop networks",
      "Shared team database",
      "Owner reporting dashboard",
    ],
    cta: "Start free trial",
    highlight: false,
  },
  {
    name: "Shop Team",
    price: "39",
    desc: "For multi-chair shops that work as one unit.",
    features: [
      "Up to 6 Barbers",
      "1 Shop location",
      "Shared customer history",
      "Owner management roles",
      "Team analytics",
      "Priority UK support",
    ],
    notIncluded: [
      "Multi-shop networks",
      "Custom branding for QR",
    ],
    cta: "Launch your shop",
    highlight: true,
  },
  {
    name: "The Network",
    price: "89",
    desc: "For barbers with 2-5 shops across the city.",
    features: [
      "Unlimited Barbers",
      "Up to 5 Shops",
      "Shared global history",
      "Network-wide analytics",
      "Multi-shop CRM",
      "Custom QR branding",
    ],
    notIncluded: [],
    cta: "Scale your empire",
    highlight: false,
  },
];

const comparison = [
  { feature: "Commission on new clients", us: "0%", booksy: "30%", fresha: "20%" },
  { feature: "Customer owns their photos", us: true, booksy: false, fresha: false },
  { feature: "Search by phone number", us: true, booksy: true, fresha: "Limited" },
  { feature: "QR + iPad photo reference", us: true, booksy: false, fresha: false },
  { feature: "Multi-shop following", us: true, booksy: false, fresha: false },
  { feature: "Hidden booking fees", us: "None", booksy: "Variable", fresha: "2.5% + 15p" },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <Navbar />

      {/* Hero */}
      <section className="pt-40 pb-20 px-6">
        <div className="container mx-auto max-w-5xl text-center">
          <motion.div initial="hidden" animate="visible" custom={0} variants={fadeUp}>
            <span className="badge-lime mb-6 inline-block">Transparent pricing</span>
            <h1 className="font-barlow font-black text-[clamp(2.5rem,8vw,5rem)] uppercase leading-[0.9] mb-8">
              Keep your <span className="text-[#C8F135]">profit.</span><br />
              Zero commission.
            </h1>
            <p className="text-white/55 font-inter text-lg max-w-2xl mx-auto mb-12 leading-relaxed">
              Booking platforms take 20-30% of your new clients. We don't. You pay a flat monthly fee, and you own your data forever.
            </p>
          </motion.div>

          {/* Plan Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left mb-32">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial="hidden"
                animate="visible"
                custom={i + 1}
                variants={fadeUp}
                className={`relative p-8 rounded-xl border ${
                  plan.highlight 
                    ? "bg-[#141414] border-[#C8F135]/40 shadow-[0_0_40px_rgba(200,241,53,0.05)]" 
                    : "bg-[#0f0f0f] border-white/10"
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#C8F135] text-[#0A0A0A] font-barlow font-bold text-[10px] uppercase tracking-widest px-3 py-1 rounded-full">
                    Most Popular
                  </div>
                )}
                <h3 className="font-barlow font-bold text-xl uppercase tracking-wide mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-4xl font-barlow font-black">£{plan.price}</span>
                  <span className="text-white/30 text-sm font-inter">/mo</span>
                </div>
                <p className="text-white/45 text-sm font-inter mb-8 h-10">{plan.desc}</p>
                
                <Link href="/demo">
                  <button className={`w-full py-3 text-sm font-bold uppercase tracking-widest rounded-sm mb-8 transition-all ${
                    plan.highlight 
                      ? "bg-[#C8F135] text-[#0A0A0A] hover:bg-white" 
                      : "border border-white/20 text-white hover:border-white/50"
                  }`}>
                    {plan.cta}
                  </button>
                </Link>

                <div className="space-y-4">
                  {plan.features.map(f => (
                    <div key={f} className="flex items-center gap-3 text-sm text-white/70 font-inter">
                      <Check size={14} className="text-[#C8F135] flex-shrink-0" />
                      {f}
                    </div>
                  ))}
                  {plan.notIncluded.map(f => (
                    <div key={f} className="flex items-center gap-3 text-sm text-white/20 font-inter">
                      <X size={14} className="flex-shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Comparison Table */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="mb-32"
          >
            <h2 className="font-barlow font-black text-4xl uppercase mb-12">The <span className="text-[#C8F135]">Anti-Tax</span> Movement</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="py-6 font-barlow font-bold text-xs uppercase tracking-widest text-white/40">Comparison</th>
                    <th className="py-6 font-barlow font-bold text-xs uppercase tracking-widest text-[#C8F135]">YourBarber</th>
                    <th className="py-6 font-barlow font-bold text-xs uppercase tracking-widest text-white/40">Booksy</th>
                    <th className="py-6 font-barlow font-bold text-xs uppercase tracking-widest text-white/40">Fresha</th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.map((row, i) => (
                    <tr key={row.feature} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="py-5 font-inter text-sm text-white/70">{row.feature}</td>
                      <td className="py-5 font-inter text-sm font-bold text-white">
                        {typeof row.us === 'boolean' ? (row.us ? <Check size={16} className="text-[#C8F135]" /> : <X size={16} />) : row.us}
                      </td>
                      <td className="py-5 font-inter text-sm text-white/40">
                        {typeof row.booksy === 'boolean' ? (row.booksy ? <Check size={16} /> : <X size={16} />) : row.booksy}
                      </td>
                      <td className="py-5 font-inter text-sm text-white/40">
                        {typeof row.fresha === 'boolean' ? (row.fresha ? <Check size={16} /> : <X size={16} />) : row.fresha}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* FAQ / Trust */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-left pb-20">
            <div>
              <Zap size={24} className="text-[#C8F135] mb-4" />
              <h4 className="font-barlow font-bold uppercase tracking-wide mb-3">No Vendor Lock-In</h4>
              <p className="text-white/45 text-sm leading-relaxed font-inter">Export your entire customer database and photo history at any time. Your data is yours.</p>
            </div>
            <div>
              <Shield size={24} className="text-[#C8F135] mb-4" />
              <h4 className="font-barlow font-bold uppercase tracking-wide mb-3">GDPR Compliant</h4>
              <p className="text-white/45 text-sm leading-relaxed font-inter">Photos are stored in private S3 buckets. Customers can view and manage their own cut passport.</p>
            </div>
            <div>
              <Users size={24} className="text-[#C8F135] mb-4" />
              <h4 className="font-barlow font-bold uppercase tracking-wide mb-3">Built for Growth</h4>
              <p className="text-white/45 text-sm leading-relaxed font-inter">We don't charge more as you get more clients. Scalable pricing for shops of all sizes.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#C8F135] py-20 px-6">
        <div className="container mx-auto text-center">
          <h2 className="font-barlow font-black text-4xl uppercase text-[#0A0A0A] mb-8">Ready to own your client base?</h2>
          <Link href="/demo">
            <button className="bg-[#0A0A0A] text-white px-10 py-4 text-lg rounded-sm font-barlow font-bold uppercase tracking-wide hover:bg-[#1a1a1a] transition-colors flex items-center gap-2 mx-auto">
              Book your demo <ArrowRight size={18} />
            </button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
