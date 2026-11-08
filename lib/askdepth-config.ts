export type AskdepthEnvName = 'production' | 'staging' | 'development';

export interface AskdepthRuntimeOverride {
  writeKey?: string;
  endpoint?: string;
  environment?: AskdepthEnvName;
}

export const ASKDEPTH_RUNTIME_OVERRIDE_KEY = 'askdepth_demo_runtime_sdk_v1';

export function normalizeTelemetryEndpoint(raw?: string | null): string {
  const trimmed = (raw ?? '').trim();
  if (!trimmed) {
    return 'https://in.askdepth.com/v1/telemetry';
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.pathname === '/' || parsed.pathname === '') {
      parsed.pathname = '/v1/telemetry';
    }
    return parsed.toString();
  } catch {
    if (trimmed.endsWith('/v1/telemetry')) return trimmed;
    return `${trimmed.replace(/\/+$/, '')}/v1/telemetry`;
  }
}

export function normalizeEnvironment(raw?: string | null): AskdepthEnvName {
  if (raw === 'development' || raw === 'staging' || raw === 'production') {
    return raw;
  }
  return process.env.NODE_ENV === 'development' ? 'development' : 'production';
}

export function readRuntimeSdkOverride(): AskdepthRuntimeOverride | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(ASKDEPTH_RUNTIME_OVERRIDE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AskdepthRuntimeOverride;
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeRuntimeSdkOverride(
  override: AskdepthRuntimeOverride | null
): void {
  if (typeof window === 'undefined') return;
  try {
    if (!override || (!override.writeKey && !override.endpoint)) {
      window.localStorage.removeItem(ASKDEPTH_RUNTIME_OVERRIDE_KEY);
    } else {
      window.localStorage.setItem(
        ASKDEPTH_RUNTIME_OVERRIDE_KEY,
        JSON.stringify(override)
      );
    }
    window.dispatchEvent(new Event('askdepth-sdk-override-changed'));
  } catch {
    // ignore storage quota errors
  }
}
