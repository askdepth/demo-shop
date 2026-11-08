'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useAskdepth } from '@askdepth/react';
import { useDemoScenarios } from '@/components/demo/demo-scenario-context';

/**
 * Bridges authenticated NextAuth customer IDs (`public.users.id`, e.g. `cust_hero_sarah` or CUID)
 * into AskDepth's Zero-PII Identity Bridge (`Askdepth.identify(userId)`).
 *
 * Never passes email, name, or phone to telemetry — only the pseudonymous database ID,
 * matching `DEMO_SHOP_FIELD_MAPPING.externalId = 'id'` in `@askdepth/audience-connector`.
 */
export function AskdepthIdentitySync() {
  const { data: session, status } = useSession();
  const askdepth = useAskdepth();
  const { logDemoSignal } = useDemoScenarios();
  const lastIdentifiedRef = useRef<string | null>(null);

  const userId = session?.user?.id ?? null;
  const userRole = session?.user?.role ?? null;
  const sdkReady = askdepth.isReady();

  useEffect(() => {
    if (status !== 'authenticated' || !userId || !sdkReady) {
      if (status === 'unauthenticated') {
        lastIdentifiedRef.current = null;
      }
      return;
    }

    // Do not link internal store admins as customer outreach targets
    if (userRole?.toLowerCase() === 'admin') {
      return;
    }

    const sessionId = askdepth.getSessionId() ?? 'pending';
    const dedupeKey = `${userId}:${sessionId}`;
    if (lastIdentifiedRef.current === dedupeKey) {
      return;
    }

    askdepth.identify(userId, {
      page: typeof window !== 'undefined' ? window.location.href : undefined,
    });
    lastIdentifiedRef.current = dedupeKey;
    logDemoSignal('IDENTIFY', `Linked actor -> externalId="${userId}"`);
  }, [status, userId, userRole, sdkReady, askdepth, logDemoSignal]);

  return null;
}
