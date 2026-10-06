import assert from "node:assert/strict";
import test from "node:test";
import { spawn, execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { checkRateLimit } from "../../lib/security/rate-limit.js";

// Optional integration qualification; no runtime/package dependency is added.
// REDIS_TEST_BIN_DIR must contain redis-server and redis-cli (Redis 7+).
test("real Redis: concurrent quota, TTL expiry, orphan repair and environment isolation", {
  skip: !process.env.REDIS_TEST_BIN_DIR, timeout: 15_000
}, async (t) => {
  const previous = { ...process.env }, originalFetch = globalThis.fetch;
  const dir = await mkdtemp(join(tmpdir(), "rate-limit-"));
  const socket = join(dir, "redis.sock");
  const server = spawn(join(process.env.REDIS_TEST_BIN_DIR, "redis-server"), [
    "--port", "0", "--unixsocket", socket, "--save", "", "--appendonly", "no"
  ], { stdio: "ignore" });
  const run = promisify(execFile);
  const cli = async (...args) => JSON.parse((await run(join(previous.REDIS_TEST_BIN_DIR, "redis-cli"), ["-s", socket, "--json", ...args])).stdout);
  t.after(async () => {
    globalThis.fetch = originalFetch; process.env = previous;
    if (server.exitCode === null) {
      const exited = new Promise(resolve => server.once("exit", resolve));
      server.kill(); await exited;
    }
    await rm(dir, { recursive: true, force: true });
  });
  let ready = false;
  for (let i = 0; i < 100; i++) {
    try { ready = await cli("PING") === "PONG"; if (ready) break; } catch {}
    await delay(20);
  }
  assert.ok(ready, "isolated Redis started");
  process.env.VERCEL_ENV = "production";
  process.env.RATE_LIMIT_REDIS_URL = "https://fixture.redis.test";
  process.env.RATE_LIMIT_REDIS_TOKEN = "fixture-token";
  let lastKey;
  // Real Lua/counter semantics through a local Redis; REST envelope is simulated.
  globalThis.fetch = async (_url, init) => {
    const command = JSON.parse(init.body); lastKey = command[3];
    return Response.json({ result: await cli(...command) });
  };
  const request = new Request("https://app.example/api/test");
  const options = { key: "concurrency", limit: 7, windowMs: 5000 };
  const responses = await Promise.all(Array.from({ length: 40 }, () => checkRateLimit(request, options)));
  assert.equal(responses.filter(r => r === null).length, 7);
  assert.equal(responses.filter(r => r?.status === 429).length, 33);
  const productionKey = lastKey;
  assert.equal(Number(await cli("GET", productionKey)), 40);
  const ttl = await cli("PTTL", productionKey);
  assert.ok(ttl > 0 && ttl <= 5000);
  await cli("PEXPIRE", productionKey, "1000");
  assert.equal((await checkRateLimit(request, options)).status, 429);
  assert.ok(await cli("PTTL", productionKey) <= 1000, "denial does not extend expiration");
  await cli("PERSIST", productionKey);
  assert.equal(await cli("PTTL", productionKey), -1);
  assert.equal((await checkRateLimit(request, options)).status, 429);
  assert.ok(await cli("PTTL", productionKey) > 0, "missing expiration repaired atomically");
  await cli("PEXPIRE", productionKey, "1");
  await delay(10);
  assert.equal(await checkRateLimit(request, options), null, "expired quota starts anew");
  assert.equal(Number(await cli("GET", productionKey)), 1);
  process.env.VERCEL_ENV = "preview";
  process.env.RATE_LIMIT_PROVIDER = "redis";
  assert.equal(await checkRateLimit(request, options), null);
  assert.notEqual(lastKey, productionKey);
  assert.equal(Number(await cli("GET", productionKey)), 1);
});
