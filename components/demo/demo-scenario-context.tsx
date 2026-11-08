'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  DEFAULT_DEMO_SCENARIOS,
  DEMO_SCENARIO_CATALOG,
  DEMO_SCENARIO_COOKIE_KEY,
  DEMO_SCENARIO_STORAGE_KEY,
  type DemoScenarioKey,
  type DemoScenarioState,
} from '@/lib/demo-scenarios';

export interface DemoSignalLogEntry {
  id: string;
  at: string;
  kind: 'RAGE_CLICK' | 'DEAD_CLICK' | 'ERROR_CLICK' | 'TRACK' | 'IDENTIFY' | 'WAVE';
  summary: string;
}

interface DemoScenarioContextValue {
  scenarios: DemoScenarioState;
  activeCount: number;
  setScenario: (key: DemoScenarioKey, enabled: boolean) => void;
  toggleScenario: (key: DemoScenarioKey) => void;
  resetScenarios: () => void;
  enableAllAnomalies: () => void;
  recentSignals: DemoSignalLogEntry[];
  logDemoSignal: (
    kind: DemoSignalLogEntry['kind'],
    summary: string
  ) => void;
  isLabOpen: boolean;
  setIsLabOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const VALID_KEYS = new Set<DemoScenarioKey>(
  DEMO_SCENARIO_CATALOG.map(item => item.key)
);

function sanitizeScenarios(input: unknown): DemoScenarioState {
  const base: DemoScenarioState = { ...DEFAULT_DEMO_SCENARIOS };
  if (!input || typeof input !== 'object') return base;
  const record = input as Record<string, unknown>;
  for (const key of VALID_KEYS) {
    if (typeof record[key] === 'boolean') {
      base[key] = record[key] as boolean;
    }
  }
  return base;
}

function persistScenarioCookie(state: DemoScenarioState): void {
  if (typeof document === 'undefined') return;
  const activeKeys = (Object.keys(state) as DemoScenarioKey[]).filter(
    k => state[k]
  );
  const encoded = encodeURIComponent(activeKeys.join(','));
  document.cookie = `${DEMO_SCENARIO_COOKIE_KEY}=${encoded}; path=/; max-age=604800; SameSite=Lax`;
}

const DemoScenarioContext = createContext<DemoScenarioContextValue | null>(null);

export function DemoScenarioProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [scenarios, setScenarios] = useState<DemoScenarioState>(
    DEFAULT_DEMO_SCENARIOS
  );
  const [recentSignals, setRecentSignals] = useState<DemoSignalLogEntry[]>([]);
  const [isLabOpen, setIsLabOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let nextState = { ...DEFAULT_DEMO_SCENARIOS };
    try {
      const saved = window.localStorage.getItem(DEMO_SCENARIO_STORAGE_KEY);
      if (saved) {
        nextState = sanitizeScenarios(JSON.parse(saved));
      }
    } catch {
      // ignore invalid localStorage state
    }

    // Support URL query parameter ?scenario=promoRageClick,expressShipping503 or ?lab=1
    const params = new URLSearchParams(window.location.search);
    const scenarioParam = params.get('scenario');
    if (scenarioParam) {
      const requested = scenarioParam
        .split(',')
        .map(part => part.trim() as DemoScenarioKey)
        .filter(part => VALID_KEYS.has(part));
      if (requested.length > 0) {
        for (const key of requested) {
          nextState[key] = true;
        }
      }
    }
    if (params.get('lab') === '1' || params.get('demo') === '1') {
      setIsLabOpen(true);
    }

    setScenarios(nextState);
    persistScenarioCookie(nextState);
    try {
      window.localStorage.setItem(
        DEMO_SCENARIO_STORAGE_KEY,
        JSON.stringify(nextState)
      );
    } catch {
      // ignore storage errors
    }
  }, []);

  // Keyboard shortcut: Shift + D toggles Demo Lab (when not typing in an input)
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.shiftKey && (event.key === 'D' || event.key === 'd')) {
        const target = event.target as HTMLElement | null;
        if (
          target &&
          (target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.tagName === 'SELECT' ||
            target.isContentEditable)
        ) {
          return;
        }
        event.preventDefault();
        setIsLabOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const updateState = useCallback(
    (updater: (prev: DemoScenarioState) => DemoScenarioState) => {
      setScenarios(prev => {
        const next = updater(prev);
        persistScenarioCookie(next);
        try {
          window.localStorage.setItem(
            DEMO_SCENARIO_STORAGE_KEY,
            JSON.stringify(next)
          );
        } catch {
          // ignore storage errors
        }
        return next;
      });
    },
    []
  );

  const setScenario = useCallback(
    (key: DemoScenarioKey, enabled: boolean) => {
      updateState(prev => ({ ...prev, [key]: enabled }));
    },
    [updateState]
  );

  const toggleScenario = useCallback(
    (key: DemoScenarioKey) => {
      updateState(prev => ({ ...prev, [key]: !prev[key] }));
    },
    [updateState]
  );

  const resetScenarios = useCallback(() => {
    updateState(() => ({ ...DEFAULT_DEMO_SCENARIOS }));
  }, [updateState]);

  const enableAllAnomalies = useCallback(() => {
    updateState(() => ({
      promoRageClick: true,
      sizeGuideDeadClick: true,
      expressShipping503: true,
      bundleCrashError: true,
      steppedCheckoutRegression: true,
    }));
  }, [updateState]);

  const logDemoSignal = useCallback(
    (kind: DemoSignalLogEntry['kind'], summary: string) => {
      setRecentSignals(prev => [
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          at: new Date().toLocaleTimeString([], {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }),
          kind,
          summary,
        },
        ...prev.slice(0, 14),
      ]);
    },
    []
  );

  const activeCount = useMemo(
    () =>
      (Object.keys(scenarios) as DemoScenarioKey[]).filter(k => scenarios[k])
        .length,
    [scenarios]
  );

  const value = useMemo<DemoScenarioContextValue>(
    () => ({
      scenarios,
      activeCount,
      setScenario,
      toggleScenario,
      resetScenarios,
      enableAllAnomalies,
      recentSignals,
      logDemoSignal,
      isLabOpen,
      setIsLabOpen,
    }),
    [
      scenarios,
      activeCount,
      setScenario,
      toggleScenario,
      resetScenarios,
      enableAllAnomalies,
      recentSignals,
      logDemoSignal,
      isLabOpen,
    ]
  );

  return (
    <DemoScenarioContext.Provider value={value}>
      {children}
    </DemoScenarioContext.Provider>
  );
}

export function useDemoScenarios(): DemoScenarioContextValue {
  const ctx = useContext(DemoScenarioContext);
  if (!ctx) {
    throw new Error(
      'useDemoScenarios must be used within a DemoScenarioProvider'
    );
  }
  return ctx;
}
