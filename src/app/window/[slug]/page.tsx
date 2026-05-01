'use client';

import { useEffect, useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';

type OpeningHours = {
  mon: { open: string; close: string; closed: boolean };
  tue: { open: string; close: string; closed: boolean };
  wed: { open: string; close: string; closed: boolean };
  thu: { open: string; close: string; closed: boolean };
  fri: { open: string; close: string; closed: boolean };
  sat: { open: string; close: string; closed: boolean };
  sun: { open: string; close: string; closed: boolean };
};

type WindowData = {
  shop: {
    name: string;
    slug: string;
    logoUrl: string | null;
    openingHours: OpeningHours | null;
  };
  waiting: number;
  inProgress: number;
  waitMinutes: number;
  photos: { id: string; url: string; angle: string }[];
};

const DAY_KEYS: [string, keyof OpeningHours][] = [
  ['Mon', 'mon'], ['Tue', 'tue'], ['Wed', 'wed'], ['Thu', 'thu'],
  ['Fri', 'fri'], ['Sat', 'sat'], ['Sun', 'sun'],
];

function fmt(t: string) {
  const [h, m] = t.split(':').map(Number);
  const suffix = h < 12 ? 'am' : 'pm';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return m === 0 ? `${h12}${suffix}` : `${h12}:${m.toString().padStart(2, '0')}${suffix}`;
}

function todayKey(): keyof OpeningHours {
  const keys: (keyof OpeningHours)[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  return keys[new Date().getDay()];
}

export default function WindowDisplay({ params }: { params: { slug: string } }) {
  const [data, setData] = useState<WindowData | null>(null);
  const [clock, setClock] = useState('');
  const [photoIndex, setPhotoIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const arriveUrl = `https://yourbarber.uk/arrive/${params.slug}`;

  async function fetchData() {
    try {
      const res = await fetch(`/api/window/${params.slug}`, { cache: 'no-store' });
      if (res.ok) setData(await res.json());
    } catch {
      // silent — keep showing last known state
    }
  }

  useEffect(() => {
    fetchData();
    const poll = setInterval(fetchData, 30_000);
    return () => clearInterval(poll);
  }, [params.slug]);

  // Clock
  useEffect(() => {
    function tick() {
      const now = new Date();
      setClock(now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
    }
    tick();
    const t = setInterval(tick, 10_000);
    return () => clearInterval(t);
  }, []);

  // Photo rotation
  useEffect(() => {
    if (!data?.photos.length) return;
    intervalRef.current = setInterval(() => {
      setPhotoIndex(i => (i + 1) % data.photos.length);
    }, 5_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [data?.photos.length]);

  if (!data) {
    return (
      <div className="w-screen h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-white/20 font-barlow font-black text-4xl uppercase tracking-widest">Loading…</div>
      </div>
    );
  }

  const { shop, waiting, waitMinutes, photos } = data;
  const hours = shop.openingHours;
  const isOpen = waiting > 0 || data.inProgress > 0;
  const currentPhoto = photos[photoIndex];

  // Today's hours for the status strip
  const todayHours = hours?.[todayKey()];

  return (
    <div
      className="w-screen h-screen bg-[#0A0A0A] text-white overflow-hidden flex flex-col"
      style={{ fontFamily: 'var(--font-barlow), sans-serif' }}
    >
      {/* Main content — fills all but footer */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── LEFT PANEL — queue status ── */}
        <div className="flex flex-col justify-between flex-1 px-[5vw] py-[4vh]">

          {/* Shop name */}
          <div className="flex items-center gap-4">
            {shop.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={shop.logoUrl} alt={shop.name} className="h-12 w-12 rounded-full object-cover" />
            )}
            <div>
              <div className="text-[1.4vw] font-black uppercase tracking-[0.25em] text-white/35">Your Barber</div>
              <div className="text-[2.2vw] font-black uppercase leading-none tracking-tight">{shop.name}</div>
            </div>
            <div className="ml-auto text-[2.5vw] font-black tabular-nums text-white/25">{clock}</div>
          </div>

          {/* ── BIG STATUS ── */}
          <div className="flex-1 flex flex-col justify-center">
            {waiting === 0 ? (
              <>
                <div
                  className="font-black uppercase leading-none tracking-tighter"
                  style={{ fontSize: 'clamp(4rem, 11vw, 12rem)', color: '#C8F135' }}
                >
                  Walk in
                  <br />
                  now.
                </div>
                <div
                  className="font-black uppercase text-white/60 mt-4 leading-none"
                  style={{ fontSize: 'clamp(1.5rem, 3.5vw, 4rem)' }}
                >
                  No wait — chair&apos;s ready.
                </div>
              </>
            ) : (
              <>
                <div
                  className="font-black uppercase leading-none tracking-tighter text-white"
                  style={{ fontSize: 'clamp(2rem, 5vw, 5.5rem)' }}
                >
                  Est. wait
                </div>
                <div
                  className="font-black uppercase leading-none tracking-tighter"
                  style={{ fontSize: 'clamp(5rem, 15vw, 16rem)', color: '#C8F135' }}
                >
                  {waitMinutes}
                  <span style={{ fontSize: '0.35em' }} className="text-white/50"> min</span>
                </div>
                <div
                  className="font-black uppercase text-white/55 mt-2 leading-none"
                  style={{ fontSize: 'clamp(1.25rem, 2.8vw, 3rem)' }}
                >
                  Scan to save your place →
                </div>
              </>
            )}
          </div>

          {/* Opening hours */}
          {hours && (
            <div className="flex gap-[2vw] flex-wrap">
              {DAY_KEYS.map(([label, key]) => {
                const day = hours[key];
                const isToday = key === todayKey();
                return (
                  <div key={key} className={`text-center ${isToday ? 'opacity-100' : 'opacity-30'}`}>
                    <div
                      className={`font-black uppercase tracking-widest mb-0.5 ${isToday ? 'text-[#C8F135]' : 'text-white/40'}`}
                      style={{ fontSize: 'clamp(0.5rem, 1vw, 0.9rem)' }}
                    >
                      {label}
                    </div>
                    <div
                      className="font-bold text-white uppercase"
                      style={{ fontSize: 'clamp(0.55rem, 1.1vw, 1rem)' }}
                    >
                      {day.closed ? 'Closed' : `${fmt(day.open)}–${fmt(day.close)}`}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── RIGHT PANEL — QR + portfolio ── */}
        <div
          className="flex flex-col items-center justify-between py-[4vh] px-[3vw] border-l border-white/8"
          style={{ width: '32vw', minWidth: '280px' }}
        >
          {/* QR code */}
          <div className="flex flex-col items-center gap-4 flex-1 justify-center">
            <div
              className="font-black uppercase tracking-[0.2em] text-white/35 text-center"
              style={{ fontSize: 'clamp(0.6rem, 1.1vw, 1rem)' }}
            >
              Scan to join the queue
            </div>
            <div className="bg-white p-[1.5vw] rounded-xl">
              <QRCodeSVG
                value={arriveUrl}
                size={240}
                bgColor="#ffffff"
                fgColor="#0A0A0A"
                level="M"
                style={{ width: '18vw', height: '18vw', maxWidth: 280, maxHeight: 280, minWidth: 140, minHeight: 140 }}
              />
            </div>
            <div
              className="font-black uppercase text-[#C8F135] tracking-widest text-center"
              style={{ fontSize: 'clamp(0.55rem, 1vw, 0.9rem)' }}
            >
              yourbarber.uk/arrive/{shop.slug}
            </div>
          </div>

          {/* Portfolio photo strip */}
          {currentPhoto && (
            <div className="w-full mt-4" style={{ height: '30vh' }}>
              <div
                className="text-[10px] font-black uppercase tracking-[0.2em] text-white/25 mb-2 text-center"
                style={{ fontSize: 'clamp(0.45rem, 0.85vw, 0.75rem)' }}
              >
                Recent cuts
              </div>
              <div className="relative w-full h-full rounded-xl overflow-hidden border border-white/8">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  key={currentPhoto.id}
                  src={currentPhoto.url}
                  alt="Recent cut"
                  className="w-full h-full object-cover transition-opacity duration-1000"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                {photos.length > 1 && (
                  <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
                    {photos.map((_, i) => (
                      <div
                        key={i}
                        className="w-1 h-1 rounded-full transition-all"
                        style={{ background: i === photoIndex ? '#C8F135' : 'rgba(255,255,255,0.25)' }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── FOOTER TICKER ── */}
      <div className="flex items-center h-[6vh] min-h-[36px] border-t border-white/8 bg-[#0f0f0f] overflow-hidden">
        <div className="flex items-center gap-2 px-4 border-r border-white/8 h-full shrink-0">
          <div
            className="w-2 h-2 rounded-full"
            style={{ background: isOpen ? '#C8F135' : 'rgba(255,255,255,0.2)' }}
          />
          <span
            className="font-black uppercase tracking-widest text-white/50"
            style={{ fontSize: 'clamp(0.5rem, 1vw, 0.8rem)' }}
          >
            {shop.name}
          </span>
        </div>
        <div className="flex-1 overflow-hidden">
          <div
            className="whitespace-nowrap font-black uppercase tracking-widest text-white/30 animate-marquee"
            style={{ fontSize: 'clamp(0.5rem, 1vw, 0.8rem)' }}
          >
            {waiting === 0
              ? `Walk-ins welcome — no wait right now — scan the QR to save your place — ${shop.name} is open`
              : `Estimated wait: ${waitMinutes} minutes — ${waiting} ${waiting === 1 ? 'person' : 'people'} in queue — scan to save your place — ${shop.name}`}
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            {todayHours && !todayHours.closed
              ? `Open today ${fmt(todayHours.open)} – ${fmt(todayHours.close)}`
              : 'Closed today'}
          </div>
        </div>
      </div>
    </div>
  );
}
