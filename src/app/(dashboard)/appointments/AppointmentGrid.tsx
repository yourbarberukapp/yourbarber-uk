'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, User, Calendar as CalendarIcon, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Props {
  initialAppointments: any[];
  barbers: any[];
  weekStart: string;
  session: any;
}

const HOURS = Array.from({ length: 13 }).map((_, i) => i + 8); // 08:00 to 20:00

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function isSameDay(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate();
}

function formatDate(date: Date, format: 'MMM d' | 'MMM d, yyyy' | 'EEE' | 'd' | 'yyyy-MM-dd' | 'HH:mm') {
  if (format === 'yyyy-MM-dd') return date.toISOString().slice(0, 10);
  if (format === 'HH:mm') return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
  if (format === 'EEE') return date.toLocaleDateString('en-GB', { weekday: 'short' });
  if (format === 'd') return String(date.getDate());
  if (format === 'MMM d') return date.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
  return date.toLocaleDateString('en-GB', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function AppointmentGrid({ initialAppointments, barbers, weekStart }: Props) {
  const router = useRouter();
  const startDate = new Date(weekStart);
  const days = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));
  const [selectedBarberId, setSelectedBarberId] = useState<string>('all');

  const filteredAppointments = selectedBarberId === 'all' 
    ? initialAppointments 
    : initialAppointments.filter(a => a.barberId === selectedBarberId);

  const navigateWeek = (direction: number) => {
    const newDate = addDays(startDate, direction * 7);
    router.push(`/appointments?date=${formatDate(newDate, 'yyyy-MM-dd')}`);
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/[0.02] border border-white/5 rounded-xl p-4">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigateWeek(-1)}
            className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-white transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg border border-white/5">
            <CalendarIcon size={16} className="text-primary" />
            <span className="font-barlow font-bold text-sm uppercase tracking-wide">
              {formatDate(days[0], 'MMM d')} - {formatDate(days[6], 'MMM d, yyyy')}
            </span>
          </div>
          <button 
            onClick={() => navigateWeek(1)}
            className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-white transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest mr-2">Filter:</span>
          <select 
            value={selectedBarberId}
            onChange={(e) => setSelectedBarberId(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-primary/50 font-inter"
          >
            <option value="all">All Barbers</option>
            {barbers.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid */}
      <div className="bg-white/[0.01] border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Header */}
            <div className="grid grid-cols-[80px_repeat(7,1fr)] border-b border-white/5">
              <div className="p-4 bg-white/[0.02]" />
              {days.map(day => (
                <div 
                  key={day.toISOString()} 
                  className={`p-4 text-center border-l border-white/5 ${isSameDay(day, new Date()) ? 'bg-primary/5' : ''}`}
                >
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                    {formatDate(day, 'EEE')}
                  </div>
                  <div className={`text-xl font-barlow font-black ${isSameDay(day, new Date()) ? 'text-primary' : 'text-white'}`}>
                    {formatDate(day, 'd')}
                  </div>
                </div>
              ))}
            </div>

            {/* Body */}
            <div className="relative">
              {HOURS.map(hour => (
                <div key={hour} className="grid grid-cols-[80px_repeat(7,1fr)] group">
                  {/* Time Label */}
                  <div className="p-3 text-right text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-r border-white/5 bg-white/[0.02]">
                    {hour}:00
                  </div>
                  
                  {/* Day Columns */}
                  {days.map(day => {
                    const slotStart = new Date(day);
                    slotStart.setHours(hour, 0, 0, 0);
                    const slotEnd = new Date(day);
                    slotEnd.setHours(hour + 1, 0, 0, 0);

                    const apptsInSlot = filteredAppointments.filter(a => {
                      const aStart = new Date(a.scheduledAt);
                      return aStart >= slotStart && aStart < slotEnd;
                    });

                    return (
                      <div 
                        key={day.toISOString()} 
                        className={`relative min-h-[80px] border-l border-b border-white/5 group-hover:bg-white/[0.01] transition-colors p-1 flex flex-col gap-1 ${isSameDay(day, new Date()) ? 'bg-primary/[0.01]' : ''}`}
                      >
                        {apptsInSlot.map(appt => (
                          <div 
                            key={appt.id}
                            className={`
                              p-2 rounded-lg border text-left cursor-pointer transition-all hover:scale-[1.02] active:scale-95
                              ${appt.status === 'completed' 
                                ? 'bg-white/5 border-white/10 opacity-60' 
                                : 'bg-primary/10 border-primary/20'}
                            `}
                          >
                            <div className="flex justify-between items-start mb-0.5">
                              <div className="text-[10px] font-bold text-primary uppercase tracking-tight">
                                {formatDate(new Date(appt.scheduledAt), 'HH:mm')}
                              </div>
                              {appt.status !== 'completed' && appt.status !== 'cancelled' && (
                                <button 
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    if (confirm('Cancel this appointment?')) {
                                      const res = await fetch(`/api/appointments/${appt.id}/cancel`, { method: 'PATCH' });
                                      if (res.ok) router.refresh();
                                      else alert('Failed to cancel');
                                    }
                                  }}
                                  className="text-white/20 hover:text-red-400 p-0.5 transition-colors"
                                >
                                  <XCircle size={12} />
                                </button>
                              )}
                            </div>
                            <div className={`text-white text-xs font-bold font-inter truncate ${appt.status === 'cancelled' ? 'line-through opacity-50' : ''}`}>
                              {appt.customer.name || 'Walk-in'}
                            </div>
                            <div className="text-white/40 text-[9px] uppercase tracking-wider font-bold truncate">
                              {appt.service?.name || 'Service'}
                            </div>
                            {selectedBarberId === 'all' && (
                              <div className="mt-1 pt-1 border-t border-white/5 flex items-center gap-1">
                                <div className="w-3 h-3 rounded-full bg-primary/20 flex items-center justify-center">
                                  <User size={8} className="text-primary" />
                                </div>
                                <span className="text-[8px] text-white/30 font-inter truncate">{appt.barber?.name}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
