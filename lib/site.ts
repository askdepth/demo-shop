// Location: lib/site.ts
export const SITE_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Demo Shop';

export const FREE_SHIPPING_THRESHOLD = 75;

/** Estimated delivery date, `daysAhead` days from now, e.g. "Fri, Nov 7". */
export function deliveryDate(daysAhead = 1): string {
  const d = new Date(Date.now() + daysAhead * 86_400_000);
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(d);
}
