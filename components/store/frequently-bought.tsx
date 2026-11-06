'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { addToCart } from '@/server/actions/cart';

interface Item {
  id: string;
  name: string;
  slug: string;
  price: number;
  image?: string;
}

export function FrequentlyBought({ items }: { items: Item[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set(items.map(i => i.id)));
  const [loading, setLoading] = useState(false);
  const chosen = items.filter(i => selected.has(i.id));
  const total = chosen.reduce((s, i) => s + i.price, 0);

  const addAll = async () => {
    setLoading(true);
    try {
      for (const item of chosen) {
        const fd = new FormData();
        fd.append('productId', item.id);
        fd.append('quantity', '1');
        const res = await addToCart(fd);
        if (!res.success) {
          toast.error(`${item.name}: ${res.error}`);
          return;
        }
      }
      window.dispatchEvent(new Event('cart-updated'));
      toast.success(`Added ${chosen.length} items to cart`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-md border p-4" data-testid="frequently-bought">
      <h2 className="mb-3 text-xl font-bold">Frequently bought together</h2>
      <div className="flex flex-wrap items-center gap-3">
        {items.map((item, idx) => (
          <div key={item.id} className="flex items-center gap-3">
            {idx > 0 && <Plus className="h-5 w-5 text-gray-400" />}
            <Link href={`/products/${item.slug}`} className="block w-28">
              <div className="relative aspect-square overflow-hidden rounded bg-muted/40">
                <Image src={item.image || '/images/placeholder.svg'} alt={item.name} fill sizes="112px" className="object-contain p-1" />
              </div>
            </Link>
          </div>
        ))}
        <div className="ml-auto min-w-[220px] space-y-2">
          <p className="text-sm">
            Total price: <span className="text-lg font-bold text-red-700">{formatCurrency(total)}</span>
          </p>
          <Button
            onClick={addAll}
            disabled={loading || chosen.length === 0}
            className="rounded-full bg-amber-400 text-black hover:bg-amber-500"
          >
            {loading ? 'Adding...' : `Add ${chosen.length} to Cart`}
          </Button>
        </div>
      </div>
      <ul className="mt-3 space-y-1 text-sm">
        {items.map((item, idx) => (
          <li key={item.id}>
            <label className="flex cursor-pointer items-start gap-2">
              <input
                type="checkbox"
                checked={selected.has(item.id)}
                onChange={e => {
                  const next = new Set(selected);
                  if (e.target.checked) next.add(item.id);
                  else next.delete(item.id);
                  setSelected(next);
                }}
                className="mt-1"
              />
              <span>
                {idx === 0 && <strong>This item: </strong>}
                <span className="text-sky-700">{item.name}</span>{' '}
                <span className="font-semibold text-red-700">{formatCurrency(item.price)}</span>
              </span>
            </label>
          </li>
        ))}
      </ul>
    </section>
  );
}
