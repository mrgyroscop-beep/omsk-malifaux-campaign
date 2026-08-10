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

function detailRequest(slug = "ceddra-sightless-snow") {
  return new Request(`https://worker.example/api/biggerhat/v1/characters/${slug}`, {
    headers: { Origin: ORIGIN },
  });
}

function firestoreString(value) {
  return { stringValue: value };
}

function playWyrdFixture() {
  return {
    fields: {
      models: {
        mapValue: {
          fields: {
            Ceddra_SightlessSnow: {
              mapValue: {
                fields: {
                  id: firestoreString("Ceddra_SightlessSnow"),
                  name: firestoreString("Ceddra"),
                  title: firestoreString("Sightless Snow"),
                  text: firestoreString(
                    'Breath of Frost q6" 7 Sp - 2 Deal damage. f Call of the Wild 6" 0 - 7 - Move the target. f Swallow You Whole 6" 0r - 3 Friendly only. s Soulstone Pulse 6" 0 - 5 - Heal.',
                  ),
                },
              },
            },
          },
        },
      },
    },
  };
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

test("enriches Arcanist action markers from the Play Wyrd snapshot", async (context) => {
  const originalFetch = globalThis.fetch;
  context.after(() => {
    globalThis.fetch = originalFetch;
  });
  const calls = [];
  globalThis.fetch = async (url) => {
    calls.push(String(url));
    if (String(url).includes("firestore.googleapis.com")) {
      return Response.json(playWyrdFixture());
    }
    return Response.json({
      data: {
        slug: "ceddra-sightless-snow",
        name: "Ceddra",
        title: "Sightless Snow",
        faction: "arcanists",
        actions: [
          { name: "Breath of Frost", is_signature: false, stone_cost: 0 },
          { name: "Call of the Wild", is_signature: false, stone_cost: 0 },
          { name: "Swallow You Whole", is_signature: false, stone_cost: 0 },
          { name: "Soulstone Pulse", is_signature: false, stone_cost: 0 },
        ],
      },
    });
  };

  const cache = new FakeKv();
  const first = await worker.fetch(detailRequest(), environment(cache));
  const firstData = (await first.json()).data;
  assert.equal(first.status, 200);
  assert.equal(firstData.actions[0].is_signature, false);
  assert.equal(firstData.actions[1].is_signature, true);
  assert.equal(firstData.actions[1].marker_source, "playwyrd");
  assert.equal(firstData.actions[2].is_signature, true);
  assert.equal(firstData.actions[3].stone_cost, 1);
  assert.equal(firstData.marker_metadata.modelId, "Ceddra_SightlessSnow");

  const second = await worker.fetch(detailRequest(), environment(cache));
  assert.equal(second.headers.get("X-BiggerHat-Cache"), "HIT");
  assert.equal(calls.filter((url) => url.includes("firestore.googleapis.com")).length, 1);
  assert.equal(calls.filter((url) => url.includes("biggerhat.net")).length, 1);
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
