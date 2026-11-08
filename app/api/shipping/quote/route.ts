import { NextRequest, NextResponse } from 'next/server';
import { DEMO_SCENARIO_COOKIE_KEY } from '@/lib/demo-scenarios';

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function parseScenarioCookie(request: NextRequest): Set<string> {
  const raw = request.cookies.get(DEMO_SCENARIO_COOKIE_KEY)?.value ?? '';
  if (!raw) return new Set();
  return new Set(
    decodeURIComponent(raw)
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
  );
}

export async function POST(request: NextRequest) {
  let body: { shippingMethod?: string; postalCode?: string; state?: string } = {};
  try {
    body = await request.json();
  } catch {
    // ignore empty body
  }

  const method = body.shippingMethod || 'standard';
  const activeScenarios = parseScenarioCookie(request);
  const force503 =
    activeScenarios.has('expressShipping503') ||
    request.headers.get('x-demo-express-503') === '1';
  const slowRegression = activeScenarios.has('steppedCheckoutRegression');

  if (slowRegression) {
    await sleep(1650);
  }

  if (force503 && (method === 'express' || method === 'overnight')) {
    await sleep(360);
    return NextResponse.json(
      {
        success: false,
        code: 'CARRIER_RATE_GATEWAY_UNAVAILABLE',
        error:
          'Express carrier rate service timed out (HTTP 503). Please retry or select Standard Shipping.',
      },
      { status: 503 }
    );
  }

  const quotes: Record<
    string,
    { carrier: string; estimatedDays: string; guaranteed: boolean }
  > = {
    standard: {
      carrier: 'USPS Ground Advantage',
      estimatedDays: '5–7 business days',
      guaranteed: false,
    },
    express: {
      carrier: 'FedEx 2Day Air',
      estimatedDays: '2–3 business days',
      guaranteed: true,
    },
    overnight: {
      carrier: 'UPS Next Day Air Saver',
      estimatedDays: 'Next business day by 3 PM',
      guaranteed: true,
    },
  };

  return NextResponse.json({
    success: true,
    shippingMethod: method,
    quote: quotes[method] ?? quotes.standard,
  });
}
