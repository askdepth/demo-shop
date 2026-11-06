// File: app/(store)/category/[slug]/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ProductListing } from '@/components/store/listing';
import { Shelf } from '@/components/store/shelf';
import type { RawSearchParams } from '@/lib/listing-params';
import { getCategoryWithTrail, getShelf } from '@/server/queries/catalog';

export const dynamic = 'force-dynamic';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<RawSearchParams>;
}

export async function generateMetadata(props: CategoryPageProps): Promise<Metadata> {
  const { slug } = await props.params;
  const category = await getCategoryWithTrail(slug);
  if (!category) return { title: 'Category Not Found' };
  return {
    title: category.name,
    description: category.description || `Shop ${category.name.toLowerCase()} at great prices.`,
  };
}

export default async function CategoryPage(props: CategoryPageProps) {
  const { slug } = await props.params;
  const searchParams = await props.searchParams;
  const category = await getCategoryWithTrail(slug);
  if (!category) notFound();

  const isFirstPage = !searchParams.page || searchParams.page === '1';
  const hasFilters = Object.keys(searchParams).some(k => k !== 'page');
  const bestsellers =
    isFirstPage && !hasFilters ? await getShelf('bestsellers', 10, slug) : [];

  return (
    <>
      <div className="mx-auto max-w-[1500px] px-3 pt-4 sm:px-4">
        <nav aria-label="Breadcrumb" className="text-sm text-gray-600">
          <Link href="/" className="hover:text-orange-700 hover:underline">Home</Link>
          <span className="mx-1">›</span>
          {category.parent && (
            <>
              <Link href={`/category/${category.parent.slug}`} className="hover:text-orange-700 hover:underline">
                {category.parent.name}
              </Link>
              <span className="mx-1">›</span>
            </>
          )}
          <span className="font-semibold text-gray-900">{category.name}</span>
        </nav>
        {category.description && <p className="mt-2 text-sm text-gray-600">{category.description}</p>}
        {category.children.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2" data-testid="subcategories">
            {category.children.map(c => (
              <Link
                key={c.id}
                href={`/category/${c.slug}`}
                className="rounded-full border bg-white px-3 py-1 text-sm hover:border-orange-500 hover:text-orange-700"
              >
                {c.name}
              </Link>
            ))}
          </div>
        )}
      </div>

      <ProductListing
        basePath={`/category/${slug}`}
        searchParams={searchParams}
        fixedCategory={slug}
        heading={category.name}
        showCategoryFacet={false}
      />

      {bestsellers.length > 0 && (
        <div className="mx-auto max-w-[1500px] px-3 pb-6 sm:px-4">
          <Shelf title={`Best sellers in ${category.name}`} products={bestsellers} />
        </div>
      )}
    </>
  );
}
