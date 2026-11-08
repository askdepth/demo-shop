// lib/ensure-demo-db.ts
import prisma from './prisma';
import { hash } from 'bcryptjs';
import { UserRole } from '@prisma/client';
import { HERO_PERSONAS, DEMO_DEFAULT_PASSWORD } from './demo-personas';

let migrationPromise: Promise<void> | null = null;

export async function ensureDemoDbSchema(): Promise<void> {
  if (migrationPromise) {
    return migrationPromise;
  }
  migrationPromise = (async () => {
    try {
      // 1. Ensure columns from migration 2 (cohorts) exist on `users` table
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "users"
          ADD COLUMN IF NOT EXISTS "country" TEXT NOT NULL DEFAULT 'US',
          ADD COLUMN IF NOT EXISTS "device_type" TEXT NOT NULL DEFAULT 'desktop',
          ADD COLUMN IF NOT EXISTS "has_abandoned_cart" BOOLEAN NOT NULL DEFAULT false,
          ADD COLUMN IF NOT EXISTS "internal_notes" TEXT,
          ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN NOT NULL DEFAULT true,
          ADD COLUMN IF NOT EXISTS "loyalty_tier" TEXT NOT NULL DEFAULT 'standard',
          ADD COLUMN IF NOT EXISTS "marketing_opt_in" BOOLEAN NOT NULL DEFAULT true,
          ADD COLUMN IF NOT EXISTS "preferred_category" TEXT NOT NULL DEFAULT 'electronics',
          ADD COLUMN IF NOT EXISTS "segment" TEXT NOT NULL DEFAULT 'new_customer';
      `);

      // 2. Ensure columns from migration 1 (reviews & products) exist on `products` table
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "products"
          ADD COLUMN IF NOT EXISTS "avgRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
          ADD COLUMN IF NOT EXISTS "brand" TEXT,
          ADD COLUMN IF NOT EXISTS "bullets" TEXT[] DEFAULT ARRAY[]::TEXT[],
          ADD COLUMN IF NOT EXISTS "reviewCount" INTEGER NOT NULL DEFAULT 0,
          ADD COLUMN IF NOT EXISTS "soldCount" INTEGER NOT NULL DEFAULT 0,
          ADD COLUMN IF NOT EXISTS "specs" JSONB;
      `);

      // 3. Ensure the 5 hero personas exist in the DB with password `customer123`
      const passwordHash = await hash(DEMO_DEFAULT_PASSWORD, 10);
      for (const persona of HERO_PERSONAS) {
        await prisma.user.upsert({
          where: { email: persona.defaultEmail },
          update: {
            id: persona.id,
            name: persona.name,
            password: passwordHash,
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
          create: {
            id: persona.id,
            email: persona.defaultEmail,
            name: persona.name,
            password: passwordHash,
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
    } catch (err) {
      console.error('[ensureDemoDbSchema] Error ensuring database schema:', err);
      migrationPromise = null;
      throw err;
    }
  })();

  return migrationPromise;
}
