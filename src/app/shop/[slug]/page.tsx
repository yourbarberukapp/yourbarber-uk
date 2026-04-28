import { notFound } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db';
import { 
  Scissors, MapPin, Phone, Clock, ChevronRight, Star, Camera
} from 'lucide-react';
import StickyBookingBar from '@/components/microsite/StickyBookingBar';
import TestimonialCarousel from '@/components/microsite/TestimonialCarousel';
import AnimateIn from '@/components/microsite/AnimateIn';
import QueueStatus from '@/components/microsite/QueueStatus';

type OpeningHours = {
  mon: { open: string; close: string; closed: boolean };
  tue: { open: string; close: string; closed: boolean };
  wed: { open: string; close: string; closed: boolean };
  thu: { open: string; close: string; closed: boolean };
  fri: { open: string; close: string; closed: boolean };
  sat: { open: string; close: string; closed: boolean };
  sun: { open: string; close: string; closed: boolean };
};

const DAY_NAMES: [string, keyof OpeningHours][] = [
  ['Monday', 'mon'], ['Tuesday', 'tue'], ['Wednesday', 'wed'], ['Thursday', 'thu'],
  ['Friday', 'fri'], ['Saturday', 'sat'], ['Sunday', 'sun'],
];

function fmt(t: string) {
  const [h, m] = t.split(':').map(Number);
  const suffix = h < 12 ? 'am' : 'pm';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return m === 0 ? `${h12}${suffix}` : `${h12}:${m.toString().padStart(2, '0')}${suffix}`;
}

import { cookies } from 'next/headers';
import DemoOverrideTrigger from '@/components/DemoOverrideTrigger';

export default async function ShopMicrosite({ params }: { params: { slug: string } }) {
  const shopData = await db.shop.findUnique({
    where: { slug: params.slug },
    include: {
      photos: { orderBy: { sortOrder: 'asc' } },
      services: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
      barbers: { where: { isActive: true } },
      visits: {
        where: { photos: { some: {} } },
        orderBy: { visitedAt: 'desc' },
        take: 12,
        include: { photos: true, barber: true },
      },
      feedbacks: {
        where: { rating: 'positive' },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { customer: true },
      },
    },
  });

  if (!shopData) notFound();

  // Apply Demo Overrides if present in cookies
  const cookieStore = cookies();
  const overrideCookie = cookieStore.get(`demo_override_${params.slug}`);
  let shop = shopData;

  if (overrideCookie) {
    try {
      const overrides = JSON.parse(decodeURIComponent(atob(overrideCookie.value)));
      shop = {
        ...shopData,
        name: overrides.name || shopData.name,
        address: overrides.address || shopData.address,
        googleMapsUrl: overrides.googleMapsUrl || shopData.googleMapsUrl,
      };
    } catch (e) {
      console.error('Failed to parse demo overrides from cookie');
    }
  }

  const hours = shop.openingHours as OpeningHours | null;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white selection:bg-[#C8F135] selection:text-black">
      <StickyBookingBar shopSlug={shop.slug} shopName={shop.name} />

      {/* Navbar Overlay */}
      <nav className="fixed top-0 left-0 right-0 z-40 px-6 py-6 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent backdrop-blur-sm md:backdrop-blur-none">
        <DemoOverrideTrigger shopSlug={shop.slug} />
        
        <div className="flex items-center gap-4">
          <Link 
            href={`/customer/login?shop=${shop.slug}`}
            className="text-white/70 hover:text-[#C8F135] font-barlow font-bold text-sm uppercase tracking-widest transition-colors"
          >
            Client Login
          </Link>
          <Link
            href={`/shop/${shop.slug}/book`}
            className="bg-white/10 hover:bg-[#C8F135] hover:text-black px-5 py-2.5 rounded font-barlow font-bold text-sm uppercase tracking-widest transition-all"
          >
            Book Now
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen min-h-[700px] flex items-center px-6 overflow-hidden">
        {/* Background Layer */}
        <div className="absolute inset-0 z-0">
          <div 
            className="absolute inset-0 bg-center bg-cover transition-transform duration-[10s] scale-105 hover:scale-100"
            style={{ 
              backgroundImage: `url(${shop.coverPhotoUrl || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=2070&auto=format&fit=crop'})`,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto w-full pt-20">
          <AnimateIn direction="left" distance={50} duration={0.8}>
            <h1 className="font-barlow font-black text-7xl md:text-9xl uppercase leading-[0.85] tracking-tighter mb-6">
              {shop.name.split(' ').map((word, i) => (
                <span key={i} className="block last:text-[#C8F135]">{word}</span>
              ))}
            </h1>
            <p className="font-inter text-xl md:text-2xl text-white/60 max-w-xl mb-10 leading-relaxed">
              {shop.about || "Premium cuts, sharp fades, and the best grooming experience in the city. Your history, your style, always preserved."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href={`/shop/${shop.slug}/book`}
                className="inline-flex items-center justify-center gap-3 bg-[#C8F135] text-black px-10 py-5 rounded-lg font-barlow font-black text-2xl uppercase tracking-wider hover:bg-[#b5da2d] transition-all transform hover:-translate-y-1"
              >
                Get Faded <ChevronRight size={24} />
              </Link>
              
              <div className="flex-1 max-w-xs">
                <QueueStatus shopSlug={shop.slug} />
              </div>

              <div className="flex items-center gap-6 px-4">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-[#0A0A0A] bg-[#111] flex items-center justify-center overflow-hidden">
                      <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="Customer" />
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex text-[#C8F135]">
                    {[1, 2, 3, 4, 5].map((i) => <Star key={i} size={14} fill="currentColor" />)}
                  </div>
                  <p className="text-white/40 text-xs font-inter mt-1 uppercase tracking-widest font-bold">500+ Happy Clients</p>
                </div>
              </div>
            </div>
          </AnimateIn>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/20">
          <span className="font-barlow text-[10px] uppercase tracking-[0.3em] font-bold">Scroll Down</span>
          <div className="w-px h-12 bg-gradient-to-b from-white/20 to-transparent" />
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 pb-24 space-y-32">
        
        {/* Services Section */}
        <section id="services">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <h2 className="font-barlow font-black text-6xl md:text-8xl uppercase tracking-tighter leading-none mb-4">
                Services
              </h2>
              <p className="text-white/40 font-inter text-lg">Expert craftsmanship for every style</p>
            </div>
            <div className="h-px flex-1 bg-white/5 mx-12 hidden md:block" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shop.services.map((service) => (
              <div 
                key={service.id}
                className="group relative bg-[#111] border border-white/5 rounded-2xl p-8 hover:bg-[#161616] transition-all hover:border-[#C8F135]/30"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 rounded-xl bg-[#C8F135]/5 flex items-center justify-center group-hover:bg-[#C8F135] group-hover:text-black transition-colors">
                    <Scissors size={24} />
                  </div>
                  <span className="font-barlow font-black text-3xl text-[#C8F135]">
                    {service.price === null ? 'POA' : `£${Number(service.price).toFixed(2)}`}
                  </span>
                </div>
                <h3 className="font-barlow font-bold text-2xl uppercase tracking-tight mb-2 group-hover:text-[#C8F135] transition-colors">
                  {service.name}
                </h3>
                <div className="flex items-center gap-2 text-white/40 text-xs font-inter uppercase tracking-widest mb-4">
                  <Clock size={12} /> {service.duration} MINS
                </div>
                <p className="text-white/50 font-inter text-sm leading-relaxed">
                  {service.description || "Precision cut tailored to your hair type and face shape."}
                </p>
                <Link 
                  href={`/shop/${shop.slug}/book?service=${service.id}`}
                  className="mt-8 flex items-center gap-2 text-[10px] font-barlow font-bold uppercase tracking-widest text-white/30 group-hover:text-[#C8F135] transition-colors"
                >
                  Select Service <ChevronRight size={10} />
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Gallery / Recent Cuts */}
        <section id="gallery">
          <div className="flex items-center gap-4 mb-12">
            <h2 className="font-barlow font-black text-6xl md:text-8xl uppercase tracking-tighter leading-none">
              Recent <span className="text-[#C8F135]">Cuts</span>
            </h2>
            <div className="h-px flex-1 bg-white/10" />
            <Link 
              href={`/shop/${shop.slug}/styles`}
              className="font-barlow font-bold text-sm uppercase tracking-widest text-white/40 hover:text-[#C8F135] transition-colors shrink-0"
            >
              View Full Gallery
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {shop.visits.map((visit, i) => (
              <div 
                key={visit.id} 
                className={`group relative aspect-[4/5] rounded-2xl overflow-hidden bg-[#111] ${i % 3 === 0 ? 'md:col-span-2 md:row-span-2 aspect-auto' : ''}`}
              >
                <img 
                  src={visit.photos.find(p => p.angle === 'front')?.url || visit.photos[0]?.url} 
                  alt="Recent Cut"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-6 flex flex-col justify-end">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-[#C8F135] flex items-center justify-center">
                      <Camera size={12} className="text-black" />
                    </div>
                    <span className="text-xs font-barlow font-bold uppercase tracking-widest text-[#C8F135]">
                      {visit.photos.length} Angles
                    </span>
                  </div>
                  <h4 className="font-barlow font-bold text-lg uppercase tracking-tight text-white mb-1">
                    By {visit.barber.name}
                  </h4>
                  <p className="text-white/50 text-xs font-inter">
                    {new Date(visit.visitedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Testimonials */}
        <TestimonialCarousel testimonials={shop.feedbacks} />

        {/* Team Section */}
        <section id="team">
          <div className="bg-[#111] rounded-3xl p-12 md:p-20 overflow-hidden relative border border-white/5">
            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
              <Scissors size={300} className="text-[#C8F135]" />
            </div>

            <div className="relative z-10">
              <div className="max-w-2xl mb-16">
                <h2 className="font-barlow font-black text-6xl md:text-8xl uppercase tracking-tighter leading-none mb-6">
                  The <span className="text-[#C8F135]">Elite</span>
                </h2>
                <p className="text-white/40 font-inter text-xl leading-relaxed">
                  Our team consists of master barbers with years of experience in traditional techniques and modern trends.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                {shop.barbers.map((barber) => (
                  <div key={barber.id} className="group">
                    <div className="relative mb-6 aspect-square rounded-2xl overflow-hidden bg-black border border-white/5 group-hover:border-[#C8F135]/50 transition-colors">
                      {barber.photoUrl ? (
                        <img src={barber.photoUrl} alt={barber.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-white/5">
                          <Scissors size={64} className="text-white/10" />
                        </div>
                      )}
                      <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                        <span className="font-barlow font-bold text-[10px] uppercase tracking-widest text-[#C8F135]">
                          {barber.role}
                        </span>
                      </div>
                    </div>
                    <h3 className="font-barlow font-black text-3xl uppercase tracking-tight mb-2 group-hover:text-[#C8F135] transition-colors">
                      {barber.name}
                    </h3>
                    <p className="text-white/40 font-inter text-sm leading-relaxed mb-6">
                      {barber.bio || "Specialist in razor fades and traditional beard sculpting."}
                    </p>
                    <Link 
                      href={`/shop/${shop.slug}/book?barber=${barber.id}`}
                      className="flex items-center gap-2 font-barlow font-bold text-xs uppercase tracking-[0.2em] text-[#C8F135]"
                    >
                      Book with {barber.name.split(' ')[0]} <ChevronRight size={14} />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Location & Contact */}
        <section id="contact" className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-12">
            <div>
              <h2 className="font-barlow font-black text-5xl uppercase tracking-tighter mb-8">
                Visit Us
              </h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                    <MapPin size={20} className="text-[#C8F135]" />
                  </div>
                  <div>
                    <h4 className="font-barlow font-bold uppercase tracking-widest text-white/30 text-xs mb-1">Address</h4>
                    <p className="font-inter text-lg">{shop.address || "123 Grooming Lane, Barber City, BC 123"}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                    <Phone size={20} className="text-[#C8F135]" />
                  </div>
                  <div>
                    <h4 className="font-barlow font-bold uppercase tracking-widest text-white/30 text-xs mb-1">Phone</h4>
                    <p className="font-inter text-lg">{shop.phone || "+44 20 1234 5678"}</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-barlow font-bold uppercase tracking-[0.3em] text-white/20 text-xs mb-6">Opening Hours</h3>
              <div className="grid grid-cols-1 gap-3">
                {DAY_NAMES.map(([dayLabel, key]) => {
                  const d = hours?.[key];
                  return (
                    <div key={key} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                      <span className="font-inter text-white/60">{dayLabel}</span>
                      <span className={`font-barlow font-bold uppercase ${d?.closed ? 'text-white/20' : 'text-white'}`}>
                        {d?.closed ? 'Closed' : `${fmt(d!.open)} – ${fmt(d!.close)}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-4">
              <Link href="#" className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center hover:border-[#C8F135] hover:text-[#C8F135] transition-colors">
                <span className="text-xs font-black">IG</span>
              </Link>
              <Link href="#" className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center hover:border-[#C8F135] hover:text-[#C8F135] transition-colors">
                <span className="text-xs font-black">FB</span>
              </Link>
              <Link href="#" className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center hover:border-[#C8F135] hover:text-[#C8F135] transition-colors">
                <span className="text-xs font-black">X</span>
              </Link>
            </div>
          </div>

          <div className="rounded-3xl overflow-hidden bg-[#111] border border-white/5 h-[600px] relative">
            {shop.googleMapsUrl ? (
              <iframe 
                src={shop.googleMapsUrl}
                className="w-full h-full grayscale invert opacity-60 contrast-125"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-12 text-center text-white/10">
                <MapPin size={80} className="mb-6" />
                <p className="font-barlow font-bold text-2xl uppercase tracking-tight">Interactive Map Coming Soon</p>
              </div>
            )}
            <div className="absolute inset-0 pointer-events-none border-[20px] border-[#0A0A0A]" />
          </div>
        </section>

      </div>

      {/* Footer */}
      <footer className="bg-black py-20 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
              <Scissors size={24} className="text-[#C8F135]" />
            </div>
            <div>
              <span className="font-barlow font-black text-3xl uppercase tracking-tighter block leading-none">
                Your<span className="text-[#C8F135]">Barber</span>
              </span>
              <span className="text-[10px] font-inter uppercase tracking-[0.4em] text-white/30 font-black">Professional Platform</span>
            </div>
          </div>

          <div className="flex gap-12">
            <div className="space-y-4">
              <h5 className="font-barlow font-bold text-xs uppercase tracking-widest text-white/40">Platform</h5>
              <ul className="space-y-2 font-inter text-sm text-white/60">
                <li><Link href="/customer/login" className="hover:text-[#C8F135]">Client History</Link></li>
                <li><Link href="/shop/register" className="hover:text-[#C8F135]">For Shop Owners</Link></li>
                <li><Link href="/booking" className="hover:text-[#C8F135]">Book Appointment</Link></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h5 className="font-barlow font-bold text-xs uppercase tracking-widest text-white/40">Support</h5>
              <ul className="space-y-2 font-inter text-sm text-white/60">
                <li><Link href="/privacy" className="hover:text-[#C8F135]">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-[#C8F135]">Terms of Use</Link></li>
                <li><Link href="/contact" className="hover:text-[#C8F135]">Get in Touch</Link></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-20 pt-8 border-t border-white/5 flex justify-between items-center text-[10px] font-inter uppercase tracking-[0.2em] text-white/20">
          <span>&copy; 2026 Your Barber Platform. All Rights Reserved.</span>
          <span>Crafted for Professionals</span>
        </div>
      </footer>
    </div>
  );
}
