'use client';

/**
 * Dashboard Root Page
 * Premium overview with business stats and recent activity.
 */
import { motion } from 'framer-motion';
import { Users, Bell, TrendingUp, Clock, ArrowRight, Check, X, Minus, Scissors } from 'lucide-react';
import Link from 'next/link';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.07, ease: "easeOut" as const },
  }),
};

const stats = [
  { label: "Total Customers", value: "128", icon: Users, change: "+12 this month" },
  { label: "SMS Opted In", value: "94", icon: Bell, change: "73% opt-in rate" },
  { label: "Reminders Sent", value: "47", icon: TrendingUp, change: "This month" },
  { label: "Due for Reminder", value: "18", icon: Clock, change: "In next 7 days", highlight: true },
];

const recentCustomers = [
  { id: '1', name: "Marcus Johnson", phone: "07700 900 001", lastVisit: "2 days ago", optIn: "yes", barber: "Jake" },
  { id: '2', name: "Tyler Brooks", phone: "07700 900 002", lastVisit: "5 days ago", optIn: "yes", barber: "Ben" },
  { id: '3', name: "Derrick Moore", phone: "07700 900 003", lastVisit: "1 week ago", optIn: "no", barber: "Jake" },
  { id: '4', name: "James Washington", phone: "07700 900 004", lastVisit: "2 weeks ago", optIn: "yes", barber: "Ben" },
  { id: '5', name: "Brandon Lee", phone: "07700 900 005", lastVisit: "3 weeks ago", optIn: "not_asked", barber: "Jake" },
];

const dueSoon = [
  { name: "Sam Clarke", phone: "07700 900 010", daysUntil: 1, lastVisit: "41 days ago" },
  { name: "Ethan Martinez", phone: "07700 900 011", daysUntil: 2, lastVisit: "40 days ago" },
  { name: "Noah Wilson", phone: "07700 900 012", daysUntil: 4, lastVisit: "38 days ago" },
];

function OptInBadge({ status }: { status: string }) {
  if (status === "yes") return (
    <span className="flex items-center gap-1 text-[#C8F135] text-[10px] font-bold uppercase tracking-widest font-barlow">
      <Check size={11} /> Opted in
    </span>
  );
  if (status === "no") return (
    <span className="flex items-center gap-1 text-white/30 text-[10px] font-bold uppercase tracking-widest font-barlow">
      <X size={11} /> Opted out
    </span>
  );
  return (
    <span className="flex items-center gap-1 text-white/20 text-[10px] font-bold uppercase tracking-widest font-barlow">
      <Minus size={11} /> Not asked
    </span>
  );
}

export default function DashboardRoot() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-barlow font-black text-white uppercase tracking-tight mb-2">
            Dashboard
          </h1>
          <p className="text-white/40 text-sm">Welcome back. Here is your shop performance overview.</p>
        </div>
        <Link 
          href="/scan"
          className="btn-lime px-6 py-4 rounded-sm text-xs font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(200,241,53,0.15)] hover:shadow-[0_0_30px_rgba(200,241,53,0.25)] transition-all"
        >
          <Scissors size={18} /> Scan Customer QR
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial="hidden"
            animate="visible"
            custom={i}
            variants={fadeUp}
            className={`rounded-lg p-5 border transition-all duration-300 ${
              stat.highlight
                ? "bg-[#C8F135]/5 border-[#C8F135]/20 shadow-[0_0_20px_rgba(200,241,53,0.05)]"
                : "bg-[#111] border-white/5 hover:border-white/10"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className={`text-[10px] font-bold uppercase tracking-widest font-barlow ${stat.highlight ? "text-[#C8F135]" : "text-white/30"}`}>
                {stat.label}
              </span>
              <stat.icon size={14} className={stat.highlight ? "text-[#C8F135]/60" : "text-white/20"} />
            </div>
            <div className={`font-barlow font-black text-4xl leading-none mb-2 ${stat.highlight ? "text-[#C8F135]" : "text-white"}`}>
              {stat.value}
            </div>
            <div className="text-white/30 text-[10px] font-medium tracking-wide uppercase">{stat.change}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Customers Table */}
        <motion.div
          initial="hidden"
          animate="visible"
          custom={4}
          variants={fadeUp}
          className="lg:col-span-2 bg-[#111] border border-white/5 rounded-lg overflow-hidden"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.02]">
            <h2 className="font-barlow font-bold text-sm uppercase tracking-widest text-white">
              Recent Customers
            </h2>
            <Link href="/customers" className="text-[#C8F135] hover:text-[#d4ff3f] text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 transition-colors">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-white/5">
            {recentCustomers.map((c) => (
              <Link key={c.id} href={`/customers/${c.id}`} className="block group">
                <div className="flex items-center gap-4 px-6 py-4 group-hover:bg-white/[0.02] transition-all">
                  <div className="w-10 h-10 rounded-full bg-[#C8F135]/10 flex items-center justify-center flex-shrink-0 border border-[#C8F135]/20 group-hover:border-[#C8F135]/40 transition-colors">
                    <span className="text-[#C8F135] text-xs font-bold font-barlow">
                      {c.name.split(" ").map(n => n[0]).join("")}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm font-medium group-hover:text-[#C8F135] transition-colors">{c.name}</div>
                    <div className="text-white/30 text-xs font-mono">{c.phone}</div>
                  </div>
                  <div className="text-white/20 text-[10px] font-bold uppercase tracking-widest font-barlow hidden sm:block">{c.lastVisit}</div>
                  <div className="hidden md:block"><OptInBadge status={c.optIn} /></div>
                  <div className="text-white/20 text-[10px] font-bold uppercase tracking-widest font-barlow hidden lg:block">{c.barber}</div>
                  <ArrowRight size={14} className="text-white/10 group-hover:text-[#C8F135] transition-all transform group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Due for Reminder Sidebar */}
        <motion.div
          initial="hidden"
          animate="visible"
          custom={5}
          variants={fadeUp}
          className="bg-[#111] border border-white/5 rounded-lg overflow-hidden flex flex-col"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.02]">
            <h2 className="font-barlow font-bold text-sm uppercase tracking-widest text-white">
              Due Soon
            </h2>
            <div className="w-2 h-2 rounded-full bg-[#C8F135] animate-pulse" />
          </div>
          <div className="divide-y divide-white/5 flex-1">
            {dueSoon.map((c) => (
              <div key={c.phone} className="px-6 py-4 hover:bg-white/[0.01] transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white text-sm font-medium">{c.name}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-widest font-barlow ${c.daysUntil <= 1 ? "text-[#C8F135]" : "text-white/30"}`}>
                    {c.daysUntil === 0 ? "Today" : c.daysUntil === 1 ? "Tomorrow" : `${c.daysUntil} days`}
                  </span>
                </div>
                <div className="text-white/30 text-xs font-mono">{c.phone}</div>
                <div className="text-white/20 text-[10px] font-bold uppercase tracking-widest font-barlow mt-1.5">{c.lastVisit}</div>
              </div>
            ))}
          </div>
          <div className="p-6 bg-white/[0.02] border-t border-white/5">
            <Link href="/reminders" className="btn-lime w-full py-4 rounded-sm text-xs font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(200,241,53,0.15)] hover:shadow-[0_0_30px_rgba(200,241,53,0.25)] transition-all">
              Send All <ArrowRight size={16} />
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

