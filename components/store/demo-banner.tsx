import Link from 'next/link';

export function DemoBanner() {
  return (
    <div
      className="bg-amber-100 px-3 py-1 text-center text-xs text-amber-900"
      data-testid="demo-banner"
    >
      <strong>Demo store.</strong> All products, brands, reviews and orders are fictional. No real
      payment is taken. Try the{' '}
      <Link href="/auth/signin" className="font-semibold underline">
        demo account
      </Link>
      .
    </div>
  );
}
