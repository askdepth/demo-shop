export interface DemoPersona {
  id: string;
  aliasKey: string;
  defaultEmail: string;
  name: string;
  passwordPlain: string;
  segment:
    | 'vip'
    | 'repeat_buyer'
    | 'cart_abandoner'
    | 'new_customer'
    | 'at_risk'
    | 'window_shopper';
  loyaltyTier: 'platinum' | 'gold' | 'silver' | 'standard';
  preferredCategory: 'electronics' | 'clothing' | 'home-garden';
  deviceType: 'desktop' | 'mobile' | 'tablet';
  hasAbandonedCart: boolean;
  country: 'US' | 'DE' | 'GB' | 'PL' | 'CA' | 'FR';
  marketingOptIn: boolean;
  badgeLabel: string;
  storyHint: string;
  recommendedPath: string;
}

export const DEMO_DEFAULT_PASSWORD = 'customer123';

export const HERO_PERSONAS: readonly DemoPersona[] = [
  {
    id: 'cust_hero_sarah',
    aliasKey: 'sarah',
    defaultEmail: 'sarah.chen@example.com',
    name: 'Sarah Chen',
    passwordPlain: DEMO_DEFAULT_PASSWORD,
    segment: 'vip',
    loyaltyTier: 'platinum',
    preferredCategory: 'electronics',
    deviceType: 'desktop',
    hasAbandonedCart: false,
    country: 'US',
    marketingOptIn: true,
    badgeLabel: 'VIP · Platinum',
    storyHint: '6 delivered orders ($4.8k LTV). Tests Bundle Configurator & Express Shipping.',
    recommendedPath: '/products/iphone-15-pro',
  },
  {
    id: 'cust_hero_marcus',
    aliasKey: 'marcus',
    defaultEmail: 'marcus.rivera@example.com',
    name: 'Marcus Rivera',
    passwordPlain: DEMO_DEFAULT_PASSWORD,
    segment: 'cart_abandoner',
    loyaltyTier: 'gold',
    preferredCategory: 'electronics',
    deviceType: 'mobile',
    hasAbandonedCart: true,
    country: 'US',
    marketingOptIn: true,
    badgeLabel: 'Cart Abandoner · Gold',
    storyHint: '$1,229 active cart. Hits Promo Code Rage Click & Checkout Shipping 503.',
    recommendedPath: '/checkout',
  },
  {
    id: 'cust_hero_elena',
    aliasKey: 'elena',
    defaultEmail: 'elena.kowalski@example.com',
    name: 'Elena Kowalski',
    passwordPlain: DEMO_DEFAULT_PASSWORD,
    segment: 'new_customer',
    loyaltyTier: 'standard',
    preferredCategory: 'clothing',
    deviceType: 'mobile',
    hasAbandonedCart: true,
    country: 'PL',
    marketingOptIn: true,
    badgeLabel: 'New Customer',
    storyHint: 'First apparel visit. Clicks Size & Fit Guide (Dead Click scenario).',
    recommendedPath: '/products/premium-cotton-tshirt',
  },
  {
    id: 'cust_hero_alex',
    aliasKey: 'alex',
    defaultEmail: 'alex.mercer@example.com',
    name: 'Alex Mercer',
    passwordPlain: DEMO_DEFAULT_PASSWORD,
    segment: 'at_risk',
    loyaltyTier: 'silver',
    preferredCategory: 'home-garden',
    deviceType: 'desktop',
    hasAbandonedCart: false,
    country: 'DE',
    marketingOptIn: true,
    badgeLabel: 'At-Risk · Refunded',
    storyHint: 'Previous order refunded. Ideal target for churn recovery interviews.',
    recommendedPath: '/orders',
  },
  {
    id: 'cust_hero_john',
    aliasKey: 'john',
    defaultEmail: 'customer@example.com',
    name: 'John Doe',
    passwordPlain: DEMO_DEFAULT_PASSWORD,
    segment: 'repeat_buyer',
    loyaltyTier: 'silver',
    preferredCategory: 'electronics',
    deviceType: 'desktop',
    hasAbandonedCart: true,
    country: 'US',
    marketingOptIn: true,
    badgeLabel: 'Repeat Buyer',
    storyHint: 'Classic baseline shopper with mixed cart & order history.',
    recommendedPath: '/cart',
  },
] as const;

/**
 * Resolves a hero persona email. If `inboxBaseEmail` is provided (e.g. `founder@gmail.com`),
 * rewrites `sarah` -> `founder+sarah@gmail.com` so real SES outreach emails arrive in one inbox.
 * Preserves `customer@example.com` for `john` unless explicitly overridden.
 */
export function resolveHeroEmail(
  persona: DemoPersona,
  inboxBaseEmail?: string | null
): string {
  if (persona.aliasKey === 'john') {
    return persona.defaultEmail;
  }
  const clean = inboxBaseEmail?.trim();
  if (!clean || !clean.includes('@')) {
    return persona.defaultEmail;
  }
  const atIdx = clean.lastIndexOf('@');
  const local = clean.slice(0, atIdx).split('+')[0];
  const domain = clean.slice(atIdx + 1);
  if (!local || !domain) {
    return persona.defaultEmail;
  }
  return `${local}+${persona.aliasKey}@${domain}`;
}
