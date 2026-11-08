import { Pool } from 'pg';
import {
  createConnector,
  postgresAdapter,
} from '@askdepth/audience-connector';

/**
 * Canonical field mapping for Demo Shop's `public.users` table.
 * Matches the columns configured in Connect Wizard Step 3:
 *  - externalId -> id (identical to `Askdepth.identify(session.user.id)` for AskClaw Identity Bridge)
 *  - email      -> email
 *  - name       -> name
 *  - signupAt   -> createdAt
 *  - segment    -> segment
 *  - isActive   -> is_active
 *  - contactable -> marketing_opt_in (enables OPT_IN_FIELD lawful basis in Step 4)
 */
export const DEMO_SHOP_FIELD_MAPPING = {
  externalId: 'id',
  email: 'email',
  name: 'name',
  signupAt: 'createdAt',
  segment: 'segment',
  isActive: 'is_active',
  contactable: 'marketing_opt_in',
} as const;

/**
 * Attribute allowlist:
 *  - `country` is intentionally filter-only (omitted from `returnable`) to demonstrate
 *    zero-leakage cohort filtering and pass Conformance case P6.
 *  - Sensitive columns `password` and `internal_notes` are omitted from both mappings
 *    and attributes, passing Conformance case N3.
 */
export const DEMO_SHOP_ATTRIBUTES = {
  filterable: [
    'loyalty_tier',
    'preferred_category',
    'device_type',
    'has_abandoned_cart',
    'country',
  ],
  returnable: [
    'loyalty_tier',
    'preferred_category',
    'device_type',
    'has_abandoned_cart',
  ],
} as const;

const globalForConnector = globalThis as unknown as {
  askdepthPgPool?: Pool;
  askdepthConnectorKey?: string;
  askdepthConnectorInstance?: ReturnType<typeof createConnector>;
};

function getPgPool(): Pool {
  if (globalForConnector.askdepthPgPool) {
    return globalForConnector.askdepthPgPool;
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not configured for AskDepth Audience Connector.');
  }

  const needsRelaxedTls =
    process.env.DB_SSL_REJECT_UNAUTHORIZED === 'false' ||
    connectionString.includes('pooler.supabase.com');

  const pool = new Pool({
    connectionString,
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    ...(needsRelaxedTls ? { ssl: { rejectUnauthorized: false } } : {}),
  });

  if (process.env.NODE_ENV !== 'production') {
    globalForConnector.askdepthPgPool = pool;
  } else {
    globalForConnector.askdepthPgPool = pool;
  }

  return pool;
}

function getConnectorInstance(): ReturnType<typeof createConnector> | null {
  const secret = (
    process.env.ASKDEPTH_CONNECTOR_SECRET ||
    'xOpotqDsiUc2vVyirBKiOXPxOwVo7B-IUoNsj6ndWaE'
  ).trim();
  if (!secret) {
    return null;
  }
  const previousSecret = (
    process.env.ASKDEPTH_CONNECTOR_PREVIOUS_SECRET ||
    'c0nn3ct0r_s3cr3t_d3m0_sh0p_2026'
  ).trim();
  const cacheKey = `${secret}:${previousSecret ?? ''}`;

  if (
    globalForConnector.askdepthConnectorInstance &&
    globalForConnector.askdepthConnectorKey === cacheKey
  ) {
    return globalForConnector.askdepthConnectorInstance;
  }

  const instance = createConnector({
    secret,
    previousSecret,
    adapter: postgresAdapter({
      pool: getPgPool(),
      table: 'users',
      schema: 'public',
    }),
    fieldMapping: { ...DEMO_SHOP_FIELD_MAPPING },
    attributes: {
      filterable: [...DEMO_SHOP_ATTRIBUTES.filterable],
      returnable: [...DEMO_SHOP_ATTRIBUTES.returnable],
    },
    basePath: '/askdepth/v1',
  });

  globalForConnector.askdepthConnectorKey = cacheKey;
  globalForConnector.askdepthConnectorInstance = instance;
  return instance;
}

export async function handleAudienceConnectorRequest(
  request: Request
): Promise<Response> {
  const connector = getConnectorInstance();
  if (!connector) {
    return new Response(
      JSON.stringify({
        error: {
          code: 'internal',
          message:
            'Audience connector is not yet configured (ASKDEPTH_CONNECTOR_SECRET is unset).',
        },
      }),
      {
        status: 503,
        headers: { 'content-type': 'application/json' },
      }
    );
  }

  return connector.fetch(request);
}
