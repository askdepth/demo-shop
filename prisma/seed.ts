// Location: prisma/seed.ts

import { PrismaClient } from '@prisma/client';
import { ensureAdmins } from './admins';
import { DEMO_CUSTOMER, seedDemoData } from './seed-lib';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  await ensureAdmins(prisma);
  await seedDemoData(prisma);

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
