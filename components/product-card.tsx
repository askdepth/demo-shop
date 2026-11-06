// Location: components/product-card.tsx

import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Price } from '@/components/store/price';
import { RatingStars } from '@/components/store/rating-stars';
import { formatCurrency } from '@/lib/utils';
import { FREE_SHIPPING_THRESHOLD, deliveryDate } from '@/lib/site';
import { AddToCart } from './add-to-cart';

interface ProductCardProps {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice?: number | null;
  image?: string;
  rating?: number;
  reviewCount?: number;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  category?: { name: string; slug: string };
  brand?: string | null;
  inStock?: boolean;
  stockLeft?: number | null;
  badge?: string;
  /** Fixed width card for horizontal shelves. */
  compact?: boolean;
}

export function ProductCard({
  id,
  name,
  slug,
  price,
  comparePrice,
  image,
  rating = 0,
  reviewCount = 0,
  brand,
  inStock = true,
  stockLeft,
  badge,
  compact,
}: ProductCardProps) {
  const isOnSale = !!comparePrice && comparePrice > price;
  const discountPercentage = isOnSale
    ? Math.round(((comparePrice! - price) / comparePrice!) * 100)
    : 0;
  const freeShipping = price >= FREE_SHIPPING_THRESHOLD;

  return (
    <Card
      data-testid="product-card"
      className="group relative flex h-full flex-col overflow-hidden transition-shadow duration-300 hover:shadow-lg"
    >
      <div className="relative aspect-square overflow-hidden bg-muted/40">
        <Link href={`/products/${slug}`} className="block h-full" aria-label={name}>
          <Image
            src={image || '/images/placeholder.svg'}
            alt={name}
            fill
            className="object-contain p-2 transition-transform duration-300 group-hover:scale-105"
            sizes={compact ? '220px' : '(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw'}
          />
        </Link>
        <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
          {badge && (
            <Badge className="rounded-sm bg-orange-500 text-[11px] font-semibold text-white hover:bg-orange-500">
              {badge}
            </Badge>
          )}
          {isOnSale && (
            <Badge className="rounded-sm bg-red-600 text-[11px] font-semibold text-white hover:bg-red-600">
              -{discountPercentage}%
            </Badge>
          )}
        </div>
      </div>

      <CardContent className="flex flex-1 flex-col p-3">
        {brand && <p className="text-xs text-muted-foreground">{brand}</p>}
        <Link href={`/products/${slug}`}>
          <h3
            className="line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-snug hover:text-orange-700 hover:underline"
            data-testid="product-name"
          >
            {name}
          </h3>
        </Link>

        {reviewCount > 0 && (
          <div className="mt-1 flex items-center gap-1.5" data-testid="product-rating">
            <RatingStars rating={rating} />
            <span className="text-xs text-sky-700">{reviewCount.toLocaleString()}</span>
          </div>
        )}

        <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2">
          <Price value={price} />
          {isOnSale && (
            <span className="text-xs text-muted-foreground">
              List: <span className="line-through">{formatCurrency(comparePrice!)}</span>
            </span>
          )}
        </div>

        <div className="mt-1 space-y-0.5 text-xs">
          {inStock ? (
            <>
              <p className="text-muted-foreground">
                {freeShipping ? (
                  <>
                    <span className="font-semibold text-sky-800">FREE delivery</span>{' '}
                    <span className="font-semibold">{deliveryDate(1)}</span>
                  </>
                ) : (
                  <>
                    Delivery <span className="font-semibold">{deliveryDate(2)}</span>
                  </>
                )}
              </p>
              {stockLeft ? (
                <p className="font-medium text-red-700">Only {stockLeft} left in stock - order soon.</p>
              ) : null}
            </>
          ) : (
            <p className="font-medium text-red-700">Currently unavailable</p>
          )}
        </div>

        <div className="mt-auto pt-3">
          <AddToCart
            productId={id}
            disabled={!inStock}
            size="sm"
            className="w-full rounded-full bg-amber-400 text-black hover:bg-amber-500"
          />
        </div>
      </CardContent>
    </Card>
  );
}
