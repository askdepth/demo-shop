'use client';

import { useState } from 'react';
import { ShieldCheck, Sparkles, AlertTriangle, RotateCcw } from 'lucide-react';
import { AskdepthCatch } from '@askdepth/react';
import { Button } from '@/components/ui/button';
import { useDemoScenarios } from '@/components/demo/demo-scenario-context';

interface BundleConfiguratorProps {
  productName: string;
  basePrice: number;
}

function BundleConfiguratorInner({
  productName,
  basePrice,
  shouldCrash,
  selectedPlan,
  onSelectPlan,
}: {
  productName: string;
  basePrice: number;
  shouldCrash: boolean;
  selectedPlan: 'none' | 'care_plus' | 'bundle_pro';
  onSelectPlan: (plan: 'none' | 'care_plus' | 'bundle_pro') => void;
}) {
  // Demo Scenario 4: ERROR_CLICK (React Component Render Crash caught by <AskdepthCatch>)
  if (shouldCrash && selectedPlan !== 'none') {
    const brokenPricingMatrix = undefined as unknown as {
      protectionCoverageTier: { deductibleUsd: number };
    };
    // Throws realistic TypeError right inside React render within <50ms of user's click
    void brokenPricingMatrix.protectionCoverageTier.deductibleUsd;
  }

  const carePrice = Math.max(29, Math.round(basePrice * 0.08));
  const proBundlePrice = Math.max(59, Math.round(basePrice * 0.14));

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-blue-600" aria-hidden="true" />
          <h3 className="text-sm font-semibold text-slate-900">
            Protection & Accessory Bundle
          </h3>
        </div>
        <span className="text-xs text-muted-foreground">Optional add-on</span>
      </div>

      <p className="mt-1 text-xs text-muted-foreground">
        Extend coverage on {productName} with instant replacement and accidental
        damage protection.
      </p>

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button
          type="button"
          data-testid="bundle-option-care"
          onClick={() =>
            onSelectPlan(selectedPlan === 'care_plus' ? 'none' : 'care_plus')
          }
          className={`flex flex-col items-start rounded-lg border p-3 text-left text-xs transition ${
            selectedPlan === 'care_plus'
              ? 'border-blue-600 bg-blue-50/70 ring-1 ring-blue-600'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <span className="font-semibold text-slate-900">
            2-Year Care+ Plan (+${carePrice})
          </span>
          <span className="mt-0.5 text-muted-foreground">
            Zero-deductible battery & screen coverage
          </span>
        </button>

        <button
          type="button"
          data-testid="bundle-option-pro"
          onClick={() =>
            onSelectPlan(selectedPlan === 'bundle_pro' ? 'none' : 'bundle_pro')
          }
          className={`flex flex-col items-start rounded-lg border p-3 text-left text-xs transition ${
            selectedPlan === 'bundle_pro'
              ? 'border-blue-600 bg-blue-50/70 ring-1 ring-blue-600'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <span className="flex items-center gap-1 font-semibold text-slate-900">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />
            Pro Care + Express Dock (+${proBundlePrice})
          </span>
          <span className="mt-0.5 text-muted-foreground">
            3-year coverage + USB-C travel charger
          </span>
        </button>
      </div>

      {selectedPlan !== 'none' && (
        <p className="mt-2.5 text-xs font-medium text-blue-700">
          Bundle selected — estimated package total: $
          {(
            basePrice +
            (selectedPlan === 'care_plus' ? carePrice : proBundlePrice)
          ).toFixed(2)}
        </p>
      )}
    </div>
  );
}

export function BundleConfigurator({
  productName,
  basePrice,
}: BundleConfiguratorProps) {
  const [selectedPlan, setSelectedPlan] = useState<
    'none' | 'care_plus' | 'bundle_pro'
  >('none');
  const { scenarios, setScenario, logDemoSignal } = useDemoScenarios();

  const handleSelectPlan = (plan: 'none' | 'care_plus' | 'bundle_pro') => {
    if (scenarios.bundleCrashError && plan !== 'none') {
      window.setTimeout(() => {
        logDemoSignal(
          'ERROR_CLICK',
          `AskdepthCatch captured TypeError in BundleConfigurator on "${productName}"`
        );
      }, 250);
    }
    setSelectedPlan(plan);
  };

  return (
    <AskdepthCatch
      fallback={(error, reset) => (
        <div
          role="alert"
          data-testid="bundle-error-boundary"
          className="rounded-xl border border-rose-200 bg-rose-50/80 p-4 text-sm text-rose-950"
        >
          <div className="flex items-start gap-2.5">
            <AlertTriangle
              className="mt-0.5 h-4 w-4 shrink-0 text-rose-600"
              aria-hidden="true"
            />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-rose-900">
                Bundle configurator encountered an unexpected error
              </p>
              <p className="mt-1 font-mono text-xs text-rose-700">
                {error.message}
              </p>
              <p className="mt-1.5 text-xs text-rose-800/90">
                Caught by <code className="font-mono">&lt;AskdepthCatch&gt;</code>{' '}
                with React Fiber component stack &amp; session replay slice. You
                can still add the base item to your cart normally.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedPlan('none');
                    reset();
                  }}
                  className="border-rose-300 bg-white text-xs text-rose-900 hover:bg-rose-100"
                >
                  <RotateCcw className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                  Reset Widget
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setScenario('bundleCrashError', false);
                    setSelectedPlan('care_plus');
                    reset();
                  }}
                  className="text-xs text-rose-800 hover:bg-rose-100"
                >
                  Disable Crash Scenario &amp; Retry
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    >
      <BundleConfiguratorInner
        productName={productName}
        basePrice={basePrice}
        shouldCrash={scenarios.bundleCrashError}
        selectedPlan={selectedPlan}
        onSelectPlan={handleSelectPlan}
      />
    </AskdepthCatch>
  );
}
