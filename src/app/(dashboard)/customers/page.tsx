'use client';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, Check, X, Minus, ArrowRight, Phone } from 'lucide-react';
import Link from 'next/link';

interface Customer {
  id: string;
  phone: string;
  name?: string | null;
  smsOptIn: string;
  lastVisitAt?: string | null;
}

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.3, delay: i * 0.04, ease: 'easeOut' as const },
  }),
};

type FilterValue = 'all' | 'yes' | 'no' | 'not_asked';

const optInConfigs = {
  yes: { bg: 'rgba(200,241,53,0.1)', color: '#C8F135', border: 'rgba(200,241,53,0.2)', label: 'Opted in', Icon: Check },
  no: { bg: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.35)', border: 'rgba(255,255,255,0.1)', label: 'Opted out', Icon: X },
  not_asked: { bg: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.25)', border: 'rgba(255,255,255,0.08)', label: 'Not asked', Icon: Minus },
} as const;

function OptInBadge({ status }: { status: string }) {
  const c = optInConfigs[status as keyof typeof optInConfigs] ?? optInConfigs.not_asked;
  const isOptedIn = status === 'yes';
  
  return (
    <span className={`
      inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] font-barlow text-[10px] font-bold uppercase tracking-wider border
      ${isOptedIn 
        ? 'bg-primary/10 text-primary border-primary/20' 
        : 'bg-white/5 text-muted-foreground border-white/10'}
    `}>
      <c.Icon size={10} /> {c.label}
    </span>
  );
}

function getInitials(name: string | null | undefined): string {
  if (!name) return '#';
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterValue>('all');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    clearTimeout(debounceRef.current);
    setLoading(true);
    const url = query.length >= 2 ? `/api/customers?q=${encodeURIComponent(query)}` : '/api/customers';
    debounceRef.current = setTimeout(() => {
      fetch(url)
        .then(r => r.json())
        .then(d => { setCustomers(d); setLoading(false); });
    }, query.length < 2 ? 0 : 250);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const filtered = customers.filter(c => filter === 'all' || c.smsOptIn === filter);

  const filterLabels: Record<FilterValue, string> = {
    all: 'All', yes: 'Opted in', no: 'Opted out', not_asked: 'Not asked',
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tight text-white mb-2 font-barlow leading-none">
            Customers
          </h1>
          <p className="text-muted-foreground text-sm font-medium uppercase tracking-widest opacity-60">
            {loading ? 'Fetching database...' : `Database // ${filtered.length} entries`}
          </p>
        </div>
        
        <Link href="/customers/new" className="btn-lime px-6 py-3 flex items-center gap-2 group">
          <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
          <span>New customer</span>
        </Link>
      </div>

      {/* Controls */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
        {/* Search */}
        <div className="relative flex-1 group">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search database by phone or name…"
            className="w-full bg-white/[0.03] border border-white/10 rounded-sm py-3 pl-12 pr-4 text-white text-sm placeholder:text-muted-foreground/40 outline-none focus:border-primary/50 focus:bg-white/[0.05] transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-1 p-1 bg-white/[0.03] border border-white/10 rounded-sm overflow-x-auto no-scrollbar">
          {(['all', 'yes', 'no', 'not_asked'] as FilterValue[]).map(f => (
            <button 
              key={f} 
              onClick={() => setFilter(f)}
              className={`
                px-4 py-2 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap rounded-[2px] transition-all
                ${filter === f 
                  ? 'bg-primary text-black' 
                  : 'text-muted-foreground hover:text-white hover:bg-white/5'}
              `}
            >
              {filterLabels[f]}
            </button>
          ))}
        </div>
      </div>

      {/* Table Container */}
      <div className="relative rounded-sm border border-white/5 bg-[#111]/50 backdrop-blur-xl overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/5 blur-[100px] pointer-events-none" />
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-white/5 font-barlow text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
                <th className="px-6 py-4 font-bold">Customer</th>
                <th className="px-6 py-4 font-bold hidden md:table-cell">Phone</th>
                <th className="px-6 py-4 font-bold hidden lg:table-cell">Last visit</th>
                <th className="px-6 py-4 font-bold hidden sm:table-cell">Status</th>
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody>
              {/* Empty state */}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-2 opacity-20">
                      <Search size={40} />
                      <p className="text-sm font-medium uppercase tracking-widest">No results found</p>
                    </div>
                  </td>
                </tr>
              )}

              {/* Rows */}
              {filtered.map((c, i) => (
                <motion.tr
                  key={c.id}
                  initial="hidden"
                  animate="visible"
                  custom={i}
                  variants={fadeUp}
                  className="group hover:bg-white/[0.02] transition-colors border-b border-white/[0.03] last:border-0"
                >
                  <td className="px-6 py-4">
                    <Link href={`/customers/${c.id}`} className="flex items-center gap-4 group/item">
                      <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 group-hover/item:border-primary/40 transition-colors">
                        <span className="text-primary text-xs font-black font-barlow tracking-tighter">
                          {getInitials(c.name)}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="text-white text-sm font-semibold truncate group-hover/item:text-primary transition-colors leading-tight">
                          {c.name ?? 'Anonymous'}
                        </div>
                        <div className="md:hidden text-muted-foreground text-xs font-mono opacity-50">
                          {c.phone}
                        </div>
                      </div>
                    </Link>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs font-mono group-hover:text-white transition-colors">
                      <Phone size={12} className="opacity-30" />
                      {c.phone}
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden lg:table-cell text-muted-foreground text-xs">
                    {c.lastVisitAt ? new Date(c.lastVisitAt).toLocaleDateString('en-GB') : '—'}
                  </td>
                  <td className="px-6 py-4 hidden sm:table-cell">
                    <OptInBadge status={c.smsOptIn} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/customers/${c.id}`} className="inline-flex p-2 text-muted-foreground hover:text-primary transition-colors">
                      <ArrowRight size={16} />
                    </Link>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
