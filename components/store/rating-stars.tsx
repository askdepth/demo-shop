// Location: components/store/rating-stars.tsx
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Five stars with fractional fill (rounded to the nearest half). */
export function RatingStars({
  rating,
  className,
  size = 'sm',
}: {
  rating: number;
  className?: string;
  size?: 'sm' | 'md';
}) {
  const px = size === 'md' ? 'h-5 w-5' : 'h-3.5 w-3.5';
  const rounded = Math.round(rating * 2) / 2;
  return (
    <span
      className={cn('inline-flex items-center', className)}
      role="img"
      aria-label={`${rating.toFixed(1)} out of 5 stars`}
    >
      {[0, 1, 2, 3, 4].map(i => {
        const fill = Math.max(0, Math.min(1, rounded - i));
        return (
          <span key={i} className={cn('relative inline-block', px)}>
            <Star className={cn('absolute inset-0 text-amber-500', px)} />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star className={cn('fill-amber-500 text-amber-500', px)} />
            </span>
          </span>
        );
      })}
    </span>
  );
}
