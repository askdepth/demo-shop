// Location: prisma/admins.ts

import { PrismaClient, UserRole } from '@prisma/client';
import { hash } from 'bcryptjs';

export function getAdminEmails(): string[] {
  const emails = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);
  if (emails.length === 0) {
    throw new Error('ADMIN_EMAILS is not set (comma-separated, add it to .env)');
  }
  return emails;
}

/** Creates/updates admin users from ADMIN_EMAILS and ADMIN_PASSWORD (.env). */
export async function ensureAdmins(prisma: PrismaClient) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    throw new Error('ADMIN_PASSWORD is not set (add it to .env)');
  }
  const hashed = await hash(password, 12);

  for (const email of getAdminEmails()) {
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
