// app/api/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createCheckout } from '@/server/actions/checkout';
import { DEMO_SCENARIO_COOKIE_KEY } from '@/lib/demo-scenarios';

function hasScenario(request: NextRequest, scenario: string): boolean {
  const raw = request.cookies.get(DEMO_SCENARIO_COOKIE_KEY)?.value ?? '';
  if (!raw) return false;
  return decodeURIComponent(raw)
    .split(',')
    .map(s => s.trim())
    .includes(scenario);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const shippingMethod = body.shippingMethod ?? 'standard';

  // Demo Scenario 3: Express / Overnight gateway 503 failure
  if (
    hasScenario(request, 'expressShipping503') &&
    (shippingMethod === 'express' || shippingMethod === 'overnight')
  ) {
    await new Promise(resolve => setTimeout(resolve, 420));
    return NextResponse.json(
      {
        success: false,
        code: 'PAYMENT_SHIPPING_GATEWAY_503',
        error:
          'Express carrier dispatch gateway returned 503 Service Unavailable. Switch to Standard Shipping or disable the Express 503 scenario in Demo Lab.',
      },
      { status: 503 }
    );
  }

  if (hasScenario(request, 'steppedCheckoutRegression')) {
    await new Promise(resolve => setTimeout(resolve, 1450));
  }

  const formData = new FormData();
  formData.set('items', JSON.stringify(body.items ?? []));
  formData.set('shippingAddress', JSON.stringify(body.shippingAddress ?? {}));
  formData.set('billingAddress', JSON.stringify(body.billingAddress ?? null));
  formData.set('customerInfo', JSON.stringify(body.customerInfo ?? {}));
  formData.set('shippingMethod', shippingMethod);
  if (body.notes) formData.set('notes', body.notes);

  const result = await createCheckout(formData);

  return NextResponse.json(result, { status: result.success ? 200 : 400 });
}
