// Location: prisma/seed-admins.ts
// Run: npm run db:seed:admins  (only creates/updates admin users, safe to re-run)

import { PrismaClient } from '@prisma/client';
import { ensureAdmins } from './admins';

const prisma = new PrismaClient();

ensureAdmins(prisma)
  .catch(e => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
