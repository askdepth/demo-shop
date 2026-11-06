// server/actions/demo.ts
'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/roles';
import { revalidateProducts, revalidateOrders, revalidateCategories } from '@/lib/cache';
import { seedDemoData } from '../../prisma/seed-lib';

/** Wipes catalog, carts, orders and reviews and re-creates the deterministic demo data set. */
export async function resetDemoData() {
  await requireAdmin();
  try {
    const result = await seedDemoData(prisma, () => {});
    revalidateProducts();
    revalidateOrders();
    revalidateCategories();
    revalidatePath('/', 'layout');
    return { success: true as const, ...result };
  } catch (error) {
    console.error('Reset demo data failed:', error);
    return { success: false as const, error: 'Reset failed. Check the server logs.' };
  }
}
