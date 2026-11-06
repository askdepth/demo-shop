// Location: lib/listing-params.ts
// Parse and build URL query strings for the product listing pages.
import type { ListParams } from '@/server/queries/catalog';

export type RawSearchParams = Record<string, string | string[] | undefined>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const num = (v: string | string[] | undefined) => {
  const n = parseFloat(one(v) ?? '');
  return Number.isFinite(n) ? n : undefined;
};

export function parseListing(sp: RawSearchParams, fixedCategory?: string): ListParams {
  return {
    q: one(sp.q)?.trim() || undefined,
    category: fixedCategory ?? (one(sp.category) || undefined),
    brands: one(sp.brand)?.split(',').filter(Boolean),
    minPrice: num(sp.minPrice),
    maxPrice: num(sp.maxPrice),
    minRating: num(sp.rating),
    inStockOnly: one(sp.instock) === '1',
    dealsOnly: one(sp.deals) === '1',
    sort: one(sp.sort) || 'featured',
    page: Math.max(1, Math.floor(num(sp.page) ?? 1)),
  };
}

/** Rebuilds the query string from current params with `patch` applied (undefined/'' removes a key). */
export function buildHref(
  basePath: string,
  sp: RawSearchParams,
  patch: Record<string, string | undefined> = {}
): string {
  const out = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    const val = one(v);
    if (val) out.set(k, val);
  }
  // any filter change goes back to page 1
  if (!('page' in patch)) out.delete('page');
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined || v === '') out.delete(k);
    else out.set(k, v);
  }
  const qs = out.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}
