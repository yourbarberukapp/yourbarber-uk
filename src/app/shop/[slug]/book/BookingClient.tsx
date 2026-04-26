'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scissors, User, Calendar as CalendarIcon, Check, ChevronRight, Loader2, LogIn } from 'lucide-react';
import Link from 'next/link';

interface BookingClientProps {
  shop: any;
  services: any[];
  barbers: any[];
  initialCustomer: any;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function isSameDay(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate();
}

function formatDate(date: Date, format: 'yyyy-MM-dd' | 'PPPP' | 'p' | 'EEE' | 'd' | 'HH:mm') {
  if (format === 'yyyy-MM-dd') return date.toISOString().slice(0, 10);
  if (format === 'p') return date.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit' });
  if (format === 'EEE') return date.toLocaleDateString('en-GB', { weekday: 'short' });
  if (format === 'd') return String(date.getDate());
  if (format === 'HH:mm') return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
  return date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export default function BookingClient({ shop, services, barbers, initialCustomer }: BookingClientProps) {
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedBarber, setSelectedBarber] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(startOfToday());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notes, setNotes] = useState('');
  const [success, setSuccess] = useState(false);

  // Fetch slots when date, barber or service changes
  useEffect(() => {
    if (step === 3 && selectedService) {
      fetchSlots();
    }
  }, [selectedDate, selectedBarber, selectedService, step]);

  async function fetchSlots() {
    setLoadingSlots(true);
    try {
      const params = new URLSearchParams({
        shopId: shop.id,
        date: formatDate(selectedDate, 'yyyy-MM-dd'),
        serviceId: selectedService.id,
      });
      if (selectedBarber) params.append('barberId', selectedBarber.id);

      const res = await fetch(`/api/appointments/available?${params.toString()}`);
      const data = await res.json();
      setAvailableSlots(data.slots || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSlots(false);
    }
  }

  // If not logged in, show login CTA
  if (!initialCustomer) {
    return (
      <div className="bg-[#111] border border-white/10 rounded-2xl p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-[#C8F135]/10 flex items-center justify-center mx-auto mb-6">
          <LogIn size={32} className="text-[#C8F135]" />
        </div>
        <h2 className="font-barlow font-black text-2xl uppercase mb-3 text-white">Login Required</h2>
        <p className="text-white/60 mb-8 font-inter max-w-sm mx-auto">
          You need to be logged in to book an appointment and track your cut history.
        </p>
        <Link
          href={`/customer/login?redirect=/shop/${shop.slug}/book`}
          className="inline-flex items-center gap-2 bg-[#C8F135] text-[#0A0A0A] px-8 py-4 rounded-xl font-barlow font-bold uppercase tracking-wider no-underline hover:bg-[#b5da2d] transition-transform active:scale-95"
        >
          Login with Phone <ChevronRight size={18} />
        </Link>
      </div>
    );
  }

  async function handleBook() {
    if (!selectedTime) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/appointments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId: shop.id,
          barberId: selectedBarber?.id,
          serviceId: selectedService.id,
          scheduledAt: selectedTime,
          notes,
        }),
      });
      if (res.ok) {
        setSuccess(true);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to book');
      }
    } catch (err) {
      alert('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (success) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#111] border border-[#C8F135]/30 rounded-2xl p-10 text-center"
      >
        <div className="w-20 h-20 rounded-full bg-[#C8F135]/20 flex items-center justify-center mx-auto mb-6">
          <Check size={40} className="text-[#C8F135]" />
        </div>
        <h2 className="font-barlow font-black text-3xl uppercase mb-2 text-[#C8F135]">Booking Confirmed!</h2>
        <p className="text-white/60 mb-8 font-inter">
          Your appointment at {shop.name} is all set. We'll send you an SMS reminder 24 hours before your cut.
        </p>
        <div className="bg-[#0A0A0A] rounded-xl p-6 text-left mb-8 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-white/40 font-inter">Service</span>
            <span className="text-white font-bold font-inter">{selectedService.name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/40 font-inter">Date</span>
            <span className="text-white font-bold font-inter">{formatDate(new Date(selectedTime!), 'PPPP')}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/40 font-inter">Time</span>
            <span className="text-white font-bold font-inter">{formatDate(new Date(selectedTime!), 'p')}</span>
          </div>
          {selectedBarber && (
            <div className="flex justify-between text-sm">
              <span className="text-white/40 font-inter">Barber</span>
              <span className="text-white font-bold font-inter">{selectedBarber.name}</span>
            </div>
          )}
        </div>
        <Link 
          href="/customer"
          className="inline-block w-full bg-[#C8F135] text-[#0A0A0A] py-4 rounded-xl font-barlow font-bold uppercase no-underline hover:bg-[#b5da2d] transition-colors"
        >
          Go to Dashboard
        </Link>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-4 mb-8">
        {[1, 2, 3, 4].map(s => (
          <div 
            key={s}
            className={`w-2.5 h-2.5 rounded-full transition-colors duration-300 ${s <= step ? 'bg-[#C8F135]' : 'bg-white/10'}`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2 mb-4">
              <Scissors size={18} className="text-[#C8F135]" />
              <h2 className="font-barlow font-bold text-xl uppercase tracking-wide">Select Service</h2>
            </div>
            <div className="grid gap-3">
              {services.map(service => (
                <button
                  key={service.id}
                  onClick={() => { setSelectedService(service); setStep(2); }}
                  className={`flex items-center justify-between p-5 rounded-2xl border transition-all text-left ${
                    selectedService?.id === service.id 
                    ? 'bg-[#C8F135]/10 border-[#C8F135]' 
                    : 'bg-[#111] border-white/5 hover:border-white/20'
                  }`}
                >
                  <div>
                    <div className="font-inter font-bold text-lg text-white">{service.name}</div>
                    <div className="text-white/40 text-sm font-inter">{service.duration} min</div>
                  </div>
                  <div className="font-barlow font-black text-xl text-[#C8F135]">
                    £{parseFloat(service.price).toFixed(2)}
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <User size={18} className="text-[#C8F135]" />
                <h2 className="font-barlow font-bold text-xl uppercase tracking-wide">Select Barber</h2>
              </div>
              <button onClick={() => setStep(1)} className="text-white/40 text-sm font-inter hover:text-white">Change Service</button>
            </div>
            <div className="grid gap-3">
              <button
                onClick={() => { setSelectedBarber(null); setStep(3); }}
                className={`flex items-center gap-4 p-5 rounded-2xl border transition-all text-left ${
                  selectedBarber === null 
                  ? 'bg-[#C8F135]/10 border-[#C8F135]' 
                  : 'bg-[#111] border-white/5 hover:border-white/20'
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                  <User size={24} className="text-white/40" />
                </div>
                <div>
                  <div className="font-inter font-bold text-lg text-white">Anyone Available</div>
                  <div className="text-white/40 text-sm font-inter">Best for speed</div>
                </div>
              </button>
              {barbers.map(barber => (
                <button
                  key={barber.id}
                  onClick={() => { setSelectedBarber(barber); setStep(3); }}
                  className={`flex items-center gap-4 p-5 rounded-2xl border transition-all text-left ${
                    selectedBarber?.id === barber.id 
                    ? 'bg-[#C8F135]/10 border-[#C8F135]' 
                    : 'bg-[#111] border-white/5 hover:border-white/20'
                  }`}
                >
                  {barber.photoUrl ? (
                    <img src={barber.photoUrl} className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-[#C8F135]/10 flex items-center justify-center text-[#C8F135] font-barlow font-black">
                      {barber.name[0]}
                    </div>
                  )}
                  <div>
                    <div className="font-inter font-bold text-lg text-white">{barber.name}</div>
                    <div className="text-white/40 text-sm font-inter uppercase tracking-widest text-[10px]">{barber.role}</div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarIcon size={18} className="text-[#C8F135]" />
                <h2 className="font-barlow font-bold text-xl uppercase tracking-wide">Select Time</h2>
              </div>
              <button onClick={() => setStep(2)} className="text-white/40 text-sm font-inter hover:text-white">Change Barber</button>
            </div>

            {/* Date Selector */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {Array.from({ length: 14 }).map((_, i) => {
                const date = addDays(new Date(), i);
                const active = isSameDay(date, selectedDate);
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDate(date)}
                    className={`flex flex-col items-center justify-center min-w-[70px] py-4 rounded-xl border transition-all ${
                      active 
                      ? 'bg-[#C8F135] text-[#0A0A0A] border-[#C8F135]' 
                      : 'bg-[#111] text-white border-white/5 hover:border-white/20'
                    }`}
                  >
                    <span className="text-[10px] font-barlow font-black uppercase tracking-widest mb-1 opacity-70">
                      {formatDate(date, 'EEE')}
                    </span>
                    <span className="text-xl font-barlow font-black">
                      {formatDate(date, 'd')}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Time Slots */}
            <div className="min-h-[200px] relative">
              {loadingSlots ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="text-[#C8F135] animate-spin" size={32} />
                </div>
              ) : availableSlots.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {availableSlots.map(slot => (
                    <button
                      key={slot.time}
                      onClick={() => setSelectedTime(slot.time)}
                      className={`py-3 rounded-xl border font-barlow font-black text-sm uppercase transition-all ${
                        selectedTime === slot.time
                        ? 'bg-[#C8F135] text-[#0A0A0A] border-[#C8F135]'
                        : 'bg-[#111] text-white border-white/5 hover:border-white/20'
                      }`}
                    >
                      {formatDate(new Date(slot.time), 'HH:mm')}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-white/40 font-inter">
                  No slots available for this day.
                </div>
              )}
            </div>

            <button
              disabled={!selectedTime}
              onClick={() => setStep(4)}
              className="w-full bg-[#C8F135] text-[#0A0A0A] py-4 rounded-xl font-barlow font-bold uppercase tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#b5da2d]"
            >
              Review Details
            </button>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <Check size={18} className="text-[#C8F135]" />
              <h2 className="font-barlow font-bold text-xl uppercase tracking-wide">Finalize Booking</h2>
            </div>

            <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden">
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[#C8F135]/10 flex items-center justify-center text-[#C8F135]">
                    <Scissors size={20} />
                  </div>
                  <div>
                    <div className="text-xs text-white/40 font-inter uppercase tracking-widest">Service</div>
                    <div className="text-white font-bold font-inter">{selectedService.name}</div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[#C8F135]/10 flex items-center justify-center text-[#C8F135]">
                    <CalendarIcon size={20} />
                  </div>
                  <div>
                    <div className="text-xs text-white/40 font-inter uppercase tracking-widest">When</div>
                    <div className="text-white font-bold font-inter">
                      {formatDate(new Date(selectedTime!), 'PPPP')} at {formatDate(new Date(selectedTime!), 'p')}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[#C8F135]/10 flex items-center justify-center text-[#C8F135]">
                    <User size={20} />
                  </div>
                  <div>
                    <div className="text-xs text-white/40 font-inter uppercase tracking-widest">Barber</div>
                    <div className="text-white font-bold font-inter">{selectedBarber?.name || 'Anyone Available'}</div>
                  </div>
                </div>
              </div>

              <div className="bg-[#181818] p-6">
                <textarea
                  placeholder="Notes for your barber (optional)..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-[#C8F135]/50 transition-colors h-24 font-inter resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(3)}
                className="flex-1 bg-[#111] text-white py-4 rounded-xl font-barlow font-bold uppercase tracking-widest border border-white/5 hover:border-white/20 transition-all"
              >
                Back
              </button>
              <button
                onClick={handleBook}
                disabled={isSubmitting}
                className="flex-[2] bg-[#C8F135] text-[#0A0A0A] py-4 rounded-xl font-barlow font-bold uppercase tracking-widest transition-all hover:bg-[#b5da2d] flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Confirm Booking'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
