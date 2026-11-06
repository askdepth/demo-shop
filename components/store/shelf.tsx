import Link from 'next/link';
import { ProductCard } from '@/components/product-card';
import type { CardProduct } from '@/server/queries/catalog';

interface ShelfProps {
  title: string;
  products: CardProduct[];
  href?: string;
  linkLabel?: string;
  badge?: string;
  bestSellers?: Set<string>;
  right?: React.ReactNode;
}

/** Horizontally scrolling product row, like Amazon's carousels. */
export function Shelf({ title, products, href, linkLabel = 'See all', badge, bestSellers, right }: ShelfProps) {
  if (!products.length) return null;
  return (
    <section className="rounded-md bg-white p-4 shadow-sm" data-testid="shelf">
      <div className="mb-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        {right}
        {href && (
          <Link href={href} className="text-sm text-sky-700 hover:text-orange-700 hover:underline">
            {linkLabel}
          </Link>
        )}
      </div>
      <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-2">
        {products.map(p => (
          <div key={p.id} className="w-[210px] shrink-0 snap-start">
            <ProductCard {...p} compact badge={badge ?? (bestSellers?.has(p.slug) ? 'Best Seller' : undefined)} />
          </div>
        ))}
      </div>
    </section>
  );
}
