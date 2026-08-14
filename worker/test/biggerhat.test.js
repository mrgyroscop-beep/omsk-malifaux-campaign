import assert from "node:assert/strict";
import test from "node:test";

import worker from "../src/index.js";
import { enrichCharacterMarkers } from "../src/playwyrd-markers.js";

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

function crewUpgradeRequest(query = "page=1&per_page=100&game_mode_type=standard&domain=crew") {
  return new Request(`https://worker.example/api/biggerhat/v1/upgrades?${query}`, {
    headers: { Origin: ORIGIN },
  });
}

function crewUpgradeDetailRequest(slug = "grave-peril") {
  return new Request(`https://worker.example/api/biggerhat/v1/upgrades/${slug}`, {
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

function playWyrdModelsFixture(models) {
  return {
    fields: {
      models: {
        mapValue: {
          fields: Object.fromEntries(
            models.map((model) => [
              model.id,
              {
                mapValue: {
                  fields: {
                    id: firestoreString(model.id),
                    name: firestoreString(model.name),
                    title: firestoreString(model.title || ""),
                    text: firestoreString('f Marked Action 6" 0 - 7 - Test.'),
                  },
                },
              },
            ]),
          ),
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

test("proxies and caches only Crew Card upgrade catalog requests", async (context) => {
  const originalFetch = globalThis.fetch;
  context.after(() => {
    globalThis.fetch = originalFetch;
  });
  const calls = [];
  globalThis.fetch = async (url) => {
    calls.push(String(url));
    return Response.json({ data: [{ slug: "grave-peril", domain: "crew" }], meta: { last_page: 1 } });
  };

  const cache = new FakeKv();
  const list = await worker.fetch(crewUpgradeRequest(), environment(cache));
  assert.equal(list.status, 200);
  assert.match(calls[0], /api\/v1\/upgrades\?/u);
  assert.match(calls[0], /domain=crew/u);
  const cached = await worker.fetch(crewUpgradeRequest(), environment(cache));
  assert.equal(cached.headers.get("X-BiggerHat-Cache"), "HIT");

  const detail = await worker.fetch(crewUpgradeDetailRequest(), environment(cache));
  assert.equal(detail.status, 200);
  assert.match(calls[1], /api\/v1\/upgrades\/grave-peril$/u);

  const invalid = await worker.fetch(
    crewUpgradeRequest("page=1&per_page=100&game_mode_type=standard&domain=character"),
    environment(cache),
  );
  assert.equal(invalid.status, 404);
  assert.equal(calls.length, 2);
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

test("loads and matches Play Wyrd snapshots for every faction", async (context) => {
  const originalFetch = globalThis.fetch;
  context.after(() => {
    globalThis.fetch = originalFetch;
  });

  const cases = [
    {
      faction: "arcanists",
      document: "Arcanists",
      slug: "the-firestarter",
      name: "The Firestarter",
      model: { id: "Firestarter", name: "Firestarter" },
    },
    {
      faction: "bayou",
      document: "Bayou",
      slug: "the-brewmaster-proof-prophet",
      name: "The Brewmaster",
      title: "Proof-Prophet",
      model: { id: "Brewmaster_ProofProphet", name: "Brewmaster", title: "Proof Prophet" },
    },
    {
      faction: "explorers_society",
      document: "Explorer's Society",
      slug: "evan-havard",
      name: "Evan Havard",
      model: { id: "EvanHavard", name: "Evan Havard" },
    },
    {
      faction: "guild",
      document: "Guild",
      slug: "lady-justice",
      name: "Lady Justice",
      model: { id: "LadyJustice", name: "Lady Justice" },
    },
    {
      faction: "neverborn",
      document: "Neverborn",
      slug: "doppleganger",
      name: "Doppleganger",
      model: { id: "Doppelganger", name: "Doppelganger" },
    },
    {
      faction: "outcasts",
      document: "Outcasts",
      slug: "hamelin",
      name: "Hamelin",
      model: { id: "Hamelin", name: "Hamelin" },
    },
    {
      faction: "resurrectionists",
      document: "Resurrectionist",
      slug: "chiaki-the-beacon",
      name: "Chiaki",
      title: "The Beacon",
      model: { id: "ChiakitheBeacon", name: "Chiaki the Beacon" },
    },
    {
      faction: "ten_thunders",
      document: "Ten Thunders",
      slug: "misaki-katanaka",
      name: "Misaki Katanaka",
      model: { id: "MisakiKatanaka", name: "Misaki Katanaka" },
    },
  ];
  const resurrectionistAlias = {
    faction: "resurrectionists",
    document: "Resurrectionist",
    slug: "keepside-stangers",
    name: "Keepside Stangers",
    model: { id: "KeepsideStrangers", name: "Keepside Strangers" },
  };
  const modelsByDocument = Object.fromEntries(
    cases.map((item) => [item.document, [item.model]]),
  );
  modelsByDocument.Resurrectionist.push(resurrectionistAlias.model);

  const requestedDocuments = [];
  globalThis.fetch = async (url) => {
    const document = decodeURIComponent(new URL(String(url)).pathname.split("/").at(-1));
    requestedDocuments.push(document);
    return Response.json(playWyrdModelsFixture(modelsByDocument[document] || []));
  };

  const cache = new FakeKv();
  for (const item of [...cases, resurrectionistAlias]) {
    const enriched = await enrichCharacterMarkers(
      {
        faction: item.faction,
        slug: item.slug,
        name: item.name,
        title: item.title || null,
        actions: [{ name: "Marked Action", is_signature: false, stone_cost: 0 }],
      },
      environment(cache),
    );
    assert.equal(enriched.actions[0].is_signature, true, item.faction);
    assert.equal(enriched.marker_metadata.modelId, item.model.id, item.slug);
  }

  assert.deepEqual(new Set(requestedDocuments), new Set(cases.map((item) => item.document)));
  assert.equal(requestedDocuments.length, 8);
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
