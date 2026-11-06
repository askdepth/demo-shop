'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { addToCart } from '@/server/actions/cart';

export function BuyNow({ productId, disabled }: { productId: string; disabled?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  return (
    <Button
      type="button"
      disabled={disabled || loading}
      data-testid="buy-now-btn"
      className="w-full rounded-full bg-orange-500 text-white hover:bg-orange-600"
      onClick={async () => {
        setLoading(true);
        try {
          const fd = new FormData();
          fd.append('productId', productId);
          fd.append('quantity', '1');
          const res = await addToCart(fd);
          if (res.success) {
            window.dispatchEvent(new Event('cart-updated'));
            router.push('/checkout');
          } else {
            toast.error(res.error || 'Could not start checkout');
          }
        } finally {
          setLoading(false);
        }
      }}
    >
      {loading ? 'Please wait...' : 'Buy Now'}
    </Button>
  );
}
