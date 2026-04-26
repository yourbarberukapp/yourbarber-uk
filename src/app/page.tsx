'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  Check, 
  Scissors, 
  MessageSquare, 
  Users, 
  Camera, 
  Search, 
  Bell 
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.1, ease: "easeOut" as const },
  }),
};

const coreLoop = [
  { step: "01", title: "Finish the cut", desc: "Barber records 4 photos — front, back, left, right — and writes quick notes on scissors grade, clippers, and what was done." },
  { step: "02", title: "Ask for the number", desc: "Get the customer's phone number. Ask: \"Want an SMS reminder in 6 weeks?\" — stores Yes/No instantly." },
  { step: "03", title: "Reminder fires at 6 weeks", desc: "The system automatically sends an SMS: \"Hi Marcus, it's been 6 weeks since your cut at Ben J Barbers. Book in?\"" },
  { step: "04", title: "Next visit: instant recall", desc: "Customer walks in. Barber searches by phone number. Last cut photo + notes appear in under 5 seconds." },
];

const features = [
  { icon: Camera, title: "4-Angle Photo Record", desc: "Front, back, left, right. Every cut documented so the next barber — or the same one — knows exactly what was done." },
  { icon: Search, title: "Search by Phone", desc: "Phone number is the primary key. Fast, accurate, no spelling mistakes. Find any customer in under 3 seconds." },
  { icon: Bell, title: "Automatic SMS at 6 Weeks", desc: "Set it and forget it. The system fires reminders automatically. Barbers can also bulk-send manually." },
  { icon: Users, title: "Multi-Barber Teams", desc: "Shop owner invites barbers via email. Each barber logs in separately. Customer data stays with the shop." },
  { icon: MessageSquare, title: "SMS Opt-In Tracking", desc: "See who said yes, who said no, and who hasn't been asked. Update status if a customer says they didn't receive it." },
  { icon: Scissors, title: "Freeform Barber Notes", desc: "Scissors grade, clippers, what was done, chat notes. Anything the barber needs to remember, stored with the visit." },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white overflow-x-hidden grain-overlay selection:bg-[#C8F135] selection:text-[#0A0A0A]">
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/hero-ipad.png"
            alt="Barber using YourBarber app on iPad"
            fill
            className="object-cover object-center opacity-60"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A] via-[#0A0A0A]/85 to-[#0A0A0A]/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent" />
        </div>

        <div className="relative container mx-auto px-6 lg:px-12 py-32 lg:py-40">
          <div className="max-w-3xl">
            <motion.div
              initial="hidden"
              animate="visible"
              custom={0}
              variants={fadeUp}
              className="badge-lime inline-block mb-6"
            >
              Now in early access — UK barbershops
            </motion.div>

            <motion.h1
              initial="hidden"
              animate="visible"
              custom={1}
              variants={fadeUp}
              className="font-barlow font-black text-[clamp(3.5rem,9vw,7rem)] leading-[0.92] tracking-tight uppercase mb-6"
            >
              Your clients.
              <br />
              <span className="text-[#C8F135]">Their next cut.</span>
              <br />
              Remembered.
            </motion.h1>

            <motion.p
              initial="hidden"
              animate="visible"
              custom={2}
              variants={fadeUp}
              className="text-lg text-white/70 max-w-xl leading-relaxed mb-10 font-inter"
            >
              YourBarber is the smart client management system for independent barbershops. Record cuts, send automatic SMS reminders at 6 weeks, and keep clients coming back — all from your iPad.
            </motion.p>

            <motion.div
              initial="hidden"
              animate="visible"
              custom={3}
              variants={fadeUp}
              className="flex flex-wrap gap-4"
            >
              <Link href="/demo">
                <button className="btn-lime px-8 py-4 text-lg flex items-center gap-2">
                  Get early access <ArrowRight size={18} />
                </button>
              </Link>
              <Link href="/login">
                <button className="px-8 py-4 text-lg border border-white/20 text-white hover:border-white/40 transition-colors font-barlow font-bold uppercase tracking-wide rounded-sm">
                  See the app
                </button>
              </Link>
            </motion.div>

            <motion.div
              initial="hidden"
              animate="visible"
              custom={4}
              variants={fadeUp}
              className="mt-12 flex flex-wrap items-center gap-6 text-sm text-white/50"
            >
              {["No booking system needed", "Works on iPad & iPhone", "Automatic SMS reminders"].map((item) => (
                <span key={item} className="flex items-center gap-2">
                  <Check size={14} className="text-[#C8F135]" />
                  {item}
                </span>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Core Loop Section */}
      <section className="py-24 lg:py-32 bg-[#0A0A0A]">
        <div className="container mx-auto px-6 lg:px-12">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={fadeUp}
            className="mb-16"
          >
            <span className="badge-lime mb-4 inline-block">The core loop</span>
            <h2 className="font-barlow font-black text-[clamp(2.5rem,5vw,4rem)] uppercase leading-tight">
              Four steps.<br />
              <span className="text-[#C8F135]">Clients for life.</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0">
            {coreLoop.map((item, i) => (
              <motion.div
                key={item.step}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-60px" }}
                custom={i}
                variants={fadeUp}
                className="relative border-l border-white/10 pl-8 pr-6 py-8 first:border-l-0 first:pl-0"
              >
                <div className="font-barlow font-black text-5xl text-[#C8F135]/20 mb-3 leading-none">
                  {item.step}
                </div>
                <h3 className="font-barlow font-bold text-xl uppercase tracking-wide mb-3 text-white">
                  {item.title}
                </h3>
                <p className="text-white/55 text-sm leading-relaxed font-inter">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Showcase: Customer Record */}
      <section className="py-24 lg:py-32 bg-[#0f0f0f]">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              variants={fadeUp}
            >
              <span className="badge-lime mb-4 inline-block">Customer records</span>
              <h2 className="font-barlow font-black text-[clamp(2.2rem,4.5vw,3.5rem)] uppercase leading-tight mb-6">
                Every cut.
                <br />
                <span className="text-[#C8F135]">Every detail.</span>
                <br />
                Recalled instantly.
              </h2>
              <p className="text-white/65 leading-relaxed mb-8 font-inter">
                After each haircut, the barber takes 4 photos — front, back, left side, right side — and writes quick notes. Scissors grade, clipper settings, what was done. Next time the client walks in, the barber searches by phone number and sees everything in under 5 seconds.
              </p>
              <ul className="space-y-3">
                {[
                  "4 standard angles per visit",
                  "Freeform barber notes",
                  "Full visit history per customer",
                  "Search by phone or name",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-white/70 font-inter text-sm">
                    <Check size={16} className="text-[#C8F135] flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="relative"
            >
              <div className="absolute -inset-4 bg-[#C8F135]/5 rounded-2xl blur-2xl" />
              <div className="relative rounded-xl overflow-hidden shadow-2xl shadow-black/60 border border-white/10">
                <Image
                  src="/showcase-record.png"
                  alt="Customer record with 4-angle photos on iPad"
                  width={800}
                  height={600}
                  className="w-full h-auto"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Showcase: SMS Reminders */}
      <section className="py-24 lg:py-32 bg-[#0A0A0A]">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="relative order-2 lg:order-1"
            >
              <div className="absolute -inset-4 bg-[#C8F135]/5 rounded-2xl blur-2xl" />
              <div className="relative rounded-xl overflow-hidden shadow-2xl shadow-black/60 border border-white/10 max-w-sm mx-auto">
                <Image
                  src="/showcase-sms.png"
                  alt="SMS reminder notification on phone"
                  width={400}
                  height={800}
                  className="w-full h-auto"
                />
              </div>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              variants={fadeUp}
              className="order-1 lg:order-2"
            >
              <span className="badge-lime mb-4 inline-block">SMS reminders</span>
              <h2 className="font-barlow font-black text-[clamp(2.2rem,4.5vw,3.5rem)] uppercase leading-tight mb-6">
                6 weeks later.
                <br />
                <span className="text-[#C8F135]">They're back.</span>
              </h2>
              <p className="text-white/65 leading-relaxed mb-6 font-inter">
                When a customer opts in, the system automatically sends an SMS 6 weeks after their last visit. No manual work. Just clients coming back.
              </p>
              <div className="bg-[#141414] border border-white/10 rounded-lg p-5 mb-8 font-mono text-sm text-white/80">
                <div className="text-[#C8F135]/60 text-xs uppercase tracking-widest mb-2 font-barlow">SMS Template</div>
                "Hi Marcus, it's been 6 weeks since your cut at Ben J Barbers. Book in with Jake? Reply STOP to opt out."
              </div>
              <ul className="space-y-3">
                {[
                  "Auto-trigger at 6 weeks post-visit",
                  "Bulk send to all opted-in customers",
                  "Customisable message per shop",
                  "Opt-in/out status tracked per customer",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-white/70 font-inter text-sm">
                    <Check size={16} className="text-[#C8F135] flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 lg:py-32 bg-[#0f0f0f]">
        <div className="container mx-auto px-6 lg:px-12">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={fadeUp}
            className="mb-16 text-center"
          >
            <span className="badge-lime mb-4 inline-block">Everything you need</span>
            <h2 className="font-barlow font-black text-[clamp(2.5rem,5vw,4rem)] uppercase leading-tight">
              Built for barbers,
              <br />
              <span className="text-[#C8F135]">not admins.</span>
            </h2>
            <p className="text-white/55 max-w-xl mx-auto mt-4 font-inter">
              Every feature is designed to take under 30 seconds. No training required. Works on iPad, iPhone, and Android tablets.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/5">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-40px" }}
                custom={i % 3}
                variants={fadeUp}
                className="bg-[#0f0f0f] p-8 hover:bg-[#141414] transition-colors group"
              >
                <div className="w-10 h-10 rounded-sm bg-[#C8F135]/10 flex items-center justify-center mb-5 group-hover:bg-[#C8F135]/20 transition-colors">
                  <feature.icon size={20} className="text-[#C8F135]" />
                </div>
                <h3 className="font-barlow font-bold text-xl uppercase tracking-wide mb-3 text-white">
                  {feature.title}
                </h3>
                <p className="text-white/55 text-sm leading-relaxed font-inter">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-24 lg:py-32 bg-[#0A0A0A] relative overflow-hidden">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              variants={fadeUp}
            >
              <span className="badge-lime mb-4 inline-block">Multi-barber shops</span>
              <h2 className="font-barlow font-black text-[clamp(2.2rem,4.5vw,3.5rem)] uppercase leading-tight mb-6">
                Your shop.
                <br />
                <span className="text-[#C8F135]">Your team.</span>
                <br />
                Your data.
              </h2>
              <p className="text-white/65 leading-relaxed mb-8 font-inter">
                The shop owner controls everything. Invite barbers via email. Each barber logs in and manages their customers. If a barber leaves, their profile disappears — but all customer data stays with the shop.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { role: "Shop Owner", perks: ["Invite barbers", "Bulk SMS send", "View all customers", "Manage subscription"] },
                  { role: "Barber", perks: ["Add customer records", "Take photos + notes", "Send reminders", "View opt-in status"] },
                ].map((r) => (
                  <div key={r.role} className="bg-[#141414] border border-white/10 rounded-lg p-5">
                    <div className="font-barlow font-bold text-sm uppercase tracking-widest text-[#C8F135] mb-3">
                      {r.role}
                    </div>
                    <ul className="space-y-2">
                      {r.perks.map((p) => (
                        <li key={p} className="flex items-center gap-2 text-white/60 text-xs font-inter">
                          <Check size={12} className="text-[#C8F135] flex-shrink-0" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="relative"
            >
              <div className="absolute -inset-4 bg-[#C8F135]/5 rounded-2xl blur-2xl" />
              <div className="relative rounded-xl overflow-hidden shadow-2xl shadow-black/60 border border-white/10">
                <Image
                  src="/showcase-team.png"
                  alt="Professional barbers in their shop"
                  width={800}
                  height={600}
                  className="w-full h-auto"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* App Screenshot Section */}
      <section className="py-20 lg:py-28 bg-[#0f0f0f] overflow-hidden">
        <div className="container mx-auto px-6 lg:px-12">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={fadeUp}
            className="text-center mb-10"
          >
            <span className="badge-lime mb-4 inline-block">Live app</span>
            <h2 className="font-barlow font-black text-[clamp(2.5rem,5vw,4rem)] uppercase leading-tight">
              The dashboard.
              <br />
              <span className="text-[#C8F135]">Clean. Fast. Focused.</span>
            </h2>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="relative max-w-4xl mx-auto"
          >
            <div className="absolute -inset-8 bg-[#C8F135]/5 rounded-3xl blur-3xl" />
            <div className="relative bg-[#111] border border-white/10 rounded-xl overflow-hidden shadow-2xl shadow-black/80">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/8 bg-[#0f0f0f]">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
                <span className="ml-3 text-white/25 text-xs font-mono tracking-tighter">app.yourbarber.uk</span>
              </div>
              <Image
                src="/showcase-dashboard.png"
                alt="YourBarber app dashboard"
                width={1200}
                height={800}
                className="w-full h-auto"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 lg:py-32 bg-[#C8F135] relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{ backgroundImage: "repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 0, transparent 50%)", backgroundSize: "20px 20px" }} />
        </div>
        <div className="relative container mx-auto px-6 lg:px-12 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={fadeUp}
          >
            <h2 className="font-barlow font-black text-[clamp(3rem,7vw,6rem)] uppercase leading-tight text-[#0A0A0A] mb-6">
              Ready to bring
              <br />
              clients back?
            </h2>
            <p className="text-[#0A0A0A]/65 max-w-lg mx-auto mb-10 font-inter text-lg">
              Join the early access programme. We're onboarding UK barbershops now.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/demo">
                <button className="bg-[#0A0A0A] text-white px-10 py-4 text-lg rounded-sm font-barlow font-bold uppercase tracking-wide hover:bg-[#1a1a1a] transition-colors flex items-center gap-2">
                  Get started <ArrowRight size={18} />
                </button>
              </Link>
              <Link href="/#features">
                <button className="border-2 border-[#0A0A0A]/30 text-[#0A0A0A] px-10 py-4 text-lg rounded-sm font-barlow font-bold uppercase tracking-wide hover:border-[#0A0A0A]/60 transition-colors">
                  See all features
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
