// Location: prisma/seed.ts
import { Prisma, PrismaClient, UserRole } from '@prisma/client';
import { hash } from 'bcryptjs';
import { ensureAdmins } from './admins';
import { DEMO_CUSTOMER, seedDemoData } from './seed-lib';
import {
  DEMO_DEFAULT_PASSWORD,
  HERO_PERSONAS,
  resolveHeroEmail,
} from '../lib/demo-personas';

const prisma = new PrismaClient();

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function next(): number {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FIRST_NAMES = [
  'james', 'mary', 'john', 'patricia', 'robert', 'jennifer', 'michael', 'linda',
  'william', 'elizabeth', 'david', 'barbara', 'richard', 'susan', 'joseph', 'jessica',
  'thomas', 'sarah', 'charles', 'karen', 'christopher', 'nancy', 'daniel', 'lisa',
  'matthew', 'betty', 'anthony', 'margaret', 'mark', 'sandra', 'donald', 'ashley',
  'steven', 'kimberly', 'paul', 'emily', 'andrew', 'donna', 'joshua', 'michelle',
  'kenneth', 'carol', 'kevin', 'amanda', 'brian', 'dorothy', 'george', 'melissa',
  'edward', 'deborah', 'ronald', 'stephanie', 'timothy', 'rebecca', 'jason', 'sharon',
  'jeffrey', 'laura', 'ryan', 'cynthia', 'jacob', 'kathleen', 'gary', 'amy',
];

const LAST_NAMES = [
  'smith', 'johnson', 'williams', 'brown', 'jones', 'garcia', 'miller', 'davis',
  'rodriguez', 'martinez', 'hernandez', 'lopez', 'gonzalez', 'wilson', 'anderson',
  'thomas', 'taylor', 'moore', 'jackson', 'martin', 'lee', 'perez', 'thompson',
  'white', 'harris', 'sanchez', 'clark', 'ramirez', 'lewis', 'robinson', 'walker',
  'young', 'allen', 'king', 'wright', 'scott', 'torres', 'nguyen', 'hill',
  'flores', 'green', 'adams', 'nelson', 'baker', 'hall', 'rivera', 'campbell',
  'mitchell', 'carter', 'roberts', 'gomez', 'phillips', 'evans', 'turner', 'diaz',
];

const SEGMENTS = [
  'vip',
  'repeat_buyer',
  'cart_abandoner',
  'new_customer',
  'at_risk',
  'window_shopper',
] as const;

const CATEGORIES = ['electronics', 'clothing', 'home-garden'] as const;
const COUNTRIES = ['US', 'DE', 'GB', 'PL', 'CA', 'FR'] as const;

async function seedAskdepthCohorts() {
  console.log('👥 Seeding AskDepth Hero Personas and Synthetic Cohorts...');

  const inboxBase = process.env.DEMO_INBOX_EMAIL?.trim() || null;
  const customerPasswordHash = await hash(DEMO_DEFAULT_PASSWORD, 10);

  // 1. Seed the 5 Hero Personas
  for (const persona of HERO_PERSONAS) {
    const finalEmail = resolveHeroEmail(persona, inboxBase);
    await prisma.user.upsert({
      where: { id: persona.id },
      update: {
        email: finalEmail,
        name: persona.name,
        role: UserRole.USER,
        segment: persona.segment,
        loyaltyTier: persona.loyaltyTier,
        preferredCategory: persona.preferredCategory,
        deviceType: persona.deviceType,
        hasAbandonedCart: persona.hasAbandonedCart,
        country: persona.country,
        marketingOptIn: persona.marketingOptIn,
        isActive: true,
      },
      create: {
        id: persona.id,
        email: finalEmail,
        name: persona.name,
        password: customerPasswordHash,
        role: UserRole.USER,
        segment: persona.segment,
        loyaltyTier: persona.loyaltyTier,
        preferredCategory: persona.preferredCategory,
        deviceType: persona.deviceType,
        hasAbandonedCart: persona.hasAbandonedCart,
        country: persona.country,
        marketingOptIn: persona.marketingOptIn,
        isActive: true,
        internalNotes: `HERO:${persona.aliasKey.toUpperCase()}`,
      },
    });
  }

  // 2. Deterministic Synthetic Cohort (900 users, 150 per segment)
  const rng = mulberry32(42);
  const nowMs = Date.now();
  const startMs = nowMs - 540 * 86400_000; // 18 months ago
  const totalSynthetic = 900;

  await prisma.user.deleteMany({
    where: { id: { startsWith: 'cust_syn_' } },
  });

  const syntheticRows: Prisma.UserCreateManyInput[] = [];
  for (let i = 0; i < totalSynthetic; i++) {
    const idxStr = String(i + 1).padStart(4, '0');
    const id = `cust_syn_${idxStr}`;
    const segment = SEGMENTS[i % SEGMENTS.length]!;
    const first = FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)]!;
    const last = LAST_NAMES[Math.floor(rng() * LAST_NAMES.length)]!;
    const displayFirst = first.charAt(0).toUpperCase() + first.slice(1);
    const displayLast = last.charAt(0).toUpperCase() + last.slice(1);

    const progress = (i + rng() * 0.85) / totalSynthetic;
    const signupAt = new Date(Math.floor(startMs + progress * (nowMs - startMs)));

    const loyaltyTier =
      segment === 'vip'
        ? rng() < 0.65
          ? 'platinum'
          : 'gold'
        : segment === 'repeat_buyer'
          ? rng() < 0.55
            ? 'gold'
            : 'silver'
          : segment === 'cart_abandoner'
            ? rng() < 0.4
              ? 'gold'
              : 'silver'
            : 'standard';

    const preferredCategory = CATEGORIES[Math.floor(rng() * CATEGORIES.length)]!;
    const deviceType =
      rng() < 0.52 ? 'mobile' : rng() < 0.88 ? 'desktop' : 'tablet';
    const country = COUNTRIES[Math.floor(rng() * COUNTRIES.length)]!;
    const hasAbandonedCart =
      segment === 'cart_abandoner' ? true : rng() < 0.18;
    const isActive = segment === 'at_risk' ? rng() < 0.65 : rng() < 0.92;
    const marketingOptIn = rng() < 0.88;

    syntheticRows.push({
      id,
      email: `${first.toLowerCase()}.${last}.${idxStr}@example.com`,
      name: `${displayFirst} ${displayLast}`,
      role: UserRole.USER,
      password: customerPasswordHash,
      segment,
      isActive,
      marketingOptIn,
      loyaltyTier,
      preferredCategory,
      deviceType,
      hasAbandonedCart,
      country,
      internalNotes: `CRM-TIER:${loyaltyTier.toUpperCase()}|SYN:${idxStr}`,
      createdAt: signupAt,
    });
  }

  await prisma.user.createMany({
    data: syntheticRows,
    skipDuplicates: true,
  });

  console.log(`✅ Seeded 5 Hero Personas and ${totalSynthetic} synthetic customer profiles for AskDepth Audience Connector.`);
}

async function main() {
  console.log('🌱 Starting database seed...');

  await ensureAdmins(prisma);
  await seedDemoData(prisma);
  await seedAskdepthCohorts();

  console.log('✅ Database seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`👤 Users: ${await prisma.user.count()}`);
  console.log(`📂 Categories: ${await prisma.category.count()}`);
  console.log(`📦 Products: ${await prisma.product.count()}`);
  console.log(`⭐ Reviews: ${await prisma.review.count()}`);
  console.log(`📋 Orders: ${await prisma.order.count()}`);
  console.log(`\n🔐 Demo customer: ${DEMO_CUSTOMER.email} / ${DEMO_CUSTOMER.password}`);
  console.log('🔐 Admin users created from ADMIN_EMAILS / ADMIN_PASSWORD');
}

main()
  .catch(e => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
