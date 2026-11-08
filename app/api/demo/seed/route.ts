import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ensureDemoDbSchema } from '@/lib/ensure-demo-db';
import { seedDemoData } from '@/prisma/seed-lib';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    await ensureDemoDbSchema();
    const logMessages: string[] = [];
    await seedDemoData(prisma, m => logMessages.push(m));
    return NextResponse.json({
      success: true,
      message: 'Database schema and demo catalog re-seeded successfully.',
      logs: logMessages,
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return POST();
}
