'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';

interface Suggestions {
  products: { name: string; slug: string; category: { name: string } | null }[];
  categories: { name: string; slug: string }[];
}

export function SearchBar({
  categories,
}: {
  categories: { name: string; slug: string }[];
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');
  const [category, setCategory] = useState(params.get('category') ?? '');
  const [sugg, setSugg] = useState<Suggestions | null>(null);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (q.trim().length < 2) {
      setSugg(null);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/suggest?q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
        if (res.ok) setSugg(await res.json());
      } catch {
        /* aborted */
      }
    }, 180);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const submit = (term = q) => {
    const sp = new URLSearchParams();
    if (term.trim()) sp.set('q', term.trim());
    if (category) sp.set('category', category);
    setOpen(false);
    router.push(`/search?${sp.toString()}`);
  };

  return (
    <form
      ref={boxRef}
      role="search"
      className="relative flex h-10 flex-1 items-stretch"
      onSubmit={e => {
        e.preventDefault();
        submit();
      }}
    >
      <select
        aria-label="Search category"
        value={category}
        onChange={e => setCategory(e.target.value)}
        className="hidden w-auto max-w-[9rem] cursor-pointer rounded-l-md border-0 bg-gray-100 px-2 text-xs text-gray-700 hover:bg-gray-200 sm:block"
      >
        <option value="">All</option>
        {categories.map(c => (
          <option key={c.slug} value={c.slug}>
            {c.name}
          </option>
        ))}
      </select>
      <input
        type="search"
        name="q"
        value={q}
        autoComplete="off"
        placeholder="Search products, brands and categories"
        aria-label="Search"
        data-testid="search-input"
        onFocus={() => setOpen(true)}
        onChange={e => {
          setQ(e.target.value);
          setOpen(true);
        }}
        className="min-w-0 flex-1 border-0 bg-white px-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-orange-400 max-sm:rounded-l-md"
      />
      <button
        type="submit"
        aria-label="Search"
        data-testid="search-submit"
        className="rounded-r-md bg-orange-400 px-4 text-gray-900 hover:bg-orange-500"
      >
        <Search className="h-5 w-5" />
      </button>

      {open && sugg && (sugg.products.length > 0 || sugg.categories.length > 0) && (
        <ul
          className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-md border bg-white py-1 text-sm text-gray-900 shadow-xl"
          data-testid="search-suggestions"
        >
          {sugg.categories.map(c => (
            <li key={c.slug}>
              <button
                type="button"
                className="flex w-full items-center justify-between px-3 py-1.5 text-left hover:bg-gray-100"
                onClick={() => {
                  setOpen(false);
                  router.push(`/category/${c.slug}`);
                }}
              >
                <span>
                  in <span className="font-semibold">{c.name}</span>
                </span>
                <span className="text-xs text-gray-500">Category</span>
              </button>
            </li>
          ))}
          {sugg.products.map(p => (
            <li key={p.slug}>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 px-3 py-1.5 text-left hover:bg-gray-100"
                onClick={() => {
                  setOpen(false);
                  router.push(`/products/${p.slug}`);
                }}
              >
                <span className="truncate">{p.name}</span>
                {p.category && <span className="shrink-0 text-xs text-gray-500">{p.category.name}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}
