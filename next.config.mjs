import { execSync } from 'node:child_process';
import { withAskdepth } from '@askdepth/react/plugin';

function resolveGitSha() {
  if (process.env.ASKDEPTH_COMMIT_SHA) return process.env.ASKDEPTH_COMMIT_SHA;
  if (process.env.COMMIT_SHA) return process.env.COMMIT_SHA;
  try {
    return execSync('git rev-parse HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return undefined;
  }
}

const commitSha = resolveGitSha();
const buildId =
  process.env.NEXT_PUBLIC_ASKDEPTH_BUILD_ID ||
  process.env.ASKDEPTH_BUILD_ID ||
  (commitSha ? commitSha.slice(0, 12) : 'demo-shop-v1');
const repository = process.env.ASKDEPTH_REPOSITORY || 'askdepth/demo-shop';

/** @type {import('next').NextConfig} */
const baseConfig = {
  output: 'standalone',
  serverExternalPackages: ['@prisma/client', 'bcrypt', 'pg'],
  transpilePackages: [
    '@askdepth/react',
    '@askdepth/core',
    '@askdepth/replay',
    '@askdepth/contracts',
    '@askdepth/audience-connector',
    '@askdepth/audience-contract',
  ],
  env: {
    NEXT_PUBLIC_ASKDEPTH_BUILD_ID: buildId,
  },
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'plus.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/sitemap.xml',
        destination: '/sitemap',
      },
      {
        source: '/robots.txt',
        destination: '/robots',
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate',
          },
        ],
      },
    ];
  },
};

const wrapped = withAskdepth(baseConfig, {
  buildId,
  repository,
  ...(commitSha && /^[a-f0-9]{40}$/i.test(commitSha) ? { commitSha } : {}),
});

// Next.js 16 uses top-level `turbopack.rules` instead of `experimental.turbo.rules`.
// In Next 16 Turbopack, `as: "*.tsx"` on files that already end in .tsx causes Next to append .tsx twice (.tsx.tsx),
// so strip `as` for *.tsx/*.jsx rules.
const rawTurboRules = wrapped.experimental?.turbo?.rules;
if (wrapped.experimental && 'turbo' in wrapped.experimental) {
  delete wrapped.experimental.turbo;
  if (Object.keys(wrapped.experimental).length === 0) {
    delete wrapped.experimental;
  }
}

const cleanedRules = {};
if (rawTurboRules) {
  for (const [pattern, rule] of Object.entries(rawTurboRules)) {
    if (rule && typeof rule === 'object') {
      const { as: _as, ...rest } = rule;
      cleanedRules[pattern] = rest;
    }
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...wrapped,
  turbopack: {
    rules: cleanedRules,
  },
};

export default nextConfig;
