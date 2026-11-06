'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

const OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'rating', label: 'Avg. Customer Review' },
  { value: 'newest', label: 'Newest Arrivals' },
  { value: 'popular', label: 'Best Sellers' },
];

export function SortDropdown({ value }: { value: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-gray-600">Sort by:</span>
      <select
        value={value}
        data-testid="sort-select"
        onChange={e => {
          const sp = new URLSearchParams(params.toString());
          sp.set('sort', e.target.value);
          sp.delete('page');
          router.push(`${pathname}?${sp.toString()}`);
        }}
        className="rounded-md border bg-gray-100 px-2 py-1.5 text-sm shadow-sm hover:bg-gray-200"
      >
        {OPTIONS.map(o => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
