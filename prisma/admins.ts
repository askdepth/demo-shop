// Location: prisma/admins.ts

import { PrismaClient, UserRole } from '@prisma/client';
import { hash } from 'bcryptjs';

export const ADMIN_EMAILS = ['alex@askdepth.com', 'artem@askdepth.com'];

/** Creates/updates admin users. Password comes from ADMIN_PASSWORD (.env). */
export async function ensureAdmins(prisma: PrismaClient) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    throw new Error('ADMIN_PASSWORD is not set (add it to .env)');
  }
  const hashed = await hash(password, 12);

  for (const email of ADMIN_EMAILS) {
    const admin = await prisma.user.upsert({
      where: { email },
      update: { password: hashed, role: UserRole.ADMIN },
      create: {
        email,
        name: email.split('@')[0],
        role: UserRole.ADMIN,
        password: hashed,
      },
    });
    console.log(`👤 Admin ready: ${admin.email}`);
  }
}
