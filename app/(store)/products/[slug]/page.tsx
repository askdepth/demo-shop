// File: app/(store)/products/[slug]/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MapPin, RotateCcw, ShieldCheck, Truck } from 'lucide-react';
import { AddToCart } from '@/components/add-to-cart';
import { JsonLd } from '@/components/jsonld';
import { BuyNow } from '@/components/store/buy-now';
import { FrequentlyBought } from '@/components/store/frequently-bought';
import { Price } from '@/components/store/price';
import { ProductGallery } from '@/components/store/product-gallery';
import { RatingStars } from '@/components/store/rating-stars';
import { RecentlyViewed, TrackView } from '@/components/store/recently-viewed';
import { ReviewsSection } from '@/components/store/reviews-section';
import { Shelf } from '@/components/store/shelf';
import { getCurrentSession } from '@/lib/auth';
import { FREE_SHIPPING_THRESHOLD, SITE_NAME, deliveryDate } from '@/lib/site';
import { formatCurrency } from '@/lib/utils';
import {
  getBestSellerSlugs,
  getFrequentlyBoughtWith,
  getProductDetail,
  getRelated,
} from '@/server/queries/catalog';

export const dynamic = 'force-dynamic';

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata(props: ProductPageProps): Promise<Metadata> {
  const { slug } = await props.params;
  const detail = await getProductDetail(slug);
  if (!detail) return { title: 'Product Not Found' };
  const { product } = detail;
  const images = product.images.map(i => ({ url: i.url, alt: product.name }));
  return {
    title: product.name,
    description: product.description || undefined,
    openGraph: { title: product.name, description: product.description || undefined, type: 'website', images },
    twitter: { card: 'summary_large_image', title: product.name, images: images.map(i => i.url) },
  };
}

export default async function ProductPage(props: ProductPageProps) {
  const { slug } = await props.params;
  const detail = await getProductDetail(slug);
  if (!detail) notFound();

  const { product, reviews, histogram, questions, stock } = detail;
  const price = Number(product.price);
  const comparePrice = product.comparePrice ? Number(product.comparePrice) : null;
  const onSale = !!comparePrice && comparePrice > price;
  const savePct = onSale ? Math.round(((comparePrice! - price) / comparePrice!) * 100) : 0;
  const inStock = !product.trackQuantity || stock > 0;
  const lowStock = inStock && product.trackQuantity && stock <= 5;
  const freeShipping = price >= FREE_SHIPPING_THRESHOLD;
  const specs = (product.specs ?? {}) as Record<string, string>;

  const [session, related, together, bestSellers] = await Promise.all([
    getCurrentSession(),
    getRelated(product.id, product.categoryId),
    getFrequentlyBoughtWith(product.id, product.categoryId),
    getBestSellerSlugs(),
  ]);
  const isBestSeller = bestSellers.has(product.slug);

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.images.map(i => i.url),
    sku: product.sku,
    brand: { '@type': 'Brand', name: product.brand ?? SITE_NAME },
    offers: {
      '@type': 'Offer',
      price,
      priceCurrency: 'USD',
      availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: { '@type': 'Organization', name: SITE_NAME },
    },
    ...(product.reviewCount > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.avgRating,
        reviewCount: product.reviewCount,
      },
    }),
  };

  const maxQty = Math.max(0, Math.min(10, stock));

  return (
    <>
      <JsonLd data={structuredData} />
      <TrackView
        item={{ slug: product.slug, name: product.name, price, image: product.images[0]?.url }}
      />

      <div className="mx-auto max-w-[1500px] px-3 py-4 sm:px-6">
        <nav aria-label="Breadcrumb" className="mb-4 text-sm text-gray-600">
          <Link href="/" className="hover:text-orange-700 hover:underline">Home</Link>
          {product.category?.parent && (
            <>
              <span className="mx-1">›</span>
              <Link href={`/category/${product.category.parent.slug}`} className="hover:text-orange-700 hover:underline">
                {product.category.parent.name}
              </Link>
            </>
          )}
          {product.category && (
            <>
              <span className="mx-1">›</span>
              <Link href={`/category/${product.category.slug}`} className="hover:text-orange-700 hover:underline">
                {product.category.name}
              </Link>
            </>
          )}
        </nav>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,4fr)_290px]">
          <ProductGallery images={product.images} name={product.name} />

          {/* Details */}
          <div>
            <h1 className="text-2xl font-medium leading-snug text-gray-900" data-testid="product-title">
              {product.name}
            </h1>
            {product.brand && (
              <Link
                href={`/search?brand=${encodeURIComponent(product.brand)}`}
                className="text-sm text-sky-700 hover:text-orange-700 hover:underline"
              >
                Visit the {product.brand} store
              </Link>
            )}
            {product.reviewCount > 0 && (
              <a href="#reviews" className="mt-1 flex items-center gap-2 text-sm" data-testid="rating-summary">
                <span className="font-medium">{product.avgRating.toFixed(1)}</span>
                <RatingStars rating={product.avgRating} size="md" />
                <span className="text-sky-700 hover:text-orange-700 hover:underline">
                  {product.reviewCount.toLocaleString()} ratings
                </span>
              </a>
            )}
            {isBestSeller && (
              <span className="mt-2 inline-block rounded-sm bg-orange-500 px-2 py-0.5 text-xs font-semibold text-white">
                Best Seller
              </span>
            )}

            <hr className="my-3" />

            <div className="flex flex-wrap items-baseline gap-3">
              {onSale && <span className="text-2xl font-light text-red-700">-{savePct}%</span>}
              <Price value={price} size="lg" />
            </div>
            {onSale && (
              <p className="text-sm text-muted-foreground">
                List Price: <span className="line-through">{formatCurrency(comparePrice!)}</span>
              </p>
            )}
            <p className="mt-1 text-sm text-gray-700">
              {freeShipping ? 'FREE delivery' : `$5.99 delivery`} &amp; free 30-day returns.
            </p>

            {product.bullets.length > 0 && (
              <>
                <h2 className="mt-5 text-base font-bold">About this item</h2>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm" data-testid="product-bullets">
                  {product.bullets.map(b => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </>
            )}
            {product.description && <p className="mt-4 text-sm text-gray-700">{product.description}</p>}

            <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <Truck className="mx-auto h-7 w-7 text-sky-700" />
                <p className="mt-1">Free delivery over ${FREE_SHIPPING_THRESHOLD}</p>
              </div>
              <div>
                <RotateCcw className="mx-auto h-7 w-7 text-sky-700" />
                <p className="mt-1">30-day returns</p>
              </div>
              <div>
                <ShieldCheck className="mx-auto h-7 w-7 text-sky-700" />
                <p className="mt-1">Secure demo checkout</p>
              </div>
            </div>
          </div>

          {/* Buy box */}
          <aside className="h-fit rounded-lg border p-4 lg:sticky lg:top-32" data-testid="buy-box" aria-label="Buy box">
            <Price value={price} size="lg" />
            <p className="mt-2 text-sm">
              {freeShipping ? (
                <span className="font-semibold text-sky-800">FREE delivery </span>
              ) : (
                <span>Delivery </span>
              )}
              <span className="font-bold">{deliveryDate(freeShipping ? 1 : 2)}</span>
            </p>
            <p className="mt-2 flex items-center gap-1 text-sm text-sky-700">
              <MapPin className="h-4 w-4" /> Deliver to New York 10001
            </p>

            <p
              className={`mt-3 text-lg font-medium ${inStock ? 'text-green-700' : 'text-red-700'}`}
              data-testid="stock-status"
            >
              {inStock ? (lowStock ? `Only ${stock} left in stock - order soon.` : 'In Stock') : 'Currently unavailable'}
            </p>

            <div className="mt-3 space-y-3">
              <AddToCart
                productId={product.id}
                showQuantitySelector
                maxQuantity={maxQty}
                disabled={!inStock}
                className="rounded-full bg-amber-400 text-black hover:bg-amber-500"
              />
              <BuyNow productId={product.id} disabled={!inStock} />
            </div>

            <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs text-gray-600">
              <dt>Ships from</dt>
              <dd>{SITE_NAME}</dd>
              <dt>Sold by</dt>
              <dd>{product.brand ?? SITE_NAME}</dd>
              <dt>Returns</dt>
              <dd className="text-sky-700">30-day refund / replacement</dd>
            </dl>
          </aside>
        </div>

        <div className="mt-10 space-y-10">
          {together.length > 0 && (
            <FrequentlyBought
              items={[
                { id: product.id, name: product.name, slug: product.slug, price, image: product.images[0]?.url },
                ...together.map(t => ({ id: t.id, name: t.name, slug: t.slug, price: t.price, image: t.image })),
              ]}
            />
          )}

          <Shelf title="Customers also viewed" products={related} bestSellers={bestSellers} />

          {Object.keys(specs).length > 0 && (
            <section id="specs" data-testid="specifications">
              <h2 className="mb-3 text-xl font-bold">Product information</h2>
              <table className="w-full max-w-2xl text-sm">
                <tbody>
                  {[
                    ...Object.entries(specs),
                    ['SKU', product.sku ?? '-'],
                    ['Category', product.category?.name ?? '-'],
                    ['Date first available', new Intl.DateTimeFormat('en-US', { dateStyle: 'long' }).format(product.createdAt)],
                  ].map(([k, v]) => (
                    <tr key={k} className="border-b odd:bg-gray-50">
                      <th scope="row" className="w-1/3 px-3 py-2 text-left font-semibold">{k}</th>
                      <td className="px-3 py-2">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          <ReviewsSection
            productId={product.id}
            avgRating={product.avgRating}
            reviewCount={product.reviewCount}
            histogram={histogram}
            reviews={reviews.map(r => ({ ...r, createdAt: r.createdAt.toISOString() }))}
            questions={questions.map(q => ({
              id: q.id,
              question: q.question,
              answer: q.answer,
              answeredBy: q.answeredBy,
              askerName: q.askerName,
              votes: q.votes,
            }))}
            signedInName={session?.user?.name}
          />

          <RecentlyViewed excludeSlug={product.slug} title="Your recently viewed items" />
        </div>
      </div>
    </>
  );
}
