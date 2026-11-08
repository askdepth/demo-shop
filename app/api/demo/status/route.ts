import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { HERO_PERSONAS } from '@/lib/demo-personas';
import {
  normalizeEnvironment,
  normalizeTelemetryEndpoint,
} from '@/lib/askdepth-config';

export const dynamic = 'force-dynamic';

export async function GET() {
  const writeKey = (process.env.NEXT_PUBLIC_ASKDEPTH_WRITE_KEY ?? '').trim();
  const telemetryEndpoint = normalizeTelemetryEndpoint(
    process.env.NEXT_PUBLIC_ASKDEPTH_ENDPOINT || process.env.ASKDEPTH_INGEST_URL
  );
  const buildId =
    process.env.NEXT_PUBLIC_ASKDEPTH_BUILD_ID ||
    process.env.ASKDEPTH_BUILD_ID ||
    'demo-shop-v1';
  const environment = normalizeEnvironment(
    process.env.NEXT_PUBLIC_ASKDEPTH_ENVIRONMENT
  );

  // Resolve actual seeded emails for the 5 hero personas (supports DEMO_INBOX_EMAIL +tag aliases)
  let dbUsersById = new Map<string, { email: string; name: string | null }>();
  let dbError: string | null = null;
  try {
    const rows = await prisma.user.findMany({
      where: {
        id: { in: HERO_PERSONAS.map(p => p.id) },
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });
    dbUsersById = new Map(rows.map(r => [r.id, r]));
  } catch (err) {
    dbError = err instanceof Error ? err.message : String(err);
  }

  const personas = HERO_PERSONAS.map(persona => {
    const dbMatch = dbUsersById.get(persona.id);
    return {
      id: persona.id,
      aliasKey: persona.aliasKey,
      email: dbMatch?.email ?? persona.defaultEmail,
      name: dbMatch?.name ?? persona.name,
      passwordPlain: persona.passwordPlain,
      segment: persona.segment,
      loyaltyTier: persona.loyaltyTier,
      badgeLabel: persona.badgeLabel,
      storyHint: persona.storyHint,
      recommendedPath: persona.recommendedPath,
      seededInDb: Boolean(dbMatch),
    };
  });

  return NextResponse.json({
    database: {
      connected: dbUsersById.size > 0,
      heroUsersFound: dbUsersById.size,
      error: dbError,
    },
    sdk: {
      writeKeyConfigured: Boolean(writeKey),
      writeKey: writeKey || null,
      telemetryEndpoint,
      buildId,
      environment,
      deployTokenConfigured: Boolean(
        (
          process.env.ASKDEPTH_DEPLOY_TOKEN ||
          process.env.ASKDEPTH_API_KEY ||
          ''
        ).trim()
      ),
    },
    connector: {
      endpointPath: '/askdepth/v1',
      secretConfigured: Boolean(
        (
          process.env.ASKDEPTH_CONNECTOR_SECRET ||
          'c0nn3ct0r_s3cr3t_d3m0_sh0p_2026'
        ).trim()
      ),
    },
    personas,
  });
}
