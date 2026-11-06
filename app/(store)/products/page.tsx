// File: app/(store)/products/page.tsx
import type { Metadata } from 'next';
import { ProductListing } from '@/components/store/listing';
import type { RawSearchParams } from '@/lib/listing-params';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'All Products',
  description: 'Browse the full catalog: filter by brand, price and customer rating.',
};

export default async function ProductsPage(props: {
  searchParams: Promise<RawSearchParams>;
}) {
  const searchParams = await props.searchParams;
  return (
    <ProductListing
      basePath="/products"
      searchParams={searchParams}
      heading={searchParams.q ? undefined : 'All products'}
    />
  );
}
