import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const shop = await prisma.shop.create({
    data: {
      name: "Benjie's Barbershop",
      slug: 'benjies',
      address: '123 High Street, London',
    },
  });

  const ownerHash = await bcrypt.hash('owner123', 12);
  const barberHash = await bcrypt.hash('barber123', 12);

  const owner = await prisma.barber.create({
    data: {
      shopId: shop.id,
      name: 'Benjie Owner',
      email: 'owner@benjies.com',
      passwordHash: ownerHash,
      role: 'owner',
    },
  });

  const barber = await prisma.barber.create({
    data: {
      shopId: shop.id,
      name: 'Jake Barber',
      email: 'jake@benjies.com',
      passwordHash: barberHash,
      role: 'barber',
    },
  });

  const customer = await prisma.customer.create({
    data: {
      shopId: shop.id,
      phone: '07700900001',
      name: 'Test Customer',
      smsOptIn: 'yes',
      lastVisitAt: new Date(Date.now() - 44 * 24 * 60 * 60 * 1000),
    },
  });

  console.log(`Seeded: shop=${shop.slug}, owner=${owner.email}, barber=${barber.email}, customer=${customer.phone}`);
}

main().finally(() => prisma.$disconnect());
