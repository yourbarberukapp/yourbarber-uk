import { getSession } from '@/lib/session';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import { MessageSquare, AlertTriangle, CheckCircle } from 'lucide-react';
import TicketCard from '@/components/dashboard/TicketCard';

export default async function FeedbackPage() {
  const session = await getSession();
  if (!session || session.role !== 'owner') {
    redirect('/login');
  }

  const tickets = await db.feedbackTicket.findMany({
    where: {
      feedback: {
        shopId: session.shopId,
      },
    },
    include: {
      feedback: {
        include: {
          customer: true,
          visit: {
            include: { barber: true },
          },
        },
      },
      barber: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const unresolvedCount = tickets.filter(t => t.status === 'unresolved').length;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-barlow font-black uppercase tracking-tight text-white flex items-center gap-3">
            <MessageSquare className="text-primary" /> Feedback & Tickets
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-inter">
            Manage negative feedback and resolve customer issues.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-black/40 border border-white/5 px-4 py-2 rounded-sm">
          <AlertTriangle className={unresolvedCount > 0 ? 'text-red-400' : 'text-white/20'} size={18} />
          <span className="text-white font-barlow font-bold text-lg">{unresolvedCount}</span>
          <span className="text-muted-foreground text-xs uppercase tracking-wider font-bold ml-1">Needs Action</span>
        </div>
      </div>

      <div className="space-y-4">
        {tickets.length === 0 ? (
          <div className="text-center py-20 bg-black/20 border border-white/5 rounded-lg">
            <CheckCircle className="mx-auto text-primary/50 mb-4" size={32} />
            <h3 className="text-white font-barlow text-lg font-bold">All clear</h3>
            <p className="text-muted-foreground text-sm">No negative feedback tickets generated.</p>
          </div>
        ) : (
          tickets.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} />
          ))
        )}
      </div>
    </div>
  );
}
