'use client';

import { useRef, useState } from 'react';
import { Heart, Share2, Ruler, MapPin, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useDemoScenarios } from '@/components/demo/demo-scenario-context';

interface ProductInteractiveToolsProps {
  productName: string;
  categorySlug?: string | null;
  sku?: string | null;
}

export function ProductInteractiveTools({
  productName,
  categorySlug,
  sku,
}: ProductInteractiveToolsProps) {
  const sizeDialogRef = useRef<HTMLDialogElement>(null);
  const pickupDialogRef = useRef<HTMLDialogElement>(null);
  const [wishlisted, setWishlisted] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const { scenarios, logDemoSignal } = useDemoScenarios();

  const isApparel =
    categorySlug === 'clothing' || categorySlug === 'sports';

  const handleOpenSizeGuide = () => {
    // Demo Scenario 2: DEAD_CLICK
    // Zero DOM mutation, zero network call, zero navigation for >800ms on an interactive button
    // causes @askdepth/core to emit DEAD_CLICK with computed cursor/pointer-events styles.
    if (scenarios.sizeGuideDeadClick) {
      window.setTimeout(() => {
        logDemoSignal(
          'DEAD_CLICK',
          `Size & Spec Guide button ignored click (800ms silence) on "${productName}"`
        );
      }, 950);
      return;
    }
    sizeDialogRef.current?.showModal();
  };

  const handleOpenStorePickup = () => {
    if (scenarios.sizeGuideDeadClick) {
      window.setTimeout(() => {
        logDemoSignal(
          'DEAD_CLICK',
          `Check Store Pickup button ignored click (800ms silence) on "${productName}"`
        );
      }, 950);
      return;
    }
    pickupDialogRef.current?.showModal();
  };

  const handleToggleWishlist = () => {
    setWishlisted(prev => {
      const next = !prev;
      toast({
        title: next ? 'Saved to Wishlist' : 'Removed from Wishlist',
        description: next
          ? `${productName} was saved to your session wishlist.`
          : `${productName} was removed from your wishlist.`,
      });
      return next;
    });
  };

  const handleShare = async () => {
    if (typeof window === 'undefined') return;
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast({
        title: 'Link copied',
        description: 'Product link copied to clipboard.',
      });
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: 'Share link ready',
        description: window.location.href,
      });
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleOpenSizeGuide}
          data-testid="size-guide-button"
        >
          <Ruler className="mr-2 h-4 w-4" aria-hidden="true" />
          {isApparel ? 'Size & Fit Guide' : 'Dimensions & Fit Guide'}
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleOpenStorePickup}
          data-testid="store-pickup-button"
        >
          <MapPin className="mr-2 h-4 w-4" aria-hidden="true" />
          Check Store Pickup
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleToggleWishlist}
          data-testid="wishlist-button"
        >
          <Heart
            className={`mr-2 h-4 w-4 ${wishlisted ? 'fill-rose-500 text-rose-500' : ''}`}
            aria-hidden="true"
          />
          {wishlisted ? 'Wishlisted' : 'Add to Wishlist'}
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleShare}
          data-testid="share-product-button"
        >
          {copied ? (
            <Check className="mr-2 h-4 w-4 text-emerald-600" aria-hidden="true" />
          ) : (
            <Share2 className="mr-2 h-4 w-4" aria-hidden="true" />
          )}
          {copied ? 'Copied' : 'Share'}
        </Button>
      </div>

      {/* Native Accessible Modal (<dialog>) for Size / Dimensions Guide */}
      <dialog
        ref={sizeDialogRef}
        aria-labelledby="size-guide-dialog-title"
        onClick={event => {
          if (event.target === sizeDialogRef.current) {
            sizeDialogRef.current.close();
          }
        }}
        className="w-full max-w-lg rounded-xl border bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-950/50"
      >
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2
                id="size-guide-dialog-title"
                className="text-lg font-semibold text-slate-900"
              >
                {isApparel ? 'Size & Fit Guide' : 'Product Dimensions & Fit'}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Reference measurements for {productName}
                {sku ? ` (${sku})` : ''}
              </p>
            </div>
            <button
              type="button"
              onClick={() => sizeDialogRef.current?.close()}
              aria-label="Close guide"
              className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div className="mt-4 overflow-hidden rounded-lg border text-sm">
            {isApparel ? (
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-xs uppercase text-slate-600">
                  <tr>
                    <th className="px-3 py-2">Size</th>
                    <th className="px-3 py-2">Chest (in)</th>
                    <th className="px-3 py-2">Waist (in)</th>
                    <th className="px-3 py-2">Fit Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr>
                    <td className="px-3 py-2 font-medium">S</td>
                    <td className="px-3 py-2">35–37</td>
                    <td className="px-3 py-2">29–31</td>
                    <td className="px-3 py-2 text-muted-foreground">Tailored</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium">M</td>
                    <td className="px-3 py-2">38–40</td>
                    <td className="px-3 py-2">32–34</td>
                    <td className="px-3 py-2 text-muted-foreground">True to size</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium">L</td>
                    <td className="px-3 py-2">41–43</td>
                    <td className="px-3 py-2">35–37</td>
                    <td className="px-3 py-2 text-muted-foreground">Relaxed</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium">XL</td>
                    <td className="px-3 py-2">44–46</td>
                    <td className="px-3 py-2">38–40</td>
                    <td className="px-3 py-2 text-muted-foreground">Generous</td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <div className="divide-y">
                <div className="flex justify-between px-4 py-2.5">
                  <span className="text-muted-foreground">Package Footprint</span>
                  <span className="font-medium">10.4 × 7.8 × 2.4 in</span>
                </div>
                <div className="flex justify-between px-4 py-2.5">
                  <span className="text-muted-foreground">Unit Weight</span>
                  <span className="font-medium">1.18 lbs (535 g)</span>
                </div>
                <div className="flex justify-between px-4 py-2.5">
                  <span className="text-muted-foreground">Carry-On / Desk Fit</span>
                  <span className="font-medium text-emerald-700">
                    Standard sleeve & organizer compatible
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="mt-5 flex justify-end">
            <Button
              type="button"
              size="sm"
              onClick={() => sizeDialogRef.current?.close()}
            >
              Done
            </Button>
          </div>
        </div>
      </dialog>

      {/* Native Accessible Modal (<dialog>) for Store Pickup */}
      <dialog
        ref={pickupDialogRef}
        aria-labelledby="pickup-dialog-title"
        onClick={event => {
          if (event.target === pickupDialogRef.current) {
            pickupDialogRef.current.close();
          }
        }}
        className="w-full max-w-md rounded-xl border bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-950/50"
      >
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2
                id="pickup-dialog-title"
                className="text-lg font-semibold text-slate-900"
              >
                In-Store Same-Day Pickup
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Live inventory availability for {productName}
              </p>
            </div>
            <button
              type="button"
              onClick={() => pickupDialogRef.current?.close()}
              aria-label="Close store pickup dialog"
              className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div className="mt-4 space-y-2.5 text-sm">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="font-medium">San Francisco — Union Square</p>
                <p className="text-xs text-muted-foreground">Ready in 2 hours</p>
              </div>
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                8 in stock
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="font-medium">New York — SoHo Flagship</p>
                <p className="text-xs text-muted-foreground">Ready in 2 hours</p>
              </div>
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                14 in stock
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="font-medium">Austin — Domain Northside</p>
                <p className="text-xs text-muted-foreground">Ships to store (2 days)</p>
              </div>
              <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                Low stock
              </span>
            </div>
          </div>

          <div className="mt-5 flex justify-end">
            <Button
              type="button"
              size="sm"
              onClick={() => pickupDialogRef.current?.close()}
            >
              Close
            </Button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
