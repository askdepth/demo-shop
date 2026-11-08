'use client';

import { useRef, useState } from 'react';
import { Tag, CheckCircle2, X } from 'lucide-react';
import { useAskdepth } from '@askdepth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDemoScenarios } from '@/components/demo/demo-scenario-context';

const PROMO_CODES: Record<
  string,
  { code: string; label: string; percentOff: number }
> = {
  WELCOME20: { code: 'WELCOME20', label: '20% Welcome Discount', percentOff: 20 },
  VIP30: { code: 'VIP30', label: '30% Platinum VIP Offer', percentOff: 30 },
  SAVE10: { code: 'SAVE10', label: '10% Seasonal Savings', percentOff: 10 },
};

interface PromoCodeBoxProps {
  subtotal: number;
  onDiscountChange?: (discountAmount: number, code: string | null) => void;
  surface?: 'cart' | 'checkout';
}

export function PromoCodeBox({
  subtotal,
  onDiscountChange,
  surface = 'checkout',
}: PromoCodeBoxProps) {
  const [codeInput, setCodeInput] = useState('WELCOME20');
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const silentClickCountRef = useRef(0);
  const askdepth = useAskdepth();
  const { scenarios, logDemoSignal } = useDemoScenarios();

  const handleApplyPromo = () => {
    // Demo Scenario 1: RAGE_CLICK
    // Intentionally swallow clicks silently with zero DOM/state mutation so frustrated
    // rapid clicking (>=3 clicks within 1500ms inside 30px) triggers RAGE_CLICK natively.
    if (scenarios.promoRageClick) {
      silentClickCountRef.current += 1;
      const count = silentClickCountRef.current;
      if (count >= 3) {
        silentClickCountRef.current = 0;
        window.setTimeout(() => {
          logDemoSignal(
            'RAGE_CLICK',
            `PromoCodeBox "Apply" swallowed ${count} rapid clicks on /${surface}`
          );
        }, 900);
      }
      return;
    }

    const normalized = codeInput.trim().toUpperCase();
    if (!normalized) {
      setFeedback('Enter a promo code such as WELCOME20 or VIP30.');
      return;
    }

    const promo = PROMO_CODES[normalized];
    if (!promo) {
      setFeedback(`Code "${normalized}" is invalid. Try WELCOME20 or VIP30.`);
      setAppliedCode(null);
      onDiscountChange?.(0, null);
      return;
    }

    const discount = Number(((subtotal * promo.percentOff) / 100).toFixed(2));
    setAppliedCode(promo.code);
    setFeedback(`${promo.label} (-$${discount.toFixed(2)}) applied.`);
    onDiscountChange?.(discount, promo.code);
    askdepth.track('promo_code_applied', {
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    });
  };

  const handleClearPromo = () => {
    setAppliedCode(null);
    setFeedback(null);
    onDiscountChange?.(0, null);
  };

  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-3.5">
      <div className="mb-2 flex items-center justify-between text-xs font-medium text-slate-700">
        <span className="flex items-center gap-1.5">
          <Tag className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
          Promo or Gift Code
        </span>
        <span className="text-[11px] text-muted-foreground">
          Try <code className="rounded bg-slate-100 px-1 py-0.5">WELCOME20</code>
        </span>
      </div>

      {appliedCode ? (
        <div className="flex items-center justify-between rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
          <span className="flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            {feedback}
          </span>
          <button
            type="button"
            onClick={handleClearPromo}
            className="rounded p-0.5 text-emerald-700 hover:bg-emerald-100"
            aria-label="Remove promo code"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      ) : (
        <>
          <div className="flex gap-2">
            <Input
              value={codeInput}
              onChange={e => setCodeInput(e.target.value)}
              placeholder="Enter promo code"
              aria-label="Promo code"
              data-testid="promo-code-input"
              className="h-9 text-sm uppercase"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleApplyPromo}
              data-testid="promo-code-apply"
              className="h-9 shrink-0 px-4 font-medium"
            >
              Apply
            </Button>
          </div>
          {feedback && (
            <p className="mt-1.5 text-xs text-amber-700">{feedback}</p>
          )}
        </>
      )}
    </div>
  );
}
