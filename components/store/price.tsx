// Location: components/store/price.tsx
import { cn } from '@/lib/utils';

/** Amazon-style price: small $, big dollars, small superscript cents. */
export function Price({
  value,
  className,
  size = 'md',
}: {
  value: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const [dollars = '0', cents = '00'] = value.toFixed(2).split('.');
  const big = size === 'lg' ? 'text-3xl' : size === 'md' ? 'text-2xl' : 'text-lg';
  const small = size === 'lg' ? 'text-sm' : 'text-xs';
  return (
    <span
      className={cn('inline-flex items-start font-medium leading-none', className)}
      aria-label={`$${value.toFixed(2)}`}
      data-testid="price"
    >
      <span className={cn('mt-0.5', small)}>$</span>
      <span className={big}>{Number(dollars).toLocaleString('en-US')}</span>
      <span className={cn('mt-0.5', small)}>{cents}</span>
    </span>
  );
}
