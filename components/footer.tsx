import Link from 'next/link';
import { BackToTop } from '@/components/store/back-to-top';

interface FooterProps {
  siteName: string;
  categories: { name: string; slug: string }[];
}

export function Footer({ siteName, categories }: FooterProps) {
  return (
    <footer className="mt-12 text-sm text-gray-300" data-testid="site-footer">
      <BackToTop />
      <div className="bg-[#232f3e]">
        <div className="mx-auto grid max-w-[1200px] grid-cols-2 gap-8 px-6 py-10 md:grid-cols-4">
          <div>
            <h3 className="mb-3 text-base font-bold text-white">Shop</h3>
            <ul className="space-y-2">
              <li><Link href="/products" className="hover:underline">All products</Link></li>
              <li><Link href="/search?deals=1" className="hover:underline">Today&apos;s Deals</Link></li>
              {categories.slice(0, 4).map(c => (
                <li key={c.slug}>
                  <Link href={`/category/${c.slug}`} className="hover:underline">{c.name}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-base font-bold text-white">More categories</h3>
            <ul className="space-y-2">
              {categories.slice(4).map(c => (
                <li key={c.slug}>
                  <Link href={`/category/${c.slug}`} className="hover:underline">{c.name}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-base font-bold text-white">Your Account</h3>
            <ul className="space-y-2">
              <li><Link href="/profile" className="hover:underline">Your Account</Link></li>
              <li><Link href="/orders" className="hover:underline">Your Orders</Link></li>
              <li><Link href="/cart" className="hover:underline">Shopping Cart</Link></li>
              <li><Link href="/auth/signin" className="hover:underline">Sign in</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-base font-bold text-white">Customer Service</h3>
            <ul className="space-y-2">
              <li>Free shipping on orders over $75</li>
              <li>30-day easy returns</li>
              <li>Secure demo checkout</li>
            </ul>
          </div>
        </div>
      </div>
      <div className="bg-[#131921] px-6 py-6 text-center text-xs">
        <p className="text-base font-bold text-white">
          {siteName}
          <span className="text-orange-400">.</span>
        </p>
        <p className="mt-2">
          © 2026 {siteName}. A fictional demo store: all products, brands, reviews and orders are made up.
        </p>
      </div>
    </footer>
  );
}
