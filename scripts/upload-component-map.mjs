#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { findManifestFile, uploadComponentMap } from '@askdepth/react/upload-map';

function resolveGitSha() {
  if (process.env.ASKDEPTH_COMMIT_SHA) return process.env.ASKDEPTH_COMMIT_SHA;
  if (process.env.COMMIT_SHA && /^[a-f0-9]{40}$/i.test(process.env.COMMIT_SHA)) {
    return process.env.COMMIT_SHA;
  }
  try {
    const sha = execSync('git rev-parse HEAD', {
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim();
    return /^[a-f0-9]{40}$/i.test(sha)
      ? sha
      : '0000000000000000000000000000000000000000';
  } catch {
    return '0000000000000000000000000000000000000000';
  }
}

async function main() {
  const mapDir = resolve(process.cwd(), '.askdepth/component-maps');
  if (!existsSync(mapDir)) {
    console.log(
      '[AskDepth] No .askdepth/component-maps directory found; skipping upload.'
    );
    return;
  }

  const commitSha = resolveGitSha();
  const buildId =
    process.env.NEXT_PUBLIC_ASKDEPTH_BUILD_ID ||
    process.env.ASKDEPTH_BUILD_ID ||
    commitSha.slice(0, 12);

  // Consolidate Turbopack/SWC chunk maps into `<buildId>.manifest.json` locally
  const manifestPath = findManifestFile(mapDir, buildId);
  if (manifestPath) {
    console.log(`[AskDepth] Component map manifest ready: ${manifestPath}`);
  }

  const deployToken = (
    process.env.ASKDEPTH_DEPLOY_TOKEN ||
    process.env.ASKDEPTH_API_KEY ||
    ''
  ).trim();

  if (!deployToken) {
    console.log(
      '[AskDepth] Set ASKDEPTH_DEPLOY_TOKEN (ad_dep_...) to auto-upload component maps to AskDepth Ingest.'
    );
    return;
  }

  const rawEndpoint =
    process.env.ASKDEPTH_INGEST_URL ||
    process.env.NEXT_PUBLIC_ASKDEPTH_ENDPOINT ||
    'https://in.askdepth.com';
  const ingestBaseUrl = rawEndpoint.replace(/\/v1\/telemetry\/?$/, '');
  const repository = process.env.ASKDEPTH_REPOSITORY || 'askdepth/demo-shop';

  const result = await uploadComponentMap({
    endpoint: ingestBaseUrl,
    deployToken,
    buildId,
    repository,
    commitSha,
    dir: mapDir,
  });

  if (result.success) {
    console.log(`[AskDepth] ${result.message}`);
  } else {
    console.warn(`[AskDepth] Component map upload skipped/failed: ${result.message}`);
  }
}

main().catch(err => {
  console.warn(
    '[AskDepth] Warning: component map upload did not complete:',
    err instanceof Error ? err.message : String(err)
  );
});
