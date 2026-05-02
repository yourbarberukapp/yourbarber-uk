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

function daysAgo(n: number) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

const CLIENTS: Array<{
  name: string;
  phone: string;
  smsOptIn: 'yes' | 'no' | 'not_asked';
  visits: Array<{
    daysAgo: number;
    barberKey: 'james' | 'kieran' | 'matthew';
    cutDetails: object;
    recommendation: string;
    notes?: string;
    privateNotes?: string;
  }>;
}> = [
  {
    name: 'Marcus Thompson',
    phone: '07700900001',
    smsOptIn: 'yes',
    visits: [
      {
        daysAgo: 12,
        barberKey: 'james',
        cutDetails: { style: ['High Fade'], sidesGrade: '0.5', topLength: 'Textured', beard: 'Blend' },
        recommendation: 'Back in 3 weeks',
        notes: 'Wants the fade tighter each time',
        privateNotes: 'Tip every time — always asks about the football',
      },
      {
        daysAgo: 38,
        barberKey: 'james',
        cutDetails: { style: ['High Fade'], sidesGrade: '1', topLength: 'Textured', beard: 'Blend' },
        recommendation: 'Back in 4 weeks',
      },
      {
        daysAgo: 70,
        barberKey: 'kieran',
        cutDetails: { style: ['Mid Fade'], sidesGrade: '1', topLength: 'Scissor Finish', beard: 'Not done' },
        recommendation: 'Back in 4 weeks',
      },
    ],
  },
  {
    name: 'Jordan Williams',
    phone: '07700900002',
    smsOptIn: 'yes',
    visits: [
      {
        daysAgo: 29,
        barberKey: 'kieran',
        cutDetails: { style: ['Mid Fade'], sidesGrade: '1.5', topLength: 'Crop', beard: 'Line Up' },
        recommendation: 'Back in 4 weeks',
        notes: 'Prefers the parting on the left',
        privateNotes: 'Just started a new job — check in on it next time',
      },
      {
        daysAgo: 62,
        barberKey: 'kieran',
        cutDetails: { style: ['Mid Fade'], sidesGrade: '2', topLength: 'Crop', beard: 'Not done' },
        recommendation: 'Back in 4 weeks',
      },
    ],
  },
  {
    name: 'Tyrone Davis',
    phone: '07700900003',
    smsOptIn: 'yes',
    visits: [
      {
        daysAgo: 8,
        barberKey: 'james',
        cutDetails: { style: ['Skin Fade'], sidesGrade: '0', topLength: 'Textured', beard: 'Full Tidy' },
        recommendation: 'Back in 3 weeks',
        notes: 'Zero on the sides, blended very gradual. Likes the skin to show right up to the temple',
        privateNotes: "New baby — he's exhausted, keep it quick",
      },
      {
        daysAgo: 35,
        barberKey: 'matthew',
        cutDetails: { style: ['Skin Fade'], sidesGrade: '0', topLength: 'Textured', beard: 'Full Tidy' },
        recommendation: 'Back in 3 weeks',
      },
    ],
  },
  {
    name: 'Kyle Bennett',
    phone: '07700900004',
    smsOptIn: 'not_asked',
    visits: [
      {
        daysAgo: 45,
        barberKey: 'matthew',
        cutDetails: { style: ['Taper'], sidesGrade: '2', topLength: 'Scissor Finish', beard: 'Not done' },
        recommendation: 'Back in 5 weeks',
        notes: 'Classic taper, nothing too tight — works in finance',
      },
    ],
  },
  {
    name: 'Jamie Clarke',
    phone: '07700900005',
    smsOptIn: 'yes',
    visits: [
      {
        daysAgo: 21,
        barberKey: 'kieran',
        cutDetails: { style: ['Low Fade'], sidesGrade: '2', topLength: 'Quiff', beard: 'Line Up' },
        recommendation: 'Back in 4 weeks',
        notes: 'Quiff styled forward. Uses clay — bring own product',
        privateNotes: 'Getting married in August — will want a sharper look coming up',
      },
      {
        daysAgo: 52,
        barberKey: 'kieran',
        cutDetails: { style: ['Low Fade'], sidesGrade: '2', topLength: 'Quiff', beard: 'Blend' },
        recommendation: 'Back in 4 weeks',
      },
      {
        daysAgo: 84,
        barberKey: 'james',
        cutDetails: { style: ['Mid Fade'], sidesGrade: '1.5', topLength: 'Textured', beard: 'Not done' },
        recommendation: 'Back in 4 weeks',
      },
    ],
  },
  {
    name: 'Aaron Mitchell',
    phone: '07700900006',
    smsOptIn: 'yes',
    visits: [
      {
        daysAgo: 18,
        barberKey: 'james',
        cutDetails: { style: ['High Fade'], sidesGrade: '1', topLength: 'Textured', beard: 'Blend' },
        recommendation: 'Back in 3 weeks',
        notes: 'Skin behind ears, blend into 1 guard quickly',
      },
      {
        daysAgo: 44,
        barberKey: 'james',
        cutDetails: { style: ['High Fade'], sidesGrade: '1', topLength: 'Textured', beard: 'Blend' },
        recommendation: 'Back in 3 weeks',
      },
    ],
  },
  {
    name: 'Liam Peters',
    phone: '07700900007',
    smsOptIn: 'no',
    visits: [
      {
        daysAgo: 33,
        barberKey: 'matthew',
        cutDetails: { style: ['Classic Cut'], sidesGrade: '3', topLength: 'Scissor Finish', beard: 'Not done' },
        recommendation: 'Back in 5 weeks',
        notes: 'Short back and sides, nothing too trendy — been coming here 3 years',
        privateNotes: 'Dislikes any product in hair — do not offer',
      },
      {
        daysAgo: 70,
        barberKey: 'matthew',
        cutDetails: { style: ['Classic Cut'], sidesGrade: '3', topLength: 'Scissor Finish', beard: 'Not done' },
        recommendation: 'Back in 5 weeks',
      },
    ],
  },
  {
    name: 'Deon Edwards',
    phone: '07700900008',
    smsOptIn: 'yes',
    visits: [
      {
        daysAgo: 55,
        barberKey: 'kieran',
        cutDetails: { style: ['Skin Fade', 'High Fade'], sidesGrade: '0', topLength: 'Crop', beard: 'Full Tidy' },
        recommendation: 'Back in 3 weeks',
        notes: 'Very high skin fade — almost surgical. Blunt crop on top',
        privateNotes: 'Trains at the gym — always mentions it. Call the cut "sharp" not "tidy"',
      },
    ],
  },
  {
    name: 'Connor Walsh',
    phone: '07700900009',
    smsOptIn: 'not_asked',
    visits: [
      {
        daysAgo: 27,
        barberKey: 'james',
        cutDetails: { style: ['Taper'], sidesGrade: '2', topLength: 'Textured', beard: 'Not done' },
        recommendation: 'Back in 4 weeks',
        notes: 'Taper not fade — hair is fine, goes see-through if cut too tight',
      },
      {
        daysAgo: 60,
        barberKey: 'james',
        cutDetails: { style: ['Taper'], sidesGrade: '3', topLength: 'Scissor Finish', beard: 'Not done' },
        recommendation: 'Back in 5 weeks',
      },
    ],
  },
  {
    name: 'Reece Foster',
    phone: '07700900010',
    smsOptIn: 'yes',
    visits: [
      {
        daysAgo: 14,
        barberKey: 'matthew',
        cutDetails: { style: ['Mid Fade'], sidesGrade: '1', topLength: 'Textured', beard: 'Line Up' },
        recommendation: 'Back in 4 weeks',
        notes: 'Neat line up — uses a beard pen. Fine with clippers on beard',
        privateNotes: 'Apprentice plumber — always in a rush, gets in and out fast. Appreciates no small talk',
      },
      {
        daysAgo: 46,
        barberKey: 'matthew',
        cutDetails: { style: ['Mid Fade'], sidesGrade: '1.5', topLength: 'Textured', beard: 'Line Up' },
        recommendation: 'Back in 4 weeks',
      },
      {
        daysAgo: 80,
        barberKey: 'kieran',
        cutDetails: { style: ['Mid Fade'], sidesGrade: '2', topLength: 'Crop', beard: 'Not done' },
        recommendation: 'Back in 5 weeks',
      },
    ],
  },
];

async function main() {
  console.log('Seeding demo shop...');

  // ── Clean all shop data ──
  await prisma.smsLog.deleteMany({});
  await prisma.visitPhoto.deleteMany({});
  await prisma.visit.deleteMany({});
  await prisma.walkIn.deleteMany({});
  await prisma.checkIn.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.appointment.deleteMany({});
  await prisma.feedback.deleteMany({});
  await prisma.barber.deleteMany({});
  await prisma.shopStyle.deleteMany({});
  await prisma.shopService.deleteMany({});
  await prisma.shopPhoto.deleteMany({});
  await prisma.shop.deleteMany({});

  // ── Shop ──
  const shop = await prisma.shop.create({
    data: {
      name: 'The Barber Room',
      slug: 'the-barber-room',
      address: '14 Market Street, Southampton, SO14 1AB',
      phone: '023 8099 1234',
      shopType: 'uk_general',
      defaultCutTime: 25,
      about: 'The Barber Room is your local destination for precision fades, classic cuts, and top-tier grooming. Walk-ins always welcome.',
      googleMapsUrl: 'https://maps.google.com/?q=14+Market+Street+Southampton+SO14+1AB',
      googleReviewUrl: 'https://g.page/r/thebarbershop/review',
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

  // ── Barbers ──
  const ownerHash = await bcrypt.hash('owner123', 12);
  const barberHash = await bcrypt.hash('barber123', 12);

  const [ben, james, kieran, matthew] = await Promise.all([
    prisma.barber.create({
      data: {
        shopId: shop.id,
        name: 'Ben',
        email: 'ben@thebarbershop.com',
        passwordHash: ownerHash,
        role: 'owner',
        bio: 'Owner and head barber. 12 years experience, specialising in skin fades and classic cuts.',
      },
    }),
    prisma.barber.create({
      data: {
        shopId: shop.id,
        name: 'James',
        email: 'james@thebarbershop.com',
        passwordHash: barberHash,
        role: 'barber',
        bio: 'Specialist in high fades and textured styling.',
      },
    }),
    prisma.barber.create({
      data: {
        shopId: shop.id,
        name: 'Kieran',
        email: 'kieran@thebarbershop.com',
        passwordHash: barberHash,
        role: 'barber',
        bio: 'Known for clean low fades and beard work.',
      },
    }),
    prisma.barber.create({
      data: {
        shopId: shop.id,
        name: 'Matthew',
        email: 'matthew@thebarbershop.com',
        passwordHash: barberHash,
        role: 'barber',
        bio: 'Classic cuts and tapers, 6 years in the trade.',
      },
    }),
  ]);

  const barberMap = { james: james.id, kieran: kieran.id, matthew: matthew.id, ben: ben.id };

  // ── Services ──
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

  // ── Styles ──
  const ukStyles = STYLE_DEFAULTS['uk_general'];
  await prisma.shopStyle.createMany({
    data: ukStyles.map(s => ({ shopId: shop.id, ...s, active: true })),
  });

  // ── Clients + Visits ──
  for (const c of CLIENTS) {
    const lastVisitDaysAgo = Math.min(...c.visits.map(v => v.daysAgo));
    const customer = await prisma.customer.create({
      data: {
        shopId: shop.id,
        phone: c.phone,
        name: c.name,
        smsOptIn: c.smsOptIn,
        lastVisitAt: daysAgo(lastVisitDaysAgo),
        accessCode: c.phone.slice(-5),
      },
    });

    for (const v of c.visits) {
      await prisma.visit.create({
        data: {
          shopId: shop.id,
          customerId: customer.id,
          barberId: barberMap[v.barberKey],
          visitedAt: daysAgo(v.daysAgo),
          cutDetails: v.cutDetails,
          recommendation: v.recommendation,
          notes: v.notes ?? null,
          privateNotes: v.privateNotes ?? null,
        },
      });
    }
  }

  console.log('');
  console.log('✅ Demo shop seeded.');
  console.log('');
  console.log('  Shop:    The Barber Room (the-barber-room)');
  console.log('  Clients:', CLIENTS.length);
  console.log('  Visits: ', CLIENTS.reduce((n, c) => n + c.visits.length, 0));
  console.log('');
  console.log('  Logins:');
  console.log('  ben@thebarbershop.com     / owner123  → owner dashboard');
  console.log('  james@thebarbershop.com   / barber123 → barber mode');
  console.log('  kieran@thebarbershop.com  / barber123 → barber mode');
  console.log('  matthew@thebarbershop.com / barber123 → barber mode');
  console.log('');
  console.log('  Demo URLs:');
  console.log('  /arrive/the-barber-room → customer queue join');
  console.log('  /demo/barber            → leave-behind demo');
  console.log('  /window/the-barber-room → shop window signage');
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
