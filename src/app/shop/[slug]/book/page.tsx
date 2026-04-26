import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import BookingClient from './BookingClient';
import { getCustomerSession } from '@/lib/customerAuth';

export default async function BookingPage({ params }: { params: { slug: string } }) {
  const shop = await db.shop.findUnique({
    where: { slug: params.slug },
    include: {
      services: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
      barbers: { where: { isActive: true, acceptsBookings: true } },
    },
  });

  if (!shop) notFound();

  const session = await getCustomerSession();
  const customer = session ? await db.customer.findUnique({ where: { id: session.customerId } }) : null;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <header className="mb-10 text-center">
          <h1 className="font-barlow font-black text-4xl uppercase tracking-tight mb-2">
            Book <span className="text-[#C8F135]">Appointment</span>
          </h1>
          <p className="text-white/50 font-inter">{shop.name}</p>
        </header>

        <BookingClient 
          shop={shop} 
          services={shop.services} 
          barbers={shop.barbers} 
          initialCustomer={customer}
        />
      </div>
    </div>
  );
}
