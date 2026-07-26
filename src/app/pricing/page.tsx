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

const plan = {
  name: "Shop",
  price: "29",
  foundingPrice: "20",
  desc: "One flat price per shop, however many chairs or barbers you run.",
  features: [
    "Unlimited barbers",
    "Unlimited customers",
    "Shared cut history across the team",
    "Owner management dashboard",
    "Live walk-in queue",
    "Cut Passport with 4-angle photo history",
    "Free Wallet-pass reminders — no SMS cost",
    "QR code for your wall or desk",
    "Priority UK support",
  ],
  cta: "Claim founding price",
};

const comparison = [
  { feature: "Commission on new clients", us: "0%", booksy: "30%", fresha: "20%" },
  { feature: "Customer owns their photos", us: true, booksy: false, fresha: false },
  { feature: "Search by phone number", us: true, booksy: true, fresha: "Limited" },
  { feature: "QR + iPad photo reference", us: true, booksy: false, fresha: false },
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
            <p className="text-white/55 font-inter text-lg max-w-2xl mx-auto mb-6 leading-relaxed">
              Booking platforms take 20–30% of every new client. We don't. One flat monthly fee per shop, you own your data forever.
            </p>
            <div className="inline-flex items-center gap-3 bg-[#C8F135]/8 border border-[#C8F135]/20 rounded-full px-5 py-2 mb-10">
              <span className="text-[#C8F135] font-barlow font-black text-base">£20/mo</span>
              <span className="text-white/30 text-sm font-inter">founding price for the first 20 shops — locks in for life</span>
              <span className="text-white/20 line-through text-sm font-inter">£29</span>
            </div>
          </motion.div>

          {/* Plan Card */}
          <div className="flex justify-center mb-32">
            <motion.div
              initial="hidden"
              animate="visible"
              custom={1}
              variants={fadeUp}
              className="relative p-8 rounded-xl border bg-[#141414] border-[#C8F135]/40 shadow-[0_0_40px_rgba(200,241,53,0.05)] max-w-md w-full text-left"
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#C8F135] text-[#0A0A0A] font-barlow font-bold text-[10px] uppercase tracking-widest px-3 py-1 rounded-full whitespace-nowrap">
                Founding Offer — First 20 Shops
              </div>
              <h3 className="font-barlow font-bold text-xl uppercase tracking-wide mb-2">{plan.name}</h3>
              <div className="mb-4">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-4xl font-barlow font-black text-[#C8F135]">£{plan.foundingPrice}</span>
                  <span className="text-white/30 text-sm font-inter">/mo</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-white/25 line-through text-sm font-inter">£{plan.price}/mo</span>
                  <span className="text-[10px] font-barlow font-bold uppercase tracking-widest text-[#C8F135]/60">for life</span>
                </div>
              </div>
              <p className="text-white/45 text-sm font-inter mb-8">{plan.desc}</p>

              <Link href="/signup">
                <button className="w-full py-3 text-sm font-bold uppercase tracking-widest rounded-sm mb-8 transition-all bg-[#C8F135] text-[#0A0A0A] hover:bg-white">
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
              </div>

              <p className="mt-8 pt-6 border-t border-white/10 text-white/35 text-xs font-inter leading-relaxed">
                Running more than one shop? Each location is its own £{plan.foundingPrice}/mo — no bundled multi-shop tier, no extra fee for scale.
              </p>
            </motion.div>
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
                  {comparison.map((row) => (
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
              <h4 className="font-barlow font-bold uppercase tracking-wide mb-3">Take Your History With You</h4>
              <p className="text-white/45 text-sm leading-relaxed font-inter">Your client list, haircut notes, and photo history belong to your shop. You can take them with you any time.</p>
            </div>
            <div>
              <Shield size={24} className="text-[#C8F135] mb-4" />
              <h4 className="font-barlow font-bold uppercase tracking-wide mb-3">Private by Default</h4>
              <p className="text-white/45 text-sm leading-relaxed font-inter">Cut photos stay private, and customers can view and manage their own Cut Passport.</p>
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
          <h2 className="font-barlow font-black text-4xl uppercase text-[#0A0A0A] mb-4">Know every client. Every time.</h2>
          <p className="text-[#0A0A0A]/60 font-inter mb-8">First 20 shops only. £20/month, locked in for life.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/">
              <button className="bg-[#0A0A0A] text-[#C8F135] px-10 py-4 text-base rounded-sm font-barlow font-black uppercase tracking-wide hover:bg-[#1a1a1a] transition-colors flex items-center gap-2 mx-auto">
                Claim founding spot <ArrowRight size={18} />
              </button>
            </Link>
            <Link href="/demo-hub">
              <button className="border-2 border-[#0A0A0A]/25 text-[#0A0A0A] px-10 py-4 text-base rounded-sm font-barlow font-bold uppercase tracking-wide hover:border-[#0A0A0A]/50 transition-colors">
                Try the demo
              </button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
