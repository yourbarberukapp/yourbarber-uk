import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import { STYLE_DEFAULTS } from '../src/lib/styleDefaults';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  // Clean start
  await prisma.smsLog.deleteMany({});
  await prisma.visitPhoto.deleteMany({});
  await prisma.visit.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.barber.deleteMany({});
  await prisma.shopStyle.deleteMany({});
  await prisma.shop.deleteMany({});

  const shop = await prisma.shop.create({
    data: {
      name: 'Ben J Barbers',
      slug: 'benj-barbers',
      address: '78A High Street, Poole, BH15 1DB',
      shopType: 'uk_general',
    },
  });

  const ownerHash = await bcrypt.hash('owner123', 12);
  const barberHash = await bcrypt.hash('barber123', 12);

  const owner = await prisma.barber.create({
    data: {
      shopId: shop.id,
      name: 'Ben',
      email: 'owner@benjbarbers.com',
      passwordHash: ownerHash,
      role: 'owner',
    },
  });

  const barber = await prisma.barber.create({
    data: {
      shopId: shop.id,
      name: 'Jake',
      email: 'jake@benjbarbers.com',
      passwordHash: barberHash,
      role: 'barber',
    },
  });

  const customer = await prisma.customer.create({
    data: {
      shopId: shop.id,
      phone: '07700900001',
      name: 'Test Customer',
      accessCode: 'TEST1',
      smsOptIn: 'yes',
      lastVisitAt: new Date(Date.now() - 44 * 24 * 60 * 60 * 1000),
    },
  });

  // Microsite data
  await prisma.shop.update({
    where: { id: shop.id },
    data: {
      phone: '01202 661075',
      about: "Ben J Barbers is Poole's go-to barbershop for precision fades, classic cuts, and top-tier grooming. Walk-ins welcome, appointments preferred.",
      googleMapsUrl: 'https://maps.google.com/?q=78A+High+Street+Poole+BH15+1DB',
      openingHours: {
        mon: { open: '09:30', close: '18:00', closed: false },
        tue: { open: '09:30', close: '18:00', closed: false },
        wed: { open: '09:30', close: '18:00', closed: false },
        thu: { open: '09:30', close: '18:00', closed: false },
        fri: { open: '09:30', close: '18:00', closed: false },
        sat: { open: '09:00', close: '18:00', closed: false },
        sun: { open: '10:00', close: '16:00', closed: false },
      },
    },
  });

  await prisma.shopService.createMany({
    data: [
      { shopId: shop.id, name: 'Skin Fade', price: '15.00', duration: 30, sortOrder: 0 },
      { shopId: shop.id, name: 'Taper Fade', price: '15.00', duration: 30, sortOrder: 1 },
      { shopId: shop.id, name: 'Scissor Cut', price: '12.00', duration: 25, sortOrder: 2 },
      { shopId: shop.id, name: 'Beard Trim', price: '8.00', duration: 15, sortOrder: 3 },
      { shopId: shop.id, name: 'Hot Towel Shave', price: '18.00', duration: 40, sortOrder: 4 },
      { shopId: shop.id, name: 'Cut & Beard', price: '20.00', duration: 45, sortOrder: 5 },
    ],
  });

  await prisma.barber.update({
    where: { id: owner.id },
    data: { bio: 'Owner and head barber. 10+ years experience, specialising in fades and classic cuts.' },
  });

  await prisma.barber.update({
    where: { id: barber.id },
    data: { bio: 'Specialist in textured cuts, undercuts, and beard sculpting.' },
  });

  // Seed UK General styles
  const ukStyles = STYLE_DEFAULTS['uk_general'];
  await prisma.shopStyle.createMany({
    data: ukStyles.map(s => ({ shopId: shop.id, ...s, active: true })),
  });

  console.log(`Seeded: shop=${shop.slug}, owner=${owner.email}, barber=${barber.email}, customer=${customer.phone}, styles=${ukStyles.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
