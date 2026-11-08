export type DemoScenarioKey =
  | 'promoRageClick'
  | 'sizeGuideDeadClick'
  | 'expressShipping503'
  | 'bundleCrashError'
  | 'steppedCheckoutRegression';

export interface DemoScenarioState {
  promoRageClick: boolean;
  sizeGuideDeadClick: boolean;
  expressShipping503: boolean;
  bundleCrashError: boolean;
  steppedCheckoutRegression: boolean;
}

export const DEFAULT_DEMO_SCENARIOS: DemoScenarioState = {
  promoRageClick: false,
  sizeGuideDeadClick: false,
  expressShipping503: false,
  bundleCrashError: false,
  steppedCheckoutRegression: false,
};

export interface DemoScenarioMeta {
  key: DemoScenarioKey;
  title: string;
  signalBadge: string;
  signalColor: 'amber' | 'rose' | 'orange' | 'purple' | 'blue';
  surfaceRoute: string;
  description: string;
  howToTrigger: string;
}

export const DEMO_SCENARIO_CATALOG: readonly DemoScenarioMeta[] = [
  {
    key: 'promoRageClick',
    title: 'Promo Code Silent Hang',
    signalBadge: 'RAGE_CLICK',
    signalColor: 'amber',
    surfaceRoute: '/checkout',
    description:
      'Makes the "Apply" button on Promo Code swallow clicks silently without feedback, provoking rapid frustrated clicks.',
    howToTrigger:
      'Go to /cart or /checkout, enter WELCOME20, and click "Apply" 3–4 times rapidly.',
  },
  {
    key: 'sizeGuideDeadClick',
    title: 'Broken Size Guide & Store Pickup',
    signalBadge: 'DEAD_CLICK',
    signalColor: 'orange',
    surfaceRoute: '/products/premium-cotton-tshirt',
    description:
      'Disables modal opening on "Size & Fit Guide" and "Check Store Pickup" buttons (zero DOM/network/route activity for >800ms).',
    howToTrigger:
      'Open any product page and click "Size & Fit Guide" or "Check Store Pickup".',
  },
  {
    key: 'expressShipping503',
    title: 'Express Shipping / Gateway 503',
    signalBadge: 'ERROR_CLICK (HTTP 503)',
    signalColor: 'rose',
    surfaceRoute: '/checkout',
    description:
      'Causes /api/shipping/quote and Express/Overnight /api/checkout calls to fail with HTTP 503 within the 10s click correlation window.',
    howToTrigger:
      'On /checkout, select "Express" or "Overnight" shipping or click "Place Order".',
  },
  {
    key: 'bundleCrashError',
    title: 'Bundle Configurator Render Crash',
    signalBadge: 'ERROR_CLICK (React Catch)',
    signalColor: 'purple',
    surfaceRoute: '/products/iphone-15-pro',
    description:
      'Throws a TypeError inside BundleConfigurator when selecting AppleCare+ / Trade-In, caught by <AskdepthCatch> with full Fiber stack.',
    howToTrigger:
      'Open an Electronics product page and click "Add Protection Bundle" in the configurator.',
  },
  {
    key: 'steppedCheckoutRegression',
    title: 'Checkout v2 Experiment Regression',
    signalBadge: 'COHORT + LATENCY_P95',
    signalColor: 'blue',
    surfaceRoute: '/checkout',
    description:
      'Switches checkout to experiment_variant="stepped_v2" (feature_flag="checkout_v2") with 1.8s simulated latency for AskClaw cohort isolation.',
    howToTrigger:
      'Visit /checkout with this enabled to emit high-latency cohort events under stepped_v2.',
  },
] as const;

export const DEMO_SCENARIO_STORAGE_KEY = 'askdepth_demo_scenarios_v1';
export const DEMO_SCENARIO_COOKIE_KEY = 'askdepth_demo_scenarios';
