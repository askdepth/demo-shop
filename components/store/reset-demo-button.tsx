'use client';

import { useState, useTransition } from 'react';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { resetDemoData } from '@/server/actions/demo';

export function ResetDemoButton() {
  const [pending, start] = useTransition();
  const [confirming, setConfirming] = useState(false);

  const run = () =>
    start(async () => {
      const res = await resetDemoData();
      setConfirming(false);
      if (res.success) toast.success(`Demo data restored: ${res.products} products`);
      else toast.error(res.error);
    });

  return confirming ? (
    <div className="flex items-center gap-2">
      <Button variant="destructive" onClick={run} disabled={pending} data-testid="reset-demo-confirm">
        {pending ? 'Resetting...' : 'Yes, wipe and reset'}
      </Button>
      <Button variant="outline" onClick={() => setConfirming(false)} disabled={pending}>
        Cancel
      </Button>
    </div>
  ) : (
    <Button variant="destructive" onClick={() => setConfirming(true)} data-testid="reset-demo-btn">
      Reset demo data
    </Button>
  );
}
