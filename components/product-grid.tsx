// Location: components/product-grid.tsx

import { ProductCard } from './product-card';
import type { CardProduct } from '@/server/queries/catalog';

interface ProductGridProps {
  products: CardProduct[];
  className?: string;
  bestSellers?: Set<string>;
  columns?: 3 | 4;
}

export function ProductGrid({ products, className, bestSellers, columns = 4 }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <h3 className="mb-2 text-lg font-semibold">No results found</h3>
        <p className="max-w-sm text-muted-foreground">
          We couldn&apos;t find any products matching your criteria. Try removing some filters
          or searching for something else.
        </p>
      </div>
    );
  }

  const cols =
    columns === 3
      ? 'grid-cols-2 lg:grid-cols-3'
      : 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4';

  return (
    <div className={`grid gap-4 ${cols} ${className || ''}`} data-testid="product-grid">
      {products.map(product => (
        <ProductCard
          key={product.id}
          {...product}
          badge={bestSellers?.has(product.slug) ? 'Best Seller' : undefined}
        />
      ))}
    </div>
  );
}
