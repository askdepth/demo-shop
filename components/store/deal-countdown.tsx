'use client';

import { useEffect, useState } from 'react';

function remaining() {
  const now = new Date();
  const end = new Date(now);
  end.setHours(24, 0, 0, 0);
  const s = Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000));
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(Math.floor(s / 3600))}:${p(Math.floor((s % 3600) / 60))}:${p(s % 60)}`;
}

/** Ticks down to local midnight ("Deals of the Day"). Renders blank until mounted to avoid hydration mismatch. */
export function DealCountdown() {
  const [t, setT] = useState('');
  useEffect(() => {
    setT(remaining());
    const id = setInterval(() => setT(remaining()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="rounded bg-red-600 px-2 py-0.5 text-xs font-semibold text-white" data-testid="deal-countdown">
      Ends in {t || '--:--:--'}
    </span>
  );
}
