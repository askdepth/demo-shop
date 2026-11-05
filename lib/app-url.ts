// Location: lib/app-url.ts

const FALLBACK_URL = 'http://localhost:3000';

/**
 * Public base URL of the app. Tolerates a missing scheme
 * ("shop.example.com" -> "https://shop.example.com") and trailing slashes.
 */
export function getAppUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!raw) return FALLBACK_URL;
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  return withScheme.replace(/\/+$/, '');
}
