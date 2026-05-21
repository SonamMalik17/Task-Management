#!/usr/bin/env node
// Orchestrator: boots an in-memory Mongo (no Docker needed), starts the API
// pointed at it, starts the web, waits for both to be healthy, runs Playwright,
// then tears everything down.
//
// Designed to be safe to re-run — kills its own children even on crash.

import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import { join } from 'node:path';
import { MongoMemoryServer } from 'mongodb-memory-server';

const ROOT = new URL('../../..', import.meta.url).pathname;
const API_DIR = join(ROOT, 'apps/api');
const WEB_DIR = join(ROOT, 'apps/web');
const E2E_DIR = join(ROOT, 'apps/e2e');
const API_PORT = 4101;
const WEB_PORT = 3101;
const CHILDREN = [];

let memoryMongo;

function spawnTracked(name, cmd, args, env, cwd = ROOT) {
  console.log(`[e2e] starting ${name}: ${cmd} ${args.join(' ')} (cwd: ${cwd})`);
  const child = spawn(cmd, args, {
    cwd,
    env: { ...process.env, ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout.on('data', (d) => process.stdout.write(`[${name}] ${d}`));
  child.stderr.on('data', (d) => process.stderr.write(`[${name}] ${d}`));
  child.on('exit', (code) => console.log(`[e2e] ${name} exited with ${code}`));
  CHILDREN.push({ name, child });
  return child;
}

async function waitForHttp(url, label, timeoutMs = 60_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(2000) });
      if (res.ok) {
        console.log(`[e2e] ${label} is up (${url})`);
        return;
      }
    } catch {
      /* not ready yet */
    }
    await sleep(500);
  }
  throw new Error(`Timeout waiting for ${label} at ${url}`);
}

async function shutdown(code = 0) {
  console.log('[e2e] shutting down');
  for (const { name, child } of CHILDREN) {
    try {
      child.kill('SIGTERM');
      console.log(`[e2e] killed ${name}`);
    } catch (err) {
      console.warn(`[e2e] failed to kill ${name}`, err);
    }
  }
  if (memoryMongo) {
    try {
      await memoryMongo.stop();
      console.log('[e2e] stopped memory mongo');
    } catch (err) {
      console.warn('[e2e] failed to stop memory mongo', err);
    }
  }
  process.exit(code);
}

process.on('SIGINT', () => shutdown(130));
process.on('SIGTERM', () => shutdown(143));

try {
  // 1. Boot Mongo
  console.log('[e2e] booting in-memory Mongo...');
  memoryMongo = await MongoMemoryServer.create();
  const MONGO_URI = memoryMongo.getUri();
  console.log(`[e2e] mongo uri ${MONGO_URI.replace(/\/\/.*@/, '//***@')}`);

  // 2. Build the shared package (api + web import its source via tsconfig
  //    paths; tsx and Next handle it, so no precompile needed). Build
  //    skipped — shared has no runtime artifacts.

  // 3. Start the API
  const apiEnv = {
    // NODE_ENV=test disables rate limiters via env.ts in middleware/rateLimit.ts.
    NODE_ENV: 'test',
    API_PORT: String(API_PORT),
    MONGO_URI,
    JWT_ACCESS_SECRET: 'e2e-access-secret-at-least-16-chars-long',
    JWT_REFRESH_SECRET: 'e2e-refresh-secret-at-least-16-chars-long',
    JWT_ACCESS_TTL: '15m',
    JWT_REFRESH_TTL: '7d',
    CORS_ORIGIN: `http://localhost:${WEB_PORT}`,
    ANTHROPIC_API_KEY: '', // mock provider for deterministic tests
    ANTHROPIC_MODEL: 'claude-opus-4-7',
  };
  spawnTracked('api', 'npx', ['tsx', 'src/index.ts'], apiEnv, API_DIR);

  // 4. Start the web (from apps/web so Next picks up its own config)
  const webEnv = {
    NODE_ENV: 'development',
    NEXT_PUBLIC_API_URL: `http://localhost:${API_PORT}`,
    NEXT_PUBLIC_SOCKET_URL: `http://localhost:${API_PORT}`,
  };
  spawnTracked('web', 'npx', ['next', 'dev', '-p', String(WEB_PORT)], webEnv, WEB_DIR);

  // 5. Wait for both
  await waitForHttp(`http://localhost:${API_PORT}/health`, 'api');
  await waitForHttp(`http://localhost:${WEB_PORT}`, 'web', 120_000);

  // 6. Run Playwright
  await new Promise((resolve, reject) => {
    const pw = spawn('npx', ['playwright', 'test', ...process.argv.slice(2)], {
      cwd: E2E_DIR,
      env: {
        ...process.env,
        API_URL: `http://localhost:${API_PORT}`,
        WEB_URL: `http://localhost:${WEB_PORT}`,
      },
      stdio: 'inherit',
    });
    pw.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`playwright exit ${code}`))));
  });

  await shutdown(0);
} catch (err) {
  console.error('[e2e] FAILED:', err);
  await shutdown(1);
}
