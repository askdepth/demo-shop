// File: app/page.tsx
import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { HeroCarousel, type Slide } from '@/components/store/hero-carousel';
import { Shelf } from '@/components/store/shelf';
import { DealCountdown } from '@/components/store/deal-countdown';
import { RecentlyViewed } from '@/components/store/recently-viewed';
import { SITE_NAME } from '@/lib/site';
import {
  getBestSellerSlugs,
  getCategoryTree,
  getShelf,
} from '@/server/queries/catalog';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Home',
  description: `${SITE_NAME}: deals, best sellers and new arrivals across electronics, home, kitchen, fashion and more.`,
};

const SLIDES: Slide[] = [
  {
    eyebrow: 'Deals of the day',
    title: 'Up to 40% off top electronics',
    text: 'Phones, laptops and headphones at their lowest prices of the season.',
    cta: 'Shop deals',
    href: '/search?deals=1',
    from: '#1e3a8a',
    to: '#3b82f6',
    emoji: '🎧',
  },
  {
    eyebrow: 'Home & kitchen',
    title: 'Upgrade your kitchen this season',
    text: 'Air fryers, espresso machines and cookware your kitchen deserves.',
    cta: 'Explore kitchen',
    href: '/category/kitchen-dining',
    from: '#9a3412',
    to: '#f59e0b',
    emoji: '🍳',
  },
  {
    eyebrow: 'New arrivals',
    title: 'Fresh finds, just landed',
    text: 'Be the first to shop the latest products across every category.',
    cta: 'See what is new',
    href: '/products?sort=newest',
    from: '#065f46',
    to: '#14b8a6',
    emoji: '🛍️',
  },
  {
    eyebrow: 'Free shipping',
    title: 'Free delivery on orders over $75',
    text: 'Plus 30-day easy returns on everything we sell.',
    cta: 'Start shopping',
    href: '/products',
    from: '#581c87',
    to: '#ec4899',
    emoji: '📦',
  },
];

export default async function HomePage() {
  const [tree, deals, bestsellers, topRated, fresh, bestSellerSlugs] = await Promise.all([
    getCategoryTree(),
    getShelf('deals', 12),
    getShelf('bestsellers', 12),
    getShelf('top-rated', 12),
    getShelf('new', 12),
    getBestSellerSlugs(),
  ]);

  // First four top-level categories get "tile" cards; ones with sub-categories show a 2x2 grid.
  const tileCards = tree.slice(0, 8);

  return (
    <div className="bg-gray-100 pb-10">
      <HeroCarousel slides={SLIDES} />

      <div className="relative z-10 mx-auto -mt-28 max-w-[1500px] space-y-4 px-3 sm:-mt-32 sm:px-4">
        {/* Category cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" data-testid="category-cards">
          {tileCards.map(cat => {
            const tiles = cat.children.length >= 2 ? cat.children.slice(0, 4) : [];
            return (
              <div key={cat.id} className="flex flex-col rounded-md bg-white p-4 shadow-sm">
                <h2 className="mb-3 text-xl font-bold text-gray-900">{cat.name}</h2>
                {tiles.length ? (
                  <div className="grid flex-1 grid-cols-2 gap-3">
                    {tiles.map(t => (
                      <Link key={t.id} href={`/category/${t.slug}`} className="group">
                        <div className="relative aspect-square overflow-hidden rounded bg-muted/40">
                          <Image
                            src={t.image || '/images/placeholder.svg'}
                            alt={t.name}
                            fill
                            sizes="150px"
                            className="object-cover transition-transform group-hover:scale-105"
                          />
                        </div>
                        <p className="mt-1 text-xs text-gray-700">{t.name}</p>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <Link href={`/category/${cat.slug}`} className="group flex-1">
                    <div className="relative aspect-square overflow-hidden rounded bg-muted/40">
                      <Image
                        src={cat.image || '/images/placeholder.svg'}
                        alt={cat.name}
                        fill
                        sizes="300px"
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                    </div>
                  </Link>
                )}
                <Link
                  href={`/category/${cat.slug}`}
                  className="mt-3 text-sm text-sky-700 hover:text-orange-700 hover:underline"
                >
                  See more
                </Link>
              </div>
            );
          })}
        </div>

        <Shelf
          title="Deals of the Day"
          products={deals}
          href="/search?deals=1"
          linkLabel="See all deals"
          right={<DealCountdown />}
        />
        <Shelf
          title="Best Sellers"
          products={bestsellers}
          href="/products?sort=popular"
          bestSellers={bestSellerSlugs}
        />
        <Shelf
          title="Top rated by customers"
          products={topRated}
          href="/products?sort=rating"
          bestSellers={bestSellerSlugs}
        />
        <Shelf
          title="New arrivals"
          products={fresh}
          href="/products?sort=newest"
          bestSellers={bestSellerSlugs}
        />
        <RecentlyViewed />
      </div>
    </div>
  );
}
