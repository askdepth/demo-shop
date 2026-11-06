'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { ChevronDown, MapPin, Menu } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { CartDrawer } from '@/components/cart-drawer';
import { SearchBar } from '@/components/store/search-bar';

interface HeaderProps {
  siteName: string;
  categories: { name: string; slug: string }[];
}

export function Header({ siteName, categories }: HeaderProps) {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const firstName = session?.user?.name?.split(' ')[0];

  const close = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-40 text-white" data-testid="site-header">
      {/* Main bar */}
      <div className="bg-[#131921]">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-2 px-3 py-2 sm:gap-4 md:flex-nowrap">
          <Link
            href="/"
            className="mr-auto shrink-0 md:mr-0 rounded border border-transparent px-2 py-1 text-xl font-extrabold tracking-tight hover:border-white"
            data-testid="site-logo"
          >
            {siteName}
            <span className="text-orange-400">.</span>
          </Link>

          <div className="hidden shrink-0 items-center gap-1 rounded border border-transparent px-2 py-1 text-xs leading-tight hover:border-white lg:flex">
            <MapPin className="h-4 w-4 self-end" />
            <div>
              <div className="text-gray-300">Deliver to</div>
              <div className="font-bold">New York 10001</div>
            </div>
          </div>

          <div className="order-last flex basis-full md:order-none md:basis-0 md:flex-1">
            <Suspense fallback={<div className="h-10 flex-1 rounded-md bg-white" />}>
              <SearchBar categories={categories} />
            </Suspense>
          </div>

          {/* Account */}
          <div className="group relative hidden shrink-0 md:block">
            <div className="cursor-pointer rounded border border-transparent px-2 py-1 text-xs leading-tight group-hover:border-white">
              <div>Hello, {firstName ?? 'sign in'}</div>
              <div className="flex items-center font-bold">
                Account &amp; Lists <ChevronDown className="ml-0.5 h-3 w-3" />
              </div>
            </div>
            <div className="invisible absolute right-0 top-full z-50 w-56 rounded-md bg-white p-4 text-sm text-gray-900 opacity-0 shadow-xl transition group-hover:visible group-hover:opacity-100">
              {session?.user ? (
                <div className="space-y-2">
                  <Link href="/profile" className="block hover:text-orange-700 hover:underline">
                    Your Account
                  </Link>
                  <Link href="/orders" className="block hover:text-orange-700 hover:underline">
                    Your Orders
                  </Link>
                  {session.user.role === 'ADMIN' && (
                    <Link href="/admin/products" className="block hover:text-orange-700 hover:underline">
                      Admin
                    </Link>
                  )}
                  <button
                    type="button"
                    className="block text-left hover:text-orange-700 hover:underline"
                    onClick={() => signOut()}
                  >
                    Sign out
                  </button>
                </div>
              ) : (
                <div className="space-y-2 text-center">
                  <Link
                    href="/auth/signin"
                    className="block rounded-full bg-amber-400 py-1.5 font-medium text-black hover:bg-amber-500"
                  >
                    Sign in
                  </Link>
                  <p className="text-xs">
                    New customer?{' '}
                    <Link href="/auth/signup" className="text-sky-700 hover:underline">
                      Start here.
                    </Link>
                  </p>
                </div>
              )}
            </div>
          </div>

          <Link
            href="/orders"
            className="hidden shrink-0 rounded border border-transparent px-2 py-1 text-xs leading-tight hover:border-white md:block"
          >
            <div>Returns</div>
            <div className="font-bold">&amp; Orders</div>
          </Link>

          <CartDrawer />
        </div>
      </div>

      {/* Category bar */}
      <div className="bg-[#232f3e]">
        <nav
          className="mx-auto flex max-w-[1500px] items-center gap-1 overflow-x-auto whitespace-nowrap px-3 py-1.5 text-sm"
          aria-label="Categories"
        >
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-1 rounded border border-transparent px-2 py-1 font-bold hover:border-white"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" /> All
              </button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle>Hello, {firstName ?? 'sign in'}</SheetTitle>
              </SheetHeader>
              <nav className="mt-6 flex flex-col gap-3 text-sm">
                <Link href="/products" onClick={close} className="font-semibold">
                  All products
                </Link>
                <Link href="/search?deals=1" onClick={close} className="font-semibold">
                  Today&apos;s Deals
                </Link>
                <div className="my-1 border-t" />
                {categories.map(c => (
                  <Link key={c.slug} href={`/category/${c.slug}`} onClick={close}>
                    {c.name}
                  </Link>
                ))}
                <div className="my-1 border-t" />
                {session?.user ? (
                  <>
                    <Link href="/profile" onClick={close}>
                      Your Account
                    </Link>
                    <Link href="/orders" onClick={close}>
                      Your Orders
                    </Link>
                    {session.user.role === 'ADMIN' && (
                      <Link href="/admin/products" onClick={close}>
                        Admin
                      </Link>
                    )}
                    <button type="button" className="text-left" onClick={() => signOut()}>
                      Sign out
                    </button>
                  </>
                ) : (
                  <Link href="/auth/signin" onClick={close}>
                    Sign in
                  </Link>
                )}
              </nav>
            </SheetContent>
          </Sheet>

          <Link
            href="/search?deals=1"
            className="rounded border border-transparent px-2 py-1 font-semibold hover:border-white"
          >
            Today&apos;s Deals
          </Link>
          {categories.map(c => (
            <Link
              key={c.slug}
              href={`/category/${c.slug}`}
              className="rounded border border-transparent px-2 py-1 hover:border-white"
            >
              {c.name}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
