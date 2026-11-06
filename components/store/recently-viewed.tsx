'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';

export interface ViewedItem {
  slug: string;
  name: string;
  price: number;
  image?: string;
}

const KEY = 'recently-viewed';

function read(): ViewedItem[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

/** Renders nothing; records a product page view in localStorage. */
export function TrackView({ item }: { item: ViewedItem }) {
  useEffect(() => {
    try {
      const next = [item, ...read().filter(i => i.slug !== item.slug)].slice(0, 12);
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* storage unavailable */
    }
  }, [item.slug]);
  return null;
}

export function RecentlyViewed({ excludeSlug, title = 'Your browsing history' }: { excludeSlug?: string; title?: string }) {
  const [items, setItems] = useState<ViewedItem[]>([]);
  useEffect(() => {
    setItems(read().filter(i => i.slug !== excludeSlug));
  }, [excludeSlug]);

  if (!items.length) return null;
  return (
    <section className="rounded-md bg-white p-4 shadow-sm" data-testid="recently-viewed">
      <h2 className="mb-3 text-xl font-bold text-gray-900">{title}</h2>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {items.map(i => (
          <Link key={i.slug} href={`/products/${i.slug}`} className="w-36 shrink-0">
            <div className="relative aspect-square overflow-hidden rounded bg-muted/40">
              <Image src={i.image || '/images/placeholder.svg'} alt={i.name} fill sizes="144px" className="object-contain p-1" />
            </div>
            <p className="mt-1 line-clamp-2 text-xs hover:text-orange-700">{i.name}</p>
            <p className="text-sm font-semibold">{formatCurrency(i.price)}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
