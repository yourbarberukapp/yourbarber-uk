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
    name: "Solo",
    price: "24",
    foundingPrice: null,
    desc: "For solo barbers running a one-chair operation.",
    features: [
      "1 Barber account",
      "Unlimited customers",
      "4-angle photo history",
      "SMS reminders",
      "QR code for wall",
      "Phone-friendly barber view",
    ],
    notIncluded: [
      "Multi-barber team",
      "Owner reporting dashboard",
      "Multi-shop networks",
    ],
    cta: "Start free trial",
    highlight: false,
  },
  {
    name: "Shop",
    price: "49",
    foundingPrice: "29",
    desc: "For multi-chair shops that run as one team.",
    features: [
      "Unlimited barbers",
      "Unlimited customers",
      "Shared cut history across the team",
      "Owner management dashboard",
      "Live walk-in queue + family check-in",
      "SMS reminders + nudges",
      "Priority UK support",
    ],
    notIncluded: [
      "Multi-shop networks",
    ],
    cta: "Get founding price",
    highlight: true,
  },
  {
    name: "Network",
    price: "99",
    foundingPrice: null,
    desc: "For barbers running 2–5 shops across the city.",
    features: [
      "Everything in Shop",
      "Up to 5 locations",
      "Shared global client history",
      "Clear reporting across every shop",
      "Custom QR branding per shop",
      "Dedicated onboarding",
    ],
    notIncluded: [],
    cta: "Talk to us",
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
            <p className="text-white/55 font-inter text-lg max-w-2xl mx-auto mb-6 leading-relaxed">
              Booking platforms take 20–30% of every new client. We don't. One flat monthly fee, you own your data forever.
            </p>
            <div className="inline-flex items-center gap-3 bg-[#C8F135]/8 border border-[#C8F135]/20 rounded-full px-5 py-2 mb-10">
              <span className="text-[#C8F135] font-barlow font-black text-base">£29/mo</span>
              <span className="text-white/30 text-sm font-inter">founding price — locks in for life</span>
              <span className="text-white/20 line-through text-sm font-inter">£49</span>
            </div>
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
                    Founding Offer
                  </div>
                )}
                <h3 className="font-barlow font-bold text-xl uppercase tracking-wide mb-2">{plan.name}</h3>
                <div className="mb-4">
                  {plan.foundingPrice ? (
                    <>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-4xl font-barlow font-black text-[#C8F135]">£{plan.foundingPrice}</span>
                        <span className="text-white/30 text-sm font-inter">/mo</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-white/25 line-through text-sm font-inter">£{plan.price}/mo</span>
                        <span className="text-[10px] font-barlow font-bold uppercase tracking-widest text-[#C8F135]/60">for life</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-barlow font-black">£{plan.price}</span>
                      <span className="text-white/30 text-sm font-inter">/mo</span>
                    </div>
                  )}
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
          <h2 className="font-barlow font-black text-4xl uppercase text-[#0A0A0A] mb-8">Ready to own your client base?</h2>
          <Link href="/demo-hub">
            <button className="bg-[#0A0A0A] text-white px-10 py-4 text-lg rounded-sm font-barlow font-bold uppercase tracking-wide hover:bg-[#1a1a1a] transition-colors flex items-center gap-2 mx-auto">
              Try the demo <ArrowRight size={18} />
            </button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
