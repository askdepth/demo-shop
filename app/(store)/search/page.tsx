// File: app/(store)/search/page.tsx
import type { Metadata } from 'next';
import { ProductListing } from '@/components/store/listing';
import type { RawSearchParams } from '@/lib/listing-params';

export const dynamic = 'force-dynamic';

export async function generateMetadata(props: {
  searchParams: Promise<RawSearchParams>;
}): Promise<Metadata> {
  const sp = await props.searchParams;
  const q = Array.isArray(sp.q) ? sp.q[0] : sp.q;
  if (!q) return { title: sp.deals === '1' ? "Today's Deals" : 'Search Products' };
  return { title: `Search results for "${q}"` };
}

export default async function SearchPage(props: {
  searchParams: Promise<RawSearchParams>;
}) {
  const searchParams = await props.searchParams;
  const q = Array.isArray(searchParams.q) ? searchParams.q[0] : searchParams.q;
  const heading = q
    ? `Results for "${q}"`
    : searchParams.deals === '1'
      ? "Today's Deals"
      : 'All products';
  return <ProductListing basePath="/search" searchParams={searchParams} heading={heading} />;
}
