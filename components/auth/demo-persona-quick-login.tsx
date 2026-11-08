'use client';

import { useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Sparkles, UserCheck, ArrowRight } from 'lucide-react';
import { HERO_PERSONAS } from '@/lib/demo-personas';

interface ResolvedPersonaItem {
  id: string;
  aliasKey: string;
  email: string;
  name: string;
  passwordPlain: string;
  badgeLabel: string;
  storyHint: string;
  recommendedPath: string;
}

export function DemoPersonaQuickLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [personas, setPersonas] = useState<ResolvedPersonaItem[]>(() =>
    HERO_PERSONAS.map(p => ({
      id: p.id,
      aliasKey: p.aliasKey,
      email: p.defaultEmail,
      name: p.name,
      passwordPlain: p.passwordPlain,
      badgeLabel: p.badgeLabel,
      storyHint: p.storyHint,
      recommendedPath: p.recommendedPath,
    }))
  );
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [quickError, setQuickError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/demo/status')
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (active && Array.isArray(data?.personas)) {
          setPersonas(data.personas);
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const handleQuickLogin = async (persona: ResolvedPersonaItem) => {
    setLoadingId(persona.id);
    setQuickError(null);
    try {
      const callbackUrl =
        searchParams.get('callbackUrl') || persona.recommendedPath || '/';
      const res = await signIn('credentials', {
        email: persona.email,
        password: persona.passwordPlain,
        redirect: false,
      });
      if (res?.error) {
        setQuickError(
          `Could not sign in as ${persona.name}. Run "npm run db:seed" first.`
        );
        return;
      }
      router.push(callbackUrl);
      router.refresh();
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div
      data-askdepth-block=""
      className="mt-6 rounded-xl border border-slate-200 bg-slate-50/80 p-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-700">
          <Sparkles className="h-3.5 w-3.5 text-indigo-600" aria-hidden="true" />
          1-Click Demo Shopper Personas
        </div>
        <span className="text-[11px] text-muted-foreground">
          Identity Bridge + Audience
        </span>
      </div>

      <p className="mt-1 text-xs text-muted-foreground">
        Sign in instantly as a seeded customer cohort persona to link browser
        sessions (<code className="font-mono">Askdepth.identify</code>) with
        Audience Connector records.
      </p>

      {quickError && (
        <p className="mt-2 rounded-md bg-rose-50 px-2.5 py-1.5 text-xs text-rose-700">
          {quickError}
        </p>
      )}

      <div className="mt-3 space-y-2">
        {personas.map(persona => (
          <button
            key={persona.id}
            type="button"
            disabled={loadingId !== null}
            onClick={() => handleQuickLogin(persona)}
            className="group flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-left text-xs transition hover:border-indigo-400 hover:shadow-sm disabled:opacity-60"
          >
            <div className="min-w-0 pr-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <UserCheck
                  className="h-3.5 w-3.5 text-indigo-600"
                  aria-hidden="true"
                />
                <span className="font-semibold text-slate-900">
                  {persona.name}
                </span>
                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-700">
                  {persona.badgeLabel}
                </span>
              </div>
              <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                {persona.storyHint}
              </p>
            </div>
            <span className="flex shrink-0 items-center gap-1 font-medium text-indigo-600 group-hover:translate-x-0.5 transition">
              {loadingId === persona.id ? 'Signing in...' : 'Sign in'}
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
