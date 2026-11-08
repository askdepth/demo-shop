'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn, signOut, useSession } from 'next-auth/react';
import {
  FlaskConical,
  X,
  Zap,
  Users,
  Radio,
  Settings2,
  ExternalLink,
  RotateCcw,
  LogOut,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useAskdepth } from '@askdepth/react';
import {
  DEMO_SCENARIO_CATALOG,
  type DemoScenarioKey,
} from '@/lib/demo-scenarios';
import { HERO_PERSONAS } from '@/lib/demo-personas';
import {
  readRuntimeSdkOverride,
  writeRuntimeSdkOverride,
} from '@/lib/askdepth-config';
import { useDemoScenarios } from '@/components/demo/demo-scenario-context';

interface StatusPayload {
  sdk: {
    writeKeyConfigured: boolean;
    writeKey: string | null;
    telemetryEndpoint: string;
    buildId: string;
    environment: string;
    deployTokenConfigured: boolean;
  };
  connector: {
    endpointPath: string;
    secretConfigured: boolean;
  };
  personas: Array<{
    id: string;
    aliasKey: string;
    email: string;
    name: string;
    passwordPlain: string;
    badgeLabel: string;
    storyHint: string;
    recommendedPath: string;
    seededInDb: boolean;
  }>;
}

const BADGE_STYLES: Record<string, string> = {
  amber: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  orange: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
  rose: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  purple: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  blue: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
};

export function DemoLabDrawer() {
  const router = useRouter();
  const { data: session } = useSession();
  const askdepth = useAskdepth();
  const {
    scenarios,
    activeCount,
    toggleScenario,
    resetScenarios,
    enableAllAnomalies,
    recentSignals,
    logDemoSignal,
    isLabOpen,
    setIsLabOpen,
  } = useDemoScenarios();

  const [tab, setTab] = useState<'scenarios' | 'personas' | 'wave' | 'config'>(
    'scenarios'
  );
  const [statusData, setStatusData] = useState<StatusPayload | null>(null);
  const [switchingId, setSwitchingId] = useState<string | null>(null);
  const [personaError, setPersonaError] = useState<string | null>(null);
  const [waveScenario, setWaveScenario] =
    useState<DemoScenarioKey>('expressShipping503');
  const [waveBusy, setWaveBusy] = useState(false);
  const [waveResult, setWaveResult] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);

  // Runtime SDK override fields
  const [overrideWriteKey, setOverrideWriteKey] = useState('');
  const [overrideEndpoint, setOverrideEndpoint] = useState('');
  const [hasRuntimeOverride, setHasRuntimeOverride] = useState(false);

  useEffect(() => {
    const existing = readRuntimeSdkOverride();
    if (existing) {
      setOverrideWriteKey(existing.writeKey ?? '');
      setOverrideEndpoint(existing.endpoint ?? '');
      setHasRuntimeOverride(Boolean(existing.writeKey || existing.endpoint));
    }
  }, []);

  useEffect(() => {
    if (!isLabOpen && statusData) return;
    let active = true;
    fetch('/api/demo/status')
      .then(res => (res.ok ? res.json() : null))
      .then((data: StatusPayload | null) => {
        if (active && data) {
          setStatusData(data);
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [isLabOpen, statusData]);

  const sdkReady = askdepth.isReady();
  const sessionId = askdepth.getSessionId();
  const traceparent = askdepth.getTraceparent();
  const buildId =
    statusData?.sdk.buildId ||
    process.env.NEXT_PUBLIC_ASKDEPTH_BUILD_ID ||
    'demo-shop-v1';

  const personas =
    statusData?.personas ??
    HERO_PERSONAS.map(p => ({
      id: p.id,
      aliasKey: p.aliasKey,
      email: p.defaultEmail,
      name: p.name,
      passwordPlain: p.passwordPlain,
      badgeLabel: p.badgeLabel,
      storyHint: p.storyHint,
      recommendedPath: p.recommendedPath,
      seededInDb: true,
    }));

  const handleSwitchPersona = async (persona: (typeof personas)[number]) => {
    setSwitchingId(persona.id);
    setPersonaError(null);
    try {
      if (session?.user) {
        await signOut({ redirect: false });
      }
      const res = await signIn('credentials', {
        email: persona.email,
        password: persona.passwordPlain,
        redirect: false,
      });
      if (!res?.error) {
        logDemoSignal(
          'IDENTIFY',
          `Switched shopper -> ${persona.name} (${persona.id})`
        );
        router.push(persona.recommendedPath);
        router.refresh();
      } else {
        setPersonaError(
          `Could not sign in as ${persona.name} (${persona.email}). Ensure database is connected and seeded via "npm run db:seed". [${res.error}]`
        );
      }
    } catch (err) {
      setPersonaError(
        err instanceof Error ? err.message : 'Login request failed'
      );
    } finally {
      setSwitchingId(null);
    }
  };

  const handleSignOutGuest = async () => {
    setSwitchingId('guest');
    try {
      await signOut({ redirect: false });
      router.refresh();
    } finally {
      setSwitchingId(null);
    }
  };

  const handleSimulateWave = async () => {
    setWaveBusy(true);
    setWaveResult(null);
    try {
      const override = readRuntimeSdkOverride();
      const res = await fetch('/api/demo/simulate-wave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario: waveScenario,
          ...(override?.writeKey ? { writeKey: override.writeKey } : {}),
          ...(override?.endpoint ? { endpoint: override.endpoint } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setWaveResult({
          ok: false,
          message: data.error || 'Wave dispatch failed.',
        });
      } else {
        const msg = `Sent ${data.totalEventsSent} events across ${data.acceptedSessions} shopper sessions (${waveScenario}).`;
        setWaveResult({ ok: true, message: msg });
        logDemoSignal('WAVE', msg);
      }
    } catch (err) {
      setWaveResult({
        ok: false,
        message: err instanceof Error ? err.message : 'Network error',
      });
    } finally {
      setWaveBusy(false);
    }
  };

  const handleSaveRuntimeSdk = () => {
    const cleanKey = overrideWriteKey.trim();
    const cleanEndpoint = overrideEndpoint.trim();
    if (!cleanKey && !cleanEndpoint) {
      writeRuntimeSdkOverride(null);
      setHasRuntimeOverride(false);
      return;
    }
    writeRuntimeSdkOverride({
      ...(cleanKey ? { writeKey: cleanKey } : {}),
      ...(cleanEndpoint ? { endpoint: cleanEndpoint } : {}),
    });
    setHasRuntimeOverride(true);
  };

  const handleClearRuntimeSdk = () => {
    setOverrideWriteKey('');
    setOverrideEndpoint('');
    writeRuntimeSdkOverride(null);
    setHasRuntimeOverride(false);
  };

  return (
    /* Entire Demo Lab UI is excluded from AskDepth Session Replay via data-askdepth-block */
    <div data-askdepth-block="" className="no-print">
      {/* Floating Trigger Pill */}
      {!isLabOpen && (
        <button
          type="button"
          onClick={() => setIsLabOpen(true)}
          title="Open AskDepth Demo Lab (Shift + D)"
          data-testid="demo-lab-trigger"
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-full border border-slate-700/80 bg-slate-950/95 px-4 py-2.5 text-xs font-medium text-slate-100 shadow-2xl backdrop-blur transition hover:border-indigo-400 hover:bg-slate-900"
        >
          <span
            className={`h-2 w-2 rounded-full ${
              sdkReady
                ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]'
                : 'bg-amber-400'
            }`}
          />
          <FlaskConical className="h-4 w-4 text-indigo-400" aria-hidden="true" />
          <span>Demo Lab</span>
          {activeCount > 0 && (
            <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
              {activeCount} bug{activeCount > 1 ? 's' : ''}
            </span>
          )}
          <kbd className="hidden rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400 sm:inline">
            ⇧D
          </kbd>
        </button>
      )}

      {/* Non-Blocking Inspector Panel */}
      {isLabOpen && (
        <aside
          aria-label="AskDepth Demo Lab Inspector"
          data-testid="demo-lab-panel"
          className="fixed bottom-4 right-4 z-50 flex max-h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] max-w-md flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/95 text-slate-100 shadow-2xl backdrop-blur-md"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-300">
                <FlaskConical className="h-4 w-4" aria-hidden="true" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">
                    AskDepth Demo Lab
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      sdkReady
                        ? 'bg-emerald-500/15 text-emerald-300'
                        : 'bg-amber-500/15 text-amber-300'
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        sdkReady ? 'bg-emerald-400' : 'bg-amber-400'
                      }`}
                    />
                    {sdkReady ? 'SDK Active' : 'SDK Standby'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Hidden from Session Replay (<code className="font-mono">data-askdepth-block</code>)
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsLabOpen(false)}
              aria-label="Minimize Demo Lab"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          {/* Compact Telemetry Bar */}
          <div className="grid grid-cols-3 gap-1 border-b border-slate-800/80 bg-slate-900/70 px-3 py-2 text-[11px]">
            <div className="truncate">
              <span className="text-slate-500">Shopper: </span>
              <span className="font-medium text-slate-200">
                {session?.user?.name?.split(' ')[0] || 'Guest'}
              </span>
            </div>
            <div className="truncate">
              <span className="text-slate-500">Build: </span>
              <code className="font-mono text-indigo-300">{buildId}</code>
            </div>
            <div className="truncate text-right">
              <span className="text-slate-500">Connector: </span>
              <span
                className={
                  statusData?.connector.secretConfigured
                    ? 'text-emerald-300'
                    : 'text-amber-300'
                }
              >
                {statusData?.connector.secretConfigured ? 'Ready' : 'No Secret'}
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="grid grid-cols-4 border-b border-slate-800 bg-slate-900/40 p-1 text-xs">
            <button
              type="button"
              onClick={() => setTab('scenarios')}
              className={`flex items-center justify-center gap-1 rounded-lg py-1.5 font-medium transition ${
                tab === 'scenarios'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className="h-3.5 w-3.5" aria-hidden="true" />
              Bugs ({activeCount})
            </button>
            <button
              type="button"
              onClick={() => setTab('personas')}
              className={`flex items-center justify-center gap-1 rounded-lg py-1.5 font-medium transition ${
                tab === 'personas'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="h-3.5 w-3.5" aria-hidden="true" />
              Shoppers
            </button>
            <button
              type="button"
              onClick={() => setTab('wave')}
              className={`flex items-center justify-center gap-1 rounded-lg py-1.5 font-medium transition ${
                tab === 'wave'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Radio className="h-3.5 w-3.5" aria-hidden="true" />
              AIS Wave
            </button>
            <button
              type="button"
              onClick={() => setTab('config')}
              className={`flex items-center justify-center gap-1 rounded-lg py-1.5 font-medium transition ${
                tab === 'config'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Settings2 className="h-3.5 w-3.5" aria-hidden="true" />
              Status
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 space-y-3 overflow-y-auto p-3.5 text-xs">
            {tab === 'scenarios' && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Toggle realistic UX bugs to trigger SDK detectors live:
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={enableAllAnomalies}
                      className="rounded border border-slate-700 px-2 py-0.5 text-[11px] text-slate-300 hover:bg-slate-800"
                    >
                      Enable All
                    </button>
                    <button
                      type="button"
                      onClick={resetScenarios}
                      className="flex items-center gap-1 rounded border border-slate-700 px-2 py-0.5 text-[11px] text-slate-300 hover:bg-slate-800"
                    >
                      <RotateCcw className="h-3 w-3" aria-hidden="true" />
                      Reset
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {DEMO_SCENARIO_CATALOG.map(meta => {
                    const active = scenarios[meta.key];
                    return (
                      <div
                        key={meta.key}
                        className={`rounded-xl border p-3 transition ${
                          active
                            ? 'border-rose-500/50 bg-rose-950/20'
                            : 'border-slate-800 bg-slate-900/50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="font-semibold text-slate-100">
                                {meta.title}
                              </span>
                              <span
                                className={`rounded border px-1.5 py-0.5 text-[10px] font-mono ${
                                  BADGE_STYLES[meta.signalColor] ??
                                  BADGE_STYLES.blue
                                }`}
                              >
                                {meta.signalBadge}
                              </span>
                            </div>
                            <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
                              {meta.howToTrigger}
                            </p>
                          </div>

                          <button
                            type="button"
                            role="switch"
                            aria-checked={active}
                            aria-label={`Toggle ${meta.title}`}
                            onClick={() => toggleScenario(meta.key)}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                              active ? 'bg-rose-500' : 'bg-slate-700'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                                active ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>

                        <div className="mt-2 flex items-center justify-between border-t border-slate-800/80 pt-1.5 text-[11px]">
                          <span className="font-mono text-slate-500">
                            {meta.surfaceRoute}
                          </span>
                          <Link
                            href={meta.surfaceRoute}
                            className="inline-flex items-center gap-1 font-medium text-indigo-400 hover:text-indigo-300"
                          >
                            Open surface
                            <ExternalLink className="h-3 w-3" aria-hidden="true" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {tab === 'personas' && (
              <div className="space-y-2.5">
                {personaError && (
                  <div className="flex items-start gap-2 rounded-lg border border-rose-500/40 bg-rose-950/40 p-2.5 text-[11px] text-rose-200">
                    <AlertCircle
                      className="mt-0.5 h-4 w-4 shrink-0 text-rose-400"
                      aria-hidden="true"
                    />
                    <span>{personaError}</span>
                  </div>
                )}

                <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-2.5 text-[11px] text-slate-300">
                  <div className="flex items-center justify-between">
                    <span>
                      Active session:{' '}
                      <strong className="text-white">
                        {session?.user
                          ? `${session.user.name} (${session.user.id})`
                          : 'Anonymous Guest'}
                      </strong>
                    </span>
                    {session?.user && (
                      <button
                        type="button"
                        disabled={switchingId !== null}
                        onClick={handleSignOutGuest}
                        className="inline-flex items-center gap-1 rounded bg-slate-800 px-2 py-1 text-[10px] text-slate-300 hover:bg-slate-700"
                      >
                        <LogOut className="h-3 w-3" aria-hidden="true" />
                        Guest
                      </button>
                    )}
                  </div>
                </div>

                {personas.map(persona => {
                  const isCurrent = session?.user?.id === persona.id;
                  const isSeeded = persona.seededInDb !== false;
                  return (
                    <div
                      key={persona.id}
                      className={`rounded-xl border p-3 ${
                        isCurrent
                          ? 'border-emerald-500/50 bg-emerald-950/20'
                          : isSeeded
                            ? 'border-slate-800 bg-slate-900/50'
                            : 'border-amber-500/30 bg-amber-950/10'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-white">
                              {persona.name}
                            </span>
                            <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-[10px] text-indigo-300">
                              {persona.badgeLabel}
                            </span>
                            {!isSeeded && (
                              <span
                                className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] text-amber-300"
                                title="Not found in database. Run npm run db:seed"
                              >
                                Not in DB
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 font-mono text-[10px] text-slate-400">
                            id={persona.id} · {persona.email}
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={switchingId !== null || isCurrent}
                          onClick={() => handleSwitchPersona(persona)}
                          className={`shrink-0 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition ${
                            isCurrent
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50'
                          }`}
                        >
                          {isCurrent
                            ? 'Active'
                            : switchingId === persona.id
                              ? 'Switching...'
                              : 'Switch'}
                        </button>
                      </div>
                      <p className="mt-1.5 text-[11px] text-slate-400">
                        {persona.storyHint}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {tab === 'wave' && (
              <div className="space-y-3">
                <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-3">
                  <p className="font-semibold text-indigo-200">
                    Why simulate a Cohort Wave?
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-300">
                    AskDepth&apos;s Anomaly Intelligence System (AIS) filters out
                    single-user noise and promotes incidents once breadth &amp;
                    severity cross production thresholds (≥2–3 distinct sessions,
                    AIS ≥ 70 for autonomous research). Dispatch a 7-shopper
                    cohort burst linked to real Audience Connector IDs in 1 click.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="wave-scenario-select"
                    className="block text-[11px] font-medium text-slate-300"
                  >
                    Incident Scenario to Broadcast
                  </label>
                  <select
                    id="wave-scenario-select"
                    value={waveScenario}
                    onChange={e =>
                      setWaveScenario(e.target.value as DemoScenarioKey)
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white"
                  >
                    <option value="expressShipping503">
                      Checkout Express Shipping 503 + Latency Regression
                    </option>
                    <option value="promoRageClick">
                      Promo Code Box Silent Hang (RAGE_CLICK × 7 sessions)
                    </option>
                    <option value="bundleCrashError">
                      BundleConfigurator React Render Crash (ERROR_CLICK)
                    </option>
                    <option value="sizeGuideDeadClick">
                      Size &amp; Fit Guide Broken Modal (DEAD_CLICK × 7 sessions)
                    </option>
                  </select>
                </div>

                <button
                  type="button"
                  disabled={waveBusy}
                  onClick={handleSimulateWave}
                  data-testid="simulate-wave-button"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow hover:bg-indigo-500 disabled:opacity-50"
                >
                  <Radio className="h-4 w-4" aria-hidden="true" />
                  {waveBusy
                    ? 'Dispatching 7 Shopper Sessions...'
                    : 'Simulate 7-Shopper Incident Wave'}
                </button>

                {waveResult && (
                  <div
                    className={`flex items-start gap-2 rounded-lg border p-2.5 text-[11px] ${
                      waveResult.ok
                        ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-200'
                        : 'border-rose-500/40 bg-rose-950/30 text-rose-200'
                    }`}
                  >
                    {waveResult.ok ? (
                      <CheckCircle2
                        className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400"
                        aria-hidden="true"
                      />
                    ) : (
                      <AlertCircle
                        className="mt-0.5 h-4 w-4 shrink-0 text-rose-400"
                        aria-hidden="true"
                      />
                    )}
                    <span>{waveResult.message}</span>
                  </div>
                )}
              </div>
            )}

            {tab === 'config' && (
              <div className="space-y-3">
                <div className="space-y-1.5 rounded-xl border border-slate-800 bg-slate-900/60 p-3 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400">SDK Initialized:</span>
                    <span className={sdkReady ? 'text-emerald-400' : 'text-amber-400'}>
                      {String(sdkReady)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-400">Session ID:</span>
                    <span className="truncate text-slate-200">
                      {sessionId || '—'}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-400">W3C traceparent:</span>
                    <span className="truncate text-slate-200">
                      {traceparent ? `${traceparent.slice(0, 22)}…` : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Component Map Token:</span>
                    <span
                      className={
                        statusData?.sdk.deployTokenConfigured
                          ? 'text-emerald-400'
                          : 'text-slate-400'
                      }
                    >
                      {statusData?.sdk.deployTokenConfigured
                        ? 'Configured'
                        : 'Not set (build time)'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Connector /askdepth/v1:</span>
                    <span
                      className={
                        statusData?.connector.secretConfigured
                          ? 'text-emerald-400'
                          : 'text-amber-400'
                      }
                    >
                      {statusData?.connector.secretConfigured
                        ? 'HMAC Active'
                        : 'Awaiting Secret'}
                    </span>
                  </div>
                </div>

                {/* Live Browser Override for Smoke Testing before Cloud Rebuild */}
                <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-900/40 p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200">
                      Browser SDK Hot-Connect Override
                    </span>
                    {hasRuntimeOverride && (
                      <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-[10px] text-indigo-300">
                        Override Active
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Paste your newly created <code className="font-mono">ad_bw_...</code>{' '}
                    key during onboarding to test immediately even before
                    redeploying env secrets:
                  </p>
                  <input
                    type="text"
                    value={overrideWriteKey}
                    onChange={e => setOverrideWriteKey(e.target.value)}
                    placeholder="ad_bw_... Browser Write Key"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 font-mono text-xs text-white placeholder:text-slate-600"
                  />
                  <input
                    type="text"
                    value={overrideEndpoint}
                    onChange={e => setOverrideEndpoint(e.target.value)}
                    placeholder={
                      statusData?.sdk.telemetryEndpoint ||
                      'https://in.askdepth.com/v1/telemetry'
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 font-mono text-xs text-white placeholder:text-slate-600"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSaveRuntimeSdk}
                      className="flex-1 rounded-lg bg-indigo-600 py-1.5 text-xs font-medium text-white hover:bg-indigo-500"
                    >
                      Apply in Browser
                    </button>
                    {hasRuntimeOverride && (
                      <button
                        type="button"
                        onClick={handleClearRuntimeSdk}
                        className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Recent Signal Feed */}
            {recentSignals.length > 0 && (
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-2.5">
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Recent Demo Signals
                </p>
                <div className="max-h-28 space-y-1 overflow-y-auto font-mono text-[10px]">
                  {recentSignals.map(entry => (
                    <div key={entry.id} className="flex gap-1.5 text-slate-300">
                      <span className="shrink-0 text-slate-500">{entry.at}</span>
                      <span className="shrink-0 font-semibold text-indigo-300">
                        [{entry.kind}]
                      </span>
                      <span className="truncate">{entry.summary}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>
      )}
    </div>
  );
}
