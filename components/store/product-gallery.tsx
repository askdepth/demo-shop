'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export function ProductGallery({
  images,
  name,
}: {
  images: { url: string; altText?: string | null }[];
  name: string;
}) {
  const list = images.length ? images : [{ url: '/images/placeholder.svg', altText: name }];
  const [active, setActive] = useState(0);

  return (
    <div className="flex flex-col-reverse gap-3 sm:flex-row" data-testid="product-gallery">
      {list.length > 1 && (
        <div className="flex gap-2 sm:flex-col">
          {list.map((img, i) => (
            <button
              key={img.url}
              type="button"
              onMouseEnter={() => setActive(i)}
              onClick={() => setActive(i)}
              aria-label={`View image ${i + 1}`}
              className={cn(
                'relative h-14 w-14 overflow-hidden rounded border bg-muted/40',
                i === active ? 'border-orange-500 ring-1 ring-orange-500' : 'hover:border-orange-400'
              )}
            >
              <Image src={img.url} alt="" fill sizes="56px" className="object-contain p-0.5" />
            </button>
          ))}
        </div>
      )}
      <div className="relative aspect-square w-full overflow-hidden rounded bg-muted/40">
        <Image
          src={list[active]!.url}
          alt={list[active]!.altText || name}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 40vw"
          className="object-contain p-4"
        />
      </div>
    </div>
  );
}
