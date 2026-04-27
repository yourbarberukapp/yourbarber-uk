'use client';

import { useState } from 'react';
import { Clock, AlertTriangle, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function TicketCard({ ticket }: { ticket: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [resolution, setResolution] = useState('');
  const [notes, setNotes] = useState('');

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch(`/api/feedback/${ticket.feedback.id}/resolve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resolution,
          notes,
          // Could pass assignedBarberId if we had a dropdown for it
        }),
      });

      if (res.ok) {
        router.refresh();
      } else {
        const error = await res.json();
        alert('Failed to resolve ticket: ' + JSON.stringify(error));
      }
    } catch (err) {
      console.error(err);
      alert('Error resolving ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`p-6 rounded-lg border ${ticket.status === 'unresolved' ? 'border-red-500/20 bg-red-500/5' : 'border-white/5 bg-black/20'}`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-white font-bold font-inter">{ticket.feedback.customer.name || ticket.feedback.customer.phone}</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${ticket.status === 'unresolved' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
              {ticket.status.replace('_', ' ')}
            </span>
          </div>
          <div className="text-muted-foreground text-xs font-inter flex items-center gap-2">
            <Clock size={12} /> {new Date(ticket.createdAt).toLocaleString()}
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-white/60">Cut by <span className="text-white font-medium">{ticket.feedback.visit.barber?.name}</span></div>
        </div>
      </div>

      <div className="bg-black/40 border border-white/5 rounded p-4 mb-6">
        <div className="text-xs text-white/40 uppercase tracking-widest font-barlow font-bold mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {ticket.status === 'unresolved' && <AlertTriangle size={14} className="text-red-400" />}
            Customer Issue
          </div>
          {ticket.feedback.stars && (
            <div className="flex items-center gap-1 text-primary">
              <span className="text-[10px] opacity-60 mr-1">RATING:</span>
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  size={10} 
                  fill={i < ticket.feedback.stars ? "currentColor" : "none"} 
                  className={i < ticket.feedback.stars ? "text-primary" : "text-white/10"}
                />
              ))}
            </div>
          )}
        </div>
        <p className="text-white/90 text-sm leading-relaxed font-inter">
          {ticket.feedback.issue || "Customer rated the cut poorly without leaving a specific comment."}
        </p>
      </div>

      {ticket.status === 'unresolved' ? (
        <form onSubmit={handleResolve} className="border-t border-white/5 pt-4">
          <div className="text-xs text-white/40 uppercase tracking-widest font-barlow font-bold mb-3">Resolve Ticket</div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-inter text-white/60 mb-2">Action Taken</label>
              <select 
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                required 
                className="w-full bg-black/60 border border-white/10 text-white text-sm rounded px-3 py-2.5 focus:border-primary focus:outline-none"
              >
                <option value="">Select resolution...</option>
                <option value="owner_contact">Contacted by Owner</option>
                <option value="same_barber_fix">Same Barber Fix (Free)</option>
                <option value="different_barber">Different Barber Fix</option>
                <option value="book_return">Booked Return Cut</option>
                <option value="log_only">Logged, No Action</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-inter text-white/60 mb-2">Resolution Notes</label>
              <input 
                type="text" 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Called customer, offered free fix" 
                className="w-full bg-black/60 border border-white/10 text-white text-sm rounded px-3 py-2.5 focus:border-primary focus:outline-none" 
              />
            </div>
          </div>
          
          <button 
            type="submit" 
            disabled={loading || !resolution}
            className="bg-primary text-black font-barlow font-bold uppercase tracking-wider text-sm px-6 py-2.5 rounded-sm hover:bg-white transition-colors disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Mark as In Progress'}
          </button>
        </form>
      ) : (
        <div className="border-t border-white/5 pt-4">
          <div className="text-xs text-white/40 uppercase tracking-widest font-barlow font-bold mb-2">Resolution Details</div>
          <div className="flex gap-4">
            <div className="flex-1">
              <span className="text-white/40 text-xs font-inter">Action: </span>
              <span className="text-primary text-sm font-medium font-inter capitalize">{ticket.resolution?.replace(/_/g, ' ')}</span>
            </div>
            {ticket.notes && (
              <div className="flex-1">
                <span className="text-white/40 text-xs font-inter">Notes: </span>
                <span className="text-white/80 text-sm font-inter">{ticket.notes}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
