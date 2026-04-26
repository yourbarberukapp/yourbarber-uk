import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import QRScanner from '@/components/dashboard/QRScanner';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function ScanPage() {
  const session = await getSession();
  if (!session || session.role !== 'barber') {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] p-8">
      <div className="max-w-md mx-auto">
        <Link 
          href="/dashboard" 
          className="inline-flex items-center gap-2 text-white/30 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft size={16} />
          <span className="font-barlow font-bold text-sm uppercase tracking-widest">Back to Dashboard</span>
        </Link>

        <div className="mb-10">
          <h1 className="text-4xl font-barlow font-black text-white uppercase tracking-tight mb-2">
            Scan Customer
          </h1>
          <p className="text-white/40 text-sm font-inter">Load customer history and styles instantly.</p>
        </div>

        <QRScanner />
      </div>
    </div>
  );
}
