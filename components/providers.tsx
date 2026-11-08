'use client';

import { useEffect, useState } from 'react';
import { SessionProvider } from 'next-auth/react';
import { AskdepthProvider } from '@askdepth/react';
import { CartProvider } from '@/components/cart-provider';
import { DemoScenarioProvider } from '@/components/demo/demo-scenario-context';
import { AskdepthIdentitySync } from '@/components/demo/askdepth-identity-sync';
import {
  normalizeEnvironment,
  normalizeTelemetryEndpoint,
  readRuntimeSdkOverride,
  type AskdepthEnvName,
} from '@/lib/askdepth-config';

interface ProvidersProps {
  children: React.ReactNode;
  session?: any;
  initialAskdepthConfig?: {
    writeKey?: string;
    endpoint?: string;
    buildId?: string;
    environment?: AskdepthEnvName;
  };
}

export function Providers({
  children,
  session,
  initialAskdepthConfig,
}: ProvidersProps) {
  const [runtimeConfig, setRuntimeConfig] = useState(() => ({
    writeKey: (
      initialAskdepthConfig?.writeKey ||
      process.env.NEXT_PUBLIC_ASKDEPTH_WRITE_KEY ||
      ''
    ).trim(),
    endpoint: normalizeTelemetryEndpoint(
      initialAskdepthConfig?.endpoint ||
        process.env.NEXT_PUBLIC_ASKDEPTH_ENDPOINT
    ),
    buildId:
      initialAskdepthConfig?.buildId ||
      process.env.NEXT_PUBLIC_ASKDEPTH_BUILD_ID ||
      'demo-shop-v1',
    environment: normalizeEnvironment(
      initialAskdepthConfig?.environment ||
        process.env.NEXT_PUBLIC_ASKDEPTH_ENVIRONMENT
    ),
  }));

  useEffect(() => {
    const syncOverride = () => {
      const override = readRuntimeSdkOverride();
      setRuntimeConfig(prev => ({
        ...prev,
        writeKey: (
          override?.writeKey ||
          initialAskdepthConfig?.writeKey ||
          process.env.NEXT_PUBLIC_ASKDEPTH_WRITE_KEY ||
          ''
        ).trim(),
        endpoint: normalizeTelemetryEndpoint(
          override?.endpoint ||
            initialAskdepthConfig?.endpoint ||
            process.env.NEXT_PUBLIC_ASKDEPTH_ENDPOINT
        ),
        environment: normalizeEnvironment(
          override?.environment ||
            initialAskdepthConfig?.environment ||
            process.env.NEXT_PUBLIC_ASKDEPTH_ENVIRONMENT
        ),
      }));
    };

    syncOverride();
    window.addEventListener('askdepth-sdk-override-changed', syncOverride);
    return () => {
      window.removeEventListener('askdepth-sdk-override-changed', syncOverride);
    };
  }, [
    initialAskdepthConfig?.writeKey,
    initialAskdepthConfig?.endpoint,
    initialAskdepthConfig?.environment,
  ]);

  const appTree = (
    <DemoScenarioProvider>
      <AskdepthIdentitySync />
      <CartProvider>{children}</CartProvider>
    </DemoScenarioProvider>
  );

  return (
    <SessionProvider session={session}>
      {runtimeConfig.writeKey ? (
        <AskdepthProvider
          writeKey={runtimeConfig.writeKey}
          endpoint={runtimeConfig.endpoint}
          buildId={runtimeConfig.buildId}
          environment={runtimeConfig.environment}
          consent="granted"
          sampleRate={1}
          replay={true}
          allowedTracingOrigins={
            typeof window !== 'undefined' ? [window.location.origin] : []
          }
        >
          {appTree}
        </AskdepthProvider>
      ) : (
        appTree
      )}
    </SessionProvider>
  );
}
