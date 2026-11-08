import { randomUUID, createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { NextRequest, NextResponse } from 'next/server';
import {
  createTelemetryEnvelope,
  PROTOCOL_VERSION,
  type TelemetryEventEnvelope,
} from '@askdepth/contracts';
import { SDK_NAME, SDK_VERSION } from '@askdepth/core';
import {
  normalizeEnvironment,
  normalizeTelemetryEndpoint,
} from '@/lib/askdepth-config';
import type { DemoScenarioKey } from '@/lib/demo-scenarios';

export const runtime = 'nodejs';

const WAVE_SHOPPERS = [
  'cust_hero_marcus',
  'cust_hero_sarah',
  'cust_hero_elena',
  'cust_hero_john',
  'cust_syn_0001',
  'cust_syn_0002',
  'cust_syn_0003',
] as const;

interface ResolvedComponentTarget {
  selector: string;
  hashId?: string;
  componentName: string;
}

/**
 * Looks up the real `cmp_xxxxxxxx` hash from `.askdepth/component-maps/<buildId>.manifest.json`
 * when available so simulated cohort waves link straight to the exact Git file & line in AskClaw.
 */
function findComponentTarget(
  buildId: string,
  fileHint: string,
  fallbackName: string
): ResolvedComponentTarget {
  try {
    const manifestPath = resolve(
      process.cwd(),
      '.askdepth/component-maps',
      `${buildId}.manifest.json`
    );
    if (existsSync(manifestPath)) {
      const parsed = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
        mappings?: Record<
          string,
          { file?: string; component?: string }
        >;
      };
      if (parsed.mappings) {
        for (const [hashId, loc] of Object.entries(parsed.mappings)) {
          if (
            /^cmp_[a-f0-9]{8}$/.test(hashId) &&
            loc?.file?.includes(fileHint)
          ) {
            return {
              selector: `[data-askdepth-component="${hashId}"]`,
              hashId,
              componentName: loc.component || fallbackName,
            };
          }
        }
      }
    }
  } catch {
    // ignore manifest read errors and fall back to valid deterministic component selector
  }

  const fallbackHash = `cmp_${createHash('sha256')
    .update(`${fileHint}:${fallbackName}`)
    .digest('hex')
    .slice(0, 8)}`;

  return {
    selector: `[data-askdepth-component="${fallbackHash}"]`,
    hashId: fallbackHash,
    componentName: fallbackName,
  };
}

function sha256Hex(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

export async function POST(request: NextRequest) {
  let body: {
    scenario?: DemoScenarioKey;
    writeKey?: string;
    endpoint?: string;
  } = {};
  try {
    body = await request.json();
  } catch {
    // allow empty JSON body
  }

  const scenario: DemoScenarioKey = body.scenario || 'expressShipping503';
  const writeKey = (
    body.writeKey ||
    process.env.NEXT_PUBLIC_ASKDEPTH_WRITE_KEY ||
    ''
  ).trim();

  if (!writeKey) {
    return NextResponse.json(
      {
        success: false,
        error:
          'Missing AskDepth Browser Write Key (ad_bw_...). Configure NEXT_PUBLIC_ASKDEPTH_WRITE_KEY or paste it in Demo Lab -> SDK Config.',
      },
      { status: 400 }
    );
  }

  const endpoint = normalizeTelemetryEndpoint(
    body.endpoint ||
      process.env.NEXT_PUBLIC_ASKDEPTH_ENDPOINT ||
      process.env.ASKDEPTH_INGEST_URL
  );
  const environment = normalizeEnvironment(
    process.env.NEXT_PUBLIC_ASKDEPTH_ENVIRONMENT
  );
  const buildId =
    process.env.NEXT_PUBLIC_ASKDEPTH_BUILD_ID ||
    process.env.ASKDEPTH_BUILD_ID ||
    'demo-shop-v1';
  const appOrigin =
    process.env.NEXT_PUBLIC_APP_URL || 'https://demo-shop.askdepth.com';

  let acceptedSessions = 0;
  let totalEventsSent = 0;
  let lastStatus = 0;
  let lastErrorBody = '';

  for (let idx = 0; idx < WAVE_SHOPPERS.length; idx++) {
    const externalId = WAVE_SHOPPERS[idx]!;
    const sessionId = randomUUID();
    const nowMs = Date.now() - idx * 4500;
    const sentAtIso = new Date(nowMs).toISOString();

    const baseEvents: Array<TelemetryEventEnvelope & Record<string, unknown>> =
      [
        {
          event_id: randomUUID(),
          timestamp: new Date(nowMs - 1500).toISOString(),
          type: 'identify',
          user_id: externalId,
          traits: {
            page: `${appOrigin}/checkout`,
          },
        },
      ];

    if (scenario === 'promoRageClick') {
      const target = findComponentTarget(
        buildId,
        'promo-code-box',
        'PromoCodeBox'
      );
      for (let burst = 0; burst < 2; burst++) {
        const t = nowMs - burst * 600;
        baseEvents.push({
          event_id: randomUUID(),
          timestamp: new Date(t).toISOString(),
          interaction_id: randomUUID(),
          detector_version: SDK_VERSION,
          build_id: buildId,
          route: '/checkout',
          feature_flag: 'checkout_v2',
          experiment_variant: 'stepped_v2',
          type: 'RAGE_CLICK',
          target_selector: target.selector,
          target_tag: 'BUTTON',
          click_count: 4,
          coordinates: [
            { x: 612, y: 418, timestamp: t - 420 },
            { x: 614, y: 419, timestamp: t - 280 },
            { x: 613, y: 418, timestamp: t - 140 },
            { x: 612, y: 420, timestamp: t },
          ],
          component: {
            name: target.componentName,
            stack: [target.componentName, 'CheckoutForm'],
            hash_id: target.hashId,
          },
        });
      }
    } else if (scenario === 'sizeGuideDeadClick') {
      const target = findComponentTarget(
        buildId,
        'product-interactive-tools',
        'ProductInteractiveTools'
      );
      for (let burst = 0; burst < 2; burst++) {
        const t = nowMs - burst * 950;
        baseEvents.push({
          event_id: randomUUID(),
          timestamp: new Date(t).toISOString(),
          interaction_id: randomUUID(),
          detector_version: SDK_VERSION,
          build_id: buildId,
          route: '/products/premium-cotton-tshirt',
          type: 'DEAD_CLICK',
          target_selector: target.selector,
          observed_duration_ms: 800,
          is_interactive_element: true,
          computed_styles: {
            cursor: 'pointer',
            'pointer-events': 'auto',
            display: 'inline-flex',
            opacity: '1',
          },
          component: {
            name: target.componentName,
            stack: [target.componentName, 'ProductPage'],
            hash_id: target.hashId,
          },
        });
      }
    } else if (scenario === 'bundleCrashError') {
      const target = findComponentTarget(
        buildId,
        'bundle-configurator',
        'BundleConfigurator'
      );
      const fingerprint = sha256Hex(
        'REACT_COMPONENT_ERROR:BundleConfigurator:protectionPlan.tier'
      );
      baseEvents.push({
        event_id: randomUUID(),
        timestamp: sentAtIso,
        interaction_id: randomUUID(),
        detector_version: SDK_VERSION,
        error_code: 'REACT_COMPONENT_ERROR',
        error_fingerprint: fingerprint,
        build_id: buildId,
        route: '/products/iphone-15-pro',
        type: 'ERROR_CLICK',
        target_selector: target.selector,
        error_type: 'js_exception',
        time_to_error_ms: 34,
        error_details: {
          message:
            "Cannot read properties of undefined (reading 'protectionCoverageTier')",
          stack: 'TypeError: BundleConfigurator render crash',
          component_stack: 'in BundleConfigurator > in AskdepthCatch > in ProductPage',
          handled: true,
        },
        component: {
          name: target.componentName,
          stack: [target.componentName, 'AskdepthCatch', 'ProductPage'],
          hash_id: target.hashId,
        },
      });
    } else {
      // Default & expressShipping503 / steppedCheckoutRegression: high-severity checkout 503 + latency cohort
      const target = findComponentTarget(
        buildId,
        'checkout-form',
        'CheckoutForm'
      );
      const fingerprint = sha256Hex(
        'HTTP_503:/api/shipping/quote:CheckoutForm'
      );
      baseEvents.push(
        {
          event_id: randomUUID(),
          timestamp: new Date(nowMs - 400).toISOString(),
          interaction_id: randomUUID(),
          detector_version: SDK_VERSION,
          error_code: 'HTTP_503_GATEWAY',
          error_fingerprint: fingerprint,
          build_id: buildId,
          route: '/checkout',
          feature_flag: 'checkout_v2',
          experiment_variant: 'stepped_v2',
          type: 'ERROR_CLICK',
          target_selector: target.selector,
          error_type: 'network_error',
          time_to_error_ms: 620,
          error_details: {
            method: 'POST',
            url: `${appOrigin}/api/shipping/quote`,
            status_code: 503,
            duration_ms: 1840,
          },
          component: {
            name: target.componentName,
            stack: [target.componentName, 'CheckoutPage'],
            hash_id: target.hashId,
          },
        },
        {
          event_id: randomUUID(),
          timestamp: sentAtIso,
          route: '/checkout',
          feature_flag: 'checkout_v2',
          experiment_variant: 'stepped_v2',
          type: 'track',
          name: 'checkout_shipping_quote_failed',
          properties: {
            url: `${appOrigin}/checkout`,
            duration_ms: 1840,
            status_code: 503,
          },
        }
      );
    }

    // Validate against official @askdepth/contracts schema, then preserve top-level ingest cohort fields
    const validated = createTelemetryEnvelope({
      sdk_name: SDK_NAME,
      sdk_version: SDK_VERSION,
      environment,
      session_id: sessionId,
      batch_id: randomUUID(),
      sent_at: sentAtIso,
      build_id: buildId,
      events: baseEvents,
    });

    const wireEnvelope = {
      ...validated,
      events: validated.events.map((ev, i) => {
        const extra = baseEvents[i];
        return {
          ...ev,
          ...(extra?.route ? { route: extra.route } : {}),
          ...(extra?.feature_flag ? { feature_flag: extra.feature_flag } : {}),
          ...(extra?.experiment_variant
            ? { experiment_variant: extra.experiment_variant }
            : {}),
        };
      }),
    };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-askdepth-protocol-version': PROTOCOL_VERSION,
          'x-askdepth-sdk-name': SDK_NAME,
          'x-askdepth-sdk-version': SDK_VERSION,
          'x-askdepth-write-key': writeKey,
          'x-askdepth-build-id': buildId,
        },
        body: JSON.stringify(wireEnvelope),
      });
      lastStatus = res.status;
      if (res.ok) {
        acceptedSessions += 1;
        totalEventsSent += wireEnvelope.events.length;
      } else {
        lastErrorBody = await res.text().catch(() => '');
      }
    } catch (err) {
      lastStatus = 0;
      lastErrorBody = err instanceof Error ? err.message : String(err);
    }
  }

  if (acceptedSessions === 0) {
    return NextResponse.json(
      {
        success: false,
        error: `Ingest rejected or was unreachable (HTTP ${lastStatus}): ${lastErrorBody || 'check NEXT_PUBLIC_ASKDEPTH_WRITE_KEY, endpoint, and ALLOWED_ORIGINS'}`,
      },
      { status: 502 }
    );
  }

  return NextResponse.json({
    success: true,
    scenario,
    acceptedSessions,
    totalShoppers: WAVE_SHOPPERS.length,
    totalEventsSent,
    endpoint,
    buildId,
  });
}
