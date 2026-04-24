import { notFound } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db';
import { Scissors, MapPin, Phone, Clock, ExternalLink } from 'lucide-react';

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

export default async function ShopMicrosite({ params }: { params: { slug: string } }) {
  const shop = await db.shop.findUnique({
    where: { slug: params.slug },
    select: {
      name: true, slug: true, address: true, phone: true, about: true,
      coverPhotoUrl: true, googleMapsUrl: true, bookingUrl: true, openingHours: true,
      photos: { orderBy: { sortOrder: 'asc' }, select: { id: true, url: true, caption: true } },
      services: { where: { isActive: true }, orderBy: { sortOrder: 'asc' }, select: { id: true, name: true, price: true, duration: true, description: true } },
      barbers: { where: { isActive: true }, select: { id: true, name: true, role: true, bio: true, photoUrl: true } },
    },
  });

  if (!shop) notFound();

  const hours = shop.openingHours as OpeningHours | null;

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0A', color: 'white' }}>
      {/* Hero */}
      <div style={{
        position: 'relative', overflow: 'hidden',
        background: shop.coverPhotoUrl
          ? `linear-gradient(to bottom, rgba(10,10,10,0.5), #0A0A0A), url(${shop.coverPhotoUrl}) center/cover`
          : 'linear-gradient(135deg, #0f0f0f 0%, #111 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '4rem 1.5rem 3rem',
      }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1.25rem' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(200,241,53,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Scissors size={16} color="#C8F135" />
            </div>
            <span style={{ fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 900, fontSize: '1.25rem', textTransform: 'uppercase', letterSpacing: '-0.01em' }}>
              Your<span style={{ color: '#C8F135' }}>Barber</span>
            </span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 900, fontSize: 'clamp(2.5rem, 8vw, 4.5rem)', textTransform: 'uppercase', lineHeight: 0.95, letterSpacing: '-0.02em', marginBottom: '1rem' }}>
            {shop.name}
          </h1>
          {shop.address && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', marginBottom: shop.bookingUrl ? 0 : 0 }}>
              <MapPin size={14} />
              <span style={{ fontFamily: 'var(--font-inter, sans-serif)' }}>{shop.address}</span>
            </div>
          )}
          {shop.bookingUrl && (
            <a
              href={shop.bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                marginTop: '1.5rem',
                background: '#C8F135', color: '#0A0A0A',
                padding: '0.75rem 1.5rem', borderRadius: 4,
                fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 700,
                fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em',
                textDecoration: 'none',
              }}
            >
              Book now <ExternalLink size={14} />
            </a>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '3rem 1.5rem' }}>

        {/* About */}
        {shop.about && (
          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 800, fontSize: '1.5rem', textTransform: 'uppercase', letterSpacing: '0.02em', marginBottom: '1rem', color: 'white' }}>
              About us
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.65)', lineHeight: 1.8, fontFamily: 'var(--font-inter, sans-serif)', fontSize: '1rem' }}>{shop.about}</p>
          </section>
        )}

        {/* Services */}
        {shop.services.length > 0 && (
          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 800, fontSize: '1.5rem', textTransform: 'uppercase', letterSpacing: '0.02em', marginBottom: '1rem' }}>
              Services
            </h2>
            <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, overflow: 'hidden' }}>
              {shop.services.map((s, i) => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1.25rem', borderBottom: i < shop.services.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                  <div>
                    <span style={{ color: 'white', fontWeight: 600, fontFamily: 'var(--font-inter, sans-serif)', fontSize: '0.95rem' }}>{s.name}</span>
                    {s.duration && <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem', marginLeft: 8, fontFamily: 'var(--font-inter, sans-serif)' }}>{s.duration} min</span>}
                    {s.description && <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', marginTop: 2, fontFamily: 'var(--font-inter, sans-serif)' }}>{s.description}</p>}
                  </div>
                  {s.price && <span style={{ color: '#C8F135', fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 700, fontSize: '1rem' }}>{s.price}</span>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Opening hours + contact */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
          {hours && (
            <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '1.25rem' }}>
              <h3 style={{ fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 800, fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.875rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clock size={14} style={{ color: '#C8F135' }} /> Opening hours
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {DAY_NAMES.map(([dayLabel, key]) => {
                  const d = hours[key];
                  return (
                    <div key={key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontFamily: 'var(--font-inter, sans-serif)' }}>
                      <span style={{ color: 'rgba(255,255,255,0.5)' }}>{dayLabel}</span>
                      <span style={{ color: d.closed ? 'rgba(255,255,255,0.25)' : 'white' }}>
                        {d.closed ? 'Closed' : `${fmt(d.open)} – ${fmt(d.close)}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {(shop.phone || shop.address || shop.googleMapsUrl) && (
            <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '1.25rem' }}>
              <h3 style={{ fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 800, fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.875rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Phone size={14} style={{ color: '#C8F135' }} /> Contact
              </h3>
              {shop.phone && (
                <a href={`tel:${shop.phone}`} style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'white', textDecoration: 'none', fontSize: '0.95rem', fontFamily: 'var(--font-inter, sans-serif)', marginBottom: '0.75rem' }}>
                  <Phone size={13} style={{ color: 'rgba(255,255,255,0.35)' }} /> {shop.phone}
                </a>
              )}
              {shop.address && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, color: 'rgba(255,255,255,0.55)', fontSize: '0.875rem', fontFamily: 'var(--font-inter, sans-serif)', marginBottom: shop.googleMapsUrl ? '0.875rem' : 0 }}>
                  <MapPin size={13} style={{ marginTop: 2, flexShrink: 0, color: 'rgba(255,255,255,0.35)' }} /> {shop.address}
                </div>
              )}
              {shop.googleMapsUrl && (
                <a href={shop.googleMapsUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#C8F135', fontSize: '0.8rem', fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', textDecoration: 'none' }}>
                  Get directions <ExternalLink size={12} />
                </a>
              )}
            </div>
          )}
        </section>

        {/* Gallery */}
        {shop.photos.length > 0 && (
          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 800, fontSize: '1.5rem', textTransform: 'uppercase', letterSpacing: '0.02em', marginBottom: '1rem' }}>
              Gallery
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8 }}>
              {shop.photos.map(p => (
                <div key={p.id} style={{ aspectRatio: '1', borderRadius: 6, overflow: 'hidden', background: '#111' }}>
                  <img src={p.url} alt={p.caption ?? ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Team */}
        {shop.barbers.length > 0 && (
          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 800, fontSize: '1.5rem', textTransform: 'uppercase', letterSpacing: '0.02em', marginBottom: '1rem' }}>
              The team
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
              {shop.barbers.map(b => (
                <div key={b.id} style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '1.25rem', textAlign: 'center' }}>
                  {b.photoUrl ? (
                    <img src={b.photoUrl} alt={b.name} style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', margin: '0 auto 0.75rem' }} />
                  ) : (
                    <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(200,241,53,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
                      <span style={{ color: '#C8F135', fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 900, fontSize: '1.25rem' }}>
                        {b.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div style={{ fontWeight: 700, fontSize: '1rem', fontFamily: 'var(--font-barlow, sans-serif)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>{b.name}</div>
                  {b.role === 'owner' && <div style={{ color: '#C8F135', fontSize: '0.7rem', fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Owner</div>}
                  {b.bio && <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.8rem', lineHeight: 1.5, fontFamily: 'var(--font-inter, sans-serif)' }}>{b.bio}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Footer */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1.5rem', textAlign: 'center' }}>
          <Link href="/customer/login" style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.75rem', fontFamily: 'var(--font-inter, sans-serif)', textDecoration: 'none' }}>
            View your cut history
          </Link>
          <span style={{ color: 'rgba(255,255,255,0.1)', margin: '0 0.75rem' }}>·</span>
          <Link href="/" style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.75rem', fontFamily: 'var(--font-inter, sans-serif)', textDecoration: 'none' }}>
            Powered by YourBarber
          </Link>
        </div>
      </div>
    </div>
  );
}
