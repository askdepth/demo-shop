// components/checkout/checkout-form.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Lock, CreditCard, AlertCircle, Activity } from 'lucide-react';
import { useAskdepth } from '@askdepth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatCurrency } from '@/lib/utils';
import { PromoCodeBox } from '@/components/checkout/promo-code-box';
import { useDemoScenarios } from '@/components/demo/demo-scenario-context';

interface CartItem {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    images: Array<{ url: string }>;
  };
}

interface SavedAddress {
  shippingName: string;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string | null;
  shippingZip: string;
  shippingCountry: string;
  customerEmail: string;
  customerPhone: string | null;
}

interface ShippingMethod {
  id: string;
  name: string;
  description: string;
  price: number;
}

interface CheckoutFormProps {
  cart: { items: CartItem[]; total: number; itemCount: number };
  isLoggedIn: boolean;
  userEmail?: string;
  savedAddress: SavedAddress | null;
  shippingMethods: ShippingMethod[];
}

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID',
  'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS',
  'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK',
  'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV',
  'WI', 'WY',
];

export function CheckoutForm({
  cart,
  isLoggedIn,
  userEmail,
  savedAddress,
  shippingMethods,
}: CheckoutFormProps) {
  const askdepth = useAskdepth();
  const { scenarios, logDemoSignal } = useDemoScenarios();

  const [addressMode, setAddressMode] = useState<'saved' | 'form'>(
    isLoggedIn && savedAddress ? 'saved' : 'form'
  );
  const [email, setEmail] = useState(userEmail ?? '');
  const [firstName, setFirstName] = useState(
    savedAddress?.shippingName?.split(' ')[0] ?? ''
  );
  const [lastName, setLastName] = useState(
    savedAddress?.shippingName?.split(' ').slice(1).join(' ') ?? ''
  );
  const [address, setAddress] = useState(savedAddress?.shippingAddress ?? '');
  const [city, setCity] = useState(savedAddress?.shippingCity ?? '');
  const [state, setState] = useState(savedAddress?.shippingState ?? '');
  const [zip, setZip] = useState(savedAddress?.shippingZip ?? '');
  const [phone, setPhone] = useState(savedAddress?.customerPhone ?? '');
  const [shippingMethod, setShippingMethod] = useState(
    shippingMethods[0]?.id ?? 'standard'
  );
  const [shippingQuoteNote, setShippingQuoteNote] = useState<string | null>(
    null
  );
  const [shippingQuoteError, setShippingQuoteError] = useState<string | null>(
    null
  );
  const [isQuotingShipping, setIsQuotingShipping] = useState(false);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [cardLast4, setCardLast4] = useState('4242 4242 4242 4242');
  const [cardExpiry, setCardExpiry] = useState('08/29');
  const [cardCvc, setCardCvc] = useState('842');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const experimentVariant = scenarios.steppedCheckoutRegression
    ? 'stepped_v2'
    : 'one_page_v1';

  useEffect(() => {
    if (cart.items.length === 0) return;
    const startedAt = performance.now();
    const timer = window.setTimeout(
      () => {
        const durationMs = Math.round(performance.now() - startedAt);
        askdepth.track('checkout_started', {
          url: typeof window !== 'undefined' ? window.location.href : undefined,
          count: cart.itemCount,
          duration_ms: durationMs,
        });
      },
      scenarios.steppedCheckoutRegression ? 1200 : 80
    );
    return () => window.clearTimeout(timer);
  }, [cart.items.length, cart.itemCount, scenarios.steppedCheckoutRegression, askdepth]);

  const useSavedAddress = () => setAddressMode('saved');
  const editAddress = () => setAddressMode('form');

  const handleSelectShippingMethod = async (methodId: string) => {
    setShippingMethod(methodId);
    setShippingQuoteError(null);
    setShippingQuoteNote(null);
    setIsQuotingShipping(true);

    try {
      const res = await fetch('/api/shipping/quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(scenarios.expressShipping503 ? { 'x-demo-express-503': '1' } : {}),
        },
        body: JSON.stringify({
          shippingMethod: methodId,
          postalCode: zip || savedAddress?.shippingZip || '94107',
          state: state || savedAddress?.shippingState || 'CA',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        const errText =
          data.error || `Carrier rate service failed (HTTP ${res.status}).`;
        setShippingQuoteError(errText);
        logDemoSignal(
          'ERROR_CLICK',
          `POST /api/shipping/quote -> HTTP ${res.status} (${methodId})`
        );
        return;
      }
      if (data.quote?.carrier) {
        setShippingQuoteNote(
          `${data.quote.carrier} · ${data.quote.estimatedDays}`
        );
      }
    } catch {
      setShippingQuoteError('Unable to verify live carrier rate.');
    } finally {
      setIsQuotingShipping(false);
    }
  };

  const handlePlaceOrder = async () => {
    setError(null);

    if (cart.items.length === 0) {
      setError('Your cart is empty.');
      return;
    }

    const info =
      addressMode === 'saved' && savedAddress
        ? {
            email: savedAddress.customerEmail,
            firstName: savedAddress.shippingName.split(' ')[0] ?? '',
            lastName: savedAddress.shippingName.split(' ').slice(1).join(' '),
            phone: savedAddress.customerPhone ?? undefined,
            line1: savedAddress.shippingAddress,
            city: savedAddress.shippingCity,
            state: savedAddress.shippingState ?? '',
            postalCode: savedAddress.shippingZip,
            country: savedAddress.shippingCountry,
          }
        : {
            email,
            firstName,
            lastName,
            phone: phone || undefined,
            line1: address,
            city,
            state,
            postalCode: zip,
            country: 'US',
          };

    if (
      !info.email ||
      !info.firstName ||
      !info.lastName ||
      !info.line1 ||
      !info.city ||
      !info.state ||
      !info.postalCode
    ) {
      setError('Please fill in all required shipping fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.items.map(item => ({
            productId: item.product.id,
            quantity: item.quantity,
            price: item.product.price,
          })),
          shippingAddress: {
            line1: info.line1,
            city: info.city,
            state: info.state,
            postalCode: info.postalCode,
            country: info.country,
          },
          customerInfo: {
            email: info.email,
            firstName: info.firstName,
            lastName: info.lastName,
            phone: info.phone,
          },
          shippingMethod,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        if (response.status >= 500) {
          logDemoSignal(
            'ERROR_CLICK',
            `POST /api/checkout -> HTTP ${response.status} (${shippingMethod})`
          );
        }
        setError(data.error || 'Failed to start checkout.');
        return;
      }

      askdepth.track('checkout_completed', {
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        count: cart.itemCount,
      });

      window.location.assign(data.url);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <p className="mt-2 text-muted-foreground">
          Add some products before checking out.
        </p>
        <Button asChild className="mt-6">
          <Link href="/products">Continue Shopping</Link>
        </Button>
      </div>
    );
  }

  const selectedShippingObj = shippingMethods.find(
    m => m.id === shippingMethod
  );
  const shippingCost = selectedShippingObj?.price ?? 0;
  const discountedTotal = Math.max(0, cart.total - promoDiscount);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Checkout
        </h1>
        {scenarios.steppedCheckoutRegression && (
          <span
            data-askdepth-block=""
            className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-800"
          >
            <Activity className="h-3.5 w-3.5 text-sky-600" aria-hidden="true" />
            Experiment Cohort: <code className="font-mono">{experimentVariant}</code>{' '}
            (Simulated Latency Active)
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {error && (
            <Alert variant="destructive" data-testid="checkout-error">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Shipping Information (Zero-PII Replay Masked via data-askdepth-mask) */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>Shipping Information</CardTitle>
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Lock className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                PII Replay Masked
              </span>
            </CardHeader>
            <CardContent className="space-y-4">
              {addressMode === 'saved' && savedAddress ? (
                <div className="space-y-4" data-testid="saved-address">
                  <div
                    data-askdepth-mask=""
                    className="rounded-lg border p-4 text-sm"
                  >
                    <p className="font-medium">{savedAddress.shippingName}</p>
                    <p>{savedAddress.shippingAddress}</p>
                    <p>
                      {savedAddress.shippingCity}, {savedAddress.shippingState}{' '}
                      {savedAddress.shippingZip}
                    </p>
                    <p>{savedAddress.customerEmail}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      data-testid="use-default-address"
                      onClick={useSavedAddress}
                    >
                      Use this address
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={editAddress}
                    >
                      Use a different address
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  data-askdepth-mask=""
                  className="grid grid-cols-1 gap-4 sm:grid-cols-2"
                >
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="checkout-email">Email</Label>
                    <Input
                      id="checkout-email"
                      data-testid="checkout-email"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      disabled={isLoggedIn && !!userEmail}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="checkout-first-name">First name</Label>
                    <Input
                      id="checkout-first-name"
                      data-testid="checkout-first-name"
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="checkout-last-name">Last name</Label>
                    <Input
                      id="checkout-last-name"
                      data-testid="checkout-last-name"
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="checkout-address">Address</Label>
                    <Input
                      id="checkout-address"
                      data-testid="checkout-address"
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="checkout-city">City</Label>
                    <Input
                      id="checkout-city"
                      data-testid="checkout-city"
                      value={city}
                      onChange={e => setCity(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="checkout-state">State</Label>
                    <select
                      id="checkout-state"
                      data-testid="checkout-state"
                      value={state}
                      onChange={e => setState(e.target.value)}
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value="">Select a state</option>
                      {US_STATES.map(code => (
                        <option key={code} value={code}>
                          {code}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="checkout-zip">ZIP code</Label>
                    <Input
                      id="checkout-zip"
                      data-testid="checkout-zip"
                      value={zip}
                      onChange={e => setZip(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="checkout-phone">Phone (optional)</Label>
                    <Input
                      id="checkout-phone"
                      data-testid="checkout-phone"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                    />
                  </div>
                  {isLoggedIn && savedAddress && (
                    <div className="sm:col-span-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={useSavedAddress}
                      >
                        Use my saved address instead
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Shipping Method (Scenario 3: Express 503 Network Error Correlation) */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>Shipping Method</CardTitle>
              {isQuotingShipping && (
                <span className="text-xs text-muted-foreground">
                  Checking live carrier rates...
                </span>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              {shippingMethods.map(method => (
                <label
                  key={method.id}
                  className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 text-sm transition ${
                    shippingMethod === method.id
                      ? 'border-slate-900 bg-slate-50/70'
                      : 'hover:border-slate-300'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="shippingMethod"
                      value={method.id}
                      checked={shippingMethod === method.id}
                      onChange={() => void handleSelectShippingMethod(method.id)}
                      data-testid={`shipping-method-${method.id}`}
                    />
                    <span>
                      <span className="block font-medium">{method.name}</span>
                      <span className="block text-muted-foreground">
                        {method.description}
                      </span>
                    </span>
                  </span>
                  <span className="font-medium">
                    {formatCurrency(method.price)}
                  </span>
                </label>
              ))}

              {shippingQuoteNote && !shippingQuoteError && (
                <p className="text-xs font-medium text-emerald-700">
                  Verified carrier dispatch: {shippingQuoteNote}
                </p>
              )}

              {shippingQuoteError && (
                <div
                  role="alert"
                  data-testid="shipping-quote-error"
                  className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800"
                >
                  <AlertCircle
                    className="mt-0.5 h-4 w-4 shrink-0 text-rose-600"
                    aria-hidden="true"
                  />
                  <span>{shippingQuoteError}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Details (Scenario 6: Zero-PII Block in Session Replay) */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-slate-600" aria-hidden="true" />
                Payment Method (Demo Sandbox)
              </CardTitle>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700">
                <Lock className="h-3 w-3" aria-hidden="true" />
                data-askdepth-block
              </span>
            </CardHeader>
            <CardContent>
              <div
                data-askdepth-block=""
                className="grid grid-cols-1 gap-4 rounded-lg border border-slate-200 bg-slate-50/60 p-4 sm:grid-cols-3"
              >
                <div className="space-y-1.5 sm:col-span-3">
                  <Label htmlFor="demo-card-number">Card number (test)</Label>
                  <Input
                    id="demo-card-number"
                    value={cardLast4}
                    onChange={e => setCardLast4(e.target.value)}
                    autoComplete="off"
                    className="font-mono"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="demo-card-expiry">Expiration</Label>
                  <Input
                    id="demo-card-expiry"
                    value={cardExpiry}
                    onChange={e => setCardExpiry(e.target.value)}
                    autoComplete="off"
                    className="font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="demo-card-cvc">Security code</Label>
                  <Input
                    id="demo-card-cvc"
                    value={cardCvc}
                    onChange={e => setCardCvc(e.target.value)}
                    autoComplete="off"
                    className="font-mono"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground sm:col-span-3">
                  This payment container carries{' '}
                  <code className="font-mono">data-askdepth-block</code>: DOM
                  nodes inside are never serialized or transmitted in Session
                  Replays.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="bg-gray-50">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {cart.items.map(item => (
                  <div
                    key={item.id}
                    data-testid="checkout-summary-item"
                    className="flex items-center gap-3 text-sm"
                  >
                    <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded bg-muted">
                      <Image
                        src={
                          item.product.images[0]?.url ||
                          '/images/placeholder.png'
                        }
                        alt={item.product.name}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        {item.product.name}
                      </p>
                      <p className="text-muted-foreground">
                        Qty {item.quantity}
                      </p>
                    </div>
                    <p className="font-medium">
                      {formatCurrency(item.product.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              <PromoCodeBox
                subtotal={cart.total}
                onDiscountChange={amt => setPromoDiscount(amt)}
                surface="checkout"
              />

              <Separator />

              <div
                className="flex justify-between text-sm"
                data-testid="checkout-subtotal"
              >
                <span>Subtotal ({cart.itemCount} items)</span>
                <span>{formatCurrency(cart.total)}</span>
              </div>

              {promoDiscount > 0 && (
                <div className="flex justify-between text-sm font-medium text-emerald-700">
                  <span>Promo Discount</span>
                  <span>-{formatCurrency(promoDiscount)}</span>
                </div>
              )}

              {shippingCost > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Shipping ({selectedShippingObj?.name})</span>
                  <span>{formatCurrency(shippingCost)}</span>
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                Final tax is confirmed upon order placement.
              </p>

              <Separator />

              <div
                className="flex justify-between text-lg font-semibold"
                data-testid="checkout-total"
              >
                <span>Estimated total</span>
                <span>{formatCurrency(discountedTotal + shippingCost)}</span>
              </div>

              <Button
                onClick={handlePlaceOrder}
                disabled={isSubmitting}
                className="w-full"
                size="lg"
                data-testid="place-order"
              >
                {isSubmitting ? 'Placing order...' : 'Place Order'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
