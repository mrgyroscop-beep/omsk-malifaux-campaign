import assert from "node:assert/strict";
import test from "node:test";

import worker from "../src/index.js";

const ORIGIN = "https://mrgyroscop-beep.github.io";

class FakeKv {
  constructor() {
    this.values = new Map();
  }

  async get(key, type) {
    const value = this.values.get(key) ?? null;
    return type === "json" && value ? JSON.parse(value) : value;
  }

  async put(key, value) {
    this.values.set(key, value);
  }
}

function environment(cache) {
  return {
    ALLOWED_ORIGINS: ORIGIN,
    BIGGERHAT_CACHE: cache,
  };
}

function catalogRequest(query = "page=1&per_page=100&game_mode_type=standard") {
  return new Request(
    `https://worker.example/api/biggerhat/v1/characters?${query}`,
    { headers: { Origin: ORIGIN } },
  );
}

test("caches BiggerHat list responses in KV", async (context) => {
  const originalFetch = globalThis.fetch;
  context.after(() => {
    globalThis.fetch = originalFetch;
  });
  let calls = 0;
  globalThis.fetch = async (url) => {
    calls += 1;
    assert.match(String(url), /biggerhat\.net\/api\/v1\/characters/u);
    return Response.json({ data: [{ slug: "colette" }], meta: { last_page: 1 } });
  };

  const cache = new FakeKv();
  const first = await worker.fetch(catalogRequest(), environment(cache));
  assert.equal(first.status, 200);
  assert.equal(first.headers.get("X-BiggerHat-Cache"), "MISS");

  const second = await worker.fetch(catalogRequest(), environment(cache));
  assert.equal(second.status, 200);
  assert.equal(second.headers.get("X-BiggerHat-Cache"), "HIT");
  assert.equal(calls, 1);
  assert.deepEqual(await second.json(), {
    data: [{ slug: "colette" }],
    meta: { last_page: 1 },
  });
});
test("rejects query variants that could bypass the cache", async (context) => {
  const originalFetch = globalThis.fetch;
  context.after(() => {
    globalThis.fetch = originalFetch;
  });
  let called = false;
  globalThis.fetch = async () => {
    called = true;
    return Response.json({});
  };

  const response = await worker.fetch(
    catalogRequest("page=999&per_page=25&game_mode_type=beta"),
    environment(new FakeKv()),
  );
  assert.equal(response.status, 404);
  assert.equal(called, false);
});

test("serves stale KV data when BiggerHat is unavailable", async (context) => {
  const originalFetch = globalThis.fetch;
  context.after(() => {
    globalThis.fetch = originalFetch;
  });
  globalThis.fetch = async () => {
    throw new Error("offline");
  };

  const cache = new FakeKv();
  cache.values.set(
    "biggerhat:v1:characters?game_mode_type=standard&page=1&per_page=100",
    JSON.stringify({
      fetchedAt: Date.now() - 8 * 60 * 60 * 1000,
      status: 200,
      body: JSON.stringify({ data: [{ slug: "cached" }], meta: { last_page: 1 } }),
    }),
  );
  const response = await worker.fetch(catalogRequest(), environment(cache));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("X-BiggerHat-Cache"), "STALE");
  assert.equal((await response.json()).data[0].slug, "cached");
});
