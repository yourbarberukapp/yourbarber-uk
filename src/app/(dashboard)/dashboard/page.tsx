import { getRequiredSession } from '@/lib/session';
import { db } from '@/lib/db';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Users, Bell, Clock, ArrowRight, Scissors, UserCheck, QrCode } from 'lucide-react';

function timeAgo(date: Date) {
  const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function initials(name: string | null) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

export default async function DashboardRoot() {
  const session = await getRequiredSession();
  if (session.role === 'barber') redirect('/barber');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sixWeeksAgo = new Date();
  sixWeeksAgo.setDate(sixWeeksAgo.getDate() - 42);

  const [totalCustomers, optedIn, recentCustomers, dueForReminder, walkIns, shop] = await Promise.all([
    db.customer.count({ where: { shopId: session.shopId } }),
    db.customer.count({ where: { shopId: session.shopId, smsOptIn: 'yes' } }),
    db.customer.findMany({
      where: { shopId: session.shopId },
      orderBy: { lastVisitAt: 'desc' },
      take: 5,
      select: { id: true, phone: true, name: true, smsOptIn: true, lastVisitAt: true },
    }),
    db.customer.findMany({
      where: {
        shopId: session.shopId,
        smsOptIn: 'yes',
        lastVisitAt: { lte: sixWeeksAgo },
      },
      orderBy: { lastVisitAt: 'asc' },
      take: 3,
      select: { id: true, name: true, phone: true, lastVisitAt: true },
    }),
    db.walkIn.findMany({
      where: {
        shopId: session.shopId,
        arrivedAt: { gte: today },
        status: { in: ['waiting', 'in_progress'] },
      },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
      },
      orderBy: { arrivedAt: 'asc' },
    }),
    db.shop.findUnique({ where: { id: session.shopId }, select: { slug: true } }),
  ]);

  const optInRate = totalCustomers > 0 ? Math.round((optedIn / totalCustomers) * 100) : 0;
  const arriveUrl = shop ? `yourbarber.uk/arrive/${shop.slug}` : null;

  const stats = [
    { label: 'Total Customers', value: totalCustomers.toString(), icon: Users, change: 'All time', highlight: false },
    { label: 'SMS Opted In', value: optedIn.toString(), icon: Bell, change: `${optInRate}% opt-in rate`, highlight: false },
    { label: 'In Queue Now', value: walkIns.length.toString(), icon: UserCheck, change: 'Walk-ins today', highlight: walkIns.length > 0 },
    { label: 'Due for Reminder', value: dueForReminder.length.toString(), icon: Clock, change: 'Overdue 6+ weeks', highlight: dueForReminder.length > 0 },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-barlow font-black text-white uppercase tracking-tight mb-2">
            Dashboard
          </h1>
          <p className="text-white/40 text-sm">Welcome back, {session.name.split(' ')[0]}.</p>
        </div>
        <Link
          href="/scan"
          className="btn-lime px-6 py-4 rounded-sm text-xs font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(200,241,53,0.15)] hover:shadow-[0_0_30px_rgba(200,241,53,0.25)] transition-all"
        >
          <Scissors size={18} /> Scan Customer QR
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(stat => (
          <div
            key={stat.label}
            className={`rounded-lg p-5 border transition-all duration-300 ${
              stat.highlight
                ? 'bg-[#C8F135]/5 border-[#C8F135]/20 shadow-[0_0_20px_rgba(200,241,53,0.05)]'
                : 'bg-[#111] border-white/5 hover:border-white/10'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className={`text-[10px] font-bold uppercase tracking-widest font-barlow ${stat.highlight ? 'text-[#C8F135]' : 'text-white/30'}`}>
                {stat.label}
              </span>
              <stat.icon size={14} className={stat.highlight ? 'text-[#C8F135]/60' : 'text-white/20'} />
            </div>
            <div className={`font-barlow font-black text-4xl leading-none mb-2 ${stat.highlight ? 'text-[#C8F135]' : 'text-white'}`}>
              {stat.value}
            </div>
            <div className="text-white/30 text-[10px] font-medium tracking-wide uppercase">{stat.change}</div>
          </div>
        ))}
      </div>

      {/* Live Queue + Recent Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Customers */}
        <div className="lg:col-span-2 bg-[#111] border border-white/5 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.02]">
            <h2 className="font-barlow font-bold text-sm uppercase tracking-widest text-white">Recent Customers</h2>
            <Link href="/customers" className="text-[#C8F135] hover:text-[#d4ff3f] text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 transition-colors">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-white/5">
            {recentCustomers.length === 0 ? (
              <div className="px-6 py-8 text-center text-white/20 text-sm">No customers yet.</div>
            ) : recentCustomers.map(c => (
              <Link key={c.id} href={`/customers/${c.id}`} className="block group">
                <div className="flex items-center gap-4 px-6 py-4 group-hover:bg-white/[0.02] transition-all">
                  <div className="w-10 h-10 rounded-full bg-[#C8F135]/10 flex items-center justify-center flex-shrink-0 border border-[#C8F135]/20 group-hover:border-[#C8F135]/40 transition-colors">
                    <span className="text-[#C8F135] text-xs font-bold font-barlow">{initials(c.name)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm font-medium group-hover:text-[#C8F135] transition-colors">{c.name ?? 'No name'}</div>
                    <div className="text-white/30 text-xs font-mono">{c.phone}</div>
                  </div>
                  <div className="text-white/20 text-[10px] font-bold uppercase tracking-widest font-barlow hidden sm:block">
                    {c.lastVisitAt ? timeAgo(c.lastVisitAt) : 'No visits'}
                  </div>
                  <ArrowRight size={14} className="text-white/10 group-hover:text-[#C8F135] transition-all transform group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Live Queue */}
        <div className="bg-[#111] border border-white/5 rounded-lg overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.02]">
            <h2 className="font-barlow font-bold text-sm uppercase tracking-widest text-white">Queue</h2>
            <div className="flex items-center gap-2">
              {walkIns.length > 0 && <div className="w-2 h-2 rounded-full bg-[#C8F135] animate-pulse" />}
              <Link href="/waitlist" className="text-[#C8F135] hover:text-[#d4ff3f] text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 transition-colors">
                Manage <ArrowRight size={12} />
              </Link>
            </div>
          </div>

          {walkIns.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 gap-3">
              <p className="text-white/20 text-sm text-center">Empty queue.</p>
              {arriveUrl && (
                <div className="flex items-center gap-2 text-white/20 text-[11px] font-mono">
                  <QrCode size={12} />
                  <span>{arriveUrl}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="divide-y divide-white/5 flex-1">
              {walkIns.map((w, i) => (
                <div key={w.id} className="px-6 py-4 flex items-center gap-3">
                  <span className="text-white/20 font-barlow font-black text-lg w-5 shrink-0">{i + 1}</span>
                  <div className="w-8 h-8 rounded-full bg-[#C8F135]/10 border border-[#C8F135]/20 flex items-center justify-center shrink-0">
                    <span className="text-[#C8F135] text-[10px] font-bold font-barlow">{initials(w.customer.name)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm font-medium truncate">{w.customer.name ?? 'Unknown'}</div>
                    {w.note && <div className="text-white/30 text-xs truncate italic">{w.note}</div>}
                  </div>
                  {w.status === 'in_progress' && (
                    <span className="text-[#C8F135] text-[9px] font-bold uppercase tracking-widest font-barlow shrink-0">In chair</span>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="p-4 bg-white/[0.02] border-t border-white/5">
            <Link href="/waitlist" className="btn-lime w-full py-3 rounded-sm text-xs font-black uppercase tracking-[0.15em] flex items-center justify-center gap-2">
              <UserCheck size={14} /> Manage Queue
            </Link>
          </div>
        </div>
      </div>

      {/* Due for reminder */}
      {dueForReminder.length > 0 && (
        <div className="bg-[#111] border border-white/5 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.02]">
            <h2 className="font-barlow font-bold text-sm uppercase tracking-widest text-white">Due for Reminder</h2>
            <Link href="/reminders" className="text-[#C8F135] hover:text-[#d4ff3f] text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 transition-colors">
              Send reminders <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-white/5">
            {dueForReminder.map(c => (
              <div key={c.id} className="flex items-center gap-4 px-6 py-4">
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-medium">{c.name ?? 'No name'}</div>
                  <div className="text-white/30 text-xs font-mono">{c.phone}</div>
                </div>
                <div className="text-white/30 text-[10px] font-bold uppercase tracking-widest font-barlow">
                  {c.lastVisitAt ? timeAgo(c.lastVisitAt) : '—'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
