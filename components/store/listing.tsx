// Shared server-rendered product listing used by /products, /search and /category/[slug].
import Link from 'next/link';
import { Suspense } from 'react';
import { ProductGrid } from '@/components/product-grid';
import { RatingStars } from '@/components/store/rating-stars';
import { SortDropdown } from '@/components/store/sort-dropdown';
import { buildHref, parseListing, type RawSearchParams } from '@/lib/listing-params';
import { cn } from '@/lib/utils';
import { getBestSellerSlugs, getFacets, listProducts } from '@/server/queries/catalog';

const PRICE_RANGES = [
  { label: 'Under $25', min: undefined, max: '25' },
  { label: '$25 to $50', min: '25', max: '50' },
  { label: '$50 to $100', min: '50', max: '100' },
  { label: '$100 to $250', min: '100', max: '250' },
  { label: '$250 to $1,000', min: '250', max: '1000' },
  { label: '$1,000 & above', min: '1000', max: undefined },
];

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b pb-4 last:border-0">
      <h3 className="mb-2 text-sm font-bold text-gray-900">{title}</h3>
      <div className="space-y-1 text-sm">{children}</div>
    </div>
  );
}

function FilterLink({
  href,
  active,
  children,
}: {
  href: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn('block hover:text-orange-700', active ? 'font-bold text-gray-900' : 'text-gray-700')}
      aria-current={active ? 'true' : undefined}
    >
      {children}
    </Link>
  );
}

export async function ProductListing({
  basePath,
  searchParams,
  fixedCategory,
  heading,
  showCategoryFacet = true,
}: {
  basePath: string;
  searchParams: RawSearchParams;
  fixedCategory?: string;
  heading?: string;
  showCategoryFacet?: boolean;
}) {
  const params = parseListing(searchParams, fixedCategory);
  const [result, facets, bestSellers] = await Promise.all([
    listProducts(params),
    getFacets({ q: params.q, category: params.category }),
    getBestSellerSlugs(),
  ]);

  const href = (patch: Record<string, string | undefined>) => buildHref(basePath, searchParams, patch);
  const selectedBrands = params.brands ?? [];
  const activeFilters =
    selectedBrands.length +
    Number(params.minPrice !== undefined || params.maxPrice !== undefined) +
    Number(!!params.minRating) +
    Number(!!params.inStockOnly) +
    Number(!!params.dealsOnly);

  const from = result.total === 0 ? 0 : (result.page - 1) * result.limit + 1;
  const to = Math.min(result.total, result.page * result.limit);

  return (
    <div className="mx-auto max-w-[1500px] px-3 py-4 sm:px-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b pb-3">
        <div>
          <h1 className="text-lg font-bold text-gray-900 sm:text-xl" data-testid="listing-heading">
            {heading ?? (params.q ? `Results for "${params.q}"` : 'All products')}
          </h1>
          <p className="text-sm text-gray-600" data-testid="result-count">
            {result.total === 0
              ? 'No results'
              : `${from}-${to} of ${result.total.toLocaleString()} result${result.total === 1 ? '' : 's'}`}
          </p>
        </div>
        <Suspense>
          <SortDropdown value={params.sort ?? 'featured'} />
        </Suspense>
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        {/* Filters */}
        <aside className="space-y-4" aria-label="Filters" data-testid="filters">
          {activeFilters > 0 && (
            <Link
              href={buildHref(basePath, { q: searchParams.q, category: searchParams.category, sort: searchParams.sort })}
              className="inline-block text-sm text-sky-700 hover:underline"
            >
              Clear all filters ({activeFilters})
            </Link>
          )}

          {showCategoryFacet && facets.categories.length > 0 && (
            <FilterGroup title="Department">
              {params.category && (
                <FilterLink href={href({ category: undefined })}>‹ All departments</FilterLink>
              )}
              {facets.categories.map(c => (
                <FilterLink key={c.slug} href={href({ category: c.slug })} active={params.category === c.slug}>
                  {c.name} <span className="text-gray-500">({c.count})</span>
                </FilterLink>
              ))}
            </FilterGroup>
          )}

          <FilterGroup title="Customer Reviews">
            {[4, 3, 2, 1].map(r => (
              <Link
                key={r}
                href={href({ rating: params.minRating === r ? undefined : String(r) })}
                className={cn(
                  'flex items-center gap-1 hover:text-orange-700',
                  params.minRating === r && 'font-bold'
                )}
              >
                <RatingStars rating={r} /> <span>&amp; Up</span>
              </Link>
            ))}
          </FilterGroup>

          {facets.brands.length > 0 && (
            <FilterGroup title="Brand">
              {facets.brands.map(b => {
                const on = selectedBrands.includes(b.value);
                const next = on ? selectedBrands.filter(x => x !== b.value) : [...selectedBrands, b.value];
                return (
                  <Link
                    key={b.value}
                    href={href({ brand: next.join(',') || undefined })}
                    className="flex items-center gap-2 text-gray-700 hover:text-orange-700"
                  >
                    <span
                      className={cn(
                        'flex h-4 w-4 items-center justify-center rounded-sm border text-[10px]',
                        on ? 'border-orange-500 bg-orange-500 text-white' : 'border-gray-400'
                      )}
                      aria-hidden
                    >
                      {on ? '✓' : ''}
                    </span>
                    <span className={on ? 'font-bold' : ''}>
                      {b.value} <span className="text-gray-500">({b.count})</span>
                    </span>
                  </Link>
                );
              })}
            </FilterGroup>
          )}

          <FilterGroup title="Price">
            {PRICE_RANGES.map(r => {
              const active =
                (r.min ?? undefined) === (params.minPrice?.toString() ?? undefined) &&
                (r.max ?? undefined) === (params.maxPrice?.toString() ?? undefined);
              return (
                <FilterLink
                  key={r.label}
                  href={href(active ? { minPrice: undefined, maxPrice: undefined } : { minPrice: r.min, maxPrice: r.max })}
                  active={active}
                >
                  {r.label}
                </FilterLink>
              );
            })}
            <form action={basePath} className="mt-2 flex items-center gap-1">
              {Object.entries(searchParams).map(([k, v]) =>
                ['minPrice', 'maxPrice', 'page'].includes(k) || typeof v !== 'string' ? null : (
                  <input key={k} type="hidden" name={k} value={v} />
                )
              )}
              <input
                name="minPrice"
                type="number"
                min={0}
                placeholder="$ Min"
                defaultValue={params.minPrice}
                aria-label="Minimum price"
                className="w-16 rounded border px-1.5 py-1 text-xs"
              />
              <input
                name="maxPrice"
                type="number"
                min={0}
                placeholder="$ Max"
                defaultValue={params.maxPrice}
                aria-label="Maximum price"
                className="w-16 rounded border px-1.5 py-1 text-xs"
              />
              <button type="submit" className="rounded border bg-gray-100 px-2 py-1 text-xs hover:bg-gray-200">
                Go
              </button>
            </form>
          </FilterGroup>

          <FilterGroup title="Availability & deals">
            <FilterLink href={href({ instock: params.inStockOnly ? undefined : '1' })} active={params.inStockOnly}>
              {params.inStockOnly ? '✓ ' : ''}In stock only
            </FilterLink>
            <FilterLink href={href({ deals: params.dealsOnly ? undefined : '1' })} active={params.dealsOnly}>
              {params.dealsOnly ? '✓ ' : ''}Today&apos;s Deals
            </FilterLink>
          </FilterGroup>
        </aside>

        {/* Results */}
        <div>
          <ProductGrid products={result.products} bestSellers={bestSellers} columns={4} />

          {result.totalPages > 1 && (
            <nav className="mt-8 flex items-center justify-center gap-1 text-sm" aria-label="Pagination">
              {result.page > 1 && (
                <Link href={href({ page: String(result.page - 1) })} className="rounded border px-3 py-1.5 hover:bg-gray-100">
                  ‹ Previous
                </Link>
              )}
              {Array.from({ length: result.totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === result.totalPages || Math.abs(p - result.page) <= 2)
                .map((p, idx, arr) => (
                  <span key={p} className="flex items-center gap-1">
                    {idx > 0 && p - arr[idx - 1]! > 1 && <span className="px-1">…</span>}
                    <Link
                      href={href({ page: String(p) })}
                      className={cn(
                        'rounded border px-3 py-1.5 hover:bg-gray-100',
                        p === result.page && 'border-orange-500 font-bold ring-1 ring-orange-500'
                      )}
                      aria-current={p === result.page ? 'page' : undefined}
                    >
                      {p}
                    </Link>
                  </span>
                ))}
              {result.page < result.totalPages && (
                <Link href={href({ page: String(result.page + 1) })} className="rounded border px-3 py-1.5 hover:bg-gray-100">
                  Next ›
                </Link>
              )}
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
